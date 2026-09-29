import assert from "node:assert";
import http from "node:http";
import { once } from "node:events";
import test from "node:test";
import { createHash } from "node:crypto";

process.env.NODE_ENV = "test";

import { defaultConfig } from "acp-kernel";
import { startServer, type ProxyOptions } from "../src/server.ts";
import { _resetSharedMcpLaneForTest } from "../src/plugin.ts";

// #1611: the conversation-id VALUE used to ride the STATIC system part
// (withConversationIdNote), so any fork/resume/session-switch — byte-identical
// history, new session id — produced a diverging system and the upstream
// prefix cache missed from byte 0. The id now rides an EPHEMERAL trailing
// user message (same pattern as nudge/imgNote): system + history stay
// byte-identical across sessions sharing history, only the tail note differs.

function listen(server: http.Server): Promise<void> {
    if (server.listening) return Promise.resolve();
    return once(server, "listening").then(() => undefined);
}

function close(server: http.Server): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    server.close((error) => (error ? reject(error) : resolve()));
    return promise;
}

function anthropicSse(event: string, data: unknown): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function textScript(): string {
    return anthropicSse("message_start", { type: "message_start", message: { id: "m1", role: "assistant", usage: { input_tokens: 42 } } }) +
        anthropicSse("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }) +
        anthropicSse("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "ok" } }) +
        anthropicSse("content_block_stop", { type: "content_block_stop", index: 0 }) +
        anthropicSse("message_delta", { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 2 } }) +
        anthropicSse("message_stop", { type: "message_stop" });
}

interface Rig {
    proxyUrl: (path: string) => string;
    modelUrl: () => string;
    upstreamBodies: string[];
    closeAll(): Promise<void>;
}

async function startRig(): Promise<Rig> {
    // The shared-lane flag is process-global module state — reset it so each
    // rig starts from the DEFAULT (absent) state deterministically (#1614).
    _resetSharedMcpLaneForTest();
    const upstreamBodies: string[] = [];
    const upstream = http.createServer((req, res) => {
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", () => {
            const body = Buffer.concat(chunks).toString("utf8");
            if (req.url === "/v1/messages") {
                upstreamBodies.push(body);
                res.writeHead(200, { "content-type": "text/event-stream" });
                res.end(textScript());
            } else {
                res.writeHead(404);
                res.end("{}");
            }
        });
    });
    upstream.listen(0, "127.0.0.1");
    await listen(upstream);
    const upstreamPort = (upstream.address() as { port: number }).port;

    const opts: ProxyOptions = {
        port: 0,
        host: "127.0.0.1",
        upstream: "http://127.0.0.1",
        routes: { [`http://127.0.0.1:${upstreamPort}`]: { models: { "l1611-model": { context: 100_000 } } } },
        modelContextLimit: 100_000,
        kernelConfig: defaultConfig(100_000),
        compress: { injectTool: true, injectNudge: true },
        promptCache: { routing: "auto" },
        log: false,
        sessionHeader: "x-acp-session",
        debug: false,
        passthrough: false,
        autoUpdate: false,
        mitm: { enabled: false, domains: [] },
    };
    const proxy = await startServer(opts);
    await listen(proxy);
    const proxyPort = (proxy.address() as { port: number }).port;
    return {
        proxyUrl: (path) => `http://127.0.0.1:${proxyPort}${path}`,
        modelUrl: () => `http://127.0.0.1:${proxyPort}/bili/http://127.0.0.1:${upstreamPort}/v1/messages`,
        upstreamBodies,
        closeAll: async () => {
            await close(proxy);
            await close(upstream);
        },
    };
}

interface PostMsg { role: string; content: string }

async function postModel(rig: Rig, conversationId: string, messages: PostMsg[], headerName = "x-session-affinity"): Promise<Response> {
    return fetch(rig.modelUrl(), {
        method: "POST",
        headers: { "content-type": "application/json", [headerName]: conversationId },
        body: JSON.stringify({ model: "l1611-model", max_tokens: 8192, stream: true, messages }),
    });
}

async function waitFor(cond: () => boolean, what: string): Promise<void> {
    const t0 = Date.now();
    while (!cond()) {
        if (Date.now() - t0 > 5000) throw new Error(`timeout waiting for ${what}`);
        await new Promise((r) => setTimeout(r, 25));
    }
}

function sysText(body: string): string {
    const parsed = JSON.parse(body) as { system?: string | { text?: string }[] };
    if (typeof parsed.system === "string") return parsed.system;
    if (Array.isArray(parsed.system)) return parsed.system.map((s) => s.text ?? "").join("\n");
    return "";
}

function idNoteText(body: string): string {
    const parsed = JSON.parse(body) as { messages?: { role?: string; content?: unknown }[] };
    for (let i = (parsed.messages ?? []).length - 1; i >= 0; i--) {
        const m = parsed.messages![i];
        const c = typeof m.content === "string"
            ? m.content
            : Array.isArray(m.content)
                ? m.content.map((b) => (typeof b === "string" ? b : (b as { text?: string }).text ?? "")).join("")
                : "";
        if (c.includes("[Your bili conversation id: ")) return c;
    }
    return "";
}

