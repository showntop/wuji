// 状态与动作（D3：每个动作落 LedgerEvent）
// M1 落地；切片：tasks / agents / inbox / ledger
import { createStore as zCreate } from "zustand";
import type { Task, Agent, InboxItem, LedgerEvent } from "@wuji/model";

export interface WujiState {
  tasks: Task[];
  agents: Agent[];
  inbox: InboxItem[];
  ledger: LedgerEvent[];
}

export const createStore = () => zCreate<WujiState>(() => ({
  tasks: [], agents: [], inbox: [], ledger: [],
}));
