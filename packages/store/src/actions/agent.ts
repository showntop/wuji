// Agent 动作（自治级 / 供职）
import type { SetState, GetState, WujiActions } from "../types";

export function createAgentActions(set: SetState, get: GetState): Pick<WujiActions, "setTrust" | "toggleAgent"> {
  return {
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
  };
}
