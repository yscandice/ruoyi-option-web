// 「进行」页（active-longbridge 设计稿）展示模型：把 /api/member/conduct/{scope} 的 OSM 条目整理成卡片 / 表格 / 侧栏数据（纯函数）
// 免费档时 OSM 只给延迟或锁定字段：缺的字段显示 “—” 或“仅实时会员可见”，不生成任何模拟数值
import { parseStructure, toNumber } from './conductData'
import { formatUsd, shortDay, weekday, zonedDay } from './todayFeed'

const arr = v => (Array.isArray(v) ? v : [])
const isDay = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '')
const TIER = { preferred: '优选档', core: '核心档', standard: '标准档', light: '轻仓档', caution: '谨慎档', watch: '观察' }
export const sgn = n => (n === null || n === undefined || !Number.isFinite(n) ? '—' : n > 0 ? `+$${Math.round(n).toLocaleString('en-US')}` : n < 0 ? `−$${Math.abs(Math.round(n)).toLocaleString('en-US')}` : '$0')
export const plCls = n => (n === null || n === undefined || !Number.isFinite(n) ? 'flat' : n > 0 ? 'up' : n < 0 ? 'down' : 'flat')
const kOf = n => (n === null || !Number.isFinite(n) ? 'flat' : n > 0 ? 'up' : n < 0 ? 'dn' : 'flat')
const stripEt = t => String(t || '').replace(/\s*ET$/i, '').trim()
const etTime = utc => {
  const d = new Date(utc || '')
  if (Number.isNaN(d.getTime())) return ''
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).map(x => [x.type, x.value]))
  return `${p.month}/${p.day} · ${String(+p.hour % 24).padStart(2, '0')}:${p.minute}`
}
const dayDiff = (from, to) => (isDay(from) && isDay(to) ? Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 864e5) : null)
const money1 = v => { const n = toNumber(v); return n === null ? '—' : `$${n.toFixed(2)}` }
const widthTxt = w => (w === null || w === undefined ? '—' : `$${Number.isInteger(w) ? w : w.toFixed(1)}`)

function typeOf(intent, structure, category) {
  const p = parseStructure(structure)
  const t = String(intent || '').toUpperCase()
  const side = /CALL/.test(t) ? 'call' : /PUT/.test(t) ? 'put' : p.side
  const sell = t ? !/^BUY/.test(t) : category ? category !== 'buyer' : p.sell
  return { side, sell, label: `${sell ? '卖方' : '买方'}${side === 'call' ? '看涨' : '看跌'}价差`, p }
}
const stageOf = item => (item.statusCode === 'SETTLED' ? 3 : arr(item.rollChain?.steps).length || toNumber(item.confirmedProtectionCount) ? 2 : toNumber(item.protectionWindowCount) || toNumber(item.protectionRecommendationCount) ? 1 : 0)

/** 动态管理卡按原信号归组（signalId / recommendationId） */
export function manageIndex(manage) {
  const map = new Map()
  for (const m of arr(manage?.items)) {
    for (const k of [m.signalId, m.recommendationId].filter(Boolean)) {
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(m)
    }
  }
  return map
}
const mgKind = label => String(label || '').split('·')[0].trim() || '管理卡'
function dmOf(item, index) {
  const list = [...new Map([...(index?.get(item.id) || []), ...(index?.get(item.recommendationId) || [])].map(m => [m.id, m])).values()]
  const rows = list.map(m => ({ key: m.id, time: etTime(m.issuedAtUtc), kind: mgKind(m.eventLabel), tag: m.locked ? '仅实时会员' : (m.stepTotal ? `第 ${m.stepIndex}/${m.stepTotal} 步` : '管理'), desc: String(m.eventLabel || '').split('·').slice(1).join('·').trim() || m.cardTitle || '', legs: m.sourceStructure || '', pnl: toNumber(m.headline?.value), at: Date.parse(m.issuedAtUtc || '') || 0 }))
  for (const s of arr(item.rollChain?.steps)) {
    const short = toNumber(s.shortStrike), long = toNumber(s.longStrike)
    rows.push({ key: `roll-${s.day}-${short}`, time: shortDay(s.day), kind: '移仓', tag: s.expiry ? `到期 ${shortDay(s.expiry)}` : '移仓', desc: s.netDebit !== undefined ? `移仓净付 ${money1(s.netDebit)}` : '移仓', legs: short !== null && long !== null ? `卖 $${short} / 买 $${long}` : '', pnl: null, at: Date.parse(`${s.day}T20:00:00Z`) || 0 })
  }
  return rows.sort((a, b) => b.at - a.at)
}

