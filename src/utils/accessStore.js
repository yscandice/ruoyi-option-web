// 会员身份与数据视图的全局状态（W3 提示条、W4 菜单盘后标签共用）
// - access：GET /api/member/access 的返回
// - views：各菜单最近一次接口返回的数据视图（来自响应头 X-Option-Data-* 或返回体 status 段）
import { reactive } from 'vue'
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
