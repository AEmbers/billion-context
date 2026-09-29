import assert from "node:assert";
import http from "node:http";
import { once } from "node:events";
import test from "node:test";
import { createHash } from "node:crypto";

process.env.NODE_ENV = "test";

import { defaultConfig } from "acp-kernel";
import { startServer, type ProxyOptions } from "../src/server.ts";
import { _resetSharedMcpLaneForTest } from "../src/plugin.ts";

// #1614 lane coverage: the conversation-id VALUE rides an ephemeral trailing
// user note on EVERY wire lane, not just anthropic. A lane whose append is
// dropped (refactor, copy-paste miss) leaves shared-MCP hosts on that wire
// unable to route tool calls — and today nothing would notice. This test pins
// the tail note (value) on all four lanes plus the byte-stable pointer in the
// static system part, under the announced shared-MCP lane.

function listen(server: http.Server): Promise<void> {
    if (server.listening) return Promise.resolve();
    return once(server, "listening").then(() => undefined);
}

function close(server: http.Server): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    server.close((error) => (error ? reject(error) : resolve()));
    return promise;
}

const POINTER_TEXT = "conversation id is printed at the very end of this request";

function anthropicSse(event: string, data: unknown): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function anthropicScript(): string {
    return anthropicSse("message_start", { type: "message_start", message: { id: "m1", role: "assistant", usage: { input_tokens: 4 } } }) +
        anthropicSse("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }) +
        anthropicSse("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "ok" } }) +
        anthropicSse("content_block_stop", { type: "content_block_stop" }) +
        anthropicSse("message_delta", { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 1 } }) +
        anthropicSse("message_stop", { type: "message_stop" });
}

interface Rig {
    proxyPort: number;
    upstreamPort: number;
    upstreamBodies: { path: string; body: string }[];
    closeAll(): Promise<void>;
}

async function startRig(): Promise<Rig> {
    _resetSharedMcpLaneForTest();
    const upstreamBodies: { path: string; body: string }[] = [];
    const upstream = http.createServer((req, res) => {
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", () => {
            const body = Buffer.concat(chunks).toString("utf8");
            upstreamBodies.push({ path: req.url ?? "", body });
            const json = (payload: unknown) => {
                res.writeHead(200, { "content-type": "application/json" });
                res.end(JSON.stringify(payload));
            };
            if (req.url === "/v1/messages") {
                res.writeHead(200, { "content-type": "text/event-stream" });
                res.end(anthropicScript());
            } else if (req.url === "/v1/chat/completions") {
                json({ id: "c1", object: "chat.completion", created: 1, model: "l1614", choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }], usage: { prompt_tokens: 4, completion_tokens: 1, total_tokens: 5 } });
            } else if (req.url === "/v1/responses") {
                json({ id: "r1", object: "response", created_at: 1, status: "completed", model: "l1614", output: [{ type: "message", id: "m1", status: "completed", role: "assistant", content: [{ type: "output_text", text: "ok" }] }], usage: { input_tokens: 4, output_tokens: 1, total_tokens: 5 } });
            } else if ((req.url ?? "").includes(":generateContent")) {
                json({ candidates: [{ content: { role: "model", parts: [{ text: "ok" }] }, finishReason: "STOP" }], usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 1, totalTokenCount: 5 } });
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
        upstream: `http://127.0.0.1:${upstreamPort}`,
        routes: { [`http://127.0.0.1:${upstreamPort}`]: { models: { l1614: { context: 100_000 } } } },
        modelContextLimit: 100_000,
        kernelConfig: defaultConfig(100_000),
        compress: { injectTool: true, injectNudge: false },
        promptCache: { routing: "auto" },
        log: false,
        sessionHeader: "x-acp-session",
        debug: false,
        passthrough: false,
        autoUpdate: false,
        mitm: { enabled: false, domains: [] },
    };
    const server = await startServer(opts);
    await listen(server);
    const proxyPort = (server.address() as { port: number }).port;

    return {
        proxyPort,
        upstreamPort,
        upstreamBodies,
        closeAll: async () => {
            await close(server);
            await close(upstream);
        },
    };
}

function canonicalOf(sessionId: string): string {
    return `pfa-${createHash("sha256").update(`legacy:${sessionId}`).digest("hex").slice(0, 16)}`;
}

async function waitFor(pred: () => boolean, what: string): Promise<void> {
    for (let i = 0; i < 200; i++) {
        if (pred()) return;
        await new Promise((r) => setTimeout(r, 25));
    }
    assert.ok(pred(), `timeout waiting for ${what}`);
}

