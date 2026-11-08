// DAG 分层布局：最长路径分层 + 同层居中（演示验证算法的移植，ENGINEERING.md §5）
// 分叉 = 同层并列；汇合 = 多依赖；孤根 = 各自成层
import type { Step } from "@wuji/model";
export { isAcyclic } from "@wuji/model";

export interface LayoutOptions {
  colWidth?: number;      // 列距
  nodeWidth?: number;     // 节点宽
  lanePitch?: number;     // 并行车道距（须容下节点下方的产物卡）
  originX?: number; originY?: number;
}
export interface LaidNode { id: string; x: number; y: number; layer: number; lane: number }
export interface LayoutResult { nodes: LaidNode[]; width: number; height: number }

export function depsOf(steps: Step[], i: number): string[] {
  const s = steps[i];
  if (!s) return [];
  if (s.deps.length) return s.deps;
  const prev = i > 0 ? steps[i - 1] : undefined;
  return prev ? [prev.id] : [];
}

export function layoutDag(steps: Step[], opts: LayoutOptions = {}): LayoutResult {
  const colW = opts.colWidth ?? 268;
  const nodeW = opts.nodeWidth ?? 224;
  const laneP = opts.lanePitch ?? 156;
  const x0 = opts.originX ?? 70;
  const y0 = opts.originY ?? 240;

  const idToIdx = new Map(steps.map((s, i) => [s.id, i]));
  const depIdx = (i: number) => depsOf(steps, i).map((d) => idToIdx.get(d)).filter((v): v is number => v != null);

  // 最长路径分层（递归；调用方保证无环）
  const layerMemo: number[] = steps.map(() => -1);
  const lay = (i: number): number => {
    const memo = layerMemo[i];
    if (memo != null && memo >= 0) return memo;
    const ds = depIdx(i);
    const v = ds.length ? Math.max(...ds.map(lay)) + 1 : 0;
    layerMemo[i] = v;
    return v;
  };
  steps.forEach((_, i) => lay(i));

  // 同层居中堆叠
  const layers: number[][] = [];
  steps.forEach((_, i) => {
    const li = layerMemo[i] ?? 0;
    (layers[li] ||= []).push(i);
  });
  const pos: LaidNode[] = steps.map((s, i) => {
    const li = layerMemo[i] ?? 0;
    const col = layers[li] ?? [];
    const k = col.indexOf(i);
    return {
      id: s.id,
      x: x0 + li * colW,
      y: y0 + (k - (col.length - 1) / 2) * laneP,
      layer: li, lane: k,
    };
  });

  const width = x0 + layers.length * colW + 60;
  const maxLane = Math.max(...layers.map((c) => c.length));
  const height = Math.max(y0 * 2 + maxLane * laneP + 160, 560);
  return { nodes: pos, width, height };
}

