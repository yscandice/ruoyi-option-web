<template>
  <div class="sgv3">
    <section class="hero st-hero"><div class="wrap">
      <div>
        <span class="eyebrow"><i />ACCOUNT · PREFERENCES</span>
        <h1>设置</h1>
        <p class="hero-sub">资料、关注与提醒偏好保存到账户；界面语言只影响当前浏览器。</p>
      </div>
      <div class="hero-ctl">
        <span class="glass-pill"><i :class="tier.dot" />{{ tier.label }}</span>
        <span class="glass-pill">{{ syncText }}</span>
      </div>
    </div></section>

    <div class="body"><div class="wrap"><main class="stp">
      <section v-if="!ready" class="st-state">
        <strong>{{ loading ? '正在读取账户设置…' : '设置读取失败' }}</strong>
        <p>{{ loading ? '正在从本地服务读取会员资料、通知偏好与身份信息。' : (error || '请检查登录状态后重试。') }}</p>
        <button v-if="!loading" type="button" @click="load">重新读取</button>
      </section>

      <template v-else>
        <!-- 会员状态 -->
        <section class="card">
          <div class="sh"><h2>会员状态</h2><span :class="['chip', tier.chip]"><i />{{ tier.label }}</span></div>
          <div class="kv">
            <div><small>登录邮箱</small><b class="num">{{ state.profile.email || '—' }}</b></div>
            <div><small>档位</small><b>{{ tierText }}</b></div>
            <div><small>到期时间</small><b class="num">{{ expireText }}</b></div>
            <div><small>数据视图</small><b>{{ viewText }}</b></div>
          </div>
          <p v-if="memberNote" :class="memberNoteTone === 'ok' ? 'note-ok' : 'note-w'">{{ memberNote }}</p>
          <div class="btns">
            <button class="pbtn acc" type="button" @click="notify('续期与升级暂未开放：后端尚未提供订阅与支付接口')">续期与升级</button>
            <button class="pbtn" type="button" @click="notify('自动续费管理暂未开放：后端尚未提供订阅接口')">管理自动续费</button>
            <button class="pbtn" type="button" @click="openPwd">修改密码</button>
            <button class="pbtn ghost-d" type="button" @click="doLogout">退出登录</button>
          </div>
        </section>

        <!-- 推荐拉新 -->
        <section class="card span2">
          <div class="sh"><h2>推荐拉新</h2><span :class="['chip', referralEnabled ? 'ok' : 'mute']"><i />{{ referralEnabled ? '已开放' : '暂未开放' }}</span></div>
          <p class="desc">邀请码与推荐奖励仍在准备中。开放后这里会显示你的专属邀请码、已注册与已付费人数，并支持设置一个好记的码。</p>
          <div class="inv">
            <div><small>我的邀请码</small><b class="num">—</b></div>
            <div><small>已注册 / 已付费</small><b class="num">— / —</b></div>
          </div>
          <label class="lbl" for="stCode">设置一个好记的码</label>
          <div class="irow"><input id="stCode" class="inp" disabled placeholder="开放后可自定义" /><button class="pbtn" type="button" disabled>保存</button></div>
          <p class="hint">4–20 个字符，字母数字和下划线；<b>旧码不会失效</b>，已经发出去的分享卡还能继续用。</p>
        </section>

        <!-- 个人资料与关注设置 -->
        <section class="card span3">
          <div class="sh">
            <div><small>PROFILE &amp; ALERT PREFERENCES</small><h2>个人资料与关注设置</h2><p>这些设置只决定你看到什么、何时被提醒，不改变系统发布的唯一正式价差。</p></div>
            <span class="chip ok">会员私有设置</span>
          </div>
          <div class="pf-grid">
            <div>
              <div class="av"><img v-if="avatarUrl" :src="avatarUrl" alt="头像" /><template v-else>{{ avatarInitial }}</template></div>
              <span class="ey">账户资料</span>
              <label class="lbl" for="stName">用户名</label>
              <input id="stName" v-model="form.displayName" class="inp" style="width:100%" type="text" maxlength="30" placeholder="1–30 个字" @input="fieldError = ''" />
              <p class="pf-mail num">{{ state.profile.email || '—' }}</p>
              <button class="lnk" type="button" :disabled="avatarUploading" @click="avatarInput?.click()">{{ avatarUploading ? '上传中…' : '更换头像' }}</button>
              <input ref="avatarInput" class="st-file" type="file" accept="image/png,image/jpeg,image/gif,image/bmp" @change="onAvatarChange" />
              <p v-if="fieldError" class="hint" style="color:#c2383d">{{ fieldError }}</p>
            </div>
            <div>
              <span class="ey">WATCH PREFERENCES</span>
              <h3>我关注的机会</h3>
              <div class="tk">
                <span v-for="(symbol, index) in form.watchSymbols" :key="symbol" class="tkc">{{ symbol }}<button type="button" :aria-label="`移除 ${symbol}`" @click="removeSymbol(index)">×</button></span>
                <input v-model="symbolDraft" class="inp" type="text" maxlength="10" placeholder="添加标的" aria-label="添加关注标的" @input="onSymbolInput" @keydown.enter.prevent="addSymbol" />
                <button class="add" type="button" aria-label="添加" @click="addSymbol">+</button>
              </div>
              <div class="strat">
                <button v-for="item in strategies" :key="item.key" type="button" :class="['so', { on: form.strategyPreferences[item.key] }]" :aria-pressed="form.strategyPreferences[item.key]" @click="toggleStrategy(item.key)">
                  <i /><span><b>{{ item.label }}</b><small>{{ item.en }}</small></span>
                </button>
              </div>
              <p class="hint">已选 {{ form.watchSymbols.length }} / {{ WATCH_MAX }} 个标的；大写字母、数字、点，1–10 位。</p>
            </div>
            <div>
              <span class="ey">PRIORITY ALERT</span>
              <h3>偏好机会强提醒</h3>
              <div class="pa">
                <button :class="['sw', { on: form.strongAlerts }]" type="button" role="switch" :aria-checked="form.strongAlerts" aria-label="强提醒" @click="form.strongAlerts = !form.strongAlerts" />
                <div><b>{{ form.strongAlerts ? '强提醒已开启' : '强提醒已关闭' }}</b><small>网页内弹窗 + 桌面提醒</small></div>
              </div>
              <p class="hint">当正式发布信号命中你的关注标的或策略偏好时提高提醒优先级；观察信号、未过最终仲裁或无会员权限的内容不会触发。</p>
              <div class="rule"><small>当前规则</small><b>{{ currentRule }}</b></div>
            </div>
          </div>
          <div class="pf-ft"><span>{{ savedText }}，修改后点击保存会同步到当前会员账户。</span><button class="pbtn pri" type="button" :disabled="savingProfile" @click="saveProfile">{{ savingProfile ? '保存中…' : '保存账户设置' }}</button></div>
        </section>

        <!-- 界面语言 -->
        <section class="card lang-c">
          <div class="sh"><h2>界面语言 · Language</h2><span class="chip mute"><i />仅本机</span></div>
          <div class="lang">
            <div class="seg"><button v-for="item in languages" :key="item.value" type="button" :class="{ on: lang === item.value }" @click="setLang(item)">{{ item.label }}</button></div>
            <div><h4>{{ langLabel }}</h4><p class="hint">目前登录、注册与邮件有英文版，工作台仍为中文；选择结果只保存在当前浏览器，不影响账户数据。</p></div>
          </div>
        </section>

        <!-- 通知 -->
        <section class="card span2">
          <div class="sh"><h2>通知</h2><button class="lnk" type="button" :disabled="resetting" @click="resetNotify">{{ resetting ? '恢复中…' : '恢复默认' }}</button></div>
          <div class="nl">
            <div v-for="channel in channels" :key="channel.key" class="ni">
              <div><b>{{ channel.title }}</b><p>{{ channel.desc }}（暂未开放）</p></div>
              <button class="sw" type="button" role="switch" aria-checked="false" :aria-label="channel.title" disabled />
            </div>
          </div>
          <div class="ngrp"><span>按事件订阅</span><em>{{ onCount }} / {{ events.length }} 已开启</em></div>
          <div class="ngrid">
            <div v-for="event in events" :key="event.key" class="ni">
              <div><b>{{ event.title }}</b><p>{{ event.desc }}</p></div>
              <button :class="['sw', { on: prefs[event.key] }]" type="button" role="switch" :aria-checked="prefs[event.key]" :aria-label="event.title" :disabled="prefSaving" @click="togglePref(event)" />
            </div>
          </div>
          <p class="nfoot">偏好即时保存；各渠道（站内 · 手机推送 · 邮件周报）按此发送。</p>
        </section>
      </template>
    </main></div></div>

    <transition name="st-toast"><div v-if="toast" class="st-toast" role="status">{{ toast }}</div></transition>

    <div v-if="pwdOpen" class="st-mask" @click.self="pwdOpen = false">
      <div class="st-modal" role="dialog" aria-modal="true" aria-label="修改密码">
        <div class="st-modal-h"><b>修改密码</b><button type="button" aria-label="关闭" @click="pwdOpen = false">×</button></div>
        <label class="lbl" for="stOld">当前密码</label>
        <input id="stOld" v-model="pwd.old" class="inp" type="password" autocomplete="current-password" placeholder="请输入当前密码" @input="pwdError = ''" />
        <label class="lbl" for="stNew">新密码</label>
        <input id="stNew" v-model="pwd.next" class="inp" type="password" autocomplete="new-password" placeholder="8–20 位，含字母和数字" />
        <label class="lbl" for="stConfirm">确认新密码</label>
        <input id="stConfirm" v-model="pwd.confirm" class="inp" type="password" autocomplete="new-password" placeholder="再次输入新密码" @keyup.enter="submitPassword" />
        <p v-if="pwdError" class="st-err">{{ pwdError }}</p>
        <p class="hint">密码需为 8–20 位，同时包含字母和数字，不能有空格；修改成功后需要重新登录。</p>
        <div class="st-modal-f"><button class="pbtn" type="button" @click="pwdOpen = false">取消</button><button class="pbtn pri" type="button" :disabled="pwdSaving" @click="submitPassword">{{ pwdSaving ? '提交中…' : '确认修改' }}</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMemberSettings, resetMemberNotifications, updateMemberNotifications, updateMemberPassword, updateMemberProfile, uploadMemberAvatar } from '@/api/member'
