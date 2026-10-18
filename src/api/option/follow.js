import http from '@/services/http'

// 「跟踪」菜单数据：后端定时任务带 OSM 会话 Cookie 同步 feed / decisions / management-choices，
// 按 OSM /member/tracks 规则合并标记与系统参考估值后入库 / Redis，前端只读（接口文档 option_follow.md）
// 首次部署由管理员在若依后台对「OSM跟踪菜单强制同步」执行一次
export const FOLLOW_KINDS = ['signal', 'midterm', 'buyer', 'manage']
export const getFollowSummary = () => http.get('/api/member/follow')
export const getFollowKind = (kind, params) => http.get(`/api/member/follow/${kind}`, { params })
