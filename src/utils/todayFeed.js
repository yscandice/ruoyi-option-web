// 今日页面数据映射：把后端 /api/member/* 返回的 OSM 原始结构整理为页面展示模型（纯函数，无副作用）

const ET = 'America/New_York'
const BJ = 'Asia/Shanghai'
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const PHASE_LABELS = {
  PREMARKET: '盘前', PRE_MARKET: '盘前', MARKET_OPEN: '盘中', OPEN: '盘中', REGULAR: '盘中',
  AFTER_HOURS: '盘后', POSTMARKET: '盘后', MARKET_CLOSED: '休市', CLOSED: '休市'
}
const LEVEL_DOT = { green: 'fact-green', amber: 'fact-orange', yellow: 'fact-orange', red: 'fact-red' }
const LEVEL_TEXT = { green: '平稳', amber: '留意', yellow: '留意', red: '警示' }
const MGMT_KIND = { breached: '短腿被穿', breach_step: '分步处理', tested_protect: '测试保护', tested_roll: '测试移仓' }

const isDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '')
const asArray = value => (Array.isArray(value) ? value : [])
const toNumber = value => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value === null || value === undefined || value === '') return null
  const n = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

/** 某时间点在指定时区的日期 yyyy-MM-dd */
export function zonedDay(value, timeZone = ET) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

/** 某时间点在指定时区的 HH:mm */
export function zonedTime(value, timeZone = ET) {
  const date = value instanceof Date ? value : new Date(typeof value === 'number' && value < 1e12 ? value * 1000 : value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

export const etToday = () => zonedDay(new Date(), ET)
export const tzOf = key => (key === 'BJ' ? BJ : ET)
export const tzLabel = key => (key === 'BJ' ? '北京' : 'ET')

export function shortDay(day) {
  return isDay(day) ? `${day.slice(5, 7)}/${day.slice(8, 10)}` : ''
}

export function weekday(day) {
  return isDay(day) ? WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()] : ''
}

function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12) + n * 864e5)
  return date.toISOString().slice(0, 10)
}

function isWeekend(day) {
  const w = new Date(`${day}T12:00:00Z`).getUTCDay()
  return w === 0 || w === 6
}

function prevTradingDay(day) {
  let d = addDays(day, -1)
  while (isWeekend(d)) d = addDays(d, -1)
  return d
}

