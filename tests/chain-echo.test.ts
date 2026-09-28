import { test } from "node:test";
import assert from "node:assert/strict";
import type { Config, CoreMessage } from "acp-kernel";
import { createCore, createInitialState } from "acp-kernel";
import type { Session } from "../src/session.ts";
import { runCompressLoop, createResponsesAdapter } from "../src/loop/index.ts";
import { buildCompressSystemPrompt } from "../src/compress-tool.ts";
import {
    createChainEchoFilter,
    stripChainEchoTags,
    containsChainEchoText,
    mayStartChainEcho,
    stripChainEchoResponsesEvent,
    stripChainEchoOpenaiChatText,
    stripChainEchoAnthropicText,
    removeExactCarrierFromInput,
    scrubChainEchoHistory,
} from "../src/loop/chain-echo-filter.ts";
import { rewriteResponsesJsonResponse } from "../src/stream-responses.ts";
import { rewriteOpenaiJsonResponse } from "../src/stream-openai.ts";
import { rewriteGoogleJsonResponse } from "../src/stream-google.ts";
import { rewriteJsonResponse, type RewriteCtx } from "../src/stream.ts";

// #1565: bare chain carriers (<bili-chain …/>) must never reach model-visible
// output — streaming deltas, terminal lifecycle events, non-stream JSON, and
// inbound history. User prose that merely discusses the tag shape survives.
const L = "\x3c";
const R = "\x3e";
const DIGEST = "sha256:" + "ab".repeat(32);
const TAG = `${L}bili-chain digest="${DIGEST}"/${R}`;
const TAGP = `${L}bili-chain-processed digest="${DIGEST}"/${R}`;

test("drops well-formed carriers of both names, preserving surrounding bytes", () => {
    assert.equal(stripChainEchoTags(`x${TAG}y`), "xy");
    assert.equal(stripChainEchoTags(`x ${TAGP} y`), "x  y");
});

test("drops the three malformed variants observed in #1565", () => {
    const v1 = `${L}bili-chain-processed digest=" sha256:e0d4"${R}`;
    const v2 = `${L}bili-chain-processed digest="sha256:86b8b%"${R}`;
    const v3 = `${L}bili-chain digest= "sha256:7da92"${R}`;
    for (const v of [v1, v2, v3]) assert.equal(stripChainEchoTags(`a${v}b`), "ab");
});

test("keeps prose: bare mentions, bare <NAME>, longer words stay untouched", () => {
    assert.equal(stripChainEchoTags("use bili-chain for stamps"), "use bili-chain for stamps");
    assert.equal(stripChainEchoTags(`${L}bili-chain${R} alone`), `${L}bili-chain${R} alone`);
    assert.equal(stripChainEchoTags(`${L}/bili-chains${R} stray`), `${L}/bili-chains${R} stray`);
});

test("truncated definite opening at end of stream is dropped; ambiguous prefixes released", () => {
    assert.equal(stripChainEchoTags(`done${L}bili-chain digest="sha256:zz`), "done");
    assert.equal(stripChainEchoTags(`done${L}bili-ch`), `done${L}bili-ch`);
    assert.equal(stripChainEchoTags(`done${L}bili-chain`), `done${L}bili-chain`);
});

test("broken attrs (opening runs into the next <) are swallowed until close", () => {
    const s = `a${L}bili-chain digest="oops${L}span"b${R}c`;
    assert.equal(stripChainEchoTags(s), "ac");
});

test("byte-split deltas: every split point yields the same clean text", () => {
    const s = `hello ${TAGP} world and ${TAG} end`;
    const expected = "hello  world and  end";
    assert.equal(stripChainEchoTags(s), expected);
    for (let i = 0; i <= s.length; i++) {
        const f = createChainEchoFilter();
        const out = f.push(s.slice(0, i)) + f.push(s.slice(i)) + f.flush();
        assert.equal(out, expected, `split at ${i}`);
    }
    const p1 = s.indexOf(TAGP) + 5;
    const p2 = s.indexOf(TAG) + 10;
    const f = createChainEchoFilter();
    const out = f.push(s.slice(0, p1)) + f.push(s.slice(p1, p2)) + f.push(s.slice(p2)) + f.flush();
    assert.equal(out, expected, "triple split across tag interiors");
});

