// 笔记视图
import type { Artifact } from "@wuji/model";

export function NoteView({ content }: { art: Artifact; content: Extract<Artifact["content"], { type: "note" }> }) {
  return (
    <div className="av-notes">
      {content.items.map((it, i) => (
        <div key={i} className="av-note">
          <p className="q">{it.q}</p>
          <p className="a">{it.a}</p>
          <p className="meta">{it.meta}</p>
        </div>
      ))}
    </div>
  );
}
