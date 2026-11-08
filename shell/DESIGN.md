---
name: 无极 · 钢灰工坊（壳皮）
description: 安灯车间的钢灰世界——亮度只属于灯，状态只说灯语。
colors:
  beam: "#0f0f0e"
  floor: "#161614"
  floor-2: "#1c1c1a"
  floor-3: "#232320"
  steel: "#2c2c29"
  steel-2: "#3a3a36"
  off: "#34342f"
  plate: "#dcd8cc"
  plate-2: "#c9c4b5"
  plate-ink: "#1b1b19"
  ink: "#efece4"
  ink-2: "#b9b6ad"
  ink-2-5: "#9d9a92"
  ink-3: "#85837b"
  line: "rgba(239, 236, 228, .09)"
  line-2: "rgba(239, 236, 228, .16)"
  call: "#ffc21a"
  call-deep: "#a87a00"
  call-ink: "#2a1f00"
  go: "#3ad16f"
  go-deep: "#1b7a40"
  go-ink: "#08240f"
  stop: "#ff4a35"
  stop-deep: "#9c1f12"
  hold: "#a9c3d6"
  done: "#8f8c83"
typography:
  display:
    fontFamily: "Barlow Condensed, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontWeight: 700
    fontSize: "22-26px"
    letterSpacing: ".02em"
    lineHeight: 1
  label:
    fontFamily: "Barlow Condensed, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontWeight: 600
    fontSize: "11-15px"
    letterSpacing: ".03-.08em"
  body:
    fontFamily: "Barlow, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontWeight: 400
    fontSize: "14px"
    lineHeight: 1.45
  counter:
    fontFamily: "DSEG7, Barlow Condensed, monospace"
    fontWeight: 700
    letterSpacing: ".04em"
    lineHeight: 1
rounded:
  none: "0"
  circle: "50%"
spacing:
  gutter: "28px"
  chain-gap: "4px"
  row: "10px"
  sm: "8px"
  gantry-h: "92px"
components:
  button-ghost:
    backgroundColor: "{colors.floor-2}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 14px"
  button-go:
    backgroundColor: "{colors.go}"
    textColor: "{colors.go-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "5px 10px"
  button-call:
    backgroundColor: "{colors.call}"
    textColor: "{colors.call-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "42px"
    padding: "0 16px 0 12px"
  toggle-pressed:
    backgroundColor: "{colors.floor-3}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "7px 13px"
  chip-mode:
    backgroundColor: "{colors.floor-3}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 11px"
  plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 9px 5px"
    size: "min-width 48px"
  plate-sm:
    backgroundColor: "{colors.steel-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 5px 1px"
  lamp:
    backgroundColor: "{colors.off}"
    rounded: "{rounded.circle}"
    size: "11px"
  badge-artisan:
    backgroundColor: "{colors.steel-2}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 3px"
    height: "15px"
  badge-me:
    backgroundColor: "{colors.call}"
    textColor: "{colors.call-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 3px"
    height: "16px"
  apcard:
    backgroundColor: "{colors.floor-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 16px 12px"
  flow-node:
    backgroundColor: "{colors.floor-3}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 7px"
  artifact-chip:
    backgroundColor: "{colors.floor-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 7px 2px 2px"
  crew-card:
    backgroundColor: "{colors.floor-3}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px 9px"
    width: "min-width 148px"
  counter-seg:
    typography: "{typography.counter}"
    textColor: "{colors.call}"
  summon-bar:
    backgroundColor: "{colors.floor-2}"
    rounded: "{rounded.none}"
    width: "min(760px, 100%)"
---

# Design System: 无极 · 钢灰工坊（壳皮）

> 世界边界：本文件记录**钢灰工坊**（安灯车间）世界，适用于系统壳及其一切壳皮表面（任务台、工单桌、总账等）与共用原子件（工单票、审批卡、事件流条目），正典实现为 `opc-console/` 与 `shell/`。根 `DESIGN.md` 记录的是活文档台的**夜观星台**世界（INTERFACE.md §7「壳用钢灰工坊皮，台内各留其皮」），两套皮相并存、互不改写。

