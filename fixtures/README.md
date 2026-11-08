# fixtures

演示数据 → zod 校验后的 JSON（M0 验收项，见 ENGINEERING.md §2.3）。

- `tasks.json` —— 演示九条任务全量；T-09 补「数据回流」「变现」两步补足闭环
- `agents.json` —— 我 + 脚本 + 七职能 Agent
- `artifacts.json` —— 九个具名产物的内容（表/稿/图/记）
- `inbox.json` / `ledger.json`

校验入口：`@wuji/model` schema（`pnpm --filter @wuji/model check`）。
