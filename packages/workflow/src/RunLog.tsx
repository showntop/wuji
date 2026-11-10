// 运行时序列表：账本时间线的纯投影（§2.4，面板不做查询）
import type { LedgerEvent } from "@wuji/model";

export function RunLog({ entries, emptyText }: { entries: LedgerEvent[]; emptyText: string }) {
  if (!entries.length) return <p className="note">{emptyText}</p>;
  return (
    <ul className="log">{entries.map((l) => (
      <li key={l.id}><time>{l.t.slice(11, 16)}</time>{l.text}</li>
    ))}</ul>
  );
}
