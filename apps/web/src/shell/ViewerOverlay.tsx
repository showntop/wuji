// 产物查看器全局入口：列表形态片打开的浮层
import { useEffect } from "react";
import { useStore } from "../store";
import { useShell } from "../shellStore";
import { ArtifactView, findArtifact } from "@wuji/viewers";

const KIND_CN: Record<string, string> = { table: "表", doc: "稿", image: "图", note: "记" };

export function ViewerOverlay() {
  const viewer = useShell((s) => s.viewer);
  const setViewer = useShell((s) => s.setViewer);
  const artifacts = useStore((s) => s.artifacts);
  const tasks = useStore((s) => s.tasks);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && viewer) setViewer(null); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [viewer, setViewer]);
  if (!viewer) return null;
  const a = findArtifact(artifacts, viewer.taskId, viewer.name);
  const task = tasks.find((t) => t.id === viewer.taskId);
  return (
    <div className="aviewer">
      <div className="av-head">
        <span className="plate sm">{viewer.taskId}</span>
        <span className="kind">{a ? KIND_CN[a.kind] : "?"}</span>
        <div className="av-title">{viewer.name}</div>
        <div className="av-meta">{task?.name ?? ""}</div>
        <button className="btn sm" style={{ marginLeft: "auto" }} onClick={() => setViewer(null)}>关闭 (Esc)</button>
      </div>
      <div className="av-body">
        {a ? <ArtifactView artifact={a} />
           : <p className="note" style={{ maxWidth: 680, margin: "40px auto" }}>产物内容将在对应步骤完成后写入（当前为占位）。</p>}
      </div>
    </div>
  );
}
