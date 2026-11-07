# Wuji / 无极 — 竞品与同类探索调研

> 调研时间：2026-10-19
> 调研命题：谁在解决「线性对话无法承载思考与执行过程」和「CUI 无法按内容形态切换界面形态」这两个问题。

---

## TL;DR

1. **这不是无人区，是已经打得热闹的公开议题。** 学术上，《Software as Content》这篇 2026 年的论文把我们的问题几乎原样写了一遍；产业上，微软亚研院的 Huabu 和 Fellou CE 在做几乎同一命题。Wuji 不是发现了新问题，是要在一个已被验证的赛道上找到自己的切口。

2. **「无限画布 + AI」本身已经完全不稀缺。** Flowith、即梦、Pixmax、tldraw 生态……一大堆。Wuji 如果只做「无限画布 + 节点 + 连线 + agent」，没有任何壁垒。

3. **真正稀缺的是「多态节点」。** 市面上所有画布的节点本质上都还是*内容块*（文本块、图块、视频块），不是*自带交互形态的对象*。协议层（A2UI / AG-UI / MCP Apps）已经在 2026 年把「agent 输出 UI」标准化了，但**几乎没有人把它铺进空间场域**。这是 Wuji 的窗口。

---

## 一、赛道地图：四个层次

| 层 | 在争什么 | 成熟度 | 对 Wuji 的意义 |
|---|---|---|---|
| **L1 思想/学术** | 问题的定义权 | 已被占（论文已发） | 必须读，避免重复论证 |
| **L2 协议** | agent↔界面 的标准 | 已成标准战，接近收敛 | **可直接借力，别自建** |
| **L3 产品** | 用户心智 | 头部已形成（Flowith / 大厂 Canvas / Fellou） | 差异化窗口在这里 |
| **L4 开源/基建** | 画布引擎、agent 操作画布 | 非常成熟 | **可直接白嫖** |

---

## 二、L1 · 思想与学术层：问题已被写死

### 2.1《Software as Content: Dynamic Applications as the Human-Agent Interaction Layer》

**arXiv 2603.21334**（2026）· Mulong Xie, Yang Xie（通讯邮箱 `xieyang@fellou.ai`）

这篇论文是本次调研最重要的发现——它提出的三个限制，与 Wuji 的「问题二」措辞几乎一致：

- **Representation mismatch**：聊天是线性通道，结构化信息（对比表、空间关系、层级）必须被序列化成散文，结构在压平过程中丢失。反向同理——用户意图常是参数化的（「更便宜」「离机场更近」），却必须包成完整句子。
- **Interaction entropy**：每一轮用户面对一个空输入框和整个自然语言空间，没有可外部化的「当前能做什么」的表示。
- **Ephemeral interaction state**：中间产物只以滚动历史存在。

**它明确点名批评了现有方案**——包括 Claude Artifacts 和 OpenAI Canvas：这些系统把 artifact 当作 *display surface*（展示面），而非 *bidirectional channel*（双向通道），且是 single-turn artifact，不跨轮次演化。

主张：动态生成的应用作为持久、双向、有状态的交互层；结构化 affordance（filters / selectors / triggers）+ 常驻自然语言通道的**双通道模型**；状态增量更新 `s_{t+1} = s_t ⊕ Δ` 而非整体重生成；多轮后收敛为 *personalized software*。

**对我们的价值与警告：**
- 价值：学术论文背书，可直接引用其问题陈述和设计原则（§3.5）。
- 警告：论文自己也给了 **boundary conditions**——情感支持、早期概念探索这类场景，自然语言仍然更优。**不要把「反聊天」做成教条**，SaC 保留了常驻自然语言通道，Wuji 的召唤栏正是这个角色。

链接：<https://arxiv.org/html/2603.21334v1>

### 2.2 Wavespace「Beyond the Chatbox」框架（2026-09）

五条原则，与 Wuji 新加的 principle 6/7 高度重合：

