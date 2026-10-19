import http from '@/services/http'

// 「结算」菜单数据：后端定时任务带 OSM 会话 Cookie 同步 feed，按 OSM /member/settlement 规则整理
// 已结算 / 结算单 / 结算统计后入库 / Redis，前端只读（接口文档 option_settlement.md）
// 首次部署由管理员在若依后台对「OSM结算菜单强制同步」执行一次
export const getSettlementSummary = () => http.get('/api/member/settlement')
// kind：record 已结算 / card 结算单 / stat 结算统计；record 支持 range、from、to、sort、symbol
export const getSettlementKind = (kind, params) => http.get(`/api/member/settlement/${kind}`, { params })
