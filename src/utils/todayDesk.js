// 今日页（v3 设计稿）数据映射：把 /api/member/feed 等接口的 OSM 原始结构整理为页面区块模型（纯函数）
import { calendar, formatUsd, marketDay, shortDay, signalDay, summaryMetrics, weekday, zonedDay, zonedTime } from '@/utils/todayFeed'

const ET = 'America/New_York'
const asArray = value => (Array.isArray(value) ? value : [])
const isDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '')
const num = value => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value === null || value === undefined || value === '') return null
  const n = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : null
}
const strike = value => { const n = num(value); return n === null ? '' : String(+n.toFixed(2)) }
const pct = (value, digits = 1) => { const n = num(value); return n === null ? '' : `${n > 0 ? '+' : ''}${n.toFixed(digits)}%` }
const tone = value => { const n = num(value); return n === null || n === 0 ? 'flat' : n > 0 ? 'up' : 'down' }
const daysBetween = (from, to) => (isDay(from) && isDay(to) ? Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 864e5) : null)
const addDays = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10)
const etStamp = utc => (utc ? `${shortDay(zonedDay(utc, ET))} · ${zonedTime(utc, ET)} ET` : '')
const PHASES = { PREMARKET: '盘前', PRE_MARKET: '盘前', MARKET_OPEN: '盘中', OPEN: '盘中', REGULAR: '盘中', AFTER_HOURS: '盘后', POSTMARKET: '盘后', MARKET_CLOSED: '休市', CLOSED: '休市' }
const SETTLED = new Set(['SETTLED', 'CLOSED', 'EXPIRED'])

/** 顶部：日期、盘面阶段、会员状态 */
export function heroInfo(feed, entitlement) {
  const day = marketDay(feed)
  const access = entitlement?.access || feed?.access || {}
  let member = ''
  if (access.tier) member = access.trial ? '试用中' : access.tier === 'free' ? '免费版' : '会员有效'
  return { day, weekday: weekday(day), phase: PHASES[String(feed?.marketPhase || '').toUpperCase()] || '', member, memberOk: !!access.tier && access.tier !== 'free' }
}

/** 三个 KPI：今日信号 / 保护窗口 / 动态管理，“最近 MM/DD · HH:mm ET” */
export function kpiCards(feed) {
  const m = summaryMetrics(feed)
  const day = signalDay(feed)
  const at = types => {
    const last = asArray(feed?.events).filter(e => types.includes(e?.event_type) && e.occurred_at && zonedDay(e.occurred_at, ET) === day).map(e => e.occurred_at).sort().pop()
    return last ? `最近 ${etStamp(last)}` : ''
  }
  return [
    { key: 'signals', label: '今日信号', dot: 'var(--lb-accent-bright)', value: m.signals.value, note: at(['SIGNAL_PUBLISHED']) || m.signals.note, href: '#signals' },
    { key: 'protects', label: '保护窗口', dot: 'var(--lb-warn)', value: m.protects.value, note: at(['PROTECTION_WINDOW_OPENED', 'PROTECTION_WINDOW_IMPROVED']) || m.protects.note, href: '#manage' },
    { key: 'manages', label: '动态管理', dot: '#ff7aa5', value: m.manages.value, note: at(['MANAGEMENT_CARD_ISSUED', 'BUYER_MGMT_CARD_ISSUED']) || lastCard(feed, day) || m.manages.note, href: '#manage' }
  ]
}

function lastCard(feed, day) {
  const last = asArray(feed?.managementCards).filter(c => c && !c.retired && c.issuedAtUtc && zonedDay(c.issuedAtUtc, ET) === day).map(c => c.issuedAtUtc).sort().pop()
  return last ? `最近 ${etStamp(last)}` : ''
}

