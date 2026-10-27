// 「跟踪」页（tracks-longbridge 设计稿）展示模型：把 /api/member/follow/{kind} 的标记条目整理成路径卡（纯函数）
// 卡头复用「进行」页的卡片模型（signal / midterm 关联 feed 信号，manage 关联管理卡）；找不到关联卡片时渲染“快照外”灰卡
import { manageCard, sgn, plCls, signalCard } from './conductDesk'
import { shortDay, zonedDay } from './todayFeed'

const ET = 'America/New_York'
const isDay = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '')
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const txt = v => (v === null || v === undefined ? '' : String(v).trim())

export const MARK_SEG = [
  { key: 'ALL', label: '全部' },
  { key: 'ADOPT_INTENT', label: '跟了' },
  { key: 'OBSERVE', label: '观察（旧）' },
  { key: 'SKIP', label: '否决' }
]

function etStamp(iso) {
  const d = new Date(iso || '')
  if (Number.isNaN(d.getTime())) return ''
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: ET, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).map(x => [x.type, x.value]))
  return `${p.month}/${p.day} ${String(+p.hour % 24).padStart(2, '0')}:${p.minute}`
}

/** 标记徽章：跟了按 自动 / 手动 区分 */
function markOf(item) {
  if (item.decisionType === 'ADOPT_INTENT') return item.adoptMode === 'AUTO' ? { cls: 'auto', label: '自动' } : item.adoptMode === 'MANUAL' ? { cls: 'manual', label: '手动' } : { cls: 'manual', label: item.decisionLabel || '跟了' }
  if (item.decisionType === 'OBSERVE') return { cls: 'observe', label: item.decisionLabel || '观察（旧）' }
  return { cls: 'skip', label: item.decisionLabel || '否决' }
}

const CAT_TAG = { protect: { text: '保护窗口已出现', cls: 'ok' }, profit: { text: '止盈条件已确认', cls: 'ok' }, unknown: { text: '估值待复核' } }

function buyerCard(item, card) {
  const locked = !!card.locked
  const v = num(card.headline?.value) ?? num(card.pnlUsd)
  const cost = num(card.costUsd) ?? num(card.debitUsd)
  const legs = txt(card.structureLabel) || (typeof card.structure === 'string' ? card.structure : '') || (locked ? '结构仅实时会员可见' : '—')
  const exp = txt(card.expiryDate) || txt(card.expiry)
  const mid = /中期|mid/i.test(txt(card.horizon) + txt(card.kindLabel))
  const met = [
    { l: 'RSI', v: txt(card.rsi) || '—' },
    { l: '剩余', v: txt(card.daysLeft) ? `${card.daysLeft} 天` : '—' },
    { l: '距离现价', v: txt(card.distance) || '—' },
    { l: '方向', v: card.sideLetter === 'C' ? '看涨' : card.sideLetter === 'P' ? '看跌' : '—' },
    { l: '发报', v: txt(card.emittedAt).replace(/\s*ET$/, '') || '—', c: 'sm' },
    { l: '细节', v: locked ? '仅实时会员' : (txt(card.status) || '—'), c: 'sm' }
  ]
  return {
    id: `buyer:${item.cardId || card.id}`, sym: item.symbol || card.symbol || '—', grp: '', k: mid ? 'mid' : 'buy',
    tags: [{ text: txt(card.title) || txt(card.kindLabel) || '买方信号', cls: 'c' }, ...(locked ? [{ text: '仅实时会员可见' }] : [])],
    time: txt(card.emittedAt) || '', small: `${mid ? '中期' : '买方'}${exp ? ` · 到期 ${isDay(exp) ? shortDay(exp) : exp}` : ''}`, legs,
    plLabel: v !== null ? (txt(card.headline?.label) || '参考盈亏') : '每组成本', plValue: v !== null ? sgn(v) : cost !== null ? `$${Math.round(cost).toLocaleString('en-US')}` : '—', plCls: v !== null ? plCls(v) : 'flat', plSub: '',
    orig: null, met, step: 0, lastStep: '到期结算', evid: '', dm: [], pnl: v
  }
}

