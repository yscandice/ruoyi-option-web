// 「结算」页面数据映射：把 /api/member/settlement 与 /{kind} 的条目整理为卡片展示模型（纯函数，无副作用）
// 口径与 OSM 已结算卡一致：最终净结果 = finalNetPnlUsd ?? researchPnlUsd，原价差对照 = researchPnlUsd
const text = value => (typeof value === 'string' ? value.trim() : value === null || value === undefined ? '' : String(value))
const num = value => (typeof value === 'number' && Number.isFinite(value) ? value : null)
const dash = value => (text(value) && text(value) !== '—' ? text(value) : '—')

export const toneOf = n => (n === null || n === undefined ? '' : n > 0 ? 'positive' : n < 0 ? 'negative' : '')

/** 带符号金额：+$1,234 / −$56 */
export const signedUsd = value => (num(value) === null ? '—' : `${value >= 0 ? '+' : '−'}$${Math.abs(Math.round(value)).toLocaleString('en-US')}`)
/** 不带符号金额：$1,234 */
export const plainUsd = value => (num(value) === null ? '—' : `$${Math.abs(Math.round(value)).toLocaleString('en-US')}`)
/** 设计稿色彩：正绿 / 负红 / 零白（仅深色区用） */
const amountColor = n => (num(n) === null || n === 0 ? '#fff' : n > 0 ? '#4ade80' : '#ff6b6b')

/** ISO 时间 → "10/15 · 09:38 ET" */
function etStamp(iso) {
  const t = Date.parse(text(iso))
  if (!Number.isFinite(t)) return ''
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date(t)).map(x => [x.type, x.value])
  )
  return `${parts.month}/${parts.day} · ${parts.hour === '24' ? '00' : parts.hour}:${parts.minute} ET`
}

const STRATEGY = { CALL: '卖方看涨价差', PUT: '卖方看跌价差' }
function strategyOf(item) {
  const intent = text(item.intent).toUpperCase()
  const side = intent.includes('CALL') ? STRATEGY.CALL : intent.includes('PUT') ? STRATEGY.PUT : dash(item.intent)
  return item.recordType === 'midterm' ? `中期 · ${side}` : side
}

/** 发报时间 "10/13 · 12:51 ET" → { day: '10/13', time: '12:51' } */
function issued(item) {
  const m = /(\d{2}\/\d{2})\D+(\d{1,2}:\d{2})/.exec(text(item.emittedAt) || text(item.sellerSignalAt))
  return m ? { day: m[1], time: m[2] } : { day: text(item.issuedDay) || '—', time: '' }
}

/* ---------------- KPI 五格 ---------------- */
/**
 * 结算统计 → hero 五格
 * @param {object} stats /api/member/settlement 的 stats
 */
export function buildKpis(stats) {
  const s = stats || {}
  const net = num(s.manageNetUsd)
  return [
    {
      key: 'settled', label: '结算盈亏', dot: '#00f0c4', hl: true,
      value: signedUsd(s.settledPnlUsd), color: amountColor(s.settledPnlUsd),
      sub: `这 ${num(s.settledCount) ?? 0} 笔实际拿到的钱（管理执行之后）`
    },
    {
      key: 'raw', label: '管理前对照', dot: '#fff',
      value: signedUsd(s.rawPnlUsd), color: amountColor(s.rawPnlUsd),
      sub: `同这批信号，一路不管、持到期会是多少 · ${num(s.rawPriced) ?? 0} 笔算得出`
    },
    {
      key: 'net', label: '管理净贡献', dot: '#4ade80',
      value: signedUsd(net), color: amountColor(net),
      sub: '上面两个数的差 —— 动态管理这件事赚到的钱'
    },
    {
      key: 'prot', label: '保护成本', dot: '#0aa5b5',
      value: plainUsd(s.protectionCostUsd), color: '#fff',
      sub: `买保护腿付出 · ${num(s.protectionPriced) ?? 0}/${num(s.protectionTotal) ?? 0} 条已定价`
    },
    {
      key: 'cost', label: '动态管理成本', dot: '#9ca3af',
      value: plainUsd(s.manageCostUsd), color: '#fff',
      sub: `移仓 / 平仓付出 · 加腿收到 ${plainUsd(s.manageCreditUsd)} · ${num(s.managePriced) ?? 0}/${num(s.manageTotal) ?? 0} 张算得出`
    }
  ]
}

/* ---------------- 动态管理时间线 ---------------- */
const MANAGE_TYPE = [
  [/移仓/, 'roll', '移仓卡'],
  [/对冲/, 'hedge', '对冲卡'],
  [/止盈|平仓/, 'close', '止盈 / 平仓'],
  [/保护/, 'prot', '保护卡']
]

function manageType(m) {
  const title = `${text(m.cardTitle)}${text(m.eventLabel)}`
  for (const [re, type, fallback] of MANAGE_TYPE) if (re.test(title)) return { type, fallback }
  if (m.kind === 'tested_roll') return { type: 'roll', fallback: '移仓卡' }
  return { type: 'prot', fallback: '保护卡' }
}

function manageTag(m) {
  const choice = text(m.choice)
  if (choice) return choice
  if (m.noPush) return '仅提示'
  if (text(m.firstConfirmedAtEt) && text(m.firstConfirmedAtEt) !== '—') return '已确认'
  return '已发单'
}

/** 腿文字整理："卖 $103.0C · 10-30 @None" → "卖 $103C · 10-30" */
const cleanLeg = value => text(value).replace(/\s*@\S+/g, '').replace(/\$(\d+)\.0(?=[CP])/g, '$$$1').trim()
/** 权利金文字：数字补 $ 前缀，"$1.34" 原样 */
const creditText = value => (text(value) ? (/^[\d.]+$/.test(text(value)) ? `$${value}` : text(value)) : '')