## Overview

**Creative North Star: "钢灰工坊 · 安灯车间（The Andon Workshop）"**

车间不是仪表盘，是工坊的地坪：四层钢灰（beam / floor / steel / plate）铺出空间，横梁压顶，钢板铭牌铆在机具上，七段数码管在线尾计数。整个画面几乎是暗的、哑光的、方角的——**亮度只属于灯**。安灯五色（绿在跑、黄等我、红阻塞、蓝灰等外部、钢灰完成）是唯一的「状态语言」：一盏灯点亮，整个车间立刻知道哪条线在呼吸、哪条线在呼叫、哪条线停了。

字是车间里的工业铭刻：拉丁字与数字一律 Barlow（标签与标题用 Condensed，正文用常规体），中文落到 PingFang SC，计数器用 DSEG7 七段体。没有第三种声音。动效只做两件事——**显影**（粉笔字自上而下逐条浮现）与**通电**（灯错峰点亮、在跑的呼吸、等我的闪烁）；红灯不闪，恒亮，因为最严重的状态不需要动画来引起注意。

**Key Characteristics:**
- 四层钢灰空间 + 横梁压顶：深度靠色调分层，不靠弥散阴影。
- 安灯五色是唯一状态语言；色光只出现在灯上。
- 全方角（0 圆角），圆形只属于灯与圆点（50%）。
- Barlow / Barlow Condensed + PingFang SC；DSEG7 只做机器计数。
- 全宽车道 + 虚线地坪标线，拒绝卡片墙。
- 三段开机序列：粉笔显影 → 通电 → 呼吸；全部服从 `prefers-reduced-motion`。

## Colors

钢灰铺空间，五盏安灯说话；黄色（等我）是这个世界对坊主本人的召唤色。

### Primary
- **呼叫琥珀 Call Amber**（`{colors.call}`，深阶 `{colors.call-deep}`）：唯一指向「我」的颜色——呼叫按钮、七段计数、选中态、`::selection`、焦点环、我的匠人徽记。它在任何屏上出现的比例很小，但每一处都意味着「轮到坊主了」。

### Secondary
- **在跑绿 Run Green**（`{colors.go}`，深阶 `{colors.go-deep}`，绿底刻字 `{colors.go-ink}`）：在跑的灯、进度条、完成计数、批准召唤键（「批准即开工」，绿是这个动作的语义底色）；带呼吸。
- **阻塞红 Stop Red**（`{colors.stop}`，深阶 `{colors.stop-deep}`）：停线、阻塞警示（警示文本用提亮变体 `#ff9a8c`）；恒亮不闪。

### Tertiary
- **等外部蓝灰 Hold Blue-Gray**（`{colors.hold}`）：等外部输入的工位；慢呼吸（2.6s）。
- **完工钢灰 Done Steel**（`{colors.done}`）：完成/未开工的灯与标签；世界自己的灰色，不用绿表示完成。

### Neutral
- **横梁 Beam**（`{colors.beam}`）：顶部横梁，全场最深色，压住画面。
- **地坪三层 Floor**（`{colors.floor}` / `{colors.floor-2}` / `{colors.floor-3}`）：页面底、内嵌控件底、抬升一格的控件底。
- **钢面二层 Steel**（`{colors.steel}` / `{colors.steel-2}`）：徽记、开关槽、进度槽、滚动条。
- **钢板 Plate**（`{colors.plate}` / `{colors.plate-2}` / `{colors.plate-ink}`）：铭牌、正向按钮、toast——车间里唯一「亮」的非发光材料，用纵向渐变 + 内嵌高光做出金属板。
- **墨水四级 Ink**（`{colors.ink}` / `{colors.ink-2}` / `{colors.ink-2-5}` / `{colors.ink-3}`）：正文 / 次要 / 面板次级 / 弱化。`ink-2-5` 为对比度合规而生的中间阶，介于 ink-2 与 ink-3 之间，用于 floor-2 / floor-3 面板上的次要文字（审批卡元行、匠籍卡职责与元行、流程格的完成/未开名）与召唤栏占位符、⌘K 键位提示、派任提示行。
- **标线 Line**（`{colors.line}` / `{colors.line-2}`）：细线与粗线两级半透明描边；车道之间用虚线（地坪标线）。
- **熄灯 Off**（`{colors.off}`）：未点亮的灯座底色。

