import http from '@/services/http'

// 「更新」菜单数据：后端定时任务带 OSM 会话 Cookie 抓取 /member/updates「功能更新」页面，
// 解析为页头 / 更新条目后入库 / Redis，前端只读（接口文档 option_iteration.md）
// 首次部署由管理员在若依后台「系统监控 → 定时任务」对「OSM更新菜单强制同步」执行一次
const clean = params => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))

// 汇总：页头、条目数、日期范围、按月 / 目标链接分布、最新 5 条、阅读进度 progress、同步状态 status
export const getUpdateSummary = () => http.get('/api/member/updates/summary')
// kind：page（页头）/ entry（更新条目，可选 keyword、month、target 过滤）
export const getUpdateKind = (kind, params) => http.get(`/api/member/updates/${kind}`, { params: clean(params) })
// 单条完整内容，如 entry/2026-10-19-roll-safer、page/updates
export const getUpdateItem = (kind, key) => http.get(`/api/member/updates/${kind}/${encodeURIComponent(key)}`)
