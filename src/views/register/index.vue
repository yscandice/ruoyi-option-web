<template>
  <main class="login-page">
    <div class="login-glow glow-a"/><div class="login-glow glow-b"/>
    <section class="login-card">
      <div class="login-brand"><span class="brand-mark">O</span><div><strong>OSM<span>.AI</span></strong><small>OPTIONS INTELLIGENCE</small></div></div>
      <div class="login-heading"><span>新用户注册</span><h1>注册期权工作台</h1><p>注册后可免费完整体验 72 小时，到期后自动切换为盘后数据版</p></div>
      <div v-if="closed" class="closed-tip"><el-icon><WarningFilled /></el-icon>{{ closedText }}</div>
      <el-form ref="formRef" :model="form" :rules="rules" :disabled="closed" @submit.prevent>
        <el-form-item prop="email" :error="fieldErrors.email">
          <el-input v-model="form.email" size="large" placeholder="邮箱" autocomplete="email" maxlength="128" @input="clearError('email')"><template #prefix><el-icon><Message /></el-icon></template></el-input>
        </el-form-item>
        <p v-if="emailExists" class="exists-tip">该邮箱已注册，<router-link :to="{ path: '/login', query: { email: form.email.trim() } }">去登录</router-link></p>
        <el-form-item v-if="captchaEnabled" prop="code" class="captcha-row" :error="fieldErrors.code">
          <el-input v-model="form.code" size="large" placeholder="图形验证码" maxlength="4" @input="clearError('code')"><template #prefix><el-icon><Key /></el-icon></template></el-input>
          <button class="captcha-image" type="button" title="看不清？换一张" @click="loadCaptcha"><img v-if="captchaImage" :src="captchaImage" alt="图形验证码"/><span v-else>刷新验证码</span></button>
        </el-form-item>
        <el-form-item prop="emailCode" class="code-row" :error="fieldErrors.emailCode">
          <el-input v-model="form.emailCode" size="large" placeholder="邮箱验证码（6 位数字）" maxlength="6" inputmode="numeric" autocomplete="one-time-code" @input="onEmailCodeInput"><template #prefix><el-icon><Lock /></el-icon></template></el-input>
          <el-button class="send-button" size="large" :loading="sending" :disabled="countdown > 0 || closed" @click="handleSendCode">{{ countdown > 0 ? `${countdown} 秒后重发` : (codeSent ? '重新发送' : '获取验证码') }}</el-button>
        </el-form-item>
        <el-form-item prop="password" :error="fieldErrors.password">
          <el-input v-model="form.password" size="large" placeholder="密码（8–20 位，含字母和数字）" type="password" show-password maxlength="20" autocomplete="new-password" @input="clearError('password')"><template #prefix><el-icon><Lock /></el-icon></template></el-input>
          <div v-if="form.password" class="strength"><span class="strength-bars"><i v-for="n in 3" :key="n" :class="{ on: strength.level >= n, [strength.tone]: strength.level >= n }"/></span><span :class="['strength-text', strength.tone]">密码强度：{{ strength.label }}</span></div>
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="form.confirmPassword" size="large" placeholder="确认密码" type="password" show-password maxlength="20" autocomplete="new-password"><template #prefix><el-icon><Lock /></el-icon></template></el-input>
        </el-form-item>
        <el-form-item prop="agree" class="agree-row">
          <el-checkbox v-model="form.agree"><span class="agree-text">我已了解：期权交易风险较高，本站内容仅供学习参考，不构成投资建议，据此操作风险自担</span></el-checkbox>
        </el-form-item>
        <el-button type="primary" size="large" class="submit-button" :loading="submitting" :disabled="closed" @click="submit">注册并登录</el-button>
      </el-form>
      <p v-if="errorText" class="login-error"><el-icon><WarningFilled /></el-icon>{{ errorText }}</p>
      <p class="login-switch">已有账号？<router-link :to="loginLink">去登录</router-link></p>
      <div class="login-foot"><span>安全连接</span><span>OSM.AI 期权工作台</span></div>
    </section>
    <div class="login-caption">清晰观察市场 · 纪律管理风险</div>
  </main>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Key, Lock, Message, WarningFilled } from '@element-plus/icons-vue'
import { getCaptcha, getCurrentUser } from '@/api/auth'
import { registerMember, sendRegisterCode } from '@/api/member'
import { BUSY_MESSAGE, resetAuthRedirect } from '@/services/http'
import { resetAccess } from '@/utils/accessStore'
import { setToken, setUser } from '@/utils/auth'
import { getDeviceHash } from '@/utils/device'

