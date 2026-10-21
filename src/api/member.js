import http from '@/services/http'

// 会员账号相关接口（注册、数据权限、设置）；对应后端 ruoyi-vue dataPermissions
// 注册相关请求不带 token（isToken: false），返回 401 时不跳登录页（见 services/http.js）

// 发送注册邮箱验证码：{ email, code, uuid } → data { resendAfter, expiresIn }
export const sendRegisterCode = data => http.post('/api/member/register/code', data, { headers: { isToken: false } })
// 邮箱注册，成功后直接登录：{ email, password, emailCode, deviceHash? } → { token, data: { token, access } }
export const registerMember = data => http.post('/api/member/register', data, { headers: { isToken: false } })

// 当前身份与数据视图：level、view、trialEndsAt、trialRemainingSeconds、paidUntil、dataTradeDate、dataAsOf、releasedAt、nextReleaseAt、policies[]
export const getAccess = () => http.get('/api/member/access')

// ---- 设置页（W5） ----
// 一次返回 profile、notifications、updates、features
export const getMemberSettings = () => http.get('/api/member/settings')
// 资料：{ displayName?, watchSymbols?, strategyPreferences?, strongAlerts?, updatedAt }；不要提交 email、avatar
export const updateMemberProfile = data => http.put('/api/member/profile', data)
// 通知开关：{ prefs, updatedAt }
export const updateMemberNotifications = data => http.put('/api/member/notifications', data)
export const resetMemberNotifications = () => http.post('/api/member/notifications/reset')
// 若依个人中心：修改密码 { oldPassword, newPassword }、上传头像（表单字段 avatarfile）
export const updateMemberPassword = data => http.put('/system/user/profile/updatePwd', data)
export const uploadMemberAvatar = file => {
  const form = new FormData()
  form.append('avatarfile', file)
  return http.post('/system/user/profile/avatar', form)
}
