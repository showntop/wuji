# Wuji / 无极 — 工程设计（P0 开工版）

> 版本：V1 · 2026-11-08 · 实现校准 2026-11-10（见文末 §8）
> 地位：本文是**开工正典**。`ARCHITECTURE.md` 定系统分层（能力/harness/编制/工作台），`INTERFACE.md` 定交互形态与信息架构，本文定**第一个可上线切片的工程实现**：数据模型、包结构、技术选型、里程碑。
> 范围：一人 + 多 Agent 的任务工作台（五轮演示验证过的形态），不含领域工作台（OPC 等，二期）与活文档（BLUEPRINT，三期）。

---

## 0. 一句话

**把 `demo/shell/index.html`（1600 行演示）重写为 monorepo 工程：对象化数据模型 + DAG 工作流 + 形态查看器 + 三视图壳，事件账本贯穿，harness 留桩。**

演示已验证的完整链路（本文的设计基线）：

```
快速发起（问答/派任务）→ 用人审批门 → 任务列表 → 工作流详情
（横向 DAG + 运行时序 + 判断/审批/用人三 gate 就地处理）
→ 产物查看器（表/稿/图/记按形态）→ 待处理收件箱 → 账本
```

---

## 1. 设计决定（承接审查结论，约束全部后续代码）

| # | 决定 | 内容 |
|---|---|---|
| D1 | **数据模型对象化** | 步骤从 9 槽元组改为对象（§2）。位置元组的 null 占位是本轮全部下标 bug 的根源，schema 定死，zod 校验 |
| D2 | **演示退役策略** | `demo/shell/index.html` 与 `demo/shell/journey.html` 保留为参考演示（M1 主链跑通后已移入 `demo/`）；不再新增演示功能，一切新能力进工程 |
| D3 | **状态 = store + 事件账本** | 一切 mutation 走 store 动作；每个动作落一条 `LedgerEvent`——账本不是额外功能，是状态的副产品（审计免费获得） |
| D4 | **harness 留桩** | Agent 执行在 P0 是确定性 mock（定时器推进步骤、产出 fixture 产物）；`packages/harness` 定义接口，P2 换真模型 |
| D5 | **可视化词汇沿用** | 钢灰 tokens、状态五色 + 文字标签、七段计数、方角铁则（`demo/shell/DESIGN.md` 为视觉正典，迁 `packages/ui`） |
| D6 | **单用户本地优先** | 无后端、无协作；IndexedDB 持久化（P1），导出 `.json`（P0） |
| D7 | **审批门不可绕过** | 派任务必须停在用人审批；一切 Agent 副作用经 gate 或收件箱——架构铁律「人写直通，Agent 写必经门」 |

---

## 2. 数据模型（`packages/model`）

### 2.1 实体

