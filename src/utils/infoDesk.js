// 「信息」页（info-longbridge 设计稿）展示模型：把 /api/member/info/* 的 OSM 页面 props 整理成各区块所需的数据（纯函数）
// 没有数据的字段一律返回空，由页面隐藏对应区块；不生成任何模拟数值

const arr = v => (Array.isArray(v) ? v : [])
const isNum = v => typeof v === 'number' && Number.isFinite(v)
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
/** OSM 文本里的美元符号被转义成 "$$"，还原为单个 "$" */
export const money = s => (typeof s === 'string' ? s.replace(/\$\$/g, '$') : s ?? '')
export const fmtNum = (v, d) => (isNum(v) ? v.toLocaleString('en-US', { maximumFractionDigits: d ?? (Math.abs(v) >= 1000 ? 0 : 2) }) : '—')
export const signedPct = (v, d = 1) => (isNum(v) ? `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}%` : '—')
export const toneCls = v => (!isNum(v) || v === 0 ? '' : v > 0 ? 'up' : 'down')
const toneText = s => (/(^|\s)[+＋]\s*\d|涨|多|超/.test(s || '') && !/[-−]\s*\d/.test(s || '') ? 'up' : /[-−]\s*\d|跌|少|低于/.test(s || '') ? 'down' : '')

