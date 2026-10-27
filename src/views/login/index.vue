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
import { resetAccess } from '@/utils/accessStore'
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
    resetAccess()
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

<style scoped>
/* ================= 长桥风格覆盖层（docs/longbridge-ui.md §5：深色渐变全屏 + 居中毛玻璃卡片 + 胶囊输入框与白色主按钮） ================= */
.login-page{
  --lb-text:#070a13;--lb-accent:#00b8b8;--lb-accent-bright:#00f0c4;--lb-up:#e8467c;
  --lb-on-dark:#fff;--lb-on-dark-2:rgba(255,255,255,.62);--lb-on-dark-3:rgba(255,255,255,.42);--lb-on-dark-border:rgba(255,255,255,.14);
  --lb-glass-dark:rgba(255,255,255,.08);--lb-blur:saturate(180%) blur(16px);--lb-ease:cubic-bezier(.2,.8,.2,1);
  padding:32px 20px;color:var(--lb-on-dark);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue","Microsoft YaHei",sans-serif;
  background:radial-gradient(circle at 50% 120%,rgba(0,240,196,.35),transparent 60%),radial-gradient(900px 480px at 85% -10%,rgba(0,240,196,.18),transparent 60%),radial-gradient(700px 420px at 0% 100%,rgba(0,184,184,.16),transparent 60%),linear-gradient(180deg,#05070d 0%,#0b1220 100%)
}
/* 青绿光线（替代视频背景） */
.login-page:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;
  background:repeating-linear-gradient(100deg,transparent 0 46px,rgba(0,240,196,.05) 46px 47px);
  -webkit-mask-image:radial-gradient(ellipse at 50% 100%,#000 0,transparent 70%);mask-image:radial-gradient(ellipse at 50% 100%,#000 0,transparent 70%)}
.login-glow{border-color:rgba(0,240,196,.14)}
.glow-a{width:720px;height:720px;left:-320px;bottom:-360px;box-shadow:0 0 120px rgba(0,240,196,.08) inset}
.glow-b{width:560px;height:560px;right:-240px;top:-260px;border-color:rgba(255,255,255,.08)}

/* 毛玻璃卡片 */
.login-card{position:relative;width:min(100%,440px);padding:40px 40px 28px;box-sizing:border-box;border:1px solid var(--lb-on-dark-border);border-radius:24px;
  background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.04));-webkit-backdrop-filter:var(--lb-blur);backdrop-filter:var(--lb-blur);
  box-shadow:0 1px 0 rgba(255,255,255,.08) inset,0 32px 80px rgba(0,0,0,.45)}
@supports not (backdrop-filter:blur(1px)){.login-card{background:rgba(17,24,39,.94)}}
.login-brand{gap:12px;color:var(--lb-on-dark)}
.brand-mark{width:40px;height:40px;border-radius:50%;background:var(--lb-accent-bright);color:var(--lb-text);font-size:22px;box-shadow:0 0 0 5px rgba(0,240,196,.16)}
.login-brand strong{font-size:20px;letter-spacing:.3px}
.login-brand strong span{color:var(--lb-accent-bright)}
.login-brand small{color:var(--lb-on-dark-3);font-size:9px;letter-spacing:1.6px}
.login-heading{margin:36px 0 28px}
.login-heading>span{display:inline-flex;align-items:center;gap:8px;padding:5px 12px;border:1px solid var(--lb-on-dark-border);border-radius:999px;background:var(--lb-glass-dark);color:rgba(255,255,255,.78);font-size:12px;font-weight:600;letter-spacing:1px}
.login-heading>span:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--lb-accent-bright);box-shadow:0 0 0 3px rgba(0,240,196,.18)}
.login-heading h1{margin:16px 0 10px;color:var(--lb-on-dark);font-size:34px;font-weight:700;line-height:1.15;letter-spacing:-.6px}
.login-heading p{color:var(--lb-on-dark-2);font-size:15px;line-height:1.6}

