// store 包类型：数据切片 + 动作面（ENGINEERING.md §3；D3：动作即账本来源）
import type { StoreApi } from "zustand";
import type { Task, Agent, InboxItem, LedgerEvent, Artifact, ExecutorId } from "@wuji/model";

export interface WujiState {
  tasks: Task[];
  agents: Agent[];
  inbox: InboxItem[];
  ledger: LedgerEvent[];
  artifacts: Artifact[];
}

export type WujiActions = {
  log(e: Omit<LedgerEvent, "id" | "t">): void;
  dispatchTask(text: string): string;
  stepOp(taskId: string, stepId: string,
         op: "start" | "pause" | "resume" | "rerun" | "submit" | "reassign" | "done",
         to?: ExecutorId): void;
  applyGate(taskId: string, stepId: string, kind: "pass" | "back" | "pick", optionIdx?: number): void;
  resolveInbox(itemId: string, mode: "read" | "dismiss"): void;
  setTrust(agentId: string, trust: 1 | 2 | 3): void;
  toggleAgent(agentId: string, fire: boolean): void;
  clearInbox(kind: "confirm" | "fyi"): number;
  /** harness 专用：进度只推进 UI，不落账本（§2.4） */
  stepProgress(taskId: string, stepId: string, pct: number): void;
  /** harness 专用：完成 + 落账 + 解锁下游 */
  stepDone(taskId: string, stepId: string): void;
  /** harness 专用：受阻 + 落账 */
  stepBlocked(taskId: string, stepId: string, reason: string): void;
};

export type WujiStoreApi = StoreApi<WujiState & WujiActions>;
export type SetState = WujiStoreApi["setState"];
export type GetState = WujiStoreApi["getState"];
