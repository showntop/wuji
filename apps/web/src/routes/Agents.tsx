// Agent 页：编制网格 + 详情抽屉（自治级 / 任职 / 周账）
import { useState } from "react";
import type { Agent } from "@wuji/model";
import { useStore } from "../store";
import { useShell } from "../shellStore";

export function AgentsView() {
  const agents = useStore((s) => s.agents);
  const setRoute = useShell((s) => s.setRoute);
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
