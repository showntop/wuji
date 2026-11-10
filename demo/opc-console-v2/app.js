(() => {
  "use strict";

  const D = window.OPC;
  if (!D || !D.lines) throw new Error("data.js 未加载或是旧版本（缺少 window.OPC）。请强制刷新预览。");
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const TODAY = D.today;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Math.round(n).toLocaleString("zh-CN");
  const yuan = (n) => (n < 0 ? "-¥" : "¥") + fmt(Math.abs(n));
  const icon = (id) => `<svg class="i" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = (n) => String(n).padStart(2, "0");

  const SL = { run: "在跑", call: "等我", stop: "阻塞", hold: "等外部", idle: "未开始", done: "完成", paused: "已暂停", off: "已归档" };
  const KS = ["发现", "生产", "分发", "转化", "交付"];
  const LIVE = ["stop", "call", "run", "hold"];
  const STAGES = ["派出", "调研", "查失败库", "设计步骤", "待批准"];
  const CAP = 10, BENCH = 3;
  const SUGGEST = { 发现: "scout", 生产: "quill", 分发: "herald", 转化: "herald", 交付: "quill" };

  const S = {
    view: "chain", hl: null,
    hits: { ...D.hits },
    agents: clone(D.agents),
    lib: clone(D.lib),
    lines: clone(D.lines),
    ideas: clone(D.ideas),
    calls: clone(D.calls),
    open: null, sheet: null, sel: null, flash: null, form: null
  };
  const AG = Object.fromEntries(S.agents.map((a) => [a.id, a]));
  const VEN = Object.fromEntries(D.ventures.map((v) => [v.id, v]));
  const line = (id) => S.lines.find((l) => l.id === id);
  const ideaOf = (id) => S.ideas.find((i) => i.id === id);
  const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
  const liveLines = () => S.lines.filter((l) => l.stage !== "归档");

  /* ---------- who ---------- */
  function who(x) {
    if (x === "me") return { kind: "me", mk: "我", short: "我", full: "我" };
    if (x === "tool") return { kind: "tool", short: "脚本", full: "脚本 / 定时任务" };
    if (x === "ext") return { kind: "ext", short: "等外部", full: "等外部" };
    const a = AG[x];
    return { kind: "ag", mk: a.mk, short: a.name, full: `${a.name} ${a.role}`, a };
  }
  function mark(x, cls = "") {
    const w = who(x);
    if (w.kind === "tool") return icon("tool");
    if (w.kind === "ext") return icon("ext");
    return `<span class="mk${w.kind === "me" ? " mk-me" : ""}${x === "flowsmith" ? " mk-fs" : ""}${cls ? " " + cls : ""}" aria-hidden="true">${w.mk}</span>`;
  }

  /* ---------- line helpers ---------- */
  function status(l) {
    if (l.stage === "归档") return "off";
    if (l.paused) return "paused";
    const ss = l.steps.map((s) => s.s);
    for (const k of LIVE) if (ss.includes(k)) return k;
    return "idle";
  }
  const activeIdx = (l) => l.steps.findIndex((s) => LIVE.includes(s.s));
  const stepState = (l, s) => (l.stage === "归档" && s.s !== "done" ? "idle" : l.paused && s.s === "run" ? "paused" : s.s);
  const meCount = (l) => l.steps.filter((s) => s.x === "me").length;

  function rng(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }
  const addDays = (mmdd, d) => { const [m, dd] = mmdd.split("-").map(Number); const t = new Date(2026, m - 1, dd + d); return `${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
  const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${pad(Math.round(m % 60))}m` : `${Math.round(m)}m`);

  /* ---------- seven segment ---------- */
  function seg(el, v, digits) {
    const n = Math.round(v);
    const s = n < 0 ? "-" + String(-n).padStart(digits - 1, "!") : String(n).padStart(digits, "!");
    el.innerHTML = `<span class="seg-ghost" aria-hidden="true">${"8".repeat(digits)}</span><span class="seg-val" aria-hidden="true">${s}</span><span class="sr">${fmt(n)}</span>`;
  }
  function tweenSeg(el, to, digits) {
    const from = el.dataset.v === undefined ? 0 : +el.dataset.v;
    el.dataset.v = to;
    if (reduce || from === to) return seg(el, to, digits);
    const t0 = performance.now(), d = 900;
    const tick = (t) => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 4); seg(el, from + (to - from) * e, digits); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  const segHTML = (v, digits, cls = "") => {
    const n = Math.round(v);
    return `<span class="seg ${cls}"><span class="seg-ghost" aria-hidden="true">${"8".repeat(digits)}</span><span class="seg-val" aria-hidden="true">${String(n).padStart(digits, "!")}</span><span class="sr">${fmt(n)}</span></span>`;
  };

  /* ---------- gantry + strip ---------- */
  function renderGantry() {
    const live = liveLines();
    const rev = sum(live, (l) => l.rev), cost = sum(live, (l) => l.cost), min = sum(live, (l) => l.min);
    tweenSeg($("#m-rev"), rev, 5);
    tweenSeg($("#m-net"), rev - cost, 5);
    tweenSeg($("#m-min"), min, 3);
    const ok = Number.isInteger(S.hits.ok) ? S.hits.ok : S.hits.ok.toFixed(1);
    $("#m-hit").innerHTML = `${ok}<em> / ${S.hits.total}</em>`;
    $("#call-count").textContent = S.calls.length;
    $("#call-btn").classList.toggle("clear", S.calls.length === 0);
    $("#brand-crew").innerHTML = `我 + ${S.agents.length} 个 Agent · ${live.length} / ${CAP} 条业务`;
    $$(".toggle button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === S.view));

    const running = live.filter((l) => status(l) === "run").length;
    const stops = live.filter((l) => status(l) === "stop");
    const due = live.filter((l) => l.stage === "试验" && l.crit && l.crit.dueIn <= 0);
    const reviews = live.reduce((a, l) => a + l.decisions.filter((d) => !d.outcome && d.review <= TODAY).length, 0);
    const hlBar = S.hl ? `<span class="hl-note">${mark(S.hl)}只看 <b>${esc(who(S.hl).full)}</b> 的步骤 <button class="btn sm ghost" data-clear-hl>全部显示</button></span>` : "";
    $("#strip").innerHTML = `
      <span class="sample">示例数据</span>
      <span>${D.week} · 周五</span>
      <span>${live.length} 条业务 · <b>${running}</b> 条在跑</span>
      ${stops.length ? `<span class="alert-stop">阻塞 ${stops.map((l) => l.id).join("、")}</span>` : ""}
      ${due.length ? `<span class="alert-due">判据今天到期 ${due.map((l) => l.id).join("、")}</span>` : ""}
      ${reviews ? `<span class="alert-due">决策待回看 ${reviews}</span>` : ""}
      ${hlBar}
      <span class="legend" aria-label="灯语">
        <span><i style="background:var(--go)"></i>在跑</span>
        <span><i style="background:var(--call)"></i>等我</span>
        <span><i style="background:var(--stop)"></i>阻塞</span>
        <span><i style="background:var(--hold)"></i>等外部</span>
        <span><i style="background:var(--done)"></i>完成</span>
      </span>`;
  }

  /* ---------- stations ---------- */
  function stationHTML(l, s, j, d, big) {
    const ss = stepState(l, s);
    const w = who(s.x);
    const fl = S.flash && S.flash.line === l.id && S.flash.j === j ? " flash" : "";
    const sel = big && S.sel === j ? " sel" : "";
    const hl = S.hl && s.x === S.hl ? " hl" : "";
    const tip = `${s.n} · ${w.full} · ${SL[ss]}${s.m ? " · " + s.m : ""}${s.share ? ` · 与 ${s.share} 共用` : ""}`;
    return `<li class="st${fl}${sel}${hl}" data-s="${ss}" data-x="${s.x}" data-j="${j}" style="--d:${d}" title="${esc(tip)}"${big ? ` tabindex="0" role="button" aria-label="${esc(tip)}"` : ""}>
      <div class="st-lamp-row"><i class="lamp"></i><span class="st-badges">${s.share ? `<span class="st-share" title="与 ${s.share} 共用这道步骤，跑一次供两条业务">${icon("share")}${s.share}</span>` : ""}${s.reuse ? `<span class="st-share">${icon("share")}复用</span>` : ""}${s.y ? '<span class="st-money" title="收钱步骤">¥</span>' : ""}</span></div>
      <div class="st-body">
        <span class="st-name">${esc(s.n)}</span>
        <span class="st-exec" data-who="${s.x}">${mark(s.x)}${w.kind === "me" ? "" : `<span>${w.short}</span>`}</span>
        ${big ? `<div class="st-metric">${esc(s.m || "—")}</div>` : ""}
      </div>
      <div class="belt">${LIVE.includes(ss) ? '<i class="workpiece"></i>' : ""}</div>
      ${big ? `<div class="st-k">${s.k}</div>` : ""}
    </li>`;
  }

  function metaHTML(l) {
    let m;
    if (l.stage === "试验") m = `<span class="trial">试验 · ${l.left > 0 ? `剩 ${l.left} 天` : '<span class="due0">今天到期</span>'}</span>`;
    else if (l.stage === "归档") m = "已归档";
    else m = "业务";
    return `${l.tag ? `<span class="tag">${esc(l.tag)}</span>` : ""}${m} · <span title="我亲自做的步骤 / 全部步骤">我 ${meCount(l)}/${l.steps.length}</span> · <span title="流程版本">v${l.ver}</span>`;
  }
  function nowHTML(l) {
    const st = status(l);
    if (st === "off") return `<span class="tag-s t-off">已归档</span>结账已记入失败库`;
    const ai = activeIdx(l);
    if (ai < 0) return `<span class="tag-s t-idle">待开始</span>本轮已完成`;
    const s = l.steps[ai], ss = stepState(l, s);
    return `<span class="tag-s t-${ss}">${SL[ss]}</span>${esc(s.n)} · ${who(s.x).short} · ${ai + 1}/${l.steps.length}`;
  }
  function feedHTML(l) {
    if (!l.feeds) return "";
    return l.feeds.map((f) => { const t = line(f.to); return `<span class="feed" title="${esc(f.what)}">${icon("feed")}支撑 ${f.to}${t ? " " + esc(t.name) : ""}</span>`; }).join("");
  }

  function meterHTML(l) {
    if (l.stage === "归档") return `<div class="money-row"><span class="no-money">已停产</span></div>`;
    const hasMoney = l.steps.some((s) => s.y);
    const subs = `<div class="sub-row"><span>成本 <b>¥${fmt(l.cost)}</b></span><span>净 <b>${yuan(l.rev - l.cost)}</b></span><span class="mine${l.min >= 60 ? " heavy" : ""}">占用我 <b>${l.min}</b> 分</span></div>`;
    if (!hasMoney && l.feeds) {
      const f = l.feeds[0];
      return `<div class="money-row"><span class="feed-big">${icon("feed")}支撑型业务 → ${f.to}</span></div><div class="feed-what">${esc(f.what)}</div>${subs}`;
    }
    if (!hasMoney && l.crit) {
      const c = l.crit;
      return `<div class="money-row"><span class="no-money">试验 · 看判据 <b>${c.cur}${c.target != null ? ` / ${c.target}` : ""}${c.unit}</b></span></div>${subs}`;
    }
    const prev = l.trend[6], cur = l.rev;
    let tr = "";
    if (prev > 0) {
      const p = Math.round(((cur - prev) / prev) * 100);
      const dir = p > 2 ? "up" : p < -2 ? "down" : "flat";
      tr = `<span class="trend ${dir}">${icon(dir)}${Math.abs(p)}%</span>`;
    } else if (cur > 0) tr = `<span class="trend up">${icon("up")}新</span>`;
    const money = !hasMoney && cur === 0
      ? `<div class="money-row"><span class="no-money">没有收钱步骤</span></div>`
      : `<div class="money-row">${tr}<span class="cur">¥</span>${segHTML(cur, 5, "md" + (cur === 0 ? " dim" : ""))}</div>`;
    return money + subs;
  }

  function alignHTML(l) {
    const hasMoney = l.steps.some((s) => s.y);
    return `<div class="align-row">${KS.map((k) => {
      const ss = l.steps.filter((s) => s.k === k);
      const gap = k === "转化" && !hasMoney;
      const gapTxt = l.feeds ? `支撑 → ${l.feeds[0].to}` : l.crit ? "试验中 · 看判据" : "没有收钱步骤";
      if (!ss.length) return `<div class="cell empty${gap && !l.feeds ? " warn" : ""}">${gap ? gapTxt : "空"}</div>`;
      return `<div class="cell">${ss.map((s) => `<div class="chip" data-s="${stepState(l, s)}"><i class="lamp"></i>${mark(s.x)}<span>${esc(s.n)}</span>${s.y ? '<span class="st-money">¥</span>' : ""}</div>`).join("")}${gap ? `<div class="chip chip-note">${gapTxt}</div>` : ""}</div>`;
    }).join("")}</div>`;
  }

  function laneHTML(l, i) {
    const st = status(l);
    const inner = S.view === "align" ? alignHTML(l) : `<ol class="stations">${l.steps.map((s, j) => stationHTML(l, s, j, i * 90 + j * 70, false)).join("")}</ol>`;
    return `<article class="lane" data-s="${st}" data-stage="${l.stage}" data-id="${l.id}" tabindex="0" aria-label="${esc(l.name)}，${SL[st]}，打开详情">
      <div class="stack" aria-hidden="true"><div class="stack-body"><i class="r" style="--d:${i * 90}"></i><i class="y" style="--d:${i * 90 + 60}"></i><i class="g" style="--d:${i * 90 + 120}"></i></div><div class="stack-pole"></div><div class="stack-foot"></div></div>
      <div class="lane-id">
        <span class="plate">${l.id}</span>
        <div>
          <h3 class="lane-name">${esc(l.name)}</h3>
          <p class="lane-meta">${metaHTML(l)}</p>
          <p class="lane-now">${nowHTML(l)}</p>
          ${l.feeds && l.steps.some((s) => s.y) ? `<p class="lane-feed">${feedHTML(l)}</p>` : ""}
        </div>
      </div>
      <div class="lane-line">${inner}</div>
      <div class="lane-meter">${meterHTML(l)}</div>
    </article>`;
  }

  function zoneHead(v) {
    const ls = liveLines().filter((l) => l.v === v.id);
    const rev = sum(ls, (l) => l.rev), cost = sum(ls, (l) => l.cost), min = sum(ls, (l) => l.min);
    return `<div class="zone-h"><h2>${esc(v.name)}</h2><span class="zone-note">${esc(v.note)}</span>
      <span class="zone-sum">${ls.length} 条 · 本周${v.id === "invest" ? "收益" : "收入"} <b>${yuan(rev)}</b> · 净 <b>${yuan(rev - cost)}</b> · 占用我 <b>${min}</b> 分钟</span></div>`;
  }

  /* ---------- crew view ---------- */
  function crewRows() {
    const live = liveLines();
    const all = live.flatMap((l) => l.steps.map((s, j) => ({ l, s, j })));
    const myMin = sum(live, (l) => l.min);
    const mine = all.filter((x) => x.s.x === "me");
    const worst = [...mine].sort((a, b) => b.l.min - a.l.min)[0];
    const chips = (xs) => xs.length
      ? xs.map(({ l, s }) => `<button class="chip-st" data-s="${stepState(l, s)}" data-line="${l.id}" title="${esc(`${l.name} · ${s.n} · ${SL[stepState(l, s)]}`)}"><i class="lamp"></i><b>${l.id}</b>${esc(s.n)}</button>`).join("")
      : `<span class="crew-empty">不负责任何步骤</span>`;
    const row = (x, name, role, duty, now, stats, list, st) => `
      <article class="lane crew-row" data-who="${x}" data-s="${st}" tabindex="0" aria-label="只看 ${esc(name)} 的步骤">
        <div class="crew-mk">${mark(x, "lg")}</div>
        <div class="lane-id"><div>
          <h3 class="lane-name">${esc(name)} <span class="role">${esc(role)}</span></h3>
          <p class="lane-meta">${esc(duty)}</p>
          <p class="lane-now">${now}</p>
        </div></div>
        <div class="lane-line"><div class="crew-chips">${list}</div></div>
        <div class="lane-meter crew-stats">${stats}</div>
      </article>`;

    const meNow = S.calls.length ? `<span class="tag-s t-call">待处理</span>收件箱 ${S.calls.length} 件待处理` : `<span class="tag-s t-run">空闲</span>收件箱已清空`;
    let html = `<div class="insight">我一个人负责 <b>${mine.length}</b> 个步骤、本周 <b>${myMin}</b> 分钟，是所有执行者里最忙的。${worst ? `最该先交出去的是 <b class="warn">${worst.l.id}「${esc(worst.s.n)}」</b>（这条业务每周花你 ${worst.l.min} 分钟）。` : ""}点任意一行，在流程视图里只看它负责的步骤。</div>`;
    html += row("me", "我", "", "判断、审核、亲自做还没交给 Agent 的步骤", meNow,
      `<div class="crew-l1">步骤 <b>${mine.length}</b> 个 · 本周 <b class="warn">${myMin}</b> 分钟</div><div class="crew-l2">判断命中 ${Number.isInteger(S.hits.ok) ? S.hits.ok : S.hits.ok.toFixed(1)} / ${S.hits.total}</div>`,
      chips(mine), S.calls.length ? "call" : "idle");

    S.agents.forEach((a) => {
      const xs = all.filter((x) => x.s.x === a.id);
      const running = xs.find((x) => stepState(x.l, x.s) === "run");
      const stopped = xs.find((x) => stepState(x.l, x.s) === "stop");
      let now = `<span class="tag-s t-idle">空闲</span>`;
      let st = "idle";
      if (a.id === "flowsmith") {
        const busy = S.ideas.filter((i) => i.stage < 4);
        now = busy.length ? `<span class="tag-s t-run">设计中</span>${busy.map((i) => esc(i.name)).join("、")}` : S.ideas.length ? `<span class="tag-s t-call">等批准</span>${S.ideas.length} 张方案` : now;
        st = busy.length ? "run" : S.ideas.length ? "call" : "idle";
      } else if (a.id === "steward") {
        now = `<span class="tag-s t-run">巡检</span>本周自行处理 ${a.solved} 件，上报 ${S.calls.filter((c) => c.from === "steward").length} 件`;
        st = "run";
      } else if (stopped) { now = `<span class="tag-s t-stop">阻塞</span>${stopped.l.id} ${esc(stopped.s.n)}`; st = "stop"; }
      else if (running) { now = `<span class="tag-s t-run">在跑</span>${running.l.id} ${esc(running.s.n)}`; st = "run"; }
      const stats = `<div class="crew-l1">运行 <b>${a.runs}</b> · 通过 <b class="${a.pass < 85 ? "warn" : ""}">${a.pass}%</b> · 返工 <b>${a.rework}</b></div>
        <div class="crew-l2">成本 ¥${fmt(a.cost)} · 找我 ${a.asks} 次 · <span class="trust">自治 L${a.trust}</span></div>
        <div class="crew-l3">${esc(a.trustNote)}</div>`;
      const list = a.id === "flowsmith"
        ? (S.ideas.length ? S.ideas.map((i) => `<button class="chip-st" data-s="${i.stage < 4 ? "run" : "call"}" data-idea="${i.id}"><i class="lamp"></i><b>${i.id}</b>${esc(i.name)} · ${STAGES[i.stage]}</button>`).join("") : `<span class="crew-empty">想法孵化空着</span>`)
        : a.id === "steward" ? `<span class="crew-empty">不负责具体步骤 · 巡检 ${live.length} 条业务</span>` : chips(xs);
      html += row(a.id, a.name, a.role, a.duty, now, stats, list, st);
    });

    const tools = all.filter((x) => x.s.x === "tool");
    html += row("tool", "脚本", "脚本 · 定时任务", "确定性的活不用 Agent：排版、发布、推送、抓取", `<span class="tag-s t-idle">待命</span>${tools.filter((x) => stepState(x.l, x.s) === "run").length} 个在跑`,
      `<div class="crew-l1">步骤 <b>${tools.length}</b> 个</div><div class="crew-l2">不设自治级别 · 失败由 Steward 先接</div>`, chips(tools), "idle");
    return html;
  }

  /* ---------- floor ---------- */
  function insightHTML() {
    const live = liveLines();
    const all = live.flatMap((l) => l.steps);
    const byK = KS.map((k) => all.filter((s) => s.k === k).length);
    const top = byK.indexOf(Math.max(...byK));
    const noMoney = live.filter((l) => !l.steps.some((s) => s.y));
    const feeders = noMoney.filter((l) => l.feeds);
    const orphan = noMoney.filter((l) => !l.feeds && !l.crit);
    const shared = all.filter((s) => s.share).length / 2;
    return `<div class="insight"><b>${byK[top]} / ${all.length}</b> 道步骤挤在「${KS[top]}」；
      ${feeders.length ? `${feeders.map((l) => `${l.id} ${esc(l.name)}`).join("、")} 不直接收钱，是<b>支撑型业务</b>；` : ""}
      ${orphan.length ? `<b class="warn">${orphan.map((l) => esc(l.name)).join("、")} 既不收钱也不支撑</b>；` : ""}
      ${shared ? `<b>${shared}</b> 道步骤跨门类共用。` : ""}</div>`;
  }

  function renderFloor(boot) {
    const floor = $("#floor");
    floor.classList.toggle("crew", S.view === "crew");
    floor.classList.toggle("hling", !!S.hl && S.view === "chain");
    if (S.view === "crew") {
      floor.innerHTML = `<div class="floor-head"><span></span><span>执行者</span><span>负责的步骤 · 跨所有业务</span><span class="r">本周数据 · 自治</span></div>` + crewRows();
      return;
    }
    const head = S.view === "align"
      ? `<div class="floor-head"><span></span><span>业务</span><div class="align-head">${KS.map((k) => `<span>${k}<b>${liveLines().flatMap((l) => l.steps).filter((s) => s.k === k).length}</b></span>`).join("")}</div><span class="r">本周收入</span></div>`
      : `<div class="floor-head"><span></span><span>业务</span><span>流程 · 每格是一个步骤，标记是谁在跑</span><span class="r">本周收入 · 成本 · 占用我的时间</span></div>`;
    let i = 0;
    const body = D.ventures.map((v) => {
      const ls = S.lines.filter((l) => l.v === v.id).sort((a, b) => (a.stage === "归档") - (b.stage === "归档"));
      return zoneHead(v) + ls.map((l) => laneHTML(l, i++)).join("");
    }).join("");
    floor.innerHTML = (S.view === "align" ? insightHTML() : "") + head + body;
    if (boot && !reduce) {
      floor.classList.add("boot");
      clearTimeout(renderFloor.t);
      renderFloor.t = setTimeout(() => floor.classList.remove("boot"), 2600);
    }
    if (matchMedia("(max-width: 860px)").matches) {
      $$(".lane-line", floor).forEach((ln) => {
        const st = $('.st[data-s="call"], .st[data-s="stop"], .st[data-s="run"], .st[data-s="hold"], .st[data-s="paused"]', ln);
        if (st) ln.scrollLeft = Math.max(0, st.offsetLeft - ln.offsetLeft - 120);
      });
    }
  }

  /* ---------- bench (Flowsmith) ---------- */
  function renderBench() {
    const cards = S.ideas.map((it) => {
      const v = VEN[it.v];
      const rv = it.kind === "revise";
      const act = it.stage < 4 ? ""
        : rv ? `<div class="draft-acts"><button class="btn sm go" data-revise="ok" data-idea="${it.id}">批准改版</button><button class="btn sm" data-revise="back" data-idea="${it.id}">打回</button></div>`
        : `<div class="draft-acts"><button class="btn sm go" data-sheet="${it.id}">看方案 · 批准</button></div>`;
      return `<article class="draft" data-stage="${it.stage}">
        <div class="draft-top"><span class="plate sm">${it.id}</span><span>${rv ? "改流程" : esc(v.name)}</span>${it.rev > 1 ? `<span class="draft-rev">第 ${it.rev} 版</span>` : ""}</div>
        <h3>${esc(it.name)}</h3>
        ${it.hyp ? `<p class="draft-hyp">假设：${esc(it.hyp)}</p>` : ""}
        <ol class="pips">${STAGES.map((n, k) => `<li class="${k < it.stage ? "done" : k === it.stage ? "cur" : ""}"><i></i><span>${n}</span></li>`).join("")}</ol>
        <p class="draft-note">${esc(it.note || "")}</p>
        ${act}
      </article>`;
    });
    for (let k = S.ideas.length; k < BENCH; k++) cards.push(`<button class="draft empty" data-new-idea><svg class="i"><use href="#i-plus"/></svg>空位 · 派一个新想法</button>`);
    $("#bench").innerHTML = `<div class="bench-h">${mark("flowsmith", "lg")}<div><h2>想法孵化</h2><p>Flowsmith 手上的想法和流程改版 · 同时最多 ${BENCH} 张 · 想法要先成方案、经你锁定判据才能上线</p></div></div>
      <div class="bench-row">${cards.join("")}</div>`;
  }

  function genDraft(it) {
    const up = it.v === "product", inv = it.v === "invest";
    const text = it.name + (it.hyp || "");
    const fail = S.lib.find((f) => f.tags.some((t) => text.includes(t))) || S.lib[S.lib.length - 1];
    const steps = inv
      ? [
          { n: "拉数据", x: "tool", k: "发现", m: "复用 F-01 拉行情", reuse: true },
          { n: "估值 / 信号", x: "tally", k: "发现", m: "—" },
          { n: "生成操作建议", x: "tally", k: "生产", m: "—" },
          { n: "确认下单", x: "me", k: "转化", m: "约 2 分钟 / 次" },
          { n: "成交", x: "ext", k: "转化", y: true, m: "—" }
        ]
      : up
      ? [
          { n: "圈目标用户", x: "tally", k: "发现", m: "复用 U-02 分群", reuse: true },
          { n: "写触达文案", x: "quill", k: "生产", m: "3 版 A/B" },
          { n: "过目", x: "me", k: "生产", m: "约 5 分钟 / 批" },
          { n: "触达", x: "herald", k: "分发", m: "站内信 + 推送" },
          { n: "付费转化", x: "ext", k: "转化", y: true, m: "—" }
        ]
      : [
          { n: "找素材", x: "scout", k: "发现", m: "复用 M-02 素材检索", reuse: true },
          { n: "写成品", x: "quill", k: "生产", m: "—" },
          { n: "出图", x: "lens", k: "生产", m: "统一模板" },
          { n: "过目", x: "me", k: "生产", m: "约 5 分钟 / 件" },
          { n: "发布", x: "tool", k: "分发", m: "复用 M-04 发笔记", reuse: true },
          { n: "成交", x: "ext", k: "转化", y: true, m: "—" }
        ];
    return {
      research: [
        `检索同类样本 ${23 + (it.name.length % 9)} 个，拆解了头部 5 个`,
        inv ? "回测近 5 年数据，最大回撤 18%" : up ? "uplook 每周新增 3,180 人，可以直接当启动盘" : "公众号和社群的存量读者可以直接当启动盘",
        it.hyp ? `你的假设「${it.hyp}」：没找到反证，但只有真实付费能验证` : "你没写假设，Flowsmith 按「有人愿意付钱」来设计判据"
      ],
      feas: "中",
      risks: ["前 7 天样本小，判据期限不要短于 14 天"],
      fail,
      reuse: steps.filter((s) => s.reuse).map((s) => s.m.replace("复用 ", "")),
      steps, myMin: 30, cost: 200,
      crit: inv ? "90 天内，收益跑赢沪深 300 且回撤 ≤ 8%" : up ? "21 天内，带来付费订阅 ≥ 50 个" : "21 天内，付费 ≥ 30 份", days: inv ? 90 : 21, budget: 300
    };
  }

  const STAGE_NOTE = [
    () => "刚派出，正在理解想法",
    () => "检索同类样本、定价和渠道",
    (it) => { const d = it.draft || genDraft(it); return d.fail ? `失败库命中：${d.fail.name}（${d.fail.cause}）` : "失败库没有相似记录"; },
    () => `比对 ${liveLines().length} 条业务的已有步骤，优先复用`,
    () => "方案已交到收件箱，等你锁定判据"
  ];

  function work(it, step = 1200) {
    clearTimeout(it._t);
    if (it.stage >= 4) return;
    it._t = setTimeout(() => {
      it.stage += 1;
      it.note = STAGE_NOTE[it.stage](it);
      if (it.stage === 4) {
        if (it.kind === "revise") {
          S.calls.unshift({ id: "r" + it.id, from: "flowsmith", idea: it.id, t: "决策", title: `流程改版方案：${it.line} v${line(it.line).ver + 1}`, ctx: "把「改稿定稿」前移成 Quill 先自查一轮，预计每周少花你 30 分钟。", mins: 3, acts: [{ l: "批准改版", fx: "revise-ok", k: "go" }, { l: "打回", fx: "revise-back" }] });
          toast(`Flowsmith 交来流程改版方案：${it.line}`);
        } else {
          it.draft = it.draft || genDraft(it);
          S.calls.unshift({ id: "d" + it.id + it.rev, from: "flowsmith", idea: it.id, t: "决策", title: `流程方案待批准：${it.name}`, ctx: `调研完成${it.draft.fail ? "，失败库命中 1 条相似记录" : ""}。${it.draft.steps.length} 个步骤，其中 ${it.draft.reuse.length} 个复用；预计每周花你 ${it.draft.myMin} 分钟。`, mins: 6, acts: [{ l: "看方案", fx: "draft", k: "go" }] });
          toast(`Flowsmith 流程方案待批准：${it.name}`);
        }
        renderGantry();
        if ($("#desk").classList.contains("on")) renderDesk();
      }
      renderBench();
      if (S.view === "crew") renderFloor();
      work(it, step);
    }, reduce ? 50 : step);
  }

  /* ---------- sheet (blueprint) ---------- */
  function renderSheet() {
    const sh = $("#sheet");
    const it = S.sheet && ideaOf(S.sheet);
    if (!it || !it.draft) { sh.classList.remove("on"); return; }
    const d = it.draft, v = VEN[it.v];
    const fake = { id: it.id, stage: "草案", steps: d.steps.map((s) => ({ ...s, s: "idle" })) };
    const full = liveLines().length >= CAP;
    sh.innerHTML = `<div class="bay-inner">
      <div class="bay-head">
        <button class="btn ghost back-btn" data-sh="close">${icon("back")}返回总览</button>
        ${mark("flowsmith", "xl")}
        <div>
          <h2 class="bay-title">${esc(it.name)}</h2>
          <div class="bay-meta">Flowsmith 提交的方案 · ${esc(v.name)} · 第 ${it.rev || 1} 版 · ${it.id}</div>
        </div>
      </div>
      <div class="bay-line blueprint"><ol class="stations">${fake.steps.map((s, j) => stationHTML(fake, s, j, 0, true)).join("")}</ol></div>
      <div class="bay-grid">
        <div>
          <div class="panel"><h3 class="panel-h">调研结论 <small>可行性 <b class="feas">${d.feas}</b></small></h3>
            <ul class="facts">${d.research.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
            <h4 class="sub-h">风险</h4><ul class="facts warn">${d.risks.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
          </div>
        </div>
        <div>
          ${d.fail ? `<div class="panel"><h3 class="panel-h">失败库命中 <small>开题前必查</small></h3>
            <div class="postmortem"><div class="postmortem-h">${esc(d.fail.name)} · ${d.fail.date} 砍</div>
            <p class="pm-line">死因：${esc(d.fail.cause)}</p><p class="pm-line">早发现信号：${esc(d.fail.signal)}</p>
            <p class="pm-line dim">Flowsmith 已把这条信号写进建议判据的节奏里。</p></div></div>` : ""}
          <div class="panel"><h3 class="panel-h">估算 <small>复用 ${d.reuse.length} 个</small></h3>
            <dl class="kv" style="margin-top:0">
              <div><dt>步骤</dt><dd>${d.steps.length}<small>个 · 我 ${d.steps.filter((s) => s.x === "me").length} 个</small></dd></div>
              <div><dt>每周占用我</dt><dd class="warn">${d.myMin}<small>分钟</small></dd></div>
              <div><dt>每周成本</dt><dd>¥${fmt(d.cost)}</dd></div>
              <div><dt>用到的 Agent</dt><dd class="crew-mks">${[...new Set(d.steps.map((s) => s.x))].map((x) => mark(x)).join("")}</dd></div>
            </dl>
            ${d.reuse.length ? `<p class="time-note">复用：${d.reuse.map(esc).join("；")}</p>` : ""}
          </div>
        </div>
        <div class="col-3">
          <form class="panel lockform" id="lock-form" autocomplete="off">
            <h3 class="panel-h">锁定判据 · 上线 <small>只有你能锁</small></h3>
            <label class="field"><span>判据（锁定后不可改）</span><input name="crit" placeholder="${esc(d.crit)}" /></label>
            <button type="button" class="btn sm ghost" data-sh="adopt">采用 Flowsmith 的建议：${esc(d.crit)}</button>
            <div class="two">
              <label class="field"><span>试验期（天）</span><input name="days" type="number" min="7" max="60" value="${d.days}" /></label>
              <label class="field"><span>预算上限（¥）</span><input name="budget" type="number" min="0" value="${d.budget}" /></label>
            </div>
            <p class="form-hint${full ? " err" : ""}" id="lock-hint">${full ? `已满 ${CAP} 条业务，先砍一条才能上线。` : "写不出判据，就不上线。"}</p>
            <div class="lock-acts">
              <button class="btn solid" type="submit" id="lock-submit" disabled>${icon("lock")}锁定判据并上线</button>
            </div>
            <div class="redo">
              <label class="field"><span>或者打回：哪里不对</span><input name="why" placeholder="例：别用小红书账号，开新号" /></label>
              <div class="lock-acts"><button type="button" class="btn sm" data-sh="redo">${icon("rewind")}打回重新设计</button><button type="button" class="btn sm warn" data-sh="drop">放弃这个想法</button></div>
            </div>
          </form>
        </div>
      </div>
    </div>`;
    sh.classList.add("on");
    checkLock();
  }
  function checkLock() {
    const f = $("#lock-form");
    if (!f) return;
    $("#lock-submit").disabled = !f.crit.value.trim() || liveLines().length >= CAP;
  }
  function openSheet(id) { closeBay(true); S.sheet = id; renderSheet(); $("#sheet").scrollTop = 0; setTimeout(() => $('#sheet [data-sh="close"]')?.focus(), 60); }
  function closeSheet() { S.sheet = null; $("#sheet").classList.remove("on"); }

  function sheetAction(a) {
    const it = ideaOf(S.sheet);
    if (!it) return;
    const f = $("#lock-form");
    if (a === "close") return closeSheet();
    if (a === "adopt") { f.crit.value = it.draft.crit; checkLock(); f.crit.focus(); return; }
    if (a === "drop") {
      S.ideas = S.ideas.filter((x) => x !== it);
      S.calls = S.calls.filter((c) => c.idea !== it.id);
      closeSheet(); toast("已放弃。没上线的想法不进失败库，Flowsmith 腾出一个空位。"); refresh(); return;
    }
    if (a === "redo") {
      const why = f.why.value.trim();
      if (!why) { $("#lock-hint").textContent = "打回要写原因，Flowsmith 才知道往哪改。"; $("#lock-hint").classList.add("err"); f.why.focus(); return; }
      it.rev = (it.rev || 1) + 1; it.stage = 3; it.note = `按你的意见重新设计：${why}`; it.draft = null;
      S.calls = S.calls.filter((c) => c.idea !== it.id);
      closeSheet(); toast(`已打回，Flowsmith 设计中第 ${it.rev} 版。`); refresh(); work(it, 1800); return;
    }
  }

  function approve(f) {
    const it = ideaOf(S.sheet);
    const crit = f.crit.value.trim();
    if (!crit || liveLines().length >= CAP) return;
    const days = Math.max(7, +f.days.value || 21);
    const pre = VEN[it.v].prefix;
    const n = S.lines.filter((l) => l.v === it.v).length + 1;
    const id = `${pre}-${pad(n)}`;
    S.lines.push({
      id, v: it.v, name: it.name, stage: "试验", ver: 1, left: days,
      rev: 0, cost: 0, min: 0, trend: [0, 0, 0, 0, 0, 0, 0, 0], costs: [0, 0, 0, 0, 0, 0, 0, 0],
      crit: { text: crit, cur: 0, target: null, unit: "", locked: TODAY, due: addDays(TODAY, days), dueIn: days },
      steps: it.draft.steps.map((s, k) => ({ ...s, s: k === 0 ? "run" : "idle" })),
      decisions: [{ date: TODAY, call: "继续", reason: `开题。${it.hyp || ""}`, pred: crit, review: addDays(TODAY, days), outcome: null }]
    });
    S.ideas = S.ideas.filter((x) => x !== it);
    S.calls = S.calls.filter((c) => c.idea !== it.id);
    S.flash = { line: id, j: 0 }; setTimeout(() => (S.flash = null), 1200);
    closeSheet();
    if (S.view === "crew") S.view = "chain";
    refresh();
    toast(`${id} 上线：试验 ${days} 天，判据已锁定，预算 ¥${fmt(+f.budget.value || 0)}。`);
    setTimeout(() => $(`.lane[data-id="${id}"]`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }), 80);
  }

  function reviseDone(it, ok) {
    const l = line(it.line);
    S.ideas = S.ideas.filter((x) => x !== it);
    S.calls = S.calls.filter((c) => c.idea !== it.id);
    if (ok && l) { l.ver += 1; toast(`${l.id} 方案升到 v${l.ver}，下次运行起生效。`); }
    else toast("改版已打回，流程保持原样。");
    refresh();
  }

  /* ---------- bay ---------- */
  function logsFor(l, s, j) {
    const ss = stepState(l, s);
    const w = who(s.x);
    if (ss === "idle") return `<li><time>—</time>尚未开始，等上游「${esc(l.steps[j - 1]?.n || "触发器")}」交付产物</li>`;
    const r = rng(l.id + j);
    const t = 15 * 60 + 10 - Math.floor(r() * 50) - (ss === "done" ? 60 + j * 12 : 0);
    const T = (d) => { const m = t - d; return `${pad(Math.floor(m / 60))}:${pad(((m % 60) + 60) % 60)}`; };
    const rows = [[T(42), `进入「${esc(s.n)}」· 来自「${esc(l.steps[j - 1]?.n || "定时触发")}」`], [T(30), `${esc(w.full)} 接手`]];
    if (ss === "done") rows.push([T(9), `完成 · ${esc(s.m)}`], [T(8), `交给「${esc(l.steps[j + 1]?.n || "线尾")}」`]);
    if (ss === "run") rows.push([T(4), `进度 · ${esc(s.m)}`]);
    if (ss === "paused") rows.push([T(4), `被我暂停 · ${esc(s.m)}`]);
    if (ss === "call") rows.push([T(18), `${s.x === "me" ? "轮到我，已进收件箱" : "请求我处理"} · ${esc(s.m)}`]);
    if (ss === "stop") rows.push([T(12), `<span class="err">报错阻塞 · ${esc(s.m)}</span>`], [T(11), "Steward 接手：重试 2 次失败，已上报"]);
    if (ss === "hold") rows.push([T(20), `挂起，等外部回应 · ${esc(s.m)}`]);
    return rows.map(([a, b]) => `<li><time>${a}</time>${b}</li>`).join("");
  }

  function runsFor(l) {
    const r = rng(l.id + "runs");
    const days = ["10-30", "10-29", "10-28", "10-27", "10-26", "10-25"];
    const st = status(l), ai = activeIdx(l);
    const runs = days.map((date, i) => {
      const live = i === 0 && ai >= 0 && st !== "off";
      const fail = !live && r() < 0.2;
      const failAt = fail ? Math.floor(r() * l.steps.length) : -1;
      const durs = l.steps.map((s) => (s.x === "me" ? 20 + r() * 150 : s.x === "ext" ? 30 + r() * 260 : 2 + r() * 24));
      const cut = live ? ai : failAt;
      const ds = durs.map((d, k) => (cut >= 0 && k > cut ? 0 : cut >= 0 && k === cut ? d * 0.6 : d));
      return { date, time: `${pad(7 + Math.floor(r() * 10))}:${pad(Math.floor(r() * 60))}`, live, fail, failAt, ds, total: ds.reduce((a, b) => a + b, 0) };
    });
    const max = Math.max(...runs.map((x) => x.total));
    const xs = l.steps.map((s) => s.x);
    return `<ul class="runs">${runs.map((x, i) => `
      <li class="run">
        <time>#${pad(318 - i)} ${x.date}</time>
        <span class="res ${x.live ? "live" : x.fail ? "fail" : "ok"}"><i class="lamp"></i>${x.live ? "进行中" : x.fail ? "失败" : "完成"}</span>
        <span class="rbar" title="每段是一个步骤的耗时">${x.ds.map((d, k) => (d > 0 ? `<i class="${x.fail && k === x.failAt ? "fail" : xs[k] === "me" ? "me" : xs[k] === "ext" ? "ext" : ""}" style="width:${(d / max) * 100}%" title="${esc(l.steps[k].n)} · ${esc(who(xs[k]).short)} · ${dur(d)}"></i>` : "")).join("")}</span>
        <span class="dur">${dur(x.total)}</span>
      </li>`).join("")}</ul>
      <div class="rbar-legend"><span><i style="background:var(--steel-2)"></i>Agent / 脚本</span><span><i style="background:rgba(255,194,26,.75)"></i>我（含等我的时间）</span><span><i style="background:rgba(169,195,214,.4)"></i>等外部</span></div>`;
  }

  function critHTML(l) {
    const c = l.crit;
    if (!c) {
      const a = l.trend.slice(4).reduce((x, y) => x + y, 0) / 4, b = l.trend.slice(0, 4).reduce((x, y) => x + y, 0) / 4;
      const p = b > 0 ? Math.round(((a - b) / b) * 100) : null;
      const feed = l.feeds ? `<p class="no-crit" style="margin-top:8px">${icon("feed")} 这是支撑型业务：${esc(l.feeds[0].what)}。它的价值算在 ${l.feeds[0].to} 身上。</p>` : "";
      return `<div class="panel"><h3 class="panel-h">判据 <small>业务不设判据，改看衰退</small></h3>
        <p class="no-crit">${p === null ? "不直接产生收入。" : `近 4 周均值 ¥${fmt(a)}，前 4 周 ¥${fmt(b)}，<b style="color:${p < 0 ? "var(--stop)" : "var(--go)"}">${p > 0 ? "+" : ""}${p}%</b>。${p < -10 ? "4 周滑动均值在下降，已触发衰退预警。" : "没有衰退迹象。"}`}</p>${feed}</div>`;
    }
    let prog;
    if (c.target == null) prog = `<p class="no-crit">进度由 Tally 从明天起每日记账。</p>`;
    else if (c.target <= 5) prog = `<div class="crit-cells">${Array.from({ length: c.target }, (_, k) => `<i class="${k < c.cur ? "on" : ""}"></i>`).join("")}</div>`;
    else prog = `<div class="crit-bar${c.dueIn <= 0 && c.cur < c.target ? " bad" : ""}"><i style="width:${Math.min(100, (c.cur / c.target) * 100)}%"></i></div>`;
    const met = c.target != null && c.cur >= c.target;
    let verdict = "";
    if (l.stage === "试验" && c.dueIn <= 0 && !met) verdict = `<div class="crit-verdict"><span>到期未达成。按规则：砍，并结账。不延期，不改判据。</span><button class="btn sm warn" data-bay="kill">去结账</button></div>`;
    if (l.stage === "试验" && met) verdict = `<div class="crit-verdict" style="background:rgba(58,209,111,.1);color:#9df0b9"><span>判据已达成，可以转正。</span><button class="btn sm go" data-bay="promote">转为业务</button></div>`;
    return `<div class="panel"><h3 class="panel-h">判据 <small>我锁定</small></h3>
      <div class="crit">
        <div class="crit-lock">${icon("lock")}锁定于 ${c.locked} · 不可修改</div>
        <p class="crit-text">${esc(c.text)}</p>
        ${prog}
        <div class="crit-num"><span>${c.target != null ? `<b>${c.cur}</b> / ${c.target} ${c.unit}` : "—"}</span><span>到期 ${c.due} · ${c.dueIn > 0 ? `还剩 ${c.dueIn} 天` : "今天"}</span></div>
        ${verdict}
      </div></div>`;
  }

  function decisionsHTML(l) {
    const v = (d) => {
      if (d.outcome === "ok") return '<span class="verdict ok">预测对了</span>';
      if (d.outcome === "part") return '<span class="verdict part">部分对</span>';
      if (d.outcome === "bad") return '<span class="verdict bad">预测错了</span>';
      if (d.outcome === "closed") return '<span class="verdict bad">已结账</span>';
      if (d.review <= TODAY) return `<span class="verdict part">待回看</span>`;
      return `<span class="verdict pend">${d.review} 回看</span>`;
    };
    const list = l.decisions.length
      ? `<ul class="decisions">${[...l.decisions].reverse().map((d) => `
        <li class="dec">
          <div class="dec-top"><span class="dec-call ${d.call}">${d.call}</span><span>${d.date}</span>${v(d)}</div>
          <p>${esc(d.reason)}</p>
          ${d.pred ? `<p class="pred">${esc(d.pred)}</p>` : ""}
          ${d.post ? `<p style="color:#ffb3a8">死因 · ${esc(d.post.cause)}；早发现信号 · ${esc(d.post.signal)}</p>` : ""}
          ${!d.outcome && d.review <= TODAY ? `<div style="display:flex;gap:6px;margin-top:8px"><button class="btn sm" data-bay="rv-ok">对了</button><button class="btn sm" data-bay="rv-part">部分对</button><button class="btn sm" data-bay="rv-bad">错了</button></div>` : ""}
        </li>`).join("")}</ul>`
      : `<p class="no-crit">还没有决策记录。全自动跑的线，你也该定期判断一次它值不值得留。</p>`;
    if (l.stage === "归档") return `<div class="panel"><h3 class="panel-h">决策日志</h3>${list}</div>`;
    const pre = S.form && S.form.line === l.id ? S.form.call : "继续";
    const opts = ["继续", "加码", "降级", "砍"].map((c) => `<label><input type="radio" name="call" value="${c}"${c === pre ? " checked" : ""}/><span>${c}</span></label>`).join("");
    return `<div class="panel" id="dec-panel"><h3 class="panel-h">决策日志 <small>只有我写 · 每次都要写预测</small></h3>
      ${list}
      <form class="form" id="dec-form" autocomplete="off">
        <div class="calls-pick" role="radiogroup" aria-label="决策">${opts}</div>
        <label class="field"><span>理由</span><textarea name="reason" placeholder="你看到了什么，才做这个判断"></textarea></label>
        <div class="two">
          <label class="field"><span>预测（必填）</span><input name="pred" placeholder="例：两周内净额 ≥ ¥3,000" /></label>
          <label class="field"><span>回看日期</span><input name="review" value="${addDays(TODAY, 14)}" /></label>
        </div>
        <div class="postmortem" id="pm" ${pre === "砍" ? "" : "hidden"}>
          <div class="postmortem-h">失败结账：Flowsmith 以后开题前会先查到它</div>
          <label class="field"><span>实际结果</span><input name="result" placeholder="例：21 天卖出 17 本，复购为 0" /></label>
          <label class="field"><span>死因</span><select name="cause"><option>需求不存在</option><option>渠道不对</option><option>执行不到位</option><option>成本过高</option><option>时机不对</option></select></label>
          <label class="field"><span>早发现信号：下次怎么提前 10 天看出来</span><input name="signal" placeholder="例：第 7 天销量 < 10 本就该停" /></label>
        </div>
        <p class="form-hint" id="dec-hint">不写预测，这个决策就没法回看。</p>
        <div style="display:flex;justify-content:flex-end"><button class="btn solid" type="submit">记下决策</button></div>
      </form></div>`;
  }

  function moneyHTML(l) {
    const max = Math.max(1, ...l.trend, ...l.costs);
    const wk = ["W37", "W38", "W39", "W40", "W41", "W42", "W43", "W44"];
    const per100 = l.rev > 0 ? (l.min / (l.rev / 100)).toFixed(1) : null;
    return `<div class="panel col-3"><h3 class="panel-h">收入与时间 <small>近 8 周 · 浅色收入 / 红色成本</small></h3>
      <div class="chart" role="img" aria-label="近 8 周收入与成本">${l.trend.map((v, k) => `<div class="col${k === 7 ? " now" : ""}" title="${wk[k]} 收入 ¥${fmt(v)} · 成本 ¥${fmt(l.costs[k])}"><div class="rev" style="height:${(v / max) * 100}%"></div><div class="cost" style="height:${(l.costs[k] / max) * 100}%"></div></div>`).join("")}</div>
      <div class="chart-x">${wk.map((w) => `<span>${w}</span>`).join("")}</div>
      <dl class="kv">
        <div><dt>本周收入</dt><dd>¥${fmt(l.rev)}</dd></div>
        <div><dt>本周成本</dt><dd>¥${fmt(l.cost)}</dd></div>
        <div><dt>净额</dt><dd style="color:${l.rev - l.cost < 0 ? "var(--stop)" : "var(--go)"}">${yuan(l.rev - l.cost)}</dd></div>
        <div><dt>占用我</dt><dd class="${l.min >= 60 ? "warn" : ""}">${l.min}<small>分钟</small></dd></div>
      </dl>
      <p class="time-note">${per100 ? `每 ¥100 收入要花你 <b>${per100}</b> 分钟。${+per100 > 3 ? "偏贵，先把我亲自做的步骤交给 Agent。" : "时间效率不错。"}` : l.feeds ? `不直接收钱，价值看它支撑的 ${l.feeds[0].to}。` : "还没有收入。"}</p>
    </div>`;
  }

  function inspectorHTML(l) {
    const j = S.sel ?? Math.max(0, activeIdx(l));
    const s = l.steps[j], ss = stepState(l, s), w = who(s.x);
    const arch = l.stage === "归档";
    const pick = SUGGEST[s.k] || "quill";
    const agentLine = w.kind === "ag" ? `<p class="ag-line">${mark(s.x)}<b>${esc(w.full)}</b> · 本周运行 ${w.a.runs} · 通过 ${w.a.pass}% · 自治 L${w.a.trust}（${esc(w.a.trustNote)}）</p>` : "";
    return `<div class="panel"><h3 class="panel-h">步骤 ${j + 1} · ${esc(s.n)} <small>点上方的步骤切换</small></h3>
      <dl class="insp-grid">
        <div><dt>谁在干</dt><dd class="who-dd">${mark(s.x)}${w.kind === "me" ? "我亲自做" : esc(w.short)}</dd></div>
        <div><dt>状态</dt><dd class="t-${ss}">${SL[ss]}</dd></div>
        <div><dt>环节</dt><dd>${s.k}${s.y ? " · 收钱" : ""}${s.share ? ` · 与 ${s.share} 共用` : ""}</dd></div>
      </dl>
      ${agentLine}
      <ul class="log">${logsFor(l, s, j)}</ul>
      ${arch ? "" : `<div class="insp-acts">
        ${s.x === "me" ? `<label class="assign"><span class="sr">交给哪个 Agent</span><select id="assign-to">${S.agents.filter((a) => !["flowsmith", "steward"].includes(a.id)).map((a) => `<option value="${a.id}"${a.id === pick ? " selected" : ""}>${a.name} ${a.role} · L${a.trust}</option>`).join("")}</select></label><button class="btn sm go" data-bay="delegate-step" data-j="${j}">交出去</button>` : ""}
        ${w.kind === "ag" ? `<button class="btn sm" data-bay="takeback-step" data-j="${j}">${mark("me")}收回，我亲自做</button>` : ""}
        ${ss === "stop" ? `<button class="btn sm go" data-bay="resume-step" data-j="${j}">${icon("play")}恢复</button>` : ""}
        ${ss === "call" ? `<button class="btn sm solid" data-bay="advance-step" data-j="${j}">${icon("check")}我处理完了</button>` : ""}
        <button class="btn sm" data-bay="rerun-step" data-j="${j}">${icon("rewind")}从这一步重跑</button>
      </div>`}
    </div>`;
  }

  function renderBay() {
    const bay = $("#bay");
    const l = S.open && line(S.open);
    if (!l) { bay.classList.remove("on"); return; }
    const arch = l.stage === "归档";
    const v = VEN[l.v];
    bay.innerHTML = `<div class="bay-inner">
      <div class="bay-head">
        <button class="btn ghost back-btn" data-bay="close">${icon("back")}返回总览</button>
        <span class="plate">${l.id}</span>
        <div>
          <h2 class="bay-title">${esc(l.name)}</h2>
          <div class="bay-meta">${esc(v.name)}${l.tag ? " · " + esc(l.tag) : ""} · ${metaHTML(l)} · ${nowHTML(l)} ${feedHTML(l)}</div>
        </div>
        <div class="bay-ctrl">
          ${arch ? "" : `<button class="btn" data-bay="pause">${icon(l.paused ? "play" : "pause")}${l.paused ? "恢复" : "暂停"}</button>
          <button class="btn" data-bay="restart">${icon("rewind")}从头重跑</button>
          <button class="btn warn" data-bay="kill">${icon("stop")}终止</button>
          <button class="btn" data-bay="revise">${mark("flowsmith")}交 Flowsmith 改流程</button>`}
        </div>
      </div>
      <div class="bay-line"><ol class="stations">${l.steps.map((s, j) => stationHTML(l, s, j, 0, true)).join("")}</ol></div>
      <div class="bay-grid">
        <div>${inspectorHTML(l)}<div class="panel"><h3 class="panel-h">运行记录 <small>最近 6 次 · 每段是一个步骤的耗时</small></h3>${runsFor(l)}</div></div>
        <div>${critHTML(l)}${decisionsHTML(l)}</div>
        ${moneyHTML(l)}
      </div>
    </div>`;
    bay.classList.add("on");
  }

  /* ---------- desk ---------- */
  function renderDesk() {
    const body = $("#desk-body");
    const mins = sum(S.calls, (c) => c.mins);
    const froms = [...new Set(S.calls.map((c) => c.from))];
    $("#desk-sub").innerHTML = S.calls.length ? `${S.calls.length} 件待处理 · 来自 ${froms.map((f) => mark(f)).join("")} · 预计花你 ${mins} 分钟` : "没有待处理";
    if (!S.calls.length) { body.innerHTML = `<div class="desk-empty"><span class="big">收件箱已清空</span>没有任何 Agent 需要你。关掉，去做别的事。</div>`; return; }
    const groups = [["决策", "只有你能定"], ["确认", "过目即可，可批量"], ["知情", "看一眼就行"]];
    body.innerHTML = groups.map(([t, sub]) => {
      const cs = S.calls.filter((c) => c.t === t);
      if (!cs.length) return "";
      const batch = t === "知情" && cs.length > 1 ? `<button class="btn sm ghost" data-batch="read">全部已读</button>`
        : t === "确认" && cs.length > 1 ? `<button class="btn sm ghost" data-batch="confirm">按首选全部处理</button>` : "";
      return `<div class="group-h"><span>${t}<small>${sub} · ${cs.length}</small></span>${batch}</div>
        ${cs.map((c) => {
          const l = c.line && line(c.line), it = c.idea && ideaOf(c.idea);
          const w = who(c.from);
          return `<article class="ticket" data-t="${c.t}" data-id="${c.id}">
            <div class="ticket-top"><span class="from">${mark(c.from)}${esc(w.full)} 提交</span><span class="plate">${c.line || c.idea}</span><span class="mins">${c.mins ? `约 ${c.mins} 分钟` : "不占时间"}</span></div>
            <h4>${esc(c.title)}</h4>
            <p>${l ? `<span class="tk-line">${esc(l.name)}</span> · ` : it ? `<span class="tk-line">想法孵化</span> · ` : ""}${esc(c.ctx)}</p>
            <div class="acts">${c.acts.map((a) => `<button class="btn sm ${a.k || ""}" data-fx="${a.fx}" data-call="${c.id}">${esc(a.l)}</button>`).join("")}</div>
          </article>`;
        }).join("")}`;
    }).join("");
  }
  const openDesk = () => { closeIdea(); renderDesk(); $("#desk").classList.add("on"); $("#scrim").classList.add("on"); setTimeout(() => $("#desk-close").focus(), 50); };
  const closeDesk = () => { $("#desk").classList.remove("on"); if (!$(".idea.on")) $("#scrim").classList.remove("on"); };

  /* ---------- effects ---------- */
  function flash(l, j) { S.flash = { line: l.id, j }; setTimeout(() => (S.flash = null), 1200); }
  function advance(l, from) {
    let j = from ?? l.steps.findIndex((s) => ["call", "stop", "hold"].includes(s.s));
    if (j < 0) j = l.steps.findIndex((s) => s.s === "run");
    if (j < 0) return;
    l.steps[j].s = "done";
    if (j + 1 < l.steps.length) { l.steps[j + 1].s = "run"; flash(l, j + 1); }
    else toast(`${l.name} 本次运行完成`);
  }
  function rewind(l) {
    const j = l.steps.findIndex((s) => s.s === "call");
    if (j < 0) return;
    l.steps[j].s = "idle";
    const p = Math.max(0, j - 1);
    l.steps[p].s = "run"; flash(l, p);
  }
  const dropCalls = (pred) => { S.calls = S.calls.filter((c) => !pred(c)); };
  function delegate(l, j, to) {
    const s = l.steps[j], a = AG[to];
    s.x = to;
    if (s.s === "call") { advance(l, j); dropCalls((c) => c.line === l.id && c.t === "确认" && c.acts.some((x) => x.fx === "advance" || x.fx === "delegate")); }
    toast(`「${s.n}」改由 ${a.name} ${a.role} 做。它的自治是 L${a.trust}（${a.trustNote}）；连续出错会自动交还我。`);
  }

  function review(l, outcome) {
    const d = l.decisions.find((x) => !x.outcome && x.review <= TODAY);
    if (!d) return;
    d.outcome = outcome;
    S.hits.total += 1;
    S.hits.ok += outcome === "ok" ? 1 : outcome === "part" ? 0.5 : 0;
    dropCalls((c) => c.line === l.id && c.acts.some((a) => a.fx.startsWith("rv-")));
    const ok = Number.isInteger(S.hits.ok) ? S.hits.ok : S.hits.ok.toFixed(1);
    toast(`已记入判断命中率：${ok} / ${S.hits.total}`);
  }

  function runCall(fx, callId, quiet) {
    const c = S.calls.find((x) => x.id === callId);
    if (!c) return;
    const act = c.acts.find((a) => a.fx === fx) || {};
    const l = c.line && line(c.line);
    const it = c.idea && ideaOf(c.idea);
    if (fx === "open") { closeDesk(); openBay(l.id); return; }
    if (fx === "kill") { closeDesk(); S.form = { line: l.id, call: "砍" }; openBay(l.id, true); return; }
    if (fx === "draft") { closeDesk(); openSheet(it.id); return; }
    if (fx === "revise-ok" || fx === "revise-back") { reviseDone(it, fx === "revise-ok"); renderDesk(); return; }
    if (fx === "advance") advance(l);
    if (fx === "rewind") { rewind(l); if (!quiet) toast(`已打回：${l.name}`); }
    if (fx === "delegate") { const j = l.steps.findIndex((s) => s.s === "call"); if (j >= 0) delegate(l, j, act.to); }
    if (fx === "resume") { const j = l.steps.findIndex((s) => s.s === "stop"); if (j >= 0) { l.steps[j].s = "run"; flash(l, j); if (!quiet) toast(`${l.name} 恢复运行`); } }
    if (fx.startsWith("rv-")) review(l, fx.slice(3));
    if (c.mins && l) l.min += c.mins;
    const el = $(`.ticket[data-id="${callId}"]`);
    dropCalls((x) => x.id === callId);
    if (el && !reduce) { el.classList.add("gone"); setTimeout(renderDesk, 320); } else renderDesk();
    refresh();
  }

  function bayAction(a, j) {
    const l = line(S.open);
    if (!l) return;
    switch (a) {
      case "close": closeBay(); return;
      case "pause": l.paused = !l.paused; toast(l.paused ? `${l.name} 已暂停` : `${l.name} 恢复运行`); break;
      case "restart":
        l.paused = false; l.steps.forEach((s) => (s.s = "idle")); l.steps[0].s = "run"; flash(l, 0);
        dropCalls((c) => c.line === l.id && c.t !== "知情" && !c.acts.some((x) => x.fx.startsWith("rv-") || x.fx === "kill"));
        toast(`${l.name} 从头开始新一次运行`); break;
      case "kill": S.form = { line: l.id, call: "砍" }; renderBay(); focusForm(); return;
      case "promote": l.stage = "业务"; l.left = undefined; toast(`${l.name} 转为业务，常驻运行`); break;
      case "revise": {
        if (S.ideas.length >= BENCH) { toast(`想法孵化已满 ${BENCH} 张，先批掉或放弃一张。`); return; }
        if (S.ideas.some((i) => i.kind === "revise" && i.line === l.id)) { toast("这条业务已经在改流程了。"); return; }
        const it = { id: `R-${l.id}`, kind: "revise", line: l.id, v: l.v, name: `${l.id} ${l.name} → v${l.ver + 1}`, stage: 0, note: STAGE_NOTE[0]() };
        S.ideas.push(it); renderBench(); work(it, 1400);
        toast(`已交 Flowsmith 改流程。方案出来后会递到收件箱，等你批准才换线。`); return;
      }
      case "rv-ok": case "rv-part": case "rv-bad": review(l, a.slice(3)); break;
      case "delegate-step": delegate(l, j, $("#assign-to").value); break;
      case "takeback-step": { const s = l.steps[j]; const from = who(s.x).full; s.x = "me"; toast(`「${s.n}」从 ${from} 收回，以后由我亲自做。`); break; }
      case "resume-step": l.steps[j].s = "run"; flash(l, j); dropCalls((c) => c.line === l.id && c.acts.some((x) => x.fx === "resume")); toast(`${l.name} 恢复运行`); break;
      case "advance-step": advance(l, j); l.min += 5; dropCalls((c) => c.line === l.id && c.t === "确认" && c.acts.some((x) => x.fx === "advance")); break;
      case "rerun-step": l.steps.forEach((s, k) => { if (k >= j) s.s = "idle"; }); l.steps[j].s = "run"; l.paused = false; flash(l, j); toast(`从「${l.steps[j].n}」重跑`); break;
    }
    refresh();
  }

  function submitDecision(form) {
    const l = line(S.open);
    const fd = new FormData(form);
    const call = fd.get("call"), pred = (fd.get("pred") || "").trim(), reason = (fd.get("reason") || "").trim();
    const hint = $("#dec-hint");
    if (call !== "砍" && !pred) { hint.textContent = "先写预测。不写预测，这个决策就没法回看。"; hint.classList.add("err"); form.pred.focus(); return; }
    if (call === "砍" && !(fd.get("signal") || "").trim()) { hint.textContent = "砍之前必须结账：至少写下早发现信号。"; hint.classList.add("err"); form.signal.focus(); return; }
    const d = { date: TODAY, call, reason: reason || "（未写理由）", pred: call === "砍" ? "" : pred, review: call === "砍" ? "—" : (fd.get("review") || addDays(TODAY, 14)), outcome: call === "砍" ? "closed" : null };
    if (call === "砍") {
      d.post = { result: fd.get("result"), cause: fd.get("cause"), signal: fd.get("signal") };
      d.reason = (reason ? reason + " " : "") + (fd.get("result") ? `结果：${fd.get("result")}` : "");
      l.stage = "归档"; l.paused = false;
      S.lib.push({ name: l.name, date: TODAY, cause: d.post.cause, signal: d.post.signal, tags: [l.name, ...l.steps.map((s) => s.n)] });
      dropCalls((c) => c.line === l.id);
      toast(`${l.name} 已归档并结账，记入失败库（共 ${S.lib.length} 条）。Flowsmith 以后开题前会先查到它。`);
    } else {
      if (call === "降级") {
        const s = [...l.steps].reverse().find((x) => AG[x.x] && x.k === "生产");
        if (s) { const from = who(s.x).full; s.x = "me"; toast(`已降级：「${s.n}」从 ${from} 收回给我。${d.review} 回看。`); }
      } else toast(`已记下「${call}」，${d.review} 回看。`);
    }
    l.decisions.push(d);
    S.form = null;
    refresh();
  }
  function focusForm() {
    const p = $("#dec-panel");
    if (p) { p.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); setTimeout(() => $("#dec-form [name=result]")?.focus(), 400); }
  }

  /* ---------- open/close ---------- */
  function openBay(id, toForm) {
    closeSheet();
    S.open = id; S.sel = null;
    renderBay();
    $("#bay").scrollTop = 0;
    if (toForm) setTimeout(focusForm, 300);
    else setTimeout(() => $('#bay [data-bay="close"]')?.focus(), 60);
  }
  function closeBay(silent) {
    const id = S.open;
    S.open = null; S.form = null;
    $("#bay").classList.remove("on");
    if (!silent && id) setTimeout(() => $(`.lane[data-id="${id}"]`)?.focus(), 60);
  }

  /* ---------- idea form ---------- */
  const idea = $("#idea");
  let ideaSeq = 7;
  $("#idea-v").innerHTML = D.ventures.map((v) => `<option value="${v.id}">${esc(v.name)}</option>`).join("");
  function openIdea() { closeDesk(); idea.classList.add("on"); $("#idea-btn").setAttribute("aria-expanded", "true"); checkIdea(); setTimeout(() => idea.name.focus(), 50); }
  function closeIdea() { idea.classList.remove("on"); $("#idea-btn").setAttribute("aria-expanded", "false"); }
  function checkIdea() {
    const name = idea.name.value.trim();
    const full = S.ideas.length >= BENCH;
    $("#idea-submit").disabled = !name || full;
    const hint = $("#idea-hint");
    hint.classList.toggle("err", full);
    hint.textContent = full ? `Flowsmith 手上已有 ${BENCH} 张方案。先批掉或放弃一张，防止想法比你能判断的还多。` : "判据在批准方案时由你锁定。写不出判据，方案照样不能上线。";
  }
  idea.addEventListener("input", checkIdea);
  idea.addEventListener("submit", (e) => {
    e.preventDefault(); checkIdea();
    if ($("#idea-submit").disabled) return;
    const it = { id: `I-${pad(++ideaSeq)}`, v: idea.v.value, name: idea.name.value.trim(), hyp: idea.hyp.value.trim(), stage: 0, rev: 1, note: STAGE_NOTE[0]() };
    S.ideas.push(it);
    idea.reset(); closeIdea(); $("#scrim").classList.remove("on");
    renderBench(); renderGantry();
    if (S.view === "crew") renderFloor();
    toast(`已派 Flowsmith 去看「${it.name}」。演示里加速了，真实调研要几个小时。`);
    $("#bench").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    work(it);
  });
  $("#idea-btn").addEventListener("click", () => (idea.classList.contains("on") ? closeIdea() : openIdea()));
  $("#idea-cancel").addEventListener("click", () => { closeIdea(); $("#scrim").classList.remove("on"); });

  /* ---------- toast ---------- */
  function toast(msg) {
    $("#toast-text").textContent = msg;
    const t = $("#toast");
    t.classList.add("on");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("on"), 4600);
  }

  /* ---------- wiring ---------- */
  function refresh(boot) {
    renderGantry();
    renderFloor(boot);
    renderBench();
    if (S.open) renderBay();
    if (S.sheet) renderSheet();
    if ($("#desk").classList.contains("on")) renderDesk();
  }

  const floor = $("#floor");
  floor.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip-st");
    if (chip) { e.stopPropagation(); if (chip.dataset.idea) { const it = ideaOf(chip.dataset.idea); if (it && it.stage === 4 && it.draft) openSheet(it.id); else $("#bench").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); } else openBay(chip.dataset.line); return; }
    const crew = e.target.closest(".crew-row");
    if (crew) { S.hl = crew.dataset.who; S.view = "chain"; refresh(); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); return; }
    const lane = e.target.closest(".lane");
    if (lane) openBay(lane.dataset.id);
  });
  floor.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target.closest(".chip-st")) return;
    const crew = e.target.closest(".crew-row");
    if (crew) { e.preventDefault(); S.hl = crew.dataset.who; S.view = "chain"; refresh(); return; }
    const lane = e.target.closest(".lane");
    if (lane) { e.preventDefault(); openBay(lane.dataset.id); }
  });
  floor.addEventListener("mouseover", (e) => {
    const tag = e.target.closest(".st-exec[data-who]");
    if (!tag || S.hl || S.view !== "chain") return;
    const x = tag.dataset.who;
    floor.classList.add("hling");
    $$(".lane .st", floor).forEach((st) => st.classList.toggle("hl", st.dataset.x === x));
  });
  floor.addEventListener("mouseout", (e) => {
    if (!e.target.closest(".st-exec[data-who]") || S.hl) return;
    floor.classList.remove("hling");
    $$(".lane .st.hl", floor).forEach((st) => st.classList.remove("hl"));
  });
  $("#strip").addEventListener("click", (e) => { if (e.target.closest("[data-clear-hl]")) { S.hl = null; refresh(); } });

  $("#bench").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sheet]"); if (b) return openSheet(b.dataset.sheet);
    const r = e.target.closest("[data-revise]"); if (r) return reviseDone(ideaOf(r.dataset.idea), r.dataset.revise === "ok");
    if (e.target.closest("[data-new-idea]")) openIdea();
  });

  $("#bay").addEventListener("click", (e) => {
    const b = e.target.closest("[data-bay]");
    if (b) { bayAction(b.dataset.bay, b.dataset.j != null ? +b.dataset.j : undefined); return; }
    const st = e.target.closest(".bay-line .st");
    if (st) { S.sel = +st.dataset.j; renderBay(); $(`.bay-line .st[data-j="${S.sel}"]`)?.focus(); }
  });
  $("#bay").addEventListener("keydown", (e) => {
    const st = e.target.closest(".bay-line .st");
    if (st && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); S.sel = +st.dataset.j; renderBay(); $(`.bay-line .st[data-j="${S.sel}"]`)?.focus(); }
  });
  $("#bay").addEventListener("change", (e) => {
    if (e.target.name === "call") { $("#pm").hidden = e.target.value !== "砍"; if (S.open) S.form = { line: S.open, call: e.target.value }; }
  });
  $("#bay").addEventListener("submit", (e) => { if (e.target.id === "dec-form") { e.preventDefault(); submitDecision(e.target); } });

  $("#sheet").addEventListener("click", (e) => { const b = e.target.closest("[data-sh]"); if (b) sheetAction(b.dataset.sh); });
  $("#sheet").addEventListener("input", (e) => { if (e.target.name === "crit") checkLock(); });
  $("#sheet").addEventListener("submit", (e) => { if (e.target.id === "lock-form") { e.preventDefault(); approve(e.target); } });

  $("#desk-body").addEventListener("click", (e) => {
    const b = e.target.closest("[data-fx]");
    if (b) return runCall(b.dataset.fx, b.dataset.call);
    const batch = e.target.closest("[data-batch]");
    if (batch) {
      const type = batch.dataset.batch === "read" ? "知情" : "确认";
      const cs = S.calls.filter((c) => c.t === type);
      cs.forEach((c) => runCall(c.acts[0].fx, c.id, true));
      toast(type === "知情" ? `已读 ${cs.length} 条` : `已按首选处理 ${cs.length} 件确认`);
    }
  });

  $("#call-btn").addEventListener("click", openDesk);
  $("#desk-close").addEventListener("click", closeDesk);
  $("#scrim").addEventListener("click", () => { closeDesk(); closeIdea(); $("#scrim").classList.remove("on"); });
  $$(".toggle button").forEach((b) => b.addEventListener("click", () => { S.view = b.dataset.view; if (S.view !== "chain") S.hl = null; refresh(); }));

  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if (e.key === "Escape") {
      if (idea.classList.contains("on")) { closeIdea(); $("#scrim").classList.remove("on"); }
      else if ($("#desk").classList.contains("on")) closeDesk();
      else if (S.sheet) closeSheet();
      else if (S.open) closeBay();
      else if (S.hl) { S.hl = null; refresh(); }
      return;
    }
    if (typing) return;
    if (e.key === "c" || e.key === "C") { $("#desk").classList.contains("on") ? closeDesk() : openDesk(); }
  });

  refresh(true);
})();
