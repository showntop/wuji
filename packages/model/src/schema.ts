// zod schema：fixture 校验与运行时双用（M0 验收项）
import { z } from "zod";

export const stepStatusSchema = z.enum(["idle", "running", "waiting", "blocked", "external", "done"]);
export const artifactRefSchema = z.object({ kind: z.enum(["table", "doc", "image", "note"]), name: z.string() });

export const stepSchema = z.object({
  id: z.string(), name: z.string(),
  executor: z.string(),
  status: stepStatusSchema,
  note: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  deps: z.array(z.string()),
  artifacts: z.array(artifactRefSchema),
  gate: z.any().optional(), // 门的效果机在 store；schema 细化随 M1
});

export const taskSchema = z.object({
  id: z.string(), name: z.string(),
  status: z.enum(["running", "waiting", "blocked", "external", "done"]),
  createdAt: z.string(), updatedAt: z.string(),
  criteria: z.string().optional(),
  budget: z.object({ weeklyCost: z.number(), myMinutes: z.number() }).optional(),
  steps: z.array(stepSchema),
});

export const agentSchema = z.object({
  id: z.string(), name: z.string(), role: z.string(), mk: z.string(),
  duty: z.string(),
  trust: z.union([z.literal(1), z.literal(2), z.literal(3), z.null()]),
  trustNote: z.string(),
  stats: z.object({ runs: z.number(), pass: z.number(), rework: z.number(), cost: z.number(), asks: z.number() }),
  taskIds: z.array(z.string()),
  status: z.enum(["running", "waiting", "blocked", "idle"]),
});

export const inboxItemSchema = z.object({
  id: z.string(), kind: z.enum(["decision", "confirm", "fyi"]),
  from: z.string(), taskId: z.string().optional(),
  title: z.string(), context: z.string(), minutes: z.number(),
  actions: z.array(z.object({ label: z.string(), kind: z.enum(["primary", "normal", "ghost"]), effect: z.any() })),
});

export const ledgerEventSchema = z.object({
  id: z.string(), t: z.string(), actor: z.string(),
  taskId: z.string().optional(), stepId: z.string().optional(),
  type: z.enum(["run", "approval", "judgement", "system"]),
  text: z.string(),
});