### Named Rules
**灯语唯一规则（The One Lamp Language Rule）.** 状态色只有安灯五色（go / call / stop / hold / done）加熄灭（off）。任何新状态不许发明第六种颜色——先问它是不是五者之一，或用文本与徽记表达。

**光只归灯规则（The Brightness Belongs to Lamps Rule）.** 彩色光晕（box-shadow 色光、radial 高光、呼吸/闪烁）只出现在灯上。铭牌、按钮、文本、面板一律哑光；焦点环（2px call 色描边）是唯一例外，因为它是操作语言的灯。

## Typography

**Display/Title Font:** Barlow Condensed（中文落 PingFang SC）
**Body Font:** Barlow（中文落 PingFang SC）
**Counter Font:** DSEG7（七段数码）

**Character:** 压缩的工业铭刻——拉丁字与数字窄而挺，配 PingFang 的中文说明文字；数字全程 `font-variant-numeric: tabular-nums`，计数交给七段体，像线尾挂着的计数器。

### Hierarchy
- **Display**（700, 22–26px, line-height 1）：坊名「无极」。
- **Headline**（700, 22px）：区块标题（召唤审批 / 任务车道 / 匠籍）。
- **Title**（700, 16–19px）：台名、铭牌字号、审批卡标题（19px）。
- **Body**（400/500, 12.5–14px, 1.45–1.5）：事件文本、方案文案、最新动态。
- **Label**（600, 11–15px, letter-spacing .03–.08em）：一切标签、按钮、徽记、汇总行；这是世界的主声部。缩微端也归此声部：徽记与形态片角标 11px，流程格名与微铭牌 11.5px。
- **Counter**（DSEG7 700, 18–22px）：产值、分钟数、待处理数。

### Named Rules
**压缩声部规则（The Condensed Voice Rule）.** 拉丁字只用 Barlow 家族：标签/标题/数字用 Barlow Condensed，正文用 Barlow；中文一律 PingFang SC。不引入第三族字体，不用衬线，不用系统显示字体。

**七段只计数规则（The DSEG7 Counts Rule）.** DSEG7 只用于机器计数（金额、分钟、队列数），永远叠一层熄灭的幽灵底码（`88888`）并配 `sr-only` 真值给读屏；不用它排任何文字或标题。

## Layout

横梁压顶、告示行次之、主体三段全宽堆叠、召唤栏沉底。空间是车间的纵剖面，不是网格橱窗。

