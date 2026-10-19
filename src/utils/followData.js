// 「跟踪」页面数据映射：把 /api/member/follow/{kind} 的标记条目整理为卡片展示模型（纯函数，无副作用）
import { formatUsd, shortDay, weekday, zonedDay } from './todayFeed'

export const MARK_FILTERS = [
  { key: 'ALL', label: '全部' },
  { key: 'ADOPT_INTENT', label: '跟了' },
  { key: 'OBSERVE', label: '观察（旧）' },
  { key: 'SKIP', label: '否决' }
]
const KIND_LABEL = { signal: '卖方信号', midterm: '中期信号', buyer: '买方信号', manage: '动态管理' }
const KIND_TONE = { signal: 'blue', midterm: 'purple', buyer: 'green', manage: 'orange' }
const CATEGORY_LABEL = { new: '持有观察', protect: '保护窗口', profit: '止盈确认', settled: '已结算', unknown: '估值待复核' }
const ET = 'America/New_York'

const isDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '')
const text = value => (typeof value === 'string' ? value.trim() : value === null || value === undefined ? '' : String(value))
const num = value => (typeof value === 'number' && Number.isFinite(value) ? value : null)
const toneOf = n => (n === null ? '' : n > 0 ? 'positive' : n < 0 ? 'negative' : '')
const dash = value => (text(value) && text(value) !== '—' ? text(value) : '—')
const ms = value => {
  const t = Date.parse(value || '')
  return Number.isFinite(t) ? t : 0
}

/** "+$1,234" / "−$56" → 数字 */
export function parsePnl(value) {
  const m = /([+\-−]?)\s*\$?([\d,]+(?:\.\d+)?)/.exec(text(value))
  if (!m) return null
  const n = Number(m[2].replace(/,/g, ''))
  if (!Number.isFinite(n)) return null
  return m[1] === '-' || m[1] === '−' ? -n : n
}
export const signedUsd = value => (num(value) === null ? '—' : `${value >= 0 ? '+' : '−'}$${Math.abs(Math.round(value)).toLocaleString('en-US')}`)

/** 标记时间：occurredAt（UTC）→ 美东 MM-DD HH:mm */
function markTime(value) {
  const t = ms(value)
  if (!t) return text(value).slice(5, 16).replace('T', ' ')
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: ET, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(t))
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]))
  return `${p.month}-${p.day} ${p.hour === '24' ? '00' : p.hour}:${p.minute} ET`
}

function markBadge(item) {
  if (item.decisionType === 'ADOPT_INTENT' && item.adoptMode) return { label: item.adoptMode === 'AUTO' ? '自动' : '手动', cls: 'adopt' }
  return { label: item.decisionLabel || item.decisionType || '—', cls: item.markCls || 'skip' }
}

function sellerView(item, row) {
  const pnl = num(item.pnlUsd)
  return {
    title: text(row?.company) && text(row?.company) !== item.symbol ? text(row.company) : text(row?.intent) || KIND_LABEL[item.kind],
    legs: dash(item.structure || row?.structure),
    expiry: item.expiryDate || text(row?.expiryDate),
    headline: { label: item.category === 'settled' ? '结算盈亏' : pnl !== null && pnl < 0 ? '当前浮亏' : '当前浮盈', value: pnl === null ? '—' : signedUsd(pnl), tone: toneOf(pnl) },
    facts: [
      { label: '现价标记', value: dash(item.currentMark).replace(/\s*·.*$/, '') },
      { label: '状态', value: dash(item.state) },
      { label: '组数', value: num(item.quantity) === null ? '—' : `${item.quantity} 组` }
    ]
  }
}

function manageView(item, card) {
  const value = num(card?.headline?.value) ?? num(card?.combinedPnlUsd) ?? num(card?.pnlUsd)
  return {
    title: text(card?.cardTitle) || text(card?.eventLabel) || '管理提醒 · 不在当前账本快照里',
    legs: dash(item.structure || card?.sourceStructure),
    expiry: item.expiryDate || text(card?.sourceExpiry),
    headline: { label: text(card?.headline?.label) || '管理盈亏', value: value === null ? '—' : signedUsd(value), tone: toneOf(value) },
    facts: [
      { label: '现价', value: num(card?.currentSpot) === null ? '—' : `$${card.currentSpot}` },
      { label: '场景', value: dash(card?.scenario) },
      { label: '步骤', value: num(card?.stepTotal) ? `${card.stepIndex}/${card.stepTotal}` : '—' }
    ]
  }
}

function buyerView(item, card) {
  const value = num(card?.headline?.value) ?? num(card?.pnlUsd)
  return {
    title: text(card?.title) || text(card?.cardTitle) || '买方机会 · 不在当前账本快照里',
    legs: dash(text(card?.structureLabel) || (typeof card?.structure === 'string' ? card.structure : '')),
    expiry: text(card?.expiryDate) || text(card?.expiry),
    headline: { label: text(card?.headline?.label) || '参考盈亏', value: value === null ? '—' : signedUsd(value), tone: toneOf(value) },
    facts: [
      { label: '类型', value: dash(card?.kindLabel) },
      { label: '状态', value: dash(card?.status) },
      { label: '发报', value: item.issuedDay ? shortDay(item.issuedDay) : '—' }
    ]
  }
}

/** 单条标记 → 卡片模型 */
export function toMark(item) {
  const card = item.card && typeof item.card === 'object' ? item.card : null
  const row = item.signal && typeof item.signal === 'object' ? item.signal : null
  const view = item.kind === 'manage' ? manageView(item, card) : item.kind === 'buyer' ? buyerView(item, card) : sellerView(item, row)
  if (item.kind === 'midterm' && card?.title) view.title = card.title
  const expiry = isDay(view.expiry) ? view.expiry : ''
  return {
    key: `${item.kind}:${item.eventId || item.cardId}`,
    raw: item,
    kind: item.kind,
    kindLabel: KIND_LABEL[item.kind] || item.kind,
    kindTone: KIND_TONE[item.kind] || 'blue',
    symbol: item.symbol || card?.symbol || row?.symbol || '—',
    ...view,
    expiry,
    expiryLabel: expiry ? `${shortDay(expiry)} 到期` : '到期日 —',
    expiryAt: expiry ? ms(`${expiry}T20:00:00Z`) : Number.MAX_SAFE_INTEGER,
    decisionType: item.decisionType,
    mark: markBadge(item),
    markedAt: markTime(item.occurredAt),
    reason: item.skipReasonLabel || '',
    note: item.note || '',
    category: item.category || '',
    categoryLabel: CATEGORY_LABEL[item.category] || '',
    pnl: item.kind === 'signal' || item.kind === 'midterm' ? num(item.pnlUsd) : null,
    onScreen: item.onScreen !== false,
    archived: !!item.archived,
    sortAt: num(item.sortAt) || ms(item.occurredAt),
    issuedDay: isDay(item.issuedDay) ? item.issuedDay : zonedDay(item.occurredAt, ET) || ''
  }
}

export function toMarks(data) {
  return (data?.items || []).map(toMark)
}

export function issuedLabel(day) {
  return isDay(day) ? `${shortDay(day)} · ${weekday(day)}` : '日期未知'
}

export { formatUsd, toneOf }
