// 三 gate 就地处理面板（判断/审批/用人）——props 驱动，效果机在 store 包
import { useState } from "react";
import type { Step } from "@wuji/model";

export function GatePanel({ step, onApply }: {
  step: Step;
  onApply(k: "pass" | "back" | "pick", o?: number): void;
}) {
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