/* 胶囊输入框（深色区毛玻璃） */
.login-card :deep(.el-form-item){margin-bottom:16px}
.login-card :deep(.el-form-item.is-error){margin-bottom:28px}
.login-card :deep(.el-input__wrapper){min-height:52px;padding:0 20px;border-radius:999px;background:var(--lb-glass-dark);box-shadow:0 0 0 1px var(--lb-on-dark-border) inset;transition:box-shadow .2s var(--lb-ease),background .2s var(--lb-ease)}
.login-card :deep(.el-input__wrapper:hover){box-shadow:0 0 0 1px rgba(255,255,255,.28) inset}
.login-card :deep(.el-input__wrapper.is-focus){background:rgba(255,255,255,.12);box-shadow:0 0 0 1px var(--lb-accent-bright) inset,0 0 0 4px rgba(0,240,196,.14)}
.login-card :deep(.el-input__inner){height:50px;color:var(--lb-on-dark);font-size:15px;-webkit-text-fill-color:var(--lb-on-dark)}
.login-card :deep(.el-input__inner::placeholder){color:var(--lb-on-dark-3);-webkit-text-fill-color:var(--lb-on-dark-3)}
.login-card :deep(.el-input__inner:-webkit-autofill){-webkit-box-shadow:0 0 0 1000px #121a27 inset;-webkit-text-fill-color:#fff;caret-color:#fff;transition:background-color 9999s}
.login-card :deep(.el-input__prefix),.login-card :deep(.el-input__suffix),.login-card :deep(.el-input__password){color:var(--lb-on-dark-2);font-size:16px}
.login-card :deep(.el-form-item.is-error .el-input__wrapper){box-shadow:0 0 0 1px var(--lb-up) inset}
.login-card :deep(.el-form-item__error){padding:4px 0 0 20px;color:#ff7aa5;font-size:12px}
.captcha-row :deep(.el-form-item__content){gap:10px;flex-wrap:nowrap}
.captcha-image{height:52px;min-width:120px;padding:0 6px;border:1px solid var(--lb-on-dark-border);border-radius:999px;background:#fff;overflow:hidden;cursor:pointer}
.captcha-image img{height:40px;border-radius:999px}
.captcha-image span{color:var(--lb-text);font-size:13px}

/* 白色主按钮（深色区） */
.submit-button{width:100%;height:52px;margin-top:8px;border:0;border-radius:999px;background:#fff;color:var(--lb-text);font-size:18px;font-weight:700;letter-spacing:2px;transition:transform .2s var(--lb-ease),box-shadow .2s var(--lb-ease),background .2s}
.submit-button:hover,.submit-button:focus-visible{background:#fff;color:var(--lb-text);transform:translateY(-1px);box-shadow:0 10px 28px rgba(0,240,196,.28)}
.submit-button:active{transform:none}
.submit-button.is-loading{background:rgba(255,255,255,.86);color:var(--lb-text)}

.login-error{display:flex;align-items:center;gap:8px;margin:16px 0 0;padding:10px 16px;border:1px solid rgba(232,70,124,.32);border-radius:14px;background:rgba(232,70,124,.12);color:#ff9dbd;font-size:13px}
.login-switch{margin:22px 0 0;color:var(--lb-on-dark-2);font-size:14px;text-align:center}
.login-switch a{color:var(--lb-accent-bright);font-weight:600;text-decoration:none}
.login-switch a:hover{text-decoration:underline}
.login-foot{margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08);color:var(--lb-on-dark-3);font-size:12px}
.login-foot span:first-child:before{background:var(--lb-accent-bright);box-shadow:0 0 0 3px rgba(0,240,196,.18)}
.login-caption{z-index:1;color:var(--lb-on-dark-3);font-size:13px;letter-spacing:4px}

@media(prefers-reduced-motion:reduce){.submit-button{transition:none}.submit-button:hover{transform:none}}
@media(max-width:760px){
  .login-page{padding:24px 16px}
  .login-card{padding:32px 24px 24px;border-radius:20px}
  .login-heading{margin:28px 0 22px}
  .login-heading h1{font-size:28px}
  .login-heading p{font-size:14px}
  .submit-button{height:48px;font-size:17px}
}
</style>
