import { test } from "node:test";
import assert from "node:assert/strict";
import { renderChainCheckpoint } from "../src/chain-checkpoint.ts";
import { COMPACT_ECHO_PREFIX, FORGED_SUMMARY_HEADER } from "../src/codex-compact.ts";
import {
    composeStreamFilters,
    containsMarkerLineText,
    createBiliChainTagFilter,
    createInternalArtifactLineFilter,
    createMarkerLineFilter,
    createTagEchoFilter,
    mayStartMarkerLine,
    stripAcpTags,
    stripResponsesText,
} from "../src/loop/tag-echo-filter.ts";

const DIGEST = "sha256:" + "ab".repeat(32);
const REAL_TAG = renderChainCheckpoint({ v: 1, processor: "proc-uuid", issuedAt: 1759000000000, requestId: "a1b2c3d4", digest: DIGEST });
const ACP_TAG = "\x3cacp tokens=\"2\" type=\"text\">m00001\x3c/acp>";

function runPushed(f: { push: (d: string) => string; flush: () => string }, chunks: string[]): string {
    let out = "";
    for (const c of chunks) out += f.push(c);
    return out + f.flush();
}

test("stripAcpTags removes a real chain checkpoint tag (non-streaming)", () => {
    assert.equal(stripAcpTags("before " + REAL_TAG + " after"), "before  after");
});

test("stripAcpTags preserves <summary>/<analysis> prose (user-visible content)", () => {
    const t = "Here is a <summary> of the <analysis> so far.</summary>";
    assert.equal(stripAcpTags(t), t);
});

test("stripAcpTags strips artifact head lines at column 0, keeps body", () => {
    const body = "intro\n" + COMPACT_ECHO_PREFIX + "\nSegment 1 — summary body\nnext line";
    assert.equal(stripAcpTags(body), "intro\nSegment 1 — summary body\nnext line");
    const forged = "x\n" + FORGED_SUMMARY_HEADER + " — topic\nbody";
    assert.equal(stripAcpTags(forged), "x\nbody");
});

test("stripAcpTags preserves indented or mid-line artifact heads (quoting)", () => {
    const indented = "  " + FORGED_SUMMARY_HEADER + " — quoted\nrest";
    assert.equal(stripAcpTags(indented), indented);
    const midline = "note: " + COMPACT_ECHO_PREFIX + "\ntail";
    assert.equal(stripAcpTags(midline), midline);
});

test("stripAcpTags preserves over-long or unclosed chain-tag openings (#644 prose rule)", () => {
    const overlongClosed = "<bili-chain " + "x".repeat(600) + "/>";
    assert.equal(stripAcpTags(overlongClosed), overlongClosed);
    const overlongOpen = "<bili-chain " + "y".repeat(600);
    assert.equal(stripAcpTags(overlongOpen), overlongOpen);
});

test("stripAcpTags still strips render tags and [ACP] marker lines", () => {
    assert.equal(stripAcpTags("a " + ACP_TAG + " b"), "a  b");
    assert.equal(stripAcpTags("intro\n📦 [ACP] Compressed m00120–m0300 → 1 block(s).\ntail"), "intro\ntail");
});

test("createBiliChainTagFilter strips a real tag split char-by-char across chunks", () => {
    const f = createBiliChainTagFilter();
    const full = "A" + REAL_TAG + "B";
    assert.equal(runPushed(f, [...full].map((ch) => ch)), "AB");
    assert.ok(f.dropped());
});

test("createBiliChainTagFilter splits a tag at arbitrary chunk boundaries", () => {
    const f = createBiliChainTagFilter();
    const full = "pre" + REAL_TAG + "post";
    const chunks: string[] = [];
    for (let i = 0; i < full.length; i += 7) chunks.push(full.slice(i, i + 7));
    assert.equal(runPushed(f, chunks), "prepost");
    assert.ok(f.dropped());
});

test("createBiliChainTagFilter releases over-long unclosed openings as prose mid-stream", () => {
    const f = createBiliChainTagFilter();
    const prose = "<bili-chain " + "z".repeat(600) + " end";
    assert.equal(runPushed(f, [prose]), prose);
    assert.ok(!f.dropped());
});

test("createBiliChainTagFilter drops a truncated echo held at flush", () => {
    const f = createBiliChainTagFilter();
    assert.equal(f.push("<bili-chain v=\"1\" pro"), "");
    assert.equal(f.flush(), "");
    assert.ok(f.dropped());
});

test("createBiliChainTagFilter preserves cut-off prose ending in a lone <", () => {
    const f = createBiliChainTagFilter();
    assert.equal(f.push("if a <"), "if a ");
    assert.equal(f.flush(), "<");
    assert.ok(!f.dropped());
});

test("createBiliChainTagFilter leaves prose containing < untouched", () => {
    const f = createBiliChainTagFilter();
    assert.equal(runPushed(f, ["a < b\nc < d"]), "a < b\nc < d");
    assert.ok(!f.dropped());
});

test("createInternalArtifactLineFilter swallows a head split across chunks", () => {
    const f = createInternalArtifactLineFilter();
    assert.equal(f.push("[Compressed conve"), "");
    assert.equal(f.push("rsation section] — topic\nbody\n"), "body\n");
    assert.ok(f.dropped());
});

