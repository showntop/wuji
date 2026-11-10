# Wuji / 无极 — 多态节点形态与交互契约

> 版本：V1 draft · 2026-10-19
> 解决什么问题：**Form follows content**（原则 7）。让内容形状决定节点的界面形态与交互能力，而不是把所有内容拍平进同一张纸卡。
> 前置：`PRODUCT.md`（问题定义）、`RESEARCH.md`（竞品与差异化窗口）

---

## 0. 一句话

当前原型的节点是**内容块**——`type` 只影响角标文字，四种类型共用同一张纸卡，连线只有 `{from,to}` 没有语义。这份契约把它改成**八种自带交互形态的对象**，并定义它们之间如何互相驱动。

这是「多态节点 × 空间组合」的落点：单页 Generative UI 做不到「旁边」，纯画布做不到「可交互状态」。

---

## 1. 通用节点契约（所有形态共享）

每个形态都在同一套外壳内，外壳提供：

| 要素 | 说明 |
|---|---|
| `id` / `kind` / `title` | 身份 |
| `x` / `y` / `w` / `h` | 空间位置与尺寸 |
| `status` | **`draft` → `confirmed`**。AI 产出的一切默认为 `draft`，用户确认后并入工作区（借鉴 PenEcho） |
| `confidence` | 0–1，来源可信度 |
| `sources[]` | 支撑该节点的来源引用 |
| `updated` | 时间戳 |

**通用操作**（右键或顶栏）：复制 · 分支（从此处派生新任务）· 连线 · 固定 · 删除 · 折叠为摘要卡片。

### 信任线索（补齐 Wavespace 原则 3）

| 状态 | 视觉 |
|---|---|
| `draft` | 虚线边框 + 角标「草案」 |
| `confirmed` | 实线边框，无角标 |
| `sources` 为空且含断言 | 边框降级 + 提示「无来源」 |
| `confidence` < 0.5 | 标题旁显示置信度，不与已核实内容同等视觉权重 |

---

## 2. 八种形态

按工作链路排序：Intent → Trace → Evidence → Table → Decision → Plan → Action，Note 兜底。

### 2.1 Intent · 意图

| 项 | 内容 |
|---|---|
| **形状** | 一个目标陈述 + 一组约束 |
| **触发** | 召唤栏输入；双击空白创建 |
| **data** | `{ goal: string, constraints: string[], openQuestions: string[] }` |
| **交互** | 编辑目标；增删约束；把 openQuestion 派出给 agent |
| **输出端口** | `goal`, `constraints` |
| **视觉** | 卡片顶部实心横条——它是锚点，不是内容 |

### 2.2 Note · 笔记（兜底形态）

| 项 | 内容 |
|---|---|
| **形状** | 自由富文本 |
| **触发** | 任何无法归入其他形态的内容；用户手动创建 |
| **data** | `{ markdown: string }` |
| **交互** | 就地编辑 · **选中片段 → 「生长」成新节点**（选中一段文字，让 agent 判定其形状并生成 Table / Plan / Decision） |
| **输出端口** | `text`, `selection` |
| **视觉** | 最朴素的纸卡，无额外控件 |

> 「选中片段生长」是 *Form follows content* 最直接的手感：用户不必指定形态，内容自己决定。

### 2.3 Trace · 过程轨迹

> **这是「Process is spatial」的载体，也是 Wuji 与 Flowith 的分水岭。**

| 项 | 内容 |
|---|---|
| **形状** | agent 的思考/执行步骤序列，每步带状态与依据 |
| **触发** | agent 执行多步任务时 |
| **data** | `{ steps: [{ id, label, status, tool, evidenceRefs[], startedAt, endedAt, note }] }`<br>`status`: `pending` / `running` / `done` / `failed` / `skipped` / `awaiting-approval` |
| **交互** | 展开/折叠单步 · **暂停** · **跳过某步** · **修改某步参数后从该步重跑**（上游不变）· 对有副作用的步骤**批准/拒绝** |
| **输出端口** | `completedSteps`, `failedSteps`, `currentStep` |
| **视觉** | 竖向步骤条；状态用符号与色条，不用文字堆砌 |

