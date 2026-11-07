# Wuji / 无极 — Long-term Project Notes

## What it is
A prototype of a **boundless agent workspace** (无极, tagline「没有边界，只有延展」). Replaces the single vertical chat column with an infinite spatial field where intents, evidence, plans, drafts, and actions persist as movable objects.

## Core problem it attacks (user-confirmed framing, 2026-10-18)
Two failures of conventional agent products:

1. **Linear conversation cannot represent thinking and execution.** A chat column is a 1-D timeline; real agent work fans out, cross-checks, holds intermediate conclusions, and revises. The transcript flattens it — structure lost, intermediate artifacts buried, process unauditable, nothing reusable.
2. **CUI cannot adapt its interface to the shape of the content.** Chat is one container for every content type. Datasets, plans, decisions, and diagrams each need their own interaction surface, but CUI flattens them into text/code blocks, degrading interaction to copy-paste.

Shared root: **the conversation is the container.** Wuji inverts it — container is a spatial field; a response is an object carrying its own interaction surface.

## Product principles
No forced column · Objects over messages · Context is visible · Calm infinity · Universal entry · **Process is spatial** · **Form follows content**

## Tech / structure
- Pure front-end prototype: `prototype/index.html` (single file).
- Local preview: `cd prototype && python3 -m http.server 4173` → http://localhost:4173
- No real model calls yet — interaction-shape validation stage.
- Docs: `README.md` (how to run), `PRODUCT.md` (positioning + core problem + principles), `DESIGN.md` (visual world / tokens), `RESEARCH.md` (competitive landscape), `NODES.md` (polymorphic node contract).
- 八形态契约见 `NODES.md`，**已在原型落地**（2026-10-19）。
- 现行 node schema：`{id, kind, status(draft|confirmed), title, x, y, confidence, sources[], updated, data{...}}`；link：`{from, to, kind}`（derived/binds/triggers/supports）。旧 `type` 字段经 `legacyType` 迁移。
- 原型用**事件委托**（world 上的 click/change/input + `[data-act]`），DOM 重建不丢监听；`refreshNode(id)` 用于局部重渲染。
- localStorage key 为 `wuji.field.v2`（v1 数据结构已废弃）。
- 形态色：intent=accent、trace=jade、evidence/table=sky、plan=gold、decision=iris、action=clay、note=灰。

## Competitive landscape (调研 2026-10-19，详见 RESEARCH.md)
- 学术占位：arXiv 2603.21334《Software as Content》已把 Wuji 的两个问题写成论文（representation mismatch / interaction entropy / ephemeral interaction state），并批评 Artifacts 与 Canvas 只是 display surface。
- 最高撞车风险：微软亚研院 **Huabu**（无边界二维空间 + agent 理解空间关系）、**Fellou CE**（spatial agentic browser，Z 轴；SaC 论文作者来自 fellou.ai）。
- 最直接竞品：**Flowith**（canvas-first agent workspace，清华 2026 报告列为产品层三强；Canvas Cowork MIT 开源，30+ agent 可操作画布）。缺口：节点仍是内容块，无多态形态。
- 协议层已收敛，勿自建：AG-UI（传输）/ A2UI（Google 声明式 UI，flat adjacency list 增量流式）/ MCP Apps（Anthropic iframe 沙箱）/ OpenAI Apps SDK。
- 开源底座：tldraw 48k★（Agent Kit / Chat Kit / Branching Chat Kit）、infinite-canvas（AGPL，MCP Canvas Agent）、PenEcho（草案/已确认两态）。
- **Wuji 的差异化窗口 = 多态节点 × 空间组合**（节点状态互相驱动）。单页 Generative UI 做不到「旁边」，纯画布做不到「可交互状态」。
- 当前缺口：无 trust cues、无 approval checkpoint（Wavespace 五原则第 2/3/4 条为空）。

## ★ 根源问题（2026-10-20 用户重新定义，优先于其他所有议题）
**跟 Agent 对话时会有发散，但同时有主线。** 场景：Agent 回答 A → 用户对 A 有**疑问** → 也会**发散** → **同时**还要让 A 继续往下执行。

- 三类东西被平权了：**主线**（继续推进）/ **疑问**（针对 A 的质询）/ **发散**（从 A 长出去的新线）。
- 四个真实痛点：**阻塞**（有疑问主线就得停）、**污染**（旁支内容混进主线上下文）、**关系丢失**（追问的答案本该修正 A 却与 A 无结构关系）、**回不来**（发散完怎么回主线）。
- 聊天流：三者混在一条时间线，主线被冲散。**画布：三者都是平权节点，画布没有主干与枝叶的概念——把混乱从一维搬到二维，没解决根源。**
- 前几轮讨论的「顺序 / 折叠 / 依赖 / 形态」都没触及这一点：谈的是结构怎么摆，不是结构里的**权重**。

### 解法：主线 + 两种旁支槽
- 每个节点挂两类旁支：疑问 `?` 与发散 `↗`，虚线连接表示弱耦合
- 旁支**独立上下文**（agent 只看到该节点 + 旁支历史）→ 不污染主线
- **不阻塞**：主线继续跑，旁支悬着，节点显示未解决计数
- **可并入**：疑问答案更新 A 的内容/置信度/来源；发散成果升级为主线节点或丢弃
- 两个额外收获：**疑问旁支 = 活的 trust cue**（不是看置信度数字，是真的能问，问完更新它）；**顺手缓解隐式依赖**（上下文隔离，改动不外溢除非显式并入）
- 与活文档兼容：**正文（主线）/ 脚注（疑问）/ 附录（发散）**

