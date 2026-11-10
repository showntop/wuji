// 包内组件：产物卡形态字（表/稿/图/记）——Canvas 与 web 侧面板共用
import type { ArtifactKind } from "@wuji/model";

export const KIND_CN: Record<ArtifactKind, string> = { table: "表", doc: "稿", image: "图", note: "记" };