/** 信号卡（进行中 / 已到期） */
export function signalCard(item, scope, marketDay, index) {
  const { side, sell, label, p } = typeOf(item.intent, item.structure, item.category)
  const settled = item.statusCode === 'SETTLED'
  const credit = toNumber(item.initialCredit)
  const days = dayDiff(marketDay, item.expiryDate)
  const delayed = !!item.delayed && (item.floatingPnl === '—' || item.floatingPnl === undefined)
  const pnl = settled ? toNumber(item.finalNetPnlUsd ?? item.researchPnlUsd) : delayed ? null : toNumber(item.floatingPnl)
  const mid = /中期/.test(item.signalKindLabel || '') || item.horizon === 'mid'
  const k = !sell ? (mid ? 'mid' : 'buy') : kOf(pnl)
  const tags = [{ text: label, cls: 'c' }]
  if (TIER[item.qualityTier]) tags.push({ text: TIER[item.qualityTier] })
  if (item.state && !settled) tags.push({ text: item.state, cls: item.statusCode === 'STILL_VALID' ? 'ok' : '' })
  if (settled) tags.push({ text: '已到期结算', cls: '' })
  const sub = item.statusCode === 'SETTLED' ? '' : (toNumber(item.rollChain?.pnlUsd) !== null && arr(item.rollChain?.steps).length ? `管理盈亏 ${sgn(item.rollChain.pnlUsd)}` : '')
  let met
  if (settled) {
    const managed = toNumber(item.rollChain?.pnlUsd ?? item.finalNetPnlUsd)
    const raw = toNumber(item.rollChain?.originalPnlUsd ?? item.originalExitPnlUsd)
    met = [
      { l: '管理后净', v: sgn(managed), c: plCls(managed) },
      { l: '原价差对照', v: sgn(raw), c: plCls(raw) },
      { l: '持有', v: item.holdingTradingDays ? `${item.holdingTradingDays} 个交易日` : '—' },
      { l: '保护窗口', v: item.protectionWindowCount !== undefined && item.protectionWindowCount !== null ? `${item.protectionWindowCount} 次` : '—' },
      { l: '入场权利金 / 最大风险', v: `${item.initialCredit || '—'} / ${item.maxRisk || '—'}`, c: 'sm' },
      { l: '结果', v: item.resultKind === 'EXPIRY' ? '到期结算' : (item.state || '—') }
    ]
  } else {
    met = [
      { l: '价差', v: widthTxt(p.width) },
      { l: '剩余', v: days === null ? '—' : days <= 0 ? '今天到期' : `${days} 天` },
      { l: '距离现价', v: item.currentDistance && item.currentDistance !== '—' ? item.currentDistance : (item.initialDistance ? `发报 ${item.initialDistance}` : '—'), c: item.currentDistance && item.currentDistance !== '—' ? '' : 'sm' },
      { l: '中间价 / 股', v: item.initialCredit || '—' },
      { l: '风险收益比', v: item.rewardRisk || '—' },
      { l: '最大风险', v: item.maxRisk || '—' }
    ]
  }
  const dm = dmOf(item, index)
  return {
    id: `${scope}:${item.id}`, sym: item.symbol || '—', grp: item.groupShow && item.groupNo ? `第${item.groupNo}组` : '', k, tags,
    time: stripEt(item.emittedAt) ? `${stripEt(item.emittedAt)} ET` : '',
    small: `${sell ? '卖方' : '买方'}${settled ? '' : pnl === null ? '' : pnl >= 0 ? ' · 浮盈' : ' · 浮亏'} · 到期 ${item.expiry || shortDay(item.expiryDate) || '—'}${credit !== null ? ` · 收 ${formatUsd(credit * 100)}` : ''}`,
    legs: item.structure || '—',
    plLabel: settled ? '最终净结果' : sell ? '当前浮盈' : '每组成本', plValue: !sell && !settled ? (credit !== null ? formatUsd(credit * 100) : '—') : sgn(pnl), plCls: !sell && !settled ? 'flat' : plCls(pnl), plSub: sub,
    orig: delayed ? { a: item.verdict || '延迟数据', b: item.managementNote || item.protectionSummary || '', c: '' } : null,
    met, step: settled ? 4 : stageOf(item), lastStep: settled ? '结算' : '到期结算',
    evid: settled ? `证据身份 · ${item.recommendationId || item.id}${item.resultNote ? ` · ${item.resultNote}` : ''}` : '',
    dm,
    sentDay: zonedDay(item.emittedAtUtc) || '', expiryDay: item.expiryDate || '', sortAt: Date.parse(item.activityAtUtc || item.emittedAtUtc || '') || 0, emittedAt: Date.parse(item.emittedAtUtc || '') || 0,
    pnl, days, share: `${item.symbol} ${label} ${item.structure || ''} · 到期 ${item.expiry || ''} · ${settled ? '最终净结果' : '当前浮盈'} ${sgn(pnl)}`
  }
}

