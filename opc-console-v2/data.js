/* 示例数据：全部为虚构的演示内容，用于展示形态。
 * 模型：我 → 若干分类（只用于分组和小计）→ ≤10 条业务 → 流程步骤。
 * 步骤的执行者 x：Agent id / "me"（我本人）/ "tool"（脚本、定时任务）/ "ext"（等外部）。
 */
window.OPC = {
  today: "10-30",
  week: "第 44 周 · 10/26 – 11/01",
  hits: { ok: 9, total: 13 },

  ventures: [
    { id: "media", name: "智媒体", prefix: "M", note: "个人 IP · 内容变现" },
    { id: "product", name: "做产品", prefix: "P", note: "uplook · 增长" },
    { id: "invest", name: "投资理财", prefix: "F", note: "个人资产 · 收益按周记" }
  ],

  /* Agent：按职能命名，不做人设。一个 Agent 可以在多条业务里干活。 */
  agents: [
    { id: "flowsmith", name: "Flowsmith", role: "流程设计", mk: "Fs", duty: "想法 → 调研 → 查失败库 → 设计流程；也负责改流程", trust: 1, trustNote: "方案一律要我批准", runs: 3, pass: 100, rework: 0, cost: 36, asks: 1 },
    { id: "steward", name: "Steward", role: "巡检运维", mk: "St", duty: "巡检所有业务：异常先自己处理，处理不了的整理成待办给我", trust: 2, trustNote: "可自行重试、改参数", runs: 23, pass: 96, rework: 0, cost: 22, asks: 6, solved: 15 },
    { id: "scout", name: "Scout", role: "调研", mk: "Sc", duty: "抓热点、检索素材、找线索、竞品", trust: 3, trustNote: "全自主", runs: 61, pass: 97, rework: 2, cost: 140, asks: 0 },
    { id: "quill", name: "Quill", role: "写作", mk: "Qu", duty: "脚本、长文、文案、话术、需求卡", trust: 1, trustNote: "对外文字须我过目", runs: 48, pass: 88, rework: 6, cost: 310, asks: 1 },
    { id: "lens", name: "Lens", role: "视觉", mk: "Le", duty: "出图、分享卡、配音剪辑", trust: 2, trustNote: "抽检；本周停线 1 次", runs: 39, pass: 82, rework: 7, cost: 820, asks: 2 },
    { id: "herald", name: "Herald", role: "触达", mk: "He", duty: "外联、推送序列、私信", trust: 2, trustNote: "抽检", runs: 15, pass: 96, rework: 0, cost: 60, asks: 0 },
    { id: "tally", name: "Tally", role: "数据", mk: "Ta", duty: "打分、分群、聚类、归因、估值、记账", trust: 2, trustNote: "抽检", runs: 33, pass: 94, rework: 1, cost: 90, asks: 2 }
  ],

  /* 失败库：砍掉的试验必须结账，Flowsmith 开题前先查这里。 */
  lib: [
    { name: "付费 PDF 模板包", date: "08-21", cause: "渠道不对", signal: "首周收藏 < 50 就该停", tags: ["小红书", "付费", "合集", "模板"] }
  ],

  lines: [
    {
      id: "M-01", v: "media", name: "热点短视频", stage: "业务", ver: 4,
      rev: 6240, cost: 1180, min: 42,
      trend: [3100, 3600, 4200, 3900, 4800, 5200, 5600, 6240],
      costs: [900, 950, 1000, 980, 1050, 1100, 1120, 1180],
      steps: [
        { n: "抓热点", x: "scout", s: "done", k: "发现", m: "今日 38 条候选", share: "P-01" },
        { n: "选题打分", x: "tally", s: "done", k: "发现", m: "入选 4 条" },
        { n: "写脚本", x: "quill", s: "done", k: "生产", m: "4 份脚本" },
        { n: "审稿", x: "me", s: "done", k: "生产", m: "平均 3 分钟 / 条" },
        { n: "配音剪辑", x: "lens", s: "run", k: "生产", m: "渲染 3 / 4 条" },
        { n: "多平台分发", x: "tool", s: "idle", k: "分发", m: "抖音 · 视频号 · B 站" },
        { n: "星图接单", x: "ext", s: "idle", k: "转化", y: true, m: "本周 2 单" }
      ],
      decisions: [
        { date: "10-12", call: "加码", reason: "连续 3 周单条播放破 10 万，询价变多。", pred: "两周内星图单价从 ¥1,800 提到 ¥2,500", review: "10-26", outcome: null }
      ]
    },
    {
      id: "M-02", v: "media", name: "公众号深度长文", stage: "业务", ver: 3,
      rev: 2180, cost: 210, min: 95,
      feeds: [{ to: "M-03", what: "社群新成员 62% 来自长文" }],
      trend: [2600, 2400, 2500, 2300, 2200, 2350, 2050, 2180],
      costs: [200, 210, 190, 220, 200, 210, 205, 210],
      steps: [
        { n: "素材检索", x: "scout", s: "done", k: "发现", m: "命中 46 条素材" },
        { n: "列提纲", x: "quill", s: "done", k: "生产", m: "5 节" },
        { n: "写初稿", x: "quill", s: "done", k: "生产", m: "6,200 字" },
        { n: "改稿定稿", x: "me", s: "call", k: "生产", m: "已等你 5 小时" },
        { n: "排版配图", x: "tool", s: "idle", k: "生产", m: "模板 B" },
        { n: "发布", x: "tool", s: "idle", k: "分发", m: "周五 20:00" },
        { n: "流量主 · 赞赏", x: "ext", s: "idle", k: "转化", y: true, m: "单篇均 ¥540" }
      ],
      decisions: [
        { date: "10-05", call: "继续", reason: "单篇收入一般，但社群付费主要从这里来。", pred: "改稿时间降到每篇 20 分钟以内", review: "11-02", outcome: null },
        { date: "09-14", call: "降级", reason: "Quill 初稿两次事实错误。", pred: "加我审稿后零事实错误", review: "09-28", outcome: "ok" }
      ]
    },
    {
      id: "M-03", v: "media", name: "知识星球社群", stage: "业务", ver: 2,
      rev: 3900, cost: 90, min: 120,
      trend: [3600, 3700, 3650, 3800, 3820, 3900, 3880, 3900],
      costs: [90, 90, 90, 90, 90, 90, 90, 90],
      steps: [
        { n: "每日精选", x: "scout", s: "done", k: "发现", m: "7 / 7 天" },
        { n: "写周报", x: "quill", s: "done", k: "生产", m: "已推送" },
        { n: "答疑", x: "me", s: "call", k: "交付", m: "12 条提问待回" },
        { n: "续费提醒", x: "tool", s: "idle", k: "转化", m: "本周到期 18 人" },
        { n: "续费", x: "ext", s: "idle", k: "转化", y: true, m: "续费率 71%" }
      ],
      decisions: [
        { date: "10-19", call: "继续", reason: "收入稳定，但答疑太耗我时间。", pred: "答疑交给 Quill 草拟后，每周少花 60 分钟", review: "11-09", outcome: null }
      ]
    },
    {
      id: "M-04", v: "media", name: "小红书图文带货", stage: "试验", ver: 1, left: 6,
      rev: 1460, cost: 380, min: 30,
      trend: [0, 0, 0, 0, 0, 320, 780, 1460],
      costs: [0, 0, 0, 0, 0, 260, 310, 380],
      crit: { text: "14 天内，单篇 GMV ≥ ¥3,000 的笔记 ≥ 2 篇", cur: 1, target: 2, unit: "篇", locked: "10-23", due: "11-05", dueIn: 6 },
      steps: [
        { n: "选品", x: "scout", s: "done", k: "发现", m: "12 款入池" },
        { n: "拍摄脚本", x: "quill", s: "done", k: "生产", m: "12 份" },
        { n: "出图", x: "lens", s: "run", k: "生产", m: "9 / 12 张" },
        { n: "发笔记", x: "tool", s: "idle", k: "分发", m: "每日 2 篇" },
        { n: "挂车成交", x: "ext", s: "idle", k: "转化", y: true, m: "转化率 2.1%" }
      ],
      decisions: [
        { date: "10-23", call: "继续", reason: "开题。有现成选品渠道，验证内容能不能带货。", pred: "两周内出 2 篇爆款", review: "11-05", outcome: null }
      ]
    },
    {
      id: "M-05", v: "media", name: "AI 绘本电子书", stage: "试验", ver: 1, left: 0,
      rev: 86, cost: 410, min: 26,
      trend: [0, 0, 0, 0, 0, 24, 38, 86],
      costs: [0, 0, 0, 0, 0, 120, 130, 410],
      crit: { text: "21 天内，累计销量 ≥ 100 本", cur: 17, target: 100, unit: "本", locked: "10-09", due: "10-30", dueIn: 0 },
      steps: [
        { n: "选题", x: "scout", s: "done", k: "发现", m: "睡前故事系列" },
        { n: "写故事", x: "quill", s: "done", k: "生产", m: "第 4 册" },
        { n: "生成插图", x: "lens", s: "stop", k: "生产", m: "模型额度用尽 · 停线 7 小时" },
        { n: "上架", x: "me", s: "idle", k: "分发", m: "Kindle · 微信读书" },
        { n: "销售", x: "ext", s: "idle", k: "转化", y: true, m: "¥5.9 / 本" }
      ],
      decisions: [
        { date: "10-09", call: "继续", reason: "开题。亲子内容需求大，生产成本低。", pred: "三周 100 本", review: "10-30", outcome: null }
      ]
    },

    {
      id: "P-01", v: "product", tag: "uplook", name: "分享裂变", stage: "业务", ver: 3,
      rev: 4360, cost: 920, min: 48,
      trend: [1800, 2100, 2600, 3000, 3300, 3900, 4100, 4360],
      costs: [600, 650, 700, 760, 800, 860, 900, 920],
      steps: [
        { n: "抓热点", x: "scout", s: "done", k: "发现", m: "候选 22 个", share: "M-01" },
        { n: "写文案", x: "quill", s: "done", k: "生产", m: "3 版 A/B" },
        { n: "生成分享卡", x: "lens", s: "done", k: "生产", m: "3 张" },
        { n: "审核", x: "me", s: "call", k: "生产", m: "3 张卡等你" },
        { n: "站内投放", x: "tool", s: "idle", k: "分发", m: "预计触达 4.2 万" },
        { n: "邀请转化", x: "ext", s: "idle", k: "转化", y: true, m: "K 值 1.18" }
      ],
      decisions: [
        { date: "10-14", call: "加码", reason: "分享卡点击率 8.2%，是均值的两倍。", pred: "两周内 K 值 > 1.3", review: "10-28", outcome: null }
      ]
    },
    {
      id: "P-02", v: "product", tag: "uplook", name: "新用户激活", stage: "业务", ver: 5,
      rev: 6820, cost: 640, min: 12,
      trend: [5200, 5600, 5900, 6100, 6300, 6500, 6700, 6820],
      costs: [560, 580, 600, 600, 620, 630, 640, 640],
      steps: [
        { n: "注册事件", x: "ext", s: "done", k: "发现", m: "本周 3,180 人" },
        { n: "分群", x: "tally", s: "done", k: "生产", m: "5 个分群" },
        { n: "欢迎序列", x: "herald", s: "done", k: "生产", m: "3 封 × 5 群" },
        { n: "推送", x: "tool", s: "run", k: "分发", m: "第 2 封 · 1,240 人" },
        { n: "次日留存", x: "ext", s: "idle", k: "转化", m: "41%" },
        { n: "首次订阅", x: "ext", s: "idle", k: "转化", y: true, m: "转化 6.8%" }
      ],
      decisions: [
        { date: "10-02", call: "加码", reason: "分群后打开率翻倍。", pred: "首订转化 > 6%", review: "10-23", outcome: "ok" }
      ]
    },
    {
      id: "P-03", v: "product", tag: "uplook", name: "反馈转需求", stage: "业务", ver: 2,
      rev: 0, cost: 70, min: 35,
      feeds: [{ to: "P-01", what: "票数最高的「分享卡自定义模板」直接影响分享率" }],
      trend: [0, 0, 0, 0, 0, 0, 0, 0],
      costs: [60, 60, 70, 70, 70, 70, 70, 70],
      steps: [
        { n: "收集反馈", x: "tool", s: "done", k: "发现", m: "本周 214 条" },
        { n: "聚类", x: "tally", s: "done", k: "生产", m: "17 个主题" },
        { n: "写需求卡", x: "quill", s: "done", k: "生产", m: "6 张" },
        { n: "排优先级", x: "me", s: "call", k: "交付", m: "6 张待排" },
        { n: "进迭代", x: "ext", s: "idle", k: "交付", m: "下个迭代 11-04" }
      ],
      decisions: []
    },
    {
      id: "F-01", v: "invest", name: "指数基金定投", stage: "业务", ver: 2, kind: "收益",
      rev: 1240, cost: 12, min: 8,
      trend: [420, 860, 0, 1300, 380, 1500, 600, 1240],
      costs: [12, 12, 12, 12, 12, 12, 12, 12],
      steps: [
        { n: "拉行情", x: "tool", s: "done", k: "发现", m: "6 只指数" },
        { n: "估值分位", x: "tally", s: "done", k: "发现", m: "沪深 300 PE 分位 22%" },
        { n: "调仓建议", x: "tally", s: "done", k: "生产", m: "本周加仓 ¥3,000" },
        { n: "确认下单", x: "me", s: "call", k: "转化", m: "等你确认" },
        { n: "券商成交", x: "ext", s: "idle", k: "转化", y: true, m: "T+1 确认" }
      ],
      decisions: [
        { date: "10-10", call: "继续", reason: "估值处于低位，按规则加仓，不择时。", pred: "季度内收益 ≥ 4%", review: "12-31", outcome: null }
      ]
    }
  ],

  /* 想法孵化：Flowsmith 手上的想法。stage 0 派出 / 1 调研 / 2 查失败库 / 3 设计流程 / 4 待批准 */
  ideas: [
    {
      id: "I-07", v: "media", name: "播客切片引流", hyp: "播客听众愿意进社群", stage: 1,
      note: "已读 14 个同类账号，正在估算切片的引流转化"
    },
    {
      id: "I-06", v: "media", name: "长文拆成小红书图文合集", hyp: "长文读者愿意为结构化合集付费", stage: 4, rev: 1,
      draft: {
        research: [
          "小红书同类合集笔记，头部单篇收藏 2 千 – 8 千",
          "公众号存量 64 篇长文，可直接拆，不用新写",
          "合集定价 ¥19.9 在同类里处于中位"
        ],
        feas: "中高",
        risks: ["和 M-04 小红书带货共用账号，两条线可能互相稀释"],
        reuse: ["M-02「素材检索」· Scout", "M-04「发笔记」· 脚本"],
        steps: [
          { n: "选篇", x: "scout", k: "发现", m: "复用 M-02 素材检索", reuse: true },
          { n: "拆成卡片文案", x: "quill", k: "生产", m: "每篇 6–9 张" },
          { n: "出图", x: "lens", k: "生产", m: "统一模板" },
          { n: "过目", x: "me", k: "生产", m: "约 5 分钟 / 篇" },
          { n: "发笔记", x: "tool", k: "分发", m: "复用 M-04 发笔记", reuse: true },
          { n: "合集售卖", x: "ext", k: "转化", y: true, m: "¥19.9 / 份" }
        ],
        myMin: 25, cost: 180,
        crit: "21 天内，合集付费 ≥ 30 份", days: 21, budget: 400
      }
    }
  ],

  /* 待处理：每一件都标明是哪个 Agent 提交的。 */
  calls: [
    { id: "c1", from: "steward", line: "M-05", t: "决策", title: "判据到期：AI 绘本 21 天销量 17 / 100", ctx: "判据锁定于 10-09，未达成。按规则只有一个选项：砍，并结账。", mins: 8, acts: [{ l: "按判据砍 · 去结账", fx: "kill", k: "warn" }, { l: "打开业务", fx: "open" }] },
    { id: "c8", from: "flowsmith", idea: "I-06", t: "决策", title: "流程方案待批准：长文拆成小红书图文合集", ctx: "调研完成，失败库命中 1 条相似记录。6 道步骤，其中 2 道复用；预计每周花你 25 分钟。", mins: 6, acts: [{ l: "看方案", fx: "draft", k: "go" }] },
    { id: "c2", from: "steward", line: "M-01", t: "决策", title: "决策回看：10-12「加码」", ctx: "你当时预测：两周内星图单价从 ¥1,800 提到 ¥2,500。实际：¥2,200。", mins: 2, acts: [{ l: "预测对了", fx: "rv-ok" }, { l: "部分对", fx: "rv-part" }, { l: "预测错了", fx: "rv-bad" }] },
    { id: "u4", from: "tally", line: "P-03", t: "决策", title: "6 张需求卡待排优先级", ctx: "票数最高的是「分享卡自定义模板」（38 条反馈），它支撑 P-01 分享裂变。", mins: 15, acts: [{ l: "按票数排并进迭代", fx: "advance", k: "go" }, { l: "打开业务", fx: "open" }] },
    { id: "c3", from: "quill", line: "M-02", t: "确认", title: "《被算法驯化的我们》终稿待你改", ctx: "初稿 6,200 字。Quill 自评：第三节论据偏弱，已标出 4 处。已等 5 小时。", mins: 18, acts: [{ l: "改完 · 通过并排版", fx: "advance", k: "go" }, { l: "打回重写", fx: "rewind" }] },
    { id: "c4", from: "steward", line: "M-03", t: "确认", title: "12 条社群提问待回复", ctx: "已让 Quill 草拟 9 条回复，另外 3 条涉及付费咨询，建议你亲自答。", mins: 25, acts: [{ l: "发出草稿并补答 3 条", fx: "advance", k: "go" }, { l: "以后交给 Quill", fx: "delegate", to: "quill" }] },
    { id: "u1", from: "lens", line: "P-01", t: "确认", title: "3 张分享卡待审核", ctx: "主题：「秋天第一张截图」。Lens 自检：第 2 张文字过长，可能被截断。", mins: 6, acts: [{ l: "通过并投放", fx: "advance", k: "go" }, { l: "打回重做", fx: "rewind" }, { l: "以后交给 Lens 自审", fx: "delegate", to: "lens" }] },
    { id: "c5", from: "lens", line: "M-05", t: "确认", title: "插图模型额度用尽，停线 7 小时", ctx: "加购 ¥120 额度即可恢复。注意：这条业务的判据今天到期。", mins: 1, acts: [{ l: "加购并恢复", fx: "resume" }, { l: "保持停线", fx: "read" }] },
    { id: "f1", from: "tally", line: "F-01", t: "确认", title: "本周定投：加仓沪深 300 ¥3,000", ctx: "PE 分位 22%，按规则低于 30% 加仓。需要你确认后下单。", mins: 1, acts: [{ l: "确认下单", fx: "advance", k: "go" }, { l: "本周跳过", fx: "read" }] },
    { id: "c7", from: "tally", line: "M-04", t: "知情", title: "第 1 篇达标笔记：单篇 GMV ¥3,420", ctx: "判据进度 1 / 2，还剩 6 天。", mins: 0, acts: [{ l: "已读", fx: "read" }] },
    { id: "u6", from: "tally", line: "P-02", t: "知情", title: "激活序列次日留存升到 41%（+3pt）", ctx: "Herald 改版第 2 封邮件后生效。", mins: 0, acts: [{ l: "已读", fx: "read" }] }
  ]
};