/** Flatten every text a wire carries: tail note must appear in ONE of these. */
function allTexts(body: string): string[] {
    const parsed = JSON.parse(body) as Record<string, any>;
    const texts: string[] = [];
    const pushText = (v: unknown) => {
        if (typeof v === "string" && v.length > 0) texts.push(v);
    };
    const walk = (node: unknown) => {
        if (node == null) return;
        if (typeof node === "string") return pushText(node);
        if (Array.isArray(node)) return node.forEach(walk);
        if (typeof node === "object") return Object.values(node as Record<string, unknown>).forEach(walk);
    };
    for (const key of ["system", "system_instruction", "systemInstruction", "messages", "input", "contents"]) {
        walk((parsed as any)[key]);
    }
    return texts;
}

interface Lane {
    name: string;
    path: string;
    body: () => string;
}

const LANES: Lane[] = [
    { name: "anthropic", path: "/v1/messages", body: () => JSON.stringify({ model: "l1614", max_tokens: 8192, stream: true, messages: [{ role: "user", content: "hi anthropic" }] }) },
    { name: "openai-chat", path: "/v1/chat/completions", body: () => JSON.stringify({ model: "l1614", max_tokens: 8192, messages: [{ role: "user", content: "hi openai" }] }) },
    { name: "responses", path: "/v1/responses", body: () => JSON.stringify({ model: "l1614", max_output_tokens: 1024, input: [{ type: "message", role: "user", content: "hi responses" }] }) },
    { name: "google", path: "/v1beta/models/l1614:generateContent", body: () => JSON.stringify({ contents: [{ role: "user", parts: [{ text: "hi google" }] }] }) },
];

test("#1614: the conversation-id tail note (value) + byte-stable pointer ship on ALL four wire lanes under the shared-MCP topology", async () => {
    const rig = await startRig();
    try {
        const reg = await fetch(`http://127.0.0.1:${rig.proxyPort}/__bili/plugin/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversationId: null, unbound: true, agent: "mcp" }) });
        assert.equal(reg.status, 200);

        for (let i = 0; i < LANES.length; i++) {
            const lane = LANES[i];
            const sessionId = `sess-lane-${lane.name}`;
            const res = await fetch(`http://127.0.0.1:${rig.proxyPort}/bili/http://127.0.0.1:${rig.upstreamPort}${lane.path}`, {
                method: "POST",
                headers: { "content-type": "application/json", "x-session-affinity": sessionId, "x-api-key": "k", authorization: "Bearer k" },
                body: lane.body(),
            });
            assert.equal(res.status, 200, `${lane.name}: upstream replied 200`);
            await waitFor(() => rig.upstreamBodies.some((b) => b.path === lane.path), `${lane.name} forwarded`);
            const forwarded = rig.upstreamBodies.filter((b) => b.path === lane.path).at(-1)!.body;
            const canon = canonicalOf(sessionId);
            const texts = allTexts(forwarded);
            const idNote = texts.find((t) => t.startsWith("[Your bili conversation id:"));
            assert.ok(idNote, `${lane.name}: ephemeral tail note present in forwarded body`);
            assert.match(idNote, new RegExp(`\\[Your bili conversation id: ${canon}\\.`), `${lane.name}: tail note carries THIS session's canonical id`);
            const joined = texts.join("\n");
            assert.ok(joined.includes(POINTER_TEXT), `${lane.name}: byte-stable pointer present (system/developer part)`);
            assert.ok(!joined.replace(idNote, "").includes(`[Your bili conversation id: ${canon}`), `${lane.name}: id VALUE appears exactly once (tail only, never in the static part)`);
        }
    } finally {
        await rig.closeAll();
    }
});

test("#1614: with NO shared shim announced, no lane carries the id note or the pointer (bound/wire-only hosts stay note-free)", async () => {
    const rig = await startRig();
    try {
        for (const lane of LANES) {
            const res = await fetch(`http://127.0.0.1:${rig.proxyPort}/bili/http://127.0.0.1:${rig.upstreamPort}${lane.path}`, {
                method: "POST",
                headers: { "content-type": "application/json", "x-session-affinity": `sess-quiet-${lane.name}`, "x-api-key": "k", authorization: "Bearer k" },
                body: lane.body(),
            });
            assert.equal(res.status, 200, `${lane.name}: upstream replied 200`);
            await waitFor(() => rig.upstreamBodies.some((b) => b.path === lane.path), `${lane.name} forwarded`);
            const forwarded = rig.upstreamBodies.filter((b) => b.path === lane.path).at(-1)!.body;
            const joined = allTexts(forwarded).join("\n");
            assert.ok(!joined.includes("[Your bili conversation id:"), `${lane.name}: no id note without the shared lane`);
            assert.ok(!joined.includes(POINTER_TEXT), `${lane.name}: no pointer without the shared lane`);
        }
    } finally {
        await rig.closeAll();
    }
});