关键区别：Fellou 是**时间线回放**，Manus 是**执行日志**，Flowith 是**节点链**——三者都是给你看的。Trace 是给你**改**的。

### 2.4 Evidence · 证据

| 项 | 内容 |
|---|---|
| **形状** | 一个断言 + 来源 + 可信度 |
| **触发** | agent 引用外部信息 |
| **data** | `{ claim, quote, source: { title, url, fetchedAt }, verified: boolean, confidence }` |
| **交互** | 展开原文 · 打开来源 · 标记「已核实 / 存疑」· **让 agent 找反证** |
| **输出端口** | `claim`, `verified`, `confidence` |
| **视觉** | 左侧来源色条；未核实为虚线边框 |

### 2.5 Table · 数据表

| 项 | 内容 |
|---|---|
| **形状** | ≥2 条同构记录的集合 |
| **触发** | agent 产出同构记录 |
| **data** | `{ columns: [{key,label,type}], rows: [...], views: [{name, filters, sort, groupBy}], activeView }` |
| **交互** | **排序 · 筛选 · 分组 · 列显隐 · 切换图表视图** · 选中行输出给下游 |
| **输出端口** | `rows`, `selection`, `aggregate(column)` |
| **视觉** | 紧凑表格；图表是同一节点的 **render mode**，不新增形态 |

### 2.6 Plan · 计划

| 项 | 内容 |
|---|---|
| **形状** | 有序可执行项 |
| **触发** | agent 产出步骤清单；或 Decision 选定分支后展开 |
| **data** | `{ items: [{ id, text, done, owner: 'human'\|'agent', dependsOn[], estimate }] }` |
| **交互** | **勾选 · 重排 · 增删** · 把某项**委托给 agent**（切换 owner） |
| **输出端口** | `items`, `progress`, `completedItems` |
| **视觉** | 复选框列表 + 顶部进度条 |

### 2.7 Decision · 决策

| 项 | 内容 |
|---|---|
| **形状** | 互斥选项 + 推荐 + 理由 |
| **触发** | agent 识别出需要用户拍板 |
| **data** | `{ question, options: [{ id, label, pros[], cons[], recommended, confidence }], selected, rationale }` |
| **交互** | **点选**（单选/多选）· 展开某选项的利弊 · 选中后**「展开为计划」**生成 Plan 节点 |
| **输出端口** | `selected`, `selectedOption` |
| **视觉** | 选项卡片横排；选中态强化，未选中降级 |

### 2.8 Action · 动作

> 补齐 Wavespace 原则 4：审批是一等 UI 原语。

| 项 | 内容 |
|---|---|
| **形状** | 一个有副作用的待执行操作 |
| **触发** | agent 准备执行副作用（发消息、下单、改文件、发布） |
| **data** | `{ verb, target, params, reversible: boolean, scope, status, result }`<br>`status`: `proposed` / `approved` / `running` / `done` / `failed` |
| **交互** | **审批**（批准 / 改参数后批准 / 拒绝）· 查看影响范围与可逆性 · 执行后查看结果与撤销 |
| **输出端口** | `result` |
| **视觉** | 审批卡片，**明确标出影响范围与「可逆 / 不可逆」**；不可逆用警示色 |

---

## 3. 连线语义（组合的基础）

当前 `link` 只有 `{from, to}`。扩展为四种语义，视觉可区分：

| 语义 | 含义 | 行为 | 视觉 |
|---|---|---|---|
| `derived` | A 生成了 B | 单向内容来源，默认 | 细实线 |
| `binds` | B 的某参数**实时绑定** A 的某输出 | **A 变 → B 自动变** | 双线 + 端点小方块 |
| `triggers` | A 的状态变化**触发** B 的动作 | 事件驱动，非持续 | 虚线 + 箭头 |
| `supports` | A 是 B 的证据/依据 | 影响 B 的 trust 显示 | 点线，低对比 |

`binds` 和 `triggers` 是「空间组合」的发动机：前者让状态在节点间流动，后者让动作被事件点燃。

**绑定示例（JSON）**
```json
{
  "from": "table-12", "to": "chart-12", "kind": "binds",
  "bindings": [{ "from": "selection", "to": "dataset" }]
}
```

---

## 4. 形态路由规则（Form follows content 的可执行定义）