const legLabel = (side, short, long, expiry) => `${expiry ? `${shortDay(expiry)} ` : ''}卖${side === 'call' ? 'CALL' : 'PUT'} ${strike(short)}/${strike(long)}`
const distText = d => (d < 0 ? `已穿 ${Math.abs(d).toFixed(1)}%` : `还有 ${d.toFixed(1)}%`)

/** 持仓被测试：在看的仓位中已穿过 / 贴近（≤1%）卖腿的组 */
export function testedPositions(feed, nearPct = 1) {
  const focus = asArray(feed?.narrativeSignal?.premarket?.focus)
  const why = item => {
    const f = focus.find(x => x?.symbol === item.symbol && x.narrativeLine)
    if (f) return f.narrativeLine
    const move = num(item.todayPct)
    return move === null ? '' : `今日 ${pct(move)}${item.event?.name ? ` · ${item.event.name}` : ''}`
  }
  const rows = []
  asArray(feed?.todayDesk?.watching).forEach(item => asArray(item?.groups).forEach(g => {
    const d = num(g.distPct)
    if (d === null || d > nearPct) return
    rows.push({ key: g.id || `${item.symbol}-${g.shortStrike}`, symbol: item.symbol, leg: legLabel(g.side || item.side, g.shortStrike, g.longStrike, g.expiryDate), why: why(item), dist: distText(d), crossed: d < 0, sort: d })
  }))
  rows.sort((a, b) => a.sort - b.sort)
  return { rows, crossed: rows.filter(r => r.crossed).length, near: rows.filter(r => !r.crossed).length }
}

const sellerName = intent => (/CALL/i.test(intent || '') ? '卖方看涨价差' : '卖方看跌价差')
const TIER = { core: ['核心档', 'tg-core'], light: ['轻仓档', 'tg-light'] }

function sellerSteps(row, feed) {
  const id = row.recommendationId || row.id
  const prot = row.protectionOpenedAt || row.protectionExecuted || asArray(feed?.protections).some(p => p?.signalId === row.id || p?.recommendationId === id)
  const mgmt = asArray(feed?.managementCards).some(c => c?.recommendationId === id || c?.signalId === id)
  const settled = SETTLED.has(row.statusCode)
  const done = [true, !!prot, mgmt, settled]
  return { done, cur: done.lastIndexOf(true) }
}

function sellerCard(row, feed, kind) {
  const day = marketDay(feed)
  const short = num(row.shortStrikeValue)
  const long = num(row.longStrikeValue)
  const width = short !== null && long !== null ? Math.abs(short - long) : null
  const left = daysBetween(day, row.expiryDate)
  const ep = row.entryPricing || {}
  const floor = num(ep.requiredCredit)
  const now = num(row.currentMarkValue)
  let floorInfo = null
  if (floor !== null && now !== null && floor > 0) {
    const good = now >= floor
    floorInfo = { good, text: `挂单底线 $${floor.toFixed(2)}/股 · 现在 $${now.toFixed(2)}`, verdict: good ? `高出 ${Math.round((now / floor - 1) * 100)}%` : '低于底线，别追' }
  }
  const prem = num(row.maxProfit) ?? (num(row.initialCredit) !== null ? num(row.initialCredit) * 100 : null)
  const pnl = num(row.floatingPnlValue)
  const [tier, tierClass] = kind === 'mid' ? ['中期', 'tg-mid'] : TIER[row.sizeClass] || [row.issuanceVerdict || row.verdict || '', 'tg-light']
  return {
    key: `${kind}:${row.id}`,
    kind,
    color: kind === 'mid' ? 'k-mid' : pnl !== null && pnl < 0 ? 'k-dn' : 'k-up',
    symbol: row.symbol || row.company,
    group: row.groupShow && row.groupNo ? `第${row.groupNo}组` : '',
    name: kind === 'mid' ? `中期${sellerName(row.intent)}` : sellerName(row.intent),
    tier, tierClass,
    time: row.emittedAt || etStamp(row.emittedAtUtc),
    leg: (row.structure || '').replace(/\s+/g, ''),
    expiry: row.expiry || shortDay(row.expiryDate),
    premLabel: '每组权利金',
    prem: prem === null ? '—' : formatUsd(prem),
    pnl: row.floatingPnl ? { text: `${row.floatingPnl}${row.floatingPnlPct ? `（${row.floatingPnlPct}）` : ''}`, tone: tone(pnl) } : null,
    metrics: [
      ['价差', width === null ? '—' : `$${+width.toFixed(2)}`],
      ['剩余', left === null ? '—' : `${Math.max(0, left)} 天`],
      ['距离现价', row.currentDistance || row.initialDistance || '—'],
      ['中间价 / 股', num(ep.midpointCredit) !== null ? `$${num(ep.midpointCredit).toFixed(2)}` : row.initialCredit || '—'],
      ['风险收益比', row.rewardRisk || '—'],
      ['最大风险', row.maxRisk || '—']
    ],
    floor: floorInfo,
    state: row.blockReason ? '暂不可开仓' : row.state || '',
    steps: sellerSteps(row, feed),
    sortAt: row.emittedAtUtc || ''
  }
}

