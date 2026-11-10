// 任务列表：四档筛选 + 任务行
import { useState } from "react";
import { useStore } from "../store";
import { TaskRow } from "./TaskRow";

export function TasksView({ onOpen }: { onOpen: (id: string) => void }) {
  const tasks = useStore((s) => s.tasks);
  const [filter, setFilter] = useState("全部");
  const CN: Record<string, string> = { running: "进行中", waiting: "等待你", blocked: "阻塞", done: "已完成" };
  const defs = ["全部", "进行中", "等待你", "阻塞", "已完成"].map((k) => ({
    k, n: k === "全部" ? tasks.length : tasks.filter((t) => CN[t.status] === k).length,
  }));
  const rows = filter === "全部" ? tasks : tasks.filter((t) => CN[t.status] === filter);
  return (
    <>
      <div className="sec-h"><h2>任务</h2><span className="sec-note">点行看详情 · 点产物开查看器</span></div>
      <div className="filters">
        {defs.map((d) => (
          <button key={d.k} className="fchip" aria-pressed={filter === d.k} onClick={() => setFilter(d.k)}>
            {d.k}<span className="n">{d.n}</span>
          </button>
        ))}
      </div>
      {rows.map((t, i) => <TaskRow key={t.id} t={t} onOpen={onOpen} i={i} />)}
      {!rows.length && <div className="empty-box"><span className="big">这一档没有任务</span>换一个筛选看看。</div>}
      <div style={{ height: 140 }} />
    </>
  );
}
