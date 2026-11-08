// harness 接口 —— P0 由 mock.ts 实现，P2 换真模型（调用方不变）
import type { Step } from "@wuji/model";

export type StepEvent =
  | { type: "progress"; stepId: string; pct: number; text?: string }
  | { type: "log"; stepId: string; kind: "info" | "ask" | "error"; text: string }
  | { type: "artifact"; stepId: string; artifact: { kind: "table" | "doc" | "image" | "note"; name: string } }
  | { type: "done"; stepId: string }
  | { type: "blocked"; stepId: string; reason: string };

export interface Harness {
  /** 推进一个 running 步骤至 done/blocked，产出事件流（P0：确定性 mock） */
  runStep(step: Step, onEvent: (e: StepEvent) => void): () => void; // 返回取消函数
}
