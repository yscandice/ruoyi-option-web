import http from '@/services/http'

// 「信息」菜单数据：后端定时带 OSM 会话 Cookie 同步入库/Redis，前端只读（接口文档 option_information.md）
export const getInfoFeed = () => http.get('/api/member/info-feed')
export const getReferrals = () => http.get('/api/member/referrals')
export const getPremarketPage = date => http.get('/api/member/info/premarket', { params: date ? { d: date } : undefined })
export const getEarningsPage = id => http.get('/api/member/info/earnings', { params: id ? { id } : undefined })
export const getNotesPage = id => http.get('/api/member/info/notes', { params: id ? { id } : undefined })
export const syncAllInfo = () => http.post('/option/sync/info-all', null, { timeout: 120000 })
