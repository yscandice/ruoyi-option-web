// 时间显示工具：接口时间是 ISO 8601 带时区偏移，统一转北京时间显示；交易日（美东日期 YYYY-MM-DD）直接显示，不做时区换算
const BJ = 'Asia/Shanghai'
const ET = 'America/New_York'
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function parts(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const map = {}
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(date).forEach(p => { map[p.type] = p.value })
  return map
}

// MM/DD HH:mm（北京时间）
export function bjMonthDayTime(value) {
  const p = value ? parts(value, BJ) : null
  return p ? `${p.month}/${p.day} ${p.hour}:${p.minute}` : ''
}

// YYYY-MM-DD（北京时间）
export function bjDate(value) {
  const p = value ? parts(value, BJ) : null
  return p ? `${p.year}-${p.month}-${p.day}` : ''
}

// 交易日 YYYY-MM-DD → MM/DD
export function tradeMonthDay(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day || '')
  return m ? `${m[2]}/${m[3]}` : ''
}

// 交易日星期（按日期本身计算）
export function tradeWeekday(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day || '')
  return m ? WEEK[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] : ''
}

// 当前美东日期 YYYY-MM-DD
export function etToday(now = new Date()) {
  const p = parts(now, ET)
  return `${p.year}-${p.month}-${p.day}`
}

// 交易日相对当前美东日期的星期描述：上周的加“上”，如“上周五”
export function tradeWeekLabel(day, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day || '')
  if (!m) return ''
  const target = Date.UTC(+m[1], +m[2] - 1, +m[3])
  const t = /^(\d{4})-(\d{2})-(\d{2})/.exec(etToday(now))
  const today = Date.UTC(+t[1], +t[2] - 1, +t[3])
  const monday = ms => ms - ((new Date(ms).getUTCDay() + 6) % 7) * 86400000
  const weeks = Math.round((monday(today) - monday(target)) / (7 * 86400000))
  const name = tradeWeekday(day)
  if (weeks === 1) return `上${name}`
  if (weeks > 1) return name
  return name
}