const COUNTDOWN_KEY = 'option-register-countdown'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)\S{8,20}$/

const route = useRoute()
const router = useRouter()
const formRef = ref()
const captchaEnabled = ref(false)
const captchaImage = ref('')
const sending = ref(false)
const submitting = ref(false)
const codeSent = ref(false)
const countdown = ref(0)
const closed = ref(false)
const closedText = ref('')
const emailExists = ref(false)
const errorText = ref('')
const fieldErrors = reactive({ email: '', code: '', emailCode: '', password: '' })
const form = reactive({ email: typeof route.query.email === 'string' ? route.query.email.trim() : '', code: '', uuid: '', emailCode: '', password: '', confirmPassword: '', agree: false })
let timer = null

const rules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { pattern: EMAIL, message: '邮箱格式不正确', trigger: 'blur' }],
  code: [{ required: true, message: '请输入图形验证码', trigger: 'blur' }],
  emailCode: [{ required: true, message: '请输入邮箱验证码', trigger: 'blur' }, { pattern: /^\d{6}$/, message: '邮箱验证码为 6 位数字', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { pattern: PASSWORD, message: '密码需为 8–20 位，同时包含字母和数字，不能有空格', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请再次输入密码', trigger: 'blur' }, { validator: (rule, value, callback) => value !== form.password ? callback(new Error('两次输入的密码不一致')) : callback(), trigger: 'blur' }],
  agree: [{ validator: (rule, value, callback) => value ? callback() : callback(new Error('请先勾选风险提示')), trigger: 'change' }]
}

const loginLink = computed(() => EMAIL.test(form.email.trim()) ? { path: '/login', query: { email: form.email.trim() } } : '/login')
const strength = computed(() => {
  const value = form.password || ''
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  if (!PASSWORD.test(value)) return { level: 1, label: '不符合要求', tone: 'weak' }
  if (score >= 4) return { level: 3, label: '强', tone: 'strong' }
  if (score >= 3) return { level: 2, label: '中', tone: 'medium' }
  return { level: 1, label: '弱', tone: 'weak' }
})

function clearError(field) {
  fieldErrors[field] = ''
  if (field === 'email') emailExists.value = false
}
function onEmailCodeInput(value) {
  form.emailCode = String(value || '').replace(/\D/g, '').slice(0, 6)
  clearError('emailCode')
}
function resetErrors() {
  Object.keys(fieldErrors).forEach(key => { fieldErrors[key] = '' })
  errorText.value = ''
}

async function loadCaptcha() {
  try {
    const result = await getCaptcha()
    captchaEnabled.value = result?.captchaEnabled !== false
    captchaImage.value = captchaEnabled.value && result?.img ? `data:image/png;base64,${result.img}` : ''
    form.uuid = result?.uuid || ''
    form.code = ''
  } catch (error) {
    errorText.value = error.message || BUSY_MESSAGE
  }
}

// 倒计时存 sessionStorage，刷新页面继续
function runCountdown(until) {
  window.clearInterval(timer)
  const tick = () => {
    countdown.value = Math.max(0, Math.ceil((until - Date.now()) / 1000))
    if (!countdown.value) { window.clearInterval(timer); sessionStorage.removeItem(COUNTDOWN_KEY) }
  }
  tick()
  timer = window.setInterval(tick, 1000)
}
function startCountdown(seconds) {
  const until = Date.now() + seconds * 1000
  sessionStorage.setItem(COUNTDOWN_KEY, JSON.stringify({ until, email: form.email.trim() }))
  runCountdown(until)
}
function restoreCountdown() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(COUNTDOWN_KEY) || 'null')
    if (!saved || !(saved.until > Date.now())) { sessionStorage.removeItem(COUNTDOWN_KEY); return }
    if (!form.email && saved.email) form.email = saved.email
    codeSent.value = true
    runCountdown(saved.until)
  } catch { sessionStorage.removeItem(COUNTDOWN_KEY) }
}
function stopCountdown() {
  window.clearInterval(timer)
  countdown.value = 0
  sessionStorage.removeItem(COUNTDOWN_KEY)
}

function closeForm(message) {
  closed.value = true
  closedText.value = message
  ElMessageBox.alert(message, '暂不能注册', { type: 'warning', confirmButtonText: '知道了' }).catch(() => {})
}

