import { describe, test, expect } from "vitest";
import { createWujiStore, selectTaskTimeline, selectStepTimeline, readPersisted } from "../src";
import type { Task, Step, Gate } from "@wuji/model";

/* ---------- 工厂 ---------- */
function mkStep(p: Partial<Step> & { id: string }): Step {
  return { name: p.id, executor: "me", status: "idle", deps: [], artifacts: [], ...p };
}
function mkTask(id: string, steps: Step[]): Task {
  const now = new Date().toISOString();
  return { id, name: `任务${id}`, status: "running", createdAt: now, updatedAt: now, steps };
}
const withTasks = (...tasks: Task[]) => createWujiStore({ tasks });
const fakeStorage = (raw: string | null): Pick<Storage, "getItem"> => ({ getItem: () => raw });

describe("dispatchTask", () => {
  test("创建下一编号任务，s2 带审批门且保持 idle（D7），账本 +1", () => {
    const s = createWujiStore();
    const before = s.getState().ledger.length;
    const id = s.getState().dispatchTask("写一份竞品速览");
    expect(id).toBe("T-01");
    const t = s.getState().tasks[0]!;
    expect(t.steps.map((x) => x.id)).toEqual(["s1", "s2", "s3"]);
    expect(t.steps[1]!.gate?.type).toBe("approval");
    expect(t.steps[1]!.status).toBe("idle");
    expect(s.getState().ledger.length).toBe(before + 1);
    expect(s.getState().ledger[0]!.actor).toBe("me");
  });
});

describe("stepOp", () => {
  test("rerun 重置进度并落 run 账（执行者署名）", () => {
    const s = withTasks(mkTask("T-01", [mkStep({ id: "s1", executor: "scout", status: "done", progress: 100 })]));
    s.getState().stepOp("T-01", "s1", "rerun");
    const st = s.getState().tasks[0]!.steps[0]!;
    expect(st.status).toBe("running");
    expect(st.progress).toBe(0);
    const last = s.getState().ledger.at(-1)!;
    expect(last.type).toBe("run");
    expect(last.actor).toBe("scout");
  });
  test("reassign 改派执行者并落 judgement 账（actor=me）", () => {
    const s = withTasks(mkTask("T-01", [mkStep({ id: "s1", executor: "scout" })]));
    s.getState().stepOp("T-01", "s1", "reassign", "quill");
    expect(s.getState().tasks[0]!.steps[0]!.executor).toBe("quill");
    expect(s.getState().ledger.at(-1)!.type).toBe("judgement");
  });
  test("done 置完成态", () => {
    const s = withTasks(mkTask("T-01", [mkStep({ id: "s1", status: "running" })]));
    s.getState().stepOp("T-01", "s1", "done");
    expect(s.getState().tasks[0]!.steps[0]!.status).toBe("done");
  });
});

describe("applyGate", () => {
  const approval = (backTarget: "self" | "upstream"): Gate =>
    ({ type: "approval", title: "方案待批", passLabel: "批准开工", backLabel: "打回重排", backTarget });
  const gateTask = (gate: Gate): Task =>
    mkTask("T-01", [
      mkStep({ id: "s1", executor: "flowsmith", status: "done" }),
      mkStep({ id: "s2", executor: "me", status: "waiting", deps: ["s1"], gate }),
    ]);

  test("approval pass → 步骤 done，备注=passLabel，落 approval 账", () => {
    const s = withTasks(gateTask(approval("upstream")));
    s.getState().applyGate("T-01", "s2", "pass");
    const st = s.getState().tasks[0]!.steps[1]!;
    expect(st.status).toBe("done");
    expect(st.note).toBe("批准开工");
    expect(s.getState().ledger.at(-1)!.type).toBe("approval");
  });
  test("approval back(upstream) → 上游重跑，门步回 idle", () => {
    const s = withTasks(gateTask(approval("upstream")));
    s.getState().applyGate("T-01", "s2", "back");
    const [up, gate] = s.getState().tasks[0]!.steps;
    expect(up!.status).toBe("running");
    expect(up!.note).toBe("打回重排");
    expect(gate!.status).toBe("idle");
  });
  test("approval back(self) → 自身重跑", () => {
    const s = withTasks(gateTask(approval("self")));
    s.getState().applyGate("T-01", "s2", "back");
    expect(s.getState().tasks[0]!.steps[1]!.status).toBe("running");
  });
  test("choice pick → insertStep 落位门步之后，deps 指向门步", () => {
    const g: Gate = { type: "choice", title: "分叉", options: [
      { label: "A", desc: "", effect: {} },
      { label: "B", desc: "", effect: { insertStep: { name: "补数据", executor: "scout", note: "n" } } },
    ] };
    const s = withTasks(gateTask(g));
    s.getState().applyGate("T-01", "s2", "pick", 1);
    const steps = s.getState().tasks[0]!.steps;
    expect(steps.length).toBe(3);
    expect(steps[1]!.id).toBe("s2");          // 门步原地不动
    expect(steps[2]!.name).toBe("补数据");     // 插在门步之后（idx+1）
    expect(steps[2]!.executor).toBe("scout");
    expect(steps[2]!.status).toBe("running");
    expect(steps[2]!.deps).toEqual(["s2"]);
    expect(s.getState().ledger.at(-1)!.type).toBe("judgement");
  });
  test("staffing hire → Agent 入列且重复选择不重复入列", () => {
    const g: Gate = { type: "staffing", title: "用人", options: [
      { label: "招", desc: "", effect: { status: "running", executor: "quill", hireAgent: {
        name: "Quill", role: "写手", mk: "QU", duty: "d", trust: 2, trustNote: "n",
        stats: { runs: 0, pass: 0, rework: 0, cost: 0, asks: 0 }, taskIds: [], status: "idle" } } },
    ] };
    const s = withTasks(gateTask(g));
    s.getState().applyGate("T-01", "s2", "pick", 0);
    s.getState().applyGate("T-01", "s2", "pick", 0);
    const agents = s.getState().agents;
    expect(agents.filter((a) => a.id === "quill").length).toBe(1);
    expect(s.getState().tasks[0]!.steps[1]!.executor).toBe("quill"); // 效果指派生效
    expect(agents[0]!.taskIds).toEqual(["T-01"]);                    // 在单反推
  });
});