agent 输出时按**有序判定**决定形态，先匹配者胜：

| 序 | 条件 | 形态 |
|---|---|---|
| 1 | 有副作用（会改变外部世界） | **Action** |
| 2 | 是执行/思考步骤序列 | **Trace** |
| 3 | 是互斥选项，需用户拍板 | **Decision** |
| 4 | 是有序可执行项 | **Plan** |
| 5 | 是 ≥2 条同构记录 | **Table** |
| 6 | 引用外部来源 | **Evidence** |
| 7 | 其他 | **Note** |

用户可**手动改形**（把 Note 转成 Table、把 Table 转成 Chart 视图）——形态是建议，不是牢笼。

---

## 5. 组合范例：一条完整链路

以现有 seed 的「东京五日行程」为例，展示节点如何互相驱动：

```
Intent「东京五日行程 / 预算 ¥8000 / 步行上限 12km」
   │ derived
   ▼
Trace「agent 调研过程」          可展开每步、可跳过、可从某步重跑
   │ derived
   ▼
Evidence ×3                     涩谷酒店价 / 地铁票价 / 美术馆开放时间
   │ supports                    各自带 verified 标记与来源链接
   ▼
Table「候选酒店对比」            用户筛选「≤ ¥1200/晚」→ selection 变化
   │ binds                       ↓ 实时驱动
   ▼
Decision「住涩谷 vs 住新宿」     用户点选「涩谷」
   │ triggers                    ↓ 触发生成
   ▼
Plan「涩谷三日详细计划」         用户勾选已完成项
   │ triggers                    ↓ 勾选「确认酒店」触发
   ▼
Action「预订酒店」               审批卡片：¥4,800 · 24h 内可免费取消 · 可逆
```

**这一条链路同时演示了**：过程显形（Trace）· 信任线索（Evidence）· 形态适配（Table 能筛选、Decision 能点选、Plan 能勾选）· 空间组合（筛选→选项→计划→动作逐级驱动）· 审批检查点（Action）。

市面上没有任何一个产品能完整跑通这条链路。

---

## 6. 与 A2UI 的映射（不自建 UI 描述语言）

八种形态对应一组**受控组件目录**，agent 输出 A2UI blueprint，Wuji 渲染为对应节点：

| 形态 | A2UI 组件 | 备注 |
|---|---|---|
| Intent | `GoalHeader` | |
| Note | `RichText` | |
| Trace | `StepTimeline` | 步骤可折叠、可操作 |
| Evidence | `Citation` | 含来源与核实态 |
| Table | `DataTable` + `FilterBar` | 图表为同组件 variant |
| Plan | `CheckList` | |
| Decision | `OptionCards` | |
| Action | `ApprovalCard` | 含范围与可逆性 |

按 A2UI 设计，**组件目录与样式由宿主（Wuji）控制**——所以这些组件渲染出来是纸质卡片语言，不是 Google 风格。且 A2UI 用 flat adjacency list，支持增量流式与单组件修正，天然适配「节点逐步长出来」的动效。

---

## 7. 落到原型的改动清单

| # | 改动 | 涉及 |
|---|---|---|
| 1 | `nodeMeta` → 形态注册表 `nodeKinds`，每种带 `render()` / `updateBindings()` / `emit()` | 渲染层 |
| 2 | node schema 增加 `data` / `status` / `confidence` / `sources` | 数据层 |
| 3 | link schema 增加 `kind`，四种语义区分渲染 | 数据层 + 连线渲染 |
| 4 | 新增 bind 机制：`A.outputs → B.inputs` 实时联动 | 新增运行时 |
| 5 | AI 产出节点默认 `draft`，加确认交互 | 交互层 |
| 6 | 形态路由函数 `routeShape(content)` | 新增 |
| 7 | seed 数据改为演示第 5 节完整链路 | 种子数据 |

**建议顺序**：先做 1+2+7（静态八形态可见），再做 3+4（组合驱动），最后 5+6（信任与路由）。

---

## 8. 不在本版范围

- 真实模型调用（形态路由目前可硬编码判定，或用规则模拟）
- 多人协作与多 agent 同画布
- 移动端手势
- 节点形态的用户自定义（插件式新形态）