1. **Visible agent reasoning** — 可折叠的推理轨迹 + 每步依据的证据，可审查而非埋藏
2. **Clear state management** — agent 状态（pending / in-progress / done）是一等 UI 元素，不是对话历史的隐式属性
3. **Explicit trust cues** — 置信度、来源、是否已验证；未验证输出不能与已确认数据同等视觉权重
4. **Human approval checkpoints** — 审批是一等 UI 原语，agent 提议、人类处置，且要显示动作范围与可逆性
5. **Task-specific interfaces** — 表单/表格/日历/diff/地图按任务给界面，**聊天是 fallback 不是 default**

⚠️ 注意第 3 条：**Wuji 当前原型没有信任线索**。节点无论来源都是同一张纸卡。

### 2.3 Spatial UI（SUI）已成为品类词

奇绩创坛的综述预测 2026 年 AI 创作的主流界面从聊天框进化为「无限画布式 UI」即 Spatial UI，认为它让创作过程可随时回溯、分叉、并发。代表平台：Lovart、Krene、TuneeAI、OiiOii。

社区共识里有一条对我们很关键：**空间化界面会显著提高初学者的认知负担，因此高质量的视觉关系引导是必需的**。这直接支持 Wuji 的「Calm infinity」原则。

---

## 三、L2 · 协议层：生成式 UI 已经是一场标准战（这是可以直接捡的弹药）

2026 年这个领域最重大的变化：**「agent 输出界面」已经被标准化了**。四个协议，四个层：

| 协议 | 主导方 | 定位 | 渲染模型 | 状态 |
|---|---|---|---|---|
| **AG-UI** | CopilotKit（开源） | agent runtime ↔ frontend 的**运行时协议** | 事件流，前端自选组件 | ~14.7k★；LangGraph、CrewAI、Microsoft Agent Framework、Google ADK、AWS Strands、Pydantic AI、LlamaIndex 均已采纳 |
| **A2UI** | Google | agent ↔ renderer 的**声明式 UI 格式** | JSONL blueprint，宿主用原生组件渲染 | v0.9.1 stable（v1.0 RC），~15k★，Apache 2.0；React / Angular / Lit / Flutter 官方 renderer |
| **MCP Apps** | Anthropic | MCP 的官方扩展（SEP-1865），由社区 `mcp-ui` 演化 | `ui://` URI 资源，**沙箱 iframe** | 2026-01-26 发布，已在 Claude 上线；launch apps 含 Slack、Figma、Asana |
| **OpenAI Apps SDK / ChatKit** | OpenAI | tool 调用返回 app UI | ChatGPT 内应用 | 目录 2026-07 开放广泛提交 |

另有 **A2A**（Linux Foundation，agent↔agent，可承载 A2UI payload）和 **OpenUI Lang**（声明式，号称比 JSON 省 67% token）。

### 三者关系（很重要，别搞混）

- **AG-UI = 管道**（transport），**A2UI = 内容**（UI format）。互补：AG-UI 有 day-zero A2UI 兼容性。
- **MCP Apps = 沙箱应用**，宿主渲染可能不可信的远程 HTML，因此强制 iframe 沙箱 + postMessage 校验 + CSP。
- 安全梯度：**A2UI 攻击面最小**（声明式数据 + 可信 renderer 目录，无代码执行）< MCP Apps（iframe 隔离）< 完全开放式代码生成。

### 对 Wuji 的直接意义

**A2UI 的设计几乎就是为多态节点量身定做的：**

- 用 **flat adjacency list** 而非嵌套组件树 —— 可增量流式传输，单个组件可独立修正而不用整树重生成。**这天然适合「节点逐步长出来」的动画与流式渲染。**
- 数据绑定走 **JSON Pointer (RFC 6901)**。
- 样式由宿主应用控制，继承设计系统 —— 意味着我们可以让 A2UI 渲染出的控件长成 Wuji 的纸质卡片风格，而不是 Google 风格。

**建议：不要自建 UI 描述语言，直接对接 A2UI / AG-UI。** 这是 2026 年最不该重复造的轮子。

---

## 四、L3 · 产品层

