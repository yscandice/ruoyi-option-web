// 会员身份与数据视图的全局状态（W3 提示条、W4 菜单盘后标签共用）
// - access：GET /api/member/access 的返回
// - views：各菜单最近一次接口返回的数据视图（来自响应头 X-Option-Data-* 或返回体 status 段）
import { computed, reactive } from 'vue'
import { getAccess } from '@/api/member'

const THROTTLE_MS = 60000

export const accessState = reactive({ access: null, loadedAt: 0, loading: false, views: {} })

let pending = null
let lastLevelCheck = 0

// 刷新身份：默认节流 60 秒，force 时立即刷新
export function refreshAccess({ force = false } = {}) {
  if (pending) return pending
  if (!force && accessState.access && Date.now() - accessState.loadedAt < THROTTLE_MS) return Promise.resolve(accessState.access)
  accessState.loading = true
  pending = getAccess().then(res => {
    accessState.access = res?.data || null
    accessState.loadedAt = Date.now()
    return accessState.access
  }).catch(() => accessState.access).finally(() => {
    accessState.loading = false
    pending = null
  })
  return pending
}

// AjaxResult 顶层附带的 access：身份变化（如体验到期切盘后）时立即重新拉取
export function mergeAccess(partial) {
  if (!partial || !partial.level || !accessState.access) return
  const current = accessState.access
  const changed = partial.level !== current.level || (partial.trialEndsAt && partial.trialEndsAt !== current.trialEndsAt)
  if (changed && Date.now() - lastLevelCheck > 5000) {
    lastLevelCheck = Date.now()
    refreshAccess({ force: true })
  }
}

export function resetAccess() {
  accessState.access = null
  accessState.loadedAt = 0
  accessState.views = {}
}

// ---- W4：菜单数据视图 ----
// 菜单数据接口路径 → 资源（与提示条、页面标签共用）；学堂、更新始终实时，不记录
const RESOURCE_RULES = [
  [/^(feed|today|premarket|seller-guide|entitlement|decisions|management-choices|support)(\/|$)/, 'today'],
  [/^(info-feed|info)(\/|$)/, 'info'],
  [/^(conduct|follow|settlement|record)(\/|$)/, null]
]
// 各菜单的主接口：只有主接口的“空”决定整页空状态，子接口只更新视图 / 日期 / 同步延迟
const PRIMARY = { feed: 'today', 'info-feed': 'info', conduct: 'conduct', follow: 'follow', settlement: 'settlement', record: 'record' }

export function resourceOfPath(path) {
  const rest = (path || '').replace(/^\/api\/member\//, '')
  if (rest === path) return null
  for (const [rule, name] of RESOURCE_RULES) {
    const m = rule.exec(rest)
    if (m) return name || m[1]
  }
  return null
}

const bool = value => value === true || value === 'true'

// 记录一次菜单接口返回：响应头 X-Option-Data-* + 盘后版返回体 status 段
export function recordDataView(path, headers, body) {
  const resource = resourceOfPath(path)
  if (!resource) return
  const get = name => (typeof headers?.get === 'function' ? headers.get(name) : headers?.[name]) ?? null
  const headerView = get('x-option-data-view')
  const status = body && typeof body === 'object' && !Array.isArray(body) && body.status && body.status.state === 'DELAYED' ? body.status : null
  if (!headerView && !status) return
  const view = status ? 'DELAYED' : String(headerView).toUpperCase()
  const prev = accessState.views[resource] || {}
  const primary = PRIMARY[path.replace(/^\/api\/member\//, '')] === resource
  const empty = status ? (status.message === '盘后数据尚未放出' || bool(get('x-option-data-empty'))) : bool(get('x-option-data-empty'))
  accessState.views[resource] = {
    view,
    tradeDate: status?.dataTradeDate || get('x-option-data-trade-date') || (view === prev.view ? prev.tradeDate : null) || null,
    stale: status ? status.stale === true || bool(get('x-option-data-stale')) : bool(get('x-option-data-stale')),
    empty: view === 'DELAYED' && (primary || prev.empty === undefined ? empty : prev.empty),
    message: status?.message || (view === prev.view ? prev.message : null) || null,
    nextReleaseAt: status?.nextReleaseAt || (view === prev.view ? prev.nextReleaseAt : null) || null,
    at: Date.now()
  }
  // 接口实际视图与提示条身份不一致（如体验期刚到期）时立即刷新身份
  const a = accessState.access
  if (a && ((view === 'DELAYED') !== (a.level === 'DELAYED')) && Date.now() - lastLevelCheck > 5000) {
    lastLevelCheck = Date.now()
    refreshAccess({ force: true })
  }
}

// 页面使用：当前菜单是否盘后、是否尚未放出、标签日期等
// 读不到响应头（跨域未暴露）时以 /api/member/access 的 view 为准
export function useDataView(resource) {
  return computed(() => {
    const v = accessState.views[resource]
    const a = accessState.access
    const view = v?.view || a?.view || (a?.level === 'DELAYED' ? 'DELAYED' : null)
    const delayed = view === 'DELAYED'
    return {
      delayed,
      empty: delayed && (v ? v.empty === true : a?.empty === true),
      stale: delayed && (v?.stale === true || a?.stale === true),
      tradeDate: delayed ? (v?.tradeDate || a?.dataTradeDate || null) : null,
      nextReleaseAt: delayed ? (v?.nextReleaseAt || a?.nextReleaseAt || null) : null,
      message: v?.message || null
    }
  })
}