```ts
// ---------- 任务 ----------
type TaskStatus = "running" | "waiting" | "blocked" | "external" | "done";

interface Task {
  id: string;                    // "T-09"
  name: string;
  status: TaskStatus;            // 由步骤派生（§2.3）
  createdAt: string; updatedAt: string;
  criteria?: string;             // 判据（开工前锁定）
  budget?: { weeklyCost: number; myMinutes: number };
  steps: Step[];
}

// ---------- 步骤（对象化，D1） ----------
type StepStatus = "idle" | "running" | "waiting" | "blocked" | "external" | "done";

interface Step {
  id: string;                    // 步内唯一
  name: string;
  executor: ExecutorId;          // AgentId | "me" | "tool"
  status: StepStatus;
  note?: string;
  progress?: number;             // 0-100，running 时有意义
  deps: string[];                // 前置步骤 id（空 = 根，可并行）
  artifacts: ArtifactRef[];      // 本步产出
  logs: LogEntry[];              // 运行时序
  gate?: Gate;                   // 需要人的门
}

interface ArtifactRef { kind: "table" | "doc" | "image" | "note"; name: string; }

interface LogEntry { t: string; kind: "info" | "ask" | "error"; text: string; }

// ---------- 门（三型，ARCHITECTURE H1 的界面投影） ----------
type Gate =
  | { type: "choice"; title: string; options: ChoiceOption[] }        // 判断：改任务结构
  | { type: "approval"; title: string; passLabel: string;             // 审批：放行产出
      backLabel: string; backTarget: "self" | "upstream" }
  | { type: "staffing"; title: string; options: StaffOption[] };      // 用人：改编制

interface ChoiceOption { label: string; desc: string;
  effect: { note?: string; insertStep?: { name: string; executor: ExecutorId; note?: string } } }
interface StaffOption { label: string; desc: string;
  effect: { status: StepStatus; note?: string; hireAgent?: AgentSpec; executor?: ExecutorId } }

// ---------- Agent ----------
interface Agent {
  id: ExecutorId; name: string; role: string; mk: string;   // 两字母徽记
  duty: string;
  trust: 1 | 2 | 3 | null;      // L1 产出必审 / L2 抽检 / L3 全自主 / null=不可授（我、脚本）
  trustNote: string;
  stats: { runs: number; pass: number; rework: number; cost: number; asks: number };
  taskIds: string[];
  status: "running" | "waiting" | "blocked" | "idle";
}

// ---------- 待处理 ----------
type InboxKind = "decision" | "confirm" | "fyi";
interface InboxItem {
  id: string; kind: InboxKind;
  from: ExecutorId; taskId?: string;
  title: string; context: string;
  minutes: number;               // 预计花我几分钟
  actions: { label: string; kind: "primary" | "normal" | "ghost"; effect: Effect }[];
}

// ---------- 产物（内容按形态分型） ----------
interface Artifact {
  id: string; taskId: string; stepId: string;
  kind: "table" | "doc" | "image" | "note";
  name: string; by: string; updatedAt: string;
  content:
    | { type: "table"; columns: Column[]; rows: Cell[][] }
    | { type: "doc"; title: string; paras: string[]; stats?: [string, string][] }
    | { type: "image"; shots: { caption: string; dim: string }[]; note?: string }
    | { type: "note"; items: { q: string; a: string; meta: string }[] };
}

// ---------- 账本（D3：mutation 的副产品） ----------
interface LedgerEvent {
  id: string; t: string;
  actor: ExecutorId;
  taskId?: string; stepId?: string;
  type: "run" | "approval" | "judgement" | "system";
  text: string;
}
```

### 2.2 派生规则（不落库，selector 计算）

- `Task.status` = 步骤状态优先级归约：blocked > waiting > external > running > done > idle。
- `Task.progress` = done 步骤数 / 总数。
- **下游解锁**：步骤 deps 全 done 且自身 idle → 自动转 running（唯一自动迁移，其余迁移全部由动作或门触发）。
- `Agent.status` / `Agent.taskIds` 由 tasks 反推。

### 2.4 运行时序实现（单一事件流）

**不做两套日志**（演示中的 `Step.logs` 已废除）。一切运行事件归一流入账本，面板是纯投影：

- **归一化**：`store/ledger.ts normalizeEvent()` 把 harness `StepEvent`、人的 store 动作、系统事件统一转成 `LedgerEvent`（actor = 步骤执行者或「我」，带 taskId/stepId）。
- **分级**：`progress` 只更新 `step.progress`（节点进度条实时变，**不落账本**，防刷屏）；`log` / `artifact` / `done` / `blocked` 落账本。
- **查询**：`store/timeline.ts` 两个无状态 selector——`selectStepTimeline(taskId, stepId)` 与 `selectTaskTimeline(taskId)`；账本「事件」镜片同源、不加 stepId。
- **P0 mock 即活数据**：mockHarness 定时发 progress → 节点进度条真动；done → 落账本、解锁下游。M3 起时序面板是真数据，fixture 只提供初始状态。

### 2.5 迁移规则（演示 → fixture）

- 现演示数据逐条映射为 fixture JSON（`fixtures/tasks.json` 等），T-09 补「数据回流」「变现」两步补足闭环；全部过 zod。
- 判据、预算等演示中隐含的字段一并显式化。

---

## 3. 目录结构（pnpm monorepo，D6 单用户本地优先）