export function formatUsd(value, { sign = false } = {}) {
  const n = toNumber(value)
  if (n === null) return '—'
  const text = `$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
  if (n < 0) return `-${text}`
  return sign && n > 0 ? `+${text}` : text
}

export function formatNumber(value, digits = 2) {
  const n = toNumber(value)
  return n === null ? '—' : n.toFixed(digits)
}

/** 市场日：与 OSM 一致，优先 marketEtDay */
export function marketDay(feed) {
  return (isDay(feed?.marketEtDay) && feed.marketEtDay) || (isDay(feed?.etDay) && feed.etDay) || ''
}

/** 信号交易日（信号、管理卡所属交易日） */
export function signalDay(feed) {
  return (isDay(feed?.etDay) && feed.etDay) || (isDay(feed?.todayDesk?.tradingDay) && feed.todayDesk.tradingDay) || marketDay(feed)
}

/** 日期行：2026-10-17 周六 · 休市 · 下一交易日 10/19 周一 */
export function dateLine(feed) {
  const day = marketDay(feed)
  if (!day) return ''
  const parts = [day, weekday(day)]
  const phase = PHASE_LABELS[String(feed?.marketPhase || '').toUpperCase()]
  if (phase) parts.push(phase)
  const desk = feed?.todayDesk
  if (desk?.mode === 'lookahead' && isDay(desk.nextTradingDay)) parts.push(`下一交易日 ${shortDay(desk.nextTradingDay)} ${weekday(desk.nextTradingDay)}`)
  if (feed?.usingPriorTradingDay) parts.push('上一交易日信号保留至下次开盘前')
  return parts.join(' · ')
}

/** 波动率卡片 */
export function volatility(feed) {
  const desk = feed?.todayDesk || {}
  const vol = desk.volatility || {}
  const lights = asArray(desk.tape?.lights)
  const vixLight = lights.find(item => item.id === 'vix')
  const ok = vol.status === 'ok' && typeof vol.vix === 'number'
  const value = ok ? vol.vix : vixLight?.value
  const change = ok ? toNumber(vol.changePct) : toNumber(vixLight?.changePct)
  const level = vixLight?.level || ''
  const tapeAsOf = desk.coverage?.tapeAsOf || desk.tape?.asOf
  let status = ok ? (vol.label || vol.regime || '波动率数据已更新') : vixLight ? `${vixLight.label || 'VIX'} · ${LEVEL_TEXT[level] || '已更新'}` : ''
  if (!status && vol.status) status = '波动率快照暂不可用'
  const notes = []
  if (vol.note) notes.push(vol.note)
  if (!ok && vol.status === 'unavailable') notes.push('终端扫描快照缺少 VIX，当前取行情灯数据。')
  if (desk.tape?.marketStatus) notes.push(`市场状态：${desk.tape.marketStatus === 'NORMAL' ? '正常' : desk.tape.marketStatus}`)
  if (tapeAsOf) notes.push(`行情快照 ${zonedDay(tapeAsOf, ET)} ${zonedTime(tapeAsOf, ET)} ET`)
  const term = ok ? [vol.vix9d, vol.vix, vol.vix3m].map(toNumber) : []
  return {
    value: typeof value === 'number' ? value.toFixed(2) : '',
    change: change === null ? '' : `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
    status,
    note: notes.join(' · '),
    vvix: typeof vol.vvix === 'number' ? vol.vvix.toFixed(0) : '',
    skew: typeof vol.skew === 'number' ? vol.skew.toFixed(0) : '',
    term: term.every(v => v !== null) && term.length === 3 ? term : [],
    termLabel: vol.termLabel || ''
  }
}

/** 市场事实：QQQ、美债、行业共振、月度期权到期 */
export function marketFacts(feed) {
  const desk = feed?.todayDesk || {}
  const lights = asArray(desk.tape?.lights)
  const pick = id => {
    const light = lights.find(item => item.id === id)
    return light ? { value: light.now || '—', dot: LEVEL_DOT[light.level] || 'fact-green' } : { value: '—', dot: 'fact-green' }
  }
  const opex = [...asArray(desk.farEvents), ...asArray(desk.events)].find(item => item?.kind === 'opex')
  let expiry = '—'
  if (opex && isDay(opex.date)) {
    const dd = toNumber(opex.dd)
    expiry = `${shortDay(opex.date)} ${weekday(opex.date)}${dd === null ? '' : dd === 0 ? ' · 今天' : dd === 1 ? ' · 明天' : ` · ${dd} 天后`}`
  }
  return {
    qqq: pick('qqq'),
    bond: pick('bond'),
    sector: pick('sector'),
    expiry,
    flags: asArray(desk.tape?.flags).map(item => item.label).filter(Boolean)
  }
}

