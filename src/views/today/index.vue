<template>
  <div class="today-page">
    <section class="welcome-row">
      <div>
        <div class="eyebrow"><span class="live-dot" />OSM.AI SIGNAL DESK</div>
        <h1>欢迎回到期权交易工作台</h1>
        <p class="date-line">{{ todayLabel }} <span>·</span> 今日概览与交易动态</p>
      </div>
      <div class="welcome-actions"><span :class="['preview-status', { connected: feed }]" :title="loadError || ''"><i/>{{ connectionLabel }}</span><el-button plain class="connect-button" @click="connectDialogVisible = true"><el-icon><Connection /></el-icon>{{ feed ? '重新连接' : '连接数据' }}</el-button><el-button :loading="loading" plain class="cat-button" @click="refreshTodayData"><el-icon><Refresh /></el-icon>刷新</el-button><el-button :class="['cat-button', { enabled: catEnabled }]" plain @click="catEnabled = !catEnabled"><el-icon><Sunny /></el-icon>招财猫 {{ catEnabled ? '开' : '关' }}</el-button></div>
    </section>

    <section class="news-panel">
      <div class="news-heading">
        <div class="news-title"><div><h2>今日要闻 <span>· {{ feed?.etDay || monthDay }}</span></h2><p>市场环境、重要事件与当日观察</p></div><span class="data-origin"><i/>{{ feed ? '上游数据已同步' : loading ? '正在加载市场数据' : '等待市场数据' }}</span></div>
        <div class="news-actions"><button class="collapse-button" type="button" @click="newsOpen = !newsOpen">{{ newsOpen ? '收起今日要闻' : '展开今日要闻' }}<el-icon><ArrowDown :class="{ flipped: newsOpen }" /></el-icon></button><el-button plain class="share-button" @click="copyPageLink"><el-icon><Share /></el-icon>分享</el-button><div class="timezone-toggle"><button :class="{ selected: timezone === 'ET' }" @click="timezone = 'ET'">美东</button><button :class="{ selected: timezone === 'BJ' }" @click="timezone = 'BJ'">北京</button></div></div>
      </div>

      <div v-if="newsOpen" class="news-content">
        <div class="brief-callout"><div><strong>盘前简报</strong><span>{{ premarketSummary || objectSummary(feed?.brain) || '盘前行情、个股观察与当天要闻' }}</span></div><el-tag effect="plain" :type="premarket ? 'success' : 'info'" round>{{ premarket ? '已加载' : '等待接口数据' }}</el-tag></div>

        <div class="volatility-card">
          <div class="vol-main"><div class="vol-title">波动率状态 <span>·</span> VIX 现货</div><div class="vol-value">{{ marketValue(['vix', 'VIX', 'vixSpot']) || '—' }}<small>{{ feed ? '上游数据' : '待连接' }}</small></div><span class="vol-status"><i/>{{ marketText(['volatilityStatus', 'vixStatus', 'volatility']) || (feed ? '市场摘要已加载' : '等待波动率数据') }}</span><p>{{ marketText(['marketSummary', 'volatilitySummary', 'commentary']) || 'VIX 环境描述与策略观察将在数据接入后显示。' }}</p></div>
          <div class="term-structure"><div class="term-title"><span>期限结构</span><el-icon><InfoFilled /></el-icon></div><div class="term-placeholder"><span class="term-axis">远月</span><div class="term-chart"><i/><i/><i/><i/><i/><i/></div><span class="term-axis">近月</span></div><small>期限结构数据待更新</small></div>
          <div class="vol-side"><div><span>VIX 的波动（VVIX）</span><strong>{{ marketValue(['vvix', 'VVIX']) || '—' }}</strong></div><div><span>尾部风险定价（SKEW）</span><strong>{{ marketValue(['skew', 'SKEW']) || '—' }}</strong></div><div class="side-hint">波动率指标仅供观察</div></div>
        </div>

        <div class="market-facts">
          <div class="fact-pill"><i class="fact-green"/><span>QQQ 大盘</span><strong>{{ marketValue(['qqq', 'QQQ', 'nasdaq']) || '—' }}</strong></div>
          <div class="fact-pill"><i class="fact-green"/><span>美债收益率</span><strong>{{ marketValue(['treasuryYield', 'treasury', 'yield10y']) || '—' }}</strong></div>
          <div class="fact-pill"><i class="fact-orange"/><span>行业共振</span><strong>{{ marketText(['sectorResonance', 'industry', 'sector']) || '等待更新' }}</strong></div>
          <div class="fact-pill expiration-pill"><el-icon><Calendar /></el-icon><span>月度期权到期</span><strong>{{ marketText(['monthlyExpiry', 'expiration', 'expiry']) || '—' }}</strong></div>
        </div>

        <div class="rhythm-bar"><div class="rhythm-label"><el-icon><Clock /></el-icon><strong>节奏</strong></div><div class="rhythm-days"><button :class="{ selected: selectedDay === 'today' }" @click="selectedDay = 'today'">今日</button><button :class="{ selected: selectedDay === 'next' }" @click="selectedDay = 'next'">后续</button><span class="rhythm-legend"><i class="dot-red"/>高影响数据 <i class="dot-gray"/>其他数据 <i class="dot-blue"/>财报</span></div></div>

        <div class="calendar-grid">
          <section class="calendar-column">
            <div class="calendar-column-heading"><span class="timeline-dot gray"/><strong>{{ selectedDay === 'today' ? '今日' : '近期' }}</strong><span class="day-badge">{{ selectedDay === 'today' ? '当前交易日' : '即将到来' }}</span><span class="event-total">事件日历</span></div>
            <div class="calendar-empty"><el-icon><Calendar /></el-icon><span>暂无日历事件</span><small>经济数据与财报安排将在这里显示</small></div>
          </section>
          <section class="calendar-column">
            <div class="calendar-column-heading"><span class="timeline-dot blue"/><strong>财报与经济数据</strong><span class="day-badge muted-badge">事件追踪</span></div>
            <div class="calendar-empty"><el-icon><DataAnalysis /></el-icon><span>等待事件数据</span><small>按时间整理的重要数据与公司财报</small></div>
          </section>
        </div>
        <p class="facts-footnote">此处用于呈现市场事实与日历安排；相关数据尚未连接。</p>
      </div>
    </section>

    <section class="summary-row">
      <article class="summary-card"><div class="summary-card-head"><span class="summary-icon blue"><el-icon><TrendCharts /></el-icon></span><span>今日信号</span><el-icon class="hint"><InfoFilled /></el-icon></div><strong>{{ signalCards.length }}</strong><small>{{ feed ? '来自会员 Feed' : '等待接口数据' }}</small></article>
      <article class="summary-card"><div class="summary-card-head"><span class="summary-icon orange"><el-icon><Lock /></el-icon></span><span>保护窗口</span><el-icon class="hint"><InfoFilled /></el-icon></div><strong>{{ protectionCards.length }}</strong><small>{{ feed ? '保护与风险提醒' : '等待接口数据' }}</small></article>
      <article class="summary-card"><div class="summary-card-head"><span class="summary-icon green"><el-icon><Operation /></el-icon></span><span>动态管理</span><el-icon class="hint"><InfoFilled /></el-icon></div><strong>{{ managementCards.length }}</strong><small>{{ feed ? '管理动态' : '等待接口数据' }}</small></article>
    </section>

    <section v-if="feed" class="live-data-panel content-panel">
      <div class="panel-heading"><div><h2>今日市场数据</h2><p>来自 OSM 会员 Feed · {{ feed.etDay || feed.marketEtDay || '交易日未标注' }}</p></div><span class="live-feed-badge"><i/>{{ loadedEndpointCount }}/8 个接口已响应</span></div>
      <div v-if="marketEntries.length" class="market-data-grid"><article v-for="entry in marketEntries" :key="entry.key" class="market-data-item"><span>{{ entry.label }}</span><strong>{{ entry.value }}</strong></article></div>
      <div v-else class="live-data-empty">Feed 已返回数据，市场摘要字段暂未提供。</div>
      <div class="endpoint-status-list"><span v-for="endpoint in endpointStatuses" :key="endpoint.key" :class="{ loaded: endpoint.loaded }"><i/>{{ endpoint.label }}</span></div>
    </section>

    <section class="dashboard-grid">
      <div class="main-column">
        <section class="content-panel signals-panel">
          <div class="panel-heading"><div><h2>新信号</h2><p>今日策略信号与交易计划</p></div><div class="panel-actions"><el-button class="guide-button" plain><el-icon><QuestionFilled /></el-icon>第一次做卖方？</el-button><span class="count-badge">—</span></div></div>
          <div class="signal-tabs"><button :class="{ active: signalTab === 'new' }" @click="signalTab = 'new'">新信号 <span>{{ signalCards.length }}</span></button><button :class="{ active: signalTab === 'all' }" @click="signalTab = 'all'">全部信号 <span>{{ signalCards.length }}</span></button></div>
          <div v-if="visibleSignalCards.length" class="api-card-list"><article v-for="(item, index) in visibleSignalCards" :key="recordKey(item, index)" class="api-record-card"><div class="record-title-row"><strong>{{ recordTitle(item, '期权信号') }}</strong><span class="record-state">{{ recordStatus(item) }}</span></div><p>{{ recordSummary(item) }}</p><div class="record-fields"><span v-for="field in recordFields(item)" :key="field.key"><small>{{ field.label }}</small><b>{{ field.value }}</b></span></div></article></div>
          <div v-else class="signal-empty"><span class="signal-empty-icon"><el-icon><TrendCharts /></el-icon></span><strong>{{ feed ? '当前没有新信号' : '等待今日 Feed 数据' }}</strong><p>{{ feed ? '上游 Feed 已返回，但当前没有可展示的信号记录。' : '登录 OSM 账号并连接数据后，信号将显示在这里。' }}</p></div>
        </section>

        <section class="content-panel reminders-panel">
          <div class="panel-heading"><div><h2>管理提醒</h2><p>保护窗口、仓位调整与到期管理</p></div><div class="panel-actions"><span class="reminder-subtitle">管理与保护动态</span><span class="count-badge orange-count">—</span></div></div>
          <div class="reminder-types"><span><i class="type-orange"/>到期提醒</span><span><i class="type-red"/>保护提醒</span><span><i class="type-blue"/>动态管理</span></div>
          <div v-if="visibleManagementCards.length" class="api-card-list"><article v-for="(item, index) in visibleManagementCards" :key="recordKey(item, index)" class="api-record-card reminder-record"><div class="record-title-row"><strong>{{ recordTitle(item, '管理提醒') }}</strong><span class="record-state orange-state">{{ recordStatus(item) }}</span></div><p>{{ recordSummary(item) }}</p><div class="record-fields"><span v-for="field in recordFields(item)" :key="field.key"><small>{{ field.label }}</small><b>{{ field.value }}</b></span></div></article></div>
          <div v-else class="reminder-empty"><el-icon><Bell /></el-icon><span>{{ feed ? '当前没有可展示的管理提醒' : '登录后加载管理与保护动态' }}</span></div>
        </section>
      </div>

      <aside class="side-column">
        <section class="content-panel margin-panel">
          <div class="panel-heading"><div><h2>保证金占用</h2><p>全站信号的风险资金参考</p></div><el-icon class="panel-head-icon"><Coin /></el-icon></div>
          <div class="margin-summary"><div><span>在途组数</span><strong>{{ openGroupCount }} <small>组</small></strong></div><div><span>预估占用</span><strong>{{ firstScalar(feed?.performance, ['marginUsed', 'margin', 'estimatedMargin']) || '—' }}</strong></div></div>
          <div class="margin-chart"><div class="chart-label">最近 10 个交易日</div><div class="chart-grid"><span/><span/><span/><span/><div class="chart-empty-label">等待保证金数据</div><div class="chart-bars"><i v-for="bar in 10" :key="bar"/></div></div><div class="chart-dates"><span>较早</span><span>近期</span></div></div>
          <div class="margin-comparison"><div><span>昨日收盘</span><strong>—</strong></div><div><span>本周日均</span><strong>—</strong></div><div><span>上周日均</span><strong>—</strong></div></div>
          <p class="margin-note"><el-icon><InfoFilled /></el-icon>{{ feed ? '占用指标按上游 Feed 可见字段展示。' : '保证金占用将在交易数据接入后展示。' }}</p>
        </section>
        <section class="education-card"><span class="education-icon"><el-icon><Warning /></el-icon></span><div><strong>风险提示</strong><p>研究与教育用途，不构成个性化投资建议。期权交易存在重大亏损风险。</p></div></section>
      </aside>
    </section>

    <el-dialog v-model="connectDialogVisible" title="连接 OSM 今日数据" width="min(440px, calc(100vw - 32px))" :close-on-click-modal="false">
      <p class="connect-description">登录信息仅用于本次连接请求。后端会将 OSM 会话 Cookie 保存在 Redis；本页面不会保存密码。</p>
      <el-form label-position="top" @submit.prevent="submitOsmLogin">
        <el-form-item label="OSM 登录邮箱"><el-input v-model="loginForm.email" type="email" autocomplete="username" placeholder="输入 OSM 账号邮箱" /></el-form-item>
        <el-form-item label="OSM 登录密码"><el-input v-model="loginForm.password" type="password" autocomplete="current-password" show-password placeholder="输入 OSM 登录密码" @keyup.enter="submitOsmLogin" /></el-form-item>
      </el-form>
      <p v-if="loadError" class="connection-error">{{ loadError }}</p>
      <template #footer><el-button @click="connectDialogVisible = false">稍后</el-button><el-button type="primary" :loading="loginLoading" :disabled="!loginForm.email || !loginForm.password" @click="submitOsmLogin">登录并加载今日数据</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Calendar, Clock, Coin, Connection, DataAnalysis, InfoFilled, Lock, Operation, QuestionFilled, Refresh, Share, Sunny, TrendCharts, Warning, ArrowDown } from '@element-plus/icons-vue'