/** 北京时间的 年月日 / 周几 / 时分 */
function bjParts(now = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, weekday: 'short' })
  const p = Object.fromEntries(f.formatToParts(now).map(x => [x.type, x.value]))
  return { day: `${p.year}-${p.month}-${p.day}`, h: +p.hour % 24, m: +p.minute, s: +p.second, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) }
}
/** 美东时段：盘前 / 盘中 / 盘后 / 休市 */
function etSession(now = new Date()) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' })
  const p = Object.fromEntries(f.formatToParts(now).map(x => [x.type, x.value]))
  if (p.weekday === 'Sat' || p.weekday === 'Sun') return '休市'
  const t = (+p.hour % 24) * 60 + +p.minute
  return t < 570 ? '盘前' : t < 960 ? '盘中' : '盘后'
}
export function heroLine(now = new Date()) {
  const b = bjParts(now)
  return { day: b.day, week: WEEK[b.wd], session: etSession(now) }
}
/** 距离下一份盘前简报（交易日北京时间 20:30，与设计稿一致）的倒计时 */
export function nextBriefCountdown(now = new Date(), hour = 20, minute = 30) {
  const b = bjParts(now)
  const nowSec = b.h * 3600 + b.m * 60 + b.s, target = hour * 3600 + minute * 60
  let wd = b.wd, add = target - nowSec
  if (add <= 0 || wd === 0 || wd === 6) {
    add += 86400; wd = (wd + 1) % 7
    while (wd === 0 || wd === 6) { add += 86400; wd = (wd + 1) % 7 }
  }
  const h = Math.floor(add / 3600), m = Math.floor(add % 3600 / 60), s = add % 60
  return `${h > 99 ? h : String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
/** yyyy-MM-dd → 9月30日 */
export const mdLabel = d => (/^\d{4}-\d{2}-\d{2}/.test(d || '') ? `${+d.slice(5, 7)}月${+d.slice(8, 10)}日` : d || '')
/** 约 N 分钟读完（中文约 400 字/分钟） */
export function readMinutes(obj) {
  const n = JSON.stringify(obj || '').replace(/[\x00-\xff]/g, '').length
  return Math.max(1, Math.round(n / 400))
}

/* ---------------- 盘前 ---------------- */
export function quoteCards(brief) {
  return arr(brief?.tape).map(q => {
    const unit = money(q.unit || '')
    const hasLevel = isNum(q.level)
    const value = hasLevel ? (unit.startsWith('$') ? `$${fmtNum(q.level)}` : fmtNum(q.level)) : signedPct(q.chgPct)
    const suffix = hasLevel ? (unit === '%' ? '%' : unit.startsWith('$') ? unit.slice(1) : unit) : '%'
    const chg = isNum(q.chgBp) ? q.chgBp : q.chgPct
    const change = hasLevel
      ? (isNum(q.chgBp) ? `${q.chgBp >= 0 ? '▲' : '▼'} ${q.chgBp > 0 ? '+' : q.chgBp < 0 ? '−' : ''}${Math.abs(q.chgBp)} 基点` : isNum(q.chgPct) ? `${q.chgPct >= 0 ? '▲' : '▼'} ${signedPct(q.chgPct)}` : '')
      : (money(q.note) || '盘前')
    return { name: q.name, value: hasLevel ? value : value.replace(/%$/, ''), suffix, change, tone: toneCls(chg), colorValue: !hasLevel }
  })
}
export function moverGroups(brief) {
  const items = arr(brief?.movers?.items).filter(i => isNum(i.chgPct))
  const max = Math.max(5, ...items.map(i => Math.abs(i.chgPct)))
  const groups = []
  for (const i of items) {
    const name = i.group || '其他'
    let g = groups.find(x => x.name === name)
    if (!g) groups.push(g = { name, rows: [] })
    const w = Math.min(Math.abs(i.chgPct) / max * 50, 50)
    g.rows.push({ ticker: i.ticker, pct: signedPct(i.chgPct), tone: i.chgPct >= 0 ? 'up' : 'down', note: money(i.note), style: i.chgPct >= 0 ? { left: '50%', width: `${w}%`, background: 'var(--lb-up)' } : { right: '50%', width: `${w}%`, background: 'var(--lb-down)' } })
  }
  return { groups, max: Math.round(max) }
}
const linePath = (vals, W, H, P, lo, hi) => vals.map((v, i) => `${i ? 'L' : 'M'}${(P + i * (W - P * 2) / Math.max(1, vals.length - 1)).toFixed(1)},${(H - P - (v - lo) / ((hi - lo) || 1) * (H - P * 2)).toFixed(1)}`).join('')

/** 利率：两周变化折线（viewBox 500×120）+ 12 月会议堆叠条 */
export function rateModel(block) {
  if (!block) return null
  const pts = arr(block.trend).filter(t => isNum(t?.p))
  let chart = null
  if (pts.length >= 2) {
    const W = 500, H = 120, P = 14, vals = pts.map(t => t.p)
    const lo = Math.max(0, Math.floor(Math.min(...vals) - 4)), hi = Math.ceil(Math.max(...vals) + 4)
    const x = i => P + i * (W - P * 2) / (vals.length - 1), y = v => H - P - (v - lo) / (hi - lo) * (H - P * 2)
    const line = linePath(vals, W, H, P, lo, hi)
    const maxI = vals.indexOf(Math.max(...vals))
    const marks = [...new Set([0, Math.abs(maxI - (vals.length - 1)) < 2 || maxI < 2 ? 0 : maxI, vals.length - 1])].map(i => ({ cx: x(i), cy: y(vals[i]), text: `${pts[i].d} ${vals[i].toFixed(1)}%`, anchor: i === 0 ? 'start' : i === vals.length - 1 ? 'end' : 'middle' }))
    chart = { line, area: `${line}L${x(vals.length - 1)},${H - P}L${P},${H - P}Z`, marks }
  }
  const colors = ['#c7f3ee', 'var(--lb-accent)', 'var(--lb-text)', 'var(--lb-warn)']
  const later = arr(block.later?.items).filter(i => isNum(i.p)).map((i, k) => ({ label: i.label, p: i.p, color: colors[k % colors.length] }))
  const prob = isNum(block.nextProb) ? block.nextProb : null
  return { title: block.title, sub: block.sub, prob, label: block.nextLabel, note: block.nextNote, trendLabel: block.trendLabel, trendNote: block.trendNote, chart, laterLabel: block.later?.label, later, text: block.note }
}

/** 估值：盈利收益率 vs 10 年美债 + 多出收益刻度（单位基点） */
export function yieldGapModel(block) {
  if (!block) return null
  const ey = block.earningsYield, by = block.bondYield
  const scale = Math.max(6, (isNum(ey) ? ey : 0) * 1.2, (isNum(by) ? by : 0) * 1.2)
  const bp = isNum(ey) && isNum(by) ? Math.round((ey - by) * 100) : null
  const lo = -200, hi = 200, pos = v => Math.max(3, Math.min(97, (v - lo) / (hi - lo) * 100))
  const nlo = isNum(block.normalLoBp) ? block.normalLoBp : null, nhi = isNum(block.normalHiBp) ? block.normalHiBp : null
  return {
    title: block.title, sub: block.sub,
    bars: [
      isNum(ey) && { label: '标普盈利收益率', value: `${ey}%`, width: ey / scale * 100, color: 'var(--lb-accent)' },
      isNum(by) && { label: '10 年期美债', value: `${by}%`, width: by / scale * 100, color: 'var(--lb-text)' }
    ].filter(Boolean),
    gauge: bp === null ? null : { now: pos(bp), zero: pos(0), nowText: `现在约 ${bp > 0 ? '+' : bp < 0 ? '−' : ''}${Math.abs(bp)}`, tone: bp < 0 ? 'var(--lb-up)' : 'var(--lb-accent)', norm: nlo !== null && nhi !== null ? { left: pos(nlo), width: pos(nhi) - pos(nlo), text: `历史常态 +${nlo}～+${nhi}` } : null },
    stats: arr(block.facts).map(f => ({ label: f.label, value: money(f.value), sub: money(f.sub) })),
    text: block.note
  }
}

/** 估值走势：远期市盈率（含 5 年均值虚线）+ 指数与远期 EPS（首点 = 100） */
export function valuationModel(block) {
  if (!block) return null
  const pts = arr(block.points).filter(p => isNum(p?.pe))
  if (pts.length < 2) return { title: block.title, sub: block.sub, text: block.note }
  const W = 500, H = 130, P = 14
  const years = []
  pts.forEach((p, i) => { const y = (p.d || '').slice(0, 4); if (y && !years.some(t => t.text === y)) years.push({ text: y, x: P + i * (W - P * 2) / (pts.length - 1) }) })
  const pe = pts.map(p => p.pe), avg = isNum(block.avg5) ? block.avg5 : null
  const plo = Math.min(...pe, avg ?? Infinity) - .5, phi = Math.max(...pe, avg ?? -Infinity) + .5
  const yv = v => H - P - (v - plo) / (phi - plo) * (H - P * 2)
  const peChart = { line: linePath(pe, W, H, P, plo, phi), avgY: avg !== null ? yv(avg) : null, avgText: avg !== null ? `5 年均值 ${avg} 倍` : '', years }
  let epsChart = null
  const c0 = pts.find(p => isNum(p.c))?.c, e0 = pts.find(p => isNum(p.eps))?.eps
  if (c0 && e0) {
    const spx = pts.map(p => (isNum(p.c) ? p.c / c0 * 100 : null)), eps = pts.map(p => (isNum(p.eps) ? p.eps / e0 * 100 : null))
    const all = [...spx, ...eps].filter(isNum), lo = Math.floor(Math.min(...all) / 10) * 10 - 5, hi = Math.ceil(Math.max(...all) / 10) * 10 + 5
    const fill = a => a.map((v, i) => (isNum(v) ? v : a.slice(0, i).reverse().find(isNum) ?? 100))
    const grid = [100, 150, 200, 250].filter(v => v > lo && v < hi).map(v => ({ v, y: H - P - (v - lo) / (hi - lo) * (H - P * 2) }))
    epsChart = { spx: linePath(fill(spx), W, H, P, lo, hi), eps: linePath(fill(eps), W, H, P, lo, hi), grid, years }
  }
  const last = pts[pts.length - 1], first = pts[0]
  const stats = [
    { label: '远期市盈率', value: `${last.pe.toFixed(1)} 倍`, sub: avg !== null ? `5 年均值 ${avg} 倍` : '' },
    isNum(last.eps) && { label: '远期 EPS（推算）', value: `$${Math.round(last.eps)}`, sub: isNum(first.eps) ? `${first.d.slice(0, 4)} 年初 $${Math.round(first.eps)}` : '' },
    isNum(last.c) && { label: '标普 500 收盘', value: fmtNum(last.c, 0), sub: last.d ? `${+last.d.slice(5, 7)}/${+last.d.slice(8, 10)}` : '' }
  ].filter(Boolean)
  return { title: block.title, sub: block.sub, peChart, epsChart, stats, text: block.note }
}

const TAG_CLS = { 财报: 't-up', 政策: 't-info', 宏观: 't-info', 芯片: 't-ac', 利率: 't-warn', 分析师预测: 't-ac' }
export function newsCards(brief) {
  const cls = ['t-up', 't-info', 't-ac', 't-warn']
  return arr(brief?.stories).map((s, i) => ({ tag: s.tag || '要闻', cls: TAG_CLS[s.tag] || cls[i % cls.length], time: s.time || '', title: money(s.title), body: money(s.body), tickers: arr(s.tickers) }))
}

/* ---------------- 财报 ---------------- */
export function aboutModel(about) {
  if (!about) return null
  const colors = ['var(--lb-accent)', 'var(--lb-warn)', 'var(--lb-text)', '#c7f3ee', 'var(--lb-info)', 'var(--lb-up)']
  const lines = arr(about.lines).map((l, i) => ({ name: l.name, share: isNum(l.share) ? l.share : null, what: money(l.what), color: colors[i % colors.length] }))
  return { oneLiner: money(about.oneLiner), lines, split: lines.filter(l => l.share), text: money(about.typeNote) }
}
export function tileCards(piece) {
  return arr(piece?.tiles).map(t => ({ name: t.name, value: money(t.value), unit: t.unit || '', chg: money(t.chg), tone: toneText(t.chg), note: money(t.note) }))
}
export function guideRows(vs) {
  return arr(vs?.rows).map(r => ({ label: r.label, guide: money(r.guideText), actual: money(r.actualText), gap: money(r.gapText), tone: /^(多|高|超|好)/.test(r.gapText || '') ? 't-up' : /^(少|低|差|不及)/.test(r.gapText || '') ? 't-ac' : 't-gray' }))
}
/** 季度收入柱 + 毛利率（viewBox 500×170） */
export function revenueChart(trend) {
  const rows = arr(trend?.rows).filter(r => isNum(r.rev))
  if (!rows.length) return null
  const W = 500, H = 170, top = 26, base = 136, max = Math.max(...rows.map(r => r.rev))
  const bw = Math.min(64, (W - 40) / rows.length - 18), gap = (W - 40 - bw * rows.length) / Math.max(1, rows.length - 1)
  const bars = rows.map((r, i) => { const h = r.rev / max * (base - top), x = 20 + i * (bw + gap); return { x, y: base - h, w: bw, h, cx: x + bw / 2, q: r.q, rev: fmtNum(r.rev, 1), gm: isNum(r.gm) ? `${r.gm}%` : '', guide: !!r.guide } })
  return { bars, base, W, H }
}
/** 财报当天历史涨跌点图（viewBox 500×150）：期权定价带 + 这次 */
export function reactionChart(reaction) {
  const hist = arr(reaction?.history).filter(h => isNum(h?.pct))
  if (!hist.length) return null
  const axis = isNum(reaction.axis) && reaction.axis > 0 ? reaction.axis : Math.ceil(Math.max(...hist.map(h => Math.abs(h.pct))) / 5) * 5
  const W = 500, P = 20, x = v => P + (Math.max(-axis, Math.min(axis, v)) + axis) / (axis * 2) * (W - P * 2), base = 100, used = {}
  const step = axis / 10
  const dots = [...hist].sort((a, b) => a.pct - b.pct).map(h => { const k = Math.round(h.pct / step); used[k] = (used[k] || 0) + 1; return { cx: x(h.pct), cy: base - (used[k] - 1) * 12, fill: h.pct >= 0 ? 'var(--lb-up)' : 'var(--lb-down)', title: `${h.date} ${signedPct(h.pct)}` } })
  const imp = isNum(reaction.impliedPct) ? reaction.impliedPct : null
  const outside = imp === null ? 0 : hist.filter(h => Math.abs(h.pct) > imp).length
  const ticks = [-axis, -axis / 2, 0, axis / 2, axis].map(v => ({ x: x(v), text: `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(+v.toFixed(1))}%` }))
  return { dots, band: imp === null ? null : { x: x(-imp), w: x(imp) - x(-imp), text: `期权定价 ±${imp.toFixed(1)}%`, cx: x(0) }, now: isNum(reaction.afterPct) ? { x: x(reaction.afterPct), text: `${reaction.nowLabel || '这次'} ${signedPct(reaction.afterPct)}` } : null, ticks, outside, total: hist.length, W, P }
}
export function previewCards(previews) {
  return arr(previews).map(p => {
    const iv = /±\s*[\d.]+%/.exec(p.summary || p.share?.lede || '')?.[0] || ''
    const med = /中位数?\s*([\d.]+%)/.exec(p.share?.lede || '')?.[1] || ''
    return { id: p.id, ticker: p.ticker, when: `${(p.reportDate || '').slice(5).replace('-', '/')} ${p.session || ''}`.trim(), title: money(p.title), summary: money(p.summary), iv, median: med ? `历史中位 ${med}` : '', facts: arr(p.share?.facts).map(f => ({ label: f.label, value: money(f.value), sub: money(f.sub) })), verdicts: arr(p.share?.verdicts).map(money), watch: arr(p.share?.watch).map(money), lede: money(p.share?.lede) }
  })
}

/* ---------------- 札记 / 事件：筛选 ---------------- */
export function kindFilters(list, all = '全部') {
  const kinds = [...new Set(arr(list).map(x => x.kind).filter(Boolean))]
  return [{ key: all, n: arr(list).length }, ...kinds.map(k => ({ key: k, n: arr(list).filter(x => x.kind === k).length }))]
}