function toManage(m) {
  const { type, fallback } = manageType(m)
  const path = Array.isArray(m.paths) ? m.paths[0] : null
  const legs = (path && Array.isArray(path.legs) ? path.legs : []).map(cleanLeg).join(' / ')
  const headline = m.headline || null
  const value = num(headline && headline.value) ?? num(path && path.netUsd)
  const label = text(headline && headline.label) || (type === 'roll' ? '移仓净收' : '当前浮动')
  const figures = Array.isArray(m.figures) ? m.figures : []
  const metrics = figures.slice(0, 3).map(f => ({ label: text(f[0]), value: text(f[1]) }))
  const credit = creditText(m.sourceCredit)
  const origin = text(m.sourceStructure)
    ? `原卖方 ${cleanLeg(m.sourceStructure)}${credit ? ` · 收 ${credit}` : ''}`
    : dash(m.scenario)
  return {
    id: text(m.id) || `${text(m.cardTitle)}-${text(m.issuedAtUtc)}`,
    at: etStamp(m.issuedAtUtc) || dash(m.sentAt),
    type,
    title: text(m.cardTitle) || text(m.eventLabel) || fallback,
    tag: manageTag(m),
    legs: dash(legs),
    label,
    value,
    valueText: value === null ? '—' : signedUsd(value),
    valueTone: value === null ? 'muted' : value > 0 ? 'up' : value < 0 ? 'down' : '',
    origin,
    metrics: metrics.length
      ? metrics
      : [
          { label: '价差', value: path && num(path.netPerSpread) !== null ? `$${path.netPerSpread}` : '—' },
          { label: '组数', value: num(m.contracts) ?? '—' },
          { label: '现价', value: num(m.currentSpot) === null ? '—' : `$${m.currentSpot}` }
        ]
  }
}

/* ---------------- 结算卡 ---------------- */
/**
 * 已结算记录 → 结算卡模型
 * @param {object} item record 条目（接口已按 groupDay 倒序、sortAtMs 倒序排好）
 */
export function toRecord(item) {
  const final = num(item.finalNetPnlUsd)
  const research = num(item.researchPnlUsd)
  const value = final ?? research
  const rollFrom = item.rollFrom && text(item.rollFrom.parentStructure) ? item.rollFrom : null
  const holding = num(item.holdingTradingDays)
  const windows = num(item.protectionWindowCount)
  const managements = Array.isArray(item.managements) ? item.managements : []
  const when = issued(item)
  const emit = /·/.test(text(item.emittedAt)) ? text(item.emittedAt) : ''

  const tag = rollFrom
    ? '移仓继承 · 已结算'
    : item.recordType === 'midterm'
      ? strategyOf(item)
      : item.statusCode === 'EARLY_TAKE_PROFIT'
        ? '提前止盈'
        : item.statusCode === 'CLOSED'
          ? '已关闭'
          : '已到期结算'

  return {
    id: text(item.id) || `${item.symbol}-${item.sortAtMs}`,
    symbol: text(item.symbol),
    group: item.groupShow && num(item.groupNo) ? `· 第${item.groupNo}组` : '',
    time: emit || (when.time ? `${when.day} · ${when.time} ET` : dash(when.day)),
    tag,
    expiry: dash(item.expiry || text(item.expiryDate).slice(5)),
    legs: dash(item.structure),
    headLabel: final === null ? '管理后盈亏' : '最终净结果',
    value,
    valueText: value === null ? '—' : signedUsd(value),
    tone: value === null ? 'k-flat' : value > 0 ? 'k-up' : value < 0 ? 'k-dn' : 'k-flat',
    isRoll: !!rollFrom,
    barText: rollFrom
      ? `${text(rollFrom.parentExpiry)} 的 ${text(rollFrom.parentStructure)} 按「${text(rollFrom.pathLabel) || '移仓'}」移来${text(rollFrom.debitText) ? ` · ${text(rollFrom.debitText)}` : ''}`
      : `发报 ${emit ? emit.replace(' · ', '·') : dash(item.issuedDay)} · 收 ${dash(item.initialCredit)}`,
    barAcc: rollFrom && num(rollFrom.netCreditUsd) !== null ? `累计净收 ${signedUsd(rollFrom.netCreditUsd)}` : '',
    outcome: dash(item.state),
    netLabel: rollFrom ? '移仓口径净' : '管理后净',
    netText: signedUsd(final),
    netTone: final === null ? 'muted' : final > 0 ? 'up' : final < 0 ? 'down' : '',
    baseLabel: rollFrom ? '不移仓对照' : '原价差对照',
    baseText: signedUsd(research),
    baseTone: research === null ? 'muted' : research > 0 ? 'up' : research < 0 ? 'down' : '',
    holdText: holding === null ? '—' : `${holding} 个交易日`,
    windowText: windows === null ? '—' : `${windows} 次`,
    entryRisk: `${dash(item.initialCredit)} / ${dash(item.maxRisk)}`,
    lastStep: item.statusCode === 'EARLY_TAKE_PROFIT' ? '提前止盈' : item.statusCode === 'CLOSED' ? '平仓' : '结算',
    hasProtection: (windows ?? 0) > 0,
    manages: managements.map(toManage),
    open: false
  }
}

/** 区间 / 自定义日期 → 接口参数（sort：settled 按结算日 / issued 按发报日） */
export function recordParams(range, sort, from, to) {
  const params = { range, sort: sort === 'issued' ? 'issued' : 'settled' }
  if (range === 'custom') {
    if (from) params.from = from
    if (to) params.to = to
  }
  return params
}