import { getTodayFeed, getSellerGuide, getEntitlement, getTodayDecisions, getManagementChoices, getPremarketBrief, getOptionUpdates, getOptionSupport, loginOsmAccount } from '@/api/option/today'

const newsOpen = ref(true)
const catEnabled = ref(true)
const timezone = ref('ET')
const selectedDay = ref('today')
const signalTab = ref('new')
const feed = ref(null)
const sessionConnected = ref(false)
const premarket = ref(null)
const ancillary = reactive({ sellerGuide: null, entitlement: null, decisions: null, managementChoices: null, updates: null, support: null })
const endpointLoaded = reactive({ feed: false, sellerGuide: false, entitlement: false, decisions: false, managementChoices: false, premarket: false, updates: false, support: false })
const loading = ref(false)
const loginLoading = ref(false)
const loadError = ref('')
const connectDialogVisible = ref(false)
const loginForm = reactive({ email: '', password: '' })
const now = new Date()
const todayLabel = computed(() => now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }))
const monthDay = computed(() => `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`)
const connectionLabel = computed(() => loading.value ? '正在加载' : feed.value ? `已连接 · ${lastUpdated.value || '数据就绪'}` : sessionConnected.value ? '已连接 OSM' : '尚未连接 OSM')
const lastUpdated = ref('')
const signalCards = computed(() => normalizeRecords(feed.value?.signals, feed.value?.buyerSignals, feed.value?.signalGroups))
const protectionCards = computed(() => normalizeRecords(feed.value?.protections, feed.value?.sentProtections, feed.value?.buyerAlerts, feed.value?.buyerExpiryCloses))
const managementCards = computed(() => normalizeRecords(feed.value?.managementCards, feed.value?.buyerLifecycle, feed.value?.midtermShadowCards))
const visibleSignalCards = computed(() => signalTab.value === 'new' ? signalCards.value : signalCards.value)
const visibleManagementCards = computed(() => [...protectionCards.value, ...managementCards.value])
const openGroupCount = computed(() => firstScalar(feed.value?.performance, ['openGroups', 'open_groups', 'inFlightGroups']) || signalCards.value.length || 0)
const loadedEndpointCount = computed(() => Object.values(endpointLoaded).filter(Boolean).length)
const endpointStatuses = computed(() => [
  { key: 'feed', label: '会员 Feed', loaded: endpointLoaded.feed },
  { key: 'sellerGuide', label: '卖方指引', loaded: endpointLoaded.sellerGuide },
  { key: 'entitlement', label: '会员权益', loaded: endpointLoaded.entitlement },
  { key: 'decisions', label: '信号判断', loaded: endpointLoaded.decisions },
  { key: 'managementChoices', label: '管理选择', loaded: endpointLoaded.managementChoices },
  { key: 'premarket', label: '盘前简报', loaded: endpointLoaded.premarket },
  { key: 'updates', label: '更新状态', loaded: endpointLoaded.updates },
  { key: 'support', label: '客服状态', loaded: endpointLoaded.support }
])
const marketEntries = computed(() => {
  const entries = []
  for (const [section, value] of [['今日摘要', feed.value?.todayDesk], ['市场简报', feed.value?.brain], ['市场背景', feed.value?.publicIntel]]) {
    flattenEntries(value, section, entries, 0)
    if (entries.length >= 12) break
  }
  return entries.slice(0, 12)
})
const premarketSummary = computed(() => firstScalar(premarket.value, ['brief', 'summary', 'headline', 'text', 'title', 'description']) || objectSummary(premarket.value))