```
wuji/
├── pnpm-workspace.yaml
├── package.json                 # 根：scripts（dev/build/check），不装业务依赖
├── tsconfig.base.json           # 严格模式 + project references 基座
├── docs/                        # 正典文档（PRODUCT / BLUEPRINT / ARCHITECTURE / INTERFACE / ENGINEERING …）
│
├── apps/
│   └── web/                     # 应用壳（React 18 + Vite + TS）
│       └── src/
│           ├── main.tsx         # 入口
│           ├── App.tsx          # 视图装配：工作台/任务/Agent + 详情路由
│           ├── routes/          # 每视图一个薄装配文件（组合 packages 组件）
│           └── styles/          # tokens.css（从 demo/shell/DESIGN.md 提炼）+ 全局
│
├── packages/
│   ├── model/                   # ★ 零依赖领域模型：类型 + zod schema + fixture 校验
│   │   └── src/{types.ts, schema.ts, derive.ts, index.ts}
│   ├── store/                   # 状态与动作（zustand）：tasks/agents/inbox/ledger 四切片
│   │   └── src/{createStore.ts, actions/{task,gate,agent,inbox}.ts, ledger.ts, persist.ts}
│   ├── ui/                      # 共用件：状态灯/徽记/铭牌/七段计数/步骤条/抽屉/toast + tokens
│   │   └── src/{Lamp,Mk,Plate,Seg7,Drawer,Toast,Tokens.css, …}
│   ├── workflow/                # DAG 工作流：分层布局算法 + 节点/边画布 + 节点面板 + 三 gate
│   │   └── src/{layout.ts, Canvas.tsx, Node.tsx, GatePanel.tsx, RunLog.tsx}
│   ├── viewers/                 # 产物查看器：表格(排序)/文稿/图集/笔记 四形态
│   │   └── src/{Viewer.tsx, TableView.tsx, DocView.tsx, GalleryView.tsx, NoteView.tsx}
│   └── harness/                 # P0 stub：确定性 mock 执行器；P2 换真模型（接口不变）
│       └── src/{types.ts, mock.ts}
│
├── fixtures/                    # 演示数据 → zod 校验后的 JSON（tasks/agents/artifacts/inbox/ledger）
│
└── demo/                        # 演示面（M1 后已移入）：shell/ + opc-console/ + opc-console-v2/（冻结不再改）
```

**依赖方向（只许向下）**：`web → {store, ui, workflow, viewers, model}`；`workflow/viewers/store → {ui, model}`；`model` 零依赖。禁止反向 import、禁止跨同级包 import（都经 model 类型协作）。

**增长路径**（ARCHITECTURE 全景，P0 不建）：`registry/`（能力注册表）、`resources/`（资产/知识/记忆）、`harness-pi|dsh`（真运行时）、`workbench-kit`（领域工作台公共件）——接口已在 harness/types 与 model 预留，届时新增包即可。

---

## 4. 技术选型（沿 BLUEPRINT §8 已定稿，P0 落地子集）

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | React 18 + TypeScript(strict) + Vite | 生态与演示迁移成本最低 |
| 状态 | zustand + 不可变动作 | 简单可测；动作即账本来源（D3） |
| 校验 | zod | fixture 与运行时双用 |
| 画布 | 自绘（绝对定位 + transform，逻辑从演示移植） | DAG 已验证，2k 行内可控；不上 tldraw |
| 样式 | 手写 CSS + tokens.css（CSS 变量） | 沿钢灰正典；不引 Tailwind（演示零构建已验证该路线够用） |
| 持久化 | P0 导出 JSON；P1 IndexedDB(idb) | 本地优先（D6） |
| 测试 | vitest：model/store 全覆盖，布局算法快照 | 逻辑层不碰 DOM，好测 |
| 质量门 | `pnpm check` = tsc + eslint + vitest + model fixture 校验 | 每次提交必绿 |

---

## 5. 模块职责要点

- **model/derive.ts**：任务状态归约、进度、下游解锁、Agent 状态反推——全部纯函数（§2.2），store 只做调用。
- **store/timeline.ts**：运行时序 selector（§2.4）。
- **store/actions/gate.ts**：三 gate 的效果机（choice：改结构可长新支线；approval：pass/back，backTarget 按 gate 定义；staffing：hire 真入编）。每个效果 = 状态变更 + 1..n 条 LedgerEvent。
- **workflow/layout.ts**：最长路径分层 + 同层居中（演示算法移植，补单测：分叉/汇合/孤根/环检测）。
- **viewers**：按 `Artifact.content.type` 分派四视图；表格排序为纯函数。
- **harness/mock.ts**：`runStep(step) → 事件流`，用定时器把 running 步推进到 done 并产出 fixture 产物；进度事件驱动 UI。接口与 P2 真实现一致。

