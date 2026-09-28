// #1565: outbound chain checkpoints (#1421/#1397) are self-closing carrier
// tags (<bili-chain …/>, <bili-chain-processed …/>). Upstream models sometimes
// ECHO them back into their own prose — byte-exact copies of our carrier or
// broken variants (mangled quotes/spaces/hex, dropped attributes, stray
// closes). The ACP render-tag machinery (tag-echo-filter.ts) knows only the
// acp name family by design, so this module carries a dedicated bounded state
// machine for the bili-chain family, mirroring createTagEchoFilter's
// principles:
//   - cross-chunk safety via a held undecidable tail (PARTIAL_TAIL)
//   - bounded holds and swallows only — never an unbounded regex over the
//     stream (the issue explicitly forbids /<bili-chain[\s-][^>]*\/?>/ style)
//   - definite vs ambiguous classification: a definite chain opening (name +
//     attrs-or-slash) is dropped even when truncated at EOF; an ambiguous
//     short prefix (<, <b, <bi) is released on flush so genuine prose is
//     never eaten
// Model PROSE fields only. Tool-call arguments and tool results are user
// intent and pass through BYTE-EXACT (#1039) — callers simply never route
// them through this filter, the same invariant block as tag-echo-filter.ts.
import type { TagEchoFilter, TagEchoFilterStats } from "./tag-echo-filter.js";

/** Longest-first alternation of the attested carrier names. Only names with
 *  observed evidence are covered (#1565): the canonical <bili-chain> and the
 *  <bili-chain-processed> variant seen in production echoes. */
const CHAIN_NAMES = ["bili-chain-processed", "bili-chain"];
// Grouped: every consumer splices this into a larger pattern, where a bare
// alternation would split that pattern into branches missing the leading <.
const CHAIN_NAME_ALT = "(?:" + CHAIN_NAMES.join("|") + ")";

// Complete self-closing span: <NAME attr="…"…> (attrs bounded by the parser's
// MAX_CHECKPOINT_CHARS envelope; the class excludes angle brackets so a span
// cannot swallow following markup) or <NAME/>. A bare <NAME> with neither
// attrs nor slash is NOT matched — unattested, possibly prose.
const SELF_CLOSE = new RegExp("\x3c" + CHAIN_NAME_ALT + "(?:\\s[^<>]{0,512}>|\\/\\s*>)");
// A stray closing tag: the model hallucinating the carrier's close. Bounded
// like LONE_CLOSE in tag-echo-filter.ts; the lookahead keeps </bili-chains>
// (or any longer word) out of reach.
const LONE_CLOSE = new RegExp("\x3c\\/" + CHAIN_NAME_ALT + "(?:\\s[^<>]{0,32})?>");
// An opening whose attribute list runs into another `<` instead of ending at
// its `>` — a malformed echo whose interior may carry arbitrary bytes
// (observed: quotes/spaces mangled mid-value). Everything up to the loose
// close is the imitation's payload and is swallowed whole.
const BROKEN_ATTRS = new RegExp("\x3c" + CHAIN_NAME_ALT + "\\s[^<>]{0,512}(?=\x3c)");
// A suffix of the buffer that could still grow into a chain tag: an
// unterminated <NAME … opening (attrs so far, no > yet), an in-progress
// close, <NAME/ (slash not yet closed), or a short ambiguous name prefix.
function buildPartialTail(): RegExp {
    const prefixes = new Set<string>(["<"]);
    for (const n of CHAIN_NAMES) {
        for (let i = 1; i <= n.length; i++) prefixes.add("<" + n.slice(0, i));
    }
    const alts = [...prefixes].sort((a, b) => b.length - a.length).map((p) => p.split("<").join("\\x3c"));
    return new RegExp(
        "(" +
        "\x3c" + CHAIN_NAME_ALT + "\\s[^<>]*|" +
        "\x3c\\/" + CHAIN_NAME_ALT + "(?:\\s[^<>]{0,32})?|" +
        "\x3c" + CHAIN_NAME_ALT + "/|" +
        alts.join("|") +
        ")$",
    );
}
const PARTIAL_TAIL = buildPartialTail();
// A tail that is definitely a chain-tag start (dropped past its cap / at
// flush); anything else is an ambiguous prose prefix (released).
const DEFINITE_TAIL = new RegExp("^\\x3c\\/" + CHAIN_NAME_ALT + "|^\\x3c" + CHAIN_NAME_ALT + "[\\s/]");
// Hold cap for a definite unterminated opening tail. A real carrier fits in
// 1 + 19 (name) + 1 (space) + 512 (attrs) + 1 (slash) + 1 (close) = 534
// chars, so beyond this the tail provably cannot grow into one — drop it.
const CHAIN_TAG_OPEN_CAP = 600;
// Ambiguous-prefix hold cap, same value/rationale as HOLD_LIMIT in
// tag-echo-filter.ts: short enough to never delay prose measurably.
const CHAIN_HOLD_LIMIT = 128;
// Budget for a malformed-echo swallow (BROKEN_ATTRS entry). The span is
// malformed markup by definition, so passing the budget DISCARDS it rather
// than releasing it as prose — same semantics as IMITATION_SWALLOW_CAP.
const CHAIN_SWALLOW_CAP = 4096;

