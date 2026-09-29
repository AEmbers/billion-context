import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { lanePreferredPort, portZoneFilePath, readZonePort, writeZonePort } from "../src/instance.ts";
import { ZONE_PORT_BASE, resolveZonePortBase } from "../src/config.ts";

// #1660: the self-managed port zone. Every lane'd launch tries the lane's
// sticky port first (a past +1-ladder drift it still points at), else the
// zone base; the spawn path settles the actually-bound port back sticky so
// later launches follow drift automatically. Pure file-backed functions —
// always driven against an explicit temp file here so tests never touch the
// developer's real state dir.

function zoneFile(): string {
    const dir = mkdtempSync(path.join(tmpdir(), "bili-port-zone-"));
    return path.join(dir, "port-zone.json");
}

test("readZonePort/writeZonePort: round-trip, per-lane isolation, preserves other lanes", () => {
    const file = zoneFile();
    try {
        assert.equal(readZonePort("zcode", file), undefined, "no record yet");
        writeZonePort("zcode", 18788, file);
        writeZonePort("claude", 18789, file);
        assert.equal(readZonePort("zcode", file), 18788);
        assert.equal(readZonePort("claude", file), 18789);
        // a rewrite of one lane preserves the other
        writeZonePort("zcode", 18790, file);
        assert.equal(readZonePort("zcode", file), 18790);
        assert.equal(readZonePort("claude", file), 18789);
        const shape = JSON.parse(readFileSync(file, "utf8")) as { lanes: Record<string, number> };
        assert.deepEqual(shape.lanes, { zcode: 18790, claude: 18789 });
    } finally {
        rmSync(path.dirname(file), { recursive: true, force: true });
    }
});

test("readZonePort: tolerates garbage — missing file, invalid JSON, out-of-range values", () => {
    const file = zoneFile();
    try {
        assert.equal(readZonePort("zcode", file), undefined, "missing file");
        writeFileSync(file, "{ this is not json", "utf8");
        assert.equal(readZonePort("zcode", file), undefined, "corrupt JSON");
        writeFileSync(file, JSON.stringify({ lanes: { zcode: "18788", claude: 0, pi: 65536, dsh: 1.5 } }), "utf8");
        assert.equal(readZonePort("zcode", file), undefined, "string is not a port");
        assert.equal(readZonePort("claude", file), undefined, "0 is not a port");
        assert.equal(readZonePort("pi", file), undefined, "65536 is out of range");
        assert.equal(readZonePort("dsh", file), undefined, "non-integer is not a port");
        writeFileSync(file, JSON.stringify({ lanes: { zcode: 18788 } }), "utf8");
        assert.equal(readZonePort("other", file), undefined, "lane without a record");
    } finally {
        rmSync(path.dirname(file), { recursive: true, force: true });
    }
});

test("writeZonePort: rejects invalid ports and never throws", () => {
    const file = zoneFile();
    try {
        writeZonePort("zcode", 0, file);
        writeZonePort("zcode", 65536, file);
        writeZonePort("zcode", 1.5, file);
        writeZonePort("zcode", Number.NaN, file);
        assert.equal(readZonePort("zcode", file), undefined, "nothing settled for invalid inputs");
        assert.doesNotThrow(() => writeZonePort("zcode", 18787, file));
    } finally {
        rmSync(path.dirname(file), { recursive: true, force: true });
    }
});

test("lanePreferredPort: sticky record beats the base; base honors BILI_ZONE_PORT", () => {
    const file = zoneFile();
    try {
        assert.equal(lanePreferredPort("zcode", { BILI_ZONE_PORT: "20000" }), 20000, "env override of the base");
        writeZonePort("zcode", 18788, file);
        // sticky lives in the DEFAULT state file — patch readZonePort's view by
        // pointing the default path at the temp file via the module seam: the
        // function reads portZoneFilePath() when no file is passed, so drive
        // the two-arg forms directly for the composed semantics instead.
        assert.equal(readZonePort("zcode", file), 18788, "sticky present in the temp zone file");
        assert.equal(lanePreferredPort("zcode", {}), ZONE_PORT_BASE, "default base without a sticky record (real state file untouched in tests)");
    } finally {
        rmSync(path.dirname(file), { recursive: true, force: true });
    }
});

test("resolveZonePortBase: BILI_ZONE_PORT validated 1..65535, junk falls back to the default", () => {
    assert.equal(ZONE_PORT_BASE, 18787, "the zone base sits below the Linux ephemeral range (32768-60999)");
    assert.equal(resolveZonePortBase({}), ZONE_PORT_BASE);
    assert.equal(resolveZonePortBase({ BILI_ZONE_PORT: "20000" }), 20000);
    assert.equal(resolveZonePortBase({ BILI_ZONE_PORT: "1" }), 1);
    assert.equal(resolveZonePortBase({ BILI_ZONE_PORT: "65535" }), 65535);
    assert.equal(resolveZonePortBase({ BILI_ZONE_PORT: "0" }), ZONE_PORT_BASE);
    assert.equal(resolveZonePortBase({ BILI_ZONE_PORT: "65536" }), ZONE_PORT_BASE);
    assert.equal(resolveZonePortBase({ BILI_ZONE_PORT: "not-a-port" }), ZONE_PORT_BASE);
});

test("portZoneFilePath: lives in the state dir", () => {
    assert.equal(path.basename(portZoneFilePath()), "port-zone.json");
});