// 发码 / 注册共用的错误处理，返回 true 表示已处理
function handleCommonError(error) {
  const code = error?.code
  const message = error?.message || ''
  if (code === 403 && /暂未开放注册/.test(message)) { closeForm(message); return true }
  if (code === 403 && /域名/.test(message)) {
    fieldErrors.email = message
    ElMessageBox.alert(message, '邮箱不可用', { type: 'warning', confirmButtonText: '更换邮箱' }).catch(() => {})
    return true
  }
  if (code === 409) { fieldErrors.email = '该邮箱已注册'; emailExists.value = true; return true }
  if (code === 400 && /邮箱格式/.test(message)) { fieldErrors.email = message; return true }
  if (!code || code >= 500) { errorText.value = BUSY_MESSAGE; return true }
  return false
}

async function handleSendCode() {
  if (sending.value || countdown.value > 0 || closed.value) return
  resetErrors()
  emailExists.value = false
  formRef.value.clearValidate()
  const fields = captchaEnabled.value ? ['email', 'code'] : ['email']
  try { await formRef.value.validateField(fields) } catch { return }
  sending.value = true
  try {
    const result = await sendRegisterCode({ email: form.email.trim(), code: form.code.trim(), uuid: form.uuid })
    codeSent.value = true
    startCountdown(Number(result?.data?.resendAfter) || 60)
    ElMessage.success(result?.msg || '验证码已发送，请查收邮件')
  } catch (error) {
    const message = error?.message || ''
    if (!handleCommonError(error)) {
      if (error.code === 400 && /图形验证码/.test(message)) fieldErrors.code = '验证码错误'
      else if (error.code === 429) {
        const wait = Number((message.match(/(\d+)\s*秒/) || [])[1])
        if (wait) { errorText.value = `操作太频繁，请 ${wait} 秒后再试`; codeSent.value = true; startCountdown(wait) }
        else errorText.value = message
      } else errorText.value = message || BUSY_MESSAGE
    }
    // 失败后自动换一张图形码
    if (captchaEnabled.value) await loadCaptcha()
  } finally {
    sending.value = false
  }
}

