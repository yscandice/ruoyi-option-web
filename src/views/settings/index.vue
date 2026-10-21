<template>
  <div class="settings-page">
    <section class="lb-hero"><div class="lb-wrap">
    <section class="page-heading">
      <div>
        <span class="eyebrow"><i /> ACCOUNT &amp; PREFERENCES</span>
        <h1>设置</h1>
        <p>管理个人资料、通知偏好和工作台显示方式。</p>
      </div>
      <span class="demo-chip"><el-icon><InfoFilled /></el-icon> {{ loaded ? '已同步到账户' : (loadError ? '设置读取失败' : '正在读取设置') }}</span>
    </section>
    </div></section>

    <div class="lb-wrap lb-body">
    <div class="settings-layout">
      <aside class="settings-sidebar panel">
        <div class="sidebar-title"><span class="sidebar-icon"><el-icon><Setting /></el-icon></span><div><strong>设置中心</strong><small>账户与工作台偏好</small></div></div>
        <nav aria-label="设置分类">
          <button v-for="section in sections" :key="section.id" :class="['section-link', { active: activeSection === section.id }]" @click="goToSection(section.id)">
            <el-icon><component :is="section.icon" /></el-icon><span>{{ section.label }}</span><el-icon class="section-arrow"><ArrowRight /></el-icon>
          </button>
        </nav>
        <div class="sidebar-hint"><el-icon><InfoFilled /></el-icon><span>资料与通知偏好保存到账户，多设备同步；工作台显示仅保存在当前浏览器。</span></div>
      </aside>

      <main class="settings-content">
        <div v-if="loadError" class="load-error panel"><el-icon><WarningFilled /></el-icon><span>{{ loadError }}</span><el-button plain :loading="loading" @click="loadSettings">重新读取</el-button></div>

        <section id="profile" v-loading="loading && !loaded" class="settings-card panel">
          <div class="card-heading"><div><span class="section-kicker">YOUR PROFILE</span><h2>个人资料</h2><p>设置在工作台中显示的名称、关注标的与策略偏好。</p></div><span class="heading-icon blue"><el-icon><User /></el-icon></span></div>
          <div class="profile-summary">
            <div class="profile-avatar"><img v-if="avatarUrl" :src="avatarUrl" alt="头像"><template v-else>{{ avatarInitial }}</template></div>
            <div class="profile-summary-copy"><strong>{{ profileForm.displayName || '交易员' }}</strong><span>{{ profile.email || '工作台账户' }}</span></div>
            <el-button plain class="avatar-button" :loading="avatarUploading" :disabled="!loaded" @click="avatarInput?.click()"><el-icon><Camera /></el-icon>更换头像</el-button>
            <input ref="avatarInput" class="avatar-input" type="file" accept="image/png,image/jpeg,image/gif,image/bmp" @change="onAvatarChange">
          </div>
          <div class="form-grid">
            <label class="form-field"><span>显示名称</span><el-input v-model="profileForm.displayName" maxlength="30" show-word-limit placeholder="1–30 个字" :disabled="!loaded" @input="profileErrors.displayName = ''" /><em v-if="profileErrors.displayName" class="field-error">{{ profileErrors.displayName }}</em></label>
            <label class="form-field"><span>登录邮箱 <small>不可修改</small></span><el-input :model-value="profile.email" readonly disabled placeholder="—"><template #suffix><el-icon><Lock /></el-icon></template></el-input></label>
          </div>
          <div class="form-field watch-field">
            <span>关注标的 <small>{{ profileForm.watchSymbols.length }} / {{ WATCH_MAX }} · 大写字母、数字、点，1–10 位</small></span>
            <div :class="['symbol-box', { invalid: profileErrors.watchSymbols }]" @click="symbolInput?.focus()">
              <span v-for="(symbol, index) in profileForm.watchSymbols" :key="symbol" class="symbol-chip">{{ symbol }}<button type="button" :aria-label="`移除 ${symbol}`" :disabled="!loaded" @click.stop="removeSymbol(index)"><el-icon><Close /></el-icon></button></span>
              <input ref="symbolInput" v-model="symbolDraft" class="symbol-input" :placeholder="profileForm.watchSymbols.length ? '继续添加' : '输入代码后回车，如 SPY、BRK.B'" maxlength="600" :disabled="!loaded" @input="onSymbolInput" @keydown.enter.prevent="commitSymbols" @keydown.,.prevent="commitSymbols" @keydown.space.prevent="commitSymbols" @keydown.backspace="onSymbolBackspace" @blur="commitSymbols">
            </div>
            <em v-if="profileErrors.watchSymbols" class="field-error">{{ profileErrors.watchSymbols }}</em>
          </div>
          <div class="form-field">
            <span>策略偏好</span>
            <div class="strategy-options">
              <button v-for="item in strategyItems" :key="item.key" type="button" :class="['strategy-option', { on: profileForm.strategyPreferences[item.key] }]" :aria-pressed="profileForm.strategyPreferences[item.key]" :disabled="!loaded" @click="profileForm.strategyPreferences[item.key] = !profileForm.strategyPreferences[item.key]"><el-icon><component :is="profileForm.strategyPreferences[item.key] ? CircleCheck : CirclePlus" /></el-icon><span><strong>{{ item.title }}</strong><small>{{ item.description }}</small></span></button>
            </div>
            <em v-if="profileErrors.strategyPreferences" class="field-error">{{ profileErrors.strategyPreferences }}</em>
          </div>
          <div class="preference-row compact-row"><span class="preference-symbol orange"><el-icon><Bell /></el-icon></span><div class="preference-copy"><strong>强提醒</strong><small>重要提醒（保护、止盈、结算）以更醒目的方式提示。</small></div><el-switch v-model="profileForm.strongAlerts" aria-label="强提醒" :disabled="!loaded" /></div>
          <div class="card-actions"><span class="save-hint">{{ profile.updatedAt ? `上次保存 ${formatTime(profile.updatedAt)}` : '保存后在所有设备生效' }}</span><el-button type="primary" :loading="profileSaving" :disabled="!loaded" @click="saveProfile"><el-icon><Check /></el-icon>保存资料</el-button></div>
        </section>

        <section id="notifications" v-loading="loading && !loaded" class="settings-card panel">
          <div class="card-heading"><div><span class="section-kicker">NOTIFICATIONS</span><h2>通知偏好</h2><p>选择你希望在工作台中关注的提醒类型。</p></div><span class="heading-icon violet"><el-icon><Bell /></el-icon></span></div>
          <div class="preference-list">
            <div v-for="item in notificationItems" :key="item.key" class="preference-row"><span class="preference-symbol" :class="item.tone"><el-icon><component :is="item.icon" /></el-icon></span><div class="preference-copy"><strong>{{ item.title }}</strong><small>{{ item.description }}</small></div><el-switch v-model="prefs[item.key]" :aria-label="item.title" :disabled="!loaded" /></div>
          </div>
          <div class="card-actions"><span class="save-hint">{{ notifications.updatedAt ? `上次保存 ${formatTime(notifications.updatedAt)}` : '当前为默认设置' }}</span><el-button plain :loading="notifyResetting" :disabled="!loaded" @click="resetNotifications"><el-icon><RefreshLeft /></el-icon>恢复默认</el-button><el-button type="primary" :loading="notifySaving" :disabled="!loaded" @click="saveNotifications"><el-icon><Check /></el-icon>保存通知</el-button></div>
        </section>

        <section id="display" class="settings-card panel">
          <div class="card-heading"><div><span class="section-kicker">WORKSPACE DISPLAY</span><h2>工作台显示</h2><p>调整日期、时区和内容密度的显示偏好。</p></div><span class="heading-icon cyan"><el-icon><Monitor /></el-icon></span></div>
          <div class="display-grid">
            <label class="form-field"><span>交易日时区</span><el-select v-model="preferences.timezone" aria-label="交易日时区"><el-option label="美国东部时间（ET）" value="ET"/><el-option label="北京时间（UTC+8）" value="Asia/Shanghai"/><el-option label="协调世界时（UTC）" value="UTC"/></el-select><small>日期分组将使用所选时区显示。</small></label>
            <label class="form-field"><span>界面语言</span><el-select v-model="preferences.language" aria-label="界面语言"><el-option label="简体中文" value="zh-CN"/><el-option label="English" value="en-US"/></el-select><small>部分演示页面目前仅提供中文。</small></label>
          </div>
          <div class="preference-row compact-row"><span class="preference-symbol blue"><el-icon><Monitor /></el-icon></span><div class="preference-copy"><strong>紧凑信息卡片</strong><small>减少卡片间距，在同一屏幕中查看更多内容。</small></div><el-switch v-model="preferences.compactCards" aria-label="紧凑信息卡片" /></div>
          <div class="card-actions"><span class="save-hint">仅保存在当前浏览器</span><el-button type="primary" @click="savePreferences"><el-icon><Check /></el-icon>保存显示偏好</el-button></div>
        </section>

        <section id="security" class="settings-card panel">
          <div class="card-heading"><div><span class="section-kicker">ACCOUNT SECURITY</span><h2>账户安全</h2><p>查看账户保护方式与会话信息。</p></div><span class="heading-icon orange"><el-icon><Lock /></el-icon></span></div>
          <div class="security-row"><span class="security-symbol"><el-icon><Message /></el-icon></span><div class="security-copy"><strong>登录账户</strong><small>{{ profile.email || '当前浏览器已登录' }}</small></div><span class="security-status"><el-icon><CircleCheck /></el-icon> 已验证</span></div>
          <div class="security-row"><span class="security-symbol"><el-icon><Lock /></el-icon></span><div class="security-copy"><strong>登录密码</strong><small>••••••••••••</small></div><el-button plain @click="openPasswordDialog">修改密码 <el-icon><ArrowRight /></el-icon></el-button></div>
          <div class="security-row"><span class="security-symbol"><el-icon><Monitor /></el-icon></span><div class="security-copy"><strong>当前会话</strong><small>此浏览器 · 当前设备</small></div><span class="current-session"><i /> 正在使用</span></div>
        </section>
        <section id="services" class="settings-card panel">
          <div class="card-heading"><div><span class="section-kicker">MORE SERVICES</span><h2>更多服务</h2><p>以下功能本期暂未开放，开放后会在这里提供入口。</p></div><span class="heading-icon blue"><el-icon><Grid /></el-icon></span></div>
          <div v-for="item in serviceItems" :key="item.key" class="security-row"><span class="security-symbol"><el-icon><component :is="item.icon" /></el-icon></span><div class="security-copy"><strong>{{ item.title }}</strong><small>{{ item.description }}</small></div><span class="closed-status">{{ features[item.key] ? '即将上线' : '暂未开放' }}</span></div>
        </section>
      </main>
    </div>
    </div>

    <el-dialog v-model="passwordVisible" title="修改密码" width="min(420px, calc(100vw - 32px))" :close-on-click-modal="false" @closed="resetPasswordForm">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top" class="password-form" @submit.prevent>
        <el-form-item label="当前密码" prop="oldPassword" :error="passwordError"><el-input v-model="passwordForm.oldPassword" type="password" show-password maxlength="20" autocomplete="current-password" placeholder="请输入当前密码" @input="passwordError = ''" /></el-form-item>
        <el-form-item label="新密码" prop="newPassword"><el-input v-model="passwordForm.newPassword" type="password" show-password maxlength="20" autocomplete="new-password" placeholder="8–20 位，含字母和数字" /></el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword"><el-input v-model="passwordForm.confirmPassword" type="password" show-password maxlength="20" autocomplete="new-password" placeholder="再次输入新密码" @keyup.enter="submitPassword" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="passwordVisible = false">取消</el-button><el-button type="primary" :loading="passwordSaving" @click="submitPassword">确认修改</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Bell, Calendar, Camera, Check, CircleCheck, CirclePlus, Close, Coin, DataAnalysis, Grid, Key, Present, Service, InfoFilled, Lock, Message, Monitor, Mute, RefreshLeft, Setting, TrendCharts, User, WarningFilled, Umbrella } from '@element-plus/icons-vue'
