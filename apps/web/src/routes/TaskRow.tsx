// 任务行：列表与工作台共用的行组件
import type { Task, Agent } from "@wuji/model";
import { useStore } from "../store";
import { Lamp, StatusTag, Mk } from "@wuji/ui";
import { KIND_CN } from "@wuji/workflow";

export function TaskRow({ t, onOpen, i }: { t: Task; onOpen: (id: string) => void; i: number }) {
  const agents = useStore((s) => s.agents);
  const agentById = new Map<string, Agent>(agents.map((a) => [a.id, a] as [string, Agent]));
  const crew = [...new Set(
    t.steps.filter((s) => ["running", "waiting"].includes(s.status)).map((s) => s.executor)
  )];
  const done = t.steps.filter((s) => s.status === "done").length;
  const pct = t.steps.length ? Math.round((done / t.steps.length) * 100) : 0;
  const cur = t.steps.find((s) => s.status === "running" || s.status === "waiting");
  const latest = cur ? `「${cur.name}」${cur.note || ""}` : t.status === "done" ? "已完成" : "排队中";
  return (
    <article className="trow" data-s={t.status} tabIndex={0}
             onClick={(e) => { if (!(e.target as HTMLElement).closest(".art")) onOpen(t.id); }}
             onKeyDown={(e) => { if (e.key === "Enter" && !(e.target as HTMLElement).closest(".art")) onOpen(t.id); }}>
      <div className="t-id"><Lamp s={t.status} /><span className="plate">{t.id}</span></div>
      <div className="t-main">
        <h3 className="t-title">{t.name}<StatusTag s={t.status} /></h3>
        <div className="t-crew">
          <span className="lab">执行</span>
          {(crew.length ? crew : t.steps.filter((s) => s.status !== "done").map((s) => s.executor)).slice(0, 5).map((ex) => (
            <Mk key={ex} mk={agentById.get(ex)?.mk ?? "具"} me={ex === "me"} />
          ))}
        </div>
        <p className="t-latest">{latest}</p>
      </div>
      <div className="t-flow">
        {t.steps.slice(0, 6).map((s) => (
          <div key={s.id} className="fnode" data-s={s.status === "running" ? "run" : s.status}
               title={s.name}><i className="lamp" /><span className="fn">{s.name}</span></div>
        ))}
      </div>
      <div className="t-side">
        <div className="t-prog"><span className="pct">{pct}%</span><span className="nm">{done} / {t.steps.length} 步</span></div>
        <div className="t-arts">
          {t.steps.flatMap((s) => s.artifacts).slice(0, 2).map((a) => (
            <button key={a.name} className="art" onClick={(e) => { e.stopPropagation(); }}
                    data-open-art={a.name} data-task={t.id}>
              <span className="kind">{KIND_CN[a.kind]}</span>{a.name}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
