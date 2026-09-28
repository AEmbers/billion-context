import test from "node:test";
import assert from "node:assert/strict";
import { stampPromptCacheKey } from "../src/agent/pi.ts";

// #1579: native omp mode routes at the fetch layer — ctx.model.baseUrl stays
// the real upstream URL, so the launcher-shaped destination checks can never
// match. The stamp gate must instead mirror the interceptor's own predicate
// (nativeInterceptInstalled + isModelApiUrl on the URL the interceptor will
// actually rewrite, i.e. baseUrl or its natural chat/completions expansion).
// Regressed on 2026-09-26 (#1403): every native omp session became anonymous
// (pfa_<hash>) at the proxy — wrong identity, wrong panel, wrong bills.

const INTERCEPT_FLAG = Symbol.for("billion-context.native-fetch-intercept");

function withIntercept<T>(installed: boolean, fn: () => T): T {
    const g = globalThis as Record<PropertyKey, unknown>;
    const prev = g[INTERCEPT_FLAG];
    if (installed) g[INTERCEPT_FLAG] = true;
    else delete g[INTERCEPT_FLAG];
    try {
        return fn();
    } finally {
        if (prev === undefined) delete g[INTERCEPT_FLAG];
        else g[INTERCEPT_FLAG] = prev;
    }
}

function makeCtx(baseUrl: string): { model: { baseUrl: string }; sessionManager: { getSessionId(): string } } {
    return { model: { baseUrl }, sessionManager: { getSessionId: () => "sess-1579" } };
}

function makeEvent(body: Record<string, unknown>): { payload: Record<string, unknown> } {
    return { payload: { messages: [], ...body } };
}

test("#1579: native omp with bare /v1 baseUrl stamps the session identity", () => {
    withIntercept(true, () => {
        const out = stampPromptCacheKey(makeEvent({}), makeCtx("http://10.0.0.8:8199/v1"), "omp");
        assert.deepEqual(out?.prompt_cache_key, "sess-1579");
    });
});

test("#1579: native omp with a full endpoint baseUrl stamps too", () => {
    withIntercept(true, () => {
        const out = stampPromptCacheKey(makeEvent({}), makeCtx("http://10.0.0.8:8199/v1/chat/completions"), "omp");
        assert.deepEqual(out?.prompt_cache_key, "sess-1579");
    });
});

test("#1403 kept: no native intercept installed → never stamp (proxy cannot see it)", () => {
    withIntercept(false, () => {
        const out = stampPromptCacheKey(makeEvent({}), makeCtx("http://10.0.0.8:8199/v1"), "omp");
        assert.equal(out, undefined);
    });
});

test("#1403 kept: intercept installed but baseUrl is not a model API target → never stamp", () => {
    withIntercept(true, () => {
        const out = stampPromptCacheKey(makeEvent({}), makeCtx("https://api.example.com/nope"), "omp");
        assert.equal(out, undefined);
    });
});

test("non-omp agents are never stamped", () => {
    withIntercept(true, () => {
        const out = stampPromptCacheKey(makeEvent({}), makeCtx("http://10.0.0.8:8199/v1"), "pi");
        assert.equal(out, undefined);
    });
});

test("an existing prompt_cache_key is never overwritten", () => {
    withIntercept(true, () => {
        const out = stampPromptCacheKey(makeEvent({ prompt_cache_key: "user-set" }), makeCtx("http://10.0.0.8:8199/v1"), "omp");
        assert.equal(out, undefined);
    });
});

test("a body without messages array is left alone", () => {
    withIntercept(true, () => {
        const out = stampPromptCacheKey({ payload: { foo: 1 } }, makeCtx("http://10.0.0.8:8199/v1"), "omp");
        assert.equal(out, undefined);
    });
});