export interface ChainEchoFilter extends TagEchoFilter {
    /** Number of chain-echo spans dropped over the filter's lifetime
     *  (telemetry; content-free by design — #1565 forbids echoing tag
     *  content/digest into logs). */
    dropCount(): number;
}

export function createChainEchoFilter(onDrop?: (snippet: string) => void): ChainEchoFilter {
    let held = "";
    let swallowUntilClose = false;
    let swallowed = "";
    let drops = 0;
    let inputChars = 0;
    let outputChars = 0;
    const drop = (snippet: string): void => {
        drops += 1;
        if (onDrop) onDrop(snippet);
    };
    const process = (input: string): string => {
        let buf = input;
        let out = "";
        for (;;) {
            if (swallowUntilClose) {
                const combined = swallowed + buf;
                const gt = combined.indexOf(">");
                if (gt >= 0) {
                    drop(combined.slice(0, gt + 1));
                    swallowed = "";
                    swallowUntilClose = false;
                    buf = combined.slice(gt + 1);
                    continue;
                }
                if (combined.length > CHAIN_SWALLOW_CAP) {
                    drop(combined);
                    swallowed = "";
                    swallowUntilClose = false;
                    return out;
                }
                swallowed = combined;
                return out;
            }
            const sc = SELF_CLOSE.exec(buf);
            const lc = LONE_CLOSE.exec(buf);
            // A broken opening starting FIRST owns the buffer: its payload
            // runs through any later tag match, so the earliest-starting
            // structure wins the race (same rule as BROKEN_ATTRS in
            // tag-echo-filter.ts).
            const broken = BROKEN_ATTRS.exec(buf);
            if (broken && (sc === null || broken.index < sc.index) && (lc === null || broken.index < lc.index)) {
                out += buf.slice(0, broken.index);
                drop(broken[0]);
                buf = buf.slice(broken.index + broken[0].length);
                swallowUntilClose = true;
                swallowed = "";
                continue;
            }
            let m: RegExpExecArray | null = null;
            for (const cand of [sc, lc]) {
                if (cand && (m === null || cand.index < m.index)) m = cand;
            }
            if (!m) {
                const t = PARTIAL_TAIL.exec(buf);
                if (t) {
                    const definite = DEFINITE_TAIL.test(t[0]);
                    const cap = definite ? CHAIN_TAG_OPEN_CAP : CHAIN_HOLD_LIMIT;
                    if (t[0].length <= cap) {
                        held = t[0];
                        out += buf.slice(0, buf.length - t[0].length);
                    } else if (definite) {
                        drop(t[0]);
                        out += buf.slice(0, buf.length - t[0].length);
                    } else {
                        out += buf;
                    }
                } else {
                    out += buf;
                }
                break;
            }
            out += buf.slice(0, m.index);
            drop(m[0]);
            buf = buf.slice(m.index + m[0].length);
        }
        return out;
    };
    return {
        push(delta: string): string {
            inputChars += delta.length;
            const chunk = held + delta;
            held = "";
            const r = process(chunk);
            outputChars += r.length;
            return r;
        },
        flush(): string {
            const rest = swallowed + held;
            const wasSwallowing = swallowUntilClose;
            swallowed = "";
            held = "";
            swallowUntilClose = false;
            let result: string;
            if (wasSwallowing) {
                // Stream ended inside a malformed echo: the held content is
                // the imitation's payload, not prose.
                if (rest.length > 0) drop(rest);
                result = "";
            } else {
                const t = PARTIAL_TAIL.exec(rest);
                if (t && DEFINITE_TAIL.test(t[0])) {
                    // Truncated imitation at EOF — never prose (mirrors
                    // TRUNC_OPEN/TRUNC_CLOSE handling in tag-echo-filter.ts).
                    drop(t[0]);
                    result = rest.slice(0, rest.length - t[0].length);
                } else {
                    result = rest;
                }
            }
            outputChars += result.length;
            return result;
        },
        dropped(): boolean {
            return drops > 0;
        },
        pending(): boolean {
            return held.length > 0 || swallowUntilClose;
        },
        stats(): TagEchoFilterStats {
            return { inputChars, outputChars, dropped: drops > 0 };
        },
        dropCount(): number {
            return drops;
        },
    };
}

