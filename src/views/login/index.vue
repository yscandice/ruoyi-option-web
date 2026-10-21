<template>
  <main class="login-page">
    <div class="login-glow glow-a"/><div class="login-glow glow-b"/>
    <section class="login-card">
      <div class="login-brand"><span class="brand-mark">O</span><div><strong>OSM<span>.AI</span></strong><small>OPTIONS INTELLIGENCE</small></div></div>
      <div class="login-heading"><span>欢迎回来</span><h1>登录期权工作台</h1><p>查看今日信号、市场简报与风险管理信息</p></div>
      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="submit">
        <el-form-item prop="username"><el-input v-model="form.username" size="large" placeholder="邮箱 / 账号" autocomplete="username"><template #prefix><el-icon><User /></el-icon></template></el-input></el-form-item>
        <el-form-item prop="password"><el-input v-model="form.password" size="large" placeholder="密码" type="password" show-password autocomplete="current-password"><template #prefix><el-icon><Lock /></el-icon></template></el-input></el-form-item>
        <el-form-item v-if="captchaEnabled" prop="code" class="captcha-row"><el-input v-model="form.code" size="large" placeholder="验证码" maxlength="4"><template #prefix><el-icon><Key /></el-icon></template></el-input><button class="captcha-image" type="button" @click="loadCaptcha"><img v-if="captchaImage" :src="captchaImage" alt="验证码"/><span v-else>刷新验证码</span></button></el-form-item>
        <el-button type="primary" size="large" class="submit-button" :loading="loading" @click="submit">登录</el-button>
      </el-form>
      <p v-if="errorText" class="login-error"><el-icon><WarningFilled /></el-icon>{{ errorText }}</p>
      <p class="login-switch">没有账号？<router-link :to="registerLink">注册</router-link></p>
      <div class="login-foot"><span>安全连接</span><span>OSM.AI 期权工作台</span></div>
    </section>
    <div class="login-caption">清晰观察市场 · 纪律管理风险</div>
  </main>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Key, Lock, User, WarningFilled } from '@element-plus/icons-vue'
import { getCaptcha, getCurrentUser, login } from '@/api/auth'
import { setToken, setUser } from '@/utils/auth'
import { resetAuthRedirect } from '@/services/http'
const route = useRoute()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const captchaEnabled = ref(false)
const captchaImage = ref('')
const errorText = ref('')
// 从注册页“去登录”跳回时带 ?email=xxx，自动填入用户名
const form = reactive({ username: typeof route.query.email === 'string' ? route.query.email.trim() : '', password: '', code: '', uuid: '' })
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const registerLink = computed(() => EMAIL.test(form.username.trim()) ? { path: '/register', query: { email: form.username.trim() } } : '/register')
const rules = { username: [{ required: true, message: '请输入账号', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }
async function loadCaptcha() {
  try {
    const result = await getCaptcha()
    captchaEnabled.value = result?.captchaEnabled !== false
    captchaImage.value = captchaEnabled.value && result?.img ? `data:image/png;base64,${result.img}` : ''
    form.uuid = result?.uuid || ''
    if (!captchaEnabled.value) form.code = ''
  } catch (error) { errorText.value = error.message }
}
async function submit() {
  errorText.value = ''
  if (captchaEnabled.value && !form.code) { errorText.value = '请输入验证码'; return }
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    loading.value = true
    const result = await login({ username: form.username.trim(), password: form.password, code: form.code, uuid: form.uuid })
    if (!result?.token) throw new Error('登录接口未返回访问令牌')
    setToken(result.token)
    resetAuthRedirect()
    const info = await getCurrentUser()
    setUser(info?.user || {})
    router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/today')
  } catch (error) {
    errorText.value = error.message || '登录失败，请重试'
    if (captchaEnabled.value) await loadCaptcha()
  } finally { loading.value = false }
}
onMounted(loadCaptcha)
</script>
<style scoped>
.login-page{min-height:100vh;display:grid;place-items:center;position:relative;overflow:hidden;padding:28px;background:radial-gradient(ellipse at 12% 8%,#e0efff 0,transparent 34%),radial-gradient(ellipse at 90% 90%,#e6f1ff 0,transparent 33%),#f4f8fd}.login-glow{position:absolute;border:1px solid #b8d3f333;border-radius:50%;pointer-events:none}.glow-a{width:560px;height:560px;left:-280px;bottom:-210px}.glow-b{width:450px;height:450px;right:-215px;top:-220px}.login-card{z-index:1;width:min(100%,430px);padding:34px 38px 25px;border:1px solid #e5edf6;border-radius:19px;background:#ffffffed;box-shadow:0 24px 70px #193c6612;backdrop-filter:blur(12px)}.login-brand{display:flex;align-items:center;gap:11px;color:#15375f}.brand-mark{width:39px;height:39px;border-radius:12px;background:linear-gradient(145deg,#2878dc,#1556b2);color:white;display:grid;place-items:center;font-size:25px;font-weight:800;box-shadow:0 5px 12px #1b64bd33}.login-brand>div{display:flex;flex-direction:column;gap:3px}.login-brand strong{font-size:18px}.login-brand strong span{color:#3984dc}.login-brand small{font-size:8px;color:#91a0b5;letter-spacing:1.25px;font-weight:700}.login-heading{margin:34px 0 22px}.login-heading>span{font-size:11px;color:#4380c4;font-weight:700}.login-heading h1{margin:7px 0;font-size:24px;color:#19375c}.login-heading p{margin:0;color:#8998aa;font-size:12px}.login-card :deep(.el-input__wrapper){min-height:44px;border-radius:9px;box-shadow:0 0 0 1px #e6edf5 inset}.login-card :deep(.el-input__wrapper.is-focus){box-shadow:0 0 0 1px #6ca5e5 inset}.login-card :deep(.el-input__prefix){color:#92a3b8}.captcha-row :deep(.el-form-item__content){display:flex;gap:10px}.captcha-image{width:120px;flex:none;border:1px solid #e6edf5;border-radius:8px;background:#f6f9fc;display:grid;place-items:center;cursor:pointer;color:#68809d}.captcha-image img{width:100%;height:42px;object-fit:cover}.captcha-image span{font-size:10px}.submit-button{width:100%;height:45px;margin-top:4px;border-radius:9px;background:#2774cc;border-color:#2774cc;box-shadow:0 7px 16px #2774cc25}.login-switch{margin:16px 0 0;text-align:center;color:#8998aa;font-size:12px}.login-switch a{color:#2774cc;font-weight:600;text-decoration:none;margin-left:2px}.login-switch a:hover{text-decoration:underline}.login-error{display:flex;gap:6px;align-items:center;color:#cf5d57;font-size:11px;margin:13px 0 0}.login-foot{border-top:1px solid #edf1f6;margin-top:25px;padding-top:15px;display:flex;justify-content:space-between;color:#a1adbc;font-size:10px}.login-foot span:first-child:before{content:'';display:inline-block;width:6px;height:6px;background:#49af80;border-radius:50%;margin-right:6px}.login-caption{position:absolute;bottom:24px;color:#9aaabe;font-size:11px;letter-spacing:1px}@media(max-width:520px){.login-page{padding:18px}.login-card{padding:28px 22px 22px}.login-caption{bottom:9px;font-size:10px}}
</style>
