import { create } from "zustand";
import type { Task, Step, Agent, InboxItem, LedgerEvent, ExecutorId, StepStatus } from "@wuji/model";
import { taskStatus, taskProgress, unlockSteps } from "@wuji/model";
import tasksFixture from "../../../fixtures/tasks.json";
import agentsFixture from "../../../fixtures/agents.json";
import inboxFixture from "../../../fixtures/inbox.json";
import ledgerFixture from "../../../fixtures/ledger.json";
import artifactsFixture from "../../../fixtures/artifacts.json";
import type { Artifact } from "@wuji/model";

const PERSIST_KEY = "wuji.store.v1";

type State = {
  tasks: Task[];
  agents: Agent[];
  inbox: InboxItem[];
  ledger: LedgerEvent[];
  artifacts: Artifact[];
  route: "home" | "tasks" | "agents" | "task";
  openTaskId: string | null;
  overlay: null | "desk" | "ledger";
  viewer: { taskId: string; name: string } | null;
};

type Actions = {
  log(e: Omit<LedgerEvent, "id" | "t">): void;
  setRoute(r: State["route"]): void;
  setOverlay(o: State["overlay"]): void;
  setViewer(v: State["viewer"]): void;
  dispatchTask(text: string): string;
  stepOp(taskId: string, stepId: string, op: "start" | "pause" | "resume" | "rerun" | "submit" | "reassign" | "done", to?: ExecutorId): void;
  applyGate(taskId: string, stepId: string, kind: "pass" | "back" | "pick", optionIdx?: number): void;
  resolveInbox(itemId: string, mode: "read" | "dismiss"): void;
  setTrust(agentId: string, trust: 1 | 2 | 3): void;
  toggleAgent(agentId: string, fire: boolean): void;
  clearInbox(kind: "confirm" | "fyi"): number;
};

function loadInitial(): State {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as State;
      if (saved.tasks?.length) return saved;
    }
  } catch { /* 忽略损坏的存档 */ }
  return {
    tasks: tasksFixture as unknown as Task[],
    agents: agentsFixture as unknown as Agent[],
    inbox: inboxFixture as unknown as InboxItem[],
    ledger: ledgerFixture as unknown as LedgerEvent[],
    artifacts: artifactsFixture as unknown as Artifact[],
    route: "home", openTaskId: null, overlay: null, viewer: null,
  };
}

let seq = 1000;
const nextId = (p: string) => `${p}${++seq}`;

export const useStore = create<State & Actions>((set, get) => {
  /** 任务派生统一收口：状态归约 + 下游解锁 + 时间戳 */
  function refresh(t: Task): void {
    const unlocked = unlockSteps(t.steps);
    for (const sid of unlocked) {
      const st = t.steps.find((s) => s.id === sid);
      if (st) st.note = "上游就绪 · 自动起跑";
    }
    t.status = taskStatus(t.steps);
    t.updatedAt = new Date().toISOString();
  }
  const byId = (tasks: Task[], id: string) => tasks.find((t) => t.id === id);

  return {
    ...loadInitial(),

    setRoute(r) { set({ route: r, overlay: null }); },
    setOverlay(o) { set({ overlay: o }); },
    setViewer(v) { set({ viewer: v }); },

    log(e) {
      set((s) => ({
        ledger: [...s.ledger, { id: nextId("L"), t: new Date().toISOString(), ...e }],
      }));
    },

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
      // mock harness：3 秒后方案出，停在用人审批
      setTimeout(() => {
        const t = get().tasks.find((x) => x.id === id);
        if (!t) return;
        const plan = t.steps.find((s) => s.id === "s1");
        const gate = t.steps.find((s) => s.id === "s2");
        if (plan) plan.status = "done";
        if (gate && gate.status === "idle") { gate.status = "waiting"; gate.note = "方案已出 · 等你批"; }
        get().log({ actor: "flowsmith", taskId: id, type: "approval", text: `执行方案完成 · 递你审批（${text.slice(0, 16)}）` });
        set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...t } : x)) }));
      }, 3000);
      return id;
    },

    stepOp(taskId, stepId, op, to) {
      const t = byId(get().tasks, taskId);
      if (!t) return;
      const s = t.steps.find((x) => x.id === stepId);
      if (!s) return;
      const now = new Date().toISOString();
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
          const ins: Step = { id: `x${seq++}`, name: eff.insertStep.name, executor: eff.insertStep.executor,
                              status: "running", note: eff.insertStep.note, deps: [s.id], artifacts: [] };
          t.steps.splice(idx + 1, 0, ins);
          if (s.deps.length) for (const x of t.steps) x.deps = x.deps.map((d) => (d === s.id && x.id !== ins.id ? d : d));
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

    resolveInbox(itemId, mode) {
      if (mode === "read" || mode === "dismiss") {
        set((s) => ({ inbox: s.inbox.filter((i) => i.id !== itemId) }));
      }
    },

    setTrust(agentId, trust) {
      set((s) => ({ agents: s.agents.map((a) => (a.id === agentId ? { ...a, trust } : a)) }));
      get().log({ actor: "me", type: "system", text: `Agent ${agentId} 自治级改为 L${trust}` });
    },

    toggleAgent(agentId, fire) {
      set((s) => ({
        agents: s.agents.map((a) => {
          if (a.id !== agentId) return a;
          if (fire) return { ...a, status: "idle" as const, trustNote: "已停用 · 由 Steward 重派在单任务" };
          return { ...a, status: a.status === "idle" ? "running" : a.status };
        }),
      }));
    },

    clearInbox(kind) {
      const before = get().inbox.length;
      set((s) => ({ inbox: s.inbox.filter((i) => i.kind !== kind) }));
      return before - get().inbox.length;
    },
  };
});

/* ---------- mock harness（M3）：running 步骤自主推进 ---------- */
let harnessTimer: ReturnType<typeof setInterval> | null = null;
export function startHarnessMock() {
  if (harnessTimer) return;
  harnessTimer = setInterval(() => {
    const s = useStore.getState();
    const tasks = s.tasks;
    let changed = false;
    for (const t of tasks) {
      if (t.status === "done") continue;
      for (const step of t.steps) {
        if (step.status !== "running" || step.executor === "me") continue;
        changed = true;
        const next = Math.min(100, (step.progress ?? 0) + 12 + Math.round(Math.random() * 12));
        step.progress = next;
        if (next >= 100) {
          step.status = "done"; step.note = "已完成";
          s.log({ actor: step.executor, taskId: t.id, stepId: step.id, type: "run", text: `「${step.name}」完成${step.artifacts.length ? ` · 产出 ${step.artifacts.map((a) => a.name).join("、")}` : ""}` });
          const unlocked = unlockSteps(t.steps);
          for (const sid of unlocked) {
            const st = t.steps.find((x) => x.id === sid);
            if (st) { st.note = "上游就绪 · 自动起跑"; s.log({ actor: st.executor, taskId: t.id, stepId: sid, type: "run", text: `「${st.name}」自动起跑` }); }
          }
          t.status = taskStatus(t.steps);
        }
      }
    }
    if (changed) useStore.setState({ tasks: tasks.map((t) => ({ ...t })) });
  }, 4000);
}

/* ---------- 持久化（M3：localStorage；IndexedDB 在有大数据量时再换） ---------- */
export function initPersistence() {
  useStore.subscribe((s) => {
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify({ tasks: s.tasks, agents: s.agents, inbox: s.inbox, ledger: s.ledger }));
    } catch { /* 存储满时静默 */ }
  });
}
export function resetPersisted() {
  localStorage.removeItem(PERSIST_KEY);
  location.reload();
}
