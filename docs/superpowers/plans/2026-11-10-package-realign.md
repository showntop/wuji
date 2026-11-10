# 包架构归位（M4 铺路）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native，本会话内联执行) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 ENGINEERING.md §3 规划的包结构做实：数据 store 与动作进 `@wuji/store`、画布组件进 `@wuji/workflow`、查看器拆分、harness 接缝真正接上，为 M4 换真模型铺路。

**Architecture:** 行为保持重构 + 5 处经 spec 授权的修正（见下）。数据四切片（+artifacts）在 store 包（zustand 工厂，headless 可测）；壳状态（route/overlay/viewer/openTaskId）下沉到 web 本地 `useShell`；mock 执行经 `Harness.runStep` 接口由 web 侧 driver 翻译成 store 动作；workflow/viewers 组件全部 props 驱动，不 import store。

**Tech Stack:** React 18 + TS(strict) + zustand v4 + zod + vitest（镜像 `@wuji/model` 的 ^1.6.0）+ Vite。

**Spec:** `docs/ENGINEERING.md`（§2.4 事件流、§3 目录与依赖方向、§4 选型、§5 模块职责、D3/D4/D6/D7）

## Global Constraints

- 依赖方向只许向下：`web → {store, ui, workflow, viewers, model}`；`workflow/viewers/store → {ui, model}`；`model` 零依赖。禁止反向、禁止同级互导。
- D3：每个 mutation 动作落 ≥1 条 `LedgerEvent`；D7：审批门不可绕过；D6：本地优先（localStorage 持久化，键 `wuji.store.v1` 不变）。
- `tsconfig.base.json`：strict + `noUncheckedIndexedAccess`，不放松。
- 新依赖只允许：store/workflow 包镜像 `@wuji/model` 的 `vitest@^1.6.0` devDep；workflow 加 `react@^18.3.1` + `@types/react@^18.3.3` devDep。
- **CSS 类名是契约**：组件搬移必须保持 `styles.css`（381 行）引用的全部类名与 DOM 结构不变。
- 深路径 import（`@wuji/ui/src/components` 等）全部改为包入口 `@wuji/ui` 等；唯一例外 `@wuji/ui/src/Tokens.css`（CSS 无 JS 入口，main.tsx 保留）。
- 用户可见文案除下列 3 处外逐一保留：① gate 步骤解锁文案「上游就绪 · 自动起跑」→ gate 步改为「上游就绪 · 等你处理」（非 gate 步保留原文案）；② mock 推进节奏从全局 4s tick（每 tick +12~24%）改为每步 `mockHarness.runStep` 内的 600ms×5（spec §5 授权）；③ dispatchTask 内嵌 setTimeout(3s) 移除——由 driver 经 done→unlock 自然达成（等待时长恰好同为 ~3s）。

## Review Focus（spec 未被测试覆盖、最易咬人的五类输入）

1. **损坏的 localStorage 存档**（字段缺失/形状错/JSON 坏）→ 必须整档回退 fixtures，不得白屏。测试：T1 `readPersisted` 注入坏 storage。
2. **gate 步骤绝不自动进入 running**（D7；fixture 活案例 T-09/s4 idle+approval）→ 测试：T1 unlock 规则。
3. **rerun 与在途 mock 竞争**（progress 被重置而 mock 闭包仍按旧 pct 推进）→ driver 必须检测 progress 回退并重启。T2 实现 + T8 手工核对。
4. **单步任务布局**（`layoutDag` 单节点不产生 NaN/空层崩溃）→ 测试：T3。
5. **空集合渲染**（0 任务 / 0 inbox / trust=null agent）→ T8 dev 起服手工核对三视图。

---

### Task 1: `@wuji/store` 实体化（数据切片 + 动作 + 持久化 + 时序 selector）

**Files:**
- Create: `packages/store/src/{types.ts, internal.ts, ledger.ts, persist.ts, timeline.ts, actions/{task,gate,agent,inbox}.ts}`；`packages/store/tests/store.test.ts`
- Rewrite: `packages/store/src/createStore.ts`、`packages/store/src/index.ts`、`packages/store/package.json`（加 `"test": "vitest run"`、check 改 `tsc --noEmit && vitest run`、devDeps 加 `vitest@^1.6.0`）
- 本任务不改 `apps/web`（旧 `../store.ts` 照常工作，全仓 check 保持绿）