function historyJson(body: string): string {
    const parsed = JSON.parse(body) as { messages?: { role?: string; content?: unknown }[] };
    const hist = (parsed.messages ?? []).filter((m) => {
        const c = m.content;
        const text = typeof c === "string" ? c
            : Array.isArray(c) ? c.map((b) => (typeof b === "string" ? b : (b as { text?: string }).text ?? "")).join("") : "";
        return !text.startsWith("[Your bili conversation id:");
    });
    return JSON.stringify(hist);
}

function canonicalOf(sessionId: string): string {
    return `pfa-${createHash("sha256").update(`legacy:${sessionId}`).digest("hex").slice(0, 16)}`;
}

const SHARED_HISTORY: PostMsg[] = [
    { role: "user", content: "hello one" },
    { role: "assistant", content: "ack one" },
    { role: "user", content: "hello two" },
    { role: "assistant", content: "ack two" },
    { role: "user", content: "hello three" },
];

test("#1611: byte-identical shared history under two session ids yields byte-identical system + history prefix; only the ephemeral id note differs", async () => {
    const rig = await startRig();
    try {
        // #1614: default state — no shared shim announced — carries NO note and
        // NO pointer at all (wire hosts route by request identity).
        await postModel(rig, "sess-fork-x", SHARED_HISTORY);
        await waitFor(() => rig.upstreamBodies.length >= 1, "pre-announce body");
        assert.equal(idNoteText(rig.upstreamBodies[0]), "", "#1614: no id note before the shared lane is announced");
        assert.ok(!sysText(rig.upstreamBodies[0]).includes("conversation id is printed at the very end"), "no pointer line either");

        const reg = await fetch(rig.proxyUrl("/__bili/plugin/register"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversationId: null, unbound: true, agent: "mcp" }) });
        assert.equal(reg.status, 200);

        await postModel(rig, "sess-fork-x", SHARED_HISTORY);
        await postModel(rig, "sess-fork-y", SHARED_HISTORY);
        await waitFor(() => rig.upstreamBodies.length >= 3, "three upstream bodies");

        const b1 = rig.upstreamBodies[1];
        const b2 = rig.upstreamBodies[2];
        assert.equal(sysText(b1), sysText(b2), "#1611: system bytes identical across different conversation ids (prefix-cache anchor)");
        assert.doesNotMatch(sysText(b1), /\[Your bili conversation id:/, "no id value in the static system part");
        assert.ok(sysText(b1).includes("conversation id is printed at the very end of this request"), "system keeps the byte-stable pointer note");
        assert.equal(historyJson(b1), historyJson(b2), "history messages byte-identical (excluding the ephemeral id note)");

        const canonX = canonicalOf("sess-fork-x");
        const canonY = canonicalOf("sess-fork-y");
        assert.match(idNoteText(b1), new RegExp(`\\[Your bili conversation id: ${canonX}\\.`), "request 1 tail carries X's id");
        assert.match(idNoteText(b2), new RegExp(`\\[Your bili conversation id: ${canonY}\\.`), "request 2 tail carries Y's id");
        assert.notEqual(idNoteText(b1), idNoteText(b2), "only the ephemeral tail differs between the sessions");
    } finally {
        await rig.closeAll();
    }
});

test("#1611: within one session the id note stays stable across turns and the history is append-only", async () => {
    const rig = await startRig();
    try {
        // #1614: the note rides only the shared-MCP lane — announce it first.
        await fetch(rig.proxyUrl("/__bili/plugin/register"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversationId: null, unbound: true, agent: "mcp" }) });
        await postModel(rig, "sess-stable", SHARED_HISTORY.slice(0, 3));
        await postModel(rig, "sess-stable", SHARED_HISTORY);
        await waitFor(() => rig.upstreamBodies.length >= 2, "two upstream bodies");

        const b1 = rig.upstreamBodies[0];
        const b2 = rig.upstreamBodies[1];
        const canon = canonicalOf("sess-stable");
        assert.match(idNoteText(b1), new RegExp(`\\[Your bili conversation id: ${canon}\\.`));
        assert.match(idNoteText(b2), new RegExp(`\\[Your bili conversation id: ${canon}\\.`));
        assert.equal(sysText(b1), sysText(b2), "system stable within session");
        const h1 = JSON.parse(historyJson(b1)) as unknown[];
        const h2 = JSON.parse(historyJson(b2)) as unknown[];
        assert.ok(h2.length > h1.length, "history grew");
        assert.deepEqual(h2.slice(0, h1.length), h1, "turn-1 history is a strict prefix of turn-2 (append-only)");
    } finally {
        await rig.closeAll();
    }
});