onMounted(refreshTodayData)

async function refreshTodayData() {
  loading.value = true
  loadError.value = ''
  try {
    feed.value = await getTodayFeed()
    endpointLoaded.feed = true
    lastUpdated.value = formatUpdatedAt(feed.value?.generated_at || feed.value?.serverReceivedAt || feed.value?.polledAt)
    const date = normalizeDate(feed.value?.etDay || feed.value?.marketEtDay) || new Date().toISOString().slice(0, 10)
    const tasks = [
      ['sellerGuide', getSellerGuide],
      ['entitlement', getEntitlement],
      ['decisions', getTodayDecisions],
      ['managementChoices', getManagementChoices],
      ['premarket', () => getPremarketBrief(date)],
      ['updates', getOptionUpdates],
      ['support', getOptionSupport]
    ]
    const results = await Promise.allSettled(tasks.map(([, request]) => request()))
    results.forEach((result, index) => {
      const [key] = tasks[index]
      endpointLoaded[key] = result.status === 'fulfilled'
      if (result.status === 'fulfilled') {
        if (key === 'premarket') premarket.value = result.value
        else ancillary[key] = result.value
      }
    })
  } catch (error) {
    feed.value = null
    endpointLoaded.feed = false
    loadError.value = friendlyError(error, '今日数据加载失败')
    if (isMissingUpstreamSession(loadError.value)) {
      sessionConnected.value = false
      connectDialogVisible.value = true
    }
  } finally {
    loading.value = false
  }
}

