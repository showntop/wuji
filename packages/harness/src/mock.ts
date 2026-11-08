// P0 确定性 mock：定时推进 + fixture 产物（ENGINEERING.md D4）
import type { Harness } from "./types";
export const mockHarness: Harness = {
  runStep(step, onEvent) {
    let pct = 0;
    const timer = setInterval(() => {
      pct = Math.min(100, pct + 20);
      onEvent({ type: "progress", stepId: step.id, pct });
      if (pct >= 100) { clearInterval(timer); onEvent({ type: "done", stepId: step.id }); }
    }, 600);
    return () => clearInterval(timer);
  },
};