- **车间横梁（gantry）**：sticky 顶部，高 92px（`--gantry-h`），三段 grid：坊标 + 匠人微灯徽记排｜七段计量表｜台签开关 + ⌘K + 待处理黄钮。梁底一道向下渐隐的黑影，把梁「压」在车间上。
- **告示行（strip）**：周次 + 任务汇总（n 任务 · n 在跑 · n 张召唤待批）+ 红黄警示 + 右置灯语图例。
- **页面沟槽**：左右 28px；≤1280 收 20px，≤860 收 16px。
- **主体三段（任务台首屏）**：① **召唤审批区**——两卡并排 grid（gap 12px；860 以下纵排）；② **任务车道**——全宽任务行，上下以虚线（`{colors.line-2}` dashed）分隔如地坪标线，行 grid `62px 铭牌｜1.05fr 标题+谁在干+最新动态｜1fr 迷你流程灯链｜208px 进度+形态片`，min-height 68px；行背景随状态轻染（call 3.5%、stop 5%），完成行整行降透明 0.68；③ **匠籍带**——一排等宽匠人卡（min-width 148px，gap 8px）+ 招匠虚线空位（128px）。
- **事件流行（共用原子件，总账屏的形制）**：行 grid `52px 时间｜30px 匠人｜1fr 文本｜auto 尾部`；最新在上；call/stop 行给 3–4% 的状态色底染。
- **召唤栏**：fixed 底部居中，`min(760px, 100%)`，底部一层「透明→地坪」渐隐让上方内容沉入；书态展开第二行派任提示（「提交后排用人方案，召唤谁由你批」）。
- **断点**：1280（收沟槽与任务行列宽）· 1100（藏横梁匠徽排；任务行折两行，灯链占满次行 grid-area）· 860（单列重排：横梁两行、审批卡纵排、任务行折两行、流程链与匠籍带横滑 + 右缘 30px 渐隐遮罩（mask-image，不用负边距出血）、藏图例与键位提示）。

## Elevation & Depth

深度靠钢灰色调分层（beam 最深 → floor 三层 → steel 两层 → plate 最亮），不靠弥散阴影。真实阴影只表达「物理抬起」：钢板铭牌有内嵌上高光 + 2px 投影（铆在机具上）；呼叫按钮 hover 抬 1px、影加深；召唤栏投影最深（`0 12px 34px rgba(0,0,0,.55)`），因为它是浮在地坪上最重的一件家什。灯的色光是照明，不是海拔。

### Shadow Vocabulary
- **铆板（plate）**：`0 1px 0 rgba(255,255,255,.4) inset, 0 2px 4px rgba(0,0,0,.45)`——钢板铭牌。
- **抬键（call-btn）**：`0 4px 14px rgba(0,0,0,.45)`，hover `0 6px 18px rgba(0,0,0,.55)`。
- **沉底（summon）**：`0 12px 34px rgba(0,0,0,.55)`，focus-within 再加一圈 call 色 1px 环。
- **灯照明**：仅灯元素，如 run 灯 `0 2px 10px rgba(58,209,111,.7)`。

### Named Rules
**哑光材料规则（The Matte Material Rule）.** 面板与控件不加环境影；阴影只属于被物理抬起的物件（铭牌、主按钮、召唤栏、toast）。要分层，先换钢灰阶。

## Shapes

方角铁律：一切面板、按钮、输入、下拉、徽记、铭牌都是 0 圆角矩形；圆形（`border-radius: 50%`）只属于灯与圆点（安灯、警示点、live 点、beacon、徽记微灯），没有中间值。钢板铭牌带两颗 3px 铆钉圆点；车道分隔用虚线（地坪标线），实细线留给行分隔。

### Named Rules
**方角铁则（The Square-Cut Rule）.** 圆角只有两个合法值：0 和 50%。出现 4px、8px 之类的中间圆角就是出皮。

## Components

### Lamps（安灯 · 签名件）
- **Shape:** 正圆 11px（任务行状态灯 13px、事件尾 9px、图例 9px、流程格灯 8px），`{rounded.circle}`。
- **熄灭:** `{colors.off}` 底 + 内下阴影（灯座）。
- **点亮:** radial 高光（38% 32% 白心）+ 本色 + 深阶 + 彩色投影。
- **灯律:** run 呼吸 1.8s（brightness .72）· call 闪烁 1s steps(1) · stop **恒亮** · hold 慢呼吸 2.6s · done 静止。红灯不闪——最严重的状态靠恒亮与色相，不靠动画。