function buyerCard(row, feed) {
  const day = marketDay(feed)
  const L = row.sideLetter || (row.side === 'put' ? 'P' : 'C')
  const leg = row.structure || (row.longStrike ? `买$${strike(row.longStrike)}${L}${row.shortStrike ? ` / 卖$${strike(row.shortStrike)}${L}` : ''}` : row.altStructure || '')
  const expiryDay = isDay(row.expiry) ? row.expiry : ''
  const left = daysBetween(day, expiryDay)
  const p = v => (num(v) === null ? '—' : `${Math.round(num(v))}%`)
  return {
    key: `buyer:${row.id}`,
    kind: 'buyer',
    color: 'k-buy',
    symbol: row.symbol,
    group: '',
    name: row.shortStrike ? `买方${L === 'P' ? '看跌' : '看涨'}价差` : `买方${L === 'P' ? '看跌' : '看涨'}期权`,
    tier: row.sentAt ? `已发单 ${String(row.sentAt).split('·').pop().replace('ET', '').trim()}` : row.cardLabel || '买方',
    tierClass: 'tg-sent',
    time: row.emittedAt || etStamp(row.emittedAtUtc),
    leg: String(leg).replace(/\s+/g, ''),
    expiry: expiryDay ? shortDay(expiryDay) : row.expiry || '',
    premLabel: '每组成本',
    prem: num(row.costPerContract) === null ? '—' : formatUsd(row.costPerContract),
    pnl: row.floatingPnl ? { text: `${row.floatingPnl}${row.floatingPnlPct ? `（${row.floatingPnlPct}）` : ''}`, tone: tone(row.floatingPnlUsd) } : null,
    metrics: [
      ['剩余', left === null ? '—' : `${Math.max(0, left)} 天`],
      ['距离现价', num(row.longDistPct) === null ? '—' : pct(row.longDistPct)],
      ['今日涨跌', num(row.todayPct) === null ? '—' : pct(row.todayPct, 2)],
      ['赚一半概率', p(row.gain50Pct)],
      ['翻倍概率', p(row.gain100Pct)],
      ['最大收益 / 张', num(row.maxGainPerContract) === null ? '—' : formatUsd(row.maxGainPerContract)]
    ],
    floor: null,
    state: row.state || '',
    steps: { done: [true, false, false, false], cur: 0 },
    sortAt: row.emittedAtUtc || ''
  }
}