/** 保护窗口卡 */
export function protectionCard(item, marketDay) {
  const { label, p } = typeOf(item.intent, item.sourceStructure)
  const locked = !!item.locked
  const gain = toNumber(item.favorableMovePct ?? item.improvementPct)
  const cost = toNumber(item.candidateCost)
  const credit = toNumber(item.sourceCredit)
  const exp = isDay(item.sourceExpiry) ? shortDay(item.sourceExpiry) : (item.sourceExpiry || '—')
  const met = locked
    ? [{ l: '原信号发报', v: stripEt(item.signalEmittedAt) || '—', c: 'sm' }, { l: '窗口出现', v: stripEt(item.openedAt) || '—', c: 'sm' }, { l: '最近更新', v: stripEt(item.lastUpdatedAt) || '—', c: 'sm' }, { l: '原组合到期', v: exp }, { l: '剩余', v: (d => (d === null ? '—' : d <= 0 ? '今天到期' : `${d} 天`))(dayDiff(marketDay, item.sourceExpiry)) }, { l: '保护细节', v: '仅实时会员', c: 'sm' }]
    : [{ l: '原卖方浮盈', v: sgn(toNumber(item.sourceFloatingUsd)), c: plCls(toNumber(item.sourceFloatingUsd)) }, { l: '保护花多少', v: cost === null ? '—' : `$${cost.toFixed(2)}` }, { l: '能挡多少', v: item.blockUsd ? sgn(toNumber(item.blockUsd)).replace('+', '') : '—' }, { l: '降风险', v: toNumber(item.riskReductionPct) === null ? '—' : `${toNumber(item.riskReductionPct).toFixed(0)}%` }, { l: '价差', v: widthTxt(p.width) }, { l: '原组合收', v: credit === null ? '—' : formatUsd(credit * 100) }]
  return {
    id: `protection:${item.id}`, sym: item.symbol || '—', grp: '', k: 'prot', logo: '◇',
    tags: [{ text: item.eventLabel || '保护窗口', cls: 'c' }, ...(locked ? [{ text: '仅实时会员可见' }] : [])],
    time: stripEt(item.lastUpdatedAt || item.openedAt) ? `${stripEt(item.lastUpdatedAt || item.openedAt)} ET` : '',
    small: locked ? `原${label} · 到期 ${exp}` : '保护腿', legs: locked ? (item.sourceStructure || '保护结构仅实时会员可见') : (item.candidateStructure || item.sourceStructure || '—'),
    plLabel: '有利变动', plValue: gain === null ? '—' : `${gain > 0 ? '+' : ''}${gain.toFixed(2)}%`, plCls: gain === null ? 'flat' : gain >= 0 ? 'up' : 'down', plSub: '',
    orig: !locked && item.sourceStructure ? { a: '原卖方', b: `${item.sourceStructure} · ${exp}${credit !== null ? ` · 收 ${formatUsd(credit * 100)}` : ''}`, c: '' } : null,
    met, step: 1, lastStep: '到期结算', evid: '', dm: [],
    sentDay: zonedDay(item.lastUpdatedAtUtc || item.openedAtUtc) || '', expiryDay: isDay(item.sourceExpiry) ? item.sourceExpiry : '', sortAt: Date.parse(item.lastUpdatedAtUtc || item.openedAtUtc || '') || 0,
    pnl: gain, share: `${item.symbol} ${item.eventLabel || '保护窗口'} · 原组合到期 ${exp}`
  }
}

