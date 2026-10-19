import http from '@/services/http'

// 「战绩」菜单数据：后端定时任务带 OSM 会话 Cookie 同步 feed（performance / history）与 decisions，
// 按 OSM /member/scorecard 规则整理成 战绩明细 / 每日结算净额 / 按标的 / 战绩统计 / 账户模拟 后入库 / Redis，前端只读（接口文档 option_record.md）
// 首次部署由管理员在若依后台「系统监控 → 定时任务」对「OSM战绩菜单强制同步」执行一次
const clean = params => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export const getRecordSummary = () => http.get('/api/member/record')
// kind：trade / daily / symbol / stat / account
// range（all / month）作用于 trade、daily、symbol；scope（all / adopted）作用于 trade、daily；granularity（day / week / month）作用于 daily；symbol 作用于 trade、symbol；outcome 作用于 trade
export const getRecordKind = (kind, params) => http.get(`/api/member/record/${kind}`, { params: clean(params) })