async function submitOsmLogin() {
  if (!loginForm.email.trim() || !loginForm.password) return
  loginLoading.value = true
  loadError.value = ''
  try {
    await loginOsmAccount({ email: loginForm.email.trim(), password: loginForm.password })
    sessionConnected.value = true
    loginForm.email = ''
    loginForm.password = ''
    connectDialogVisible.value = false
    ElMessage.success('OSM 已连接，正在加载今日数据')
    await refreshTodayData()
  } catch (error) {
    loadError.value = friendlyError(error, 'OSM 登录失败，请检查账号或密码')
    loginForm.email = ''
    loginForm.password = ''
  } finally {
    loginLoading.value = false
  }
}

function isMissingUpstreamSession(message) {
  return /请先通过 OSM 登录|会话 Cookie|上游登录|OSM 今日接口请求失败/i.test(message || '')
}

function friendlyError(error, fallback) {
  const message = error?.message || ''
  if (/handshake|SSL|TLS|I\/O error|ECONN|timed? out|connection reset/i.test(message)) {
    return '无法连接 OSM 上游服务（网络或 TLS 握手失败）。请检查后端运行环境能否访问 osmtrade.com，再重试。'
  }
  return message || fallback
}

function normalizeRecords(...sources) {
  const records = []
  for (const source of sources) {
    if (Array.isArray(source)) records.push(...source)
    else if (source && typeof source === 'object') {
      const nested = source.items || source.cards || source.signals || source.data
      if (Array.isArray(nested)) records.push(...nested)
      else if (Object.keys(source).length) records.push(source)
    }
  }
  return records.filter(item => item && typeof item === 'object').slice(0, 12)
}

function safeEntries(value) {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).filter(([key]) => !/cookie|token|password|email|account|member.?no/i.test(key))
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (Array.isArray(value)) return `${value.length} 条`
  if (typeof value === 'object') {
    for (const key of ['value', 'price', 'last', 'current', 'text', 'label', 'name']) {
      if (value[key] !== undefined && typeof value[key] !== 'object') return String(value[key])
    }
    return `${Object.keys(value).length} 项`
  }
  return String(value)
}

function flattenEntries(value, section, result, depth) {
  if (!value || result.length >= 12 || depth > 2) return
  for (const [key, item] of safeEntries(value)) {
    if (result.length >= 12) break
    if (item && typeof item === 'object' && !Array.isArray(item) && depth < 2) flattenEntries(item, keyLabel(key), result, depth + 1)
    else result.push({ key: `${section}-${key}`, label: `${section} · ${keyLabel(key)}`, value: formatValue(item) })
  }
}

