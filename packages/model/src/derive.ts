// 派生规则 —— 纯函数，store 只做调用（ENGINEERING.md §2.2）
import type { Step, StepStatus, TaskStatus } from "./types";

/** 环检测（fixture 校验用）：真 DAG 返回 true */
export function isAcyclic(steps: Step[]): boolean {
  const idToIdx = new Map(steps.map((s, i) => [s.id, i]));
  const state = steps.map(() => 0); // 0=未访问 1=在栈 2=完成
  let ok = true;
  const visit = (i: number) => {
    if (state[i] === 1) { ok = false; return; }
    if (state[i] === 2) return;
    state[i] = 1;
    for (const d of depsOf(steps, i)) { const di = idToIdx.get(d); if (di != null) visit(di); }
    state[i] = 2;
  };
  steps.forEach((_, i) => visit(i));
  return ok;
}

function depsOf(steps: Step[], i: number): string[] {
  const s = steps[i];
  if (!s) return [];
  if (s.deps.length) return s.deps;
  const prev = i > 0 ? steps[i - 1] : undefined;
  return prev ? [prev.id] : [];
}

const STEP_PRIORITY: StepStatus[] = ["blocked", "waiting", "external", "running", "done", "idle"];
const TASK_OF_STEP: Record<StepStatus, TaskStatus> = {
  blocked: "blocked", waiting: "waiting", external: "external",
  running: "running", done: "done", idle: "running", // 有未开工步骤 = 任务在推进中
};

export function taskStatus(steps: Step[]): TaskStatus {
  if (steps.length && steps.every((s) => s.status === "done")) return "done";
  let best = 5; // idle 优先级最低
  for (const s of steps) {
    const p = STEP_PRIORITY.indexOf(s.status);
    if (p >= 0 && p < best) best = p;
  }
  const st = STEP_PRIORITY[best] ?? "running";
  return TASK_OF_STEP[st];
}

export function taskProgress(steps: Step[]): { done: number; total: number; pct: number } {
  const total = steps.length;
  const done = steps.filter((s) => s.status === "done").length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** 下游解锁：deps 全 done 且自身 idle → running（唯一自动迁移） */
export function unlockSteps(steps: Step[]): string[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const unlocked: string[] = [];
  for (const s of steps) {
    if (s.status !== "idle" || !s.deps.length) continue;
    const ready = s.deps.every((d) => byId.get(d)?.status === "done");
    if (ready) { s.status = "running"; unlocked.push(s.id); }
  }
  return unlocked;
}
