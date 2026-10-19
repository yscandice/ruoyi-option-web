import http from '@/services/http'

// 「学堂」菜单数据：后端定时任务带 OSM 会话 Cookie 抓取 /academy 学堂首页、六节课程、一周问答、术语速查页面，
// 解析为结构化数据后入库 / Redis，前端只读（接口文档 option_school.md）
// 首次部署由管理员在若依后台「系统监控 → 定时任务」对「OSM学堂菜单强制同步」执行一次
const clean = params => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))

// 学堂汇总：书目、课程清单、最新一期问答、各类型条数、同步状态
export const getAcademySummary = () => http.get('/api/member/academy')
// kind：page（栏目页 home / weekly-qa / glossary）/ lesson（课程）/ qa（一周问答）/ glossary（术语速查）；列表不含正文 HTML
export const getAcademyKind = (kind, params) => http.get(`/api/member/academy/${kind}`, { params: clean(params) })
// 单条完整内容（含安全化正文 HTML 与纯文本），如 lesson/workbench、qa/1、glossary/腿、page/home
export const getAcademyItem = (kind, key) => http.get(`/api/member/academy/${kind}/${encodeURIComponent(key)}`)
