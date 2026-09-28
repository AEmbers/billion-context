# billion-context

<p align="center"><a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a></p>

<p align="center"><strong>Context-compression plugin</strong> — <em>billion-context is all you need.</em></p>

<p align="center"><sub>small context windows (100K is enough) · <em>5× fewer tokens</em> · month-long single sessions (billions of tokens) · high compression quality</sub></p>

<p align="center">
<a href="https://www.npmjs.com/package/billion-context"><img src="https://img.shields.io/npm/v/billion-context.svg?style=flat-square" alt="npm"></a>
<a href="https://github.com/ranxianglei/billion-context/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/billion-context.svg?style=flat-square" alt="license"></a>
<a href="https://github.com/ranxianglei/billion-context"><img src="https://img.shields.io/badge/GitHub-ranxianglei%2Fbillion--context-181717?style=flat-square&logo=github" alt="GitHub"></a>
</p>

<p align="center">
<code>npm install -g billion-context</code>
</p>

<p align="center">
<a href="https://claude.com/product/claude-code" title="Claude Code"><img src="https://cdn.simpleicons.org/claude/D97757" height="26" alt="Claude Code"></a>&nbsp;
<a href="https://github.com/openai/codex" title="Codex"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/simple-icons/openai.svg?color=white"><img src="https://api.iconify.design/simple-icons/openai.svg" height="26" alt="Codex"></picture></a>&nbsp;
<a href="https://opencode.ai" title="OpenCode"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/opencode/FFFFFF"><img src="https://cdn.simpleicons.org/opencode/000000" height="26" alt="OpenCode"></picture></a>&nbsp;
<a href="https://pi.dev" title="pi"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/pi/FFFFFF"><img src="https://cdn.simpleicons.org/pi/000000" height="26" alt="pi"></picture></a>&nbsp;
<a href="https://github.com/google-gemini/gemini-cli" title="Gemini CLI"><img src="https://cdn.simpleicons.org/googlegemini/8E75B2" height="26" alt="Gemini CLI"></a>&nbsp;
<a href="https://www.kimi.com" title="Kimi"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/kimi/FFFFFF"><img src="https://cdn.simpleicons.org/kimi/000000" height="26" alt="Kimi"></picture></a>&nbsp;
<a href="https://github.com/QwenLM/qwen-code" title="Qwen Code"><img src="https://cdn.simpleicons.org/qwen/6950EF" height="26" alt="Qwen Code"></a>&nbsp;
<a href="https://github.com/github/copilot-cli" title="GitHub Copilot CLI"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.simpleicons.org/githubcopilot/FFFFFF"><img src="https://cdn.simpleicons.org/githubcopilot/000000" height="26" alt="GitHub Copilot CLI"></picture></a>&nbsp;
<a href="https://www.trae.ai" title="TRAE"><img src="https://cdn.simpleicons.org/trae/32F08C" height="26" alt="TRAE"></a>&nbsp;
<a href="https://www.codebuddy.cn" title="CodeBuddy"><img src="https://cdn.simpleicons.org/codebuddy/6C4DFF" height="26" alt="CodeBuddy"></a>&nbsp;
<a href="https://qoder.com" title="Qoder"><img src="https://icons.duckduckgo.com/ip3/qoder.com.ico" height="26" alt="Qoder"></a>&nbsp;
<a href="https://iflow.cn" title="iFlow CLI"><img src="https://img.alicdn.com/imgextra/i4/O1CN01yBfg3x1iNi4YggwIt_!!6000000004401-2-tps-72-72.png" height="26" alt="iFlow CLI"></a>&nbsp;
<a href="https://www.minimax.io" title="MiniMax Code (mcode)"><img src="https://cdn.simpleicons.org/minimax/E73562" height="26" alt="MiniMax Code"></a>&nbsp;
<a href="https://www.deepseek.com" title="deepseek-harness (dsh)"><img src="https://cdn.simpleicons.org/deepseek/5786FE" height="26" alt="deepseek-harness"></a>&nbsp;
<a href="https://ampcode.com" title="Amp"><img src="https://icons.duckduckgo.com/ip3/ampcode.com.ico" height="26" alt="Amp"></a>&nbsp;
<a href="https://aider.chat" title="aider"><img src="https://raw.githubusercontent.com/Aider-AI/aider/main/aider/website/assets/icons/favicon-32x32.png" height="26" alt="aider"></a>&nbsp;
<a href="https://github.com/aaif-goose/goose" title="goose"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/aaif-goose/goose/main/documentation/static/img/logo_dark.png"><img src="https://raw.githubusercontent.com/aaif-goose/goose/main/documentation/static/img/logo_light.png" height="26" alt="goose"></picture></a>&nbsp;
<a href="https://github.com/NousResearch/hermes-agent" title="hermes"><img src="https://raw.githubusercontent.com/NousResearch/hermes-agent/main/apps/bootstrap-installer/src-tauri/icons/128x128.png" height="26" alt="hermes"></a>&nbsp;
<a href="https://z.ai" title="zcode (Z.ai)"><img src="https://z-cdn.chatglm.cn/z-ai/static/logo.svg" height="26" alt="zcode"></a>&nbsp;
<a href="https://omp.sh" title="omp (oh-my-pi, Stencil Labs)"><img src="https://omp.sh/favicon.svg" height="26" alt="omp"></a>&nbsp;
<a href="https://github.com/1jehuang/jcode" title="jcode"><img src="https://github.com/1jehuang.png" height="26" alt="jcode"></a>
</p>

---

## Community

QQ Group:
1056132097 (full)
1108730198 (open)

---

## 📄 Paper / Preprint

- **[Model-Driven Incremental Hierarchical Compression: Training-Free Multi-Generational Context Management for Long-Lived Coding Agents](./paper/model-driven-incremental-hierarchical-compression-training-free-multi-generational-context-management-for-long-lived-coding-agents.md)** (English, v0.2)

> 📝 **The paper itself is open-sourced under the MIT License as part of the codebase (`paper/`). It is a living document — anyone may edit it; improvements are welcome via pull request.**

A production-scale longitudinal study: 4.5 months, three hosts, 174,327 model calls, 18.76B cumulative input tokens (~24.7B across all hosts), zero window violations on 204,800-token models, marathon sessions of 8,584–12,049 calls.

---

