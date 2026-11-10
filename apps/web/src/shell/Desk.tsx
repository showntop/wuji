// 待处理抽屉：三档收件箱（决策/确认/知情）+ 批量清档
import type { Agent, InboxItem } from "@wuji/model";
import { useStore } from "../store";
import { useShell } from "../shellStore";

export function Desk() {
  const inbox = useStore((s) => s.inbox);
  const agents = useStore((s) => s.agents);
  const overlay = useShell((s) => s.overlay);
  const setOverlay = useShell((s) => s.setOverlay);
  const resolveInbox = useStore((s) => s.resolveInbox);
  const clearInbox = useStore((s) => s.clearInbox);
  const on = overlay === "desk";
  const mins = inbox.reduce((a, i) => a + i.minutes, 0);
  const groups: [InboxItem["kind"], string, string][] = [
    ["decision", "决策", "只有你能定"],
    ["confirm", "确认", "过目即可 · 在任务里处理"],
    ["fyi", "知情", "看一眼就行"],
  ];
  const agentById = new Map<string, Agent>(agents.map((a) => [a.id, a] as [string, Agent]));
  return (
    <aside className={`drawer${on ? " on" : ""}`} aria-label="待处理">
      <div className="dw-head">
        <div><div className="dw-title">待处理</div>
          <p className="dw-sub">{inbox.length ? `${inbox.length} 件 · 预计 ${mins} 分钟` : "没有待处理"}</p></div>
        <button className="dw-close" onClick={() => setOverlay(null)}>×</button>
      </div>
      <div className="dw-body">
        {!inbox.length && <div className="empty-box"><span className="big">已全部处理完</span>没有任何事项需要你。关掉，去做别的事。</div>}
        {groups.map(([k, label, sub]) => {
          const items = inbox.filter((i) => i.kind === k);
          if (!items.length) return null;
          const batch = k === "fyi" && items.length > 1
            ? <button className="btn sm ghost" onClick={() => clearInbox("fyi")}>全部已读</button> : null;
          return (
            <div key={k} className="dw-sec">
              <div className="group-h"><span>{label}<small>{sub} · {items.length}</small></span>{batch}</div>
              {items.map((it) => {
                const a = agentById.get(it.from);
                return (
                  <article key={it.id} className="ticket" data-k={it.kind}>
                    <div className="tk-top">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span className={`mk${a?.me ? " me" : ""}`}>{a?.mk ?? it.from}</span>{a?.name ?? it.from}
                      </span>
                      {it.taskId && <span className="plate sm">{it.taskId}</span>}
                      <span className="mins">{it.minutes ? `约 ${it.minutes} 分` : "不占时间"}</span>
                    </div>
                    <h4>{it.title}</h4>
                    <p>{it.context}</p>
                    <div className="acts">
                      {it.taskId && <button className="btn sm go" onClick={() => useShell.getState().openTask(it.taskId!)}>打开任务 · 就地处理</button>}
                      <button className="btn sm ghost" onClick={() => resolveInbox(it.id, "read")}>已读</button>
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
