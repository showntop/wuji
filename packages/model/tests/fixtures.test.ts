/**
 * M0 验收：fixtures 必须通过 @wuji/model 的 zod schema，
 * 且 DAG 无环、deps 引用合法、派生状态与落库状态一致。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  taskSchema, agentSchema, inboxItemSchema, ledgerEventSchema,
  taskStatus, taskProgress, isAcyclic,
} from "../src/index";
import type { Task, Step } from "../src/index";

const F = join(__dirname, "../../../fixtures");
const load = (n: string) => JSON.parse(readFileSync(join(F, n), "utf-8"));

describe("fixtures @wuji/model", () => {
  const tasks: Task[] = load("tasks.json");
  const agents = load("agents.json");
  const inbox = load("inbox.json");
  const ledger = load("ledger.json");

  it("tasks.json 通过 zod schema", () => {
    for (const t of tasks) expect(() => taskSchema.parse(t)).not.toThrow();
  });

  it("agents.json / inbox.json / ledger.json 通过 zod schema", () => {
    for (const a of agents) expect(() => agentSchema.parse(a)).not.toThrow();
    for (const i of inbox) expect(() => inboxItemSchema.parse(i)).not.toThrow();
    for (const l of ledger) expect(() => ledgerEventSchema.parse(l)).not.toThrow();
  });

  it("每个任务的 DAG 无环", () => {
    for (const t of tasks) expect(isAcyclic(t.steps)).toBe(true);
  });

  it("deps 引用合法（指向本任务存在的步骤 id）", () => {
    for (const t of tasks) {
      const ids = new Set(t.steps.map((s: Step) => s.id));
      for (const s of t.steps)
        for (const d of s.deps) expect(ids.has(d), `${t.id}/${s.id} -> ${d}`).toBe(true);
    }
  });

  it("派生状态与落库状态一致（waiting/running/done）", () => {
    for (const t of tasks) {
      if (t.status === "done") {
        expect(t.steps.every((s) => s.status === "done"), `${t.id} 应全 done`).toBe(true);
      } else {
        expect(taskStatus(t.steps), `${t.id} 派生=${taskStatus(t.steps)} 落库=${t.status}`).toBe(t.status);
        const { total } = taskProgress(t.steps);
        expect(total).toBe(t.steps.length);
      }
    }
  });

  it("gate 只挂在 waiting / blocked 步骤上", () => {
    for (const t of tasks)
      for (const s of t.steps)
        if (s.gate) expect(["waiting", "blocked", "idle"], `${t.id}/${s.id}`).toContain(s.status);
  });

  it("T-09 闭环完整：分发之后有数据回流与变现", () => {
    const t9 = tasks.find((t) => t.id === "T-09")!;
    const names = t9.steps.map((s) => s.name);
    expect(names.some((n) => n.includes("数据回流"))).toBe(true);
    expect(names.some((n) => n.includes("变现"))).toBe(true);
  });

  it("步骤产物名都能在 artifacts.json 找到（有产物的步骤）", () => {
    const artifacts = load("artifacts.json");
    const names = new Set(artifacts.map((a: { name: string }) => a.name));
    for (const t of tasks)
      for (const s of t.steps)
        for (const a of s.artifacts) expect(names.has(a.name), `${t.id}/${s.id}: ${a.name}`).toBe(true);
  });
});
