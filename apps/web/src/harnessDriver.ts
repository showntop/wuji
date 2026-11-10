// harness 接缝（D4）：mock 事件 → store 动作的唯一翻译层。
// P2 换真模型时只动本文件：driver 事件面不变（progress/log/done/blocked）。
//
// 重启语义（评审修正）：mock 闭包总是从 0 起跑、从不读存量进度，因此
// 【绝不】拿事件 pct 与 store 进度比较——那会把存量进度 ≥20% 的在跑步骤
// 打进无限重启循环（打回重排、带存档刷新两条主链路都会挂）。
// driver 自记已应用进度 applied；仅当 store 进度低于 applied（外部重置，
// 即 rerun）时取消并重启。
import { mockHarness } from "@wuji/harness";
import type { StepEvent } from "@wuji/harness";
import type { Task, Step } from "@wuji/model";
import type { WujiActions } from "@wuji/store";
import { useStore } from "./store";

const TICK = 400;
const keyOf = (taskId: string, stepId: string) => `${taskId}:${stepId}`;

export type DriverStore = {
  getState(): { tasks: Task[] } & Pick<WujiActions, "stepProgress" | "stepDone" | "stepBlocked" | "log">;
};
export type DriverHarness = { runStep(step: Step, onEvent: (e: StepEvent) => void): () => void };

export function createDriver(store: DriverStore, harness: DriverHarness) {
  const inflight = new Map<string, () => void>();
  const applied = new Map<string, number>(); // driver 视角的已应用进度（新闭包归零）

  function start(taskId: string, stepId: string) {
    const step = store.getState().tasks
      .find((t) => t.id === taskId)?.steps.find((s) => s.id === stepId);
    if (!step) return;
    const executor = step.executor;
    applied.set(keyOf(taskId, stepId), 0);
    const cancel = harness.runStep(step, (e) => translate(taskId, stepId, executor, e));
    inflight.set(keyOf(taskId, stepId), cancel);
  }

  function cancelKey(taskId: string, stepId: string) {
    const k = keyOf(taskId, stepId);
    inflight.get(k)?.();
    inflight.delete(k);
    applied.delete(k);
  }

  function translate(taskId: string, stepId: string, executor: string, e: StepEvent) {
    const s = store.getState();
    const step = s.tasks.find((t) => t.id === taskId)?.steps.find((x) => x.id === stepId);
    if (!step) return;
    const k = keyOf(taskId, stepId);
    if (e.type === "progress") {
      const last = applied.get(k) ?? 0;
      if (e.pct <= last) return; // 单调性残响，忽略
      if (step.progress != null && step.progress < last) {
        // store 进度被外部重置（rerun 置 0）→ 重启
        cancelKey(taskId, stepId);
        start(taskId, stepId);
        return;
      }
      applied.set(k, e.pct);
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

  function tick() {
    const { tasks } = store.getState();
    const live = new Set<string>();
    for (const t of tasks) {
      if (t.status === "done") continue;
      for (const step of t.steps) {
        if (step.status !== "running" || step.executor === "me") continue;
        live.add(keyOf(t.id, step.id));
        if (!inflight.has(keyOf(t.id, step.id))) start(t.id, step.id);
      }
    }
    for (const [k, cancel] of inflight) {
      if (!live.has(k)) { cancel(); inflight.delete(k); applied.delete(k); } // 步骤离开 running
    }
  }

  function stop() {
    for (const cancel of inflight.values()) cancel();
    inflight.clear();
    applied.clear();
  }

  return { tick, stop };
}

let stopFn: (() => void) | null = null;

export function startHarnessDriver(): () => void {
  if (stopFn) return stopFn; // StrictMode 双挂载防护
  const driver = createDriver(useStore, mockHarness);
  const timer = setInterval(driver.tick, TICK);
  stopFn = () => {
    clearInterval(timer);
    driver.stop();
    stopFn = null;
  };
  return stopFn;
}