/** 新信号：卖方（signals）、买方（buyerSignals）、中期（midtermShadowCards 当日发出或 NEW） */
export function signalDeck(feed) {
  const seen = new Set()
  const sellers = asArray(feed?.signals).filter(r => r && !seen.has(r.id) && seen.add(r.id)).map(r => sellerCard(r, feed, 'seller'))
  const buyers = asArray(feed?.buyerSignals).filter(Boolean).map(r => buyerCard(r, feed))
  const day = signalDay(feed)
  const mids = asArray(feed?.midtermShadowCards).filter(c => c?.sellerRow && (c.status === 'NEW' || c.etDate === day)).map(c => sellerCard({ ...c.sellerRow, symbol: c.symbol || c.sellerRow.company, id: c.id }, feed, 'mid'))
  const all = [...sellers, ...buyers, ...mids].sort((a, b) => String(b.sortAt).localeCompare(String(a.sortAt)))
  return { all, counts: { all: all.length, seller: sellers.length, buyer: buyers.length, mid: mids.length } }
}

const MG_TYPES = [
  [/^保护/, 'prot', '保护卡', 't-prot'], [/^移仓/, 'roll', '移仓卡', 't-roll'], [/^止盈/, 'tp', '止盈卡', 't-tp'],
  [/^平仓/, 'close', '平仓卡', 't-close'], [/^止损/, 'stop', '止损卡', 't-close'], [/^对冲/, 'hedge', '对冲卡', 't-hedge'],
  [/^到期/, 'expiry', '到期卡', 't-roll'], [/^观察/, 'watch', '观察卡', 't-roll']
]
export const MG_LABELS = { prot: '保护卡', roll: '移仓卡', tp: '止盈卡', close: '平仓卡', stop: '止损卡', hedge: '对冲卡', expiry: '到期卡', watch: '观察卡', other: '管理卡' }

function mgType(title) {
  const hit = MG_TYPES.find(([re]) => re.test(title || ''))
  return hit ? { type: hit[1], label: hit[2], cls: hit[3] } : { type: 'other', label: '管理卡', cls: 't-roll' }
}
const hhmm = utc => (utc ? zonedTime(utc, ET) : '')