### 4.1 画布优先的 Agent 工作空间 —— 最直接竞品

#### Flowith（清华《全球通用智能体竞争研究报告 2026》列为产品层三强之一）

定位：**canvas-first agent workspace**，目标心智是「AI Agent Operating System」。

- **Canvas + Nodes + Recipe + Knowledge Garden**（RAG 长期记忆）+ **Agent Neo**（自主多 agent）
- 两种交互模式：**Follow-up First**（点节点继承整条链路上下文）／ **Quote First**（多点几个节点作为引用一次性提问）
- **Canvas Cowork**（MIT 开源）：`npx skills add flowith-ai/canvas-cowork`。通过 WebSocket bridge，让 Claude Code / Codex / Cursor / OpenClaw 等 **30+ agent 直接在画布上建节点、注入素材、接连线**。支持 chain / branch / fork、`submit-batch` 并行、多 agent 同画布各自游标。
- **Cross-canvas recall**：让 agent 检索历史画布，把上周做的东西拉进当前工作区。

**它的缺口（=我们的机会）：** 节点形态仍然是**内容块**——文本、图片、视频、网页原型。它解决了「空间化」，但没解决「形态适配」。一个表格在 Flowith 上仍然是一块文本。

#### PenEcho（开源）

20000×20000 无限画布 + 手写/公式/草图 + AI 空间推理。**两个设计决策值得直接借鉴：**

1. **稀疏瓦片渲染**：逻辑尺寸巨大，但只在有笔迹处分配 512×512 瓦片；且只把有内容的区域裁剪后发给 AI，不是整张画布。
2. **AI 回复与已确认内容隔离**：AI 产物以「草案」形式出现在画布上，可移动、缩放，**确认后才并入工作区**。

第 2 点对 Wuji 极有价值——它天然实现了 Wavespace 的「trust cues」：未确认 vs 已确认，视觉上就该是两种东西。

### 4.2 大厂的分栏 Canvas —— 只解决「编辑」，不解决「过程」与「形态」

- **Gemini Canvas**（2025-03-18 上线）：左聊天、右成品；可生成文档 / 应用 / 网页 / 信息图 / 测验，支持定点编辑（只改选中段落）、导出 Docs / Colab、分享链接。
- **ChatGPT Canvas**、**Claude Artifacts**：同类分栏形态。

**SaC 论文的批评正适用于它们**：artifact 是 display surface 而非 bidirectional channel，是 single-turn artifact 而非跨轮次演化的交互层。

对 Wuji 的启示：**「左聊右改」不是终点，它仍然把对话当成容器。** 我们的差异是让成品之间产生空间关系。

### 4.3 空间化 Agent 浏览器 —— 🔴 撞车预警（最高）

#### Fellou CE（2025-09-02 发布，「全球首个空间化 agentic browser」）

引入 **Z 轴**，把扁平浏览器变成空间工作区：

- **Fellou Home**：三维中枢，组织书签、历史、本地文件、任务列表
- **Dynamic Multitasking**：为 agent 活动自动开辟**专用空间分区**，人机操作分离但可协作
- **Parallel Multi-Agent Operations**：多 agent 在各自空间层并行研究、起草、分析
- 三条转变主张：prompt-response → **task decomposition & planning**；cloud agent → **local-first**；unstructured text → **actionable visualization**

⚠️ **SaC 论文的第二作者邮箱就是 `fellou.ai`** —— 学术与产品是同一套人马。这是目前命题重合度最高的对手。

### 4.4 空间化 Agent 研究 —— 🔴 撞车预警（高）

#### 微软亚洲研究院 · Huabu

「把人与 Agent 的协作，从线性聊天框搬到一个无边界的二维空间」：

- 网页、PDF、图片、笔记集中在同一空间；可自由移动、分组、缩放、建立连接
- **Agent 能理解不同内容之间的空间关系**——位置、大小、连线、分组本身成为人与 AI 交流的一部分
  - 例：把两张图放一起说「让这张和旁边那张风格一致」；把几十篇论文导入，让 agent 按研究脉络整理关系
