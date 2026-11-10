// 持久化（D6 本地优先）：localStorage 缺席（node/隐私模式）时全部静默跳过。
// 读回经 zod 整档校验——损坏或形状不对的存档整体回退 fixtures，不白屏。
import { z } from "zod";
import { taskSchema, agentSchema, inboxItemSchema, ledgerEventSchema } from "@wuji/model";
import type { WujiState, WujiActions } from "./types";

export const PERSIST_KEY = "wuji.store.v1";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type PersistedSlices = Pick<WujiState, "tasks" | "agents" | "inbox" | "ledger">;

function safeStorage(): StorageLike | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch { return null; }
}

const savedSchema = z.object({
  tasks: z.array(taskSchema),
  agents: z.array(agentSchema),
  inbox: z.array(inboxItemSchema),
  ledger: z.array(ledgerEventSchema),
});

export function readPersisted(
  key: string = PERSIST_KEY,
  storage: StorageLike | null = safeStorage(),
): PersistedSlices | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    // zod 推断把 effect 视为可选，与 model 的必填 InboxAction 类型面不合；运行时校验不变，仅收窄类型
    const parsed = savedSchema.parse(JSON.parse(raw)) as PersistedSlices;
    if (!parsed.tasks.length) return null; // 空档视为无存档（与旧 loadInitial 判据一致）
    return parsed;
  } catch { return null; }
}

export function attachPersistence(
  store: { subscribe(fn: (s: WujiState & WujiActions) => void): () => void },
  key: string = PERSIST_KEY,
  storage: StorageLike | null = safeStorage(),
): void {
  if (!storage) return;
  store.subscribe((s) => {
    try {
      storage.setItem(key, JSON.stringify({ tasks: s.tasks, agents: s.agents, inbox: s.inbox, ledger: s.ledger }));
    } catch { /* 存储满时静默 */ }
  });
}

export function clearPersisted(key: string = PERSIST_KEY, storage: StorageLike | null = safeStorage()): void {
  storage?.removeItem(key);
}
