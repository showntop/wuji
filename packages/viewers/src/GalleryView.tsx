// 图集视图
import type { Artifact } from "@wuji/model";

export function GalleryView({ content }: { art: Artifact; content: Extract<Artifact["content"], { type: "image" }> }) {
  return (
    <div>
      <div className="av-gallery">
        {content.shots.map((sh, i) => (
          <div key={i} className="shot">
            <span className="zoom">{sh.dim}</span>
            <span className="cap">{sh.caption}</span>
          </div>
        ))}
      </div>
      {content.note && <p className="av-tbl-note" style={{ maxWidth: 900, margin: "14px auto 0" }}>{content.note}</p>}
    </div>
  );
}
