import { useEffect } from "react";
import { useStore, initPersistence, resetPersisted } from "./store";
import { useShell } from "./shellStore";
import { startHarnessDriver } from "./harnessDriver";
import { Seg7 } from "@wuji/ui";
import { HomeView } from "./routes/Home";
import { TasksView } from "./routes/Tasks";
import { AgentsView } from "./routes/Agents";
import { TaskFlowView } from "./routes/TaskDetail";
import { Desk } from "./shell/Desk";
import { LedgerPanel } from "./shell/LedgerPanel";
import { Summon } from "./shell/Summon";
import { ViewerOverlay } from "./shell/ViewerOverlay";

export default function App() {
  const route = useShell((s) => s.route);
  const setRoute = useShell((s) => s.setRoute);
  const overlay = useShell((s) => s.overlay);
  const openTaskId = useShell((s) => s.openTaskId);
  const viewer = useShell((s) => s.viewer);
  const inbox = useStore((s) => s.inbox);
  const tasks = useStore((s) => s.tasks);
  const agents = useStore((s) => s.agents);

  useEffect(() => {
    initPersistence();
    startHarnessDriver();
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? "")) return;
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === "Escape") { useShell.getState().setOverlay(null); useShell.getState().setViewer(null); }
      if (e.key === "c" || e.key === "C") useShell.getState().setOverlay(overlay === "desk" ? null : "desk");
      if (e.key === "l" || e.key === "L") useShell.getState().setOverlay(overlay === "ledger" ? null : "ledger");
      if (e.key === "1") setRoute("home");
      if (e.key === "2") setRoute("tasks");
      if (e.key === "3") setRoute("agents");
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [overlay, setRoute]);

  const live = tasks.filter((t) => t.status !== "done").length;
  const openTask = tasks.find((t) => t.id === openTaskId);
  const openTaskFn = useShell((s) => s.openTask);
  const waiting = tasks.filter((t) => t.status === "waiting").length;
  const myMinutes = tasks
    .flatMap((t) => t.steps)
    .filter((s) => s.executor === "me" && (s.status === "done" || s.status === "waiting"))
    .length * 12; // 示例口径：每步约 12 分钟
  const decided = tasks.filter((t) => t.steps.some((s) => s.status === "done" && s.gate?.type === "approval")).length;
  const net = tasks
    .filter((t) => t.status !== "done")
    .reduce((a, t) => a + (t.budget?.weeklyCost ? Math.round(t.budget.weeklyCost * 4.2) : 0), 0) + 24600;

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 22 44" aria-hidden="true">
            <rect x="3" y="1" width="16" height="9" fill="#ff4a35" /><rect x="3" y="11" width="16" height="9" fill="#ffc21a" />
            <rect x="3" y="21" width="16" height="9" fill="#3ad16f" /><rect x="9" y="31" width="4" height="9" fill="#3a3a36" />
            <rect x="4" y="40" width="14" height="3" fill="#3a3a36" />
          </svg>
          <div className="brand-name">无极</div>
        </div>
        <div className="meters">
          <div className="meter"><span className="meter-label">本周净额（示例口径）</span>
            <span className="meter-val"><span className="meter-unit">¥</span><Seg7 value={net} digits={5} green /></span></div>
          <div className="meter"><span className="meter-label">我的投入</span>
            <span className="meter-val"><Seg7 value={myMinutes} digits={3} /><span className="meter-unit">分钟</span></span></div>
          <div className="meter"><span className="meter-label">在跑 / 等你</span>
            <span className="meter-val"><span className="meter-small">{live}<em> / {waiting}</em></span></span></div>
          <div className="meter"><span className="meter-label">审批已决（示例）</span>
            <span className="meter-val"><span className="meter-small">{decided}</span></span></div>
        </div>
        <div className="topnav">
          <div className="navtabs" role="group" aria-label="视图">
            <button aria-pressed={route === "home"} onClick={() => setRoute("home")}>工作台</button>
            <button aria-pressed={route === "tasks"} onClick={() => setRoute("tasks")}>任务<span className="n">{tasks.length}</span></button>
            <button aria-pressed={route === "agents"} onClick={() => setRoute("agents")}>Agent</button>
          </div>
          <button className="btn" onClick={() => document.getElementById("summon-input")?.focus()}>
            <span className="kbd">⌘K</span>发起
          </button>
          <button className={`inbox-btn${inbox.length ? "" : " clear"}`} onClick={() => useShell.getState().setOverlay(overlay === "desk" ? null : "desk")}>
            <i className="beacon" /><span>待处理</span><span className="count">{inbox.length}</span>
          </button>
        </div>
      </header>

      {route !== "task" && (
        <div className="strip">
          <span className="sample">示例数据</span>
          <span>本地优先 · 状态存于本机</span>
          <span>任务 <b>{tasks.length}</b> · <b>{live}</b> 进行中</span>
          {waiting > 0 && <span className="alert">等你 ×{waiting}</span>}
          {tasks.some((t) => t.status === "blocked") && <span className="alert stop">有阻塞</span>}
          <span className="legend">
            {[["进行中", "var(--go)"], ["等待你", "var(--call)"], ["阻塞", "var(--stop)"], ["等待外部", "var(--hold)"], ["已完成", "var(--done)"]].map(([l, c]) => (
              <span key={l}><i style={{ background: c }} />{l}</span>
            ))}
          </span>
        </div>
      )}

      {route === "task" && openTask
        ? <TaskFlowView task={openTask} onBack={() => setRoute("tasks")} />
        : route === "agents" ? <AgentsView />
        : route === "tasks" ? <TasksView onOpen={openTaskFn} />
        : <HomeView onOpen={openTaskFn} />}
      <Summon />
      <Desk />
      <LedgerPanel />
      <ViewerOverlay />
      <button className="btn sm ghost" style={{ position: "fixed", right: 16, bottom: 70, zIndex: 36 }}
              onClick={() => { if (confirm("清空本机存档并重置为示例数据？")) resetPersisted(); }}>
        重置示例
      </button>
    </>
  );
}