import { getMemberSettings, resetMemberNotifications, updateMemberNotifications, updateMemberPassword, updateMemberProfile, uploadMemberAvatar } from '@/api/member'
import { logout } from '@/api/auth'
import { isHandledError } from '@/services/http'
import { clearSession, getUser, setUser } from '@/utils/auth'
import { resetAccess } from '@/utils/accessStore'

// 设置页（W5）：资料、通知偏好走会员设置接口（乐观锁 updatedAt，409 提示刷新）；工作台显示仅保存在本地
const WATCH_MAX = 50
const WATCH_PATTERN = /^[A-Z0-9.]{1,10}$/
const NAME_MAX = 30
const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)\S{8,20}$/
const CONFLICT_MESSAGE = '设置已在其他设备修改，请刷新'
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const router = useRouter()
const sections = [
  { id: 'profile', label: '个人资料', icon: User },
  { id: 'notifications', label: '通知偏好', icon: Bell },
  { id: 'display', label: '工作台显示', icon: Monitor },
  { id: 'security', label: '账户安全', icon: Lock },
  { id: 'services', label: '更多服务', icon: Grid }
]
// 不开放的功能（W7）：只展示“暂未开放”，不请求推荐码等数据、不触发浏览器通知授权
const serviceItems = [
  { key: 'referrals', title: '邀请好友', description: '邀请好友注册与推荐奖励。', icon: Present },
  { key: 'push', title: '消息推送', description: '浏览器 / 手机推送提醒。', icon: Bell },
  { key: 'apiKeys', title: 'API Key', description: '通过 API 获取信号数据。', icon: Key },
  { key: 'advisoryContact', title: '顾问服务', description: '一对一顾问联系方式。', icon: Service }
]
const features = reactive({ referrals: false, push: false, apiKeys: false, advisoryContact: false })
const strategyItems = [
  { key: 'seller', title: '卖方策略', description: '卖出期权收取权利金' },
  { key: 'midterm', title: '中期策略', description: '数周到数月的趋势仓位' },
  { key: 'buyer', title: '买方策略', description: '买入期权博取方向波动' }
]
// 9 个通知开关（key 与后端 prefs 一致）
const notificationItems = [
  { key: 'new_signal', title: '新信号', description: '工作台出现新的期权信号时提醒我。', icon: TrendCharts, tone: 'blue' },
  { key: 'protection_window', title: '保护窗口', description: '持仓进入保护窗口、需要考虑保护动作时提醒我。', icon: Umbrella, tone: 'orange' },
  { key: 'take_profit_window', title: '止盈窗口', description: '持仓进入止盈窗口时提醒我。', icon: Coin, tone: 'blue' },
  { key: 'settlement', title: '结算', description: '信号到期结算或平仓了结后提醒结果。', icon: DataAnalysis, tone: 'violet' },
  { key: 'weekly_scorecard', title: '每周战绩', description: '每周收到一份战绩汇总。', icon: Calendar, tone: 'blue' },
  { key: 'product_update', title: '产品更新', description: '工作台上线新功能和体验优化时提醒我。', icon: InfoFilled, tone: 'violet' },
  { key: 'silent_reminder', title: '静默提醒', description: '提醒以静默方式送达，不打扰。', icon: Mute, tone: 'orange' },
  { key: 'management_stop', title: '动态管理止损', description: '动态管理触发止损时提醒我。', icon: WarningFilled, tone: 'orange' },
  { key: 'manage_adopted_only', title: '只提醒已采纳的信号', description: '管理类提醒只针对我标记“跟了”的信号。', icon: CircleCheck, tone: 'blue' }
]
const NOTIFY_DEFAULTS = { new_signal: true, protection_window: true, take_profit_window: true, settlement: true, weekly_scorecard: true, product_update: true, silent_reminder: false, management_stop: false, manage_adopted_only: false }