import { logout } from '@/api/auth'
import { isHandledError } from '@/services/http'
import { clearSession, getUser, setUser } from '@/utils/auth'
import { resetAccess } from '@/utils/accessStore'

// 设置页（W5）：会员状态与关注/提醒偏好全部来自 /api/member/settings（资料、通知、身份、功能开关一次返回）；
// 资料走乐观锁（updatedAt 不一致 409），通知开关即时保存，推荐/推送等未实现功能只展示「暂未开放」。界面语言仅存本机。
const WATCH_MAX = 50
const WATCH_PATTERN = /^[A-Z0-9.]{1,10}$/
const NAME_MAX = 30
const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)\S{8,20}$/
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const LANG_KEY = 'option-web-language'
const NOTIFY_KEYS = ['new_signal', 'protection_window', 'take_profit_window', 'settlement', 'weekly_scorecard', 'product_update', 'silent_reminder', 'management_stop', 'manage_adopted_only']

const router = useRouter()
const strategies = [
  { key: 'seller', label: '卖方策略', en: 'SELL PREMIUM' },
  { key: 'midterm', label: '中期策略', en: 'MID-TERM' },
  { key: 'buyer', label: '买方策略', en: 'BUY PREMIUM' }
]
// 事件订阅：key 与后端 notifications.prefs 一一对应（顺序即展示顺序）
const events = [
  { key: 'new_signal', title: '新信号发布', desc: '通过全部门槛并正式发报时一条。' },
  { key: 'protection_window', title: '保护卡', desc: '保护窗口出现、或条件比上一次更好时。' },
  { key: 'take_profit_window', title: '止盈窗口', desc: '卖方达到止盈参考区间、买方价差吃到最大值九成时。' },
  { key: 'settlement', title: '结算完成', desc: '到期结算或提前止盈归档时。' },
  { key: 'weekly_scorecard', title: '每周战绩摘要', desc: '周一发送上周记分卡（邮件）。' },
  { key: 'product_update', title: '功能更新', desc: '上线新功能时一条，说清是什么、怎么用。' },
  { key: 'silent_reminder', title: '静默提醒', desc: '提醒以静默方式送达，不打断当前操作。' },
  { key: 'management_stop', title: '动态管理 · 止损裁决', desc: '买方价差跌到买腿之下时，按该标的修复能力给回血 / 止损裁决。' },
  { key: 'manage_adopted_only', title: '只推我采用过的信号', desc: '新卖方信号照推；保护 / 止盈 / 结算只推你跟了的那几笔。' }
]
// 渠道：语音播报与手机推送后端都没有实现（features.push 恒为 false）
const channels = [
  { key: 'voice', title: '语音播报', desc: '与终端同款中文播报 · 保护窗口优先' },
  { key: 'push', title: '手机推送', desc: '需要自建推送密钥与订阅表' }
]
const languages = [{ value: 'zh', label: '中文' }, { value: 'en', label: 'English' }]
const TIERS = {
  STAFF: { label: '内部人员', chip: 'ok', dot: '' },
  PAID: { label: '会员', chip: 'ok', dot: '' },
  TRIAL: { label: '体验期', chip: 'warn', dot: 'warn' },
  DELAYED: { label: '盘后版', chip: 'mute', dot: 'mute' },
  DISABLED: { label: '已停用', chip: 'warn', dot: 'warn' }
}
const VIEWS = { REALTIME: '实时', DELAYED: '盘后', DENY: '无权限' }

