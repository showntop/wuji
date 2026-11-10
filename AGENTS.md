## Learned User Preferences

- 进行网页调研时，若 `parallel-cli` 未完成登录认证，直接回退使用 Cursor 内置的 `WebSearch` / `WebFetch` 完成检索，不要阻塞任务等待用户执行登录或配置。
- 当被问及产品形态与交互方案设计时，直接给出有明确主见的架构与交互方案，不要用连续多轮澄清问题把方案判断推回给用户。
- 设计通用 Agent 工作台界面时需兼顾简单任务与复杂任务，默认采用轻量渐进式布局（简单任务隐藏重型多阶段侧栏），仅在长周期复杂任务时按需展开完整阶段主干。

## Learned Workspace Facts

- `/data/dennyxiao/wuji` 是下一代通用 Agent 工作台的工程仓库：P0 切片「一人 + 多 Agent 任务工作台」已按 `docs/ENGINEERING.md` 完成 M0–M3（对象模型 + DAG 工作流 + 三 gate + 查看器 + 收件箱/账本 + 持久化 + mock harness），M4 真模型待启动。产品调研支线（支流 Tributary：支线追问合并回主线、生成式 UI）原型在 `prototype/tributary/`。文档在 `docs/`，冻结演示面在 `demo/`。
- 本机环境已安装 `parallel-cli`（0.9.3），但处于未认证状态（`authenticated: false`）。
- 调研产出的可视化 Cursor Canvas 文件存放在 `/root/.cursor/projects/data-dennyxiao-wuji/canvases/` 目录下（如 `agent-ux-painpoints-research.canvas.tsx` 与 `agent-collaboration-research.canvas.tsx`）。
