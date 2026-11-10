import { useState } from "react";
import type { Task, Agent } from "@wuji/model";
import { useStore } from "../store";
import { Lamp, StatusTag, Mk } from "@wuji/ui/src/components";
import { TaskFlowView } from "./TaskFlow";

const KIND_CN: Record<string, string> = { table: "表", doc: "稿", image: "图", note: "记" };

export function Views() {
  const tasks = useStore((s) => s.tasks);
  const route = useStore((s) => s.route);
  const openTaskId = useStore((s) => s.openTaskId);
  const setRoute = useStore((s) => s.setRoute);
  const openTask = tasks.find((t) => t.id === openTaskId);

  if (route === "task" && openTask) {
    return <TaskFlowView task={openTask} onBack={() => setRoute("tasks")} />;
  }
  const onOpen = (id: string) => { useStore.getState().openTaskId = id; setRoute("task"); };
  if (route === "agents") return <AgentsView />;
  if (route === "tasks") return <TasksView onOpen={onOpen} />;
  return <HomeView onOpen={onOpen} />;
}

/* ---------- 任务行 ---------- */
export function TaskRow({ t, onOpen, i }: { t: Task; onOpen: (id: string) => void; i: number }) {
  const stepOp = useStore((s) => s.stepOp);
  const agents = useStore((s) => s.agents);
  const agentById = new Map<string, Agent>(agents.map((a) => [a.id, a] as [string, Agent]));
  const crew = [...new Set(
    t.steps.filter((s) => ["running", "waiting"].includes(s.status)).map((s) => s.executor)
  )];
  const done = t.steps.filter((s) => s.status === "done").length;
  const pct = t.steps.length ? Math.round((done / t.steps.length) * 100) : 0;
  const cur = t.steps.find((s) => s.status === "running" || s.status === "waiting");
  const latest = cur ? `「${cur.name}」${cur.note || ""}` : t.status === "done" ? "已完成" : "排队中";
  return (
    <article className="trow" data-s={t.status} tabIndex={0}
             onClick={(e) => { if (!(e.target as HTMLElement).closest(".art")) onOpen(t.id); }}
             onKeyDown={(e) => { if (e.key === "Enter" && !(e.target as HTMLElement).closest(".art")) onOpen(t.id); }}>
      <div className="t-id"><Lamp s={t.status} /><span className="plate">{t.id}</span></div>
      <div className="t-main">
        <h3 className="t-title">{t.name}<StatusTag s={t.status} /></h3>
        <div className="t-crew">
          <span className="lab">执行</span>
          {(crew.length ? crew : t.steps.filter((s) => s.status !== "done").map((s) => s.executor)).slice(0, 5).map((ex) => (
            <Mk key={ex} mk={agentById.get(ex)?.mk ?? "具"} me={ex === "me"} />
          ))}
        </div>
        <p className="t-latest">{latest}</p>
      </div>
      <div className="t-flow">
        {t.steps.slice(0, 6).map((s) => (
          <div key={s.id} className="fnode" data-s={s.status === "running" ? "run" : s.status}
               title={s.name}><i className="lamp" /><span className="fn">{s.name}</span></div>
        ))}
      </div>
      <div className="t-side">
        <div className="t-prog"><span className="pct">{pct}%</span><span className="nm">{done} / {t.steps.length} 步</span></div>
        <div className="t-arts">
          {t.steps.flatMap((s) => s.artifacts).slice(0, 2).map((a) => (
            <button key={a.name} className="art" onClick={(e) => { e.stopPropagation(); stepOp; void 0; }}
                    data-open-art={a.name} data-task={t.id}>
              <span className="kind">{KIND_CN[a.kind]}</span>{a.name}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

/* ---------- 工作台 ---------- */
function HomeView({ onOpen }: { onOpen: (id: string) => void }) {
  const inbox = useStore((s) => s.inbox);
  const tasks = useStore((s) => s.tasks);
  const agents = useStore((s) => s.agents);
  const setRoute = useStore((s) => s.setRoute);
  const priority = inbox.filter((i) => i.kind !== "fyi");
  const live = tasks.filter((t) => t.status !== "done");
  return (
    <>
      <div className="sec-h"><h2>待我处理</h2><span className="count">{priority.length}</span>
        <span className="sec-note">决策优先 · 点开任务就地处理</span>
        <button className="btn sm ghost more" onClick={() => useStore.getState().setOverlay("desk")}>查看全部</button></div>
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
                <button className="btn sm ghost" onClick={(e) => { e.stopPropagation(); useStore.getState().setOverlay("desk"); }}>更多</button>
              </div>
            </article>
          );
        })}
        <button className="all-link" onClick={() => useStore.getState().setOverlay("desk")}>
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

/* ---------- 任务列表 ---------- */
function TasksView({ onOpen }: { onOpen: (id: string) => void }) {
  const tasks = useStore((s) => s.tasks);
  const [filter, setFilter] = useState("全部");
  const CN: Record<string, string> = { running: "进行中", waiting: "等待你", blocked: "阻塞", done: "已完成" };
  const defs = ["全部", "进行中", "等待你", "阻塞", "已完成"].map((k) => ({
    k, n: k === "全部" ? tasks.length : tasks.filter((t) => CN[t.status] === k).length,
  }));
  const rows = filter === "全部" ? tasks : tasks.filter((t) => CN[t.status] === filter);
  return (
    <>
      <div className="sec-h"><h2>任务</h2><span className="sec-note">点行看详情 · 点产物开查看器</span></div>
      <div className="filters">
        {defs.map((d) => (
          <button key={d.k} className="fchip" aria-pressed={filter === d.k} onClick={() => setFilter(d.k)}>
            {d.k}<span className="n">{d.n}</span>
          </button>
        ))}
      </div>
      {rows.map((t, i) => <TaskRow key={t.id} t={t} onOpen={onOpen} i={i} />)}
      {!rows.length && <div className="empty-box"><span className="big">这一档没有任务</span>换一个筛选看看。</div>}
      <div style={{ height: 140 }} />
    </>
  );
}

/* ---------- Agent 页 ---------- */
function AgentsView() {
  const agents = useStore((s) => s.agents);
  const setRoute = useStore((s) => s.setRoute);
  const tasks = useStore((s) => s.tasks);
  const [sel, setSel] = useState<string | null>(null);
  const a = agents.find((x) => x.id === sel);
  return (
    <>
      <div className="sec-h"><h2>Agent</h2><span className="sec-note">点卡片开详情 · 自治级随时可调</span></div>
      <div className="agents-grid">
        {agents.map((ag) => (
          <button key={ag.id} className="ac-full" data-s={ag.status} onClick={() => setSel(ag.id)}>
            <span className="r1"><span className={`mk${ag.me ? " me" : ""}`}>{ag.mk}</span>
              <span className="nm">{ag.name}</span><span className="role">{ag.role}</span>
              <span className={`st tag-s st-${ag.status === "waiting" ? "call" : ag.status}`}>{STATUS_LBL[ag.status]}</span></span>
            <p className="duty">{ag.duty}</p>
            <span className="stats">
              <span>自治 <b>{ag.trust ? `L${ag.trust}` : "—"}</b></span>
              <span>在单 <b>{ag.taskIds.length}</b></span>
              <span>通过 <b>{ag.stats.pass}{typeof ag.stats.pass === "number" ? "%" : ""}</b></span>
              <span>本周 <b>¥{ag.stats.cost}</b></span>
            </span>
          </button>
        ))}
        <button className="ac-add">招募 Agent · 定职责与自治级后入列</button>
      </div>
      {a && (
        <>
          <div className="scrim on" onClick={() => setSel(null)} />
          <div className="drawer on">
            <div className="dw-head">
              <span className={`mk${a.me ? " me" : ""}`} style={{ minWidth: 34, height: 30, fontSize: 15 }}>{a.mk}</span>
              <div><div className="dw-title">{a.name}</div><div className="dw-sub">{a.role}</div></div>
              <button className="dw-close" onClick={() => setSel(null)}>×</button>
            </div>
            <div className="dw-body">
              <div className="dw-sec"><div className="dw-h">职责</div><p className="note" style={{ margin: 0, fontSize: 13.5, color: "var(--ink-2)" }}>{a.duty}</p></div>
              {a.trust != null && <TrustCtl a={a} />}
              <div className="dw-sec"><div className="dw-h">在单任务 <small>{a.taskIds.length}</small></div>
                {a.taskIds.map((tid) => {
                  const t = tasks.find((x) => x.id === tid);
                  return <div key={tid} className="task-chip" style={{ cursor: "pointer" }} onClick={() => { setSel(null); setRoute("tasks"); }}><b>{tid}</b>{t?.name ?? ""}</div>;
                })}
                {!a.taskIds.length && <p className="note">手上没有任务</p>}
              </div>
              <div className="dw-sec"><div className="dw-h">本周账</div>
                <dl className="kv">
                  <div><dt>运行</dt><dd>{a.stats.runs}</dd></div>
                  <div><dt>通过率</dt><dd className={a.stats.pass < 85 ? "warn" : ""}>{a.stats.pass}%</dd></div>
                  <div><dt>返工</dt><dd>{a.stats.rework}</dd></div>
                  <div><dt>成本</dt><dd>¥{a.stats.cost}</dd></div>
                  <div><dt>找我</dt><dd className={a.stats.asks >= 5 ? "warn" : ""}>{a.stats.asks} 次</dd></div>
                  <div><dt>状态</dt><dd>{STATUS_LBL[a.status]}</dd></div>
                </dl>
              </div>
              {!a.me && (
                <div className="dw-sec"><div className="dw-h">任职</div>
                  <div className="wfp-acts">
                    <button className="btn sm" onClick={() => useStore.getState().toggleAgent(a.id, false)}>恢复</button>
                    <button className="btn sm" onClick={() => useStore.getState().toggleAgent(a.id, true)}>暂停供职</button>
                    <button className="btn sm warn" onClick={() => useStore.getState().toggleAgent(a.id, true)}>停用</button>
                  </div>
                  <p className="note">停用会撤离其在单任务，由 Steward 重新派单（演示不落账）。</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <div style={{ height: 140 }} />
    </>
  );
}

const STATUS_LBL: Record<Agent["status"], string> = {
  running: "在单", waiting: "等你", blocked: "阻塞", idle: "空闲",
};

function TrustCtl({ a }: { a: Agent }) {
  const setTrust = useStore((s) => s.setTrust);
  return (
    <div className="dw-sec"><div className="dw-h">自治级</div>
      <div className="trust" role="group" aria-label="自治级">
        {([1, 2, 3] as const).map((n) => (
          <button key={n} aria-pressed={a.trust === n} onClick={() => setTrust(a.id, n)}>L{n}</button>
        ))}
      </div>
      <p className="note">{a.trustNote}</p>
    </div>
  );
}
