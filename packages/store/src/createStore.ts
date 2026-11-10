// store 工厂（zustand 官方 slice 组装模式）：调用方注入初始数据（fixtures / 存档）
import { create } from "zustand";
import type { WujiState, WujiActions } from "./types";
import { createLedgerActions } from "./ledger";
import { createTaskActions } from "./actions/task";
import { createGateActions } from "./actions/gate";
import { createAgentActions } from "./actions/agent";
import { createInboxActions } from "./actions/inbox";

export function createWujiStore(initial: Partial<WujiState> = {}) {
  return create<WujiState & WujiActions>()((set, get) => ({
    tasks: [], agents: [], inbox: [], ledger: [], artifacts: [],
    ...initial,
    ...createLedgerActions(set, get),
    ...createTaskActions(set, get),
    ...createGateActions(set, get),
    ...createAgentActions(set, get),
    ...createInboxActions(set, get),
  }));
}