test("createInternalArtifactLineFilter swallows a complete head line in one chunk", () => {
    const f = createInternalArtifactLineFilter();
    assert.equal(runPushed(f, [COMPACT_ECHO_PREFIX + "\nS1\nrest"]), "S1\nrest");
    assert.ok(f.dropped());
});

test("createInternalArtifactLineFilter preserves divergent text ([CompressedX])", () => {
    const f = createInternalArtifactLineFilter();
    assert.equal(runPushed(f, ["[CompressedX\ntext"]), "[CompressedX\ntext");
    assert.ok(!f.dropped());
});

test("createInternalArtifactLineFilter preserves indented and mid-line heads", () => {
    const indented = "  " + FORGED_SUMMARY_HEADER + "\n";
    const f1 = createInternalArtifactLineFilter();
    assert.equal(runPushed(f1, [indented]), indented);
    const midline = "see " + FORGED_SUMMARY_HEADER + " here\n";
    const f2 = createInternalArtifactLineFilter();
    assert.equal(runPushed(f2, [midline]), midline);
});

test("createInternalArtifactLineFilter drops an unterminated head at EOF but keeps undecidable prefixes", () => {
    const f1 = createInternalArtifactLineFilter();
    assert.equal(f1.push(FORGED_SUMMARY_HEADER + " — t"), "");
    assert.equal(f1.flush(), "");
    assert.ok(f1.dropped());
    const f2 = createInternalArtifactLineFilter();
    assert.equal(f2.push("[Compres"), "");
    assert.equal(f2.flush(), "[Compres");
    assert.ok(!f2.dropped());
});

test("containsMarkerLineText detects literal tag, JSON-escaped tag, and head lines", () => {
    assert.ok(containsMarkerLineText(REAL_TAG));
    const escapedTag = REAL_TAG.replace("\x3c", "\\u003c");
    assert.ok(escapedTag.startsWith("\\u003cbili-chain "));
    assert.ok(containsMarkerLineText('{"text":"' + escapedTag + '"}'));
    assert.ok(containsMarkerLineText(FORGED_SUMMARY_HEADER + " — x"));
    assert.ok(containsMarkerLineText(COMPACT_ECHO_PREFIX));
    assert.ok(!containsMarkerLineText("hello world"));
});

test("mayStartMarkerLine gates partial opens at any position in the last line", () => {
    assert.ok(mayStartMarkerLine("<bi"));
    assert.ok(mayStartMarkerLine("see <bil"));
    assert.ok(mayStartMarkerLine('prose <bili-chain v="1" proc'));
    assert.ok(mayStartMarkerLine("abc\n<bili-chain"));
    assert.ok(mayStartMarkerLine("[Compressed conve"));
    assert.ok(mayStartMarkerLine(FORGED_SUMMARY_HEADER));
    assert.ok(!mayStartMarkerLine("hello world"));
    assert.ok(!mayStartMarkerLine("done."));
});

test("composeStreamFilters chains all four strippers with pipeline-end stats", () => {
    const onDrop: string[] = [];
    const f = composeStreamFilters(
        createTagEchoFilter(() => onDrop.push("render")),
        createMarkerLineFilter(() => onDrop.push("marker")),
        createBiliChainTagFilter(() => onDrop.push("chain")),
        createInternalArtifactLineFilter(() => onDrop.push("artifact")),
    );
    const input = "start " + ACP_TAG + "\n📦 [ACP] fake m00001.\nmid " + REAL_TAG + "\n" + FORGED_SUMMARY_HEADER + " — t\nend";
    const out = runPushed(f, [input]);
    assert.equal(out, "start \nmid \nend");
    assert.deepEqual(onDrop, ["render", "marker", "chain", "artifact"]);
    assert.ok(f.dropped());
    const s = f.stats();
    assert.equal(s.inputChars, input.length);
    assert.equal(s.outputChars, out.length);
    assert.ok(s.dropped);
});

test("composeStreamFilters keeps two-filter semantics identical for existing call sites", () => {
    const solo = createTagEchoFilter();
    const pair = composeStreamFilters(createTagEchoFilter(), createMarkerLineFilter());
    const input = "a " + ACP_TAG + " b\n📦 [ACP] fake\n";
    let soloOut = "";
    for (const c of [...input].map((ch) => ch)) soloOut += solo.push(c);
    soloOut += solo.flush();
    assert.equal(soloOut, "a  b\n📦 [ACP] fake\n");
    let pairOut = "";
    for (const c of [...input].map((ch) => ch)) pairOut += pair.push(c);
    pairOut += pair.flush();
    assert.equal(pairOut, "a  b\n");
});

test("stripResponsesText never touches tool-call arguments (#1039 verbatim invariant)", () => {
    const args = JSON.stringify({ cmd: "write <summary> literal user intent </summary>" });
    const obj = { item_id: "x", arguments: args };
    const out = stripResponsesText(obj) as { arguments?: string };
    assert.equal(out.arguments, args);
    const tagArgs = JSON.stringify({ note: REAL_TAG });
    const obj2 = { item_id: "y", arguments: tagArgs };
    const out2 = stripResponsesText(obj2) as { arguments?: string };
    assert.equal(out2.arguments, tagArgs);
});