## 形态方向的重大判断（2026-10-20）
- **画布不是终点形态，是探索态**：画布适配度 ∝ 结构不确定性（结构未知 95 分 → 完全确定 15 分），交叉点在「初步成型」。有序视图反之。
- **画布最深的病灶**：x/y 是无语义状态。用户手工摆放隐式表达结构，用户累、系统学不到；自动布局则退化成 DAG 编辑器。两难。
- **推荐形态：以大纲为骨架的活文档**（顺序天然 / 折叠即收口 / 形态在块内 / **依赖用引用表达**）。引用是文本原生的，可跳转可搜索，不需要摆放。
- **画布降为视图之一**，默认视图为有序文档。方法论一致：节点的形态是视图，场域的组织方式也是视图。
- 其他候选：电子表格（依赖处理最优雅，仅适合作局部形态）、Notebook（可重跑最贴合 Trace，但依赖自动推断与「手动绑定」冲突）。
- 与立论不冲突：Wuji 反对的是**聊天流**（时间追加、不可重组的日志），不是文档（可编辑可重组的结构）。

## 已知方案代价（批判性清单，2026-10-19）
- **结构性（只能取舍）**：空间无阅读顺序（注意力由滚动转导航，>15 节点失控）· 无限即永不收口（缺完成与版本）· 多态会削足适履（文本是通用降级层，路由误判代价高于纯文本）· 隐式依赖让人不敢动（Excel 公式链之痛）· 概率 AI × 确定性绑定是根本张力 · 只在复杂任务上划算（demo 难自证，市场窄）· 丢叙事与低成本表达 · 状态爆炸（undo/复现/分享成本高）· 协作与无障碍难。
- **可缓解（工程）**：空白画布恐惧 · 节点检索 · 平移缩放成本 · 形态一致性 · 依赖可视化 · 移动端需另一套线性视图。
- **推论**：做 `binds` 运行时之前必须先做「影响范围可见」，否则直接撞上隐式依赖问题。

## ★ V2 总体方案已定稿：BLUEPRINT.md（2026-10-20 晚产出，33KB，11 章）
架构一句话：**一个数据模型（体），多重视图投影（相），一套交互与 Agent 契约（用）。**
产品一句话：**无极不是画布也不是聊天，是一份由 Agent 共同书写的活文档。**

- **体 = WDoc**：有序 `blocks[]`（顺序即主线，用户唯一持序）+ `refs`（引用，四种语义）+ `tangents`（旁支）+ 签署（`contentHash`）+ `viewStates` + op log。**x/y 移出数据模型，进 viewStates** —— 根治「位置无语义」。
- **相 = 三视图**：**卷**（文档流，默认·交付态）/ **野**（画布，探索态）/ **谱**（引用关系表，可审计）＋ 线性兜底。卷↔野用 FLIP 连续形变（换景 650ms）。块身份跨视图共享。
- **用**：双入口（问＝轻量 / 书＝入卷）· 旁支槽（? 疑问 / ↗ 发散，独立上下文、不阻塞、可并入留痕）· 聚焦链（只给局部顺序）· 确认即签署（朱印 + signedHash，上游变化只产脏标记，绝不静默传播）· binds 只由人建、只绑 confirmed、传播必 diff 预览 · Action 审批账本（scope/reversible/undoToken）。
- **Agent 契约**：AG-UI 传输 + A2UI v1 蓝图 → `a2ui-host` 渲染纸质组件；形态路由降级为**建议**；ContextPack 记录让「agent 看到了什么」可审计；Trace 可暂停/改参重跑（给你**改**的，不只是给你看的）。
- **工程**：pnpm monorepo —— `core`（纯 TS 零框架）/ `kinds`（KindSpec 注册表）/ `views` / `a2ui-host` / `agent-runtime`；Zustand + 自研 op log（undo/快照/分享/CRDT 四合一）+ IndexedDB。三注册表（KindSpec/ViewSpec/LinkSpec）为扩展骨架。
- **视觉**：夜观星台 → **夜野与纸卷**双景；导出称「誊卷」（夜观星象，晨誊卷册）；五个签名时刻（召唤/物化/签署/换景/聚焦）为动效北极星。
- **路线图 P0–P5**：P0 卷骨架 → P1 旁支与签署 → P2 换景（野视图 + 15/30 节点可证伪检验）→ P3 真模型 → P4 组合与审批 → P5 扩展与出口。
- **截至 2026-10-21：方案层收口完成，工程代码为零（未建 monorepo），下一动是 P0。**

## Design world
"Night observatory / cartographer's table" — deep ink night canvas (`--ink:#07080d`) with floating paper cards (`--paper:#f7f3ea`), accent `#ff5a36`, jade `#7de0c1`, gold `#e7c877`. Deliberately avoids generic AI-purple gradients. Display type: Songti SC / Noto Serif SC; UI type: Avenir Next / PingFang SC.