test("onDrop fires per span; dropCount accumulates", () => {
    const seen: string[] = [];
    const f = createChainEchoFilter((snip) => seen.push(snip));
    f.push(`a${TAG}b${TAGP}c`);
    f.flush();
    assert.equal(f.dropCount(), 2);
    assert.equal(seen.length, 2);
    assert.ok(seen[0].startsWith(L + "bili-chain"));
    assert.ok(seen[1].startsWith(L + "bili-chain"));
    assert.ok(f.dropped());
    assert.equal(f.stats().dropped, true);
});

test("containsChainEchoText / mayStartChainEcho probes", () => {
    assert.ok(containsChainEchoText(`x${L}bili-chain y`));
    assert.ok(containsChainEchoText("x\\u003cbili-chain y"));
    assert.ok(!containsChainEchoText("\x3cbillion-context\x3e"));
    assert.ok(!containsChainEchoText("bili-chain docs"));
    assert.ok(mayStartChainEcho(`abc${L}b`));
    assert.ok(mayStartChainEcho(TAG));
    assert.ok(!mayStartChainEcho("abc"));
    assert.ok(!mayStartChainEcho(`${L}billion`));
});

test("stripChainEchoResponsesEvent strips text fields, spares input and tool args", () => {
    const args = JSON.stringify({ q: TAG });
    const ev: Record<string, unknown> = {
        type: "response.output_text.done",
        text: `ok ${TAG}`,
        part: { type: "output_text", text: `${TAGP} hi` },
        item: { type: "message", content: [{ type: "output_text", text: `${TAG} there` }] },
        response: {
            input: [{ type: "message", role: "user", content: TAG }],
            output: [{ type: "message", content: [{ type: "output_text", text: `${TAG} fin` }] }],
        },
        function_call: { type: "function_call", arguments: args },
    };
    stripChainEchoResponsesEvent(ev);
    assert.equal(ev.text, "ok ");
    assert.equal((ev.part as Record<string, unknown>).text, " hi");
    const item = ev.item as Record<string, unknown>;
    assert.equal(((item.content as Record<string, unknown>[])[0]).text, " there");
    const resp = ev.response as Record<string, unknown>;
    assert.equal(((resp.input as Record<string, unknown>[])[0]).content, TAG, "input untouched by the walker");
    const outMsg = ((resp.output as Record<string, unknown>[])[0]) as Record<string, unknown>;
    assert.equal(((outMsg.content as Record<string, unknown>[])[0]).text, " fin");
    assert.equal((ev.function_call as Record<string, unknown>).arguments, args, "tool-call arguments byte-exact (#1039)");
});

test("stripChainEchoOpenaiChatText covers delta/message reasoning fields", () => {
    const o: Record<string, unknown> = {
        choices: [{
            delta: { content: `a${TAG}`, reasoning_content: `${TAGP}b`, reasoning: `c${TAG}` },
            message: { content: `d${TAG}`, reasoning_content: `e${TAG}` },
        }],
    };
    stripChainEchoOpenaiChatText(o);
    const ch = (o.choices as Record<string, unknown>[])[0];
    const d = ch.delta as Record<string, unknown>;
    assert.equal(d.content, "a");
    assert.equal(d.reasoning_content, "b");
    assert.equal(d.reasoning, "c");
    const m = ch.message as Record<string, unknown>;
    assert.equal(m.content, "d");
    assert.equal(m.reasoning_content, "e");
});