---

## 6. 里程碑（每期可验收）

| 期 | 内容 | 验收 |
|---|---|---|
| **M0 地基**（0.5 周） | monorepo 脚手架；model 类型 + zod + fixture 迁移（演示数据全量、T-09 补闭环步）；tokens.css；`pnpm check` 流水线 | `pnpm check` 绿；fixture 校验通过；tokens 与演示像素一致 |
| **M1 任务主链**（1 周） | 任务列表（筛选）+ 工作流视图（DAG 布局 + 面板 + 三 gate）+ 产物查看器 + 快速发起（派任务走审批门） | 演示全链路在工程版走通；演示退役进 `demo/` |
| **M2 编制与账本**（1 周） | Agent 页 + 详情（自治级/暂停/停用）+ 待处理收件箱（三档/批量）+ 账本（事件/引用/数字）+ 首页工作台装配 | 状态全部由 store 派生，无写死数字；账本覆盖一切动作 |
| **M3 持久化与 stub 执行**（1 周） | IndexedDB 持久化 + JSON 导入导出；harness mock 让 running 步自主推进 | 刷新后状态不丢；关页面步骤仍会推进（下次打开看到进展） |
| **M4 真模型**（P2 起） | harness 接真模型（BYOK）；A2UI 产物流 | 真任务端到端 |

**开工顺序即 M0**：脚手架 → model → fixture → check 流水线。

---

## 7. 明确不做（P0）

后端与协作 · 多主题 · 移动端专属 UI（响应式兜底沿用演示断点）· 活文档/卷野谱 · 领域工作台 · 权限系统 · 自建协议（AG-UI/A2UI 沿用）。

---

## 8. 实现校准（2026-11-10 包架构归位）

M3 后对照 §3 做了一次纯结构重构（行为保持 + 5 处授权修正），包边界现在是实的：

- **`@wuji/store`**：`createWujiStore` 工厂 + `actions/{task,gate,agent,inbox}` + `ledger`（id 序列 + log）+ `persist`（attach/read/clear，读回过 zod）+ `timeline` 两 selector。headless 可测（vitest 17 例）。
- **`@wuji/workflow`**：`Canvas`（布局/边/节点/产物卡/视口拖拽缩放）、`GatePanel`、`RunLog`，全部 props 驱动，不 import store（依赖方向 §3 落实）；layout 5 例特性锁定测试。
- **`@wuji/viewers`**：四形态视图分文件 + `findArtifact` 统一短名查找。
- **`@wuji/ui`**：`Lamp/StatusTag/Mk/Plate/Seg7` + tokens。全部包经入口导入（仅 `Tokens.css` 走深路径）。
- **web**：`store.ts` 只剩 fixtures 绑定与持久化挂载；壳状态（route/overlay/viewer/openTaskId）在 web 本地 `useShell`（§3 四切片不含壳状态）；`routes/`（Home/Tasks/Agents/TaskDetail/TaskRow）+ `shell/`（Desk/LedgerPanel/Summon/ViewerOverlay）。
- **harness 接缝接通**：`web/harnessDriver.ts` 是 mock 事件 → store 动作的唯一翻译层；`@wuji/harness` 的 `runStep` 首次被消费，M4 换真模型只动 driver。

**偏差记录（相对初版设计）**：

1. **gate 步骤解锁转 waiting**（原：一律 running）——D7「审批门不可绕过」的直接落实；fixture T-09/s4（idle+approval）此前会被自动起跑绕过门。
2. **mock 节奏走 `runStep`**（600ms×5/步，每步约 3s 完成）替代全局 4s tick（每步约 22-40s）——§5 mock 语义的对齐，演示节奏显著变快。
3. **dispatchTask 内嵌 setTimeout 移除**——派单后方案步经 driver 自然跑完停在审批门（总时长同为 ~3s），文案由「执行方案完成 · 递你审批」泛化为解锁文案。
4. **localStorage 存档读回过 zod**——损坏存档整档回退 fixtures，不再可能白屏。
5. **持久化仍为 localStorage**（§4 原计划 P1 IndexedDB）——数据量为演示级，代码注释已声明升级阈值；未视为欠账。
