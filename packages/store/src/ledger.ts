// 账本动作 + 全局 id 序列（D3：一切 mutation 经 log 落账）
import type { SetState, GetState, WujiActions } from "./types";

let seq = 1000;
export const nextId = (p: string) => `${p}${++seq}`;

export function createLedgerActions(set: SetState, _get: GetState): Pick<WujiActions, "log"> {
  return {
    log(e) {
      set((s) => ({ ledger: [...s.ledger, { id: nextId("L"), t: new Date().toISOString(), ...e }] }));
    },
  };
}