const loading = ref(true)
const ready = ref(false)
const error = ref('')
const savingProfile = ref(false)
const prefSaving = ref(false)
const resetting = ref(false)
const avatarUploading = ref(false)
const avatarInput = ref(null)
const symbolDraft = ref('')
const fieldError = ref('')
const profileUpdatedAt = ref(null)
const notifUpdatedAt = ref(null)
const lang = ref('zh')
const toast = ref('')
const state = reactive({ profile: {}, access: {}, features: {} })
const form = reactive({ displayName: '', watchSymbols: [], strategyPreferences: { seller: false, midterm: false, buyer: false }, strongAlerts: false })
const prefs = reactive(Object.fromEntries(NOTIFY_KEYS.map(key => [key, false])))

/* ---------- 会员身份 ---------- */
const level = computed(() => String(state.access?.level || '').toUpperCase())
const tier = computed(() => TIERS[level.value] || { label: '读取中', chip: 'mute', dot: 'mute' })
const viewText = computed(() => VIEWS[String(state.access?.view || '').toUpperCase()] || '—')
const trialDays = computed(() => Math.max(0, Math.ceil((Number(state.access?.trialRemainingSeconds) || 0) / 86400)))
const expireText = computed(() => formatDate(state.access?.paidUntil || state.access?.trialEndsAt))
const tierText = computed(() => {
  const code = level.value
  if (code === 'PAID') return state.access?.paidUntil ? `会员 · 有效至 ${formatDate(state.access.paidUntil)}` : '会员'
  if (code === 'TRIAL') return `体验期 · 剩 ${trialDays.value} 天`
  if (code === 'DELAYED') return `盘后版 · 延后 ${Number(state.access?.lagSessions) || 0} 个交易日`
  if (code === 'STAFF') return '内部人员 · 不受体验期限制'
  if (code === 'DISABLED') return '已停用'
  return '—'
})
const memberNote = computed(() => {
  const code = level.value
  if (code === 'TRIAL') return `体验期还有 ${trialDays.value} 天到期；续期从原到期日顺延，提前续不吃亏。`
  if (code === 'DELAYED') return '当前为盘后数据版，数据按交易日延后发布；升级后可查看实时数据。'
  if (code === 'PAID') return '会员有效期内可查看实时数据与全部菜单，到期前会提醒续费。'
  if (code === 'STAFF') return '内部人员账号不受体验期限制，直接查看实时数据。'
  if (code === 'DISABLED') return '账号已停用，请联系管理员处理。'
  return ''
})
const memberNoteTone = computed(() => (level.value === 'TRIAL' || level.value === 'DELAYED' || level.value === 'DISABLED' ? 'warn' : 'ok'))

