// 运行时序 selector（§2.4）：账本唯一事件流的两个无状态投影
import type { LedgerEvent } from "@wuji/model";

export function selectTaskTimeline(ledger: LedgerEvent[], taskId: string): LedgerEvent[] {
  return ledger.filter((l) => l.taskId === taskId).slice().reverse();
}

export function selectStepTimeline(ledger: LedgerEvent[], taskId: string, stepId: string): LedgerEvent[] {
  return ledger.filter((l) => l.taskId === taskId && l.stepId === stepId).slice().reverse();
}
