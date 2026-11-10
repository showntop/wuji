import { describe, test, expect } from "vitest";
import { layoutDag, isAcyclic } from "../src";
import type { Step } from "@wuji/model";

const st = (id: string, deps: string[] = []): Step =>
  ({ id, name: id, executor: "me", status: "idle", deps, artifacts: [] });

describe("layoutDag（演示验证算法的特性锁定）", () => {
  test("分叉：两个子步同层并列，同 x 不同 y，间距 = 车道距", () => {
    const r = layoutDag([st("a"), st("b", ["a"]), st("c", ["a"])]);
    const [a, b, c] = r.nodes;
    expect(a!.layer).toBe(0);
    expect(b!.layer).toBe(1);
    expect(c!.layer).toBe(1);
    expect(b!.x).toBe(c!.x);
    expect(Math.abs(b!.y - c!.y)).toBe(156);
  });
  test("汇合：多依赖步落在共同下游层", () => {
    const r = layoutDag([st("a"), st("b", ["a"]), st("c", ["a"]), st("d", ["b", "c"])]);
    const d = r.nodes.find((n) => n.id === "d")!;
    expect(d.layer).toBe(2);
  });
  test("无显式依赖的顺序步按数组顺序成链（孤根回退）", () => {
    const r = layoutDag([st("a"), st("b"), st("c")]);
    expect(r.nodes.map((n) => n.layer)).toEqual([0, 1, 2]);
  });
  test("单步任务：坐标与画布尺寸均为有限数", () => {
    const r = layoutDag([st("only")]);
    const n = r.nodes[0]!;
    expect(Number.isFinite(n.x)).toBe(true);
    expect(Number.isFinite(n.y)).toBe(true);
    expect(Number.isFinite(r.width)).toBe(true);
    expect(r.height).toBeGreaterThanOrEqual(560);
    expect(r.nodes[0]!.layer).toBe(0);
  });
  test("isAcyclic 可从本包再导出并正确判环", () => {
    expect(isAcyclic([st("a"), st("b", ["a"])])).toBe(true);
    const cyc = [st("a", ["b"]), st("b", ["a"])];
    expect(isAcyclic(cyc)).toBe(false);
  });
});
