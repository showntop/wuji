// 收件箱动作（三档 / 批量清档）
import type { SetState, GetState, WujiActions } from "../types";

export function createInboxActions(set: SetState, get: GetState): Pick<WujiActions, "resolveInbox" | "clearInbox"> {
  return {
    resolveInbox(itemId, _mode) {
      set((s) => ({ inbox: s.inbox.filter((i) => i.id !== itemId) }));
    },
    clearInbox(kind) {
      const before = get().inbox.length;
      set((s) => ({ inbox: s.inbox.filter((i) => i.kind !== kind) }));
      return before - get().inbox.length;
    },
  };
}
