// 三 gate 效果机（ARCHITECTURE H1 的界面投影；每个效果 = 状态变更 + 账本）
import type { Step } from "@wuji/model";
import type { SetState, GetState, WujiActions } from "../types";
import { byId, refresh } from "../internal";
import { nextId } from "../ledger";

export function createGateActions(set: SetState, get: GetState): Pick<WujiActions, "applyGate"> {
  return {
    applyGate(taskId, stepId, kind, optionIdx) {
      const t = byId(get().tasks, taskId);
      if (!t) return;
      const idx = t.steps.findIndex((x) => x.id === stepId);
      const s = t.steps[idx];
      if (!s || !s.gate) return;
      const g = s.gate;
      const agents = [...get().agents];

      if (kind === "pass" || kind === "back") {
        if (g.type !== "approval") return;
        if (kind === "pass") {
          s.status = "done"; s.note = g.passLabel;
          get().log({ actor: "me", taskId, stepId, type: "approval", text: `通过「${g.title}」` });
        } else {
          if (g.backTarget === "self") { s.status = "running"; s.note = g.backLabel; }
          else {
            const up = t.steps.find((x) => s.deps.includes(x.id)) ?? t.steps[idx - 1];
            if (up) { up.status = "running"; up.note = g.backLabel; }
            s.status = "idle"; s.note = "";
          }
          get().log({ actor: "me", taskId, stepId, type: "approval", text: `打回「${g.title}」——${g.backLabel}` });
        }
      } else if (g.type === "choice") {
        const o = (g.options[optionIdx ?? 0])!;
        const eff = o.effect;
        if ("insertStep" in eff && eff.insertStep) {
          const ins: Step = { id: nextId("x"), name: eff.insertStep.name, executor: eff.insertStep.executor,
                              status: "running", note: eff.insertStep.note, deps: [s.id], artifacts: [] };
          t.steps.splice(idx + 1, 0, ins);
        }
        get().log({ actor: "me", taskId, stepId, type: "judgement", text: `${g.title}：${o.label}` });
      } else if (g.type === "staffing") {
        const o = (g.options[optionIdx ?? 0])!;
        const eff = o.effect;
        if (eff.hireAgent) {
          const aid = eff.hireAgent.name.toLowerCase();
          if (!agents.some((a) => a.id === aid)) {
            agents.push({ ...eff.hireAgent, id: aid, taskIds: [taskId], me: false });
            get().log({ actor: "me", type: "system", text: `招新 Agent：${eff.hireAgent.name} 入列（自治 L${eff.hireAgent.trust}）` });
          }
        }
        if (eff.executor) s.executor = eff.executor;
        s.status = eff.status ?? s.status;
        s.note = eff.note ?? s.note;
        get().log({ actor: "me", taskId, stepId, type: "judgement", text: `${g.title}：${o.label}` });
      }

      refresh(t);
      // Agent 在单任务反推
      for (const a of agents) {
        a.taskIds = [...new Set(
          t.steps.filter((x) => x.executor === a.id && (x.status === "running" || x.status === "waiting")).map(() => t.id)
        )];
      }
      set((st) => ({ tasks: st.tasks.map((x) => (x.id === taskId ? { ...t } : x)), agents }));
    },
  };
}
