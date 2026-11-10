// 领域类型 —— 唯一事实源（ENGINEERING.md §2）
// 一切状态迁移见 derive.ts；门的效果见 store/actions/gate.ts

export type ExecutorId = string; // AgentId | "me" | "tool"
export type StepStatus = "idle" | "running" | "waiting" | "blocked" | "external" | "done";
export type TaskStatus = "running" | "waiting" | "blocked" | "external" | "done";

export type ArtifactKind = "table" | "doc" | "image" | "note";

export interface ArtifactRef { kind: ArtifactKind; name: string }

export interface ChoiceOption {
  label: string; desc: string;
  effect: { note?: string; insertStep?: { name: string; executor: ExecutorId; note?: string } };
}
export interface StaffOption {
  label: string; desc: string;
  effect: { status: Exclude<StepStatus, "idle">; note?: string; hireAgent?: Omit<Agent, "id">; executor?: ExecutorId };
}

export type Gate =
  | { type: "choice"; title: string; options: ChoiceOption[] }
  | { type: "approval"; title: string; passLabel: string; backLabel: string;
      backTarget: "self" | "upstream" }
  | { type: "staffing"; title: string; options: StaffOption[] };

export interface Step {
  id: string;
  name: string;
  executor: ExecutorId;
  status: StepStatus;
  note?: string;
  progress?: number;
  deps: string[];                 // 前置步骤 id；空 = 根（可并行）
  artifacts: ArtifactRef[];
  // 运行时序不落步骤：唯一事件流在 ledger（ENGINEERING.md §2.4）
  gate?: Gate;                    // 需要人的门：choice=判断 approval=审批 staffing=用人
}

export interface Task {
  id: string;                     // "T-09"
  name: string;
  status: TaskStatus;             // 派生（derive.taskStatus）
  createdAt: string; updatedAt: string;
  criteria?: string;              // 判据（开工前锁定，不可改）
  budget?: { weeklyCost: number; myMinutes: number };
  steps: Step[];
}

export interface Agent {
  id: ExecutorId; name: string; role: string; mk: string;
  me?: boolean;                   // 坊主本人
  duty: string;
  trust: 1 | 2 | 3 | null;        // L1 产出必审 / L2 抽检 / L3 全自主 / null=不可授
  trustNote: string;
  stats: { runs: number; pass: number; rework: number; cost: number; asks: number };
  taskIds: string[];
  status: "running" | "waiting" | "blocked" | "idle";
}

export type InboxKind = "decision" | "confirm" | "fyi";
export interface InboxAction { label: string; kind: "primary" | "normal" | "ghost"; effect: unknown }

export interface InboxItem {
  id: string; kind: InboxKind;
  from: ExecutorId; taskId?: string;
  title: string; context: string;
  minutes: number;
  actions: InboxAction[];
}

export interface Column { key: string; label: string; numeric?: boolean }
export type Cell = string;

export interface Artifact {
  id: string; taskId: string; stepId: string;
  kind: ArtifactKind;
  name: string; by: string; updatedAt: string;
  content:
    | { type: "table"; columns: Column[]; rows: Cell[][] }
    | { type: "doc"; title: string; paras: string[]; stats?: [string, string][] }
    | { type: "image"; shots: { caption: string; dim: string }[]; note?: string }
    | { type: "note"; items: { q: string; a: string; meta: string }[] };
}

export type LedgerType = "run" | "approval" | "judgement" | "system";
export interface LedgerEvent {
  id: string; t: string;
  actor: ExecutorId;
  taskId?: string; stepId?: string;
  type: LedgerType;
  text: string;
}
