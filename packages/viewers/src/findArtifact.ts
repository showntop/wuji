// 产物查找：短名匹配（步骤引用名「机酒比价」对应完整产物名「机酒比价 · 表」）
import type { Artifact } from "@wuji/model";

export function findArtifact(artifacts: Artifact[], taskId: string, name: string): Artifact | undefined {
  const short = name.replace(/ · .*$/, "");
  return artifacts.find((x) => x.taskId === taskId && x.name.includes(short))
      ?? artifacts.find((x) => x.name.includes(short));
}
