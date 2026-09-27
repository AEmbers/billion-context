import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { flattenNamedRoutes, parseLauncherNameRoutes, NAME_ROUTES_ENV, loadRoutes } from "../src/config.js";
import { resolveCompress } from "../src/compress-settings.js";
import { collectNameRoutes } from "../src/launcher.js";
import type { DiscoveredRoutes, HttpRewrite } from "../src/launcher.js";

test("parseLauncherNameRoutes: JSON map, non-strings dropped, garbage ignored", () => {
    assert.deepEqual(parseLauncherNameRoutes({}), {});
    assert.deepEqual(parseLauncherNameRoutes({ [NAME_ROUTES_ENV]: "" }), {});
    assert.deepEqual(parseLauncherNameRoutes({ [NAME_ROUTES_ENV]: "not json" }), {});
    assert.deepEqual(parseLauncherNameRoutes({ [NAME_ROUTES_ENV]: "[1,2]" }), {});
    assert.deepEqual(parseLauncherNameRoutes({ [NAME_ROUTES_ENV]: '{"a":"https://x.test","b":3,"c":""}' }), { a: "https://x.test" });
});

test("flattenNamedRoutes: name entry creates the URL lane it maps to (#1462)", () => {
    const routes = {
        "work-claude": { compress: { modelContextLimit: 50000 } },
    } as ReturnType<typeof loadRoutes>;
    const out = flattenNamedRoutes(routes, { "work-claude": "https://api.anthropic.com/v1" });
    // origin-only key, path dropped — same normalization as hand-written URL keys
    assert.ok(out["https://api.anthropic.com"], "URL lane created at origin");
    assert.equal(out["https://api.anthropic.com"].compress?.modelContextLimit, 50000);
    // the name entry itself stays (agent-side fields like compactionOptIn
    // consult it; routing never matches it)
    assert.ok(out["work-claude"]);
});

test("flattenNamedRoutes: explicit URL entry wins every conflict; name fills gaps", () => {
    const routes = {
        "https://api.anthropic.com": {
            compress: { modelContextLimit: 100000, growthFloorTokens: 12345 },
            proxy: "http://explicit.test:3128",
        },
        "work-claude": {
            compress: { modelContextLimit: 50000, absorb: { enabled: true } },
            proxy: "http://named.test:3128",
        },
    } as ReturnType<typeof loadRoutes>;
    const out = flattenNamedRoutes(routes, { "work-claude": "https://api.anthropic.com" });
    const lane = out["https://api.anthropic.com"]!;
    // URL-wins: limit stays the explicit one, named 50000 ignored
    assert.equal(lane.compress?.modelContextLimit, 100000);
    assert.equal(lane.compress?.growthFloorTokens, 12345);
    assert.equal(lane.proxy, "http://explicit.test:3128");
    // gap-filling: absorb only existed on the named entry
    assert.deepEqual(lane.compress?.absorb, { enabled: true });
});

test("flattenNamedRoutes: per-model entries deep-merge, URL model wins", () => {
    const routes = {
        "https://api.openai.com": { models: { "gpt-4o": { context: 128000 } } },
        "work-openai": { models: { "gpt-4o": { context: 64000 }, "o3": { context: 200000 } } },
    } as ReturnType<typeof loadRoutes>;
    const out = flattenNamedRoutes(routes, { "work-openai": "https://api.openai.com" });
    const models = out["https://api.openai.com"]!.models!;
    assert.equal(models["gpt-4o"]?.context, 128000, "explicit URL model wins");
    assert.equal(models["o3"]?.context, 200000, "named-only model fills the gap");
});

test("flattenNamedRoutes: non-http(s) targets and unmapped names are inert", () => {
    const routes = { "a": { compress: { modelContextLimit: 1 } }, "claude-bridge": {} } as ReturnType<typeof loadRoutes>;
    const out = flattenNamedRoutes(routes, { a: "ftp://x.test", "no-entry": "https://y.test" });
    assert.equal(out["ftp://x.test"], undefined);
    assert.equal(out["https://y.test"], undefined, "name with no providers entry never creates a lane");
    assert.ok(out["claude-bridge"], "unmapped name entry left as-is");
});

test("loadRoutes: env name map binds three-level compress through the URL lane (e2e)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bili-named-"));
    const cfgFile = path.join(dir, "billion-context.json");
    fs.writeFileSync(cfgFile, JSON.stringify({
        compress: { modelContextLimit: 200000 },
        providers: {
            "main-openai": {
                compress: { modelContextLimit: 150000 },
                models: { "gpt-4o": { context: 90000 } },
            },
            "https://api.openai.com": { compress: { modelContextLimit: 111000 } },
        },
    }), "utf8");
    const prev = process.env.BILI_CONFIG_FILE;
    process.env.BILI_CONFIG_FILE = cfgFile;
    try {
        const routes = loadRoutes({ [NAME_ROUTES_ENV]: JSON.stringify({ "main-openai": "https://api.openai.com/v1/chat" }) });
        // level 2 (provider): explicit URL entry wins over the named one
        const lane = routes["https://api.openai.com"]!;
        assert.equal(lane.compress?.modelContextLimit, 111000);
        // model-level from the named entry fills the gap
        assert.equal(lane.models?.["gpt-4o"]?.context, 90000);
        // the full three-level resolution: global 200000 → provider 111000
        const resolved = resolveCompress(routes, "https://api.openai.com/v1/chat/completions", "gpt-4o", { modelContextLimit: 200000 });
        assert.equal(resolved.modelContextLimit, 111000);
        // model-level window override flows through the same machinery
        assert.equal(routes["https://api.openai.com"]!.models?.["gpt-4o"]?.context, 90000);
    } finally {
        if (prev === undefined) delete process.env.BILI_CONFIG_FILE; else process.env.BILI_CONFIG_FILE = prev;
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test("collectNameRoutes: origin-only pairs from both rewrite lanes; malformed skipped", () => {
    const mk = (key: string, realUpstream: string): HttpRewrite => ({ key, realUpstream });
    const routes: DiscoveredRoutes = {
        httpsDomains: [],
        httpRewrites: [mk("http-prov", "http://localhost:8000/v1"), mk("bad", "::not a url::")],
        httpsRewrites: [mk("pi-main", "https://api.anthropic.com"), mk("", "https://x.test")],
        httpEnvRoutes: [],
    };
    assert.deepEqual(collectNameRoutes(routes), {
        "http-prov": "http://localhost:8000",
        "pi-main": "https://api.anthropic.com",
    });
});
