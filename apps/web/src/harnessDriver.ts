// harness 接缝（D4）：mock 事件 → store 动作的唯一翻译层。
// P2 换真模型时只动本文件：driver 事件面不变（progress/log/done/blocked）。
import { mockHarness } from "@wuji/harness";
import type { StepEvent } from "@wuji/harness";
import { useStore } from "./store";

const TICK = 400;
const keyOf = (taskId: string, stepId: string) => `${taskId}:${stepId}`;

let stopFn: (() => void) | null = null;

export function startHarnessDriver(): () => void {
  if (stopFn) return stopFn; // StrictMode 双挂载防护
  const inflight = new Map<string, () => void>();

  function start(taskId: string, stepId: string) {
    const step = useStore.getState().tasks
      .find((t) => t.id === taskId)?.steps.find((s) => s.id === stepId);
    if (!step) return;
    const executor = step.executor;
    const cancel = mockHarness.runStep(step, (e) => translate(taskId, stepId, executor, e));
    inflight.set(keyOf(taskId, stepId), cancel);
  }

  function cancelKey(taskId: string, stepId: string) {
    inflight.get(keyOf(taskId, stepId))?.();
    inflight.delete(keyOf(taskId, stepId));
  }

  function translate(taskId: string, stepId: string, executor: string, e: StepEvent) {
    const s = useStore.getState();
    const step = s.tasks.find((t) => t.id === taskId)?.steps.find((x) => x.id === stepId);
    if (!step) return;
    if (e.type === "progress") {
      // rerun 检测：进度被重置而在途闭包仍按旧节奏推进 → 取消重启
      if (step.progress != null && e.pct <= step.progress) {
        cancelKey(taskId, stepId);
        start(taskId, stepId);
        return;
      }
      s.stepProgress(taskId, stepId, e.pct);
    } else if (e.type === "log") {
      s.log({ actor: executor, taskId, stepId, type: "run", text: e.text });
    } else if (e.type === "done") {
      cancelKey(taskId, stepId);
      s.stepDone(taskId, stepId);
    } else if (e.type === "blocked") {
      cancelKey(taskId, stepId);
      s.stepBlocked(taskId, stepId, e.reason);
    }
  }

  const timer = setInterval(() => {
    const { tasks } = useStore.getState();
    const live = new Set<string>();
    for (const t of tasks) {
      if (t.status === "done") continue;
      for (const step of t.steps) {
        if (step.status !== "running" || step.executor === "me") continue;
        live.add(keyOf(t.id, step.id));
        if (!inflight.has(keyOf(t.id, step.id))) start(t.id, step.id);
      }
    }
    for (const [key, cancel] of inflight) {
      if (!live.has(key)) { cancel(); inflight.delete(key); } // 步骤离开 running（暂停/外置/完成）
    }
  }, TICK);

  stopFn = () => {
    clearInterval(timer);
    for (const cancel of inflight.values()) cancel();
    inflight.clear();
    stopFn = null;
  };
  return stopFn;
}
