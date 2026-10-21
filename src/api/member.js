import http from '@/services/http'

// 会员账号相关接口（注册、数据权限、设置）；对应后端 ruoyi-vue dataPermissions
// 注册相关请求不带 token（isToken: false），返回 401 时不跳登录页（见 services/http.js）

// 发送注册邮箱验证码：{ email, code, uuid } → data { resendAfter, expiresIn }
export const sendRegisterCode = data => http.post('/api/member/register/code', data, { headers: { isToken: false } })
// 邮箱注册，成功后直接登录：{ email, password, emailCode, deviceHash? } → { token, data: { token, access } }
export const registerMember = data => http.post('/api/member/register', data, { headers: { isToken: false } })
