# Technical notes

Mechanism-level details behind the three usage options in the README. The
README keeps each option concise; the "how it actually works" material lives
here instead of between the options.

## Native plugin lifecycle (Option 1)

At load the plugin **spawns its own proxy** (or attaches to a healthy
running one — a parent-pid watchdog tears it down when the client exits),
rewrites model traffic to `<proxy>/bili/<upstream-url>`, registers
`compress` / `decompress` / `acp_status` as native client tools (plugin
mode), and binds the `/acp` panel to the current session. It also reports
the client's **own model config** to the proxy (runtime-info protocol,
#955) so compression budgets use the real window instead of a registry
guess. Opt-out envs: `BILI_NATIVE_PI=0`, `BILI_NATIVE_OMP=0`, `BILI_NATIVE_OPENCODE=0`, `BILI_NATIVE_DSH=0`, `BILI_NATIVE_KIMI=0`, `BILI_NATIVE_HERMES=0`, `BILI_NATIVE_ZCODE=0`.

## Proxy reuse and the attach gate (#1225, #1335, #1232)

A native hook may attach to an already-running proxy instead of spawning its own — only when it passes the lifecycle gate below. Reuse is identity-based (#1225): an existing proxy is attached only when it runs the **same code** (sha256 of the entry script, recorded in the instance file), its **lane is compatible** — each launcher declares its client's lane, two *different declared* lanes never share, and an instance without a declared lane is wildcard-compatible on that axis — **and it owns a session lifecycle**: its health endpoint reports an armed parent-pid watchdog (`watchdog.armed == true`), i.e. it was spawned by a launcher with a parent pid and dies when the last attached session dies. Instances written before #1225 carry no code fingerprint and are therefore never attached: a rebuilt or updated install always starts a fresh proxy on the next launch, so fixes take effect immediately instead of silently serving stale code.

| Listener | Attaches? | Why |
|---|---|---|
| Proxy spawned by this session | ✅ | armed at birth |
| Another session's armed shared proxy (watcher set, #1186) | ✅ | sharing is by design |
| Manually started `bili start` daemon | ❌ by default | no lifecycle owner (refuses watcher registration, never dies with sessions, often runs an older build — the cause of #1322) |

The hook probes each candidate's `/__bili/health` for `watchdog.armed` before attaching: armed → attach and register a watcher (unchanged); unarmed, or a pre-#1330 build that reports no `watchdog` field at all (unverifiable, treated as unarmed) → do **not** attach; the session spawns its own ephemeral proxy (ephemeral port, armed at birth, dies with the last session, #1186 watcher semantics). This also fixes version skew: every session runs the **currently installed** bili instead of stale daemon code. Cost: one extra short-lived proxy process per session when no armed proxy exists (session state is shared on disk, so compression continuity is unaffected); the multi-instance warning (#394) becomes correspondingly more common. **Escape hatch:** deliberately run a resident daemon for your hooks to ride on → set `native.attachExternal: true` in the config file or `BILI_NATIVE_ATTACH_EXTERNAL=1`. That restores attaching to any compatible listener regardless of watchdog state — you then own the daemon's lifetime and version yourself. Explicit user-directed attaches (`BILLION_CONTEXT_ATTACH` / preset `BILLION_CONTEXT_PROXY` for kimi/dsh) bypass discovery entirely and are exempt by construction.

Attach discovery is lane-aware across **all** live instances (#1232): the launcher probes every live entry in the instance registry, not just the single instance file (last-writer-wins — under concurrent multi-client use it can point at another client's proxy), and applies the gate above to every candidate. Among compatible candidates the newest instance with the launcher's own declared lane wins; an instance without a lane is wildcard-compatible on the lane axis (still subject to the gate). The `another bili instance is running` warning (#394) is lane-aware too: it fires for same-lane or lane-less coexistence, but stays silent between two *different* declared lanes, whose session files are disjoint.

## Runtime-info protocol (#955)

A native plugin lives inside the client process, so it can read the model
config the client itself will use. It pushes that truth to the proxy on two
channels, and the proxy prefers it over the models.dev registry / built-in
table in the context-window chain:

| Channel | When | Fields |
|---|---|---|
| Per-request headers (gated on `x-bili-plugin`) | every model request | `x-bili-plugin-context-window`, `x-bili-plugin-max-output`, `x-bili-plugin-model` |
| `POST /__bili/plugin/runtime-info` (loopback) | plugin bootstrap + any reported-config change | `{agent, model, contextWindow?, maxOutput?, baseURL?, conversationId?, source}` |

Resolution order for the window: `anthropic-beta` negotiation > per-request
plugin header > runtime-info > launcher env > route config > models.dev
registry > built-in table. The runtime-info step reads the **per-agent
entry** when the request carries an `x-bili-plugin` header (agent+model must
match); requests without one resolve the **conversation-scoped entry**
recorded with a `conversationId`, keyed by the same conversation signal the
session binds on (client conversation header, custom session header, or the
body's `prompt_cache_key`) — model must match either way (#1531: omp stamps
`prompt_cache_key` but no plugin header, and main/subagent sessions share
the agent name while running different models). A reported `maxOutput` only
stands in when the request body carries no output budget of its own.
Implementations: `src/agent/pi.ts` (covers pi and omp),
`src/agent/opencode-native.ts` (v1), `src/agent/opencode-v2.ts`,
`src/agent/dsh-native.ts`, `src/kimi/native-mcp.ts` (bootstrap-time report
only — kimi's provider `custom_headers` are static, so per-request headers
would go stale on model switch), `hermes-plugin/__init__.py` (Python plugin:
per-request headers via an `llm_request` middleware, max output captured by a
`pre_api_request` hook) — other client integrations should follow the same
protocol.

The launcher env tier covers pure-proxy clients (no in-process plugin):
`bili <client>` reads the client's own model config at launch
(`model_context_window` / `model_max_output_tokens` for codex,
`contextWindow` / `maxTokens` for pi / omp, `limit.context` / `limit.output`
for opencode, `maxInputTokens` / `maxOutputTokens` for codebuddy) and hands
it to the proxy via `BILI_LAUNCHER_MODEL_WINDOWS` / `BILI_LAUNCHER_MODEL_MAX_OUTPUTS`
(#971). A plugin report — when present — always outranks it.

Before the first model request there is no session yet, so the `/acp` panel
probes `GET /__bili/plugin/status?conversationId=<agent>&fallback=latest`,
which answers from the runtime table (`phase: "pre-first-request"`) instead
of 404ing — the reported config is visible immediately, and the real session
takes over once traffic lands.

## Claude native posture (#964)

Claude Code has no in-process extension point, so `bili plugin install
claude` writes a managed block into `~/.claude/settings.json` (env
`ANTHROPIC_BASE_URL=http://127.0.0.1:48787/bili/<upstream>`,
`DISABLE_AUTO_COMPACT=1`, and a `SessionStart` hook) plus the same
user-scope MCP shell as before, now pinned to that stable port. The hook
(fired before claude's first model request) attaches to a healthy proxy on
the port or spawns one whose pid watchdog tracks claude itself, so the
proxy lives and dies with the session. Port override:
`BILI_CLAUDE_NATIVE_PORT` > config `claude.nativePort` > 48787; upstream
override: `BILI_CLAUDE_UPSTREAM` (or the existing `claude.anthropicBaseUrl`
config). Opt out with `BILI_NATIVE_CLAUDE=0` — the hook then brings up a
**passthrough** proxy on the same port (verbatim forward, compression off)
so claude keeps working. The block is pure JSON merge/strip: foreign keys
are never touched, `bili plugin remove claude` restores exactly. `bili
claude` still works on a machine with the native block installed — it
overrides the static URL with its own ephemeral proxy and the hook stays
dormant.

## Injection priority — no files unless unavoidable (#535)

bili never owns user data: every launched client runs on its **real home**, so
runtime writes land where the user expects them. When pointing a client at the
proxy, the launcher picks by priority — **env vars first** (proxy/CA envs for
hermes/dsh/codex; the `BILI_PROVIDER_REWRITES` URL manifest for pi/omp,
consumed by their extension's `registerProvider` at load), then **CLI flags or
extension APIs** (codex `-c key=value`, opencode plugin), and **generated files
last** — today only opencode's temp `opencode.json` (deleted on exit) and dsh's
loopback exception: dsh's fetch stack bypasses proxy envs for loopback targets
unconditionally, so local upstreams keep the persistent `~/.dsh-bili` overlay
rewrite until dsh gains a settings-path env or an upstream loopback opt-out.
Overlay dirs created by older versions are left in place and never merged back
into the real home.