`billion-context` sits between **any** agent and its model API, rewriting Anthropic/OpenAI streams with [acp-kernel](https://github.com/ranxianglei/acp-kernel) compression. The model decides **when** and **what** to compress into high-fidelity summaries — not a hard truncation limit.

## Why

Long coding sessions blow up context. Each provider charges per token, and once you pass the context window the session degrades or dies. `billion-context` compresses consumed conversation into layered summaries so you can run a single session for days — billions of tokens through one context window.

Unlike a host's built-in summarizer, compression here is **incremental, reversible, and prefix-cache friendly**: summaries are written in small ranges, can be decompressed on demand, and the cache prefix stays intact.

## How it works

```
Agent (Claude Code / Codex / Cursor / Aider ...)
        │  you point the agent's base URL at the proxy
        ▼
┌─────────────────┐
│  billion-context│   1. parse the request (Anthropic or OpenAI shape)
│     proxy       │   2. run acp-kernel compression on the conversation
│                 │   3. inject a `compress` tool + compression philosophy
│                 │   4. forward to the real model API
│                 │   5. rewrite the streaming response
└─────────────────┘
        │
        ▼
   real model API (Anthropic / OpenAI / compatible)
```

### Context-management tools

The proxy injects four context-management tools into the conversation; the model calls them itself as context grows, and the proxy executes `compress` server-side so folded ranges stay summarized in history until restored:

- **`compress`** — fold a message range into a detailed summary.
- **`decompress`** — restore a compressed range when exact details are needed again.
- **`search_context`** — keyword search over compressed summaries and visible messages.
- **`acp_status`** — context-usage overview plus which ranges are still compressible.

Four opt-in extensions add capabilities on top, each off by default with full semantics (enable flags, scope, caveats) in [CONFIGURATION.md](CONFIGURATION.md): **`absorb`** distills oversized tool results (builds, logs, greps) into compact summaries at arrival instead of waiting for a fold round (#605); **`acp_rule`** records principle-level reminders (lessons, behaviors to remember, pitfalls) hard-protected from every fold (#1399, [billion-context-pi#433](https://github.com/ranxianglei/billion-context-pi/issues/433)); **`acp_retrieve`** stores oversized results in a content-addressed store behind a byte-stable ID reference, making folds lossless and retrievable on demand (#1097/#1179); **`image_full`** downscales screenshot-like images once at arrival so fewer billed pixels enter the wire, restorable to original resolution for the session (#1095).

Protection knobs decide which tool results survive folding: `compress.protectedLatestTools` keeps a cumulative tool's latest snapshot un-foldable (a live todo/task list, #639); `compress.protectedTools` hard-excludes every instance of a low-frequency high-value tool; `compress.neverPreserveRecentTools` / `compress.preserveRecentTools` tune the recent-zone exemption list — e.g. the recommended `["read"]` remedy for the batch-read fold→re-read loop (#1198/#1277). All documented in [CONFIGURATION.md](CONFIGURATION.md).

### Two compression modes — who executes `compress`

The proxy runs in one of two modes, and **the mode decides who executes
`compress`, which in turn decides how the summary travels to the model** (the
"carrier"). This distinction is the root of #377.

| | **Launcher / plugin mode** (`bili pi`, `bili codex`, …) | **Proxy mode** (plain client → `/bili/`) |
|---|---|---|
| Client | ACP-native agent with the bili extension (pi/omp) | Any OpenAI/Anthropic client, no extension |
| Who executes `compress` | **The agent** (pi runs it locally) | **The proxy** (server-side compress loop) |
| `compress` tool call in the re-sent history? | Yes — part of the agent's own conversation | No — ephemeral proxy-loop traffic |
| Preflight blocks (no tool call)? | Last-resort backstop — the agent normally compresses on its own `compress` calls, but `src/preflight.ts` still fires (in both modes) when the input alone exceeds the window (#470) | Yes — `src/preflight.ts` compresses behind the client's back |
| **Summary carrier on the wire** | **the `compress` tool call** | **an `acp_summary` user message** |
| System messages on the wire | always exactly 1 (client + prompt) | always exactly 1 (client + prompt) — summaries ride on user messages |
| SGLang "single system" 400 (#377) | cannot happen | cannot happen (summaries are user messages, not system) |
| Proxy-injected `compress` tools | none — the agent registers the 4 ACP tools natively | the 4 context tools (when enabled) |
| Proxy-injected nudge | **yes** — the agent has no nudge channel of its own, so the proxy-side nudge is the proactive compression trigger (preflight alone only fires at the hard limit; #451) | yes (when enabled) |

**Why the carriers differ.** In plugin mode the agent owns compression: the
`compress` call + result live in the agent's own history and are re-sent every
turn, so the summary rides on the tool call and the agent's view never renders
the kernel's `acp_summary` fallback (`billion-context-pi` `src/messages.ts`
skips `acp_summary_*`). In proxy mode the client is not ACP-native, so the
proxy executes `compress` server-side; the tool call never enters the client's
history, and preflight blocks have no tool call at all — so the kernel's
`acp_summary` message is the only carrier. The kernel renders it as role
`system`, but strict OpenAI-compatible backends (SGLang) require exactly one
system message at index 0, so `systemToUser` (`src/util.ts`) re-voices it as a
`user` message, leaving it at its anchor position. This keeps the head system
message (the prefix-cache anchor) byte-stable across compress turns, so a new
block does not invalidate the whole-conversation prefix.

**Why `user`, not `system` or a forged tool call.** A mid-stream `system`
message is what SGLang rejects (#377). A forged `compress` tool call would be
the "pure" carrier, but in proxy mode it requires fabricating an
assistant `tool_calls` + `user` `tool_result` pair by id, declaring the tool in
the request, and handling preflight blocks that have no authentic call — far
more invasive than re-voicing a standalone note. A `user` message is allowed
anywhere in the conversation, so it is the minimal change that satisfies both
SGLang's one-system rule and prefix-cache stability. The accepted trade-off:
a summary is a stand-in for the folded history, and re-voicing it as a user
turn is a semantic mismatch the model tolerates (it is clearly marked
`[Compressed conversation section]`).

**Do the two modes coexist?**

- **Same proxy instance: yes, by design.** One proxy serves plugin and plain
  clients at once; `pluginMode` is decided per request (`x-bili-plugin` header)
  and bound per session (`session.metadata.pluginAgent`). The launcher reuses a
  running proxy.
- **Same session: the mode is sticky.** A session created in plugin mode stays
  plugin mode (metadata inheritance); a plain session can only be *upgraded* to
  plugin mode if a plugin request arrives with a matching conversation id (the
  header outranks) — and never downgraded. In practice a plain→plugin upgrade
  requires the plugin client's conversation id to match an existing plain
  session id, which doesn't happen (each client generates its own id).
- **Cross-mode block hazard: theoretical only.** It would require the same
  conversation id to span a mode switch. plugin→proxy is safe (the tool call is
  in the shared history); proxy→plugin could orphan proxy-created block
  summaries (their tool call isn't in the agent's history and the agent's view
  skips `acp_summary`) — but that needs the id match above, which doesn't occur.

**Verifying that a compression actually landed.** After executing `compress`,
the proxy emits a confirmation marker (`📦 [ACP] Compressed …`) as plain
assistant text — but under sustained context pressure a model was observed
*writing that marker format itself* without ever calling the tool (#717): 17
fake "compressions" over ~2 hours while real usage climbed to 89%. A marker
line visible in the transcript is therefore not proof of persistence — verify
with `acp_status` (block count increased, compressible-range start advanced)
before trusting it. As a backstop, the proxy strips any marker-shaped line the
model emits on its own and logs a `[marker-echo]` warning, and both the nudge
and the injected prompt state explicitly that markers are proxy-emitted only.


## Which do I need?

Pick by your client:

| Client | Use |
|---|---|
| **pi** | [`billion-context-pi`](https://github.com/ranxianglei/billion-context-pi) (in-process extension) |
| **opencode** (1.x / 2.x) | [`billion-context`](https://github.com/ranxianglei/billion-context) — `bili opencode` (launcher) or `bili plugin install opencode` (native, no launcher); standalone [`opencode-acp`](https://github.com/ranxianglei/opencode-acp) remains usable on 1.x. Full guide: [OpenCode](CLIENTS.md#opencode) |
| **omp** | [`billion-context`](https://github.com/ranxianglei/billion-context) via `bili omp` (built-in plugin) or `bili plugin install omp` (self-spawning native plugin, no launcher) |
| **dsh** | `bili dsh` (launcher — full native plugin via `--patch`: tools, session-bound `/acp` + `/acp-cache`, fetch intercept) or `bili plugin install dsh` ≡ `dsh plugin --profile <name> add billion-context` (one unified lane — pnpm-installs the package into each profile so dsh mounts the bundled patch layer; the bili form just drives dsh's own channel per profile and migrates legacy managed blocks) |
| **kimi** | `bili plugin install kimi` (self-spawning native plugin, no launcher — Kimi Code ≥ 2.0.0; per-session routing block in `~/.kimi-code/config.toml`) or `bili kimi` (launcher, cert-MITM) or `/bili/` prefix |
| **hermes** | `bili plugin install hermes` (self-spawning native plugin, no launcher — Python plugin, #958) or `bili hermes` (launcher, cert-MITM) |
| **zcode** (Z.ai / bigmodel coding plan) | `bili plugin install zcode` (self-spawning native plugin, no launcher — per-session routing block in the bigmodel provider store, #1145) or cert-MITM through the GUI's Settings → Network (HTTP proxy + CA path) or `/bili/` prefix |
| **claude** | `bili claude` (launcher) or `bili plugin install claude` (native posture, #964 — managed settings block + session-owned proxy; see the notes below) |
| **jcode** | [`billion-context`](https://github.com/ranxianglei/billion-context) via `bili jcode` (launcher, cert-MITM) or `/bili/` prefix — no native plugin possible: compiled Rust binary with no plugin seam, and its static per-provider config can't stamp per-request headers ([#962](https://github.com/ranxianglei/billion-context/issues/962)) |
| **gemini** (Gemini CLI) | `bili gemini` (launcher, `GOOGLE_GEMINI_BASE_URL` `/bili/` rewrite) or `/bili/` prefix — launcher-only: gemini-cli's extension system reaches custom commands only, no in-loop tool seam (#1043) |
| **iflow** (iFlow CLI) | `bili iflow` (launcher, `IFLOW_BASE_URL` `/bili/` rewrite) or `/bili/` prefix |
| **qwen** (Qwen Code) | `bili qwen` (launcher, cert-MITM) or `/bili/` prefix |
| **mcode** (MiniMax Code) | [`billion-context`](https://github.com/ranxianglei/billion-context) via `bili mcode` (launcher, cert-MITM) or `/bili/` prefix — no native plugin possible: its plugin system is declarative event hooks only (no model-request/history seam), so compression rides the proxy ([#1050](https://github.com/ranxianglei/billion-context/issues/1050)) |
| **aider** | [`billion-context`](https://github.com/ranxianglei/billion-context) via `bili aider` (launcher, cert-MITM) or `/bili/` prefix — no native plugin possible: Python script structure whose hook surface is shell commands around edits/notifications only, no tool-injection seam ([#1048](https://github.com/ranxianglei/billion-context/issues/1048)) |
| **copilot** (GitHub Copilot CLI) | `bili copilot` (launcher, cert-MITM) — closed Go binary, no plugin seam; model hosts (`api.githubcopilot.com` + per-plan subdomains) whitelisted (#1049) |
| **amp** (Amp CLI) | `bili amp` (launcher, cert-MITM) — closed Go binary, no plugin seam; `ampcode.com` whitelisted (#1049) |
| **goose** (Goose CLI) | `bili goose` (launcher) — rustls release builds trust no CA file, so no cert-MITM: built-in openai/anthropic legs redirected via `OPENAI_HOST`/`ANTHROPIC_HOST`, custom providers via a regenerated `GOOSE_PATH_ROOT` overlay (`base_url` → `/bili/`, real config untouched); fixed third-party providers unsupported (#1049) |
| **everything else** (no context hook) | [`billion-context`](https://github.com/ranxianglei/billion-context) — `bili <client>` (launcher, preferred) or `/bili/` prefix |

**Native mode vs standalone extensions.** The host-native plugins (`bili plugin install pi` / `opencode` — they spawn the proxy inside the host process) and the standalone in-process extensions (`billion-context-pi`, `opencode-acp`) are **mutually exclusive**: both active means double compression. The installer makes the switch: `bili plugin install pi` replaces the legacy `npm:billion-context-pi` entry (with a reminder that a project-scope entry in `<project>/.pi/settings.json` from `pi install -l` lives outside the global settings), and `bili plugin install opencode` strips legacy `opencode-acp` entries from the global opencode.json — bare name, `npm:` alias, versioned (`opencode-acp@stable`), or path form, array or object shape; the original config is snapshotted to `.bili-bak` once. A **project-local** install (`opencode plugin opencode-acp` writes `<project>/.opencode/opencode.json`, not the global config) is not touched — remove it by hand; the installer note reminds you. As a runtime safety net for manual installs, the native entries set `BILLION_CONTEXT_NATIVE=<host>` synchronously at load so a standalone extension can stand down at action time — its own load-time `BILLION_CONTEXT_PROXY` check cannot see a proxy that native mode spawns asynchronously, and its `/bili/` baseUrl check never sees the fetch-layer rewrite. On the pi side the marker needs `billion-context-pi` **0.1.72+** (the per-event re-check landed after 0.1.71); the pi-native entry additionally scans both pi settings files once its proxy is up and warns loudly when it spots a co-resident legacy entry the installer never saw — that warning is the only visible signal while an old `billion-context-pi` silently double-compresses.


## Install

```bash
npm install -g billion-context
```

This installs the `bili` command (`bili-proxy` is kept as an alias).

## Quickstart

Three ways to use it — pick one:

- **Native plugin (no launcher):** `bili plugin install <client>` — bili
  becomes a plugin inside the client; start the client as usual.
- **Launcher (easiest):** one `bili <client>` command brings up the proxy and
  the client together — no real config file is ever touched.
- **URL change (persistent):** prefix your client's baseURL with the proxy
  origin + `/bili/`.

Mechanism details behind these three options (plugin lifecycle, runtime-info
protocol, injection priority) live in [TECHNICAL-NOTES.md](TECHNICAL-NOTES.md).

### Option 1 — Native plugin (`bili plugin install pi` / `omp` / `opencode` / `dsh` / `kimi` / `hermes` / `zcode`)

The proxy lives inside the client: install once, then start the client
exactly as you always do — no launcher command, no env vars, no fixed port,
no URL edits. Supported today for **pi**, **omp**, **opencode** (1.x and
2.x), **dsh**, **kimi**, **hermes** and **zcode**:

```bash
bili plugin install pi          # registers a "billion-context" entry in pi's settings (npm form when bili itself was npm-installed)
bili plugin install omp         # registers an extensions entry in omp's config.yml (~/.omp/agent/config.yml)
bili plugin install opencode    # registers the plugin in opencode's real config + disables native auto-compaction
bili plugin install dsh         # runs 'dsh plugin --profile <name> add billion-context' for every existing profile
bili plugin install kimi        # writes $KIMI_CODE_HOME/plugins/managed/billion-context/kimi.plugin.json (+ installed.json record); per-session routing block lands in config.toml on first start (Kimi Code >= 2.0.0)
bili plugin install hermes      # copies the Python plugin into ~/.hermes/plugins/billion-context/ (+ machine-owned bili.json sidecar) and enables it via `hermes plugins enable billion-context`
bili plugin install zcode       # writes hooks.enabled + a SessionStart hook + mcp.servers.bili into ~/.zcode/cli/config.json; per-session routing lands in the bigmodel provider store on first start
bili plugin remove <client>     # undo (dsh removes through the same channel; config snapshots go to .bili-bak)
bili plugin update [client]     # bring every lane's bili presence up to date, each through its own owner (see below)
```

Where a client has its own plugin channel you can also install natively,
skipping bili commands entirely:

- **dsh:** `dsh plugin --profile <name> add billion-context` is the very
  command `bili plugin install dsh` drives per profile — same end state
  either way (pnpm into the profile, bundled patch layer mounted by dsh
  itself); remove through the same channel. See the dsh section below.
- **opencode:** add the bare npm name to your real config's plugin list —
  `"plugin": ["billion-context"]` (npm form only; a git checkout has no
  published entry). The package publishes `exports["./server"]` →
  `dist/agent/opencode-native.js`, so opencode loads it through its own
  Npm.add machinery and the plugin self-spawns exactly like the
  bili-installed form. Do the two things the bili installer would have done
  for you too: set `"compaction": { "auto": false }` in the same config
  (otherwise OpenCode's native auto-compaction double-compresses) and keep a
  manual backup of the file first.

For pi / omp / kimi / claude there is no client-side channel — `bili plugin
install <client>` writes their config entries for you (kimi's declarative
`kimi.plugin.json` + registry record, claude's managed settings block, …).

#### Single-writer: who owns which copy (#991)

Every bili presence on a machine has exactly **one writer** — the thing
that installed it is the thing that updates it, and nothing else ever
overwrites that copy in place:

| Lane | Copy lives in | Updated by |
|------|---------------|------------|
| global `bili` | npm global (`npm i -g billion-context`) | `bili update` / background auto-update |
| **pi** | pi's package manager (npm form) | **`pi update`** — bili never overwrites it |
| **opencode** | opencode's plugin dir | **opencode's plugin manager** — bili never overwrites it |
| **dsh** | each profile's pnpm store | a periodic check re-runs dsh's plugin channel per profile — driven by the global bili self-update **or by the profile copy's own proxy** when the global isn't running (dsh-market installs, #1196); manual: `dsh plugin add billion-context@latest`. pnpm's hardlinked store must never be copied over in place |
| omp / claude / codex / kimi / zcode | no copy — entries point at the global bili install | they update together with the global copy |
| **hermes** | `~/.hermes/plugins/billion-context/` (copied files + `bili.json` sidecar pointing at the global dist) | **`bili plugin update hermes`** re-copies the files; the sidecar tracks the global install |

This is enforced in code, not just convention: the self-updater
(`src/update.ts` → `hostManagedInstall`) detects install dirs under a pnpm
virtual store (`.pnpm`) or a host agent tree (pi / opencode / dsh / kimi /
omp homes) and **skips** them; `installViaTarball` refuses them structurally
so direct callers cannot corrupt a store either. Mixing *commands* is fine
(`dsh plugin add` ≡ `bili plugin install dsh` — same channel, same records);
mixing *writers* is what the guard forbids. `bili plugin update [client]`
is the one command that drives every lane through its own owner and prints
the per-lane update path (`bili plugin list` shows the same per-lane channel).

At load the plugin **spawns its own proxy** (attaches to a healthy running
one only when it passes the attach gate below; a parent-pid watchdog tears
it down when the client exits),
rewrites model traffic to `<proxy>/bili/<upstream-url>`, registers
`compress` / `decompress` / `acp_status` as native client tools (plugin
mode), and reports the client's **own model config** to the proxy so
compression budgets use the real window instead of a registry guess.
Opt-out envs: `BILI_NATIVE_PI=0`, `BILI_NATIVE_OMP=0`,
`BILI_NATIVE_OPENCODE=0`, `BILI_NATIVE_DSH=0`, `BILI_NATIVE_KIMI=0`,
`BILI_NATIVE_HERMES=0`, `BILI_NATIVE_ZCODE=0`. Full
mechanics: [TECHNICAL-NOTES.md](TECHNICAL-NOTES.md).

Reuse is identity-based (#1225) **and lifecycle-gated (#1335)**: an existing
proxy is attached only when it runs the **same code** (sha256 of the entry
script, recorded in the instance file), its **lane is compatible** — each
launcher declares its client's lane, two *different declared* lanes never
share — **and it owns a session lifecycle**: its health endpoint reports an
armed parent-pid watchdog (`watchdog.armed == true`), i.e. it was spawned by
a launcher with a parent pid and dies when the last attached session dies.
An instance without a declared lane is wildcard-compatible on the lane axis,
but that alone no longer makes it attachable (see the gate below).
Instances written before #1225 carry no code fingerprint and are therefore
never attached: a rebuilt or updated install always starts a fresh proxy on
the next launch, so fixes take effect immediately instead of silently
serving stale code.

**The attach gate (#1335).** A native hook attaches to whatever answers on
the port, so the three listener kinds get different treatment (TS lanes and
the hermes Python plugin's discovery path alike, #1338):

| Listener | Lifecycle owner | Attach? |
|---|---|---|
| Its own session-spawned proxy | armed from birth | ✅ yes |
| Another session's armed proxy (shared, watcher set #1186) | watcher set | ✅ yes — sharing stays the design |
| Manually started `bili start` daemon | **none** — refuses watchers, never dies with sessions, often an older build | ❌ not by default |

The hook probes the candidate's `/__bili/health` for `watchdog.armed` before
attaching. Armed → attach + register a watcher (current behavior, README
lifecycle contract holds). Unarmed — or a pre-#1330 build that reports no
`watchdog` field at all (unverifiable, treated as unarmed) → **do not
attach**; the hook spawns its own session-owned proxy (ephemeral port, armed
from birth, dies with the last session). This also fixes version skew: every
session now runs the **currently installed** bili instead of whatever a
stale resident daemon happens to carry. The trade-off is one extra short-lived
proxy process per session when no armed proxy exists (session state is shared
on disk, so compression continuity is unaffected); the multi-instance warning
(#394) becomes correspondingly more common. **Escape hatch:** deliberately
run a resident daemon for your hooks to ride on → set
`native.attachExternal: true` in the config file or
`BILI_NATIVE_ATTACH_EXTERNAL=1`. That restores attaching to any compatible
listener regardless of watchdog state — you then own the daemon's lifetime
and version yourself. Explicit user-directed attaches (`BILLION_CONTEXT_ATTACH`
/ preset `BILLION_CONTEXT_PROXY` for kimi/dsh) bypass discovery entirely and
are exempt by construction.

Attach discovery is lane-aware across **all** live instances (#1232): the
launcher probes every live entry in the instance registry, not just the
single instance file (last-writer-wins — under concurrent multi-client use
it can point at another client's proxy), and applies the gate above to every
candidate. Among compatible candidates the newest instance with the launcher's
own declared lane wins; an instance without a lane is wildcard-compatible on
the lane axis (still subject to the gate). The `another bili instance is
running` warning (#394) is lane-aware too: it fires for same-lane or lane-less
coexistence, but stays silent between two *different* declared lanes, whose
session files are disjoint.

**Runtime-info protocol (#955).** A native plugin reads the model config
the client itself will use and pushes it to the proxy (per-request headers
+ bootstrap report); the proxy prefers that truth over the models.dev
registry / built-in table when resolving the context window. Protocol
details, resolution order, and implementations:
[TECHNICAL-NOTES.md](TECHNICAL-NOTES.md).

Notes:

- Native mode is **mutually exclusive** with the standalone in-process
  extensions (`billion-context-pi`, `opencode-acp`) — the installer swaps
  the entries and snapshots the original config (`.bili-bak`); migration
  details in the client table above (pi needs `billion-context-pi` 0.1.72+
  to stand down cleanly).
- OpenCode: legacy `opencode-acp` sessions, the V1/V2 plugin shapes, and all caveats are consolidated in the [OpenCode](CLIENTS.md#opencode) section.
- `kimi` reports runtime-info at bootstrap only (static `custom_headers` can't
  carry per-request window/model headers without going stale on model switch)
  and binds subagent conversations by per-call `conversation_id` — full
  mechanics in the "Kimi Code" section below.
- `hermes`'s native plugin is Python (its CLI agent's plugin API is
  Python-only) — instead of patching fetch it points hermes' httpx stack at
  the proxy via env vars after a health check, and stamps per-request headers
  through an `llm_request` middleware; full mechanics in the "Hermes" section
  below.
- `codex` has a companion install too (an MCP shell), but it needs a running
  proxy — it is not native mode.
- `claude` also has a **native posture** (#964): `bili plugin install
  claude` writes a managed settings block (static `/bili/` URL +
  `SessionStart` hook) plus an MCP shell pinned to a stable port — the
  proxy lives and dies with the session. Opt out with
   `BILI_NATIVE_CLAUDE=0` (passthrough). Mechanics:
   [TECHNICAL-NOTES.md](TECHNICAL-NOTES.md).
- `zcode` also has a **native posture** (#1145): `bili plugin install
  zcode` writes `~/.zcode/cli/config.json` (`hooks.enabled` +
  `SessionStart` hook + stdio MCP server) and rewrites the bigmodel
  coding-plan provider's `baseURL` to `<proxy>/bili/<upstream>` per
  session (both store generations: legacy `v2/config.json` and v3.14+
  `provider_config.json`) — full mechanics in the "ZCode" section below.
- `jcode` has no native mode at all: it is a compiled Rust binary with no
  plugin or extension seam, its only per-provider request surface is a static
  TOML header table applied verbatim to every request, and its MCP servers
  run in a global pool shared across all sessions — so there is neither a
  way to rewrite model traffic in-process nor one to stamp the per-request
   headers plugin mode requires (`x-bili-plugin`, conversation id,
   runtime-info). Full source-level analysis: [#962](https://github.com/ranxianglei/billion-context/issues/962)
   (closed wontfix). Use `bili jcode`.
- `aider` has no native mode either: it is a Python script structure whose
  hook surface is limited to shell commands around file edits and idle
  notifications (`--git-commit-verify`, `--notifications-command`) — there is
  no plugin or extension API and no MCP client, so there is no
  tool-injection seam for plugin mode. Use `bili aider`
  ([#1048](https://github.com/ranxianglei/billion-context/issues/1048)).
- `copilot`, `amp` and `goose` are launcher-only (#1049): none exposes a tool-injection seam, so there is no native mode (a codex-style MCP-shell companion remains possible for amp/goose but is not shipped). Goose additionally cannot be cert-MITMed — its release builds run rustls/webpki and trust no CA file — so it rides plain-HTTP base-URL redirects instead of proxy envs.

### Option 2 — Launcher (`bili pi` / `bili codex` / `bili claude` / `bili omp` / `bili opencode` / `bili hermes` / `bili dsh` / `bili codebuddy` / `bili qoder` / `bili trae` / `bili jcode` / `bili kimi` / `bili gemini` / `bili iflow` / `bili qwen` / `bili mcode` / `bili aider` / `bili copilot` / `bili amp` / `bili goose`)

The launcher wraps a client in one command: it starts a proxy on an
independent port (a fresh instance is always spawned — a port is never
reused), then points the client at it — **certificate-based MITM** where the
client honors proxy/CA env vars, or an isolated **`/bili/` config rewrite**
where it doesn't. No real config file is ever edited; the client's own
config is READ to discover which HTTPS upstream hosts it talks to, and those
hosts are whitelisted for MITM so the proxy can TLS-terminate exactly them
and blind-tunnel everything else.

```bash
bili pi                               # launch pi through the proxy — file-free (#535): env + extension registerProvider, real ~/.pi untouched
bili codex                            # launch codex through the proxy
bili claude                           # launch claude through the proxy
bili omp                              # pi-style, file-free (#535): env + extension registerProvider + compaction cancel, real ~/.omp untouched
bili opencode                         # OpenCode (1.x & 2.x): full guide in the [OpenCode](CLIENTS.md#opencode) section below
bili hermes                           # file-free (#535): hermes proxy env (HTTPS_PROXY + combined CA bundle via SSL_CERT_FILE) — https via CONNECT MITM, http via absolute-form forward proxy; real ~/.hermes untouched
bili dsh                              # deepseek-harness: full native plugin injected via --patch (#941) — compress/decompress/acp_status registered as real dsh tools, requests stamped with the dsh session id (plugin mode), /acp + /acp-cache session-bound; non-loopback upstreams ride proxy envs (https MITM, http absolute-form), loopback keeps the overlay DSH_HOME (~/.dsh-bili) rewrite (#535), built-in deepseek route via DEEPSEEK_BASE_URL; dsh native auto-compaction disabled (compaction-basic auto:false)
bili codebuddy                        # Tencent CodeBuddy Code CLI: CODEBUDDY_BASE_URL /bili/ rewrite (OpenAI chat completions wire), budget aligned via CODEBUDDY_AUTO_COMPACT_WINDOW; real ~/.codebuddy untouched
bili qoder                            # qoder: model endpoint is hardcoded https (no /bili/ rewrite possible) — cert-MITM via HTTPS_PROXY + NODE_EXTRA_CA_CERTS, default model hosts whitelisted (#653)
bili trae                             # Trae CLI (ByteDance, closed Go binary, no base-URL override) — cert-MITM via HTTPS_PROXY + SSL_CERT_FILE, model host from TRAE_CLI_API_HOST or the default enterprise gateway (#655)
bili jcode                            # jcode (Rust agent harness) — env-only cert-MITM launch: HTTPS_PROXY + SSL_CERT_FILE, model host api.z.ai whitelisted, local loopback providers stay direct via NO_PROXY
bili kimi                             # Kimi Code CLI (Moonshot): honors standard proxy envs for all traffic EXCEPT an unconditional loopback bypass — non-loopback https via cert-MITM (HTTPS_PROXY + NODE_EXTRA_CA_CERTS/SSL_CERT_FILE), non-loopback http via absolute-form forward proxy; provider/model hosts from ~/.kimi-code/config.toml (KIMI_CODE_HOME respected) or the managed OAuth endpoints when none declared; loopback endpoints inventoried with a manual /bili/ prefix hint (#757)
bili gemini                           # Gemini CLI (Google): GOOGLE_GEMINI_BASE_URL /bili/ rewrite to generativelanguage.googleapis.com (Google native wire), real ~/.gemini untouched
bili iflow                            # iFlow CLI: IFLOW_BASE_URL /bili/ rewrite to apis.iflow.cn/v1 (OpenAI chat-completions wire), real ~/.iflow untouched
bili qwen                             # Qwen Code (multi-protocol gemini-cli fork, no base-URL hook): cert-MITM via HTTPS_PROXY + NODE_EXTRA_CA_CERTS, default DashScope/Qwen model hosts whitelisted, custom relays via --mitm-domain
bili mcode                            # MiniMax Code CLI: honors standard proxy envs for all traffic EXCEPT an unconditional loopback bypass — non-loopback https via cert-MITM (HTTPS_PROXY + NODE_EXTRA_CA_CERTS/SSL_CERT_FILE), non-loopback http via absolute-form forward proxy; provider hosts from ~/.minimax*/config.yaml (MINIMAX_DATA_DIR/MAVIS_DATA_DIR respected) or the official agent.minimax.* endpoints when none declared; loopback endpoints inventoried with a manual /bili/ prefix hint; session bound via the X-Mavis-Session-Id header (#1050)
bili aider                            # Aider (Python pair programmer): cert-MITM via HTTPS_PROXY + SSL_CERT_FILE/REQUESTS_CA_BUNDLE; endpoint from OPENAI_API_BASE / ANTHROPIC_BASE_URL etc., --openai-api-base, or .aider.conf.yml — api.openai.com + api.anthropic.com assumed by default; loopback endpoints stay direct via NO_PROXY (#1048)
bili copilot                          # Copilot CLI (GitHub, closed Go binary) — cert-MITM via HTTPS_PROXY + SSL_CERT_FILE, api.githubcopilot.com + per-plan subdomains whitelisted (#1049)
bili amp                              # Amp CLI (Sourcegraph, closed Go binary) — cert-MITM via HTTPS_PROXY + SSL_CERT_FILE, ampcode.com whitelisted (#1049)
bili goose                            # Goose (Block, Rust/reqwest): rustls release builds trust no CA file — no proxy envs at all; built-in openai/anthropic legs redirected via OPENAI_HOST/ANTHROPIC_HOST, custom declarative providers via a regenerated GOOSE_PATH_ROOT overlay with base_url /bili/ rewrites (real config untouched, user edits merged back); fixed third-party providers get a warning (#1049)
bili pi --mitm-domain api.foo.com     # add a domain to the MITM whitelist
```

### Option 3 — URL change (`/bili/` prefix)

Start the proxy:

```bash
bili
```

Then just prefix your client's existing baseURL with `http://localhost:8787/bili/`.
The full upstream URL is embedded in the path, so the proxy knows where to
forward without any config:

```
client baseURL before:  https://api.openai.com/v1
client baseURL after:   http://localhost:8787/bili/https://api.openai.com/v1
```

That's it — put your real API key in the client config as usual (the proxy
passes it through untouched). Context windows (gpt-5.1-codex=400K,
glm-5.2=1M, claude-opus-4=200K, …) are looked up from models.dev
automatically.

For per-client configuration examples (OpenCode, Codex, Pi, login-client
MITM, …) see the web UI guide at [http://localhost:8787](http://localhost:8787).

**Verify.** With the proxy running and your config saved, check it answers
and that your first real request shows compression activity in the log:

```bash
# Health check (proxy up + where it forwards)
curl -s http://localhost:8787/__bili/health
# → {"ok":true,"upstream":"https://api.anthropic.com"}

# Live session stats (after a real request)
curl -s http://localhost:8787/__bili/stats
```

Then send one message from your client and watch the log
(`~/.local/state/billion-context/bili.log`, also printed to stderr). You
should see a `processTurn` line per request, and once the conversation grows,
`[acp-usage] round N input=X cached=Y (cache hit Z%)` + a `compress` event.

### Client deep dives

Everything that doesn't fit in one Quickstart line — how each client's lanes attach, what gets written where, and known limitations — lives in **[CLIENTS.md](CLIENTS.md)**: dsh · Kimi Code · Hermes · ZCode · Gemini family (Gemini CLI / iFlow CLI / Qwen Code) · cert-MITM clients that never compress (CONNECT blind tunnels, #897) · unrecognized endpoints going direct (#1290) · OpenCode (launcher / native / pure proxy, `/acp` status & rules, legacy opencode-acp sessions #920).

## Running the proxy

### Flags

```bash
bili --port 9000              # change listen port
bili --host 0.0.0.0           # listen on all interfaces (see host note below)
bili --debug                 # verbose logging (also: set "debug": true in config)
bili --passthrough           # forward without compression (smoke-test mode)
bili --config ~/my-bili.json # use a different config file
bili update                  # check & install a newer version now (bypasses throttle)
bili --no-auto-update        # disable self-update for this run
bili --auto-restart-on-update   # self-restart when a new version is installed (default off)
```

Flags override env vars and the config file. `bili --help` lists them all.

### Remote agents (`--host`)

By default the proxy binds `127.0.0.1` and only accepts loopback connections. To serve agents on other machines: `bili --host 0.0.0.0` (or your LAN IP); remote agents point their model `baseURL` at `http://<this-host>:<port>/bili/…`.

- MITM-mode `CONNECT` then also accepts remote clients — for **whitelisted model hosts only**. Blind tunnels to arbitrary hosts stay loopback-only, so the proxy can never be used as an open relay.
- `/bili/<absolute-url>` destination admission (#409): the proxy itself and link-local/metadata addresses are always denied; loopback/private destinations are allowed for local clients (self-hosted upstreams) and denied for remote clients unless listed in `BILI_TUNNEL_ALLOWED_HOSTS` (`host` or `host:port`, comma-separated). One exception (#1073): a **local** client relaying a management path (`/__bili/*`, `/__acp/*`) to a **loopback IP-literal** destination is forwarded unmarked; remote peers and hostname destinations keep the internal tunnel marker unconditionally, and management paths stay unreachable through the tunnel even via NAT hairpin. An absolute-form request addressed to the instance's own endpoint on a management path is served locally instead of tunneled (a forward-proxy-style health probe gets a real answer).
- There is **no authentication**: only do this on a trusted LAN or behind a firewall. The `/__bili/` management endpoints remain loopback-only. A startup `[security]` warning reminds you of the above.

### Debugging

`bili --debug` (or env `ACP_DEBUG=1`, or `"debug": true` in config — flag > env > config) logs every `processTurn` (tag counts, token usage), the nudge decision (growth/usage/pendingT1/shouldInject), client headers, and SSE rewrites.

### Log file

All logs tee to `~/.local/state/billion-context/bili.log` by default (XDG state dir) and still print to stderr. Override with `"logFile"` in config or `ACP_LOG_FILE` (`off` disables the file). Auto-rotates at 10 MB (`bili.log.old`). Per-request cache-hit stats log as `[acp-usage] round N input=X cached=Y (cache hit Z%)` so you can measure prefix-cache health directly from the log.

### Self-update

The proxy checks npm on startup and every 3 minutes; a newer version is installed in place and a notice is logged — **restart `bili` to pick it up**, unless you enable opt-in self-restart (`--auto-restart-on-update` flag, env `ACP_AUTO_RESTART_ON_UPDATE=1`, or `"autoRestartOnUpdate": true` in config — default OFF): with zero in-flight requests it verifies the new install, stops accepting connections, drains, spawns a replacement on the same port, and exits once it accepts connections (clients reconnect automatically; session state survives on disk). Safety gates: zero in-flight through the drain window, an install sanity check before re-exec, and a 10-minute cooldown marker so a flapping version can never loop-restart; any failure resumes the original listener and falls back to the plain reminder.

While the running process is behind the on-disk install ("stale"), the web UI shows a banner (running vs installed version, auto-restart state) and `GET /__bili/status` returns `{version, diskVersion, stale, autoRestartOnUpdate, inFlight}` for scripting. Disable permanently via `"autoUpdate": false` in config or `ACP_AUTO_UPDATE=0`.

## Configuration

The full configuration reference — config file location, top-level keys,
providers, compression tuning, environment variables — lives in
**[CONFIGURATION.md](CONFIGURATION.md)**.

Two knobs people look for first:

- **Upstream proxy (firewall/GFW)** — routing the proxy's own outbound traffic through v2rayA/clash: full resolution order, empty-string = explicit direct, SOCKS5 rejection, both egress paths, and the `mitm://` vs `https://` key schemes live in [CONFIGURATION.md](CONFIGURATION.md) (Server Settings → `proxy`; Providers → key schemes).
- **Wire-compat role rewrite (`compat.roles`)** — an upstream that rejects the `developer` role? Covered by [CONFIGURATION.md](CONFIGURATION.md) (Server Settings → `compat`) — including the learn-on-failure auto-fix that needs no configuration at all.

## How sessions work

The proxy needs a stable per-conversation identifier to isolate compression
state across concurrent users/accounts. It uses **the conversation value the
client itself provides, verbatim** (`src/session-id.ts`) — no hashing and no
protocol/upstream/API-key dimensions. Those dimensions were mutable mid-
conversation (credentials rotate, users switch relays, the wire protocol can
change), so keying on them orphaned state exactly when the user kept talking
(#280, #286). The id is used only inside the proxy (state store, persistence,
UI label); it is never sent upstream.

Where the value comes from, first hit wins: the plugin's
`x-bili-plugin-conversation` (honored only alongside the `x-bili-plugin`
marker header), then per-client headers (`x-claude-code-session-id`,
`x-grok-session-id`/`x-grok-conv-id`, `x-mavis-session-id`), then generic
headers (`x-session-affinity`, `x-acp-session`, `x-session-id`,
`x-opencode-session`, `session-id`/`session_id`), then body fields:
`session_id` / `metadata.session_id` on the Responses wire, and
`prompt_cache_key` promoted over the content-fingerprint fallback on the
Responses/OpenAI/Anthropic wires.

| Client | Sends conversation id? | Source |
|---|---|---|
| **Codex** | ✅ yes | `body.session_id` / turn-metadata thread id |
| **OpenCode** | ✅ yes | `x-session-affinity` / `x-opencode-session` header (`ses_…`) |
| **Claude Code** | ✅ yes | `x-claude-code-session-id` header |
| **omp** (via plugin) | ✅ yes | `prompt_cache_key` promoted over any fingerprint (#268) |
| **pi** (bare) | ❌ no | nothing → anonymous prefix affinity below |

**Header-less clients (pi-like): anonymous prefix affinity.** When a client
sends no conversation signal at all, the proxy resolves the session from the
replayed history itself (`src/prefix-affinity.ts`, #309): an incoming request
reattaches to a stored session only when its history reproduces that
session's message chain byte-exactly from position 0; otherwise it gets its
own deterministic `pfa-…` session. Consequences for the failure modes this
section used to warn about (#1262):

- A **resumed** conversation reattaches to its own session — including after
  a proxy restart (#499).
- A **new task with an identical opener does NOT inherit** another
  conversation's blocks or protected zone: it mints a fresh session, and once
  its history diverges it is fully separate (fork lineage is recorded for
  debugging).
- A request with no usable signal at all is rejected with an explicit 400
  instead of silently colliding with something else's state.

Design record and threat model: [SESSION-IDENTITY.md](SESSION-IDENTITY.md). The
message-granularity sibling (why identity is content-derived, not an
assigned id) is [MESSAGE-IDENTITY.md](MESSAGE-IDENTITY.md).

For upstream sticky-routing, the proxy forwards only identity values the
client already supplied (e.g. a body `session_id` is forwarded upstream as
`x-session-id`); it never synthesizes one itself.

**Recommendation:** clients that send an explicit id are safe to run many
concurrent conversations through the proxy. For header-less multi-agent use,
prefer the client plugin (the omp/pi plugins stamp a stable id per
conversation); otherwise pass an explicit `x-acp-session` header per
conversation. Even without either, prefix affinity keeps distinct tasks apart
— the cost of a diverged fork is one raw resend plus a compression-ladder
restart.

### Derived (child) sessions inherit the parent's compressed context (#1333, #1362)

A child session (subagent/fork starting from an empty history) reports its lineage at birth — its identity registration carries `parentConversationId` and the proxy records a read-only `derivedFrom` link — so `decompress` / `search_context` fall back along the parent chain for content the child never saw itself (cycle-guarded, depth cap 8). Nothing is copied into the child, the parent is never modified; if the parent is unknown the child simply starts fresh. Per-lane parent signals (pi/omp `parentSession` header, OpenCode V1/V2 `parentID`): [SESSION-IDENTITY.md](SESSION-IDENTITY.md#derived-child-sessions-lineage-at-birth-1333-1362). claude/codex/dsh need nothing here: they share one session id across subagents or have no child-session concept at all.

### Windows: exclude the sessions dir from antivirus (#362)

The proxy rewrites each session's state file every turn of a long session; on Windows, real-time AV (Defender), the search indexer, or a sync tool (OneDrive) can lock the sessions dir mid-write, so persists fail with `EPERM` until the lock clears. Fix at the root: add `%USERPROFILE%\.local\share\billion-context\` to your antivirus exclusions (Defender steps included) and keep sync tools off that path — [CONFIGURATION.md](CONFIGURATION.md#windows-exclude-the-sessions-dir-from-antivirus-362).

### Session file cleanup (#1082)

Short-lived sessions leave small state files behind that are never resumed. Cleanup is **opt-in** (`BILI_SESSION_GC=1`; off by default — session files are user data, no silent deletion policy): when enabled, bili sweeps the sessions dir at boot and hourly and deletes a file only when BOTH hold — older than `BILI_SESSION_GC_MAX_AGE_DAYS` (default 7 days) AND never compressed with its newest request body ≤ `BILI_SESSION_GC_MAX_TOKENS` tokens (default 1M) — so deletion loses nothing but bytes. CCR content stores follow their session file's lifecycle; compressed sessions are never deleted; every deletion is audit-logged. Full policy: [CONFIGURATION.md](CONFIGURATION.md#environment-variables).

## Status

Early. Protocol handling and compression work against mock tests (500+ passing). Real-model integration testing is the next milestone. Expect rough edges.

Client-side plugins for pi / omp / opencode ship inside `billion-context` (`dist/agent/*.js`) for the cooperative-proxy path. See the **"Which do I need?"** section above for how `billion-context`, the standalone `billion-context-pi`, and `opencode-acp` relate.

## Attribution requirement (one term on top of MIT)

This project is MIT-licensed **plus one additional term**: any product or service (commercial or open source) whose users can see or interact with it and which uses this software must attribute it — stating that it uses billion-context with a link back to this repository — on its home page, documentation, or About/Credits page. Pure server-side/embedded use satisfies this via shipped documentation. See the **Additional Term** at the end of [LICENSE](LICENSE).

If you build on this project, we'd love to hear about it: open an issue (no obligation) so we can track where it's used.

## License

MIT
