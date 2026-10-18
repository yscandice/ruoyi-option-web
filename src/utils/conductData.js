// 「进行」页面数据映射：把 /api/member/conduct/{scope} 的 OSM 原始条目整理为卡片展示模型（纯函数，无副作用）
import { formatUsd, shortDay, weekday, zonedDay } from './todayFeed'

const MGMT_KIND = { breached: '短腿被穿', breach_step: '分步处理', tested_protect: '测试保护', tested_roll: '测试移仓' }
const TIER_LABEL = { preferred: '优选', core: '核心档', standard: '标准档', caution: '谨慎', watch: '观察' }
const TONE = { orange: 'orange', teal: 'green', green: 'green', slate: 'muted', muted: 'muted', blue: 'blue' }

const isDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '')
const toNumber = value => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value === null || value === undefined || value === '') return null
  const n = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : null
}
const toneOf = n => (n === null ? '' : n > 0 ? 'positive' : n < 0 ? 'negative' : '')
const stripEt = text => String(text || '').replace(/\s*ET$/i, '').trim()
const dayDiff = (from, to) => (isDay(from) && isDay(to) ? Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 864e5) : null)
const signedUsd = value => formatUsd(value, { sign: true })
const clip = (text, max = 96) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  return s.length > max ? `${s.slice(0, max)}…` : s
}

/** 解析 "卖 $725P / 买 $717.5P" → { sell, short, long, side, width } */
export function parseStructure(structure) {
  const text = String(structure || '')
  const legs = [...text.matchAll(/(卖|买)\s*\$?([\d.]+)\s*([PC])/gi)].map(m => ({ action: m[1], strike: Number(m[2]), right: m[3].toUpperCase() }))
  const short = legs.find(l => l.action === '卖')
  const long = legs.find(l => l.action === '买')
  const right = (short || long || {}).right
  const width = short && long ? Math.abs(short.strike - long.strike) : null
  return { sell: legs[0]?.action === '卖', short: short?.strike ?? null, long: long?.strike ?? null, side: right === 'C' ? 'call' : 'put', width }
}

function strategyOf(intent, structure) {
  const parsed = parseStructure(structure)
  const text = String(intent || '').toUpperCase()
  const side = /CALL/.test(text) ? 'call' : /PUT/.test(text) ? 'put' : parsed.side
  const sell = text ? !/^BUY/.test(text) : parsed.sell
  return { side, strategy: `${sell ? '卖方' : '买方'}${side === 'call' ? '看涨' : '看跌'}价差`, parsed }
}

function widthText(width) {
  if (width === null) return '—'
  return `$${Number.isInteger(width) ? width : width.toFixed(1)}`
}

function rewardRiskOf(width, credit) {
  if (!width || !credit || credit >= width) return '—'
  return `1:${((width - credit) / credit).toFixed(1)}`
}

function distanceOf(parsed, spot) {
  if (!parsed.short || !spot) return null
  const pct = (parsed.side === 'call' ? parsed.short - spot : spot - parsed.short) / spot * 100
  return pct
}

const pctText = pct => (pct === null ? '—' : `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`)
const groupText = item => (item.groupShow && item.groupNo ? `第 ${item.groupNo} 组` : '')

function metrics({ pnl, pnlLabel, width, days, distance, riskReward, maxRisk }) {
  const pnlValue = toNumber(pnl)
  const distanceValue = toNumber(distance)
  return [
    { key: 'pnl', label: pnlLabel, value: pnl ?? '—', tone: toneOf(pnlValue) },
    { key: 'width', label: '价差', value: width },
    { key: 'days', label: '剩余', value: days === null ? '—' : days <= 0 ? '已到期' : `${days} 天` },
    { key: 'distance', label: '距离现价', value: distance || '—', tone: toneOf(distanceValue) },
    { key: 'rr', label: '风险收益比', value: riskReward || '—' },
    { key: 'risk', label: '最大风险', value: maxRisk || '—' }
  ]
}

