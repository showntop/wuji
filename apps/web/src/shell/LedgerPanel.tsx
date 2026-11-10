// 账本抽屉：事件 / 引用 / 数字 三镜片（D3：状态的副产品）
import { useState } from "react";
import type { Agent } from "@wuji/model";
import { useStore } from "../store";
import { useShell } from "../shellStore";

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