const loading = ref(false)
const loaded = ref(false)
const loadError = ref('')
const profile = reactive({ email: '', avatar: null, updatedAt: null })
const profileForm = reactive({ displayName: '', watchSymbols: [], strategyPreferences: { seller: false, midterm: false, buyer: false }, strongAlerts: false })
const profileErrors = reactive({ displayName: '', watchSymbols: '', strategyPreferences: '' })
const notifications = reactive({ updatedAt: null })
const prefs = reactive({ ...NOTIFY_DEFAULTS })
const profileSaving = ref(false)
const notifySaving = ref(false)
const notifyResetting = ref(false)
const avatarUploading = ref(false)
const avatarInput = ref(null)
const symbolInput = ref(null)
const symbolDraft = ref('')
const activeSection = ref('profile')
const preferences = reactive({ timezone: 'ET', language: 'zh-CN', compactCards: false })

const avatarUrl = computed(() => {
  const value = profile.avatar
  if (!value) return ''
  return /^(https?:)?\/\//.test(value) || value.startsWith('data:') ? value : `${API_BASE}${value}`
})
const avatarInitial = computed(() => (profileForm.displayName || '交').trim().slice(0, 1).toUpperCase())

function formatTime(value) {
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  const pad = n => String(n).padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function applyProfile(payload) {
  // 保存接口返回 { profile }，读取接口直接是 profile
  const data = payload?.profile || payload
  if (!data) return
  profile.email = data.email || ''
  profile.avatar = data.avatar || null
  profile.updatedAt = data.updatedAt ?? null
  profileForm.displayName = data.displayName || ''
  profileForm.watchSymbols = Array.isArray(data.watchSymbols) ? [...data.watchSymbols] : []
  Object.assign(profileForm.strategyPreferences, { seller: false, midterm: false, buyer: false }, data.strategyPreferences || {})
  profileForm.strongAlerts = data.strongAlerts === true
  Object.keys(profileErrors).forEach(key => { profileErrors[key] = '' })
  // 同步页头显示的昵称 / 头像
  const user = getUser()
  if (user.nickName !== profileForm.displayName || (data.avatar && user.avatar !== data.avatar)) {
    setUser({ ...user, nickName: profileForm.displayName || user.nickName, avatar: data.avatar || user.avatar })
    window.dispatchEvent(new Event('option-user-updated'))
  }
}
function applyNotifications(payload) {
  const data = payload?.notifications || payload
  if (!data) return
  Object.assign(prefs, NOTIFY_DEFAULTS, data.prefs || {})
  notifications.updatedAt = data.updatedAt ?? null
}

// 进入页面一次请求拿到资料、通知、更新进度
async function loadSettings() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await getMemberSettings()
    applyProfile(res.data?.profile)
    applyNotifications(res.data?.notifications)
    Object.keys(features).forEach(key => { features[key] = res.data?.features?.[key] === true })
    loaded.value = true
  } catch (error) {
    if (!isHandledError(error)) loadError.value = error.message || '设置读取失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function showConflict() {
  await ElMessageBox.alert(CONFLICT_MESSAGE, '设置已更新', { confirmButtonText: '刷新', type: 'warning', showClose: false }).catch(() => {})
  await loadSettings()
}

// ---- 关注标的：输入自动转大写，回车 / 逗号 / 空格确认 ----
function onSymbolInput() {
  symbolDraft.value = symbolDraft.value.toUpperCase()
  profileErrors.watchSymbols = ''
}
function commitSymbols() {
  const parts = symbolDraft.value.toUpperCase().split(/[\s,，、]+/).map(item => item.trim()).filter(Boolean)
  if (!parts.length) { symbolDraft.value = ''; return }
  const invalid = parts.find(item => !WATCH_PATTERN.test(item))
  if (invalid) { profileErrors.watchSymbols = `代码格式不正确：${invalid}（大写字母、数字、点，1–10 位）`; return }
  const next = [...profileForm.watchSymbols]
  parts.forEach(item => { if (!next.includes(item)) next.push(item) })
  if (next.length > WATCH_MAX) { profileErrors.watchSymbols = `关注标的最多 ${WATCH_MAX} 个`; return }
  profileForm.watchSymbols = next
  symbolDraft.value = ''
}
function removeSymbol(index) {
  profileForm.watchSymbols.splice(index, 1)
  profileErrors.watchSymbols = ''
}
function onSymbolBackspace() {
  if (!symbolDraft.value && profileForm.watchSymbols.length) removeSymbol(profileForm.watchSymbols.length - 1)
}