test("stripChainEchoAnthropicText covers delta/content, spares tool_use input", () => {
    const input = { cmd: `echo ${TAG}` };
    const o: Record<string, unknown> = {
        delta: { text: `a${TAG}`, thinking: `b${TAG}` },
        content: [
            { type: "text", text: `c${TAG}` },
            { type: "thinking", thinking: `d${TAG}` },
            { type: "tool_use", id: "tu_1", input },
        ],
    };
    stripChainEchoAnthropicText(o);
    const d = o.delta as Record<string, unknown>;
    assert.equal(d.text, "a");
    assert.equal(d.thinking, "b");
    const c = o.content as Record<string, unknown>[];
    assert.equal(c[0].text, "c");
    assert.equal(c[1].thinking, "d");
    assert.deepEqual(c[2].input, input, "tool_use input byte-exact (#1039)");
});

test("removeExactCarrierFromInput removes only byte-exact carrier items", () => {
    const input: unknown[] = [
        { type: "message", role: "user", content: TAG },
        { type: "message", role: "user", content: TAG + " extra" },
        { type: "message", role: "assistant", content: TAG },
        { type: "message", role: "user", content: [{ type: "input_text", text: TAG }] },
    ];
    const removed = removeExactCarrierFromInput(input, TAG);
    assert.equal(removed, 2);
    assert.equal(input.length, 2);
    assert.equal((input[0] as Record<string, unknown>).content, TAG + " extra", "near-variant preserved");
    assert.equal((input[1] as Record<string, unknown>).content, TAG, "assistant message preserved");
});

test("scrubChainEchoHistory strips assistant prose, keeps user verbatim, never deletes", () => {
    const msgs: unknown[] = [
        { role: "assistant", content: `ok ${TAG} done` },
        { role: "user", content: `I wrote ${TAG} myself` },
        { role: "assistant", content: TAG },
        { role: "tool", content: `${TAGP}` },
        { role: "assistant", parts: [{ text: `g${TAGP}h` }] },
    ];
    const r = scrubChainEchoHistory(msgs);
    assert.equal(r.strippedSpans, 3);
    assert.equal(r.userKept, 1);
    assert.equal((msgs[0] as Record<string, unknown>).content, "ok  done");
    assert.equal((msgs[1] as Record<string, unknown>).content, `I wrote ${TAG} myself`, "user text kept verbatim");
    assert.equal((msgs[2] as Record<string, unknown>).content, " ", "marker-only degrades to a space");
    assert.equal((msgs[3] as Record<string, unknown>).content, `${TAGP}`, "tool results untouched");
    assert.equal(((msgs[4] as Record<string, unknown>).parts as Record<string, unknown>[])[0].text, "gh");
});

function makeCtx(id: string) {
    return {
        core: createCore(),
        config: { modelContextLimit: 200000 } as Config,
        messages: [] as CoreMessage[],
        session: {
            id,
            meta: {},
            stats: { requests: 0, tokensSaved: 0, inputTokens: 0, cachedTokens: 0, outputTokens: 0, cacheSamples: 0, lastInputTokens: 0, contextTokens: 0 },
            metadata: {},
            state: createInitialState(),
            createdAt: Date.now(),
            lastSeen: Date.now(),
            blockContents: new Map(),
            inFlight: 0,
            persisted: false,
        } as unknown as Session,
        log: () => {},
        protocol: "responses",
    };
}

const ctx = makeCtx("s1565-rewrite") as unknown as RewriteCtx;

