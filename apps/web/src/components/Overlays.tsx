import { useEffect, useRef, useState } from "react";
import type { Agent, InboxItem } from "@wuji/model";
import { useStore } from "../store";
import { useShell } from "../shellStore";
import { Mk } from "@wuji/ui/src/components";
import { ArtifactView } from "@wuji/viewers/src/Viewer";

const KIND_CN: Record<string, string> = { decision: "决策", confirm: "确认", fyi: "知情" };

/* ---------- 待处理抽屉 ---------- */
export function Desk() {
  const inbox = useStore((s) => s.inbox);
  const agents = useStore((s) => s.agents);
  const overlay = useShell((s) => s.overlay);
  const setOverlay = useShell((s) => s.setOverlay);
  const resolveInbox = useStore((s) => s.resolveInbox);
  const clearInbox = useStore((s) => s.clearInbox);
  const openTask = useShell((s) => s.openTask);
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
                      {it.taskId && <button className="btn sm go" onClick={() => openTask(it.taskId!)}>打开任务 · 就地处理</button>}
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

/* ---------- 账本抽屉 ---------- */
type Lens = "events" | "rels" | "nums";
export function LedgerPanel() {
  const ledger = useStore((s) => s.ledger);
  const overlay = useShell((s) => s.overlay);
  const setOverlay = useShell((s) => s.setOverlay);
  const tasks = useStore((s) => s.tasks);
  const agents = useStore((s) => s.agents);
  const [lens, setLens] = useState<Lens>("events");
  const [f, setF] = useState("全部");
  const on = overlay === "ledger";
  const TYPES: Record<string, string> = { run: "运行", approval: "审批", judgement: "判断", system: "系统" };
  const agentById = new Map<string, Agent>(agents.map((a) => [a.id, a] as [string, Agent]));
  const rows = ledger.filter((l) => f === "全部" || TYPES[l.type] === f).slice().reverse();
  const rels = tasks.flatMap((t) =>
    t.steps.flatMap((s) => [
      ...s.artifacts.map((a) => ({ from: `${t.id} ${s.name}`, kind: "derived", to: a.name, st: "" })),
      ...s.deps.map((d) => {
        const dep = t.steps.find((x) => x.id === d);
        return { from: `${t.id} ${dep?.name ?? d}`, kind: "sequence", to: `${t.id} ${s.name}`, st: "" };
      }),
    ])
  );
  const costSum = agents.reduce((a, x) => a + x.stats.cost, 0);
  return (
    <aside className={`ledger${on ? " on" : ""}`} aria-label="账本">
      <div className="lg-head">
        <div><div className="lg-title">账本</div><div className="lg-sub">全系统可审计 · 单一事件流</div></div>
        <div className="lg-tabs">
          <button aria-pressed={lens === "events"} onClick={() => setLens("events")}>事件</button>
          <button aria-pressed={lens === "rels"} onClick={() => setLens("rels")}>引用</button>
          <button aria-pressed={lens === "nums"} onClick={() => setLens("nums")}>数字</button>
        </div>
        <button className="dw-close" onClick={() => setOverlay(null)}>×</button>
      </div>
      <div className="lg-body">
        {lens === "events" && (
          <>
            <div className="lg-filters">
              {["全部", "运行", "审批", "判断", "系统"].map((k) => (
                <button key={k} className="lg-fchip" aria-pressed={f === k}
                        onClick={() => setF(k)}>{k} <span style={{ opacity: .6 }}>{k === "全部" ? ledger.length : ledger.filter((l) => TYPES[l.type] === k).length}</span></button>
              ))}
            </div>
            {rows.map((l) => (
              <div key={l.id} className="levent">
                <time>{l.t.slice(5, 16).replace("T", " ")}</time>
                <span className="mk">{agentById.get(l.actor)?.mk ?? l.actor}</span>
                <span className="lt">{l.taskId && <span className="plate sm">{l.taskId}</span>}{l.text}</span>
                <span className={`lk ${l.type}`}>{TYPES[l.type]}</span>
              </div>
            ))}
          </>
        )}
        {lens === "rels" && (
          <>
            {rels.map((r, i) => (
              <div key={i} className="lrel">
                <span className="side">{r.from}</span>
                <span className="kind">{r.kind}</span>
                <span className="side">{r.to}</span>
                <span className="stt" />
              </div>
            ))}
            <p className="note" style={{ marginTop: 14 }}>derived＝步骤产出产物 · sequence＝步骤先后。绑定类引用（binds）由人建立，变更必经预览。</p>
          </>
        )}
        {lens === "nums" && (
          <>
            <div className="lh">任务</div>
            <div className="lbar"><span>总数</span><span className="track" /><span className="val">{tasks.length}</span></div>
            <div className="lbar"><span>进行中</span><span className="track"><i style={{ width: `${(tasks.filter((t) => t.status !== "done").length / Math.max(1, tasks.length)) * 100}%` }} /></span><span className="val">{tasks.filter((t) => t.status !== "done").length}</span></div>
            <div className="lbar"><span>等待你</span><span className="track"><i style={{ width: `${(tasks.filter((t) => t.status === "waiting").length / Math.max(1, tasks.length)) * 100}%` }} /></span><span className="val">{tasks.filter((t) => t.status === "waiting").length}</span></div>
            <div className="lh">Agent 成本 · 本周 ¥{costSum}</div>
            {agents.filter((a) => a.stats.cost > 0).sort((a, b) => b.stats.cost - a.stats.cost).map((a) => (
              <div key={a.id} className="lbar">
                <span>{a.name} · {a.role}</span>
                <span className="track"><i style={{ width: `${(a.stats.cost / Math.max(1, costSum)) * 100}%` }} /></span>
                <span className="val">¥{a.stats.cost}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

/* ---------- 快速发起 ---------- */
export function Summon() {
  const [mode, setMode] = useState<"ask" | "dispatch">("ask");
  const [text, setText] = useState("");
  const dispatchTask = useStore((s) => s.dispatchTask);
  const setRoute = useShell((s) => s.setRoute);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); inputRef.current?.focus(); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);
  return (
    <div className="summon-zone">
      <form className="summon" onSubmit={(e) => {
        e.preventDefault();
        if (mode === "ask") return;
        const t = text.trim();
        if (!t) return;
        setText("");
        const id = dispatchTask(t);
        setRoute("tasks");
        setTimeout(() => {
          const row = document.querySelector(`.trow[data-task="${id}"]`) ?? document.querySelector(`.trow`);
          (row as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }} autoComplete="off">
        <div className="toggle" role="group" aria-label="模式">
          <button type="button" aria-pressed={mode === "ask"} onClick={() => setMode("ask")}>问答</button>
          <button type="button" aria-pressed={mode === "dispatch"} onClick={() => setMode("dispatch")}>派任务</button>
        </div>
        <input id="summon-input" ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
               placeholder={mode === "ask" ? "问点什么 —— 气泡应答在接真模型后可用" : "要什么结果？提交后系统排方案，用谁由你审批"} />
        <span className="kbd">⌘K</span>
        <button className="send" type="submit" aria-label="发出">→</button>
        {mode === "dispatch" && (
          <div className="whint"><b>派任务</b>：写清要什么结果 —— 提交后系统排执行方案，<b>用谁由你审批</b>。</div>
        )}
      </form>
      <p className="hints"><b>C</b> 待处理 · <b>L</b> 账本 · <b>1/2/3</b> 工作台/任务/Agent</p>
    </div>
  );
}

/* ---------- 产物查看器（全局入口：列表形态片） ---------- */
export function ViewerOverlay() {
  const viewer = useShell((s) => s.viewer);
  const setViewer = useShell((s) => s.setViewer);
  const artifacts = useStore((s) => s.artifacts);
  const tasks = useStore((s) => s.tasks);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && viewer) setViewer(null); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [viewer, setViewer]);
  if (!viewer) return null;
  const short = viewer.name.replace(/ · .*$/, "");
  const a = artifacts.find((x) => x.taskId === viewer.taskId && x.name.includes(short))
         ?? artifacts.find((x) => x.name.includes(short));
  const task = tasks.find((t) => t.id === viewer.taskId);
  return (
    <div className="aviewer">
      <div className="av-head">
        <span className="plate sm">{viewer.taskId}</span>
        <span className="kind">{a ? ({ table: "表", doc: "稿", image: "图", note: "记" } as Record<string, string>)[a.kind] : "?"}</span>
        <div className="av-title">{viewer.name}</div>
        <div className="av-meta">{task?.name ?? ""}</div>
        <button className="btn sm" style={{ marginLeft: "auto" }} onClick={() => setViewer(null)}>关闭 (Esc)</button>
      </div>
      <div className="av-body">
        {a ? <ArtifactView artifact={a} />
           : <p className="note" style={{ maxWidth: 680, margin: "40px auto" }}>产物内容将在对应步骤完成后写入（当前为占位）。</p>}
      </div>
    </div>
  );
}

/* ---------- Agent 详情（列表页内已含；此处为待处理引用的共享原子） ---------- */
export function agentMk(id: string, agents: Agent[]) {
  return agents.find((a) => a.id === id)?.mk ?? "具";
}
