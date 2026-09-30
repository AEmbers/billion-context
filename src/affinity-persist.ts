import fs from "node:fs";
import path from "node:path";
import { prefixAffinity, type AffinitySnapshotEntry } from "./prefix-affinity.js";
import { stateDir } from "./paths.js";
import { log } from "./logger.js";

/**
 * #499 P1a: prefix-affinity persistence. The anonymous affinity chains were
 * pure in-memory (#309), so a proxy restart orphaned every anonymous session:
 * the next replay forked a fresh session with zero compression state and
 * resent the raw history (#351 — 458K tokens, 0% cache). The chains are
 * small (≤256 sessions × ≤128 hashes); persist them to the state dir with a
 * debounced atomic write and hydrate on boot.
 */

const PERSIST_DEBOUNCE_MS = 5_000;

function affinityFile(): string {
    return path.join(stateDir(), "prefix-affinity.json");
}

let timer: NodeJS.Timeout | null = null;
let writing = false;

/** Entries another process left on disk since we hydrated; null on read failure
 *  (the caller then writes its own snapshot unchanged). */
function readDiskEntries(): AffinitySnapshotEntry[] | null {
    try {
        const file = affinityFile();
        if (!fs.existsSync(file)) return [];
        const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
        if (!Array.isArray(parsed.entries)) return [];
        return parsed.entries.filter(
            (e): e is AffinitySnapshotEntry =>
                !!e && typeof e === "object" &&
                typeof (e as AffinitySnapshotEntry).sessionId === "string" &&
                typeof (e as AffinitySnapshotEntry).depth === "number",
        );
    } catch {
        return null;
    }
}

/** #1724: union of ours + disk keyed by sessionId, deeper/fresher chain wins per
 *  id — a restart or sibling lane can no longer clobber another process's chains
 *  via whole-file last-writer-wins (generalizes #405's "keep fresher" to a store
 *  with no global counter). Reports disk-only chains preserved and same-depth forks. */
function mergeWithDisk(
    mine: AffinitySnapshotEntry[],
    disk: AffinitySnapshotEntry[],
): { entries: AffinitySnapshotEntry[]; preserved: number; forks: number } {
    const mineIds = new Set(mine.map((e) => e.sessionId));
    let preserved = 0;
    for (const d of disk) if (!mineIds.has(d.sessionId)) preserved++;
    const byId = new Map<string, AffinitySnapshotEntry>();
    for (const e of disk) byId.set(e.sessionId, e);
    let forks = 0;
    for (const m of mine) {
        const d = byId.get(m.sessionId);
        if (!d) {
            byId.set(m.sessionId, m);
            continue;
        }
        if (m.depth === d.depth && m.tailHash !== d.tailHash) forks++;
        byId.set(m.sessionId, m.depth > d.depth || (m.depth === d.depth && m.lastSeen >= d.lastSeen) ? m : d);
    }
    return { entries: [...byId.values()], preserved, forks };
}

function writeSnapshot(): void {
    if (writing) return;
    writing = true;
    try {
        const file = affinityFile();
        const mine = prefixAffinity.exportSnapshot();
        const disk = readDiskEntries();
        const merged = disk === null ? { entries: mine, preserved: 0, forks: 0 } : mergeWithDisk(mine, disk);
        const snapshot = { version: 1, entries: merged.entries };
        const tmp = `${file}.tmp`;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(tmp, JSON.stringify(snapshot));
        fs.renameSync(tmp, file);
        if (merged.preserved > 0 || merged.forks > 0) {
            log("info", `[prefix-affinity] write merged ${merged.entries.length} chain(s): kept ${merged.preserved} disk-only, resolved ${merged.forks} same-depth fork(s) across instances (#1724)`);
        }
    } catch (e) {
        log("warn", `[prefix-affinity] persist failed (${e instanceof Error ? e.message : String(e)}); affinity survives in memory`);
    } finally {
        writing = false;
    }
}

/** Debounced snapshot write — call after every affinity mutation. */
export function scheduleAffinityPersist(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        writeSnapshot();
    }, PERSIST_DEBOUNCE_MS);
    timer.unref?.();
}

/** Immediate snapshot write — shutdown path. */
export function flushPrefixAffinity(): void {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    writeSnapshot();
}

/** Load the snapshot a previous process left behind. Call once on boot. */
export function hydratePrefixAffinity(): void {
    try {
        const file = affinityFile();
        if (!fs.existsSync(file)) return;
        const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
        const imported = prefixAffinity.importSnapshot(parsed.entries);
        if (imported > 0) log("info", `[prefix-affinity] hydrated ${imported} chain(s) from ${path.basename(file)} — anonymous sessions reattach across restarts`);
    } catch (e) {
        log("warn", `[prefix-affinity] hydrate failed (${e instanceof Error ? e.message : String(e)}); starting with empty affinity`);
    }
}
