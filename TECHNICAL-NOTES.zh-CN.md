# 技术细节

README 三种使用方式背后的机制级说明。README 里每种方式只保留简洁的用法;「它到底怎么工作」的内容都放在这里,而不是夹在三种方式中间。

## 原生插件生命周期(方式 1)

插件加载时**自拉起自己的代理**(已有健康实例则直接复用 —— 父进程 pid 看门狗在客户端退出时收掉它),把模型流量改写到 `<proxy>/bili/<上游URL>`,把 `compress` / `decompress` / `acp_status` 注册为客户端原生工具(plugin 模式),并把 `/acp` 面板绑定到当前会话。插件还会把客户端**自己的模型配置**上报给代理(runtime-info 协议,#955),压缩预算用真实窗口而不是注册表猜测。退出开关:`BILI_NATIVE_PI=0`、`BILI_NATIVE_OMP=0`、`BILI_NATIVE_OPENCODE=0`、`BILI_NATIVE_DSH=0`、`BILI_NATIVE_KIMI=0`、`BILI_NATIVE_HERMES=0`、`BILI_NATIVE_ZCODE=0`。

## 代理复用与附着门禁(#1225、#1335、#1232)

原生 hook 可以附着到已在运行的代理而不自己拉起 —— 仅当通过下面的生命周期门禁。复用基于身份(#1225):只有当既有代理运行的是**同一份代码**(入口脚本 sha256,记录在实例文件里)、**lane 兼容**(每个启动器声明其客户端 lane,两个*不同声明的* lane 永不共享;未声明 lane 的实例在该轴上通配)、**且拥有会话生命周期**(健康端点报告 armed 父进程 pid 看门狗 `watchdog.armed == true`,即由带父 pid 的启动器拉起、随最后一个附着会话消亡)时才附着。#1225 之前写入的实例没有代码指纹,因此永不附着:重建或更新后的安装下次启动总会拉起新代理,修复立即生效而不是静默服务旧代码。

| 监听者 | 附着? | 原因 |
|---|---|---|
| 本会话拉起的代理 | ✅ | 出生即 armed |
| 其他会话的 armed 共享代理(watcher 集,#1186) | ✅ | 共享本就是设计 |
| 手工 `bili start` 常驻守护进程 | ❌ 默认不附着 | 无生命周期属主(拒绝 watcher 注册、不随会话退出、常是旧版本代码 —— #1322 的成因) |

hook 附着前先探测候选者 `/__bili/health` 里的 `watchdog.armed`:armed → 附着并注册 watcher(现状不变);unarmed、或 pre-#1330 构建根本不报 `watchdog` 字段(不可验证,按 unarmed 处理)→ **不附着**,本会话自拉起一个临时代理(临时端口、出生即 armed、随最后一个会话消亡,#1186 watcher 语义)。顺带修掉版本偏斜:每个会话跑的都是**当前安装的** bili,而不是陈旧守护进程携带的旧代码。代价:无 armed 代理时每会话多一个短命代理进程(会话状态在磁盘上共享,压缩连续性不受影响);多实例告警(#394)相应变多。**逃生舱:** 刻意用常驻守护进程承载原生 hook → 配置文件设 `"native": { "attachExternal": true }` 或 `BILI_NATIVE_ATTACH_EXTERNAL=1`,恢复对任何 code/lane 兼容监听者的附着(守护进程的寿命与版本由你自己负责)。kimi/dsh 的显式用户指定附着(`BILLION_CONTEXT_ATTACH` / 预置 `BILLION_CONTEXT_PROXY`)完全不经过发现路径,构造上豁免。

附着发现在**所有**存活实例间是 lane 感知的(#1232):启动器探测实例注册表里的每一条存活记录,而不只是单个实例文件(last-writer-wins —— 并发多客户端下它可能指向别的客户端的代理),并对每个候选应用上面的门禁。兼容候选中,lane 与启动器自身声明一致的最新实例胜出;未声明 lane 的实例在 lane 轴上通配(仍受门禁约束)。`another bili instance is running` 告警(#394)也是 lane 感知的:同 lane 或无 lane 共存时触发,两个*不同声明* lane 之间保持沉默(它们的会话文件互不相交)。

## Runtime-info 协议(#955)

原生插件就在客户端进程里,因此能读到客户端自己将要使用的模型配置。它通过两个通道把真相推给代理,代理在上下文窗口解析链里优先采用它而不是 models.dev 注册表/内置表:

| 通道 | 时机 | 字段 |
|---|---|---|
| 逐请求头(门控在 `x-bili-plugin`) | 每次模型请求 | `x-bili-plugin-context-window`、`x-bili-plugin-max-output`、`x-bili-plugin-model` |
| `POST /__bili/plugin/runtime-info`(回环地址) | 插件自举 + 任一上报字段变更 | `{agent, model, contextWindow?, maxOutput?, baseURL?, conversationId?, source}` |

窗口解析顺序:`anthropic-beta` 协商 > 逐请求 plugin 头 > runtime-info > launcher 环境变量 > 路由配置 > models.dev 注册表 > 内置表。runtime-info 这一步:带 `x-bili-plugin` 头的请求读**按 agent 的条目**(agent+model 必须匹配);不带该头的请求解析以 `conversationId` 记录的**会话级条目**,键与会话绑定的同一会话信号一致(客户端会话头、自定义 session 头或请求体的 `prompt_cache_key`)—— 无论哪种,model 都必须匹配(#1531:omp 打 `prompt_cache_key` 但不打 plugin 头,且主/子代理会话共用 agent 名却跑不同模型)。上报的 `maxOutput` 仅在请求体自带输出预算缺席时兜底。现有实现:`src/agent/pi.ts`(覆盖 pi 与 omp)、`src/agent/opencode-native.ts`(v1)、`src/agent/opencode-v2.ts`、`src/agent/dsh-native.ts`、`src/kimi/native-mcp.ts`(仅自举时上报 —— kimi 的 provider `custom_headers` 是静态的,逐请求头会在模型切换后过期)、`hermes-plugin/__init__.py`(Python 插件:经 `llm_request` 中间件打逐请求头,`pre_api_request` hook 捕获最大输出)—— 其他客户端接入请遵循同一协议。

launcher 环境变量这档覆盖纯代理客户端(无进程内插件):`bili <client>` 启动时读客户端自己的模型配置(codex 的 `model_context_window` / `model_max_output_tokens`,pi / omp 的 `contextWindow` / `maxTokens`,opencode 的 `limit.context` / `limit.output`,codebuddy 的 `maxInputTokens` / `maxOutputTokens`),经 `BILI_LAUNCHER_MODEL_WINDOWS` / `BILI_LAUNCHER_MODEL_MAX_OUTPUTS` 交给代理(#971)。插件上报 —— 若存在 —— 永远优先于它。

首次模型请求之前会话尚不存在,`/acp` 面板会探测 `GET /__bili/plugin/status?conversationId=<agent>&fallback=latest`,代理从 runtime-info 表应答(`phase: "pre-first-request"`)而不是返回 404 —— 上报的配置立即可见,流量落地后由真实会话接管。

## Claude 原生姿态(#964)

Claude Code 没有进程内扩展点,所以 `bili plugin install claude` 往 `~/.claude/settings.json` 写一个受管块(env `ANTHROPIC_BASE_URL=http://127.0.0.1:48787/bili/<upstream>`、`DISABLE_AUTO_COMPACT=1`、`SessionStart` hook),外加同样指向该稳定端口的用户级 MCP shell。hook 在首个模型请求前触发:附着到端口上健康的代理,或拉起一个 pid 看门狗追踪 claude 本身的代理 —— 代理随会话生灭。端口覆盖:`BILI_CLAUDE_NATIVE_PORT` > config `claude.nativePort` > 48787;上游覆盖:`BILI_CLAUDE_UPSTREAM`(或既有 `claude.anthropicBaseUrl`)。`BILI_NATIVE_CLAUDE=0` 退出 —— hook 改为拉起同端口的 **passthrough** 代理(原样转发、关闭压缩)。块是纯 JSON merge/strip:外部键从不触碰,`bili plugin remove claude` 精确还原。装有原生块的机器上 `bili claude` 仍可用 —— 它用自身临时代理覆盖静态 URL,hook 保持休眠。

## 注入优先级 —— 能不写文件就不写(#535)

bili 永不拥有用户数据:每个被启动的客户端都跑在**真实 home** 上,运行期写入落在用户预期的位置。把客户端指向代理时,启动器按优先级选择——**优先 env 变量**(hermes/dsh/codex 的代理/CA env;pi/omp 的 `BILI_PROVIDER_REWRITES` URL 清单,由扩展加载时经 `registerProvider` 消费),其次 **CLI 参数或扩展 API**(codex `-c key=value`、opencode 插件),最后才是**生成文件**——目前仅剩 opencode 的临时 `opencode.json`(退出即删)和 dsh 的回环例外:dsh 的 fetch 栈对回环目标无条件绕过代理 env,所以本地上游保留持久 `~/.dsh-bili` overlay 改写,直到 dsh 提供 settings-path env 或上游支持回环 opt-out。旧版本创建的 overlay 目录原地保留,绝不合并回真实 home。
