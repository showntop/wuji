// 壳状态（视图路由 / 浮层 / 打开的任务）——应用本地 zustand，不入 @wuji/store
// （spec §3：store 包只装 tasks/agents/inbox/ledger(+artifacts) 数据切片）
import { create } from "zustand";

export type Route = "home" | "tasks" | "agents" | "task";
export type Overlay = null | "desk" | "ledger";

export interface ShellState {
  route: Route;
  openTaskId: string | null;
  overlay: Overlay;
  viewer: { taskId: string; name: string } | null;
}

interface ShellActions {
  setRoute(r: Route): void;
  setOpenTaskId(id: string): void;
  setOverlay(o: Overlay): void;
  setViewer(v: ShellState["viewer"]): void;
  /** 打开任务详情（切路由 + 记 openTaskId + 收起浮层） */
  openTask(id: string): void;
}

export const useShell = create<ShellState & ShellActions>((set) => ({
  route: "home",
  openTaskId: null,
  overlay: null,
  viewer: null,
  setRoute(r) { set({ route: r, overlay: null }); },
  setOpenTaskId(id) { set({ openTaskId: id }); },
  setOverlay(o) { set({ overlay: o }); },
  setViewer(v) { set({ viewer: v }); },
  openTask(id) { set({ openTaskId: id, route: "task", overlay: null }); },
}));
