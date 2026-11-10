// 工作台（首页）：待我处理 / 进行中任务 / Agent 概览
import { useStore } from "../store";
import { useShell } from "../shellStore";
import { TaskRow } from "./TaskRow";

export function HomeView({ onOpen }: { onOpen: (id: string) => void }) {
  const inbox = useStore((s) => s.inbox);
  const tasks = useStore((s) => s.tasks);
  const agents = useStore((s) => s.agents);
  const setRoute = useShell((s) => s.setRoute);
  const priority = inbox.filter((i) => i.kind !== "fyi");
  const live = tasks.filter((t) => t.status !== "done");
  return (
    <>
      <div className="sec-h"><h2>待我处理</h2><span className="count">{priority.length}</span>
        <span className="sec-note">决策优先 · 点开任务就地处理</span>
        <button className="btn sm ghost more" onClick={() => useShell.getState().setOverlay("desk")}>查看全部</button></div>
      <div className="attend">
        {priority.slice(0, 3).map((it) => {
          const a = agents.find((x) => x.id === it.from);
          return (
            <article key={it.id} className="acard" data-t={it.kind}
                     onClick={() => { if (it.taskId) onOpen(it.taskId); }}>
              <div className="acard-top">
                <span className="tt">{it.kind === "decision" ? "决策" : "确认"}</span>
                <span className="mk">{a?.mk ?? it.from}</span><span>{a?.name ?? it.from}</span>
                {it.taskId && <span className="plate sm">{it.taskId}</span>}
                <span className="mins">{it.minutes ? `约 ${it.minutes} 分` : ""}</span>
              </div>
              <h3>{it.title}</h3>
              <p>{it.context}</p>
              <div className="acts">
                {it.taskId && <button className="btn sm go" onClick={(e) => { e.stopPropagation(); onOpen(it.taskId!); }}>去处理</button>}
                <button className="btn sm ghost" onClick={(e) => { e.stopPropagation(); useShell.getState().setOverlay("desk"); }}>更多</button>
              </div>
            </article>
          );
        })}
        <button className="all-link" onClick={() => useShell.getState().setOverlay("desk")}>
          <b>+{Math.max(0, priority.length - 3)}</b>查看全部待处理
        </button>
      </div>
      <div className="sec-h"><h2>进行中的任务</h2>
        <span className="sec-note">点行看详情 · 需要你拍板的在节点上就地处理</span>
        <button className="btn sm ghost more" onClick={() => setRoute("tasks")}>全部任务</button></div>
      <div>{live.slice(0, 4).map((t, i) => <TaskRow key={t.id} t={t} onOpen={onOpen} i={i} />)}</div>
      <div className="sec-h"><h2>Agent</h2>
        <span className="sec-note">{agents.length} 名 · 点卡片管理</span>
        <button className="btn sm ghost more" onClick={() => setRoute("agents")}>管理全部</button></div>
      <div className="agents-strip">
        {agents.slice(0, 8).map((a) => (
          <button key={a.id} className="ac-mini" data-s={a.status} onClick={() => setRoute("agents")}>
            <span className="r1"><span className={`mk${a.me ? " me" : ""}`}>{a.mk}</span><span className="nm">{a.name}</span>
              <span className={`st tag-s st-${a.status === "waiting" ? "call" : a.status}`}>{a.status === "idle" ? "空闲" : a.status === "waiting" ? "等你" : a.status === "blocked" ? "阻塞" : a.status === "running" ? "在单" : "空闲"}</span></span>
            <span className="r2">{a.role} · 在单 <b>{a.taskIds.length}</b> · ¥{a.stats.cost}</span>
          </button>
        ))}
        <button className="ac-mini ac-add" onClick={() => setRoute("agents")}>招募 Agent</button>
      </div>
      <div style={{ height: 140 }} />
    </>
  );
}