**Interfaces (Produces):**
```ts
// types.ts
export interface WujiState { tasks: Task[]; agents: Agent[]; inbox: InboxItem[]; ledger: LedgerEvent[]; artifacts: Artifact[] }
export type WujiActions = {
  log(e: Omit<LedgerEvent, "id" | "t">): void;
  dispatchTask(text: string): string;
  stepOp(taskId: string, stepId: string, op: "start"|"pause"|"resume"|"rerun"|"submit"|"reassign"|"done", to?: ExecutorId): void;
  applyGate(taskId: string, stepId: string, kind: "pass"|"back"|"pick", optionIdx?: number): void;
  resolveInbox(itemId: string, mode: "read"|"dismiss"): void;
  setTrust(agentId: string, trust: 1|2|3): void;
  toggleAgent(agentId: string, fire: boolean): void;
  clearInbox(kind: "confirm"|"fyi"): number;
  stepProgress(taskId: string, stepId: string, pct: number): void;   // harness 用，不落账本
  stepDone(taskId: string, stepId: string): void;                    // harness 用，落账本 + 解锁
  stepBlocked(taskId: string, stepId: string, reason: string): void; // harness 用
};
// createStore.ts
export function createWujiStore(initial?: Partial<WujiState>): UseBoundStore<Store<WujiState & WujiActions>>;
// persist.ts
export function attachPersistence(store: /* 上面返回值 */, key?: string): void; // localStorage 缺失时静默跳过
export function readPersisted(key?: string): Partial<WujiState> | null;        // zod 整档校验，坏则 null
export function clearPersisted(key?: string): void;
// timeline.ts（纯函数）
export function selectTaskTimeline(ledger: LedgerEvent[], taskId: string): LedgerEvent[];  // 倒序
export function selectStepTimeline(ledger: LedgerEvent[], taskId: string, stepId: string): LedgerEvent[];
```
- 动作文件模式：`export function createTaskActions(set, get, aux): Pick<WujiActions,...>`，`createStore.ts` 组装（zustand 官方 slice 模式）。
- 逻辑从 `apps/web/src/store.ts:60-231` **逐行迁移**，仅以下改动：① 移除 `route/openTaskId/overlay/viewer` 与 `setRoute/setOverlay/setViewer`（壳状态归 web）；② `dispatchTask` 删除 setTimeout 块（`store.ts:107-117`）；③ `applyGate` choice 分支删除 no-op 行 `x.deps = x.deps.map((d) => (d === s.id && x.id !== ins.id ? d : d))`（`store.ts:175`）；④ `internal.ts` 的 `refresh()` 在 `unlockSteps` 后追加规则：**解锁步骤带 gate → status "waiting"、note「上游就绪 · 等你处理」**（非 gate 步保持 running + 「上游就绪 · 自动起跑」）；⑤ `stepProgress/stepDone/stepBlocked` 新增，内容取自现 `startHarnessMock` 循环体（`store.ts:237-260`）的对应片段，`stepDone` 落账本文案与现循环一致。

- [ ] Step 1: 写失败测试 `packages/store/tests/store.test.ts`：`createWujiStore()` 空初始 → dispatchTask 产出 `T-01`、3 步、s2 带 approval gate 且 **idle**、账本 +1；stepOp 七分支各一条断言（rerun 重置 progress=0；reassign 改 executor + judgement 账）；applyGate approval pass→done+passLabel、back upstream→上游 running/self idle、choice→insertStep 落位 idx+1 且 deps=[s.id]、staffing hireAgent→agents 增 1 且重复调用不增；gate 解锁规则：上游 done 后 gate 步 = waiting（构造 2 步链跑 stepDone）；clearInbox 返回移除数；两个 timeline selector 过滤 + 倒序。
- [ ] Step 2: `pnpm --filter @wuji/store test` → FAIL（模块不存在/导出缺失）。
- [ ] Step 3: 按 Interfaces 实现全部源文件。
- [ ] Step 4: `pnpm --filter @wuji/store check` → PASS（tsc + vitest 全绿）。
- [ ] Step 5: 全仓 `pnpm check` → PASS（web 未动仍绿）。Commit：`store package: real actions/ledger/persist/timeline + tests (spec §3)`。

### Task 2: web 接线真 store + harness driver（接缝接上）

**Files:**
- Rewrite: `apps/web/src/store.ts`（薄绑定层，~40 行）；`apps/web/src/App.tsx`（`startHarnessMock` → `startHarnessDriver`，仅 import 与调用名）
- Create: `apps/web/src/harnessDriver.ts`
- Delete: 旧 store.ts 中的动作/持久化/循环体（随 rewrite 消失）

