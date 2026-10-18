import http from '@/services/http'

// 「进行」菜单数据：后端定时任务带 OSM 会话 Cookie 同步入库/Redis，前端只读（接口文档 option_conduct.md）
// 首次部署由管理员在若依后台对「OSM进行菜单强制同步」执行一次
export const CONDUCT_SCOPES = ['active', 'protection', 'manage', 'expired', 'history']
export const getConductSummary = () => http.get('/api/member/conduct')
export const getConductScope = (scope, symbol) => http.get(`/api/member/conduct/${scope}`, { params: symbol ? { symbol } : undefined })