/** One-shot whole-text strip (non-stream JSON bodies, inbound scrubbing).
 *  Runs the same machine to EOF, so streaming and non-stream outputs are
 *  guaranteed identical for the same text. */
export function stripChainEchoTags(text: string): string {
    const f = createChainEchoFilter();
    return f.push(text) + f.flush();
}

/** Cheap pre-check for the serialized-event probe gates (eventStr/jsonStr
 *  level, where some gateways ship \u003c-escaped angles). Both carrier
 *  names share the "bili-chain" stem. */
export function containsChainEchoText(s: string): boolean {
    return s.includes("<bili-chain") || s.includes("\\u003cbili-chain");
}

/** Fast-path gate companion (mirrors mayStartRenderTag): true when s already
 *  contains a chain-echo marker OR ends with an undecidable prefix that a
 *  later delta may complete. */
export function mayStartChainEcho(s: string): boolean {
    return containsChainEchoText(s) || PARTIAL_TAIL.test(s);
}

function chainStripParts(content: unknown): unknown {
    if (!Array.isArray(content)) return content;
    return content.map((part) => {
        if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") {
            return { ...(part as Record<string, unknown>), text: stripChainEchoTags((part as Record<string, unknown>).text as string) };
        }
        return part;
    });
}

function chainStripItemContent(it: unknown): unknown {
    if (!it || typeof it !== "object") return it;
    const io = it as Record<string, unknown>;
    if (!Array.isArray(io.content)) return it;
    return { ...io, content: chainStripParts(io.content) };
}

function chainStripIfString(v: unknown): unknown {
    return typeof v === "string" ? stripChainEchoTags(v) : v;
}

// Strip chain-echo spans from the text fields of a Responses-API
// event/response object (mutates in place). Same shapes as stripResponsesText
// in tag-echo-filter.ts: output_text.done `.text`, content_part.done
// `.part.text`, output_item.done `.item.content[].text`, and
// `.response.output[].content[]` on response.completed. Tool-call arguments
// are deliberately untouched (#1039).
export function stripChainEchoResponsesEvent<T>(obj: T): T {
    if (!obj || typeof obj !== "object") return obj;
    const o = obj as Record<string, unknown>;
    if (typeof o.text === "string") o.text = stripChainEchoTags(o.text);
    if (o.part && typeof o.part === "object" && typeof (o.part as Record<string, unknown>).text === "string") {
        o.part = { ...(o.part as Record<string, unknown>), text: stripChainEchoTags((o.part as Record<string, unknown>).text as string) };
    }
    if (o.item && typeof o.item === "object") {
        o.item = chainStripItemContent(o.item);
    }
    if (o.response && typeof o.response === "object") {
        const resp = { ...(o.response as Record<string, unknown>) };
        if (Array.isArray(resp.output)) {
            resp.output = (resp.output as unknown[]).map(chainStripItemContent);
        }
        o.response = resp;
    }
    if (Array.isArray(o.output)) {
        o.output = (o.output as unknown[]).map(chainStripItemContent);
    }
    return obj;
}

// Strip chain-echo spans from the text fields of an OpenAI chat-completions
// chunk/completion body (choices[].delta.{content,reasoning_content,
// reasoning}, choices[].message.*). Mutates in place. Tool-call arguments
// untouched (#1039).
export function stripChainEchoOpenaiChatText<T>(obj: T): T {
    if (!obj || typeof obj !== "object") return obj;
    const o = obj as Record<string, unknown>;
    if (!Array.isArray(o["choices"])) return obj;
    o["choices"] = (o["choices"] as unknown[]).map((c) => {
        if (!c || typeof c !== "object") return c;
        const ch = c as Record<string, unknown>;
        for (const holder of ["delta", "message"]) {
            const h = ch[holder];
            if (h && typeof h === "object") {
                const hh = { ...(h as Record<string, unknown>) };
                hh["content"] = chainStripIfString(hh["content"]);
                hh["reasoning_content"] = chainStripIfString(hh["reasoning_content"]);
                hh["reasoning"] = chainStripIfString(hh["reasoning"]);
                ch[holder] = hh;
            }
        }
        return ch;
    });
    return obj;
}