/** 事件日历：经济数据 + 财报，按日期分组 */
export function calendar(feed, tzKey = 'ET') {
  const desk = feed?.todayDesk || {}
  const tz = tzOf(tzKey)
  const anchor = (isDay(desk.anchorDay) && desk.anchorDay) || (desk.mode === 'lookahead' ? desk.nextTradingDay : desk.tradingDay) || marketDay(feed)
  const macro = asArray(desk.macro).map(item => {
    const ts = toNumber(item.timestamp)
    const day = ts ? zonedDay(new Date(ts * 1000), ET) : ''
    return {
      key: item.id || `${item.title}-${ts}`,
      day,
      dayLabel: ts ? shortDay(zonedDay(new Date(ts * 1000), tz)) : shortDay(day),
      sort: ts || 0,
      time: ts ? `${zonedTime(ts, tz)} ${tzLabel(tzKey)}` : item.timeEt || '',
      title: item.title || '经济数据',
      impact: item.importance === 'high' ? 'high' : 'med',
      meta: [item.country, item.previous ? `前值 ${item.previous}` : '', item.consensus ? `预期 ${item.consensus}` : '', item.actual ? `公布 ${item.actual}` : ''].filter(Boolean).join(' · ')
    }
  })
  const sessionLabel = { bmo: '盘前', pre: '盘前', amc: '盘后', post: '盘后', dmh: '盘中' }
  const earnings = asArray(desk.earnings).map(item => ({
    key: item.id || `${item.symbol}-${item.date}`,
    day: item.date,
    dayLabel: shortDay(item.date),
    sort: 0,
    time: sessionLabel[item.session] || '时间待定',
    title: `${item.symbol} 财报${item.period ? ` · ${item.period}` : ''}`,
    impact: 'earn',
    meta: [item.inWatchlist ? '观察池' : '', typeof item.ivRank === 'number' ? `IV Rank ${item.ivRank.toFixed(0)}` : '', typeof item.epsEstimate === 'number' ? `EPS 预期 ${item.epsEstimate.toFixed(2)}` : ''].filter(Boolean).join(' · ')
  }))
  const byDay = (list, predicate) => list.filter(item => isDay(item.day) && predicate(item.day)).sort((a, b) => a.day.localeCompare(b.day) || a.sort - b.sort)
  const isToday = day => day === anchor
  const isNext = day => !!anchor && day > anchor
  return {
    anchor,
    anchorLabel: anchor ? `${shortDay(anchor)} ${weekday(anchor)}` : '',
    lookahead: desk.mode === 'lookahead',
    today: { macro: byDay(macro, isToday), earnings: byDay(earnings, isToday) },
    next: { macro: byDay(macro, isNext), earnings: byDay(earnings, isNext) },
    totals: { high: macro.filter(i => i.impact === 'high').length, med: macro.filter(i => i.impact !== 'high').length, earn: earnings.length },
    disclosure: desk.disclosure || '',
    through: desk.lookaheadThrough || ''
  }
}

/** 盘前简报摘要 */
export function premarketBrief(premarket, feed) {
  const brief = premarket?.brief
  if (brief && typeof brief === 'object') {
    return { text: brief.headline || brief.title || brief.summary || brief.lede || '盘前简报已发布', tag: '已发布', type: 'success' }
  }
  if (typeof brief === 'string' && brief) return { text: brief, tag: '已发布', type: 'success' }
  const focus = asArray(feed?.narrativeSignal?.premarket?.focus).find(item => item?.narrativeLine)
  const latest = isDay(premarket?.latest) ? `最近一期 ${shortDay(premarket.latest)}` : ''
  const fallback = focus?.narrativeLine ? `${focus.narrativeLine}（${focus.symbol || '叙事观察'}）` : feed?.scan?.marketNote || ''
  return {
    text: fallback || '今日盘前简报尚未发布',
    tag: premarket ? (latest || '今日未发布') : '等待接口数据',
    type: premarket ? 'info' : 'info'
  }
}