/** 管理提醒：当日管理卡 + 当日保护窗口；对冲卡单独分组 */
export function manageDeck(feed) {
  const day = signalDay(feed)
  const cards = asArray(feed?.managementCards).filter(c => c && !c.retired && c.issuedAtUtc && zonedDay(c.issuedAtUtc, ET) === day).map(c => {
    const title = c.cardTitle || c.eventLabel || ''
    const t = mgType(title)
    const sub = c.stepTotal > 1 ? `${c.stepIndex || 1}/${c.stepTotal} 步` : (title.split('·').slice(1).join('·').trim() || c.scenario || '')
    const hv = num(c.headline?.value)
    return {
      key: c.id, ...t, sub,
      symbol: c.symbol, group: c.groupShow && c.groupNo ? `第${c.groupNo}组` : '',
      leg: `${(c.sourceStructure || '').replace(/\.0(?=[PC])/g, '')}${c.sourceExpiry ? ` · ${shortDay(c.sourceExpiry)}` : ''}`,
      trail: [],
      plLabel: c.headline?.label || '', pl: hv === null ? '' : formatUsd(hv, { sign: true }), plTone: tone(hv),
      time: hhmm(c.issuedAtUtc), sent: '',
      why: c.whyText || c.aiSummary || '',
      steps: asArray(c.opSteps).map(s => (typeof s === 'string' ? s : s?.text || s?.label || '')).filter(Boolean),
      figures: asArray(c.figures).filter(f => Array.isArray(f) && f[0]).map(f => ({ label: f[0], value: f[1], note: f[2] || '' })),
      origin: c.sourceStructure ? `原卖方 ${c.sourceStructure.replace(/\.0(?=[PC])/g, '')}${c.sourceExpiry ? ` · ${shortDay(c.sourceExpiry)}` : ''}${c.sourceCredit ? ` · 收$${Math.round(c.sourceCredit * 100)}×${c.contracts || 1}组` : ''}` : '',
      sortAt: c.issuedAtUtc
    }
  })
  const seen = new Set()
  const prots = [...asArray(feed?.protections), ...asArray(feed?.sentProtections)].filter(p => {
    if (!p || p.boardHidden || seen.has(p.id)) return false
    const at = p.lastUpdatedAtUtc || p.openedAtUtc
    if (!at || zonedDay(at, ET) !== day) return false
    seen.add(p.id)
    return true
  }).map(p => {
    const floating = num(p.actionFloatingUsd)
    const updates = asArray(p.updates)
    return {
      key: p.id, type: 'prot', label: '保护卡', cls: 't-prot', sub: String(p.eventLabel || '').replace(/^保护卡\s*·\s*/, ''),
      symbol: p.symbol, group: p.groupShow && p.groupNo ? `第${p.groupNo}组` : '',
      leg: `${p.sourceStructure || ''}${p.sourceExpiry ? ` · ${shortDay(p.sourceExpiry)}` : ''}`,
      trail: updates.slice(-3).map((u, i, list) => ({ text: `${u.label || '更新'} ${String(u.occurredAt || '').split('·').pop().replace('ET', '').trim()}`, last: i === list.length - 1 })),
      plLabel: floating !== null ? '当前浮盈' : '保护花多少', pl: floating !== null ? formatUsd(floating, { sign: true }) : p.candidateCost || '—', plTone: floating !== null ? tone(floating) : 'flat',
      time: hhmm(p.lastUpdatedAtUtc || p.openedAtUtc), sent: p.sentAt ? '已发单' : '',
      why: p.summary || p.aiSummary || '',
      steps: p.candidateStructure ? [`保护结构 ${p.candidateStructure}${p.candidateCost ? ` · 成本 ${p.candidateCost}` : ''}`] : [],
      figures: [
        p.favorableMove ? { label: '有利变动', value: p.favorableMove, note: '' } : null,
        num(p.riskReductionPct) !== null ? { label: '风险降低', value: `${num(p.riskReductionPct).toFixed(1)}%`, note: '' } : null,
        p.windowQuote ? { label: '窗口报价', value: p.windowQuote, note: '' } : null
      ].filter(Boolean),
      origin: '', sortAt: p.lastUpdatedAtUtc || p.openedAtUtc
    }
  })
  const all = [...prots, ...cards].sort((a, b) => String(b.sortAt).localeCompare(String(a.sortAt)))
  const counts = all.reduce((acc, r) => ({ ...acc, [r.type]: (acc[r.type] || 0) + 1 }), {})
  return { rows: all.filter(r => r.type !== 'hedge'), hedges: all.filter(r => r.type === 'hedge'), total: all.length, symbols: new Set(all.map(r => r.symbol)).size, counts }
}

function countdown(ts, now) {
  const diff = ts * 1000 - now
  if (diff <= 0) return ''
  const m = Math.round(diff / 6e4)
  if (m < 60) return `${m} 分后`
  if (m < 1440) return `${Math.floor(m / 60)} 小时 ${m % 60} 分后`
  return `${Math.floor(m / 1440)} 天后`
}

