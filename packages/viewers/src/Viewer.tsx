// 产物查看器：按 content.type 分派四视图（表可排序）
import type { Artifact } from "@wuji/model";
import { TableView } from "./TableView";
import { DocView } from "./DocView";
import { GalleryView } from "./GalleryView";
import { NoteView } from "./NoteView";

export function ArtifactView({ artifact }: { artifact: Artifact }) {
  const c = artifact.content;
  if (c.type === "table") return <TableView art={artifact} content={c} />;
  if (c.type === "doc") return <DocView art={artifact} content={c} />;
  if (c.type === "image") return <GalleryView art={artifact} content={c} />;
  return <NoteView art={artifact} content={c} />;
}
