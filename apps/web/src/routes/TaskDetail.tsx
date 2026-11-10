// 任务详情路由：工作流画布 + 节点面板 + 产物浮层的装配层。
// 画布/门/时序组件来自 @wuji/workflow（props 驱动）；本文件只做取数与回调接线。
import { useEffect, useState } from "react";
import type { Task, Step, Agent } from "@wuji/model";
import { taskProgress } from "@wuji/model";
import { useStore } from "../store";
import { selectTaskTimeline, selectStepTimeline } from "@wuji/store";
import { Canvas, GatePanel, RunLog, KIND_CN } from "@wuji/workflow";
import { Lamp, StatusTag, Mk } from "@wuji/ui";
import { ArtifactView, findArtifact } from "@wuji/viewers";

const STATUS_CN: Record<string, string> = {
  running: "进行中", waiting: "等待你", blocked: "阻塞", external: "等待外部", done: "已完成", idle: "未开始",
};

export function TaskFlowView({ task, onBack }: { task: Task; onBack: () => void }) {
  const agents = useStore((s) => s.agents);
  const ledger = useStore((s) => s.ledger);
  const artifacts = useStore((s) => s.artifacts);
  const stepOp = useStore((s) => s.stepOp);
  const applyGate = useStore((s) => s.applyGate);
  const [selId, setSelId] = useState<string | null>(null);
  const [art, setArt] = useState<Step["artifacts"][number] | null>(null);

  useEffect(() => { setSelId(null); setArt(null); }, [task.id]);

  const prog = taskProgress(task.steps);
  const selStep = task.steps.find((s) => s.id === selId) ?? null;
  const agentById = new Map<string, Agent>(agents.map((a) => [a.id, a] as [string, Agent]));

  const timeline = selId
    ? selectStepTimeline(ledger, task.id, selId)
    : selectTaskTimeline(ledger, task.id);

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
        <Canvas steps={task.steps} agents={agents} selectedId={selId}
                onSelect={(id) => { setSelId(id); setArt(null); }}
                onOpenArtifact={(a) => setArt(a)} />

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
                <GatePanel step={selStep} onApply={(k, o) => applyGate(task.id, selStep.id, k, o)} />
                <div className="dw-sec"><div className="dw-h">运行时序日志 <small>{selId ? "本步骤" : "全局"}</small></div>
                  <RunLog entries={timeline} emptyText="这一步还没有日志。" />
                </div>
              </>
            ) : (
              <>
                <div className="dw-sec"><div className="dw-h">任务日志 <small>全局</small></div>
                  <RunLog entries={timeline} emptyText="还没有日志。" />
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
