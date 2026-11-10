// 快速发起：问答 / 派任务（派任务走用人审批门，D7）
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { useShell } from "../shellStore";

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