/* ---------- 资料 / 通知展示 ---------- */
const avatarUrl = computed(() => {
  const value = state.profile?.avatar
  if (!value) return ''
  return /^(https?:)?\/\//.test(value) || value.startsWith('data:') ? value : `${API_BASE}${value}`
})
const avatarInitial = computed(() => (form.displayName || '交').trim().slice(0, 1).toUpperCase())
const syncText = computed(() => {
  const stamp = [profileUpdatedAt.value, notifUpdatedAt.value].filter(Boolean).sort().pop()
  return stamp ? `上次保存 ${formatStamp(stamp)}` : '尚未保存过设置'
})
const savedText = computed(() => (profileUpdatedAt.value ? `上次保存 ${formatStamp(profileUpdatedAt.value)}` : '尚未保存过设置'))
const currentRule = computed(() => {
  const symbols = form.watchSymbols.length ? form.watchSymbols.join(' / ') : '未设置标的'
  const picked = strategies.filter(item => form.strategyPreferences[item.key]).map(item => item.label)
  return `${symbols} · ${picked.length ? picked.join(' / ') : '未设置策略'}`
})
const onCount = computed(() => events.filter(event => prefs[event.key]).length)
const langLabel = computed(() => (lang.value === 'en' ? 'English' : '中文'))
// 推荐拉新：/api/member/settings 的 features.referrals 固定为 false（后端已改为不返回同步账号的推荐码）
const referralEnabled = computed(() => state.features?.referrals === true)

