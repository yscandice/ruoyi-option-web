// 「战绩」页面数据映射（纯函数，无副作用）：把 /api/member/record/{kind} 的条目整理为页面展示模型
// 口径复刻 OSM 战绩页：管理后净结果 = pnl，原价差对照 = rawPnl；excluded 的明细不计入统计，pnl 为空的记为待复核
export const num = value => (typeof value === 'number' && Number.isFinite(value) ? value : null)
const text = value => (value === null || value === undefined ? '' : String(value).trim())

/** 带符号金额：+$1,234 / −$56 / $0 */
export function money(value) {
  if (num(value) === null) return '—'
  const amount = Math.abs(Math.round(value)).toLocaleString('en-US')
  return `${value < 0 ? '−' : value > 0 ? '+' : ''}$${amount}`
}
/** 不带符号金额：$1,234 */
export const plainUsd = value => (num(value) === null ? '—' : `$${Math.abs(Math.round(value)).toLocaleString('en-US')}`)
export const tone = value => (num(value) === null ? 'neutral' : value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral')

/** 战绩明细 → 表格行 */
export function toRecord(item, index = 0) {
  const pnl = num(item.pnl)
  const baseline = num(item.rawPnl)
  const risk = num(item.maxRisk) ?? num(Number(text(item.maxRisk).replace(/[$,\s]/g, '')) || null)
  return {
    id: text(item.id) || `${item.symbol}-${index}`,
    symbol: text(item.symbol) || '—',
    company: text(item.company),
    legs: text(item.structure) || '—',
    intent: text(item.intent),
    expiry: text(item.expiry) || text(item.expiryDate).slice(5).replace('-', '/') || '—',
    expiryDate: text(item.expiryDate),
    day: text(item.day),
    closeDate: text(item.day) ? text(item.day).slice(5).replace('-', '/') : text(item.resultObservedAt).slice(0, 5) || '—',
    credit: num(item.premiumUsd),
    risk,
    days: num(item.holdingDays),
    protection: num(item.protectionCostUsd) ?? 0,
    basis: text(item.outcomeLabel) || (item.outcome === 'EARLY_TAKE_PROFIT' ? '提前止盈' : '到期结算'),
    outcome: text(item.outcome),
    pnl,
    baseline,
    pending: item.pendingReview === true || pnl === null,
    excluded: item.excluded === true,
    exclusionReason: text(item.exclusionReason),
    lots: num(item.adoptedLots)
  }
}

/** 明细统计（与 OSM summary 同口径：排除 excluded，只计有结果的） */
export function summarize(records) {
  const kept = records.filter(r => !r.excluded)
  const priced = kept.filter(r => r.pnl !== null)
  const wins = priced.filter(r => r.pnl > 0).map(r => r.pnl)
  const losses = priced.filter(r => r.pnl < 0).map(r => r.pnl)
  const avg = list => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null)
  return {
    kept,
    priced,
    profit: wins.length,
    loss: losses.length,
    flat: priced.length - wins.length - losses.length,
    pending: kept.length - priced.length,
    units: new Set(priced.map(r => `${r.symbol}|${r.expiry}|${r.intent}`)).size,
    min: losses.length ? Math.min(...losses) : null,
    max: wins.length ? Math.max(...wins) : null,
    avgWin: avg(wins),
    avgLoss: avg(losses)
  }
}

/** 每日结算净额归集条目 → 图表条目 */
export function toBuckets(items, granularity) {
  return (items || []).map(item => {
    const key = text(item.key)
    let label = key
    if (granularity === 'day' || granularity === 'week') label = key.slice(5).replace('-', '/')
    if (granularity === 'week') label = `${label} 周`
    if (granularity === 'month') label = key.replace('-', '/')
    return {
      key,
      label,
      settled: num(item.pnl),
      floating: granularity === 'day' ? num(item.floatPnl) : null,
      cumulative: num(item.cumulativePnl) ?? 0,
      count: num(item.count) ?? 0,
      missing: num(item.missing) ?? 0,
      openCount: num(item.openCount),
      intraday: item.intraday === true
    }
  })
}

/** 坐标轴上限：取 1 / 2 / 2.5 / 5 × 10^n 的整齐值 */
export function niceMax(values) {
  const max = Math.max(0, ...values.filter(v => num(v) !== null).map(v => Math.abs(v)))
  if (!max) return 500
  const pow = 10 ** Math.floor(Math.log10(max))
  const step = [1, 2, 2.5, 5, 10].find(s => s * pow >= max)
  return step * pow
}

/** 坐标轴金额：+$1k / −$2.5k */
export function axisUsd(value) {
  if (!value) return '$0'
  const abs = Math.abs(value)
  const body = abs >= 1000 ? `$${+(abs / 1000).toFixed(1)}k` : `$${Math.round(abs)}`
  return `${value > 0 ? '+' : '−'}${body}`
}