function validateProfile() {
  let ok = true
  const name = profileForm.displayName.trim()
  if (!name || name.length > NAME_MAX) { profileErrors.displayName = `显示名称需为 1–${NAME_MAX} 个字`; ok = false }
  if (symbolDraft.value.trim()) { commitSymbols(); if (profileErrors.watchSymbols) ok = false }
  const invalid = profileForm.watchSymbols.find(item => !WATCH_PATTERN.test(item))
  if (invalid) { profileErrors.watchSymbols = `代码格式不正确：${invalid}（大写字母、数字、点，1–10 位）`; ok = false }
  else if (profileForm.watchSymbols.length > WATCH_MAX) { profileErrors.watchSymbols = `关注标的最多 ${WATCH_MAX} 个`; ok = false }
  return ok
}

// 400 字段错误放到对应字段下
function showProfileError(message) {
  if (/displayName|昵称|显示名称/.test(message)) profileErrors.displayName = message.replace(/^displayName\s*/, '显示名称')
  else if (/watchSymbols|关注标的/.test(message)) profileErrors.watchSymbols = message.replace(/^watchSymbols\s*/, '关注标的')
  else if (/strategyPreferences|策略/.test(message)) profileErrors.strategyPreferences = message
  else ElMessage.error(message)
}

async function saveProfile() {
  if (!validateProfile()) return
  profileSaving.value = true
  try {
    const res = await updateMemberProfile({
      displayName: profileForm.displayName.trim(),
      watchSymbols: [...profileForm.watchSymbols],
      strategyPreferences: { ...profileForm.strategyPreferences },
      strongAlerts: profileForm.strongAlerts,
      updatedAt: profile.updatedAt
    })
    applyProfile(res.data)
    ElMessage.success('资料已保存')
  } catch (error) {
    if (error.code === 409) await showConflict()
    else if (error.code === 400) showProfileError(error.message)
    else if (!isHandledError(error)) ElMessage.error(error.message || '保存失败，请稍后再试')
  } finally {
    profileSaving.value = false
  }
}

async function saveNotifications() {
  notifySaving.value = true
  try {
    const res = await updateMemberNotifications({ prefs: { ...prefs }, updatedAt: notifications.updatedAt })
    applyNotifications(res.data)
    ElMessage.success('通知偏好已保存')
  } catch (error) {
    if (error.code === 409) await showConflict()
    else if (!isHandledError(error)) ElMessage.error(error.message || '保存失败，请稍后再试')
  } finally {
    notifySaving.value = false
  }
}

async function resetNotifications() {
  try {
    await ElMessageBox.confirm('9 个通知开关将恢复为默认设置。', '恢复默认', { confirmButtonText: '恢复默认', cancelButtonText: '取消', type: 'warning' })
  } catch { return }
  notifyResetting.value = true
  try {
    const res = await resetMemberNotifications()
    applyNotifications(res.data)
    ElMessage.success('已恢复默认通知设置')
  } catch (error) {
    if (!isHandledError(error)) ElMessage.error(error.message || '恢复失败，请稍后再试')
  } finally {
    notifyResetting.value = false
  }
}

// ---- 头像 ----
async function onAvatarChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!/^image\/(png|jpe?g|gif|bmp)$/.test(file.type)) { ElMessage.warning('请选择 JPG、PNG、GIF 或 BMP 图片'); return }
  if (file.size > 2 * 1024 * 1024) { ElMessage.warning('图片不能超过 2MB'); return }
  avatarUploading.value = true
  try {
    const res = await uploadMemberAvatar(file)
    profile.avatar = res.imgUrl || profile.avatar
    setUser({ ...getUser(), avatar: profile.avatar })
    window.dispatchEvent(new Event('option-user-updated'))
    ElMessage.success('头像已更新')
  } catch (error) {
    if (!isHandledError(error)) ElMessage.error(error.message || '上传失败，请稍后再试')
  } finally {
    avatarUploading.value = false
  }
}

// ---- 修改密码（若依接口），成功后重新登录 ----
const passwordVisible = ref(false)
const passwordSaving = ref(false)
const passwordError = ref('')
const passwordFormRef = ref(null)
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { pattern: PASSWORD, message: '密码需为 8–20 位，同时包含字母和数字，不能有空格', trigger: 'blur' },
    { validator: (rule, value, callback) => value && value === passwordForm.oldPassword ? callback(new Error('新密码不能与当前密码相同')) : callback(), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: (rule, value, callback) => value !== passwordForm.newPassword ? callback(new Error('两次输入的密码不一致')) : callback(), trigger: 'blur' }
  ]
}
function openPasswordDialog() { passwordVisible.value = true }
function resetPasswordForm() {
  Object.assign(passwordForm, { oldPassword: '', newPassword: '', confirmPassword: '' })
  passwordError.value = ''
  passwordFormRef.value?.clearValidate()
}
async function submitPassword() {
  if (!(await passwordFormRef.value?.validate().catch(() => false))) return
  passwordSaving.value = true
  try {
    await updateMemberPassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
    passwordVisible.value = false
    await ElMessageBox.alert('密码已修改，请使用新密码重新登录。', '修改成功', { confirmButtonText: '重新登录', type: 'success', showClose: false }).catch(() => {})
    const email = profile.email
    try { await logout() } catch {}
    clearSession()
    resetAccess()
    router.replace({ path: '/login', query: email ? { email } : {} })
  } catch (error) {
    if (/旧密码/.test(error.message || '')) passwordError.value = '当前密码不正确'
    else if (!isHandledError(error)) ElMessage.error(error.message || '修改失败，请稍后再试')
  } finally {
    passwordSaving.value = false
  }
}

// ---- 工作台显示：仅本地 ----
function savePreferences() {
  localStorage.setItem('option-web-settings', JSON.stringify(preferences))
  ElMessage.success('显示偏好已保存在当前浏览器')
}

function goToSection(id) {
  activeSection.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('option-web-settings') || '{}')
    if (saved.timezone) preferences.timezone = saved.timezone
    if (saved.language) preferences.language = saved.language
    if (typeof saved.compactCards === 'boolean') preferences.compactCards = saved.compactCards
  } catch {}
  loadSettings()
})
</script>