**Interfaces (Consumes/Produces):**
```ts
// store.ts（web 薄绑定）
import fixtures from "../../../fixtures/*.json"; // 既有 import 路径不变
export const useStore = createWujiStore(readPersisted() ?? { tasks: tasksFixture, ... });
export function initPersistence() { attachPersistence(useStore); }
export function resetPersisted() { clearPersisted(); location.reload(); }
// harnessDriver.ts
export function startHarnessDriver(): () => void;
```
- driver：`setInterval(400ms)` 扫描；对 `status==="running" && executor!=="me"` 且不在途的步调 `mockHarness.runStep(step, onEvent)`（`@wuji/harness` 首次被消费），在途表 `Map<"taskId:stepId", cancel>`；事件翻译：progress→`stepProgress`；log→`log({actor: step.executor, taskId, stepId, type:"run", text})`；done→cancel+`stepDone`；blocked→`stepBlocked`。**rerun 检测**：progress 事件 pct ≤ 该步当前 progress 时 cancel 并重启。步骤离开 running（pause/external）→ cancel 并移除。
- 组件的 `route/overlay/viewer/openTaskId` 读写本任务**临时**改为 `useStore.setState/getState` 直操作（T7 才下沉 useShell），保证本任务行为等价、diff 最小。

- [ ] Step 1: 改 `store.ts` + `harnessDriver.ts` + `App.tsx` 两处调用。
- [ ] Step 2: `pnpm --filter @wuji/web check` → PASS；全仓 `pnpm check` → PASS。
- [ ] Step 3: `pnpm --filter @wuji/web dev` 后台起服，`curl -sf localhost:5180` 首页 200 且无 vite 报错输出。Commit：`web: consume @wuji/store, wire mock through Harness.runStep seam`。

### Task 3: `@wuji/workflow` 组件化（Canvas/Node/GatePanel/RunLog）

**Files:**
- Create: `packages/workflow/src/{Canvas.tsx, Node.tsx, GatePanel.tsx, RunLog.tsx}`、`packages/workflow/tests/layout.test.ts`
- Modify: `packages/workflow/package.json`（deps 加 react、devDeps 加 @types/react + vitest、check 加 vitest run）、`src/index.ts`
- 不改 web（TaskFlow.tsx 仍用内联组件，全仓绿）

**Interfaces (Produces):**
```tsx
export function Canvas(props: {
  steps: Step[]; agents: Agent[]; selectedId: string | null;
  onSelect(id: string | null): void;          // 节点点击/回车
  onOpenArtifact(a: ArtifactRef): void;       // 产物卡点击
}): JSX.Element;   // 内含 cam/drag 状态、layout useMemo（lanePitch:156）、fit 视口 effect、wfhint/wfcam；类名与现 TaskFlow.tsx:66-131 一致
export function GatePanel(props: { step: Step; onApply(k: "pass"|"back"|"pick", o?: number): void }): JSX.Element | null;
   // 现逻辑原样（含 waiting 或 blocked+staffing 激活判断），删掉 task prop 与 `void task`
export function RunLog(props: { entries: LedgerEvent[]; emptyText: string }): JSX.Element; // ul.log / p.note
```
- Node.tsx 为包内组件（不从 index 导出）：现 `wfnode`/`wfart` 标记（TaskFlow.tsx:99-121）props 化（step、pos、agent mk、sel、progress 文案）。
- 测试 `layout.test.ts`：分叉（两根同层）、汇合（多依赖同层）、孤根分层、单步任务（断言 width/height 为有限数、nodes[0] 坐标有限）、`isAcyclic` 再导出可用。

- [ ] Step 1: 写失败测试（layout）。Step 2: run → FAIL。Step 3: 实现四组件。Step 4: `pnpm --filter @wuji/workflow check` PASS + 全仓 PASS。Commit：`workflow: prop-driven Canvas/Node/GatePanel/RunLog + layout tests`。

### Task 4: `@wuji/viewers` 拆分 + 查找逻辑去重

**Files:**
- Split: `packages/viewers/src/Viewer.tsx` → `{Viewer.tsx(分派), TableView.tsx, DocView.tsx, GalleryView.tsx, NoteView.tsx}`；Rewrite `index.ts`
- Modify: `apps/web/src/components/{TaskFlow,Overlays}.tsx` 的 import（`@wuji/viewers/src/Viewer` → `@wuji/viewers`）并用 `findArtifact` 替换两处重复查找（TaskFlow.tsx:212-218、Overlays.tsx:217-219）

**Interfaces (Produces):** `export function ArtifactView({artifact})`（不变）、`export function findArtifact(artifacts: Artifact[], taskId: string, name: string): Artifact | undefined`（`name.replace(/ · .*$/,"")` 匹配逻辑，现两处实现一致）。

