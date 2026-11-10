// 动作间共享的内部帮手（不从包入口导出）
import { taskStatus, unlockSteps } from "@wuji/model";
import type { Task } from "@wuji/model";

export const byId = (tasks: Task[], id: string) => tasks.find((t) => t.id === id);

/** 任务派生统一收口：状态归约 + 下游解锁 + 时间戳。返回本次解锁的步骤 id。
 *  解锁规则（D7 审批门不可绕过）：普通步 → running「上游就绪 · 自动起跑」；
 *  带 gate 步 → waiting「上游就绪 · 等你处理」。 */
export function refresh(t: Task): string[] {
  const unlocked = unlockSteps(t.steps);
  for (const sid of unlocked) {
    const st = t.steps.find((s) => s.id === sid);
    if (!st) continue;
    if (st.gate) { st.status = "waiting"; st.note = "上游就绪 · 等你处理"; }
    else { st.note = "上游就绪 · 自动起跑"; }
  }
  t.status = taskStatus(t.steps);
  t.updatedAt = new Date().toISOString();
  return unlocked;
}