function formatDate(value) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''))
  return matched ? `${matched[1]}/${matched[2]}/${matched[3]}` : '—'
}
function formatStamp(value) {
  const text = String(value || '')
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text) ? `${text.slice(5, 7)}/${text.slice(8, 10)} ${text.slice(11, 16)}` : text
}

let toastTimer = null
function notify(text) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2200)
}

/* ---------- 读取 ---------- */
function applyProfile(payload) {
  if (!payload) return
  state.profile = payload
  form.displayName = payload.displayName || ''
  form.watchSymbols = Array.isArray(payload.watchSymbols) ? [...payload.watchSymbols] : []
  Object.assign(form.strategyPreferences, { seller: false, midterm: false, buyer: false }, payload.strategyPreferences || {})
  form.strongAlerts = payload.strongAlerts === true
  profileUpdatedAt.value = payload.updatedAt || null
  // 昵称 / 头像改动后同步页头
  const user = getUser()
  if (payload.displayName && user.nickName !== payload.displayName) {
    setUser({ ...user, nickName: payload.displayName })
    window.dispatchEvent(new Event('option-user-updated'))
  }
}
function applyNotifications(payload) {
  if (!payload) return
  Object.assign(prefs, Object.fromEntries(NOTIFY_KEYS.map(key => [key, false])), payload.prefs || {})
  notifUpdatedAt.value = payload.updatedAt || null
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await getMemberSettings()
    const data = res?.data || {}
    applyProfile(data.profile)
    applyNotifications(data.notifications)
    state.access = data.access || {}
    state.features = data.features || {}
    ready.value = true
  } catch (err) {
    if (!isHandledError(err)) error.value = err?.message || '设置读取失败，请稍后重试'
    ready.value = false
  } finally {
    loading.value = false
  }
}

/* ---------- 资料保存 ---------- */
function onSymbolInput() {
  symbolDraft.value = symbolDraft.value.toUpperCase()
  fieldError.value = ''
}
function addSymbol() {
  const value = symbolDraft.value.trim().toUpperCase()
  symbolDraft.value = ''
  if (!value) return
  if (!WATCH_PATTERN.test(value)) { fieldError.value = `代码格式不正确：${value}（大写字母、数字、点，1–10 位）`; return }
  if (form.watchSymbols.includes(value)) return
  if (form.watchSymbols.length >= WATCH_MAX) { fieldError.value = `关注标的最多 ${WATCH_MAX} 个`; return }
  form.watchSymbols.push(value)
  fieldError.value = ''
}
function removeSymbol(index) {
  form.watchSymbols.splice(index, 1)
  fieldError.value = ''
}
function toggleStrategy(key) {
  form.strategyPreferences[key] = !form.strategyPreferences[key]
}
async function saveProfile() {
  const name = form.displayName.trim()
  if (!name || name.length > NAME_MAX) { fieldError.value = `用户名需为 1–${NAME_MAX} 个字`; return }
  savingProfile.value = true
  try {
    const res = await updateMemberProfile({
      displayName: name,
      watchSymbols: [...form.watchSymbols],
      strategyPreferences: { ...form.strategyPreferences },
      strongAlerts: form.strongAlerts,
      updatedAt: profileUpdatedAt.value
    })
    applyProfile(res?.data?.profile || res?.data)
    fieldError.value = ''
    notify('账户设置已保存')
  } catch (err) {
    // 400 的字段错误放到输入框下，409 说明其他设备改过
    const message = err?.message || ''
    if (err?.code === 409) { await load(); notify('设置已在其他设备修改，已刷新为最新') }
    else if (err?.code === 400) fieldError.value = message.replace(/^(displayName|watchSymbols|strategyPreferences)\s*/, match => ({ displayName: '用户名', watchSymbols: '关注标的', strategyPreferences: '策略偏好' }[match] || match))
    else if (!isHandledError(err)) notify(message || '保存失败，请稍后再试')
  } finally {
    savingProfile.value = false
  }
}