// Strip chain-echo spans from the text fields of an Anthropic wire
// object: delta.{text,thinking} on streams, content[].{text,thinking} on
// non-streaming bodies. Mutates in place. tool_use inputs untouched (#1039).
export function stripChainEchoAnthropicText<T>(obj: T): T {
    if (!obj || typeof obj !== "object") return obj;
    const o = obj as Record<string, unknown>;
    const d = o["delta"];
    if (d && typeof d === "object") {
        const dd = { ...(d as Record<string, unknown>) };
        dd["text"] = chainStripIfString(dd["text"]);
        dd["thinking"] = chainStripIfString(dd["thinking"]);
        o["delta"] = dd;
    }
    if (Array.isArray(o["content"])) {
        o["content"] = (o["content"] as unknown[]).map((c) => {
            if (!c || typeof c !== "object") return c;
            const cc = c as Record<string, unknown>;
            if (typeof cc["text"] !== "string" && typeof cc["thinking"] !== "string") return c;
            return { ...cc, text: chainStripIfString(cc["text"]), thinking: chainStripIfString(cc["thinking"]) };
        });
    }
    return obj;
}

// P0-1 (#1565): remove EXACTLY the carrier stamp this instance inserted into
// the request (stampOutboundWithTag's recorded tag) from a Responses-API
// `input` array. Some upstreams echo the full request back in
// response.completed.response.input; a global replace would delete user text
// that merely discusses the tag shape, so only items byte-exact equal to the
// recorded carrier are removed. Returns the number of items removed.
export function removeExactCarrierFromInput(input: unknown, tag: string): number {
    if (!Array.isArray(input) || tag.length === 0) return 0;
    let removed = 0;
    for (let i = input.length - 1; i >= 0; i--) {
        const item = input[i];
        if (!item || typeof item !== "object") continue;
        const io = item as Record<string, unknown>;
        if (io.type !== "message" || io.role !== "user") continue;
        if (io.content === tag) {
            input.splice(i, 1);
            removed++;
        } else if (Array.isArray(io.content)) {
            const c = io.content as unknown[];
            const single = c.length === 1 && c[0] && typeof c[0] === "object"
                ? (c[0] as Record<string, unknown>)
                : undefined;
            if (single && single.type === "input_text" && single.text === tag) {
                input.splice(i, 1);
                removed++;
            }
        }
    }
    return removed;
}

export interface ChainScrubResult {
    /** Malformed/complete chain spans stripped from ASSISTANT prose. */
    strippedSpans: number;
    /** USER messages containing chain-echo text, kept verbatim (counted only —
     *  users may legitimately discuss literal tags; #1565 P1 policy). */
    userKept: number;
}

// #1565 P1 inbound scrub: clean chain-echo spans from MODEL-VISIBLE history
// text BEFORE the kernel sees it. Mirrors stripAcpStatusMarkers' contract
// (acp-panel.ts): roles user+assistant only, string content or parts[].text,
// messages are NEVER deleted (deleting would orphan tool pairs), a
// span-stripped message degrades to a single space rather than vanishing.
// Assistant prose is stripped; user text is counted but kept.
export function scrubChainEchoHistory(messages: unknown): ChainScrubResult {
    const result: ChainScrubResult = { strippedSpans: 0, userKept: 0 };
    if (!Array.isArray(messages)) return result;
    for (const m of messages) {
        if (!m || typeof m !== "object") continue;
        const mo = m as Record<string, unknown>;
        const role = mo.role;
        if (role !== "user" && role !== "assistant") continue;
        const slots: Array<{ get(): string | undefined; set(v: string): void }> = [];
        if (typeof mo.content === "string") {
            slots.push({ get: () => typeof mo.content === "string" ? mo.content : undefined, set: (v) => { mo.content = v; } });
        } else if (Array.isArray(mo.content)) {
            for (const part of mo.content as unknown[]) {
                if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") {
                    const po = part as Record<string, unknown>;
                    slots.push({ get: () => typeof po.text === "string" ? po.text : undefined, set: (v) => { po.text = v; } });
                }
            }
        }
        // Google wire carries text in parts[], not content[].
        if (Array.isArray(mo.parts)) {
            for (const part of mo.parts as unknown[]) {
                if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") {
                    const po = part as Record<string, unknown>;
                    slots.push({ get: () => typeof po.text === "string" ? po.text : undefined, set: (v) => { po.text = v; } });
                }
            }
        }
        for (const slot of slots) {
            const text = slot.get();
            if (typeof text !== "string" || !containsChainEchoText(text)) continue;
            if (role === "user") {
                result.userKept++;
                continue;
            }
            const f = createChainEchoFilter();
            const cleaned = f.push(text) + f.flush();
            if (cleaned !== text) {
                slot.set(cleaned.trim().length > 0 ? cleaned : " ");
                result.strippedSpans += f.dropCount();
            }
        }
    }
    return result;
}