/** 信号卡（进行中 / 已到期 / 历史信号） */
export function signalTrade(item, scope, marketDay) {
  const { side, strategy, parsed } = strategyOf(item.intent, item.structure)
  const credit = toNumber(item.initialCredit)
  const settled = item.statusCode === 'SETTLED'
  const days = dayDiff(marketDay, item.expiryDate)
  let pnlValue = toNumber(item.floatingPnl)
  let pnlLabel = '当前浮盈'
  if (settled) {
    pnlValue = toNumber(item.finalNetPnlUsd ?? item.researchPnlUsd ?? item.floatingPnl)
    pnlLabel = '全周期标记'
  } else if (scope === 'history') pnlLabel = '当前估值'
  // OSM 已给出格式化文本时直接使用，避免 .5 取整与 OSM 显示不一致
  const osmText = /\$/.test(item.floatingPnl || '') && toNumber(item.floatingPnl) === Math.trunc(pnlValue ?? NaN) ? item.floatingPnl.replace(/^\$/, pnlValue > 0 ? '+$' : '$') : ''
  const pnl = pnlValue === null ? '—' : osmText || signedUsd(pnlValue)
  const windows = Number(item.protectionWindowCount) || 0
  const tier = TIER_LABEL[item.qualityTier] || ''
  const subtitle = [item.company && item.company !== item.symbol ? item.company : '', tier ? `${tier}${item.qualityScore ? ` ${item.qualityScore} 分` : ''}` : '', item.lifecycleStage || ''].filter(Boolean).join(' · ') || item.state || ''
  let management = null
  if (settled || scope === 'history') {
    if (item.result) management = { title: item.result, description: item.resultNote || item.rationale || '', value: settled ? '已结算' : (item.state || '') }
  } else if (item.verdict || item.managementNote) {
    management = { title: item.verdict || item.state, description: clip(item.managementNote || item.nextReview), value: windows ? `保护窗口 ${windows} 次` : '' }
  }
  let statusTone = TONE[item.tone] || 'blue'
  if (scope === 'active' && item.statusCode === 'STILL_VALID') statusTone = 'blue'
  return {
    id: `${scope}:${item.id || item.recommendationId || item.symbol + item.emittedAtUtc}`,
    symbol: item.symbol || '—',
    company: item.company || '',
    group: groupText(item),
    strategy,
    side,
    subtitle,
    time: stripEt(item.emittedAt) || shortDay(zonedDay(item.emittedAtUtc)),
    legs: item.structure || '—',
    expiry: item.expiry || shortDay(item.expiryDate) || '—',
    credit: credit === null ? '—' : formatUsd(credit * 100),
    pnlValue,
    days,
    metrics: metrics({ pnl, pnlLabel, width: widthText(parsed.width), days, distance: item.currentDistance, riskReward: item.rewardRisk, maxRisk: item.maxRisk }),
    statusLabel: item.state || item.lifecycleStage || '进行中',
    statusTone,
    stage: settled ? 3 : windows > 0 || Number(item.protectionRecommendationCount) > 0 ? 1 : 0,
    management,
    sentDay: zonedDay(item.emittedAtUtc) || '',
    expiryDay: item.expiryDate || '',
    sortAt: Date.parse(item.activityAtUtc || item.emittedAtUtc || '') || 0,
    dayMove: item.dayMove || '',
    protectionAt: item.firstProtectionWindowAt || '',
    raw: item
  }
}

/** 动态管理卡 */
export function manageTrade(item, marketDay) {
  const { side, strategy, parsed } = strategyOf('', item.sourceStructure)
  const credit = toNumber(item.sourceCredit)
  const days = dayDiff(marketDay, item.sourceExpiry)
  const headline = item.headline || {}
  const pnlValue = toNumber(headline.value)
  const paths = (item.decision && (item.decision.detail_paths || item.decision.paths)) || item.paths || []
  const recommendKey = Array.isArray(item.recommend) ? item.recommend[0] : item.recommend
  const recommended = paths.find(p => p && p.key === recommendKey)
  const contracts = Number(item.contracts) || 1
  const step = item.stepTotal ? `第 ${item.stepIndex}/${item.stepTotal} 步` : ''
  const spot = toNumber(item.currentSpot)
  const spotText = spot === null ? '' : `现价 $${spot.toFixed(2)}${item.spotChangePct !== null && item.spotChangePct !== undefined ? `（${pctText(Number(item.spotChangePct))}）` : ''}`
  const issuedDay = zonedDay(item.issuedAtUtc)
  const breached = item.kind === 'breached' || item.kind === 'breach_step'
  const maxRisk = parsed.width && credit !== null ? formatUsd((parsed.width - credit) * 100 * contracts) : '—'
  return {
    id: `manage:${item.id || item.signalId || item.symbol + item.issuedAtUtc}`,
    symbol: item.symbol || '—',
    company: '',
    group: item.groupShow && item.groupNo ? `第 ${item.groupNo} 组` : '',
    strategy,
    side,
    subtitle: [MGMT_KIND[item.kind] || item.kind, step, spotText].filter(Boolean).join(' · '),
    time: stripEt(item.firstConfirmedAtEt) || (issuedDay ? `${shortDay(issuedDay)} · ${new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(item.issuedAtUtc))}` : ''),
    legs: item.sourceStructure || '—',
    expiry: shortDay(item.sourceExpiry) || '—',
    credit: credit === null ? '—' : formatUsd(credit * 100 * contracts),
    pnlValue,
    days,
    metrics: metrics({ pnl: pnlValue === null ? '—' : signedUsd(pnlValue), pnlLabel: headline.label || '当前浮盈', width: widthText(parsed.width), days, distance: pctText(distanceOf(parsed, spot)), riskReward: rewardRiskOf(parsed.width, credit), maxRisk }),
    statusLabel: MGMT_KIND[item.kind] || '动态管理',
    statusTone: breached ? 'orange' : 'green',
    stage: 2,
    management: { title: item.cardTitle || item.eventLabel || '管理计划已更新', description: clip(item.whyText || item.aiSummary), value: recommended ? `建议：${recommended.name}` : '' },
    sentDay: issuedDay || '',
    expiryDay: item.sourceExpiry || '',
    sortAt: Date.parse(item.issuedAtUtc || '') || 0,
    dayMove: '',
    raw: item
  }
}