- AI 生成的内容直接回到空间，成为下一轮思考的素材
- 从单人助手走向**多人、多 Agent 共享的智能空间**

**与 Wuji V0 的定位几乎完全重合。** 差别在于：Huabu 强调「空间关系即输入（spatial context as prompt）」；Wuji 强调「过程显形 + 形态适配」。这个差别需要被明确放大，否则就是撞车。

### 4.5 视觉创作型画布 —— 数量最多，但不构成正面竞争

即梦 AI（字节）、腾讯 Miora（2026-03，对话式画布工作流设计智能体）、Pixmax、千城 AI、Joker AIx、RunningHub、TapNow、松果 AI、LibTV、卓特视觉无限画布、Napkin AI、Miro AI、boardmix、Canva AI……

共同点：面向图像 / 视频 / 设计，节点是素材与生成任务，连线是参考关系。**价值在于验证了「画布 + agent」的商业可行性**，但场景不是知识工作。

其中 Napkin AI（文字一键转可视化图表）值得单独看一眼——它在做「形态适配」的一小部分，但只在图表这一形态上。

### 4.6 通用 Agent —— 过程可见，但不是可操作的结构

- **Manus**：任务交付型「数字同事」，过程可见（沙盒 + 时间线），**但仍是执行回放，不是可编辑的结构**
- **Genspark**：all-in-one AI workspace，Docs / Sheets / Slides / Designer 模块拼装
- **Skywork**：强在结构化交付物

共同缺口：过程是给你看的，不是给你改的。

---

## 五、L4 · 开源与基础设施（可以直接白嫖的）

