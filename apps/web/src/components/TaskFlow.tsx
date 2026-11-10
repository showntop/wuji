import { useEffect, useMemo, useRef, useState } from "react";
import { layoutDag } from "@wuji/workflow";
import type { Task, Step, Agent } from "@wuji/model";
import { taskProgress } from "@wuji/model";
import { useStore } from "../store";
import { Lamp, StatusTag, Mk } from "@wuji/ui/src/components";
import { ArtifactView, findArtifact } from "@wuji/viewers";

const KIND_CN: Record<string, string> = { table: "表", doc: "稿", image: "图", note: "记" };
const cam0 = { x: 24, y: 16, z: 1 };

export function TaskFlowView({ task, onBack }: { task: Task; onBack: () => void }) {
  const agents = useStore((s) => s.agents);
  const ledger = useStore((s) => s.ledger);
  const artifacts = useStore((s) => s.artifacts);
  const stepOp = useStore((s) => s.stepOp);
  const applyGate = useStore((s) => s.applyGate);
  const [selId, setSelId] = useState<string | null>(null);
  const [art, setArt] = useState<Step["artifacts"][number] | null>(null);
  const [cam, setCam] = useState(cam0);
  const drag = useRef<{ x0: number; y0: number; cx: number; cy: number } | null>(null);

  useEffect(() => { setSelId(null); setArt(null); setCam(cam0); }, [task.id]);

  const prog = taskProgress(task.steps);
  const layout = useMemo(
    () => layoutDag(task.steps, { lanePitch: 156 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task.id, task.steps.length, task.steps.map((s) => s.status).join()]
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const z = Math.min(1, Math.max(0.45, (el.clientWidth - 30) / layout.width, (el.clientHeight - 30) / layout.height));
    setCam({ x: 16, y: 12, z });
  }, [layout.width, layout.height]);
  const posById = new Map(layout.nodes.map((n) => [n.id, n]));
  const selStep = task.steps.find((s) => s.id === selId) ?? null;
  const agentById = new Map<string, Agent>(agents.map((a) => [a.id, a] as [string, Agent]));

  const timeline = selId
    ? ledger.filter((l) => l.taskId === task.id && l.stepId === selId).slice().reverse()
    : ledger.filter((l) => l.taskId === task.id).slice().reverse();

  const blocked = task.steps.filter((s) => s.status === "blocked");

  return (
    <main id="view-task">
      <div className="wf-head">
        <button className="btn sm ghost" onClick={onBack}>← 返回列表</button>
        <span className="plate">{task.id}</span>
        <div className="wf-title">{task.name}</div>
        <div className="wf-meta">
          <StatusTag s={task.status} />
          <span className="prog">{prog.pct}%</span>
          <span>{prog.done} / {prog.total} 步</span>
        </div>
        <div className="wf-acts">
          {blocked.length > 0 && (
            <button className="btn sm go" onClick={() => blocked.forEach((s) => stepOp(task.id, s.id, "resume"))}>解除阻塞</button>
          )}
        </div>
      </div>
      <div className="wfwrap">
        <div
          ref={canvasRef}
          className="wfcanvas"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest(".wfnode, .wfart, .wfcam")) return;
            drag.current = { x0: e.clientX, y0: e.clientY, cx: cam.x, cy: cam.y };
            (e.currentTarget as HTMLElement).classList.add("dragging");
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setCam((c) => ({ ...c, x: drag.current!.cx + e.clientX - drag.current!.x0, y: drag.current!.cy + e.clientY - drag.current!.y0 }));
          }}
          onPointerUp={(e) => { drag.current = null; (e.currentTarget as HTMLElement).classList.remove("dragging"); }}
        >
          <div className="wfboard" style={{ width: layout.width, height: layout.height, transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})` }}>
            <svg className="wfedges" aria-hidden="true">
              {task.steps.map((s) =>
                s.deps.map((d) => {
                  const from = posById.get(d);
                  const to = posById.get(s.id);
                  if (!from || !to) return null;
                  return (
                    <line key={`${d}->${s.id}`} x1={from.x + 224} y1={from.y + 32} x2={to.x} y2={to.y + 32}
                          className={s.status === "idle" ? "" : `e-${s.status}`} />
                  );
                })
              )}
            </svg>
            {task.steps.map((s, i) => {
              const p = layout.nodes[i];
              if (!p) return null;
              const progTxt = s.status === "running" ? `${s.progress ?? 0}%` : s.status === "done" ? "100%" : "";
              return (
                <div key={s.id}>
                  <div className={`wfnode${selId === s.id ? " sel" : ""}`} data-s={s.status}
                       style={{ left: p.x, top: p.y }}
                       tabIndex={0} role="button"
                       onClick={() => { setSelId(s.id); setArt(null); }}
                       onKeyDown={(e) => { if (e.key === "Enter") { setSelId(s.id); setArt(null); } }}>
                    <div className="wfn-top"><Lamp s={s.status} /><span className="wfn-name">{s.name}</span></div>
                    <div className="wfn-sub">
                      <Mk mk={agentById.get(s.executor)?.mk ?? "具"} me={s.executor === "me"} />
                      <span>{s.note || s.name}</span>
                      {progTxt && <span className="bar"><i style={{ width: progTxt }} /></span>}
                      {progTxt && <span>{progTxt}</span>}
                    </div>
                  </div>
                  {s.artifacts.map((a, ai) => (
                    <div key={a.name} className="wfart" style={{ left: p.x + 2, top: p.y + 76 + ai * 50 }}
                         onClick={() => setArt(a)}>
                      <span className="kind">{KIND_CN[a.kind]}</span>
                      <span className="an">{a.name}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="wfhint">横向推进 · 分叉即并行 · 点节点看日志与操作</div>
          <div className="wfcam">
            <button onClick={() => setCam((c) => ({ ...c, z: Math.max(0.5, c.z - 0.15) }))}>−</button>
            <span className="zl">{Math.round(cam.z * 100)}%</span>
            <button onClick={() => setCam((c) => ({ ...c, z: Math.min(1.4, c.z + 0.15) }))}>＋</button>
            <button onClick={() => setCam(cam0)}>复位</button>
          </div>
        </div>

        <aside className="wfpanel" aria-label="节点详情与运行日志">
          <div className="wfp-head">
            <div className="wfp-title">{selStep ? `步骤 · ${selStep.name}` : "运行时序"}</div>
            <p className="wfp-sub">{selStep
              ? `${agentById.get(selStep.executor)?.name ?? "脚本"} · ${selStep.note || STATUS_CN[selStep.status]}`
              : "点左侧任一节点查看它的执行内容与日志"}</p>
          </div>
          <div className="wfp-body">
            {selStep ? (
              <>
                <div className="dw-sec"><dl className="kv">
                  <div><dt>谁在执行</dt><dd><Mk mk={agentById.get(selStep.executor)?.mk ?? "具"} me={selStep.executor === "me"} />{agentById.get(selStep.executor)?.name ?? "脚本"}</dd></div>
                  <div><dt>状态</dt><dd><StatusTag s={selStep.status} /></dd></div>
                  <div><dt>说明</dt><dd style={{ fontSize: 13, fontWeight: 500 }}>{selStep.note || "—"}</dd></div>
                  <div><dt>依赖</dt><dd style={{ fontSize: 13 }}>{selStep.deps.length || "—"}</dd></div>
                </dl></div>
                <div className="dw-sec"><div className="dw-h">操作</div>
                  <div className="wfp-acts">
                    {selStep.status === "running" && <button className="btn sm" onClick={() => stepOp(task.id, selStep.id, "pause")}>暂停此步</button>}
                    {(selStep.status === "idle" || selStep.status === "external") && <button className="btn sm go" onClick={() => stepOp(task.id, selStep.id, "start")}>启动此步</button>}
                    {selStep.status === "blocked" && <button className="btn sm go" onClick={() => stepOp(task.id, selStep.id, "resume")}>解除阻塞</button>}
                    {selStep.status === "waiting" && <button className="btn sm go" onClick={() => stepOp(task.id, selStep.id, "done")}>我处理完了</button>}
                    {selStep.status === "running" && selStep.gate?.type === "approval" && (
                      <button className="btn sm go" onClick={() => stepOp(task.id, selStep.id, "submit")}>完成并提交过目</button>
                    )}
                    <button className="btn sm" onClick={() => stepOp(task.id, selStep.id, "rerun")}>重跑此步</button>
                  </div>
                  {selStep.executor !== "me" && <Reassign task={task} step={selStep} />}
                </div>
                <GatePanel task={task} step={selStep} onApply={(k, o) => applyGate(task.id, selStep.id, k, o)} />
                <div className="dw-sec"><div className="dw-h">运行时序日志 <small>{selId ? "本步骤" : "全局"}</small></div>
                  {timeline.length
                    ? <ul className="log">{timeline.map((l) => (
                        <li key={l.id}><time>{l.t.slice(11, 16)}</time>{l.text}</li>
                      ))}</ul>
                    : <p className="note">这一步还没有日志。</p>}
                </div>
              </>
            ) : (
              <>
                <div className="dw-sec"><div className="dw-h">任务日志 <small>全局</small></div>
                  {timeline.length
                    ? <ul className="log">{timeline.map((l) => <li key={l.id}><time>{l.t.slice(11, 16)}</time>{l.text}</li>)}</ul>
                    : <p className="note">还没有日志。</p>}
                </div>
                <div className="dw-sec"><div className="dw-h">产物 <small>{task.steps.flatMap((s) => s.artifacts).length}</small></div>
                  {task.steps.flatMap((s) => s.artifacts).map((a) => (
                    <div key={a.name} className="task-chip" style={{ cursor: "pointer" }}
                         onClick={() => setArt(a)}>
                      <b>{KIND_CN[a.kind]}</b>{a.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
      {art && (
        <div className="aviewer" onClick={() => setArt(null)}>
          <div className="av-head" onClick={(e) => e.stopPropagation()}>
            <span className="plate sm">{task.id}</span>
            <span className="kind">{KIND_CN[art.kind]}</span>
            <div className="av-title">{art.name}</div>
            <button className="btn sm" style={{ marginLeft: "auto" }} onClick={() => setArt(null)}>关闭 (Esc)</button>
          </div>
          <div className="av-body">
            <ArtifactBody taskId={task.id} name={art.name} artifacts={artifacts} />
          </div>
        </div>
      )}
    </main>
  );
}

const STATUS_CN: Record<string, string> = {
  running: "进行中", waiting: "等待你", blocked: "阻塞", external: "等待外部", done: "已完成", idle: "未开始",
};

function ArtifactBody({ taskId, name, artifacts }: { taskId: string; name: string; artifacts: ReturnType<typeof useStore.getState>["artifacts"] }) {
  const a = findArtifact(artifacts, taskId, name);
  if (!a) return <p className="note" style={{ maxWidth: 680, margin: "40px auto" }}>产物内容将在该步骤完成后写入（当前为占位）。</p>;
  return <ArtifactView artifact={a} />;
}

function Reassign({ task, step }: { task: Task; step: Step }) {
  const agents = useStore((s) => s.agents);
  const stepOp = useStore((s) => s.stepOp);
  const [to, setTo] = useState("");
  const cands = agents.filter((a) => !["flowsmith", "steward"].includes(a.id) && a.id !== step.executor);
  const target = to || cands[0]?.id || "";
  return (
    <div className="wfp-assign">
      <select value={target} onChange={(e) => setTo(e.target.value)}>
        {cands.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.role} · L{a.trust ?? "—"}</option>)}
      </select>
      <button className="btn sm" onClick={() => target && stepOp(task.id, step.id, "reassign", target)}>改派</button>
    </div>
  );
}

function GatePanel({ task, step, onApply }: { task: Task; step: Step; onApply: (k: "pass" | "back" | "pick", o?: number) => void }) {
  const [pick, setPick] = useState(0);
  const g = step.gate;
  const active = g && (step.status === "waiting" || (step.status === "blocked" && g.type === "staffing"));
  if (!g || !active) return null;
  if (g.type === "approval") {
    return (
      <div className="dw-sec"><div className="dw-h">{g.title} <small>等你</small></div>
        <div className="wfp-acts">
          <button className="btn sm go" onClick={() => onApply("pass")}>{g.passLabel}</button>
          <button className="btn sm warn" onClick={() => onApply("back")}>{g.backLabel}</button>
        </div>
      </div>
    );
  }
  void task;
  return (
    <div className="dw-sec"><div className="dw-h">{g.title} <small>选一项 · 即时生效</small></div>
      {g.options.map((o, k) => (
        <label key={k} className="gate-opt">
          <input type="radio" name="gate-opt" checked={pick === k} onChange={() => setPick(k)} />
          <span><span className="ot">{o.label}</span><span className="od">{o.desc}</span></span>
        </label>
      ))}
      <div className="wfp-acts"><button className="btn sm go" onClick={() => onApply("pick", pick)}>确认</button></div>
    </div>
  );
}
