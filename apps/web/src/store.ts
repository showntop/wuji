// web 绑定层：fixtures 注入 + 持久化挂载 + 重置。领域逻辑与动作在 @wuji/store。
import { createWujiStore, attachPersistence, readPersisted, clearPersisted } from "@wuji/store";
import type { Task, Agent, InboxItem, LedgerEvent, Artifact } from "@wuji/model";
import tasksFixture from "../../../fixtures/tasks.json";
import agentsFixture from "../../../fixtures/agents.json";
import inboxFixture from "../../../fixtures/inbox.json";
import ledgerFixture from "../../../fixtures/ledger.json";
import artifactsFixture from "../../../fixtures/artifacts.json";

export const useStore = createWujiStore(readPersisted() ?? {
  tasks: tasksFixture as unknown as Task[],
  agents: agentsFixture as unknown as Agent[],
  inbox: inboxFixture as unknown as InboxItem[],
  ledger: ledgerFixture as unknown as LedgerEvent[],
  artifacts: artifactsFixture as unknown as Artifact[],
});

export function initPersistence() {
  attachPersistence(useStore);
}

export function resetPersisted() {
  clearPersisted();
  location.reload();
}