### Micro Andon Cell（微缩工位 · 流程格 fnode）
灯 + 小铭牌/工序名，坐在 `{colors.floor-3}` 底上，顶边 2px 状态色条 + 状态色染的暗底（run `#1d2620`、call `#2a2614`、stop `#2c1b18`、done `#1f1f1d`）。任务车道的流程格（fnode）是它的现行形态：格内工序名 11.5px，完成/未开的名用面板墨水（`{colors.ink-2-5}`）。通电时按行 `--d`+300ms 基准、格序 `--fd` 70ms 递增错峰 node-on（只动 opacity，自 .12 起）；状态灯的呼吸/闪烁叠加其上，不受影响。

### Summon Approval Card（召唤审批卡 · 签名件）
黄顶边工单卡（`{colors.floor-2}` 底 + 顶边 2px call 色条）：顶行「召唤标签（黄灯沿等灯语法 1s 闪烁；契约语写「呼吸」，建成物是闪烁，以建成物为准）· 来源与时间 · 匠徽排」；标题（Condensed 19px）；方案文案一段（13.5px，匠人名加粗）；元行 步骤 · 我的分钟 · 成本 · 工期（面板墨水底、数值提亮 ink-2，「我的分钟」用琥珀文字变体 `#e6c35a` 强调——它花的是坊主的时间）；三钮：**批准召唤**（go 绿实底，.btn.go）· **改案**（ghost）· **拒绝**（ghost 透明底）。等 UI 原语，不是弹窗。入场走粉笔显影。

### Task Lane Row（任务车道 · 签名件）
全宽可点行（整行 click 与 Enter/Space 键盘激活，进该任务的 flow 内景），虚线分隔。左起：状态灯（13px）+ 钢板铭牌｜标题 + 状态词 + 谁在干（匠徽排，「我」反白琥珀）+ 最新动态一句话（ellipsis 截断）｜迷你流程灯链（fnode 4–6 格，见微缩工位）｜进度（百分 19px Condensed + n/m 步）与产物形态片。行背景随状态轻染；完成行降透明。

### Artifact Chip（产物形态片）
形态即入口的开器：形态字角标（表/稿/图/记/码，17×15 钢灰底、11px）+ 产物名，ghost 语法（`{colors.floor-2}` 底 + 标线描边），hover 升钢面；点开进对应形态的编辑器/展示器（表格编辑器、文档阅读器、看图器、diff 视图）。

### Crew Card（匠籍卡）
方角卡 + 顶边 2px 状态色条 + 等高底边：徽记 · 名 · 职责 · 状态词｜元行 在单 · 自治 L · 本周成本（面板墨水底、数值 ink-2）。卡宽收窄至 min-width 148px 下限时接受 meta 精简与 2–3 行折行——先保字段、再保行数，属可接受适应。hover 显「管理」角标（11.5px）；招匠空位为虚线框透明卡（128px）。

### Steel Plate（钢板铭牌）
`plate` 渐变金属板 + `{colors.plate-ink}` 压字 + 铆钉圆点 + 铆板投影，用于线号与台名；`plate.sm` 降为钢灰小铭牌（无铆钉无投影，11.5px），嵌在工位与事件文本行内。

### Artisan Badge（匠人徽记 / .mk）
Barlow Condensed 700 的两字母钢片徽记；**我的徽记反白为呼叫琥珀**（`{colors.call}` 底 + `{colors.call-ink}` 字）。横梁坊标微灯版（.cm）在右下角带 6px 状态微灯，描一圈 beam 色边。

### Buttons
- **Shape:** 全方角（0），Barlow Condensed 600。
- **Ghost（.btn）:** `{colors.floor-2}` 底 + `{colors.line-2}` 描边；hover 升 `{colors.steel}`、描边提亮；active 下压 1px。键位胶囊（.kbd）内嵌。ghost 透明底变体用于消极动作（拒绝）。
- **Go（.btn.go · 批准键）:** 在跑绿实底 + `{colors.go-ink}` 字、描边同色，hover 提亮 `#5be38a`。批准召唤专用——「批准即开工」；常规以 .btn.sm 尺寸出现。
- **Call（.call-btn）:** 呼叫琥珀底 + `{colors.call-ink}` 字，DSEG7 计数，深投影，hover 抬 1px。键内 10px 信标圆点慢脉冲（beacon 2.6s，50% 谷值 opacity .4）——决策级打扰的等待语言，比灯的闪烁安静一档。清空态降为钢灰（opc-console 正典）。
- **台签开关（.toggle）:** 钢面槽（`{colors.steel}`）内的方角分段；选中 `{colors.floor-3}` + 黑色小投影；台签右上角 5px 状态微灯（data-lamp）。
- **召唤分段（问/书）与模式片（.wchip）:** 同开关语法；wchip 选中翻为钢板（plate 底 + plate-ink 字）。

