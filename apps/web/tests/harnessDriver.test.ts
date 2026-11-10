import { describe, test, expect } from "vitest";
import { createWujiStore } from "@wuji/store";
import type { Task, Step } from "@wuji/model";
import type { StepEvent } from "@wuji/harness";
import { createDriver } from "../src/harnessDriver";
import type { DriverHarness } from "../src/harnessDriver";

function mkStep(p: Partial<Step> & { id: string }): Step {
  return { name: p.id, executor: p.executor ?? "scout", status: p.status ?? "idle", deps: [], artifacts: [], ...p };
}
function mkTask(steps: Step[]): Task {
  const now = new Date().toISOString();
  return { id: "T-01", name: "任务", status: "running", createdAt: now, updatedAt: now, steps };
}
/** 可控 fake harness：闭包从 0 起跑，事件由测试手工驱动 */
function fakeHarness() {
  const starts: { step: Step; emit: (e: StepEvent) => void; cancels: number }[] = [];
  const harness: DriverHarness = {
    runStep(step, onEvent) {
      const rec = { step, emit: onEvent, cancels: 0 };
      starts.push(rec);
      return () => { rec.cancels++; };
    },
  };
  return { starts, harness };
}

describe("harnessDriver.createDriver", () => {
  test("新闭包首事件正常推进，存量进度不触发重启", () => {
    const { starts, harness } = fakeHarness();
    const store = createWujiStore({ tasks: [mkTask([mkStep({ id: "s1", status: "running", progress: 100 })])] });
    const d = createDriver(store, harness);
    d.tick(); // 扫描 → start（approval back 后上游重跑的存量场景）
    expect(starts.length).toBe(1);
    starts[0]!.emit({ type: "progress", stepId: "s1", pct: 20 });
    expect(starts.length).toBe(1);                                    // 不重启（Critical 回归）
    expect(store.getState().tasks[0]!.steps[0]!.progress).toBe(20);   // 正常回落推进
  });

  test("rerun 检测：store 进度被重置 → 取消旧闭包并重启", () => {
    const { starts, harness } = fakeHarness();
    const store = createWujiStore({ tasks: [mkTask([mkStep({ id: "s1", status: "running" })]) ] });
    const d = createDriver(store, harness);
    d.tick();
    starts[0]!.emit({ type: "progress", stepId: "s1", pct: 20 });
    starts[0]!.emit({ type: "progress", stepId: "s1", pct: 40 });
    store.getState().stepOp("T-01", "s1", "rerun");                    // progress → 0
    starts[0]!.emit({ type: "progress", stepId: "s1", pct: 60 });      // 旧闭包迟到的单调事件
    expect(starts.length).toBe(2);                                     // 重启（Important 回归）
    expect(starts[0]!.cancels).toBe(1);                                // 旧闭包被取消
    expect(store.getState().tasks[0]!.steps[0]!.progress).toBe(0);     // 未被 60 污染
    starts[1]!.emit({ type: "progress", stepId: "s1", pct: 20 });
    expect(store.getState().tasks[0]!.steps[0]!.progress).toBe(20);    // 新闭包从低处续推
  });

  test("离开 running → 取消在途闭包（回归钉）", () => {
    const { starts, harness } = fakeHarness();
    const store = createWujiStore({ tasks: [mkTask([mkStep({ id: "s1", status: "running" })])] });
    const d = createDriver(store, harness);
    d.tick();
    expect(starts.length).toBe(1);
    store.getState().stepOp("T-01", "s1", "pause"); // → external
    d.tick();
    expect(starts[0]!.cancels).toBe(1);
  });

  test("done 事件 → 取消 + stepDone 落账（回归钉）", () => {
    const { starts, harness } = fakeHarness();
    const store = createWujiStore({ tasks: [mkTask([mkStep({ id: "s1", status: "running", artifacts: [{ kind: "table", name: "比价表" }] })])] });
    const d = createDriver(store, harness);
    d.tick();
    starts[0]!.emit({ type: "progress", stepId: "s1", pct: 100 });
    starts[0]!.emit({ type: "done", stepId: "s1" });
    const st = store.getState().tasks[0]!.steps[0]!;
    expect(st.status).toBe("done");
    expect(starts[0]!.cancels).toBe(1);
    expect(store.getState().ledger.at(-1)!.text).toContain("比价表");
  });
});