/** 顶部三项指标：今日信号 / 保护窗口 / 动态管理（按信号交易日统计 events） */
export function summaryMetrics(feed) {
  const day = signalDay(feed)
  const events = asArray(feed?.events).filter(item => item?.occurred_at && zonedDay(item.occurred_at, ET) === day)
  const count = type => events.filter(item => item.event_type === type)
  const latest = list => {
    const last = list.map(item => item.occurred_at).sort().pop()
    return last ? `最近 ${zonedTime(last, ET)} ET` : ''
  }
  const signals = count('SIGNAL_PUBLISHED')
  const protects = count('PROTECTION_WINDOW_OPENED')
  const manages = events.filter(item => ['MANAGEMENT_CARD_ISSUED', 'BUYER_MGMT_CARD_ISSUED'].includes(item.event_type))
  const blocked = asArray(feed?.signals).filter(item => item?.blockReason).length
  const reminders = reminderCards(feed, Infinity).items
  const protectCount = reminders.filter(item => item.type === 'red').length
  const manageCount = reminders.length - protectCount
  return {
    day,
    signals: { value: signals.length, note: blocked ? `另有 ${blocked} 条暂不可开仓` : latest(signals) || '等待终端发布' },
    protects: { value: protectCount, note: latest(protects) || '今日尚未出现' },
    manages: { value: manageCount, note: latest(manages) || '今日无仓位需要动作' }
  }
}

/** 信号卡片 */
export function signalCards(feed) {
  const day = signalDay(feed)
  const seen = new Set()
  const sellers = asArray(feed?.signals).filter(item => {
    const key = item?.id || item?.recommendationId
    if (!item || seen.has(key)) return false
    seen.add(key)
    return true
  }).map(item => ({
    key: item.id,
    title: `${item.symbol}${item.intent ? ` · ${item.intent.replace('SELL', '卖').replace('BUY', '买')}` : ''}`,
    state: item.state || item.lifecycleStage || item.verdict || '已发布',
    blocked: !!item.blockReason,
    summary: item.rationale || item.aiSummary || item.protectionSummary || '',
    fields: [
      { key: 'structure', label: '结构', value: item.structure || '—' },
      { key: 'expiry', label: '到期', value: item.expiry || shortDay(item.expiryDate) || '—' },
      { key: 'credit', label: '入场权利金', value: item.initialCredit || '—' },
      { key: 'mark', label: '当前', value: item.currentMarkValue !== undefined && item.currentMarkValue !== null ? `$${Number(item.currentMarkValue).toFixed(2)}` : item.currentMark || '—' },
      { key: 'pnl', label: '浮动盈亏', value: item.floatingPnl ? `${item.floatingPnl}${item.floatingPnlPct ? `（${item.floatingPnlPct}）` : ''}` : '—' },
      { key: 'risk', label: '最大风险', value: item.maxRisk || '—' }
    ],
    time: item.emittedAt || '',
    isNew: (item.emittedAtUtc && zonedDay(item.emittedAtUtc, ET) === day) || item.date === 'today',
    sortAt: item.emittedAtUtc || ''
  }))
  const buyers = asArray(feed?.buyerSignals).map(item => ({
    key: item.id,
    title: `${item.symbol} · 买方${item.cardLabel ? ` · ${item.cardLabel}` : ''}`,
    state: item.state || item.verdict || '买方信号',
    blocked: false,
    summary: item.aiSummary || item.anchorReason || item.exitPlan || '',
    fields: [
      { key: 'structure', label: '结构', value: item.structure || item.altStructure || '—' },
      { key: 'expiry', label: '到期', value: item.expiry || '—' },
      { key: 'cost', label: '每张成本', value: item.costPerContract !== undefined && item.costPerContract !== null ? formatUsd(item.costPerContract) : '—' },
      { key: 'pnl', label: '浮动盈亏', value: item.floatingPnl || '—' }
    ],
    time: item.emittedAt || '',
    isNew: !!item.emittedAtUtc && zonedDay(item.emittedAtUtc, ET) === day,
    sortAt: item.emittedAtUtc || ''
  }))
  return [...sellers, ...buyers].sort((a, b) => String(b.sortAt).localeCompare(String(a.sortAt)))
}

