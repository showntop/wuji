// DAG 画布：布局 + 边 + 节点 + 产物卡 + 视口拖拽/缩放（自 apps/web TaskFlow.tsx 原样迁移）
// props 驱动，不 import store（依赖方向：workflow → {ui, model}）
import { useEffect, useMemo, useRef, useState } from "react";
import type { Agent, ArtifactRef, Step } from "@wuji/model";
import { Lamp, Mk } from "@wuji/ui";
import { layoutDag } from "./layout";
import { KIND_CN } from "./Node";

const CAM0 = { x: 24, y: 16, z: 1 };

export interface CanvasProps {
  steps: Step[];
  agents: Agent[];
  selectedId: string | null;
  onSelect(id: string): void;
  onOpenArtifact(a: ArtifactRef): void;
}

export function Canvas({ steps, agents, selectedId, onSelect, onOpenArtifact }: CanvasProps) {
  const [cam, setCam] = useState(CAM0);
  const drag = useRef<{ x0: number; y0: number; cx: number; cy: number } | null>(null);
  const agentById = new Map<string, Agent>(agents.map((a) => [a.id, a] as [string, Agent]));

  const layout = useMemo(
    () => layoutDag(steps, { lanePitch: 156 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps.length, steps.map((s) => s.status).join()]
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const z = Math.min(1, Math.max(0.45, (el.clientWidth - 30) / layout.width, (el.clientHeight - 30) / layout.height));
    setCam({ x: 16, y: 12, z });
  }, [layout.width, layout.height]);
  const posById = new Map(layout.nodes.map((n) => [n.id, n]));

  return (
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
          {steps.map((s) =>
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
        {steps.map((s, i) => {
          const p = layout.nodes[i];
          if (!p) return null;
          const progTxt = s.status === "running" ? `${s.progress ?? 0}%` : s.status === "done" ? "100%" : "";
          return (
            <div key={s.id}>
              <div className={`wfnode${selectedId === s.id ? " sel" : ""}`} data-s={s.status}
                   style={{ left: p.x, top: p.y }}
                   tabIndex={0} role="button"
                   onClick={() => { onSelect(s.id); }}
                   onKeyDown={(e) => { if (e.key === "Enter") onSelect(s.id); }}>
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
                     onClick={() => onOpenArtifact(a)}>
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
        <button onClick={() => setCam(CAM0)}>复位</button>
      </div>
    </div>
  );
}
