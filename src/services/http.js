import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearSession } from '@/utils/auth'

// 全局请求拦截（W8）
// - 401（被停用、强制下线、重置密码、token 过期）：清 token → 跳 /login?redirect=当前页，多个请求同时 401 只提示、只跳一次；
//   登录页、注册页及其请求除外
// - 403：提示“暂无权限”（注册相关 403 由注册页自己处理）
// - 429：原样提示后端 msg（注册相关由注册页自己处理）
// - 5xx / 网络错误：“服务繁忙，请稍后再试”（后端给了业务提示时保留原文，如“暂无数据，请先同步”）
export const BUSY_MESSAGE = '服务繁忙，请稍后再试'
const AUTH_PAGES = ['/login', '/register']
const AUTH_URLS = [/^\/login$/, /^\/logout$/, /^\/captchaImage$/, /^\/api\/member\/register(\/|$)/]

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '', timeout: 20000 })

let redirecting = false
// 登录 / 注册成功后调用，重新允许 401 跳转
export const resetAuthRedirect = () => { redirecting = false }
// 已由全局拦截提示过的错误（401 / 403 / 429），页面不要再重复弹提示
export const isHandledError = error => [401, 403, 429].includes(error?.code)

const pathOf = config => (config?.url || '').split('?')[0].replace(/^https?:\/\/[^/]+/, '').replace(/^\/dev-api/, '')
const isAuthRequest = config => AUTH_URLS.some(rule => rule.test(pathOf(config)))
const onAuthPage = () => AUTH_PAGES.includes(location.pathname)
// 注册页自己处理 403 / 429 等错误
const isSilent = config => config?.silent === true || /^\/api\/member\/register(\/|$)/.test(pathOf(config))

function handleUnauthorized(config) {
  if (isAuthRequest(config) || onAuthPage()) return
  clearSession()
  if (redirecting) return
  redirecting = true
  ElMessage({ type: 'warning', message: '账号已停用或登录已失效，请重新登录', grouping: true })
  import('@/router').then(({ default: router }) => {
    const current = router.currentRoute.value
    router.replace({ path: '/login', query: current?.fullPath && current.path !== '/login' ? { redirect: current.fullPath } : {} })
  })
}

function toError(message, code, extra = {}) {
  const error = new Error(message)
  error.code = code
  Object.assign(error, extra)
  return error
}

function notify(config, code, message) {
  if (isSilent(config)) return
  if (code === 403) ElMessage({ type: 'warning', message: '暂无权限', grouping: true })
  else if (code === 429) ElMessage({ type: 'warning', message: message || '操作太频繁，请稍后再试', grouping: true })
}

http.interceptors.request.use(config => {
  const headers = config.headers || {}
  const skipToken = headers.isToken === false || headers.isToken === 'false'
  if (headers.isToken !== undefined) { if (typeof headers.delete === 'function') headers.delete('isToken'); else delete headers.isToken }
  const token = getToken()
  if (token && !skipToken) headers.Authorization = `Bearer ${token}`
  if (config.method === 'get' && config.params) {
    const query = new URLSearchParams(config.params).toString()
    if (query) config.url += `${config.url.includes('?') ? '&' : '?'}${query}`
    config.params = undefined
  }
  return config
})

http.interceptors.response.use(response => {
  const body = response.data
  if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
    const code = Number(body.code)
    const message = body.msg || '请求失败'
    if (code === 401) {
      handleUnauthorized(response.config)
      return Promise.reject(toError(message || '登录状态已过期', 401, { body }))
    }
    notify(response.config, code, message)
    return Promise.reject(toError(code >= 500 && !body.msg ? BUSY_MESSAGE : message, code, { body }))
  }
  return body
}, error => {
  const status = error.response?.status
  const data = error.response?.data
  const backendMessage = (data && typeof data === 'object' && (data.msg || data.error)) || ''
  if (status === 401) {
    handleUnauthorized(error.config)
    return Promise.reject(toError(backendMessage || '登录状态已过期', 401, { body: data }))
  }
  if (status === 403 || status === 429) {
    notify(error.config, status, backendMessage)
    return Promise.reject(toError(backendMessage || (status === 403 ? '暂无权限' : '操作太频繁，请稍后再试'), status, { body: data }))
  }
  // 5xx / 网络错误 / 超时：没有业务提示时统一“服务繁忙”
  return Promise.reject(toError(backendMessage || BUSY_MESSAGE, status || 0, { body: data, network: !error.response }))
})

export default http