const MG_ICON = { 移仓卡: '↻', 对冲卡: '◇', 平仓卡: '▲', 止损卡: '■', 止盈卡: '✓', 保护卡: '◇', 到期前一天: '◷' }
/** 动态管理卡 */
export function manageCard(item, marketDay) {
  const label = String(item.eventLabel || '动态管理')
  const kind = mgKind(label)
  const locked = !!item.locked
  const pnl = toNumber(item.headline?.value)
  const exp = isDay(item.sourceExpiry) ? shortDay(item.sourceExpiry) : '—'
  const d = dayDiff(marketDay, item.sourceExpiry)
  const prot = /平仓|止损/.test(kind)
  const met = locked
    ? [{ l: '卡型', v: kind }, { l: '原组合到期', v: exp }, { l: '剩余', v: d === null ? '—' : d <= 0 ? '已到期' : `${d} 天` }, { l: '组数', v: `${item.contracts || 1} 组` }, { l: '发出', v: etTime(item.issuedAtUtc) || '—', c: 'sm' }, { l: '管理细节', v: '仅实时会员', c: 'sm' }]
    : [{ l: '卡型', v: kind }, { l: '原组合到期', v: exp }, { l: '剩余', v: d === null ? '—' : `${d} 天` }, { l: '组数', v: `${item.contracts || 1} 组` }, { l: '现价', v: item.currentSpot ? money1(item.currentSpot) : '—' }, { l: '建议', v: item.recommend ? String(item.recommend) : '—', c: 'sm' }]
  return {
    id: `manage:${item.id}`, sym: item.symbol || '—', grp: item.groupShow && item.groupNo ? `第${item.groupNo}组` : '', k: pnl === null ? (prot ? 'prot' : 'mid') : kOf(pnl), logo: MG_ICON[kind] || '◇',
    tags: [{ text: label, cls: 'c' }, ...(locked ? [{ text: '仅实时会员可见' }] : [])],
    time: etTime(item.issuedAtUtc) ? `${etTime(item.issuedAtUtc)} ET` : '',
    small: '管理腿', legs: locked ? '管理结构仅实时会员可见' : (item.sourceStructure || '—'),
    plLabel: item.headline?.label || '当前浮盈', plValue: sgn(pnl), plCls: plCls(pnl), plSub: '',
    orig: null, met, step: 2, lastStep: prot ? '止损' : '到期结算', evid: '', dm: [],
    sentDay: zonedDay(item.issuedAtUtc) || '', expiryDay: isDay(item.sourceExpiry) ? item.sourceExpiry : '', sortAt: Date.parse(item.issuedAtUtc || '') || 0,
    pnl, share: `${item.symbol} ${label} · 原组合到期 ${exp}`
  }
}

/** 分组（按发报日 / 到期日） */
export function groupByDay(cards, mode = 'sent', desc = true) {
  const map = new Map()
  for (const c of cards) {
    const day = mode === 'sent' ? c.sentDay : c.expiryDay
    if (!map.has(day)) map.set(day, { day, label: isDay(day) ? shortDay(day) : '日期未知', week: isDay(day) ? weekday(day) : '', items: [] })
    map.get(day).items.push(c)
  }
  return [...map.values()].sort((a, b) => (desc ? (b.day || '').localeCompare(a.day || '') : (a.day || '9').localeCompare(b.day || '9')))
}