<style scoped>
.settings-page{--ink:#1d3150;--muted:#7d8da4;--line:#e8eef6;color:var(--ink)}
.panel{background:#fff;border:1px solid var(--line);border-radius:15px;box-shadow:0 8px 28px rgba(30,67,112,.035)}
.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:0 0 20px}.eyebrow,.section-kicker{display:flex;align-items:center;gap:8px;color:#6e8caf;font-size:10px;font-weight:800;letter-spacing:1.2px}.eyebrow i{width:7px;height:7px;border-radius:50%;background:#59b697;box-shadow:0 0 0 4px #e9f7f2}.page-heading h1{margin:9px 0 5px;color:#172f53;font-size:28px;letter-spacing:-.5px}.page-heading p{margin:0;color:#8391a6;font-size:13px}.demo-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid #e4edf7;border-radius:18px;background:#fff;color:#8798ad;font-size:10px;white-space:nowrap}
.settings-layout{display:grid;grid-template-columns:230px minmax(0,1fr);align-items:start;gap:18px}.settings-sidebar{position:sticky;top:94px;padding:17px 12px}.sidebar-title{display:flex;align-items:center;gap:10px;padding:2px 5px 16px;border-bottom:1px solid #eff2f7}.sidebar-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#eff6ff;color:#4181ca;font-size:16px}.sidebar-title strong,.sidebar-title small{display:block}.sidebar-title strong{color:#344c6c;font-size:12px}.sidebar-title small{margin-top:4px;color:#98a6b7;font-size:9px}.settings-sidebar nav{display:grid;gap:4px;padding-top:11px}.section-link{width:100%;height:39px;padding:0 10px;display:flex;align-items:center;gap:9px;border:0;border-radius:8px;background:transparent;color:#71839b;text-align:left;font-size:11px;cursor:pointer;transition:.15s}.section-link:hover{background:#f5f8fc;color:#376fae}.section-link.active{background:#edf5ff;color:#2d72c4;font-weight:700}.section-link .el-icon{font-size:14px}.section-link .section-arrow{margin-left:auto;font-size:12px;opacity:.65}.sidebar-hint{display:flex;align-items:flex-start;gap:7px;margin:18px 2px 0;padding:10px 9px;border-radius:8px;background:#f5f8fc;color:#8798ad;font-size:9px;line-height:1.65}.sidebar-hint .el-icon{margin-top:1px;flex:none;color:#76a0cc}
.settings-content{display:grid;gap:14px}.settings-card{padding:19px 21px;scroll-margin-top:94px}.card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding-bottom:15px;border-bottom:1px solid #eef2f7}.section-kicker{font-size:9px;color:#8ca2bc}.card-heading h2{margin:6px 0 4px;color:#294465;font-size:16px}.card-heading p{margin:0;color:#8b9aaf;font-size:10px}.heading-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;font-size:15px;flex:none}.heading-icon.blue{background:#edf5ff;color:#4787d0}.heading-icon.violet{background:#f2efff;color:#8a79ca}.heading-icon.cyan{background:#eaf8fa;color:#48a1ae}.heading-icon.orange{background:#fff5e9;color:#ce9650}.profile-summary{display:flex;align-items:center;gap:11px;padding:15px 0 14px}.profile-avatar{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(145deg,#70a6e8,#3e78c1);color:#fff;font-size:17px;font-weight:700;box-shadow:0 5px 12px #3270b42a}.profile-summary-copy strong,.profile-summary-copy span{display:block}.profile-summary-copy strong{color:#3d5574;font-size:12px}.profile-summary-copy span{margin-top:4px;color:#96a4b5;font-size:9px}.local-badge{display:inline-flex;align-items:center;gap:5px;margin-left:auto;padding:5px 8px;border-radius:6px;background:#f3f8fd;color:#859bb3;font-size:9px}.local-badge i{width:5px;height:5px;border-radius:50%;background:#6db59a}.form-grid,.display-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.form-field{display:flex;flex-direction:column;gap:7px;color:#667b96;font-size:10px;font-weight:600}.form-field>span{display:flex;gap:5px;align-items:center}.form-field small{font-size:9px;color:#a0acbb;font-weight:400}.form-field :deep(.el-input__wrapper),.form-field :deep(.el-select__wrapper){min-height:36px;border-radius:8px;box-shadow:0 0 0 1px #e6edf5 inset;background:#fbfcfe}.form-field :deep(.el-input__inner){font-size:11px;color:#3d5573}.form-field :deep(.el-select){width:100%}.card-actions{display:flex;align-items:center;justify-content:flex-end;gap:15px;margin-top:15px}.save-hint{margin-right:auto;color:#a0acbb;font-size:9px}.card-actions :deep(.el-button),.save-bar :deep(.el-button){height:32px;padding:0 13px;border-radius:8px;font-size:10px}.card-actions :deep(.el-button .el-icon),.save-bar :deep(.el-button .el-icon){margin-right:5px}
.preference-list{padding-top:3px}.preference-row{min-height:59px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #f0f3f7}.preference-row:last-child{border-bottom:0}.preference-symbol,.security-symbol{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;flex:none;font-size:13px}.preference-symbol.blue{background:#eef5ff;color:#4b88cf}.preference-symbol.orange{background:#fff5ea;color:#ce9651}.preference-symbol.violet{background:#f3f0ff;color:#8978c7}.preference-copy,.security-copy{min-width:0;flex:1}.preference-copy strong,.security-copy strong{display:block;color:#435a78;font-size:10px;font-weight:650}.preference-copy small,.security-copy small{display:block;margin-top:4px;color:#94a2b4;font-size:9px;line-height:1.5}.preference-row :deep(.el-switch){--el-switch-on-color:#4b88d0;--el-switch-off-color:#d8e0ea}.display-grid{padding:15px 0}.display-grid .form-field small{line-height:1.4}.compact-row{border-top:1px solid #f0f3f7;padding-top:2px}.compact-row .preference-symbol{background:#eef5ff;color:#4b88cf}.security-row{min-height:58px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #f0f3f7}.security-row:last-child{border-bottom:0}.security-symbol{background:#f2f6fb;color:#7792b2}.security-status,.current-session{display:inline-flex;align-items:center;gap:5px;color:#55a184;font-size:9px;white-space:nowrap}.security-row :deep(.el-button){height:28px;padding:0 9px;border-color:#e2eaf3;border-radius:7px;color:#6883a2;font-size:9px}.security-row :deep(.el-button .el-icon){margin-left:5px}.current-session i{width:6px;height:6px;border-radius:50%;background:#56b28d;box-shadow:0 0 0 3px #e7f6ef}.save-bar{position:sticky;bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 13px;border-color:#deebf8;box-shadow:0 8px 24px #214c7c12}.save-bar>span{display:flex;align-items:center;gap:7px;color:#8495aa;font-size:9px}.save-bar>span .el-icon{color:#6e99c6}.notice-content{display:flex;align-items:flex-start;gap:12px}.notice-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#eff6ff;color:#5588c0;flex:none}.notice-content p{margin:2px 0;color:#657991;font-size:12px;line-height:1.75}
@media(max-width:900px){.settings-layout{grid-template-columns:190px minmax(0,1fr);gap:12px}.settings-sidebar{padding:14px 9px}.settings-card{padding:17px}.save-bar{bottom:8px}}
@media(max-width:680px){.page-heading{align-items:flex-start}.page-heading h1{font-size:25px}.page-heading p{max-width:250px;line-height:1.6}.demo-chip{padding:6px 8px;font-size:9px}.settings-layout{display:flex;flex-direction:column;gap:12px}.settings-sidebar{position:static;width:100%;padding:10px}.sidebar-title{padding:2px 4px 10px}.sidebar-icon{width:30px;height:30px}.settings-sidebar nav{display:flex;gap:6px;overflow:auto;padding-top:9px}.section-link{width:auto;min-width:max-content;height:33px;padding:0 9px;gap:6px;font-size:9px}.section-link .section-arrow,.sidebar-hint{display:none}.settings-content{width:100%;gap:11px}.settings-card{padding:15px 13px;scroll-margin-top:12px}.card-heading{padding-bottom:12px}.card-heading h2{font-size:15px}.card-heading p{max-width:250px;font-size:9px;line-height:1.5}.heading-icon{width:31px;height:31px}.form-grid,.display-grid{grid-template-columns:1fr;gap:11px}.profile-summary{padding:12px 0}.profile-avatar{width:38px;height:38px}.preference-row{min-height:56px;gap:8px}.preference-copy small{max-width:230px}.security-row{gap:8px}.security-row :deep(.el-button){padding:0 7px}.save-bar{position:static}.save-bar>span{line-height:1.5}.save-bar :deep(.el-button){flex:none}}
.profile-avatar{overflow:hidden}.profile-avatar img{width:100%;height:100%;object-fit:cover;display:block}.avatar-button{margin-left:auto;height:30px;padding:0 11px;border-radius:8px;font-size:10px}.avatar-button .el-icon{margin-right:5px}.avatar-input{display:none}
.field-error{color:#d95d58;font-size:9px;font-style:normal;font-weight:500;line-height:1.4}
.form-field :deep(.el-input.is-disabled .el-input__wrapper){background:#f5f7fa;cursor:not-allowed}.form-field :deep(.el-input .el-input__count){font-size:9px}
.watch-field{margin-top:14px}.symbol-box{min-height:38px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:5px 8px;border-radius:8px;box-shadow:0 0 0 1px #e6edf5 inset;background:#fbfcfe;cursor:text}.symbol-box:focus-within{box-shadow:0 0 0 1px #8fb8e6 inset}.symbol-box.invalid{box-shadow:0 0 0 1px #efb2ae inset}.symbol-chip{display:inline-flex;align-items:center;gap:3px;height:24px;padding:0 4px 0 8px;border-radius:6px;background:#eef5ff;color:#3a6ea8;font-size:10px;font-weight:700;letter-spacing:.3px}.symbol-chip button{width:16px;height:16px;display:grid;place-items:center;padding:0;border:0;border-radius:4px;background:transparent;color:#7d9bbd;cursor:pointer}.symbol-chip button:hover{background:#dbe9fa;color:#2c5d95}.symbol-input{flex:1;min-width:140px;height:26px;border:0;outline:0;background:transparent;color:#3d5573;font-size:11px;text-transform:uppercase}.symbol-input::placeholder{text-transform:none;color:#a8b4c3}
.form-field+.form-field,.watch-field+.form-field{margin-top:14px}.strategy-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.strategy-option{display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid #e6edf5;border-radius:10px;background:#fbfcfe;color:#9aa8b8;text-align:left;cursor:pointer;transition:.15s}.strategy-option .el-icon{margin-top:1px;font-size:14px}.strategy-option span{display:flex;flex-direction:column;gap:3px}.strategy-option strong{color:#4b617d;font-size:10px}.strategy-option small{color:#9aa8b8;font-size:9px;font-weight:400}.strategy-option.on{border-color:#b9d5f3;background:#f1f7ff;color:#3f83cf}.strategy-option.on strong{color:#2d5f99}.strategy-option:disabled{cursor:not-allowed;opacity:.6}
.card-actions :deep(.el-button+.el-button){margin-left:0}
.load-error{display:flex;align-items:center;gap:9px;padding:11px 14px;border-color:#f6d9d6;background:#fff8f7;color:#c05a55;font-size:10px}.load-error span{flex:1}.load-error :deep(.el-button){height:28px;border-radius:7px;font-size:10px}
.password-form :deep(.el-form-item__label){font-size:11px;color:#5c718c}
@media(max-width:680px){.strategy-options{grid-template-columns:1fr}.avatar-button{padding:0 9px}.card-actions{flex-wrap:wrap;gap:8px}.save-hint{width:100%}}
.closed-status{display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:#f1f4f8;color:#8a97a8;font-size:9px;font-weight:700;white-space:nowrap}
</style>

<style>
html:has(.settings-page){overflow-x:clip}
</style>

<style scoped>
/* ================= 长桥风格覆盖层（docs/longbridge-ui.md） ================= */
.settings-page{
  --lb-text:#070a13;--lb-text-2:#4b5563;--lb-text-3:#6b7280;--lb-text-4:#a8aaad;
  --lb-accent:#00b8b8;--lb-accent-bright:#00f0c4;--lb-accent-soft:rgba(0,184,184,.1);
  --lb-bg:#f9fafb;--lb-bg-2:#f1f3f4;--lb-border:#e5e7eb;
  --lb-up:#e8467c;--lb-up-soft:rgba(232,70,124,.1);--lb-down:#00b8b8;--lb-warn:#f59e0b;--lb-warn-soft:rgba(245,158,11,.12);
  --pad-top:30px;--pad-bottom:42px;
  --ink:var(--lb-text);--muted:var(--lb-text-3);--line:var(--lb-border);
  margin:calc(var(--pad-top)*-1) calc(50% - 50vw) calc(var(--pad-bottom)*-1);
  padding-bottom:64px;background:var(--lb-bg-2);color:var(--lb-text);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue","Microsoft YaHei",sans-serif;
}
.lb-wrap{max-width:1248px;margin:0 auto;padding:0 24px}

/* ---------- Hero ---------- */
.lb-hero{position:relative;overflow:hidden;padding:56px 0 120px;color:#fff;
  background:radial-gradient(900px 420px at 85% -10%,rgba(0,240,196,.22),transparent 60%),radial-gradient(700px 380px at 0% 120%,rgba(0,184,184,.18),transparent 60%),linear-gradient(180deg,#05070d,#0b1220)}
.page-heading{align-items:flex-end;gap:24px;margin:0}
.eyebrow{display:inline-flex;gap:8px;padding:6px 14px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.78);font-size:12px;font-weight:600;letter-spacing:1.6px}
.eyebrow i{background:var(--lb-accent-bright);box-shadow:0 0 0 4px rgba(0,240,196,.18)}
.page-heading h1{margin:18px 0 10px;color:#fff;font-size:48px;font-weight:700;line-height:1.1;letter-spacing:-1px}
.page-heading p{color:rgba(255,255,255,.62);font-size:16px;line-height:1.6}
.demo-chip{height:36px;box-sizing:border-box;gap:8px;padding:0 16px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.08);backdrop-filter:blur(12px);color:rgba(255,255,255,.82);font-size:13px}
.demo-chip .el-icon{color:var(--lb-accent-bright)}

/* ---------- 正文 ---------- */
.lb-body{position:relative;margin-top:-84px}
.panel{border:0;border-radius:20px;background:#fff;box-shadow:0 1px 2px rgba(7,10,19,.04),0 12px 32px rgba(7,10,19,.06)}
.settings-layout{grid-template-columns:280px minmax(0,1fr);gap:24px}
.settings-content{gap:20px}
.section-kicker{color:var(--lb-text-4);font-size:12px;font-weight:600;letter-spacing:1.6px}

/* 侧栏 */
.settings-sidebar{top:96px;padding:20px 14px}
.sidebar-title{gap:12px;padding:4px 8px 18px;border-color:var(--lb-border)}
.sidebar-icon{width:44px;height:44px;border-radius:14px;background:var(--lb-text);color:var(--lb-accent-bright);font-size:20px}
.sidebar-title strong{color:var(--lb-text);font-size:17px}
.sidebar-title small{color:var(--lb-text-3);font-size:13px}
.settings-sidebar nav{gap:4px;padding-top:14px}
.section-link{height:46px;padding:0 14px;gap:12px;border-radius:999px;color:var(--lb-text-2);font-size:15px;font-weight:500}
.section-link .el-icon{font-size:17px}
.section-link:hover{background:var(--lb-bg-2);color:var(--lb-text)}
.section-link.active{background:var(--lb-text);color:#fff;font-weight:600}
.section-link.active .section-arrow{color:var(--lb-accent-bright);opacity:1}
.sidebar-hint{gap:8px;margin:18px 4px 0;padding:12px 14px;border-radius:14px;background:var(--lb-warn-soft);color:#92580a;font-size:12px}
.sidebar-hint .el-icon{color:var(--lb-warn)}

/* 卡片 */
.settings-card{padding:32px 36px;scroll-margin-top:96px}
.card-heading{gap:16px;padding-bottom:20px;border-color:var(--lb-border)}
.card-heading h2{margin:8px 0 6px;color:var(--lb-text);font-size:26px;font-weight:700;letter-spacing:-.4px}
.card-heading p{color:var(--lb-text-3);font-size:14px}
.heading-icon{width:48px;height:48px;border-radius:14px;font-size:20px}
.heading-icon.blue,.heading-icon.violet,.heading-icon.cyan,.heading-icon.orange{background:var(--lb-bg-2);color:var(--lb-text)}
.heading-icon.violet{background:var(--lb-accent-soft);color:#008a8a}
.heading-icon.orange{background:var(--lb-warn-soft);color:#b45309}

/* 资料 */
.profile-summary{gap:16px;margin:24px 0 20px;padding:20px;border-radius:16px;background:var(--lb-bg)}
.profile-avatar{width:60px;height:60px;border-radius:50%;background:linear-gradient(145deg,#0b1220,#1f2937);color:var(--lb-accent-bright);font-size:24px;box-shadow:0 0 0 3px #fff,0 0 0 4px rgba(0,184,184,.35)}
.profile-summary-copy strong{color:var(--lb-text);font-size:20px;font-weight:700}
.profile-summary-copy span{margin-top:4px;color:var(--lb-text-3);font-size:14px}
.avatar-button{height:40px;padding:0 18px;border:1px solid var(--lb-border);border-radius:999px;background:#fff;color:var(--lb-text);font-size:14px;font-weight:600}
.avatar-button:hover{border-color:var(--lb-text);color:var(--lb-text);background:#fff}
.form-grid,.display-grid{gap:20px}
.form-field{gap:10px;color:var(--lb-text);font-size:14px}
.form-field small{color:var(--lb-text-4);font-size:12px}
.form-field :deep(.el-input__wrapper),.form-field :deep(.el-select__wrapper){min-height:44px;border-radius:12px;box-shadow:0 0 0 1px var(--lb-border) inset;background:var(--lb-bg)}
.form-field :deep(.el-input__wrapper.is-focus),.form-field :deep(.el-select__wrapper.is-focused){box-shadow:0 0 0 1px var(--lb-accent) inset;background:#fff}
.form-field :deep(.el-input__inner),.form-field :deep(.el-select__placeholder){color:var(--lb-text);font-size:14px}
.form-field :deep(.el-input.is-disabled .el-input__wrapper){background:var(--lb-bg-2)}
.form-field :deep(.el-input .el-input__count){font-size:12px}
.watch-field{margin-top:20px}
.form-field+.form-field,.watch-field+.form-field{margin-top:20px}
.symbol-box{min-height:48px;gap:8px;padding:7px 12px;border-radius:12px;box-shadow:0 0 0 1px var(--lb-border) inset;background:var(--lb-bg)}
.symbol-box:focus-within{box-shadow:0 0 0 1px var(--lb-accent) inset;background:#fff}
.symbol-box.invalid{box-shadow:0 0 0 1px var(--lb-up) inset}
.symbol-chip{height:30px;gap:4px;padding:0 6px 0 12px;border-radius:999px;background:var(--lb-text);color:#fff;font-size:13px;letter-spacing:.4px}
.symbol-chip button{width:20px;height:20px;border-radius:50%;color:rgba(255,255,255,.6)}
.symbol-chip button:hover{background:rgba(255,255,255,.16);color:#fff}
.symbol-input{height:30px;color:var(--lb-text);font-size:14px}
.symbol-input::placeholder{color:var(--lb-text-4)}
.strategy-options{gap:12px}
.strategy-option{gap:12px;padding:16px;border:1px solid var(--lb-border);border-radius:16px;background:#fff;color:var(--lb-text-4)}
.strategy-option .el-icon{font-size:20px}
.strategy-option strong{color:var(--lb-text);font-size:15px}
.strategy-option small{color:var(--lb-text-3);font-size:12px;line-height:1.5}
.strategy-option:hover:not(:disabled){border-color:var(--lb-text-4)}
.strategy-option.on{border-color:var(--lb-text);background:var(--lb-text);color:var(--lb-accent-bright)}
.strategy-option.on strong{color:#fff}
.strategy-option.on small{color:rgba(255,255,255,.62)}
.field-error{color:var(--lb-up);font-size:12px}

/* 开关列表 */
.preference-list{padding-top:8px}
.preference-row{min-height:76px;gap:16px;border-color:var(--lb-border)}
.compact-row{margin-top:20px;border-color:var(--lb-border)}
.preference-symbol,.security-symbol{width:40px;height:40px;border-radius:12px;font-size:18px}
.preference-symbol,.preference-symbol.blue,.compact-row .preference-symbol,.security-symbol{background:var(--lb-bg-2);color:var(--lb-text)}
.preference-symbol.violet{background:var(--lb-accent-soft);color:#008a8a}
.preference-symbol.orange,.compact-row .preference-symbol.orange{background:var(--lb-warn-soft);color:#b45309}
.preference-copy strong,.security-copy strong{color:var(--lb-text);font-size:16px;font-weight:600}
.preference-copy small,.security-copy small{margin-top:4px;color:var(--lb-text-3);font-size:13px}
.preference-row :deep(.el-switch){--el-switch-on-color:var(--lb-accent);--el-switch-off-color:#d1d5db}
.display-grid{padding:24px 0 0}
.form-grid .form-field+.form-field,.display-grid .form-field+.form-field{margin-top:0}
.compact-row{border-bottom:0}
.display-grid .form-field small{color:var(--lb-text-3);font-weight:400}

/* 操作区 */
.card-actions{gap:12px;margin-top:24px;padding-top:20px;border-top:1px solid var(--lb-border)}
.save-hint{color:var(--lb-text-3);font-size:13px}
.card-actions :deep(.el-button){height:40px;padding:0 22px;border-radius:999px;font-size:14px;font-weight:600}
.card-actions :deep(.el-button--primary){border-color:var(--lb-text);background:var(--lb-text);color:#fff}
.card-actions :deep(.el-button--primary:hover){border-color:#1f2937;background:#1f2937}
.card-actions :deep(.el-button.is-plain:not(.el-button--primary)){border-color:var(--lb-border);background:#fff;color:var(--lb-text)}
.card-actions :deep(.el-button.is-plain:not(.el-button--primary):hover){border-color:var(--lb-text)}

/* 安全 / 服务 */
.security-row{min-height:76px;gap:16px;border-color:var(--lb-border)}
.security-status{height:30px;padding:0 12px;border-radius:999px;background:var(--lb-accent-soft);color:#008a8a;font-size:13px;font-weight:600}
.current-session{height:30px;padding:0 12px;border-radius:999px;background:var(--lb-bg-2);color:var(--lb-text-2);font-size:13px;font-weight:600}
.current-session i{background:var(--lb-accent);box-shadow:0 0 0 3px rgba(0,184,184,.18)}
.security-row :deep(.el-button){height:36px;padding:0 16px;border-color:var(--lb-text);border-radius:999px;background:var(--lb-text);color:#fff;font-size:13px;font-weight:600}
.security-row :deep(.el-button:hover){background:#1f2937;border-color:#1f2937;color:#fff}
.closed-status{height:30px;padding:0 12px;background:var(--lb-bg-2);color:var(--lb-text-3);font-size:13px;font-weight:600}
.load-error{gap:10px;padding:14px 20px;border:0;background:var(--lb-up-soft);color:var(--lb-up);font-size:14px}
.load-error :deep(.el-button){height:36px;border-radius:999px;font-size:13px}
.password-form :deep(.el-form-item__label){color:var(--lb-text);font-size:14px;font-weight:600}
.password-form :deep(.el-input__wrapper){min-height:44px;border-radius:12px}

/* ---------- 响应式 ---------- */
@media(max-width:1279px){.settings-layout{grid-template-columns:248px minmax(0,1fr);gap:20px}}
@media(max-width:1100px){.settings-page{--pad-top:24px;--pad-bottom:36px}.page-heading h1{font-size:40px}.settings-card{padding:28px}.strategy-options{grid-template-columns:1fr}}
@media(max-width:900px){.settings-layout{grid-template-columns:220px minmax(0,1fr);gap:16px}.settings-sidebar{padding:16px 10px}.section-link{font-size:14px}}
@media(max-width:760px){
  .settings-page{--pad-top:20px;--pad-bottom:30px;padding-bottom:40px}
  .lb-wrap{padding:0 16px}
  .lb-hero{padding:40px 0 100px}
  .page-heading{align-items:flex-start;flex-direction:column;gap:16px}
  .page-heading h1{font-size:34px}
  .page-heading p{max-width:none;font-size:14px}
  .demo-chip{height:32px;padding:0 14px;font-size:12px}
  .lb-body{margin-top:-72px}
  .settings-layout{display:flex;flex-direction:column;gap:16px}
  .settings-sidebar{position:static;width:100%;box-sizing:border-box;padding:14px}
  .sidebar-title{padding:2px 4px 12px}
  .sidebar-icon{width:38px;height:38px;font-size:17px}
  .settings-sidebar nav{display:flex;gap:6px;overflow:auto;padding-top:12px;scrollbar-width:none}
  .section-link{width:auto;min-width:max-content;height:38px;padding:0 14px;gap:6px;font-size:14px}
  .section-link .section-arrow,.sidebar-hint{display:none}
  .settings-content{gap:16px;min-width:0;max-width:100%}
  .settings-card{min-width:0;max-width:100%;box-sizing:border-box}
  .settings-card{padding:22px 18px;scroll-margin-top:16px}
  .card-heading h2{font-size:22px}
  .card-heading p{max-width:none;font-size:13px}
  .heading-icon{width:40px;height:40px;font-size:18px}
  .form-grid,.display-grid{grid-template-columns:1fr;gap:16px}
  .profile-summary{flex-wrap:wrap;padding:16px;gap:12px}
  .profile-avatar{width:52px;height:52px;font-size:20px}
  .profile-summary-copy{flex:1;min-width:0}
  .profile-summary-copy strong{font-size:18px}
  .avatar-button{width:100%;margin-left:0}
  .preference-row,.security-row{min-height:68px;gap:12px}
  .preference-copy strong,.security-copy strong{font-size:15px}
  .preference-copy small{max-width:none}
  .card-actions{flex-wrap:wrap;gap:10px}
  .save-hint{width:100%}
  .card-actions :deep(.el-button){flex:1}
  .security-row :deep(.el-button){padding:0 12px}
}
@media(max-width:390px){.page-heading h1{font-size:30px}.settings-card{padding:20px 16px}}
</style>
