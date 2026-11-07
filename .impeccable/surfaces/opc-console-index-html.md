---
version: 1
slug: "opc-console-index-html"
primary_target: "opc-console/index.html"
related_targets: []
---

Scope: opc-console 首屏（产线总览）+ 下钻（单条产线：工位、运行记录、判据、决策）+ 待我处理队列。Mode: Operate。

Audience / job: 一人公司创始人，每天花 10 分钟扫一遍不超过 10 条业务流水线，判断哪条继续、砍掉还是加码，并清空需要自己处理的工位。

Data: 两套演示数据（智媒体内容创作、uplook 产品），都可切换，并明确标为示例数据。

## Direction contract

THESIS: 每条业务是工坊里的一条工序链，工序由具名匠人（Agent）、坊主本人、机具或外部完成；坊主站的工序就是请示点。拒绝卡片墙、侧边导航、表格 dashboard。

OWN-WORLD: 钢灰工坊底色。每个工位顶上一盏安灯（绿＝在做，黄＝呼叫你，红＝停线，暗＝未开工，钢灰＝完工）。线尾是七段数码产值计数器，产线编号用钢板铭牌，车道之间用地坪标线分隔。字体用 Barlow Condensed 配 PingFang，计数器用 DSEG7。

STORY: 一眼看出哪条线停了、哪条在等我、哪条赚钱、哪条耗掉我的时间。点开一条线，看工位、运行记录、判据和决策；直接在呼叫面板里处理黄灯。

FIRST VIEWPORT: 顶部是车间横梁，放车间名、本周总产值计数器、我的分钟数，以及“呼叫 N”按钮。下方是 6 到 8 条产线车道，每条占满整行：左边铭牌加当前工位，中间是安灯工位链，右边是计数器、成本和分钟数。

FORM: 工坊安灯看板，自有列表第 2 位，种子 1589aec5（第 1 轮重抽，稳妥档）。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