/** 已到期 / 历史信号汇总 */
export function settleStats(items) {
  const list = arr(items)
  const settled = list.filter(i => i.statusCode === 'SETTLED')
  const vals = settled.map(i => toNumber(i.finalNetPnlUsd ?? i.researchPnlUsd)).filter(v => v !== null)
  const pos = vals.filter(v => v > 0).length
  return { total: list.length, settled: settled.length, priced: vals.length, pending: settled.length - vals.length, pos, neg: vals.filter(v => v < 0).length, sum: vals.reduce((s, v) => s + v, 0), rate: vals.length ? pos / vals.length * 100 : null }
}
export function historyRows(items) {
  return arr(items).map(i => {
    const v = toNumber(i.finalNetPnlUsd ?? i.researchPnlUsd ?? i.floatingPnl)
    return { id: i.id, sym: i.symbol, grp: i.groupShow && i.groupNo ? `第${i.groupNo}组` : '', legs: i.structure || '—', sent: shortDay(zonedDay(i.emittedAtUtc)), exp: i.expiry || shortDay(i.expiryDate), v, at: Date.parse(i.emittedAtUtc || '') || 0 }
  }).sort((a, b) => b.at - a.at)
}

/** 本周：按交易日统计 新卖方 / 保护窗 / 各类管理卡；到期日标「到期」 */
export function weekDesk(marketDay, cache) {
  if (!isDay(marketDay)) return null
  const base = new Date(`${marketDay}T12:00:00Z`), w = base.getUTCDay()
  const offset = w === 0 ? -6 : w === 6 ? -5 : 1 - w
  const days = Array.from({ length: 5 }, (_, i) => new Date(base.getTime() + (offset + i) * 864e5).toISOString().slice(0, 10))
  const inWeek = d => days.includes(d)
  const sig = new Map()
  for (const s of ['history', 'active']) for (const i of arr(cache[s]?.items)) if (i.id) sig.set(i.id, i)
  const signals = [...sig.values()].filter(i => inWeek(zonedDay(i.emittedAtUtc)))
  const prots = arr(cache.protection?.items).filter(i => inWeek(zonedDay(i.openedAtUtc)))
  const mgs = arr(cache.manage?.items).filter(i => inWeek(zonedDay(i.issuedAtUtc)))
  const expiries = new Set([...arr(cache.active?.items).map(i => i.expiryDate), ...arr(cache.manage?.items).map(i => i.sourceExpiry)])
  const cells = days.map((d, i) => {
    const future = d > marketDay
    const n = signals.filter(x => zonedDay(x.emittedAtUtc) === d).length + prots.filter(x => zonedDay(x.openedAtUtc) === d).length + mgs.filter(x => zonedDay(x.issuedAtUtc) === d).length
    return { day: d, label: '一二三四五'[i] + (d === marketDay ? ' · 今天' : ''), today: d === marketDay, exp: future && expiries.has(d), value: future ? (expiries.has(d) ? '到期' : '—') : String(n) }
  })
  const kinds = {}
  for (const m of mgs) { const k = mgKind(m.eventLabel); kinds[k] = (kinds[k] || 0) + 1 }
  const COLORS = { 移仓卡: '#a8aaad', 对冲卡: '#3b82f6', 平仓卡: '#a855f7', 止损卡: '#ef4444', 止盈卡: '#16a34a', 到期前一天: '#f59e0b' }
  const stack = [{ label: '新卖方', count: signals.length, color: '#070a13' }, { label: '保护窗', count: prots.length, color: '#00b8b8' }, ...Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ label: k.replace(/卡$/, ''), count: n, color: COLORS[k] || '#d1d5db' }))].filter(s => s.count)
  return { range: `${shortDay(days[0])}–${shortDay(days[4])}`, cells, total: signals.length + prots.length + mgs.length, stack }
}
