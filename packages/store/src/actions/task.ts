// 任务动作：派发 / 步骤操作 / harness 三动作（自旧 apps/web/src/store.ts 逐行迁移）
import type { Task } from "@wuji/model";
import type { SetState, GetState, WujiActions } from "../types";
import { byId, refresh } from "../internal";
import { nextId } from "../ledger";

export function createTaskActions(set: SetState, get: GetState): Pick<WujiActions,
  "dispatchTask" | "stepOp" | "stepProgress" | "stepDone" | "stepBlocked"> {
  return {
    dispatchTask(text) {
      const tasks = get().tasks;
      const maxN = Math.max(0, ...tasks.map((t) => parseInt(t.id.slice(2), 10) || 0));
      const id = `T-${String(maxN + 1).padStart(2, "0")}`;
      const now = new Date().toISOString();
      const task: Task = {
        id, name: text.slice(0, 30), status: "running",
        createdAt: now, updatedAt: now,
        steps: [
          { id: "s1", name: "排执行方案", executor: "flowsmith", status: "running", deps: [], artifacts: [] },
          { id: "s2", name: "用人审批", executor: "me", status: "idle", deps: ["s1"], artifacts: [],
            gate: { type: "approval", title: `「${text.slice(0, 16)}」执行方案待批`,
                    passLabel: "批准 · 开工", backLabel: "打回重排", backTarget: "upstream" } },
          { id: "s3", name: "开工执行", executor: "scout", status: "idle", deps: ["s2"], artifacts: [] },
        ],
      };
      set((s) => ({
        tasks: [...s.tasks, task],
        ledger: [...s.ledger, { id: nextId("L"), t: now, actor: "me", taskId: id, type: "run" as const,
                                text: `派出任务书：「${text.slice(0, 30)}」` }],
      }));
      // harness 由 web 侧 driver 驱动：s1 跑完 → 解锁 s2（gate → waiting「等你处理」）
      return id;
    },

    stepOp(taskId, stepId, op, to) {
      const t = byId(get().tasks, taskId);
      if (!t) return;
      const s = t.steps.find((x) => x.id === stepId);
      if (!s) return;
      if (op === "start" || op === "resume") s.status = "running";
      if (op === "pause") s.status = "external";
      if (op === "submit") { s.status = "waiting"; s.note = "产出已提交 · 等你过目"; }
      if (op === "done") { s.status = "done"; s.note = ""; }
      if (op === "rerun") {
        s.status = "running"; s.progress = 0;
        const stale = t.steps.filter((x) => x.status === "done" && x.deps.includes(stepId)).length;
        get().log({ actor: s.executor, taskId, stepId, type: "run", text: `从「${s.name}」重跑——上游冻结${stale ? `，下游 ${stale} 步将重新执行` : ""}` });
      }
      if (op === "reassign" && to) {
        s.executor = to;
        get().log({ actor: "me", taskId, stepId, type: "judgement", text: `「${s.name}」改派给 ${to}` });
      }
      refresh(t);
      set((st) => ({ tasks: st.tasks.map((x) => (x.id === taskId ? { ...t } : x)) }));
    },

    stepProgress(taskId, stepId, pct) {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id !== taskId ? t : {
          ...t,
          steps: t.steps.map((st) => (st.id === stepId
            ? { ...st, progress: Math.min(100, Math.max(0, Math.round(pct))) } : st)),
        })),
      }));
    },

    stepDone(taskId, stepId) {
      const t0 = byId(get().tasks, taskId);
      const raw = t0?.steps.find((x) => x.id === stepId);
      if (!t0 || !raw) return;
      const t: Task = { ...t0, steps: t0.steps.map((x) => ({ ...x })) };
      const step = t.steps.find((x) => x.id === stepId)!;
      step.status = "done"; step.progress = 100; step.note = "已完成";
      const arts = step.artifacts.length ? ` · 产出 ${step.artifacts.map((a) => a.name).join("、")}` : "";
      get().log({ actor: step.executor, taskId, stepId, type: "run", text: `「${step.name}」完成${arts}` });
      for (const sid of refresh(t)) {
        const u = t.steps.find((x) => x.id === sid);
        if (!u) continue;
        get().log({ actor: u.executor, taskId, stepId: sid, type: "run",
                    text: u.gate ? `「${u.name}」等你处理` : `「${u.name}」自动起跑` });
      }
      set((st) => ({ tasks: st.tasks.map((x) => (x.id === taskId ? { ...t } : x)) }));
    },

    stepBlocked(taskId, stepId, reason) {
      const t = byId(get().tasks, taskId);
      if (!t) return;
      const s = t.steps.find((x) => x.id === stepId);
      if (!s) return;
      s.status = "blocked";
      s.note = reason;
      get().log({ actor: s.executor, taskId, stepId, type: "run", text: `「${s.name}」受阻：${reason}` });
      refresh(t);
      set((st) => ({ tasks: st.tasks.map((x) => (x.id === taskId ? { ...t } : x)) }));
    },
  };
}
