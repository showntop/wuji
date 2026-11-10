# Wuji / 无极

A prototype of a boundless agent workspace. The first surface is an infinite field where goals, notes, agent responses, and tasks persist as spatial objects.

## Open the prototype

```bash
cd prototype
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

For a quick local preview, you can also open `index.html` directly.

## Current prototype capabilities

- Infinite panning and zooming.
- **Eight node kinds**, each with its own interaction surface — see [`NODES.md`](docs/NODES.md):
  - **Intent** — goal plus editable constraints.
  - **Note** — free text, the fallback shape.
  - **Trace** — agent steps you can open, inspect, and read the evidence behind.
  - **Evidence** — claim, quote, source, plus a 已核实 / 存疑 toggle.
  - **Table** — sortable, filterable, rows selectable.
  - **Plan** — checkable items with a progress bar and 我 / 无极 ownership.
  - **Decision** — clickable options; selecting one can expand it into a Plan.
  - **Action** — approval checkpoint showing scope and reversibility.
- **Four link semantics** — `derived` / `binds` / `triggers` / `supports`, drawn differently.
- Draft vs confirmed states: everything the agent produces starts as a dashed 草案 card.
- Summon from the bottom bar; the mode decides the shape (规划→Plan, 研究→Trace, 写作→Note, 执行→Action).
- Drag nodes by their top rail, nudge with arrow keys.
- Persist the canvas locally; double-click empty space to create a note; reset to the seeded field.

The seeded field walks one full chain: Intent → Trace → Evidence ×3 → Table → Decision → Plan → Action.

## Product references

- [`PRODUCT.md`](docs/PRODUCT.md)
- [`DESIGN.md`](docs/DESIGN.md)
- [`BLUEPRINT.md`](docs/BLUEPRINT.md) — V2 总体方案蓝图（体·相·用架构、卷/野/谱视图、路线图）
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 系统架构：能力与资源 / harness / Agent 编制池 / 工作台，四层三横切面
- [`INTERFACE.md`](docs/INTERFACE.md) — 交互形态：一坊一桌一账一栏，壳与台的形制

## Engineering (M0+)

The buildable spec lives in [`ENGINEERING.md`](docs/ENGINEERING.md) — data model, monorepo layout, milestones. Demo surfaces in `demo/` stay frozen (retired after M1 parity per its D2 decision).

```bash
pnpm install
pnpm dev        # apps/web @ :5180
pnpm check      # tsc + tests across all packages
```
