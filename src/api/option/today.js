import http from '@/services/http'

// 今日页面数据经本地 ruoyi-option 代理获取；上游会话 Cookie 由后端管理。
export const loginOsmAccount = data => http.post('/api/member/login', data, { headers: { isToken: false } })
export const getTodayFeed = () => http.get('/api/member/feed')
export const getSellerGuide = () => http.get('/api/member/seller-guide')
export const getEntitlement = () => http.get('/api/member/entitlement')
export const getTodayDecisions = () => http.get('/api/member/decisions')
export const getManagementChoices = () => http.get('/api/member/management-choices')
export const getPremarketBrief = date => http.get('/api/member/premarket', { params: { d: date } })
export const getOptionUpdates = () => http.get('/api/member/updates')
export const getOptionSupport = () => http.get('/api/member/support')
export const syncTodayFeed = () => http.post('/option/sync/feed')
export const syncOptionResources = () => http.post('/option/sync/resource/all')