/** 保护窗口卡 */
export function protectionTrade(item, marketDay) {
  const { side, strategy, parsed } = strategyOf(item.intent, item.sourceStructure)
  const credit = toNumber(item.sourceCredit)
  const expiryDay = isDay(item.sourceExpiry) ? item.sourceExpiry : ''
  const days = dayDiff(marketDay, expiryDay)
  const pnlValue = toNumber(item.actionFloatingUsd)
  const reduce = toNumber(item.riskReductionPct)
  const cost = toNumber(item.candidateCost)
  return {
    id: `protection:${item.id || item.symbol + item.openedAtUtc}`,
    symbol: item.symbol || '—',
    company: '',
    group: '',
    strategy,
    side,
    subtitle: [item.eventLabel || item.eventKind, item.progress].filter(Boolean).join(' · '),
    time: stripEt(item.lastUpdatedAt || item.openedAt),
    legs: item.sourceStructure || '—',
    expiry: expiryDay ? shortDay(expiryDay) : (item.sourceExpiry || '—'),
    credit: credit === null ? '—' : formatUsd(credit * 100),
    pnlValue,
    days,
    metrics: metrics({ pnl: pnlValue === null ? '—' : signedUsd(pnlValue), pnlLabel: '动作浮盈', width: widthText(parsed.width), days, distance: '—', riskReward: rewardRiskOf(parsed.width, credit), maxRisk: parsed.width && credit !== null ? formatUsd((parsed.width - credit) * 100) : '—' }),
    statusLabel: '保护窗口',
    statusTone: 'orange',
    stage: 1,
    management: { title: item.eventLabel || '保护窗口开启', description: clip(item.summary || (item.candidateStructure ? `候选保护：${item.candidateStructure}` : '')), value: [cost !== null ? `成本 ${formatUsd(cost * (cost < 50 ? 100 : 1))}` : '', reduce !== null ? `降风险 ${reduce.toFixed(0)}%` : ''].filter(Boolean).join(' · ') || '待确认' },
    sentDay: zonedDay(item.lastUpdatedAtUtc || item.openedAtUtc) || '',
    expiryDay,
    sortAt: Date.parse(item.lastUpdatedAtUtc || item.openedAtUtc || '') || 0,
    dayMove: '',
    raw: item
  }
}

export function toTrades(scope, data) {
  const items = Array.isArray(data?.items) ? data.items : []
  const day = data?.marketDay
  if (scope === 'manage') return items.map(item => manageTrade(item, day))
  if (scope === 'protection') return items.map(item => protectionTrade(item, day))
  return items.map(item => signalTrade(item, scope, day))
}

/** 分组标题：10/15 · 周四 发报 */
export function dayLabel(day, suffix) {
  return isDay(day) ? `${shortDay(day)} · ${weekday(day)} ${suffix}` : `日期未知 ${suffix}`
}

/** 交易日所在周（周末取刚结束的一周）的周一到周五 */
export function weekOf(day) {
  if (!isDay(day)) return []
  const base = new Date(`${day}T12:00:00Z`)
  const w = base.getUTCDay()
  const offset = w === 0 ? -6 : w === 6 ? -5 : 1 - w
  return Array.from({ length: 5 }, (_, i) => new Date(base.getTime() + (offset + i) * 864e5).toISOString().slice(0, 10))
}

/** 将 "10/14 · 12:19" 形式（无年份）结合参考年份转换成 yyyy-MM-dd */
export function etLabelDay(label, year) {
  const m = String(label || '').match(/(\d{1,2})\/(\d{1,2})/)
  return m && year ? `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : ''
}

export { toNumber }