| 项目 | 定位 | 对 Wuji 的相关点 |
|---|---|---|
| **tldraw**（48k+★） | 无限画布 SDK | 官方提供 **Agent Kit**（能读取/理解/**修改**画布内容的 agent）、**Chat Kit**（画布驱动的对话界面）、**Branching Chat Kit**（可视化对话分支）。DOM 画布，理论上浏览器能渲染的东西都能嵌进去。用户含 Google、Shopify、Replit、ClickUp。**如果不想自写画布引擎，这是最成熟的底座。** |
| **infinite-canvas**（AGPL-3.0，~5.1k★） | 面向 AI 图片创作的画布工作台 | 本地 **Canvas Agent** 通过 MCP 让 Codex / Claude Code 操作画布；插件系统 + TypeScript SDK 可自定义节点类型 |
| **Flowith Canvas Cowork**（MIT） | 让外部 agent 操作 Flowith 画布 | 已被 30+ agent 支持，走开放 Skills 标准 |
| **PenEcho**（开源） | 空间思维画布 | 见 4.1，草案/已确认两态设计 |
| **Excalidraw / Dify / FastGPT / LangFlow** | 白板或工作流编排画布 | 工作流编排 ≠ 工作空间，参考即可 |

---

## 六、判断：Wuji 的窗口到底在哪

### 6.1 已经不稀缺的三件事（别在这里花力气）

1. **无限画布本身** —— tldraw 48k★，开源底座极其成熟
2. **节点 + 连线 + 分支** —— Flowith、infinite-canvas 都做完了
3. **agent 能操作画布** —— Flowith Canvas Cowork（MIT）、infinite-canvas 的 MCP 都做完了

### 6.2 仍然稀缺的两件事（= 机会）

**① 多态节点（Form follows content）**

市面上所有画布的节点都还是内容块。没人做到「节点自带交互形态」——表格能透视、决策能点选、计划能勾选——并把这件事标准化。

协议层已经把弹药造好了（A2UI 的声明式 blueprint、AG-UI 的增量事件流），但**没人把它铺进空间场域**。这是 2026 年最明显的一个空档。

**② 过程即结构（Process is spatial，真正的版本）**

- Fellou：时间线回放
- Manus：执行日志
- Flowith：节点链

三者都不是「agent 的思考与执行轨迹本身成为**可编辑、可重组、可干预**的对象」。Wuji 的 principle 6 如果只做成「把步骤摆上去」，就只是 Flowith；要做出差异，必须让过程对象**可干预**——对应 Wavespace 的 approval checkpoint 和 SaC 的双向 affordance。

### 6.3 唯一的化学反应点（最值得押的差异化）

> **多态节点 × 空间组合**

一个表格节点筛选后的状态，驱动旁边图表节点重绘；一个决策节点选中的分支，决定下游哪些节点被激活；一个计划节点勾选完成，触发 agent 继续跑下一批。

这件事：
- 单页 Generative UI（如 SaC 的实现）**做不到** —— 它没有「旁边」
- 纯画布（如 Flowith）**做不了** —— 它的节点没有可交互状态
- 只有「空间场域 × 多态节点」的交点能做到

**这可能是 Wuji 唯一真正站得住的位置。**

### 6.4 撞车风险分级

| 风险 | 对象 | 说明 |
|---|---|---|
| 🔴 高 | **微软亚研院 Huabu** | 命题几乎重合，且是研究院 + 大厂资源 |
| 🔴 高 | **Fellou CE** | 空间化 agent + 学术同源（SaC 作者） |
| 🟡 中 | **Flowith** | 「画布 agent」心智已被占据，且自称 Agent OS |
| 🟢 低（但需主动借力） | **Google A2UI / Anthropic MCP Apps** | 协议层会被大厂定义。**不要自建，要对接** |

### 6.5 四条建议

1. **别再造画布引擎和 UI 描述语言。** tldraw 做画布，A2UI 做形态描述，AG-UI 做传输。全部现成。
2. **V1 把全部力气压在「多态节点」一件事上。** 先定 6–8 种节点形态 + 各自的交互契约，而不是继续扩充画布手势。
3. **读透 SaC 论文，尤其是它的 boundary conditions。** 什么时候自然语言更好？答错这个，产品会变成教条。
4. **补上「信任线索」和「审批检查点」。** Wavespace 五原则里，Wuji 目前只有第 1、5 条的雏形，第 2、3、4 条完全是空的——而这三条恰恰是 agent 产品从 demo 走向可用的关键。

---

## 七、参考链接

**学术 / 思想**
- Software as Content（arXiv 2603.21334）— <https://arxiv.org/html/2603.21334v1>
- Wavespace「Beyond the Chatbox」框架 — <https://www.smfclearinghouse.com/guides/designing-agents-beyond-chatbox>
- Spatial UI 综述（奇绩创坛）— <https://news.miracleplus.com/share_link/105321>

**协议**
- AG-UI — <https://docs.ag-ui.com>
- A2UI 生态对比 — <https://a2ui.org/introduction/agent-ui-ecosystem>
- 协议地图（AG-UI / A2UI / MCP Apps / A2A）— <https://pieper.io/blog/a2ui-ag-ui-mcp-landscape>
- 2026 协议对比分析 — <https://appliedtechnologyindex.com/research/2026-comparative-analysis-agent-user-interface-protocols-generative-ui>

**产品**
- Flowith Canvas — <https://flowith.io/docs/en/canvas/node-interaction>
- Flowith Canvas Cowork（MIT）— <https://flowith.com/blog/canvas-cowork-skill>
- Flowith Canvas Evolved — <https://flowith.io/blog/canvas-evolved-habitat>
- Fellou CE 空间化浏览器 — <https://sg.finance.yahoo.com/news/worlds-first-spatial-agentic-browser-170000882.html>
- 微软亚研院 Huabu — <https://www.sina.cn/news/detail/5352168103611768.html>
- 清华《全球通用智能体竞争研究报告 2026》— <https://new.qq.com/rain/a/20260330A07IZN00>
- Gemini Canvas — <https://techdailyai.com/blog/gemini-canvas>

**开源**
- tldraw — <https://github.com/tldraw/tldraw>
- infinite-canvas — <https://github.com/basketikun/infinite-canvas>
- PenEcho 评测 — <https://www.uuaihub.com/blog/penecho-ai-canvas-review>