describe("harness 动作与解锁规则", () => {
  test("stepProgress 只推进不落账", () => {
    const s = withTasks(mkTask("T-01", [mkStep({ id: "s1", executor: "scout", status: "running" })]));
    const before = s.getState().ledger.length;
    s.getState().stepProgress("T-01", "s1", 55);
    expect(s.getState().tasks[0]!.steps[0]!.progress).toBe(55);
    expect(s.getState().ledger.length).toBe(before);
  });
  test("stepDone 完成后：普通步自动起跑，gate 步转 waiting（D7）", () => {
    const s = withTasks(mkTask("T-01", [
      mkStep({ id: "s1", executor: "scout", status: "running", progress: 80 }),
      mkStep({ id: "s2", executor: "quill", status: "idle", deps: ["s1"] }),
      mkStep({ id: "s3", executor: "me", status: "idle", deps: ["s2"],
               gate: { type: "approval", title: "t", passLabel: "p", backLabel: "b", backTarget: "self" } }),
    ]));
    s.getState().stepDone("T-01", "s1");
    let [s1, s2] = s.getState().tasks[0]!.steps;
    expect(s1!.status).toBe("done");
    expect(s2!.status).toBe("running");
    expect(s2!.note).toBe("上游就绪 · 自动起跑");
    s.getState().stepDone("T-01", "s2");
    const steps = s.getState().tasks[0]!.steps;
    expect(steps[2]!.status).toBe("waiting");
    expect(steps[2]!.note).toBe("上游就绪 · 等你处理");
    const texts = s.getState().ledger.map((l) => l.text);
    expect(texts.some((t) => t.includes("自动起跑"))).toBe(true);
    expect(texts.some((t) => t.includes("等你处理"))).toBe(true);
  });
  test("stepBlocked 置阻塞并落账", () => {
    const s = withTasks(mkTask("T-01", [mkStep({ id: "s1", executor: "scout", status: "running" })]));
    s.getState().stepBlocked("T-01", "s1", "外部接口超时");
    const st = s.getState().tasks[0]!.steps[0]!;
    expect(st.status).toBe("blocked");
    expect(s.getState().ledger.at(-1)!.text).toContain("外部接口超时");
  });
});

describe("收件箱", () => {
  const item = (id: string, kind: "decision" | "confirm" | "fyi") =>
    ({ id, kind, from: "scout", title: "t", context: "c", minutes: 5, actions: [] });
  test("clearInbox 返回移除数并只清对应档", () => {
    const s = createWujiStore({ inbox: [item("i1", "fyi"), item("i2", "fyi"), item("i3", "confirm")] });
    expect(s.getState().clearInbox("fyi")).toBe(2);
    expect(s.getState().inbox.map((i) => i.id)).toEqual(["i3"]);
  });
  test("resolveInbox 移除单条", () => {
    const s = createWujiStore({ inbox: [item("i1", "confirm")] });
    s.getState().resolveInbox("i1", "read");
    expect(s.getState().inbox.length).toBe(0);
  });
});

describe("时序 selector", () => {
  const ev = (id: string, taskId: string, stepId?: string) =>
    ({ id, t: "2026-11-10T09:0" + id, actor: "scout", taskId, stepId, type: "run" as const, text: `e${id}` });
  test("任务级过滤 + 倒序；步骤级再过滤", () => {
    const ledger = [ev("1", "T-01", "s1"), ev("2", "T-01", "s2"), ev("3", "T-02", "s1")];
    expect(selectTaskTimeline(ledger, "T-01").map((e) => e.id)).toEqual(["2", "1"]);
    expect(selectStepTimeline(ledger, "T-01", "s1").map((e) => e.id)).toEqual(["1"]);
  });
});

describe("readPersisted（zod 整档校验）", () => {
  const validTask = mkTask("T-01", []);
  test("坏 JSON / 形状错 / 空存储 → null", () => {
    expect(readPersisted("k", fakeStorage("not json"))).toBeNull();
    expect(readPersisted("k", fakeStorage(JSON.stringify({ tasks: [{ nope: 1 }] })))).toBeNull();
    expect(readPersisted("k", fakeStorage(null))).toBeNull();
  });
  test("合法存档 → 返回各切片", () => {
    const ok = JSON.stringify({ tasks: [validTask], agents: [], inbox: [], ledger: [] });
    const saved = readPersisted("k", fakeStorage(ok));
    expect(saved?.tasks?.[0]?.id).toBe("T-01");
  });
});