function keyLabel(key) {
  const known = { etDay: '交易日', marketEtDay: '市场交易日', marketPhase: '市场阶段', vix: 'VIX', vvix: 'VVIX', skew: 'SKEW', qqq: 'QQQ', spy: 'SPY', summary: '摘要', headline: '要闻', status: '状态', value: '数值', price: '价格', change: '涨跌', yield10y: '10年期收益率', event: '事件', title: '标题', description: '说明' }
  return known[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ')
}

function findNestedValue(source, wantedKeys, depth = 0) {
  if (!source || typeof source !== 'object' || depth > 4) return ''
  const wanted = wantedKeys.map(key => key.toLowerCase())
  for (const [key, value] of safeEntries(source)) {
    if (wanted.includes(key.toLowerCase())) return formatValue(value)
  }
  for (const [, value] of safeEntries(source)) {
    const found = findNestedValue(value, wantedKeys, depth + 1)
    if (found) return found
  }
  return ''
}

function marketValue(keys) {
  return findNestedValue(feed.value, keys)
}
function marketText(keys) {
  return findNestedValue(feed.value, keys)
}
function firstScalar(source, keys) {
  return findNestedValue(source, keys)
}
function objectSummary(value) {
  if (!value) return ''
  if (typeof value !== 'object') return formatValue(value)
  return safeEntries(value).slice(0, 3).map(([key, item]) => `${keyLabel(key)}：${formatValue(item)}`).join(' · ')
}
function recordKey(item, index) {
  return item.signal_id || item.signalId || item.id || item.event_id || item.group_no || `${recordTitle(item, 'record')}-${index}`
}
function recordTitle(item, fallback) {
  return firstScalar(item, ['underlying', 'symbol', 'ticker', 'title', 'name', 'strategy', 'structure']) || fallback
}
function recordStatus(item) {
  return firstScalar(item, ['status', 'state', 'phase', 'event', 'action', 'type']) || '上游记录'
}
function recordSummary(item) {
  const direct = firstScalar(item, ['summary', 'description', 'reason', 'note', 'advisory', 'message'])
  if (direct) return direct
  return safeEntries(item).slice(0, 4).map(([key, value]) => `${keyLabel(key)}：${formatValue(value)}`).join(' · ') || '接口已返回记录'
}
function recordFields(item) {
  return safeEntries(item).filter(([, value]) => value === null || typeof value !== 'object').slice(0, 4).map(([key, value]) => ({ key, label: keyLabel(key), value: formatValue(value) }))
}
function normalizeDate(value) {
  if (!value) return ''
  const match = String(value).match(/\d{4}-\d{2}-\d{2}/)
  return match?.[0] || ''
}
function formatUpdatedAt(value) {
  if (!value) return '已同步'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '已同步' : date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function copyPageLink() {
  try { await navigator.clipboard.writeText(window.location.href); ElMessage.success('页面地址已复制') }
  catch { ElMessage.info('可从浏览器地址栏复制页面地址') }
}
</script>

<style scoped>
.today-page{--navy:#183454;--muted:#8996a5;--line:#e7e4dd;color:#1e2f43}.welcome-row{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:0 0 20px;padding:0 1px}.eyebrow{display:flex;align-items:center;gap:7px;color:#4d8c78;font-size:9px;letter-spacing:1.6px;font-weight:750}.live-dot{width:6px;height:6px;border-radius:50%;background:#53a684;box-shadow:0 0 0 4px #53a68420}.welcome-row h1{margin:8px 0 5px;color:#17365a;font-size:26px;line-height:1.2;letter-spacing:-.45px}.date-line{margin:0;color:#8997a6;font-size:11px}.date-line span{padding:0 5px;color:#b5bec7}.welcome-actions{display:flex;align-items:center;gap:10px}.preview-status{display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid #e1e9e5;border-radius:999px;background:#f7fbf8;color:#638472;font-size:9px}.preview-status i{width:5px;height:5px;border-radius:50%;background:#64aa83}.cat-button{height:31px;border-radius:999px;color:#6f8295;font-size:10px}.cat-button.enabled{color:#3f8064;background:#f0f7f2;border-color:#dcebe0}.news-panel{overflow:hidden;padding:17px 19px 16px;border:1px solid #e6e3dc;border-radius:17px;background:#fffefa;box-shadow:0 2px 8px #24384a08}.news-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:13px}.news-title{display:flex;align-items:center;gap:13px;min-width:0}.news-title h2{margin:0;color:#1c2e45;font-size:17px;letter-spacing:-.2px}.news-title h2 span{color:#718095;font-size:14px;font-weight:550}.news-title p{margin:4px 0 0;color:#929daa;font-size:10px}.data-origin{display:flex;align-items:center;gap:5px;white-space:nowrap;color:#98a4af;font-size:9px}.data-origin i{width:5px;height:5px;border-radius:50%;background:#b9c4ce}.news-actions{display:flex;align-items:center;gap:8px}.collapse-button{display:flex;align-items:center;gap:4px;border:0;background:transparent;color:#7f8c9b;font-size:9px;cursor:pointer}.collapse-button .el-icon{transition:transform .2s}.collapse-button .flipped{transform:rotate(180deg)}.share-button{height:29px;border-radius:999px;padding:0 10px;font-size:9px}.timezone-toggle{display:flex;overflow:hidden;border:1px solid #e6e2db;border-radius:8px}.timezone-toggle button{height:28px;padding:0 10px;border:0;background:#fffefa;color:#7e8996;font-size:9px;cursor:pointer}.timezone-toggle button.selected{background:#1f2935;color:#fff}.news-content{animation:fade-in .18s ease}.brief-callout{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;margin-bottom:11px;border:1px dashed #d8d5cc;border-radius:10px;background:#fffefa}.brief-callout>div{display:flex;align-items:center;gap:11px;min-width:0}.brief-callout strong{color:#4369c7;font-size:11px;white-space:nowrap}.brief-callout span{color:#717c89;font-size:10px}.brief-callout .el-tag{font-size:9px}.volatility-card{display:grid;grid-template-columns:minmax(260px,1.1fr) minmax(210px,.9fr) minmax(210px,.9fr);gap:22px;min-height:190px;padding:18px 18px 16px;border:1px solid #e4e1da;border-radius:14px;background:#faf9f6}.vol-main{display:flex;flex-direction:column;align-items:flex-start}.vol-title{color:#778391;font-size:10px;font-weight:650;letter-spacing:.2px}.vol-title span{padding:0 3px;color:#bac1c8}.vol-value{margin:9px 0 5px;color:#1f2833;font-size:45px;line-height:1;font-weight:750;letter-spacing:-2px}.vol-value small{margin-left:9px;color:#acb4bb;font-size:9px;letter-spacing:0;font-weight:500}.vol-status{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:#edf3f0;color:#658274;font-size:9px;font-weight:650}.vol-status i{width:6px;height:6px;border-radius:50%;background:#79a98d}.vol-main p{max-width:420px;margin:10px 0 0;color:#88929c;font-size:10px;line-height:1.6}.term-structure{display:flex;flex-direction:column;padding:1px 9px}.term-title{display:flex;align-items:center;justify-content:space-between;color:#758292;font-size:10px;font-weight:650}.term-title .el-icon{color:#aeb8c2}.term-placeholder{height:112px;display:flex;align-items:flex-end;gap:9px;margin-top:7px;padding-bottom:4px;border-bottom:1px solid #e8e5df}.term-axis{padding-bottom:2px;color:#afb8c0;font-size:8px}.term-chart{height:100%;flex:1;display:flex;align-items:flex-end;justify-content:center;gap:12px;position:relative;padding:0 8px}.term-chart:before,.term-chart:after{content:'';position:absolute;left:0;right:0;border-top:1px dashed #e7e4de}.term-chart:before{top:30%}.term-chart:after{top:65%}.term-chart i{display:none}.term-structure>small{margin-top:6px;color:#a6afb8;font-size:8px;text-align:center}.vol-side{display:flex;flex-direction:column;justify-content:center;gap:0}.vol-side>div:not(.side-hint){display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 0;border-bottom:1px solid #e9e6e0;color:#727f8e;font-size:10px}.vol-side strong{color:#37495c;font-size:13px}.side-hint{padding-top:10px;color:#a3adb7;font-size:8px;text-align:right}.market-facts{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin:11px 0 12px}.fact-pill{display:flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #e9e6df;border-radius:999px;background:#fffefa;color:#788593;font-size:9px;white-space:nowrap}.fact-pill strong{color:#58697a;font-size:9px;font-weight:650}.fact-pill>i{width:6px;height:6px;border-radius:50%}.fact-green{background:#5eaa86}.fact-orange{background:#d5a552}.expiration-pill{border-style:dashed}.expiration-pill .el-icon{color:#8a9cac}.rhythm-bar{display:flex;align-items:center;gap:20px;min-height:38px;padding:0 12px;border:1px solid #e6e3dc;border-radius:9px;background:#f9f8f5}.rhythm-label{display:flex;align-items:center;gap:7px;color:#748191;font-size:9px}.rhythm-label .el-icon{font-size:12px}.rhythm-label strong{color:#687687}.rhythm-days{display:flex;align-items:center;gap:16px;flex:1}.rhythm-days>button{display:flex;align-items:center;gap:5px;border:0;background:transparent;color:#8b96a2;font-size:9px;cursor:pointer}.rhythm-days>button.selected{color:#2e3d50;font-weight:700}.rhythm-legend{display:flex;align-items:center;gap:5px;margin-left:auto;color:#9aa4ad;font-size:8px}.rhythm-legend i,.rhythm-days i{width:6px;height:6px;border-radius:50%;display:inline-block}.dot-blue{background:#536bc1}.dot-gray{background:#c9c9c4}.dot-red{background:#ba614c}.calendar-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding-top:14px}.calendar-column{min-width:0}.calendar-column-heading{display:flex;align-items:center;gap:7px;min-height:29px;color:#69788a}.calendar-column-heading strong{color:#46586c;font-size:10px}.timeline-dot{width:7px;height:7px;border-radius:50%}.timeline-dot.gray{background:#b8c0c8}.timeline-dot.blue{background:#536bc1}.day-badge{padding:4px 7px;border-radius:999px;background:#f0efea;color:#929a9e;font-size:8px}.muted-badge{background:#f4f5f7;color:#9aa4ae}.event-total{margin-left:auto;color:#a5afb8;font-size:8px}.calendar-empty{min-height:86px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;border-bottom:1px solid #f0eee9;color:#a3adb6}.calendar-empty .el-icon{font-size:15px;color:#b4c4d0}.calendar-empty span{font-size:9px;color:#8795a2}.calendar-empty small{font-size:8px;color:#adb6bf}.facts-footnote{margin:12px 0 0;color:#9ca6af;font-size:8px}.summary-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:13px 0}.summary-card{padding:13px 15px;border:1px solid #e7eaf0;border-radius:12px;background:#fff}.summary-card-head{display:flex;align-items:center;gap:8px;color:#778595;font-size:10px}.summary-icon{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;font-size:13px}.summary-icon.blue{background:#edf4fb;color:#4b7db9}.summary-icon.orange{background:#fbf2e6;color:#bf8b45}.summary-icon.green{background:#edf5f0;color:#4f9674}.summary-card-head .hint{margin-left:auto;color:#bdc5cc;font-size:11px}.summary-card>strong{display:block;margin:9px 0 3px;color:#26384d;font-size:22px;line-height:1}.summary-card>small{color:#a1aab4;font-size:8px}.dashboard-grid{display:grid;grid-template-columns:minmax(0,1.62fr) minmax(280px,.92fr);gap:12px}.main-column,.side-column{display:flex;flex-direction:column;gap:12px;min-width:0}.content-panel{padding:15px 16px;border:1px solid #e7eaf0;border-radius:13px;background:#fff}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.panel-heading h2{margin:0;color:#263b53;font-size:13px}.panel-heading p{margin:4px 0 0;color:#9aa6b1;font-size:9px}.panel-actions{display:flex;align-items:center;gap:8px}.guide-button{height:28px;border-radius:999px;padding:0 9px;font-size:8px;color:#7e8da0}.count-badge{min-width:23px;padding:5px 7px;border-radius:999px;background:#edf3fb;color:#5978b4;text-align:center;font-size:8px}.orange-count{background:#fbf1e5;color:#bd8a4c}.signal-tabs{display:flex;align-items:center;gap:13px;margin-top:13px;border-bottom:1px solid #eef1f4}.signal-tabs button{position:relative;padding:0 2px 9px;border:0;background:transparent;color:#919da9;font-size:9px;cursor:pointer}.signal-tabs button.active{color:#315a9e;font-weight:700}.signal-tabs button.active:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:2px;background:#4b70bd}.signal-tabs button span{margin-left:4px;color:#9daabb}.signal-empty{min-height:155px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;text-align:center;color:#a0aab5}.signal-empty-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:#f1f5fa;color:#7c9abe;font-size:17px}.signal-empty strong{margin-top:2px;color:#63778e;font-size:10px}.signal-empty p{max-width:360px;margin:0;color:#a1acb6;font-size:8px;line-height:1.55}.reminder-subtitle{color:#a1abb5;font-size:8px}.reminder-types{display:flex;gap:12px;margin-top:12px;padding:9px 10px;border-radius:8px;background:#fafbfd}.reminder-types span{display:flex;align-items:center;gap:5px;color:#8794a2;font-size:8px}.reminder-types i{width:6px;height:6px;border-radius:50%}.type-orange{background:#d6a14f}.type-red{background:#ce7167}.type-blue{background:#6282c0}.reminder-empty{min-height:76px;display:flex;align-items:center;justify-content:center;gap:7px;color:#a0abb6;font-size:9px}.reminder-empty .el-icon{color:#b6c2ce}.panel-head-icon{width:27px;height:27px;display:grid;place-items:center;border-radius:8px;background:#eef4fa;color:#6082aa}.margin-summary{display:flex;gap:28px;padding:14px 2px 10px}.margin-summary>div{display:flex;flex-direction:column;gap:6px}.margin-summary span{color:#929eaa;font-size:8px}.margin-summary strong{color:#344a62;font-size:19px}.margin-summary strong small{font-size:9px;font-weight:500}.margin-chart{padding-top:8px}.chart-label{margin-bottom:8px;color:#9aa6b1;font-size:8px}.chart-grid{height:112px;position:relative;display:flex;flex-direction:column;justify-content:space-between;border-bottom:1px solid #e9edf1}.chart-grid>span{border-top:1px dashed #edf0f3}.chart-empty-label{position:absolute;inset:0;display:grid;place-items:center;color:#aeb8c1;font-size:8px}.chart-bars{display:none}.chart-dates{display:flex;justify-content:space-between;margin-top:5px;color:#a7b1bb;font-size:7px}.margin-comparison{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px;padding-top:11px;border-top:1px solid #eef1f4}.margin-comparison>div{display:flex;flex-direction:column;gap:5px}.margin-comparison span{color:#9ca7b1;font-size:7px}.margin-comparison strong{color:#697d92;font-size:9px}.margin-note{display:flex;align-items:flex-start;gap:5px;margin:10px 0 0;color:#a0aab4;font-size:8px;line-height:1.45}.margin-note .el-icon{color:#93a8bc;flex:none}.education-card{display:flex;gap:9px;padding:12px;border:1px solid #efe6d5;border-radius:10px;background:#fffaf1}.education-icon{color:#cf9b4f;font-size:13px}.education-card strong{color:#94713d;font-size:9px}.education-card p{margin:4px 0 0;color:#a08a68;font-size:8px;line-height:1.5}@keyframes fade-in{from{opacity:.45;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}@media(max-width:1050px){.volatility-card{grid-template-columns:1fr 1fr;gap:15px}.vol-main{grid-row:span 2}.vol-side{align-self:center}.dashboard-grid{grid-template-columns:minmax(0,1.35fr) minmax(250px,.9fr)}}@media(max-width:760px){.welcome-row{align-items:flex-start;flex-direction:column;margin-bottom:15px}.welcome-row h1{font-size:23px}.welcome-actions{width:100%;justify-content:space-between}.news-panel{padding:14px 13px;border-radius:13px}.news-heading{align-items:flex-start;flex-direction:column}.news-title{width:100%;justify-content:space-between}.news-title h2{font-size:15px}.news-actions{width:100%;justify-content:flex-end}.data-origin{font-size:8px}.brief-callout{align-items:flex-start;padding:10px}.brief-callout>div{align-items:flex-start;flex-direction:column;gap:4px}.brief-callout span{font-size:9px}.volatility-card{grid-template-columns:1fr;gap:13px;padding:14px}.vol-main{grid-row:auto}.vol-value{font-size:37px}.term-structure{padding:0}.term-placeholder{height:84px}.vol-side>div:not(.side-hint){padding:8px 0}.market-facts{gap:6px}.fact-pill{padding:6px 8px;font-size:8px}.rhythm-bar{align-items:flex-start;flex-direction:column;gap:7px;padding:9px}.rhythm-days{width:100%;gap:10px;flex-wrap:wrap}.rhythm-legend{font-size:7px}.calendar-grid{grid-template-columns:1fr;gap:6px}.calendar-empty{min-height:63px}.summary-row{gap:7px}.summary-card{padding:10px}.summary-card-head{gap:5px;font-size:8px}.summary-icon{width:23px;height:23px}.summary-card>strong{font-size:19px}.summary-card>small{font-size:7px}.dashboard-grid{grid-template-columns:1fr}.content-panel{padding:13px}.education-card p{font-size:8px}}@media(max-width:390px){.welcome-row h1{font-size:21px}.news-actions{gap:5px}.collapse-button{font-size:8px}.share-button{padding:0 8px}.timezone-toggle button{padding:0 8px}.fact-pill{gap:5px;padding:6px}.summary-card>small{font-size:6px}.guide-button{padding:0 7px}.panel-heading h2{font-size:12px}}
.connect-button{height:31px;border-radius:999px;color:#3379c4;font-size:10px}.preview-status.connected{border-color:#d6eadf;background:#f0f8f3;color:#4c8a69}.preview-status:not(.connected){border-color:#f0e4d2;background:#fffaf2;color:#ae8751}.live-data-panel{margin:0 0 13px}.live-feed-badge{display:flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:#eff7f2;color:#5e9275;font-size:9px;white-space:nowrap}.live-feed-badge i{width:6px;height:6px;border-radius:50%;background:#5eb185}.market-data-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:13px}.market-data-item{min-width:0;padding:10px;border:1px solid #edf0f4;border-radius:9px;background:#fbfcfe}.market-data-item span{display:block;overflow:hidden;color:#8997a6;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.market-data-item strong{display:block;overflow:hidden;margin-top:6px;color:#324b68;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.endpoint-status-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;padding-top:10px;border-top:1px solid #eff2f5}.endpoint-status-list span{display:inline-flex;align-items:center;gap:4px;padding:4px 6px;border-radius:5px;background:#f4f6f9;color:#9ba6b2;font-size:8px}.endpoint-status-list span i{width:5px;height:5px;border-radius:50%;background:#b8c1cb}.endpoint-status-list span.loaded{background:#eff7f2;color:#69937c}.endpoint-status-list span.loaded i{background:#62aa82}.live-data-empty{padding:22px 10px;color:#99a5b3;text-align:center;font-size:9px}.api-card-list{display:grid;gap:8px;margin-top:12px}.api-record-card{padding:11px 12px;border:1px solid #edf0f4;border-radius:10px;background:#fbfcfe}.record-title-row{display:flex;align-items:center;justify-content:space-between;gap:10px}.record-title-row strong{overflow:hidden;color:#354e6b;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.record-state{flex:none;padding:4px 6px;border-radius:5px;background:#edf5ff;color:#5e82b3;font-size:8px}.record-state.orange-state{background:#fff3e4;color:#bb8950}.api-record-card>p{margin:7px 0 0;color:#8090a3;font-size:9px;line-height:1.6;overflow-wrap:anywhere}.record-fields{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.record-fields>span{display:flex;align-items:center;gap:5px;padding:4px 6px;border-radius:5px;background:#f1f4f8}.record-fields small{color:#9aa7b6;font-size:7px}.record-fields b{color:#647a94;font-size:8px;font-weight:600}.reminder-record{background:#fffdfa}.connect-description{margin:0 0 16px;color:#7e8da0;font-size:11px;line-height:1.7}.connection-error{margin:0;color:#c96e62;font-size:10px;line-height:1.6}.today-page :deep(.el-dialog__body){padding-top:8px;padding-bottom:12px}.today-page :deep(.el-form-item){margin-bottom:13px}.today-page :deep(.el-form-item__label){color:#596f89;font-size:10px}.today-page :deep(.el-dialog__footer .el-button){border-radius:8px;font-size:10px}@media(max-width:760px){.welcome-actions{flex-wrap:wrap;justify-content:flex-start}.connect-button{margin-left:auto}.market-data-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.live-data-panel .panel-heading{align-items:flex-start}.live-feed-badge{font-size:8px}.endpoint-status-list{gap:5px}.api-record-card{padding:10px}}
</style>
