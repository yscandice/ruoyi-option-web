<template>
  <div v-if="banner" :class="['access-banner', banner.tone]" role="status">
    <div class="banner-inner">
      <span class="banner-icon"><el-icon><component :is="banner.icon" /></el-icon></span>
      <span class="banner-label">{{ banner.label }}</span>
      <span class="banner-text">
        <template v-for="(part, index) in banner.parts" :key="index"><strong v-if="part.strong">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template>
        <em v-if="banner.stale" class="banner-stale">（数据同步延迟，可能不是最新）</em>
      </span>
    </div>
  </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Clock, Timer } from '@element-plus/icons-vue'
import { accessState, refreshAccess } from '@/utils/accessStore'
import { bjMonthDayTime, tradeMonthDay, tradeWeekLabel } from '@/utils/beijing'

// 全站数据状态提示条（W3）：体验期剩余时间 / 盘后数据日期与下次更新时间
// 刷新时机：挂载（登录 / 注册后进入）、路由切换（节流 60 秒）、页面重新可见、到达 trialEndsAt / nextReleaseAt
const RESOURCE_BY_PATH = { '/today': 'today', '/info': 'info', '/active': 'conduct', '/tracks': 'follow', '/settlement': 'settlement', '/scorecard': 'record' }

const route = useRoute()
const now = ref(Date.now())
let tickTimer = null
let boundaryTimer = null

const access = computed(() => accessState.access)
const routeView = computed(() => accessState.views[RESOURCE_BY_PATH[route.path]] || null)

// 体验期剩余秒数：基于 trialRemainingSeconds 本地计时
const trialRemaining = computed(() => {
  const a = access.value
  if (!a || a.level !== 'TRIAL') return 0
  const base = Number(a.trialRemainingSeconds)
  if (Number.isFinite(base)) return Math.max(0, base - Math.floor((now.value - accessState.loadedAt) / 1000))
  const end = Date.parse(a.trialEndsAt)
  return Number.isFinite(end) ? Math.max(0, Math.floor((end - now.value) / 1000)) : 0
})

function remainingText(seconds) {
  if (seconds < 3600) return `${Math.max(1, Math.ceil(seconds / 60))} 分钟`
  return `${Math.ceil(seconds / 3600)} 小时`
}

const banner = computed(() => {
  const a = access.value
  if (!a) return null
  if (a.level === 'TRIAL') {
    return { tone: 'info', icon: Timer, label: '完整体验', parts: [{ text: '完整体验剩余 ' }, { text: `约 ${remainingText(trialRemaining.value)}`, strong: true }, { text: '，到期后自动切换为盘后数据版' }], stale: false }
  }
  if (a.level !== 'DELAYED') return null
  const stale = a.stale === true || routeView.value?.stale === true
  const next = bjMonthDayTime(a.nextReleaseAt)
  const empty = routeView.value ? routeView.value.empty === true : (a.empty === true || !a.dataTradeDate)
  if (empty) {
    return { tone: 'warning', icon: Clock, label: '盘后数据', parts: [{ text: '盘后数据尚未放出' }, ...(next ? [{ text: '，预计 ' }, { text: next, strong: true }, { text: '（北京时间）更新' }] : [])], stale }
  }
  // 当前菜单接口返回的交易日优先（与菜单标签一致），其余页面用 access 的 dataTradeDate
  const tradeDate = routeView.value?.view === 'DELAYED' && routeView.value.tradeDate ? routeView.value.tradeDate : a.dataTradeDate
  const day = tradeMonthDay(tradeDate)
  const week = tradeWeekLabel(tradeDate, new Date(now.value))
  return {
    tone: 'warning', icon: Clock, label: '盘后数据',
    parts: [{ text: '当前为 ' }, { text: `${week}（${day}）`, strong: true }, { text: ' 收盘数据' }, ...(next ? [{ text: '，下次更新 ' }, { text: next, strong: true }, { text: '（北京时间）' }] : [])],
    stale
  }
})

// 到达体验期结束 / 下次放出时间时重新拉取
function scheduleBoundary() {
  window.clearTimeout(boundaryTimer)
  const a = access.value
  if (!a) return
  let at = NaN
  if (a.level === 'TRIAL') at = accessState.loadedAt + (Number(a.trialRemainingSeconds) || 0) * 1000
  else if (a.level === 'DELAYED') at = Date.parse(a.nextReleaseAt)
  if (!Number.isFinite(at)) return
  const delay = Math.min(Math.max(at - Date.now() + 2000, 1000), 2147483000)
  boundaryTimer = window.setTimeout(() => refreshAccess({ force: true }), delay)
}

function onVisible() {
  if (document.visibilityState === 'visible') {
    now.value = Date.now()
    refreshAccess({ force: Date.now() - accessState.loadedAt > 10000 })
  }
}

watch(() => [accessState.loadedAt, access.value?.level], scheduleBoundary)
watch(() => route.fullPath, () => refreshAccess())
watch(trialRemaining, (value, old) => { if (old > 0 && value === 0) refreshAccess({ force: true }) })

onMounted(() => {
  // 每个菜单路由各自挂载布局，这里只在尚未加载时强制拉取，其余按 60 秒节流
  refreshAccess({ force: !accessState.access })
  scheduleBoundary()
  tickTimer = window.setInterval(() => { now.value = Date.now() }, 30000)
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => {
  window.clearInterval(tickTimer)
  window.clearTimeout(boundaryTimer)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>
<style scoped>
/* 顶部提示条 · 长桥风格（docs/longbridge-ui.md §4.1）：青绿底、近黑文字、居中；显示逻辑不变 */
.access-banner{position:relative;z-index:31;background:#00b8b8;color:#070a13}
.access-banner.warning{background:#f59e0b}
.banner-inner{max-width:1440px;min-height:38px;margin:0 auto;padding:7px 32px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:10px;font-size:14px;line-height:1.5;text-align:center}
.banner-icon{width:22px;height:22px;flex:none;display:grid;place-items:center;border-radius:50%;background:rgba(7,10,19,.12);color:#070a13;font-size:13px}
.banner-label{flex:none;height:22px;padding:0 10px;display:inline-flex;align-items:center;border-radius:999px;background:#070a13;color:#fff;font-size:12px;font-weight:600;letter-spacing:.3px}
.banner-text strong{font-weight:700;color:#070a13}
.banner-stale{margin-left:2px;font-style:normal;font-weight:600;color:#7a1d3c}
@media(max-width:1100px){.banner-inner{padding:7px 20px}}
@media(max-width:760px){.banner-inner{min-height:36px;padding:7px 16px;justify-content:flex-start;text-align:left;font-size:13px}.banner-label{display:none}}
</style>