/** 管理提醒：当日管理卡 + 当日保护窗口 */
export function reminderCards(feed, limit = 12) {
  const day = signalDay(feed)
  const cards = asArray(feed?.managementCards).filter(item => item && !item.retired && item.issuedAtUtc && zonedDay(item.issuedAtUtc, ET) === day).map(item => {
    const expiringSoon = isDay(item.sourceExpiry) && day && item.sourceExpiry <= addDays(day, 3)
    const headline = item.headline && typeof item.headline === 'object' && item.headline.value !== undefined ? `${item.headline.label || '盈亏'} ${formatUsd(item.headline.value)}` : ''
    return {
      key: item.id,
      type: expiringSoon ? 'orange' : 'blue',
      title: `${item.symbol} · ${item.cardTitle || item.eventLabel || '管理卡'}`,
      state: MGMT_KIND[item.kind] || item.scenario || '动态管理',
      summary: item.whyText || item.aiSummary || '',
      fields: [
        { key: 'structure', label: '原结构', value: item.sourceStructure || '—' },
        { key: 'expiry', label: '原到期', value: shortDay(item.sourceExpiry) || '—' },
        { key: 'headline', label: '看板', value: headline || '—' },
        { key: 'steps', label: '步骤', value: item.stepTotal ? `${item.stepIndex || 1}/${item.stepTotal}` : '—' }
      ],
      steps: asArray(item.opSteps),
      time: item.firstConfirmedAtEt || '',
      sortAt: item.issuedAtUtc
    }
  })
  const protects = [...asArray(feed?.protections), ...asArray(feed?.sentProtections)].filter(item => {
    if (!item || item.boardHidden) return false
    const at = item.lastUpdatedAtUtc || item.openedAtUtc
    return at && zonedDay(at, ET) === day
  })
  const seen = new Set()
  const protectCards = protects.filter(item => (seen.has(item.id) ? false : seen.add(item.id))).map(item => ({
    key: item.id,
    type: 'red',
    title: `${item.symbol} · ${item.eventLabel || '保护窗口'}`,
    state: item.progress || '保护提醒',
    summary: item.summary || item.aiSummary || '',
    fields: [
      { key: 'structure', label: '原结构', value: item.sourceStructure || '—' },
      { key: 'candidate', label: '保护结构', value: item.candidateStructure || '—' },
      { key: 'cost', label: '保护成本', value: item.candidateCost || '—' },
      { key: 'reduce', label: '风险降低', value: typeof item.riskReductionPct === 'number' ? `${item.riskReductionPct.toFixed(1)}%` : '—' }
    ],
    steps: [],
    time: item.lastUpdatedAt || item.openedAt || '',
    sortAt: item.lastUpdatedAtUtc || item.openedAtUtc
  }))
  const all = [...protectCards, ...cards].sort((a, b) => String(b.sortAt).localeCompare(String(a.sortAt)))
  return { total: all.length, items: all.slice(0, limit), symbols: new Set(all.map(item => item.title.split(' · ')[0])).size }
}

