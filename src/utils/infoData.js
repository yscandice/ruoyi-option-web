// 「信息」页面数据映射：把 /api/member/info/* 返回的 OSM 页面 props 整理为展示模型（纯函数，无副作用）

const asArray = value => (Array.isArray(value) ? value : [])
const isNum = value => typeof value === 'number' && Number.isFinite(value)
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const NEWS_TONES = ['blue', 'purple', 'orange']

export const toneOf = value => (!isNum(value) || value === 0 ? 'muted' : value > 0 ? 'up' : 'down')
export const signed = (value, digits = 1, suffix = '%') => (isNum(value) ? `${value > 0 ? '+' : ''}${value.toFixed(digits)}${suffix}` : '—')
const plain = (value, digits) => (isNum(value) ? value.toLocaleString('en-US', { maximumFractionDigits: digits ?? (Math.abs(value) >= 1000 ? 0 : 2) }) : '—')

/** yyyy-MM-dd → 10月16日 周五 */
export function dayLabel(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day || '')
  if (!m) return day || ''
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return `${+m[2]}月${+m[3]}日 ${WEEKDAYS[date.getUTCDay()]}`
}
export const shortDay = day => (/^\d{4}-\d{2}-\d{2}$/.test(day || '') ? `${+day.slice(5, 7)}/${+day.slice(8, 10)}` : day || '')

/** 盘前行情条 */
export function premarketQuotes(brief) {
  return asArray(brief?.tape).map(item => {
    const hasLevel = isNum(item.level)
    const unit = item.unit || ''
    const value = hasLevel ? (unit === '%' ? `${plain(item.level)}%` : unit.startsWith('$') ? `$${plain(item.level)}` : plain(item.level)) : signed(item.chgPct)
    const unitHint = hasLevel && unit.startsWith('$/') ? unit.slice(1) : ''
    const change = isNum(item.chgBp) ? signed(item.chgBp, 0, ' 基点') : isNum(item.chgPct) ? signed(item.chgPct) : '—'
    const tone = toneOf(isNum(item.chgBp) ? item.chgBp : item.chgPct)
    return { name: item.name, value, unit: unitHint, change: hasLevel ? change : (item.note || '较前收'), tone, note: item.note }
  })
}

/** 盘前个股按分组 */
export function premarketMovers(brief) {
  const groups = []
  for (const item of asArray(brief?.movers?.items)) {
    const name = item.group || '其他'
    let group = groups.find(g => g.name === name)
    if (!group) groups.push(group = { name, tone: groups.length ? 'orange' : 'blue', stocks: [] })
    group.stocks.push({ symbol: item.ticker, name: item.note || '', change: signed(item.chgPct), tone: toneOf(item.chgPct) })
  }
  return groups
}

/** 盘前个股平均涨跌在刻度条上的位置（0-100） */
export function moversPosition(brief) {
  const values = asArray(brief?.movers?.items).map(i => i.chgPct).filter(isNum)
  if (!values.length) return 50
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  return Math.max(4, Math.min(96, 50 + avg * 10))
}

export const findBlock = (brief, type) => asArray(brief?.blocks).find(block => block?.type === type) || null

/** 利率概率走势 → SVG 折线点（viewBox 0 0 100 60） */
export function trendPath(points, key = 'p') {
  const values = asArray(points).map(p => p?.[key]).filter(isNum)
  if (values.length < 2) return { line: '', dots: [] }
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const dots = values.map((v, i) => ({ x: +(i * 100 / (values.length - 1)).toFixed(2), y: +(54 - (v - min) / span * 46).toFixed(2), v }))
  return { line: dots.map(d => `${d.x},${d.y}`).join(' '), dots }
}

/** 估值走势 → 最近 12 个市盈率柱高（%） */
export function valuationBars(block, count = 12) {
  const values = asArray(block?.points).slice(-count).map(p => p?.pe).filter(isNum)
  if (!values.length) return []
  const min = Math.min(...values), max = Math.max(...values)
  return values.map(v => Math.round(35 + (v - min) / ((max - min) || 1) * 55))
}

/** 要闻 */
export function premarketStories(brief) {
  return asArray(brief?.stories).map((item, index) => ({
    category: item.tag || '要闻', tone: NEWS_TONES[index % NEWS_TONES.length], title: item.title, description: item.body, tickers: asArray(item.tickers)
  }))
}

/** 财报核心指标卡 */
export function earningsTiles(piece) {
  return asArray(piece?.tiles).map(tile => {
    const m = /([+-−])\s*\d/.exec(tile.chg || '')
    const tone = m ? (m[1] === '+' ? 'up' : 'down') : 'muted'
    return { name: tile.name, value: tile.value, unit: tile.unit, change: tile.chg || '', note: tile.note || '', tone }
  })
}

/** 季度趋势柱（收入高度 %） */
export function trendBars(trend) {
  const rows = asArray(trend?.rows)
  const max = Math.max(...rows.map(r => (isNum(r.rev) ? r.rev : 0)), 0) || 1
  return rows.map(r => ({ q: r.q, rev: r.rev, gm: r.gm, guide: !!r.guide, height: Math.max(8, Math.round((isNum(r.rev) ? r.rev : 0) / max * 100)) }))
}

/** 财报日反应历史（横轴 ±axis%） */
export function reactionDots(reaction) {
  const axis = isNum(reaction?.axis) && reaction.axis > 0 ? reaction.axis : 10
  const pos = v => Math.max(1, Math.min(99, 50 + v / axis * 50))
  return {
    axis,
    dots: asArray(reaction?.history).filter(h => isNum(h?.pct)).map(h => ({ date: h.date, pct: h.pct, left: pos(h.pct), out: isNum(reaction?.impliedPct) && Math.abs(h.pct) > reaction.impliedPct })),
    implied: isNum(reaction?.impliedPct) ? { lo: pos(-reaction.impliedPct), hi: pos(reaction.impliedPct) } : null,
    now: isNum(reaction?.afterPct) ? pos(reaction.afterPct) : null
  }
}

/** 信息流按栏目统计（未读数 / 最新日期） */
export function feedSummary(feed) {
  const result = {}
  for (const item of asArray(feed?.items)) {
    const column = item.column || 'other'
    const entry = result[column] || (result[column] = { total: 0, unread: 0, latest: '' })
    entry.total += 1
    if (item.unread) entry.unread += 1
    if ((item.day || '') > entry.latest) entry.latest = item.day
  }
  return result
}