test("non-stream rewriters strip chain echoes; responses lane drops the echoed carrier", () => {
    const rb: Record<string, unknown> = {
        output: [{ type: "message", status: "completed", content: [{ type: "output_text", text: `hi ${TAG}` }] }],
        input: [
            { type: "message", role: "user", content: "hi" },
            { type: "message", role: "user", content: TAG },
            { type: "message", role: "user", content: TAG + " x" },
        ],
    };
    rewriteResponsesJsonResponse(rb, ctx, TAG);
    const rOut = ((rb.output as Record<string, unknown>[])[0]) as Record<string, unknown>;
    assert.equal(((rOut.content as Record<string, unknown>[])[0]).text, "hi ");
    const rIn = rb.input as Record<string, unknown>[];
    assert.equal(rIn.length, 2, "exact carrier item removed from echoed input");
    assert.equal(rIn[1].content, TAG + " x", "near-variant preserved");

    const ob: Record<string, unknown> = { choices: [{ message: { role: "assistant", content: `x ${TAG} y` } }] };
    rewriteOpenaiJsonResponse(ob, ctx);
    assert.equal(((ob.choices as Record<string, unknown>[])[0].message as Record<string, unknown>).content, "x  y");

    const gb: Record<string, unknown> = { candidates: [{ content: { parts: [{ text: `g${TAG}h` }] } }] };
    rewriteGoogleJsonResponse(gb, ctx);
    assert.equal((((gb.candidates as Record<string, unknown>[])[0].content as Record<string, unknown>).parts as Record<string, unknown>[])[0].text, "gh");

    const ab: Record<string, unknown> = { content: [{ type: "text", text: `a${TAG}b` }], stop_reason: "end_turn" };
    rewriteJsonResponse(ab, ctx);
    assert.equal(((ab.content as Record<string, unknown>[])[0]).text, "ab");

    const clean: Record<string, unknown> = { choices: [{ message: { role: "assistant", content: "plain" } }] };
    const clone = structuredClone(clean);
    rewriteOpenaiJsonResponse(clean, ctx);
    assert.deepEqual(clean, clone, "tag-free body passes through unmutated");
});

function sse(event: string, obj: Record<string, unknown>): string {
    return `event: ${event}\ndata: ${JSON.stringify({ type: event, ...obj })}\n\n`;
}

test("#1565 P0-1: response.completed echoing the request loses its exact carrier item", async () => {
    const echoedInput = [
        { type: "message", role: "user", content: "hi" },
        { type: "message", role: "user", content: TAG },
        { type: "message", role: "user", content: TAG + " extra" },
    ];
    const round = [
        sse("response.created", { response: { id: "resp_in1", status: "in_progress" } }),
        sse("response.output_item.added", { output_index: 0, item: { type: "message", id: "msg_in1", role: "assistant", content: [] } }),
        sse("response.output_text.delta", { item_id: "msg_in1", output_index: 0, delta: "answer" }),
        sse("response.completed", { response: { id: "resp_in1", status: "completed", input: echoedInput, output: [{ type: "message", id: "msg_in1", role: "assistant", status: "completed", content: [{ type: "output_text", text: "answer" }] }] } }),
    ].join("");
    const chunks: Buffer[] = [];
    for await (const chunk of runCompressLoop(
        new Response(round, { status: 200 }).body!,
        makeCtx("s1565-in"),
        { model: "gpt-5", input: [], stream: true },
        { url: "http://mock", headers: {} },
        createResponsesAdapter(undefined, undefined, undefined, undefined, TAG),
        buildCompressSystemPrompt(),
    )) {
        chunks.push(chunk);
    }
    const out = Buffer.concat(chunks).toString("utf8");
    assert.ok(out.includes("answer"), "visible answer delivered");
    const frames = out.split("\n\n").filter((f) => f.startsWith("event: response.completed"));
    assert.equal(frames.length, 1, "exactly one completion frame reached the client");
    const dataLine = frames[0].split("\n").find((l) => l.startsWith("data: "))!;
    const completed = JSON.parse(dataLine.slice(6)) as Record<string, unknown>;
    const resp = completed.response as Record<string, unknown>;
    const input = resp.input as Record<string, unknown>[];
    assert.equal(input.length, 2, "byte-exact carrier item removed from the echoed input");
    assert.equal(input[0].content, "hi");
    assert.equal(input[1].content, TAG + " extra", "near-variant item preserved verbatim");
    assert.ok(!input.some((it) => it.content === TAG), "no byte-exact carrier item survives");
});
