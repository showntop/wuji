// 文稿视图
import type { Artifact } from "@wuji/model";

export function DocView({ art, content }: { art: Artifact; content: Extract<Artifact["content"], { type: "doc" }> }) {
  return (
    <article className="av-doc">
      <h2>{content.title}</h2>
      <div className="by">{art.by}</div>
      {content.paras.map((p, i) => <p key={i}>{p}</p>)}
      {content.stats && (
        <div className="stat">
          {content.stats.map(([v, l], i) => <span key={i}><b>{v}</b>{l}</span>)}
        </div>
      )}
    </article>
  );
}