/** 今日要闻：导语（盘前简报）、盘面状态、经济数据倒计时、今日财报 */
export function newsDesk(feed, premarket, now = Date.now()) {
  const desk = feed?.todayDesk || {}
  const brief = premarket?.brief && typeof premarket.brief === 'object' ? premarket.brief : null
  const focus = asArray(feed?.narrativeSignal?.premarket?.focus).find(x => x?.narrativeLine)
  const lead = brief?.headline || (typeof premarket?.brief === 'string' ? premarket.brief : '') || focus?.narrativeLine || feed?.scan?.marketNote || ''
  const overall = desk.tape?.overall
  const tape = { green: ['● 盘面平稳', 'st-up'], amber: ['● 盘面有波动', 'st-warn'], yellow: ['● 盘面有波动', 'st-warn'], red: ['● 盘面警示', 'st-alert'] }[overall] || null
  const nowSec = now / 1000
  const events = asArray(desk.macro).filter(m => num(m.timestamp)).sort((a, b) => a.timestamp - b.timestamp)
    .filter(m => m.timestamp >= nowSec - 3 * 3600 || m.actual)
    .slice(0, 6).map(m => ({ key: m.id || m.title, time: `${shortDay(zonedDay(m.timestamp * 1000, ET))}\n${zonedTime(m.timestamp, ET)}`, title: m.title, note: m.actual ? `公布 ${m.actual}` : countdown(m.timestamp, now) || '已公布', high: m.importance === 'high' }))
  const anchor = calendar(feed).anchor
  const earnings = asArray(desk.earnings).filter(e => e?.date && e.date === anchor).slice(0, 6).map(e => ({ key: e.id || e.symbol, symbol: e.symbol, label: `${e.symbol} 财报`, eps: num(e.epsEstimate) === null ? '' : `$${num(e.epsEstimate).toFixed(2)}` }))
  return { day: shortDay(marketDay(feed)), lead, briefDate: brief?.dateLabel || '', tape, events, earnings, earningsDay: anchor === marketDay(feed) ? '今日' : shortDay(anchor) }
}

/** 信息 · 最近上的（/api/member/info-feed） */
export function infoFeeds(info, limit = 4) {
  return asArray(info?.items).slice(0, limit).map(i => ({ key: i.key, logo: (i.ticker || i.title || '?').slice(0, 1).toUpperCase(), title: i.title, kind: i.kind || '', dark: i.kind === '解读', summary: i.summary || '', sub: i.sub || '', column: i.column }))
}

/** 信号要闻（feed.signalNews.items） */
export function signalNewsItems(feed, limit = 3) {
  const items = asArray(feed?.signalNews?.items).filter(i => i && !i.quiet)
  return {
    total: items.length,
    items: items.slice(0, limit).map(i => ({ key: i.id, symbol: i.symbol, direction: i.direction || '中性', cls: i.alignment === 'aligned' || i.direction === '顺风' ? 'st-up' : i.direction === '逆风' ? 'st-alert' : 'st-gray', text: String(i.headline || '').replace(/^\d+\.\s*/, ''), meta: [i.legStructure, i.legExpiry, i.source].filter(Boolean).join(' · '), url: i.url || '' }))
  }
}

const WEEK_TYPES = [
  ['SIGNAL_PUBLISHED', '新卖方', '#070a13'], ['BUYER_SIGNAL_PUBLISHED', '新买方', '#2563eb'], ['PROTECTION_WINDOW_OPENED', '保护窗', '#0aa5b5'],
  ['PROTECTION_WINDOW_IMPROVED', '保护改善', '#5eead4'], ['EOD_PROTECTION_WINDOW', '收盘保护', '#f59e0b'], ['MANAGEMENT_CARD_ISSUED', '管理', '#a8aaad'],
  ['BUYER_MGMT_CARD_ISSUED', '买方管理', '#93c5fd'], ['MANAGEMENT_CARD_SETTLED', '管理结算', '#16a34a']
]

/** 本周：周一至周五系统发出的卡（events），按类型堆叠 */
export function weekStats(feed) {
  const today = marketDay(feed)
  if (!isDay(today)) return null
  let anchor = today
  const wd = new Date(`${today}T12:00:00Z`).getUTCDay()
  // 周末展示刚结束的这一周
  if (wd === 0) anchor = addDays(today, -2)
  if (wd === 6) anchor = addDays(today, -1)
  const monday = addDays(anchor, -((new Date(`${anchor}T12:00:00Z`).getUTCDay() + 6) % 7))
  const days = [0, 1, 2, 3, 4].map(i => addDays(monday, i))
  const known = new Map(WEEK_TYPES.map(([t, l, c]) => [t, { label: l, color: c }]))
  const events = asArray(feed?.events).filter(e => known.has(e?.event_type) && e.occurred_at).map(e => ({ type: e.event_type, day: zonedDay(e.occurred_at, ET) })).filter(e => days.includes(e.day))
  const expiries = new Set(asArray(feed?.todayDesk?.watching).flatMap(w => asArray(w.groups).map(g => g.expiryDate)))
  const cells = days.map((d, i) => {
    const n = events.filter(e => e.day === d).length
    const future = d > today
    return { day: d, label: '一二三四五'[i] + (d === today ? ' · 今天' : ''), today: d === today, exp: future && expiries.has(d), value: future ? (expiries.has(d) ? '到期' : '—') : String(n) }
  })
  const total = events.length
  const stack = WEEK_TYPES.map(([t]) => ({ type: t, ...known.get(t), count: events.filter(e => e.type === t).length })).filter(s => s.count)
  return { range: `${shortDay(monday)}–${shortDay(days[4])}`, cells, total, stack }
}