function blockCard(item, label) {
  return {
    id: `${item.kind}:${item.eventId || item.cardId}`, sym: item.symbol || '—', k: 'gray', block: label,
    logo: item.kind === 'manage' ? '◎' : '○', time: etStamp(item.occurredAt) ? `${etStamp(item.occurredAt)} ET` : '',
    legs: txt(item.structure) && txt(item.structure) !== '—' ? item.structure : '—', small: item.expiryDate ? `到期 ${shortDay(item.expiryDate)}` : ''
  }
}

/** 单条标记 → 卡片模型（含底部标记行） */
export function trackCard(item, marketDay) {
  const kind = item.kind
  let card
  if ((kind === 'signal' || kind === 'midterm') && item.signal && typeof item.signal === 'object' && item.onScreen !== false) {
    card = signalCard(item.signal, 'track', marketDay, null)
    if (kind === 'midterm') card.k = 'mid'
    const settled = item.category === 'settled'
    const pnl = num(item.pnlUsd)
    if (!settled && pnl !== null && card.plLabel === '当前浮盈') { card.plValue = sgn(pnl); card.plCls = plCls(pnl); card.pnl = pnl; card.k = kind === 'midterm' ? 'mid' : pnl > 0 ? 'up' : pnl < 0 ? 'dn' : 'flat' }
    if (CAT_TAG[item.category]) card.tags = [...card.tags.filter(t => t.text !== CAT_TAG[item.category].text), CAT_TAG[item.category]]
  } else if (kind === 'manage' && item.card && typeof item.card === 'object' && item.onScreen !== false) {
    card = { ...manageCard(item.card, marketDay), logo: '' }
  } else if (kind === 'buyer' && item.card && typeof item.card === 'object' && item.onScreen !== false) {
    card = buyerCard(item, item.card)
  } else {
    card = blockCard(item, kind === 'manage' ? '管理提醒 · 不在当前账本快照里' : kind === 'buyer' ? '买方机会 · 不在当前账本快照里' : '快照外 · 估值待复核')
  }
  const issuedDay = isDay(item.issuedDay) ? item.issuedDay : zonedDay(item.occurredAt) || ''
  const expiry = isDay(item.expiryDate) ? item.expiryDate : card.expiryDay || ''
  return {
    ...card,
    key: `${kind}:${item.eventId || item.cardId || item.signalId}`,
    kind, decisionType: item.decisionType, category: item.category || '',
    mark: markOf(item), at: etStamp(item.occurredAt), why: txt(item.skipReasonLabel),
    lots: item.decisionType === 'ADOPT_INTENT' && num(item.quantity) ? item.quantity : null,
    note: txt(item.note).replace(/^系统参考[：:]\s*/, ''),
    issuedDay, expiry, expiryAt: expiry ? Date.parse(`${expiry}T20:00:00Z`) : Number.MAX_SAFE_INTEGER,
    sortAt: num(item.sortAt) || Date.parse(item.occurredAt || '') || 0,
    archived: !!item.archived, onScreen: item.onScreen !== false,
    detail: kind === 'manage' || kind === 'buyer' ? '/today' : '/active'
  }
}

/** 计数口径与 OSM 一致：卖方 + 中期 + 买方（动态管理不计入） */
export function markCounts(cards) {
  const c = { ALL: 0, ADOPT_INTENT: 0, OBSERVE: 0, SKIP: 0 }
  for (const m of cards) if (m.kind !== 'manage') { c.ALL += 1; if (m.decisionType in c) c[m.decisionType] += 1 }
  return c
}

/** 列表：筛选 → 排序 → 按发报日分组（按到期日时为单组） */
export function trackGroups(cards, { mark = 'ALL', q = '', sort = 'issued' } = {}) {
  const Q = q.trim().toUpperCase()
  const list = cards.filter(c => !c.archived && (mark === 'ALL' || c.decisionType === mark) && (!Q || String(c.sym).toUpperCase().includes(Q)))
  if (sort === 'expiry') return list.length ? [{ key: 'expiry', title: '按到期日', sub: '快到期的在前', items: [...list].sort((a, b) => a.expiryAt - b.expiryAt || b.sortAt - a.sortAt) }] : []
  const map = new Map()
  for (const c of [...list].sort((a, b) => b.sortAt - a.sortAt)) {
    const d = c.issuedDay || '—'
    if (!map.has(d)) map.set(d, [])
    map.get(d).push(c)
  }
  return [...map.entries()].map(([d, items]) => ({ key: d, title: isDay(d) ? shortDay(d) : '日期未知', sub: '发报', items }))
}