### Counters（七段计量表）
横梁三表：本周净额（绿）、占用我分钟（琥珀）、判断命中（Barlow 数字）。DSEG7 + 幽灵底码 + sr-only 真值。

### Event Row（车间记事行 · 共用原子件）
时间（Condensed）｜匠人徽记｜「线号铭牌 + 工序 + 一句话」｜尾部状态灯 + 状态词 + 进度条（88×5px 槽，状态色，呼吸）+ 百分比。call/stop 行整行 3–4% 色染。入场走粉笔显影。（总账/工单桌的形制；任务台首屏以「最新动态」随任务行走。）

### Summon Bar（召唤栏 · 签名件）
底部居中的地坪家什：问⇄书双态分段 + 无边输入 + ⌘K 胶囊 + 钢板发送键（46px 方块，hover 提到纯白）；书态展开第二行派任提示（whint，面板墨水 + call 色关键词）；输入占位符与键位提示用面板墨水。focus-within 时描一圈 call 色。

### Toast（钢板告示）
左下角钢板小牌（plate 底 + plate-ink 字 + 绿灯），`0 10px 30px rgba(0,0,0,.5)` 抬起；升起/回落 0.4s。

### Boot Sequence（粉笔显影 · 签名动效）
加载三段：任务行 / 审批卡 / 匠籍卡逐条 chalk 显影（0.6s，opacity + translateY(7px) + blur(3px)，`--d` 错峰）；流程链 node-on 通电（行基准 `--d`+300ms，格序 `--fd` 70ms 递增，只动 opacity）；在跑的灯进入 breathe 呼吸。全部用 `--ease: cubic-bezier(.16,1,.3,1)`，`prefers-reduced-motion` 一刀关闭。

## Do's and Don'ts

### Do:
- **Do** 用安灯五色 + 熄灭表达一切状态；灯是状态的唯一权威来源，文本与色条只复述灯。
- **Do** 让每个计数走 DSEG7 + 幽灵底码 + `sr-only` 真值；所有数字开 `tabular-nums`。
- **Do** 用全宽车道 + 虚线地坪标线组织列表；汇总信息放台头一行。
- **Do** 把动效限制在显影、通电、呼吸、闪烁四类，统一 `--ease` 与 `--d` 错峰，并挂 `prefers-reduced-motion` 分支。
- **Do** 列表行整行可点时同步支持键盘 Enter/Space 激活，并给行本身 focus-visible 焦点环。
- **Do** 横滑容器（流程链、匠籍带）用右缘渐隐遮罩（mask-image，30px）提示可滑，不用负边距出血。
- **Do** 给演示数据挂「示例数据」钢灰小签。
- **Do** 保持中文 PingFang、拉丁 Barlow 的分工，无需另配字重。

### Don't:
- **Don't** 发明第六种状态色，或把安灯色当装饰色用（call 琥珀只召唤「我」，不做品牌点缀）。
- **Don't** 使用 0 与 50% 之外的圆角。
- **Don't** 让非灯元素发光——铭牌、按钮、标题不加彩色光晕与 text-shadow。
- **Don't** 搭卡片墙、侧边导航、图表大屏或聊天流；这个世界是车间地坪，不是橱窗。
- **Don't** 引入 Barlow / PingFang / DSEG7 之外的字体家族。