/** 在看的仓位：todayDesk.watching，每组腿 + 盈亏 + 位置条（卖腿 / 价差宽度 / 现价） */
export function watchPositions(feed, limit = 6) {
  const list = asArray(feed?.todayDesk?.watching).filter(w => w && asArray(w.groups).length)
  const groups = list.reduce((n, w) => n + asArray(w.groups).length, 0)
  const items = list.slice(0, limit).map(w => {
    const spot = num(w.spot)
    return {
      key: w.symbol, symbol: w.symbol, spot: spot === null ? '' : `$${spot.toFixed(2)}`, move: pct(w.todayPct, 2), moveTone: tone(w.todayPct), count: asArray(w.groups).length,
      groups: asArray(w.groups).map(g => {
        const s = num(g.shortStrike); const l = num(g.longStrike); const d = num(g.distPct)
        const pts = [s, l, spot].filter(v => v !== null)
        const lo = Math.min(...pts); const hi = Math.max(...pts); const pad = Math.max((hi - lo) * 0.35, hi * 0.004)
        const pos = v => (v === null ? null : Math.round(((v - (lo - pad)) / (hi - lo + 2 * pad)) * 1000) / 10)
        const ws = pos(Math.min(s ?? spot, l ?? s ?? spot)); const we = pos(Math.max(s ?? spot, l ?? s ?? spot))
        return {
          key: g.id, leg: legLabel(g.side || w.side, s, l, g.expiryDate), call: (g.side || w.side) === 'call',
          pnl: num(g.pnlUsd) === null ? '' : formatUsd(g.pnlUsd, { sign: true }), pnlTone: tone(g.pnlUsd),
          dist: d === null ? '' : distText(d), crossed: d !== null && d < 0,
          track: { wLeft: ws, wWidth: we - ws, short: pos(s), spot: pos(spot) }
        }
      })
    }
  })
  return { symbols: list.length, groups, items, session: feed?.todayDesk?.watchingSession === 'closed' ? '收盘价' : feed?.todayDesk?.watchingSession === 'pre' ? '盘前价' : '实时' }
}

/** 接下来：后续经济数据 + 财报 + 远期事件 */
export function upcomingEvents(feed, limit = 5) {
  const cal = calendar(feed)
  const macro = cal.next.macro.map(m => ({ key: m.key, day: m.day, when: weekday(m.day), title: m.title, tag: '宏观', cls: m.impact === 'high' ? 'st-warn' : 'st-up' }))
  const earn = cal.next.earnings.map(e => ({ key: e.key, day: e.day, when: weekday(e.day), title: e.title, tag: '财报', cls: 'st-info' }))
  const far = asArray(feed?.todayDesk?.farEvents).filter(e => isDay(e?.date)).map(e => ({ key: e.id || e.title, day: e.date, when: shortDay(e.date), title: e.title || '事件', tag: e.kind === 'opex' ? '到期' : '事件', cls: 'st-gray' }))
  return [...macro, ...earn].sort((a, b) => a.day.localeCompare(b.day)).slice(0, limit).concat(far.slice(0, 1))
}
