// 「结算」页面数据映射：把 /api/member/settlement/{kind} 的条目整理为卡片展示模型（纯函数，无副作用）
// 卡片字段口径复刻 OSM 已结算卡：最终净结果 = finalNetPnlUsd ?? researchPnlUsd，原价差对照 = researchPnlUsd
const text = value => (typeof value === 'string' ? value.trim() : value === null || value === undefined ? '' : String(value))
const num = value => (typeof value === 'number' && Number.isFinite(value) ? value : null)
const dash = value => (text(value) && text(value) !== '—' ? text(value) : '—')
export const toneOf = n => (n === null || n === undefined ? '' : n > 0 ? 'positive' : n < 0 ? 'negative' : '')

/** 带符号金额：+$1,234 / −$56 */
export const signedUsd = value => (num(value) === null ? '—' : `${value >= 0 ? '+' : '−'}$${Math.abs(Math.round(value)).toLocaleString('en-US')}`)
/** 不带符号金额：$1,234 */
export const plainUsd = value => (num(value) === null ? '—' : `$${Math.abs(Math.round(value)).toLocaleString('en-US')}`)

const KIND_LABEL = { EXPIRY: '到期结算', EARLY_TAKE_PROFIT: '提前止盈' }
const REASON_LABEL = { itm: '价内平仓', near: '接近短腿平仓', otm: '价外到期' }

function strategyOf(item) {
  const intent = text(item.intent).toUpperCase()
  const side = intent.includes('CALL') ? '卖方看涨价差' : intent.includes('PUT') ? '卖方看跌价差' : dash(item.intent)
  return item.recordType === 'midterm' ? `中期 · ${side}` : side
}

/** 发报时间 "10/13 · 12:51 ET" → { day: '10/13', time: '12:51' } */
function issued(item) {
  const m = /(\d{2}\/\d{2})\D+(\d{1,2}:\d{2})/.exec(text(item.sellerSignalAt) || text(item.emittedAt))
  return m ? { day: m[1], time: m[2] } : { day: text(item.issuedDay) || '—', time: '' }
}

/** 结算单 → 一行说明 */
function settleNote(card) {
  if (!card) return null
  const s = card.settlement || {}
  const t = Date.parse(card.emitted_at || '')
  let at = ''
  if (Number.isFinite(t)) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(t)).map(x => [x.type, x.value]))
    at = `${p.month}/${p.day} ${p.hour === '24' ? '00' : p.hour}:${p.minute} ET`
  }
  const facts = [REASON_LABEL[s.reason] || text(s.reason), num(s.spot) === null ? '' : `现价 $${s.spot}`, num(s.short_strike) === null ? '' : `短腿 $${s.short_strike}`].filter(Boolean)
  return { left: `结算单 ${at} · ${facts.join(' · ')}`, right: text(card.structure).replace(/_/g, ' ') }
}

/**
 * 已结算记录 → 卡片模型
 * @param {object} item record 条目
 * @param {Map} cardMap parent_signal_id → 结算单
 */
export function toRecord(item, cardMap = new Map()) {
  const final = num(item.finalNetPnlUsd)
  const research = num(item.researchPnlUsd)
  const net = final ?? research
  const contribution = final !== null && research !== null ? final - research : null
  const roll = item.rollFrom && typeof item.rollFrom === 'object' && item.rollFrom.parentExpiry && item.rollFrom.parentStructure ? item.rollFrom : null
  const holding = num(item.holdingTradingDays)
  const windows = num(item.protectionWindowCount)
  const managements = Array.isArray(item.managements) ? item.managements : []
  const protections = Array.isArray(item.protections) ? item.protections : []
  const card = [item.id, item.recommendationId, item.signalId].map(id => cardMap.get(text(id))).find(Boolean)
  const when = issued(item)
  return {
    id: text(item.id) || `${item.symbol}-${item.sortAtMs}`,
    raw: item,
    groupDay: text(item.groupDay) || text(item.settledDay) || '—',
    settledDay: text(item.settledDay) || '—',
    symbol: text(item.symbol),
    company: text(item.company),
    kind: roll ? '移仓继承 · 已结算' : (item.recordType === 'midterm' ? '中期 · ' : '') + (KIND_LABEL[item.resultKind] || dash(item.state)),
    openDate: when.day,
    time: when.time,
    group: item.groupShow && num(item.groupNo) ? `第 ${item.groupNo} 组` : '',
    strategy: strategyOf(item),
    legs: dash(item.structure),
    expiry: dash(item.expiry || text(item.expiryDate).slice(5).replace('-', '/')),
    resultLabel: final === null ? '管理后盈亏' : '最终净结果',
    net: signedUsd(net),
    resultTone: toneOf(net) || 'positive',
    netLabel: roll ? '移仓口径净' : '管理后净结果',
    final: signedUsd(final),
    finalTone: toneOf(final),
    baselineLabel: roll ? '不移仓对照' : '原价差对照',
    baseline: signedUsd(research),
    baselineTone: toneOf(research),
    contribution: signedUsd(contribution),
    contributionTone: toneOf(contribution),
    holding: holding === null ? '—' : `${holding} 个交易日`,
    protectionCount: windows === null ? '—' : `${windows} 次`,
    premium: dash(item.initialCredit),
    maxRisk: dash(item.maxRisk),
    closeLabel: dash(item.state),
    note: dash(item.resultNote),
    isRoll: !!roll,
    rollDescription: roll ? `${roll.parentExpiry} 的 ${roll.parentStructure} 按「${text(roll.pathLabel) || '移仓'}」移来${text(roll.debitText) ? ` · ${roll.debitText}` : ''}` : '',
    cumulative: roll && num(roll.netCreditUsd) !== null ? signedUsd(roll.netCreditUsd) : '',
    protected: windows !== null ? windows > 0 : !!item.firstProtectionWindowAt,
    managed: managements.length > 0,
    trail: [managements.length ? `管理 ${managements.length} 次` : '', protections.length ? `保护 ${protections.length} 条` : ''].filter(Boolean).join(' · ') || (item.recordType === 'midterm' ? '中期影子卡' : '无管理记录'),
    settle: settleNote(card)
  }
}

/** 结算单列表 → parent_signal_id 索引（同一信号取最新一张） */
export function indexCards(cards) {
  const map = new Map()
  for (const card of cards || []) {
    const key = text(card.parent_signal_id)
    if (key && !map.has(key)) map.set(key, card)
  }
  return map
}

/** 区间 / 自定义日期 → 接口参数 */
export function recordParams(range, sort, from, to) {
  const params = { range, sort: sort === 'issued' ? 'issued' : 'settled' }
  if (range === 'custom') {
    if (from) params.from = from
    if (to) params.to = to
  }
  return params
}
