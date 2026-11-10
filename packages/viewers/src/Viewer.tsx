import { useState } from "react";
import type { Artifact } from "@wuji/model";

/** 产物查看器：按 content.type 分派四视图（表可排序） */
export function ArtifactView({ artifact }: { artifact: Artifact }) {
  const c = artifact.content;
  if (c.type === "table") return <TableView art={artifact} content={c} />;
  if (c.type === "doc") return <DocView art={artifact} content={c} />;
  if (c.type === "image") return <GalleryView art={artifact} content={c} />;
  return <NoteView art={artifact} content={c} />;
}

function TableView({ art, content }: { art: Artifact; content: Extract<Artifact["content"], { type: "table" }> }) {
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const rows = content.rows.slice();
  if (sort) {
    const { col, dir } = sort;
    rows.sort((x, y) => {
      const nx = parseFloat(String(x[col]).replace(/[^\d.-]/g, ""));
      const ny = parseFloat(String(y[col]).replace(/[^\d.-]/g, ""));
      const cmp = Number.isNaN(nx) || Number.isNaN(ny)
        ? String(x[col]).localeCompare(String(y[col]), "zh")
        : nx - ny;
      return cmp * dir;
    });
  }
  return (
    <div className="av-tbl">
      <p className="av-tbl-t">{art.name}</p>
      {content.rows.length > 3 && <p className="av-tbl-note">共 {content.rows.length} 行 · 点表头排序</p>}
      <table className="data">
        <thead>
          <tr>
            {content.columns.map((col, i) => (
              <th key={col.key} onClick={() => setSort((s) => (s && s.col === i ? { col: i, dir: -s.dir as 1 | -1 } : { col: i, dir: 1 }))}>
                {col.label}
                {sort?.col === i && <span className="dir">{sort.dir > 0 ? "↑" : "↓"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className={sort && ri === 0 ? "top" : ""}>
              {r.map((cell, ci) => <td key={ci} className={content.columns[ci]?.numeric ? "sc" : ""}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocView({ art, content }: { art: Artifact; content: Extract<Artifact["content"], { type: "doc" }> }) {
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

function GalleryView({ content }: { art: Artifact; content: Extract<Artifact["content"], { type: "image" }> }) {
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

function NoteView({ content }: { art: Artifact; content: Extract<Artifact["content"], { type: "note" }> }) {
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
