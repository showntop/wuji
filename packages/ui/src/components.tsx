import type { StepStatus } from "@wuji/model";

/** 状态五色 + 文字标签（色不是唯一通道） */
export const STATUS_META: Record<StepStatus, { label: string; color: string; lamp: string; text: string }> = {
  running: { label: "进行中", color: "var(--go)", lamp: "s-run", text: "st-run" },
  waiting: { label: "等待你", color: "var(--call)", lamp: "s-call", text: "st-call" },
  blocked: { label: "阻塞", color: "var(--stop)", lamp: "s-stop", text: "st-stop" },
  external: { label: "等待外部", color: "var(--hold)", lamp: "s-hold", text: "st-hold" },
  done: { label: "已完成", color: "var(--done)", lamp: "s-done", text: "st-done" },
  idle: { label: "未开始", color: "var(--off)", lamp: "", text: "st-idle" },
};

export function Lamp({ s, size }: { s: StepStatus; size?: "sm" }) {
  return <i className={`lamp ${STATUS_META[s].lamp}${size ? " " + size : ""}`} aria-hidden="true" />;
}

export function StatusTag({ s }: { s: StepStatus }) {
  const m = STATUS_META[s];
  return <span className={`tag-s ${m.text}`}>{m.label}</span>;
}

export function Mk({ mk, me }: { mk: string; me?: boolean }) {
  return <span className={`mk${me ? " me" : ""}`}>{mk}</span>;
}

export function Plate({ id, sm }: { id: string; sm?: boolean }) {
  return <span className={`plate${sm ? " sm" : ""}`}>{id}</span>;
}