/* ---------- 通知即时保存 ---------- */
async function togglePref(event) {
  if (prefSaving.value) return
  const next = !prefs[event.key]
  prefs[event.key] = next
  prefSaving.value = true
  try {
    const res = await updateMemberNotifications({ prefs: { [event.key]: next }, updatedAt: notifUpdatedAt.value })
    applyNotifications(res?.data)
    notify(`「${event.title}」已${next ? '开启' : '关闭'} · 已保存`)
  } catch (err) {
    prefs[event.key] = !next
    if (err?.code === 409) { await load(); notify('设置已在其他设备修改，已刷新为最新') }
    else if (!isHandledError(err)) notify(err?.message || '保存失败，请稍后再试')
  } finally {
    prefSaving.value = false
  }
}
async function resetNotify() {
  resetting.value = true
  try {
    const res = await resetMemberNotifications()
    applyNotifications(res?.data)
    notify('已恢复默认通知设置')
  } catch (err) {
    if (!isHandledError(err)) notify(err?.message || '恢复失败，请稍后再试')
  } finally {
    resetting.value = false
  }
}

/* ---------- 头像 ---------- */
async function onAvatarChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!/^image\/(png|jpe?g|gif|bmp)$/.test(file.type)) { notify('请选择 JPG、PNG、GIF 或 BMP 图片'); return }
  if (file.size > 2 * 1024 * 1024) { notify('图片不能超过 2MB'); return }
  avatarUploading.value = true
  try {
    const res = await uploadMemberAvatar(file)
    state.profile.avatar = res.imgUrl || res.data?.imgUrl || state.profile.avatar
    setUser({ ...getUser(), avatar: state.profile.avatar })
    window.dispatchEvent(new Event('option-user-updated'))
    notify('头像已更新')
  } catch (err) {
    if (!isHandledError(err)) notify(err?.message || '上传失败，请稍后再试')
  } finally {
    avatarUploading.value = false
  }
}

/* ---------- 界面语言 ---------- */
function setLang(item) {
  lang.value = item.value
  try { localStorage.setItem(LANG_KEY, item.value) } catch {}
  notify(`界面语言：${item.label}（仅本机）`)
}

/* ---------- 修改密码 ---------- */
const pwdOpen = ref(false)
const pwdSaving = ref(false)
const pwdError = ref('')
const pwd = reactive({ old: '', next: '', confirm: '' })
function openPwd() {
  Object.assign(pwd, { old: '', next: '', confirm: '' })
  pwdError.value = ''
  pwdOpen.value = true
}
async function submitPassword() {
  if (!pwd.old) { pwdError.value = '请输入当前密码'; return }
  if (!PASSWORD.test(pwd.next)) { pwdError.value = '新密码需为 8–20 位，同时包含字母和数字，不能有空格'; return }
  if (pwd.next === pwd.old) { pwdError.value = '新密码不能与当前密码相同'; return }
  if (pwd.next !== pwd.confirm) { pwdError.value = '两次输入的密码不一致'; return }
  pwdSaving.value = true
  try {
    await updateMemberPassword({ oldPassword: pwd.old, newPassword: pwd.next })
    pwdOpen.value = false
    const email = state.profile.email
    try { await logout() } catch {}
    clearSession()
    resetAccess()
    router.replace({ path: '/login', query: email ? { email } : {} })
  } catch (err) {
    if (/旧密码/.test(err?.message || '')) pwdError.value = '当前密码不正确'
    else if (!isHandledError(err)) pwdError.value = err?.message || '修改失败，请稍后再试'
  } finally {
    pwdSaving.value = false
  }
}

/* ---------- 退出 ---------- */
async function doLogout() {
  try { await logout() } catch {} finally {
    clearSession()
    resetAccess()
    router.replace('/login')
  }
}

onMounted(() => {
  try { const saved = localStorage.getItem(LANG_KEY); if (saved === 'en' || saved === 'zh') lang.value = saved } catch {}
  load()
})
</script>

<style src="./settings-v3.css"></style>
<style>
html:has(.sgv3){overflow-x:clip}
body:has(.sgv3) .option-main{overflow:visible}
</style>