- [ ] Step 1: 拆文件 + 导出 findArtifact；Step 2: web 两处换用；Step 3: 全仓 `pnpm check` PASS。Commit：`viewers: split four form views, dedupe artifact lookup`。

### Task 5: `routes/TaskDetail` 重构到 workflow 包组件之上

**Files:**
- Create: `apps/web/src/routes/TaskDetail.tsx`；Delete: `apps/web/src/components/TaskFlow.tsx`
- Modify: `apps/web/src/components/Views.tsx`（import 改自 `../routes/TaskDetail`）

**要点：** 路由文件持有 `selId/art` 状态与时间线（`selectTaskTimeline/selectStepTimeline`），`Reassign`、右侧面板外壳（`wfpanel` 标记）、产物浮层留在此文件；画布区一行 `<Canvas steps agents selectedId onSelect onOpenArtifact/>`；gate 区 `<GatePanel step onApply/>`；日志区 `<RunLog/>`。`onSelect(null)` 语义 = 点空白回全局时序（与现 `setSelId(s.id)`/`setArt(null)` 行为一致；空白处取消选中沿用现行为——现实现无空白取消，保持不加）。

- [ ] Step 1: 重构；Step 2: 全仓 `pnpm check` PASS；Step 3: dev 起服手工点一单任务：节点选中、三 gate 面板、产物浮层正常。Commit：`web: TaskDetail composed over @wuji/workflow components`。

### Task 6: `@wuji/ui` 补 Seg7 + 包入口 import 全量切换

**Files:**
- Modify: `packages/ui/src/components.tsx`（加 Seg7）、`apps/web/src/App.tsx`（两处 seg7 手写标记换 `<Seg7/>`）、`apps/web/src/components/{Views,TaskFlow,Overlays}.tsx` + `routes/TaskDetail.tsx`（`@wuji/ui/src/components` → `@wuji/ui`）

**Interfaces (Produces):** `export function Seg7(props: { value: string | number; digits: number; green?: boolean }): JSX.Element` —— 渲染 `span.seg7[.green] > span.ghost("8"×digits) + span.val(String(value).padStart(digits,"0").slice(-digits))`，与 App.tsx:59,61 现手写标记逐类名一致。

- [ ] Step 1: 实现 + 替换；Step 2: `grep -rn "@wuji/[a-z]*/src/" apps/` 仅剩 Tokens.css 一处；Step 3: 全仓 PASS。Commit：`ui: Seg7 component; import via package entries`。

### Task 7: 壳状态下沉 + routes/shell 分目录

**Files:**
- Create: `apps/web/src/shellStore.ts`（`useShell`：route/openTaskId/overlay/viewer + setRoute[清 overlay]/setOverlay/setViewer/openTask）、`apps/web/src/routes/{Home,Tasks,Agents,TaskRow}.tsx`、`apps/web/src/shell/{Desk,LedgerPanel,Summon,ViewerOverlay}.tsx`
- Modify: `apps/web/src/App.tsx`（吸收 Views 的路由 switch + strip 条件）、`main.tsx`（styles import 路径）
- Move: `src/styles.css` → `src/styles/global.css`
- Delete: `apps/web/src/components/`（Views/Overlays 拆净，`agentMk` 无引用随之删除）

**Interfaces:** `useShell` 四状态 + 四动作；`openTask(id)`（setOpenTaskId + setRoute("task")）替换现 `Views.tsx:19`、`Overlays.tsx:17` 两处手写。组件数据仍走 `useStore`。类名/文案零变化。

- [ ] Step 1: 建 shellStore；Step 2: 拆四路由 + 四 shell 组件 + App 改装；Step 3: styles 移动 + main import；Step 4: 全仓 PASS + dev 手工核三视图/两抽屉/Summon/快捷键。Commit：`web: shell store + routes/shell split per spec §3`。

### Task 8: 终验 + 文档校准

- [ ] Step 1: 全量 `pnpm check`（引用输出：测试数）+ `pnpm -w build`（vite build 过）。
- [ ] Step 2: dev 起服核对 Review Focus 5 项（空集合三视图、单步任务 T-08？选 fixture 中最短任务、reset 按钮触发 clearPersisted 回 fixtures）。
- [ ] Step 3: `docs/ENGINEERING.md` 追加「实现校准（2026-11-10）」小节：包结构做实；偏差 5 条（gate 解锁→waiting、mock 节奏、dispatch setTimeout 移除、zod 校验存档、壳状态 web 本地 store）。Commit：`docs: record package realignment and deviations`。