async function submit() {
  if (submitting.value || closed.value) return
  resetErrors()
  const fields = ['email', 'emailCode', 'password', 'confirmPassword', 'agree']
  try { await formRef.value.validateField(fields) } catch { return }
  submitting.value = true
  try {
    const deviceHash = await getDeviceHash()
    const payload = { email: form.email.trim(), password: form.password, emailCode: form.emailCode }
    if (deviceHash) payload.deviceHash = deviceHash
    const result = await registerMember(payload)
    const token = result?.token || result?.data?.token
    if (!token) throw Object.assign(new Error('注册接口未返回访问令牌'), { code: 500 })
    stopCountdown()
    setToken(token)
    resetAuthRedirect()
    resetAccess()
    try { const info = await getCurrentUser(); setUser(info?.user || {}) } catch {}
    const level = result?.data?.access?.level
    router.replace('/today')
    if (level === 'DELAYED') ElMessage({ type: 'success', message: '已注册成功，当前为盘后数据版', duration: 4000 })
    else ElMessage({ type: 'success', message: '注册成功，已开通 72 小时完整体验', duration: 4000 })
  } catch (error) {
    const message = error?.message || ''
    if (!handleCommonError(error)) {
      if (error.code === 400 && /密码/.test(message)) fieldErrors.password = message
      else if (error.code === 400 && /次数过多/.test(message)) {
        fieldErrors.emailCode = message
        form.emailCode = ''
        stopCountdown()
      } else if (error.code === 400 && /验证码/.test(message)) fieldErrors.emailCode = '验证码错误或已过期，请重新获取'
      else if (error.code === 429 && /正在注册/.test(message)) ElMessage.info('正在注册，请稍候')
      else errorText.value = message || BUSY_MESSAGE
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => { loadCaptcha(); restoreCountdown() })
onBeforeUnmount(() => window.clearInterval(timer))
</script>
<style scoped>
.login-page{min-height:100vh;display:grid;place-items:center;position:relative;overflow:hidden;padding:28px;background:radial-gradient(ellipse at 12% 8%,#e0efff 0,transparent 34%),radial-gradient(ellipse at 90% 90%,#e6f1ff 0,transparent 33%),#f4f8fd}.login-glow{position:absolute;border:1px solid #b8d3f333;border-radius:50%;pointer-events:none}.glow-a{width:560px;height:560px;left:-280px;bottom:-210px}.glow-b{width:450px;height:450px;right:-215px;top:-220px}.login-card{z-index:1;width:min(100%,430px);padding:34px 38px 25px;border:1px solid #e5edf6;border-radius:19px;background:#ffffffed;box-shadow:0 24px 70px #193c6612;backdrop-filter:blur(12px)}.login-brand{display:flex;align-items:center;gap:11px;color:#15375f}.brand-mark{width:39px;height:39px;border-radius:12px;background:linear-gradient(145deg,#2878dc,#1556b2);color:white;display:grid;place-items:center;font-size:25px;font-weight:800;box-shadow:0 5px 12px #1b64bd33}.login-brand>div{display:flex;flex-direction:column;gap:3px}.login-brand strong{font-size:18px}.login-brand strong span{color:#3984dc}.login-brand small{font-size:8px;color:#91a0b5;letter-spacing:1.25px;font-weight:700}.login-heading{margin:30px 0 20px}.login-heading>span{font-size:11px;color:#4380c4;font-weight:700}.login-heading h1{margin:7px 0;font-size:24px;color:#19375c}.login-heading p{margin:0;color:#8998aa;font-size:12px;line-height:1.6}.login-card :deep(.el-input__wrapper){min-height:44px;border-radius:9px;box-shadow:0 0 0 1px #e6edf5 inset}.login-card :deep(.el-input__wrapper.is-focus){box-shadow:0 0 0 1px #6ca5e5 inset}.login-card :deep(.is-error .el-input__wrapper){box-shadow:0 0 0 1px #e08a84 inset}.login-card :deep(.el-input__prefix){color:#92a3b8}.captcha-row :deep(.el-form-item__content),.code-row :deep(.el-form-item__content){display:flex;gap:10px;flex-wrap:nowrap}.captcha-image{width:120px;flex:none;border:1px solid #e6edf5;border-radius:8px;background:#f6f9fc;display:grid;place-items:center;cursor:pointer;color:#68809d}.captcha-image img{width:100%;height:42px;object-fit:cover}.captcha-image span{font-size:10px}.send-button{width:120px;flex:none;height:44px;border-radius:9px;color:#2774cc;border-color:#cfe0f3;font-size:12px}.strength{width:100%;display:flex;align-items:center;gap:8px;margin-top:6px;font-size:11px;line-height:1}.strength-bars{display:flex;gap:4px}.strength-bars i{width:34px;height:4px;border-radius:2px;background:#e6edf5}.strength-bars i.on.weak{background:#e08a84}.strength-bars i.on.medium{background:#e5b45c}.strength-bars i.on.strong{background:#49af80}.strength-text{color:#8998aa}.strength-text.weak{color:#cf5d57}.strength-text.medium{color:#b98a2f}.strength-text.strong{color:#3c946b}.agree-row{margin-bottom:14px}.agree-row :deep(.el-checkbox){height:auto;align-items:flex-start;white-space:normal}.agree-row :deep(.el-checkbox__input){margin-top:2px}.agree-text{font-size:11px;line-height:1.6;color:#6d7e95}.exists-tip{margin:-10px 0 12px;font-size:12px;color:#cf5d57}.exists-tip a{color:#2774cc;font-weight:600;text-decoration:none}.closed-tip{display:flex;gap:6px;align-items:center;margin:0 0 14px;padding:10px 12px;border-radius:9px;background:#fff6ed;color:#b9772f;font-size:12px}.submit-button{width:100%;height:45px;margin-top:2px;border-radius:9px;background:#2774cc;border-color:#2774cc;box-shadow:0 7px 16px #2774cc25}.login-error{display:flex;gap:6px;align-items:center;color:#cf5d57;font-size:11px;margin:13px 0 0}.login-switch{margin:16px 0 0;text-align:center;color:#8998aa;font-size:12px}.login-switch a{color:#2774cc;font-weight:600;text-decoration:none;margin-left:2px}.login-switch a:hover{text-decoration:underline}.login-foot{border-top:1px solid #edf1f6;margin-top:22px;padding-top:15px;display:flex;justify-content:space-between;color:#a1adbc;font-size:10px}.login-foot span:first-child:before{content:'';display:inline-block;width:6px;height:6px;background:#49af80;border-radius:50%;margin-right:6px}.login-caption{position:absolute;bottom:24px;color:#9aaabe;font-size:11px;letter-spacing:1px}@media(max-width:520px){.login-page{padding:18px;place-items:start center}.login-card{padding:26px 20px 20px}.captcha-image,.send-button{width:106px}.login-caption{display:none}}
</style>