/** 保证金占用（与 OSM 口径一致：在途组 maxRisk 之和，最近 10 个交易日） */
export function marginStats(feed) {
  const today = marketDay(feed)
  const history = asArray(feed?.history)
  if (!isDay(today) || !history.length) return null
  const settled = new Set(['SETTLED', 'CLOSED', 'EXPIRED'])
  const seen = new Set()
  const rows = history.filter((item, index) => {
    if (!item || typeof item !== 'object') return false
    const key = item.lifecycleId || item.recommendationId || item.id || `#${index}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const risk = item => Math.max(0, toNumber(item.maxRisk) || 0)
  const tpAt = item => item.takeProfitConfirmedAt || item.takeProfitAssumedAt
  const open = rows.filter(item => !settled.has(item.statusCode) && !tpAt(item) && isDay(item.expiryDate) && item.expiryDate >= today)
  const currentUsd = Math.round(open.reduce((sum, item) => sum + risk(item), 0))
  const spans = rows.map(item => {
    const usd = risk(item)
    const start = item.emittedAtUtc ? zonedDay(item.emittedAtUtc, ET) : ''
    if (!usd || !isDay(start)) return null
    const tp = tpAt(item) ? zonedDay(tpAt(item), ET) : ''
    let end = isDay(tp) ? addDays(tp, -1) : item.expiryDate
    if (!isDay(end)) return null
    if (end < start) end = start
    return { start, end, usd }
  }).filter(Boolean)
  const days = []
  let cursor = today
  while (isWeekend(cursor)) cursor = addDays(cursor, -1)
  while (days.length < 15) { days.unshift(cursor); cursor = prevTradingDay(cursor) }
  const series = days.map(day => {
    if (day === today) return { day, usd: currentUsd, count: open.length }
    const active = spans.filter(span => span.start <= day && day <= span.end)
    return { day, usd: Math.round(active.reduce((sum, span) => sum + span.usd, 0)), count: active.length }
  })
  const monday = addDays(today, -((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7))
  const avg = (from, to) => {
    const list = series.filter(item => item.day >= from && item.day <= to)
    return list.length ? Math.round(list.reduce((sum, item) => sum + item.usd, 0) / list.length) : null
  }
  const yesterday = series.find(item => item.day === prevTradingDay(today))
  const last10 = series.slice(-10)
  const max = Math.max(1, ...last10.map(item => item.usd))
  return {
    currentUsd,
    currentCount: open.length,
    yesterday: yesterday ? yesterday.usd : null,
    thisWeek: avg(monday, today),
    lastWeek: avg(addDays(monday, -7), addDays(monday, -3)),
    bars: last10.map((item, index) => ({ ...item, height: Math.max(2, Math.round(item.usd / max * 100)), label: index === last10.length - 1 ? '今天' : item.day.slice(8, 10) })),
    locked: feed?.access?.tier === 'free'
  }
}

/** 今日市场数据面板（12 项） */
export function marketDataEntries(feed, extra = {}) {
  const scan = feed?.scan || {}
  const perf = feed?.performance || {}
  const intel = feed?.publicIntel || {}
  const status = feed?.systemStatus || {}
  const access = extra.entitlement?.access || feed?.access || {}
  const entries = [
    ['市场状态', scan.marketState],
    ['机会密度', scan.opportunityDensity],
    ['扫描候选 / 正式发布', scan.candidates !== undefined ? `${scan.candidates} / ${scan.published ?? scan.formalPublished ?? 0}` : null],
    ['系统状态', status.headline],
    ['胜率', typeof perf.winRate === 'number' ? `${perf.winRate.toFixed(2)}%（${perf.profitable ?? 0} 胜 / ${perf.losses ?? 0} 负）` : null],
    ['已结算盈亏', perf.settledPnlUsd !== undefined ? formatUsd(perf.settledPnlUsd, { sign: true }) : null],
    ['在途浮动盈亏', perf.activePnlUsd !== undefined ? `${formatUsd(perf.activePnlUsd, { sign: true })} · ${perf.activeTotal ?? 0} 组` : null],
    ['今日漏斗', intel.funnel ? `看过 ${intel.funnel.looks} · 可卖 ${intel.funnel.sellable} · 正式 ${intel.funnel.formal}` : null],
    ['会员权益', access.tier ? `${access.tier}${access.planCode ? ` · ${access.planCode}` : ''}${access.trial ? ' · 试用' : ''}` : null],
    ['卖方指引', extra.sellerGuide ? (extra.sellerGuide.pending ? `待完成 v${extra.sellerGuide.currentVersion}` : `已完成 v${extra.sellerGuide.completedVersion}`) : null],
    ['功能更新', extra.updates ? (extra.updates.unseen ? `${extra.updates.unseen} 条未读` : `已读至 #${extra.updates.seenSeq}`) : null],
    ['客服消息', extra.support ? (extra.support.unread ? `${extra.support.unread} 条未读` : `无未读 · ${asArray(extra.support.messages).length} 条消息`) : null]
  ]
  return entries.filter(([, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => ({ key: label, label, value: String(value) }))
}
