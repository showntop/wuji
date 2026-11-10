// 表格视图：点表头排序（纯函数比较，数字优先）
import { useState } from "react";
import type { Artifact } from "@wuji/model";

export function TableView({ art, content }: { art: Artifact; content: Extract<Artifact["content"], { type: "table" }> }) {
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
