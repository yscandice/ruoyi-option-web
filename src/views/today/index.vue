<template>
  <div class="today-page">
    <!-- 深色首屏：欢迎语、连接状态、刷新 / 招财猫、今日三项指标（长桥风格 Hero） -->
    <section class="lb-hero">
      <div class="lb-wrap hero-inner">
        <div class="eyebrow"><span class="live-dot" />OSM.AI SIGNAL DESK</div>
        <h1>欢迎回到<em>期权交易工作台</em><DataViewTag resource="today" /></h1>
        <p class="date-line">{{ headerDate }} <span>·</span> 今日概览与交易动态</p>
        <div class="hero-actions">
          <span :class="['preview-status', { connected: feed }]" :title="loadError || ''"><i />{{ connectionLabel }}</span>
          <button class="pill-btn pill-white" type="button" :disabled="loading" @click="refreshTodayData()"><el-icon :class="{ spinning: loading }"><Refresh /></el-icon>{{ loading ? '刷新中' : '刷新数据' }}</button>
          <button :class="['pill-btn', 'pill-ghost', { enabled: catEnabled }]" type="button" @click="catEnabled = !catEnabled"><el-icon><Sunny /></el-icon>招财猫 {{ catEnabled ? '开' : '关' }}</button>
        </div>
        <div v-if="!dataView.empty" class="hero-kpis">
          <article class="kpi-card"><div class="kpi-head"><i class="kpi-dot teal" /><span>今日信号</span><el-icon class="hint" title="信号交易日内终端正式发布的信号数"><InfoFilled /></el-icon></div><strong>{{ feed ? metrics.signals.value : '—' }}</strong><small>{{ feed ? metrics.signals.note : '等待接口数据' }}</small></article>
          <article class="kpi-card"><div class="kpi-head"><i class="kpi-dot amber" /><span>保护窗口</span><el-icon class="hint" title="信号交易日内开启的保护窗口"><InfoFilled /></el-icon></div><strong>{{ feed ? metrics.protects.value : '—' }}</strong><small>{{ feed ? metrics.protects.note : '等待接口数据' }}</small></article>
          <article class="kpi-card"><div class="kpi-head"><i class="kpi-dot pink" /><span>动态管理</span><el-icon class="hint" title="信号交易日内下发的管理卡"><InfoFilled /></el-icon></div><strong>{{ feed ? metrics.manages.value : '—' }}</strong><small>{{ feed ? metrics.manages.note : '等待接口数据' }}</small></article>
        </div>
        <p class="hero-note">研究与教育用途，不构成个性化投资建议</p>
      </div>
    </section>

    <div v-if="dataView.empty" class="lb-wrap empty-wrap"><DelayedEmpty resource="today" /></div>
    <template v-else>
    <!-- 今日要闻 -->
    <section class="lb-wrap lb-section news-panel">
      <div class="section-head">
        <div><h2>今日要闻 <span>· {{ newsDay }}</span></h2><p>市场环境、重要事件与当日观察</p></div>
        <div class="section-actions">
          <span class="lb-tag tag-teal data-origin"><i />{{ dataOrigin }}</span>
          <button class="pill-btn pill-line pill-sm" type="button" @click="newsOpen = !newsOpen">{{ newsOpen ? '收起今日要闻' : '展开今日要闻' }}<el-icon><ArrowDown :class="{ flipped: newsOpen }" /></el-icon></button>
          <button class="pill-btn pill-line pill-sm" type="button" @click="copyPageLink"><el-icon><Share /></el-icon>分享</button>
          <div class="segmented"><button :class="{ selected: timezone === 'ET' }" type="button" @click="timezone = 'ET'">美东</button><button :class="{ selected: timezone === 'BJ' }" type="button" @click="timezone = 'BJ'">北京</button></div>
        </div>
      </div>

      <div v-if="newsOpen" class="news-content">
        <div class="brief-callout"><b>盘前简报</b><span class="brief-text">{{ brief.text }}</span><span :class="['brief-tag', `brief-${brief.type}`]">{{ brief.tag }}</span></div>

        <div class="lb-card volatility-card">
          <div class="vol-main"><div class="label">波动率状态 · VIX 现货</div><div class="vol-value">{{ vol.value || '—' }}<small :class="volChangeClass">{{ vol.change || (feed ? '较前收 —' : '待连接') }}</small></div><span class="lb-tag tag-teal vol-status"><i />{{ vol.status || (feed ? '波动率数据暂缺' : '等待波动率数据') }}</span><p>{{ vol.note || 'VIX 环境描述与策略观察将在数据接入后显示。' }}</p></div>
          <div class="term-structure"><div class="term-title"><span class="label">期限结构</span><el-icon :title="vol.termLabel || 'VIX9D / VIX / VIX3M'"><InfoFilled /></el-icon></div><div class="term-body"><span class="term-axis">远月</span><div :class="['term-chart', { active: vol.term.length }]"><i v-for="(bar, index) in termBars" :key="index" :style="{ height: `${bar}%` }" /><span v-if="!vol.term.length" class="term-empty">暂无期限结构</span></div><span class="term-axis">近月</span></div><small>{{ vol.term.length ? (vol.termLabel || 'VIX9D · VIX · VIX3M') : '上游未提供期限结构数据' }}</small></div>
          <div class="vol-side"><div><span class="label">VIX 的波动（VVIX）</span><strong>{{ vol.vvix || '—' }}</strong></div><div><span class="label">尾部风险定价（SKEW）</span><strong>{{ vol.skew || '—' }}</strong></div><div class="side-hint">{{ vol.vvix || vol.skew ? '波动率指标仅供观察' : '上游暂未提供 VVIX / SKEW' }}</div></div>
        </div>

        <div class="market-facts">
          <div class="fact-pill"><i :class="facts.qqq.dot" /><span>QQQ 大盘</span><strong>{{ facts.qqq.value }}</strong></div>
          <div class="fact-pill"><i :class="facts.bond.dot" /><span>美债收益率</span><strong>{{ facts.bond.value }}</strong></div>
          <div class="fact-pill"><i :class="facts.sector.dot" /><span>行业共振</span><strong>{{ facts.sector.value === '—' && !feed ? '等待更新' : facts.sector.value }}</strong></div>
          <div class="fact-pill"><el-icon><Calendar /></el-icon><span>月度期权到期</span><strong>{{ facts.expiry }}</strong></div>
        </div>

        <div class="rhythm-bar"><div class="rhythm-label"><el-icon><Clock /></el-icon><strong>节奏</strong></div><div class="segmented"><button :class="{ selected: selectedDay === 'today' }" type="button" @click="selectedDay = 'today'">{{ cal.anchorLabel ? `${cal.lookahead ? '下一交易日' : '今日'} ${cal.anchorLabel}` : '今日' }}</button><button :class="{ selected: selectedDay === 'next' }" type="button" @click="selectedDay = 'next'">后续</button></div><span class="rhythm-legend"><span><i class="dot-red" />高影响数据 {{ cal.totals.high }}</span><span><i class="dot-gray" />其他数据 {{ cal.totals.med }}</span><span><i class="dot-blue" />财报 {{ cal.totals.earn }}</span></span></div>

        <div class="calendar-grid">
          <section class="lb-card calendar-column">
            <div class="calendar-column-heading"><span class="timeline-dot gray" /><strong>经济数据</strong><span class="lb-tag tag-black">{{ calendarRangeLabel }}</span><span class="event-total">{{ calendarView.macro.length }} 项 · {{ timezone === 'BJ' ? '北京时间' : '美东时间' }}</span></div>
            <div v-if="calendarView.macro.length" class="calendar-list"><div v-for="item in calendarView.macro" :key="item.key" class="calendar-row"><i :class="item.impact === 'high' ? 'dot-red' : 'dot-gray'" /><span class="calendar-time">{{ selectedDay === 'next' ? `${item.dayLabel} ` : '' }}{{ item.time }}</span><div><strong>{{ item.title }}</strong><small v-if="item.meta">{{ item.meta }}</small></div><span v-if="item.impact === 'high'" class="lb-tag tag-pink">高影响</span></div></div>
            <div v-else class="calendar-empty"><el-icon><Calendar /></el-icon><span>{{ feed ? '暂无经济数据' : '暂无日历事件' }}</span><small>{{ feed ? (selectedDay === 'today' ? '该交易日没有已排期的经济数据' : '后续窗口暂无经济数据') : '经济数据与财报安排将在这里显示' }}</small></div>
          </section>
          <section class="lb-card calendar-column">
            <div class="calendar-column-heading"><span class="timeline-dot teal" /><strong>财报</strong><span class="lb-tag tag-gray">{{ calendarRangeLabel }}</span><span class="event-total">{{ calendarView.earnings.length }} 家</span></div>
            <div v-if="calendarView.earnings.length" class="calendar-list"><div v-for="item in calendarView.earnings" :key="item.key" class="calendar-row"><i class="dot-blue" /><span class="calendar-time">{{ selectedDay === 'next' ? `${item.dayLabel} ` : '' }}{{ item.time }}</span><div><strong>{{ item.title }}</strong><small v-if="item.meta">{{ item.meta }}</small></div></div></div>
            <div v-else class="calendar-empty"><el-icon><DataAnalysis /></el-icon><span>{{ feed ? '暂无财报' : '等待事件数据' }}</span><small>{{ feed ? '该时间窗口内没有观察池公司财报' : '按时间整理的重要数据与公司财报' }}</small></div>
          </section>
        </div>
        <p class="facts-footnote">{{ cal.disclosure || (feed ? '市场事实与日历来自 OSM 今日看板。' : '此处用于呈现市场事实与日历安排；相关数据尚未连接。') }}<template v-if="facts.flags.length"> · {{ facts.flags.join(' · ') }}</template></p>
      </div>
    </section>

    <!-- 今日交易动态（灰底区块） -->
    <section class="lb-grey">
      <div class="lb-wrap lb-section">
        <div class="section-head"><div><h2>今日交易动态</h2><p>市场数据、新信号、管理提醒与保证金占用</p></div></div>

        <section v-if="feed" class="lb-card live-data-panel">
          <div class="panel-heading"><div><h3>今日市场数据</h3><p>来自 OSM 会员 Feed · 信号交易日 {{ metrics.day || '未标注' }}{{ lastUpdated ? ` · 更新于 ${lastUpdated}` : '' }}</p></div><span class="lb-tag tag-teal live-feed-badge"><i />{{ loadedEndpointCount }}/{{ endpointStatuses.length }} 个接口已响应</span></div>
          <div v-if="marketEntries.length" class="market-data-grid"><article v-for="entry in marketEntries" :key="entry.key" class="market-data-item"><span>{{ entry.label }}</span><strong>{{ entry.value }}</strong></article></div>
          <div v-else class="live-data-empty">Feed 已返回数据，市场摘要字段暂未提供。</div>
          <div class="endpoint-status-list"><span v-for="endpoint in endpointStatuses" :key="endpoint.key" :class="{ loaded: endpoint.loaded }"><i />{{ endpoint.label }}</span></div>
        </section>

        <div class="dashboard-grid">
          <div class="main-column">
            <section class="lb-card signals-panel">
              <div class="panel-heading"><div><h3>新信号</h3><p>今日策略信号与交易计划</p></div><div class="panel-actions"><div class="segmented"><button :class="{ selected: signalTab === 'new' }" type="button" @click="signalTab = 'new'">新信号 {{ newSignalCards.length }}</button><button :class="{ selected: signalTab === 'all' }" type="button" @click="signalTab = 'all'">全部信号 {{ signals.length }}</button></div><span class="count-badge">{{ feed ? visibleSignalCards.length : '—' }}</span></div></div>
              <div v-if="visibleSignalCards.length" class="record-grid"><article v-for="item in visibleSignalCards" :key="item.key" class="record-card"><div class="record-title-row"><span class="record-symbol">{{ symbolOf(item.title) }}</span><strong>{{ item.title }}</strong><span :class="['lb-tag', item.blocked ? 'tag-amber' : 'tag-teal']">{{ item.blocked ? '暂不可开仓' : item.state }}</span></div><p v-if="item.summary">{{ item.summary }}</p><div v-if="item.fields.length" class="record-fields"><span v-for="field in item.fields" :key="field.key"><small>{{ field.label }}</small><b>{{ field.value }}</b></span></div><div v-if="item.time" class="record-time">发布 {{ item.time }}</div></article></div>
              <div v-else class="signal-empty"><span class="signal-empty-icon"><el-icon><TrendCharts /></el-icon></span><strong>{{ feed ? (signalTab === 'new' ? '当前没有新信号' : '暂无信号记录') : '等待今日 Feed 数据' }}</strong><p>{{ feed ? (signalTab === 'new' && signals.length ? `信号交易日 ${metrics.day} 暂无新发布，可切换“全部信号”查看 ${signals.length} 条在途信号。` : '上游 Feed 已返回，但当前没有可展示的信号记录。') : '登录 OSM 账号并连接数据后，信号将显示在这里。' }}</p></div>
            </section>

            <section class="lb-card reminders-panel">
              <div class="panel-heading"><div><h3>管理提醒</h3><p>保护窗口、仓位调整与到期管理</p></div><div class="panel-actions"><span class="reminder-subtitle">{{ feed ? `${reminders.symbols} 个标的 · 共 ${reminders.total} 条` : '管理与保护动态' }}</span><span class="count-badge amber-count">{{ feed ? reminders.total : '—' }}</span></div></div>
              <div class="reminder-types"><span class="lb-tag tag-amber"><i class="type-orange" />到期提醒</span><span class="lb-tag tag-pink"><i class="type-red" />保护提醒</span><span class="lb-tag tag-teal"><i class="type-blue" />动态管理</span></div>
              <div v-if="reminders.items.length" class="reminder-list"><article v-for="item in reminders.items" :key="item.key" :class="['reminder-record', `reminder-${item.type}`]"><span class="reminder-icon"><el-icon><Lock v-if="item.type === 'red'" /><Clock v-else-if="item.type === 'orange'" /><Operation v-else /></el-icon></span><div class="reminder-body"><div class="record-title-row"><strong>{{ item.title }}</strong><span class="lb-tag tag-amber">{{ item.state }}</span></div><p v-if="item.summary">{{ item.summary }}</p><div v-if="item.fields.length" class="record-fields"><span v-for="field in item.fields" :key="field.key"><small>{{ field.label }}</small><b>{{ field.value }}</b></span></div><ol v-if="item.steps.length" class="record-steps"><li v-for="(step, index) in item.steps" :key="index">{{ stepText(step) }}</li></ol><div v-if="item.time" class="record-time">{{ item.time }}</div></div></article><p v-if="reminders.total > reminders.items.length" class="record-more">另有 {{ reminders.total - reminders.items.length }} 条较早提醒未展开</p></div>
              <div v-else class="reminder-empty"><el-icon><Bell /></el-icon><span>{{ feed ? `信号交易日 ${metrics.day} 没有需要处理的管理提醒` : '登录后加载管理与保护动态' }}</span></div>
            </section>
          </div>

          <aside class="side-column">
            <section class="lb-card margin-panel">
              <div class="panel-heading"><div><h3>保证金占用</h3><p>全站信号的风险资金参考</p></div><span class="panel-head-icon"><el-icon><Coin /></el-icon></span></div>
              <div class="margin-summary"><div><span>在途组数</span><strong>{{ margin ? margin.currentCount : '—' }} <small>组</small></strong></div><div><span>预估占用</span><strong>{{ margin ? formatUsd(margin.currentUsd) : '—' }}</strong></div></div>
              <div class="margin-chart"><div class="label">最近 10 个交易日</div><div class="chart-grid"><div v-if="!margin" class="chart-empty-label">等待保证金数据</div><div :class="['chart-bars', { active: margin }]"><i v-for="bar in marginBars" :key="bar.day" :class="{ current: bar.label === '今天' }" :style="{ height: `${bar.height}%` }" :title="`${bar.day} · ${formatUsd(bar.usd)} · ${bar.count} 组`" /></div></div><div class="chart-dates"><template v-if="margin"><span v-for="bar in marginBars" :key="bar.day">{{ bar.label }}</span></template><template v-else><span>较早</span><span>近期</span></template></div></div>
              <div class="margin-comparison"><div><span>昨日收盘</span><strong>{{ margin?.yesterday != null ? formatUsd(margin.yesterday) : '—' }}</strong></div><div><span>本周日均</span><strong>{{ margin?.thisWeek != null ? formatUsd(margin.thisWeek) : '—' }}</strong></div><div><span>上周日均</span><strong>{{ margin?.lastWeek != null ? formatUsd(margin.lastWeek) : '—' }}</strong></div></div>
              <p class="margin-note"><el-icon><InfoFilled /></el-icon>{{ margin ? '按在途信号组最大风险（maxRisk）合计估算，止盈确认或到期后释放。' : '保证金占用将在交易数据接入后展示。' }}</p>
            </section>
            <section class="lb-card guide-card"><span class="guide-icon"><el-icon><QuestionFilled /></el-icon></span><div><strong>第一次做卖方？</strong><small>了解卖方策略的节奏与风险</small></div></section>
            <section class="education-card"><span class="education-icon"><el-icon><Warning /></el-icon></span><div><strong>风险提示</strong><p>研究与教育用途，不构成个性化投资建议。期权交易存在重大亏损风险。</p></div></section>
          </aside>
        </div>
      </div>
    </section>
    </template>
  </div>
</template>

<script setup>
import DataViewTag from '@/components/option/DataViewTag.vue'
import DelayedEmpty from '@/components/option/DelayedEmpty.vue'
import { useDataView } from '@/utils/accessStore'
import { isHandledError } from '@/services/http'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Calendar, Clock, Coin, DataAnalysis, InfoFilled, Lock, Operation, QuestionFilled, Refresh, Share, Sunny, TrendCharts, Warning, ArrowDown } from '@element-plus/icons-vue'
import { getTodayFeed, getSellerGuide, getEntitlement, getTodayDecisions, getManagementChoices, getPremarketBrief, getOptionUpdates, getOptionSupport } from '@/api/option/today'
import { calendar, dateLine, etToday, formatUsd, marginStats, marketDataEntries, marketFacts, premarketBrief, reminderCards, shortDay, signalCards, summaryMetrics, volatility, weekday, zonedTime } from '@/utils/todayFeed'

// 盘后版：标题旁标签 / 尚未放出空状态（W4）
const dataView = useDataView('today')

const POLL_MS = 60000
// 盘后版数据是静态快照：轮询间隔放慢到 5 分钟
const DELAYED_POLL_MS = 300000
let lastPollAt = Date.now()
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
const loadError = ref('')
const lastUpdated = ref('')
let pollTimer = null

const headerDate = computed(() => {
  const line = dateLine(feed.value)
  if (line) return line
  const day = etToday()
  return `${day} ${weekday(day)}（美东）`
})
const newsDay = computed(() => {
  const day = feed.value?.marketEtDay || feed.value?.etDay || etToday()
  return `${shortDay(day)} ${weekday(day)}`
})
const dataOrigin = computed(() => {
  if (!feed.value) return loading.value ? '正在加载市场数据' : '等待市场数据'
  const at = feed.value.todayDesk?.generatedAtEt
  return at ? `看板生成于 ${at}` : '上游数据已同步'
})
const connectionLabel = computed(() => loading.value && !feed.value ? '正在加载' : feed.value ? `已连接 · ${lastUpdated.value || '数据就绪'}` : sessionConnected.value ? '数据就绪' : '暂无数据')
const brief = computed(() => {
  const result = premarketBrief(premarket.value, feed.value)
  return feed.value && !endpointLoaded.premarket ? { ...result, tag: '今日未发布' } : result
})
const vol = computed(() => volatility(feed.value))
const volChangeClass = computed(() => vol.value.change.startsWith('+') ? 'vol-up' : vol.value.change.startsWith('-') ? 'vol-down' : '')
const termBars = computed(() => {
  const term = vol.value.term
  if (!term.length) return []
  const max = Math.max(...term)
  const min = Math.min(...term)
  return [...term].reverse().map(v => Math.round(35 + (max === min ? 30 : (v - min) / (max - min) * 55)))
})
const facts = computed(() => marketFacts(feed.value))
const cal = computed(() => calendar(feed.value, timezone.value))
const calendarView = computed(() => cal.value[selectedDay.value])
const calendarRangeLabel = computed(() => selectedDay.value === 'today' ? (cal.value.anchorLabel || '当前交易日') : (cal.value.through ? `至 ${shortDay(cal.value.through)}` : '即将到来'))
const metrics = computed(() => summaryMetrics(feed.value))
const signals = computed(() => signalCards(feed.value))
const newSignalCards = computed(() => signals.value.filter(item => item.isNew))
const visibleSignalCards = computed(() => (signalTab.value === 'new' ? newSignalCards.value : signals.value).slice(0, 12))
const reminders = computed(() => reminderCards(feed.value))
const margin = computed(() => marginStats(feed.value))
const marginBars = computed(() => margin.value?.bars || [])
const marketEntries = computed(() => feed.value ? marketDataEntries(feed.value, ancillary) : [])
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
const loadedEndpointCount = computed(() => endpointStatuses.value.filter(item => item.loaded).length)

onMounted(() => {
  refreshTodayData()
  pollTimer = window.setInterval(() => {
    if (document.hidden || loading.value) return
    if (dataView.value.delayed && Date.now() - lastPollAt < DELAYED_POLL_MS - 1000) return
    lastPollAt = Date.now()
    refreshTodayData({ silent: true })
  }, POLL_MS)
})
onBeforeUnmount(() => window.clearInterval(pollTimer))

async function refreshTodayData({ silent = false } = {}) {
  loading.value = true
  if (!silent) loadError.value = ''
  const tasks = [
    ['feed', getTodayFeed],
    ['sellerGuide', getSellerGuide],
    ['entitlement', getEntitlement],
    ['decisions', getTodayDecisions],
    ['managementChoices', getManagementChoices],
    ['premarket', () => getPremarketBrief(etToday())],
    ['updates', getOptionUpdates],
    ['support', getOptionSupport]
  ]
  try {
    const results = await Promise.allSettled(tasks.map(([, request]) => request()))
    results.forEach((result, index) => {
      const [key] = tasks[index]
      endpointLoaded[key] = result.status === 'fulfilled'
      if (result.status !== 'fulfilled') return
      if (key === 'feed') feed.value = result.value
      else if (key === 'premarket') premarket.value = result.value
      else ancillary[key] = result.value
    })
    const feedResult = results[0]
    if (feedResult.status === 'fulfilled') {
      sessionConnected.value = true
      loadError.value = ''
      const at = feed.value?.serverReceivedAt || feed.value?.generated_at
      lastUpdated.value = at ? `${zonedTime(at, 'Asia/Shanghai')} 更新` : '数据就绪'
    } else {
      const message = friendlyError(feedResult.reason, '今日数据加载失败')
      if (!silent || !feed.value) {
        feed.value = null
        loadError.value = message
        // 会员端不再连接 OSM 账号（W7）：后端暂无数据时只在状态处提示，不弹错误
        if (isNoData(message)) sessionConnected.value = false
        else if (!silent && !isHandledError(feedResult.reason)) ElMessage.error(message)
      }
    }
  } finally {
    loading.value = false
  }
}

function isNoData(message) {
  return /暂无数据|请先同步/.test(message || '')
}

function friendlyError(error, fallback) {
  const message = error?.message || ''
  if (/handshake|SSL|TLS|I\/O error|ECONN|timed? out|connection reset/i.test(message)) {
    return '无法连接 OSM 上游服务（网络或 TLS 握手失败）。请检查后端运行环境能否访问 osmtrade.com，再重试。'
  }
  return message || fallback
}

// 信号卡左侧圆形代码徽标：取标题中的标的代码
function symbolOf(title) {
  return String(title || '').split(/[\s·]/)[0].slice(0, 5) || '—'
}

function stepText(step) {
  if (typeof step === 'string') return step
  return step?.text || step?.label || step?.title || ''
}

async function copyPageLink() {
  try { await navigator.clipboard.writeText(window.location.href); ElMessage.success('页面地址已复制') }
  catch { ElMessage.info('可从浏览器地址栏复制页面地址') }
}
</script>

<style scoped>
/* 长桥风格（docs/longbridge-ui.md）：设计变量限定在今日页，不影响其他菜单 */
.today-page{--lb-text:#070a13;--lb-text-2:#4b5563;--lb-text-3:#6b7280;--lb-text-4:#a8aaad;--lb-accent:#00b8b8;--lb-accent-bright:#00f0c4;--lb-accent-soft:rgba(0,184,184,.1);--lb-bg:#f9fafb;--lb-bg-2:#f1f3f4;--lb-border:#e5e7eb;--lb-on-dark:rgba(255,255,255,.9);--lb-on-dark-2:rgba(255,255,255,.7);--lb-on-dark-border:rgba(255,255,255,.2);--lb-up:#e8467c;--lb-down:#00b8b8;--lb-warn:#f59e0b;--lb-r-xl:20px;--lb-r-lg:16px;--lb-shadow-1:0 1px 2px rgba(7,10,19,.04),0 1px 3px rgba(7,10,19,.06);--lb-shadow-2:0 8px 24px rgba(7,10,19,.08);--lb-glass-dark:rgba(255,255,255,.08);--lb-blur:saturate(180%) blur(16px);--pad-top:30px;--pad-bottom:42px;
  margin:calc(var(--pad-top) * -1) calc(50% - 50vw) calc(var(--pad-bottom) * -1);background:var(--lb-bg);color:var(--lb-text);font-family:system-ui,-apple-system,"Segoe UI",Avenir,Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",Arial,sans-serif;font-variant-numeric:tabular-nums}
.lb-wrap{max-width:1248px;margin:0 auto;padding:0 24px}
.label{font-size:13px;color:var(--lb-text-3)}
/* 按钮 / 标签 / 分段 */
.pill-btn{height:48px;padding:0 28px;border-radius:9999px;border:0;font:inherit;font-size:16px;font-weight:700;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:transform .2s,box-shadow .2s,background .2s}
.pill-btn:hover:not(:disabled){transform:translateY(-1px)}.pill-btn:disabled{opacity:.6;cursor:default}
.pill-white{background:#fff;color:#000}.pill-white:hover:not(:disabled){box-shadow:0 8px 24px rgba(0,240,196,.25)}
.pill-ghost{background:transparent;color:#fff;border:1px solid var(--lb-on-dark-border)}.pill-ghost.enabled{border-color:rgba(0,240,196,.55);color:var(--lb-accent-bright)}
.pill-line{background:#fff;color:var(--lb-text);border:1px solid var(--lb-border)}.pill-sm{height:34px;padding:0 14px;font-size:13px;font-weight:600}
.pill-line .flipped{transform:rotate(180deg)}.spinning{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.lb-tag{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:9999px;font-size:12px;font-weight:500;white-space:nowrap;flex:none}
.lb-tag i{width:6px;height:6px;border-radius:50%;background:currentColor}
.tag-teal{background:var(--lb-accent-soft);color:#008f8f}.tag-black{background:#000;color:#fff}.tag-gray{background:var(--lb-bg-2);color:var(--lb-text-2)}.tag-amber{background:rgba(245,158,11,.12);color:#b45309}.tag-pink{background:rgba(232,70,124,.1);color:#c0265c}
.segmented{display:inline-flex;padding:4px;border-radius:9999px;background:var(--lb-bg-2);flex:none}.segmented button{border:0;background:transparent;height:30px;padding:0 14px;border-radius:9999px;font:inherit;font-size:13px;font-weight:600;color:var(--lb-text-3);cursor:pointer;white-space:nowrap}.segmented button.selected{background:#000;color:#fff}
.lb-card{background:#fff;border-radius:var(--lb-r-xl);box-shadow:var(--lb-shadow-1);padding:28px}
/* Hero */
.lb-hero{position:relative;overflow:hidden;background:linear-gradient(180deg,#000 0%,#031a1d 55%,#04262a 100%);color:var(--lb-on-dark)}
.lb-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 55% at 50% 118%,rgba(0,240,196,.38),transparent 70%),radial-gradient(ellipse 40% 30% at 85% 10%,rgba(0,184,184,.18),transparent 70%);pointer-events:none}
.lb-hero:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(100deg,transparent 0 46px,rgba(0,240,196,.05) 46px 47px);-webkit-mask:linear-gradient(180deg,transparent,#000 60%);mask:linear-gradient(180deg,transparent,#000 60%);pointer-events:none}
.hero-inner{position:relative;z-index:1;padding-top:56px;padding-bottom:56px;text-align:center}
.eyebrow{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 14px;border-radius:9999px;border:1px solid var(--lb-on-dark-border);background:var(--lb-glass-dark);font-size:12px;letter-spacing:1.5px;color:var(--lb-accent-bright)}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--lb-accent-bright);box-shadow:0 0 0 4px rgba(0,240,196,.2)}
.lb-hero h1{margin:20px 0 14px;font-size:48px;line-height:1.1;font-weight:700;color:#fff;letter-spacing:-.5px}
.lb-hero h1 em{font-style:normal;background:linear-gradient(90deg,var(--lb-accent-bright),#7ff6e0);-webkit-background-clip:text;background-clip:text;color:transparent}
.lb-hero h1 :deep(.data-view-tag){vertical-align:middle;margin-left:12px;font-size:12px;letter-spacing:0}
.date-line{margin:0;font-size:16px;color:var(--lb-on-dark-2)}.date-line span{margin:0 4px}
.hero-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:28px}
.preview-status{display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 18px;border-radius:9999px;background:var(--lb-glass-dark);border:1px solid var(--lb-on-dark-border);font-size:14px;color:var(--lb-on-dark-2)}
.preview-status i{width:7px;height:7px;border-radius:50%;background:var(--lb-text-4)}.preview-status.connected i{background:var(--lb-accent-bright);box-shadow:0 0 0 4px rgba(0,240,196,.18)}
.hero-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:900px;margin:44px auto 0}
.kpi-card{padding:20px 24px;border-radius:var(--lb-r-xl);background:var(--lb-glass-dark);border:1px solid var(--lb-on-dark-border);-webkit-backdrop-filter:var(--lb-blur);backdrop-filter:var(--lb-blur);text-align:left;min-width:0}
.kpi-head{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--lb-on-dark-2)}.kpi-head .hint{margin-left:auto;opacity:.6;cursor:help}
.kpi-dot{width:8px;height:8px;border-radius:50%}.kpi-dot.teal{background:var(--lb-accent-bright)}.kpi-dot.amber{background:#fbbf24}.kpi-dot.pink{background:#ff7aa4}
.kpi-card strong{display:block;margin:8px 0 4px;font-size:40px;line-height:1.1;font-weight:700;color:#fff}.kpi-card small{display:block;font-size:12px;color:var(--lb-on-dark-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hero-note{margin:22px 0 0;font-size:12px;color:rgba(255,255,255,.5)}
.empty-wrap{padding-top:40px;padding-bottom:64px}
/* 区块标题 */
.lb-section{padding-top:56px;padding-bottom:56px}
.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.section-head h2{margin:0;font-size:36px;line-height:1.15;font-weight:600}.section-head h2 span{font-size:22px;font-weight:400;color:var(--lb-text-4)}
.section-head p{margin:8px 0 0;font-size:16px;color:var(--lb-text-2)}
.section-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
/* 今日要闻 */
.brief-callout{display:flex;align-items:center;gap:20px;padding:20px 24px;margin-bottom:16px;border-radius:var(--lb-r-xl);background:#000;color:var(--lb-on-dark)}
.brief-callout b{flex:none;height:28px;line-height:28px;padding:0 12px;border-radius:9999px;background:var(--lb-accent-bright);color:#000;font-size:13px}
.brief-text{flex:1;font-size:15px;line-height:1.65}
.brief-tag{flex:none;height:26px;line-height:26px;padding:0 12px;border-radius:9999px;font-size:12px;font-weight:600;background:rgba(255,255,255,.1);color:var(--lb-on-dark-2)}.brief-tag.brief-success{background:rgba(0,240,196,.14);color:var(--lb-accent-bright)}
.volatility-card{display:grid;grid-template-columns:1.25fr 1fr .8fr;padding:28px 0}
.volatility-card>div{padding:0 28px;min-width:0}.volatility-card>div+div{border-left:1px solid var(--lb-border)}
.vol-value{margin:14px 0 10px;font-size:56px;line-height:1;font-weight:700;letter-spacing:-1px}.vol-value small{margin-left:10px;font-size:15px;font-weight:600;letter-spacing:0;color:var(--lb-text-3)}
.vol-up{color:var(--lb-up)!important}.vol-down{color:var(--lb-down)!important}
.vol-main p{margin:12px 0 0;font-size:14px;line-height:1.6;color:var(--lb-text-2)}
.term-title{display:flex;align-items:center;justify-content:space-between;color:var(--lb-text-4)}
.term-body{display:flex;align-items:stretch;gap:10px;height:130px;margin:16px 0 10px}
.term-axis{writing-mode:vertical-rl;font-size:11px;color:var(--lb-text-4);align-self:center}
.term-chart{position:relative;flex:1;display:flex;align-items:flex-end;justify-content:space-around;gap:12px;padding:0 6px;border-bottom:1px dashed var(--lb-border)}
.term-chart i{flex:1;max-width:44px;border-radius:10px 10px 4px 4px;background:linear-gradient(180deg,var(--lb-accent-bright),var(--lb-accent))}
.term-empty{position:absolute;inset:0;display:grid;place-items:center;font-size:12px;color:var(--lb-text-4);background:repeating-linear-gradient(0deg,transparent 0 31px,var(--lb-bg-2) 31px 32px)}
.term-structure small{font-size:12px;color:var(--lb-text-3)}
.vol-side>div{padding:12px 0;border-bottom:1px solid var(--lb-border)}.vol-side>div:first-child{padding-top:0}.vol-side>div.side-hint{border:0;font-size:12px;color:var(--lb-text-4)}
.vol-side strong{display:block;margin-top:6px;font-size:28px;font-weight:700}
.market-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}
.fact-pill{display:flex;align-items:center;gap:10px;min-height:56px;padding:8px 20px;border-radius:9999px;background:#fff;box-shadow:var(--lb-shadow-1);font-size:14px;color:var(--lb-text-2);min-width:0}
.fact-pill>span{white-space:nowrap}.fact-pill strong{margin-left:auto;color:var(--lb-text);font-weight:600;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fact-pill i{flex:none;width:8px;height:8px;border-radius:50%}.fact-pill .el-icon{color:var(--lb-text-3)}
.fact-green{background:var(--lb-accent)}.fact-orange{background:var(--lb-warn)}.fact-red{background:var(--lb-up)}
.rhythm-bar{display:flex;align-items:center;gap:14px;margin:8px 0 16px;flex-wrap:wrap}
.rhythm-label{display:flex;align-items:center;gap:6px;font-size:15px}
.rhythm-legend{margin-left:auto;display:flex;gap:14px;font-size:12px;color:var(--lb-text-3)}.rhythm-legend span{display:flex;align-items:center;gap:6px}.rhythm-legend i{width:8px;height:8px;border-radius:50%}
.dot-red{background:var(--lb-up)}.dot-gray{background:var(--lb-text-4)}.dot-blue{background:var(--lb-accent)}
.calendar-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.calendar-column{padding:24px}
.calendar-column-heading{display:flex;align-items:center;gap:10px;margin-bottom:8px}.calendar-column-heading strong{font-size:18px}
.timeline-dot{width:8px;height:8px;border-radius:50%}.timeline-dot.gray{background:var(--lb-text-4)}.timeline-dot.teal{background:var(--lb-accent)}
.event-total{margin-left:auto;font-size:12px;color:var(--lb-text-3)}
.calendar-list{max-height:420px;overflow:auto}
.calendar-row{display:grid;grid-template-columns:8px 72px minmax(0,1fr) auto;align-items:center;gap:12px;padding:13px 0;border-top:1px solid var(--lb-border);font-size:14px}
.calendar-row i{width:8px;height:8px;border-radius:50%}.calendar-time{color:var(--lb-text-3);font-size:13px}
.calendar-row strong{font-weight:600}.calendar-row small{display:block;margin-top:2px;font-size:12px;color:var(--lb-text-3)}
.calendar-empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:36px 0;border-top:1px solid var(--lb-border);color:var(--lb-text-2)}
.calendar-empty .el-icon{font-size:36px;color:var(--lb-text-4)}.calendar-empty span{font-size:15px;font-weight:600;color:var(--lb-text)}.calendar-empty small{font-size:13px;color:var(--lb-text-3)}
.facts-footnote{margin:14px 0 0;font-size:12px;line-height:1.6;color:var(--lb-text-4)}
/* 交易动态 */
.lb-grey{background:var(--lb-bg-2)}
.panel-heading{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.panel-heading h3{margin:0;font-size:24px;font-weight:600}.panel-heading p{margin:4px 0 0;font-size:14px;color:var(--lb-text-3)}
.panel-actions{margin-left:auto;display:flex;align-items:center;gap:10px}
.count-badge{min-width:32px;height:32px;padding:0 10px;border-radius:9999px;background:#000;color:#fff;display:grid;place-items:center;font-size:14px;font-weight:700}.amber-count{background:var(--lb-warn)}
.live-data-panel{margin-bottom:24px}.live-feed-badge{margin-left:auto}
.market-data-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.market-data-item{padding:16px;border-radius:14px;background:var(--lb-bg);min-width:0}
.market-data-item span{font-size:12px;color:var(--lb-text-3)}.market-data-item strong{display:block;margin-top:6px;font-size:15px;font-weight:600;line-height:1.4;word-break:break-word}
.live-data-empty{padding:16px;border-radius:14px;background:var(--lb-bg);font-size:14px;color:var(--lb-text-3)}
.endpoint-status-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.endpoint-status-list span{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:9999px;background:var(--lb-bg-2);font-size:12px;color:var(--lb-text-3)}
.endpoint-status-list i{width:6px;height:6px;border-radius:50%;background:var(--lb-text-4)}.endpoint-status-list .loaded{background:var(--lb-accent-soft);color:#008f8f}.endpoint-status-list .loaded i{background:var(--lb-accent)}
.dashboard-grid{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:24px;align-items:start}
.main-column{display:flex;flex-direction:column;gap:24px;min-width:0}
.side-column{display:flex;flex-direction:column;gap:16px;position:sticky;top:96px}
.record-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.record-card{padding:20px;border-radius:var(--lb-r-lg);border:1px solid var(--lb-border);background:#fff;transition:box-shadow .2s;min-width:0}.record-card:hover{box-shadow:var(--lb-shadow-2)}
.record-title-row{display:flex;align-items:center;gap:10px}.record-title-row strong{font-size:16px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.record-title-row .lb-tag{margin-left:auto}
.record-symbol{flex:none;width:40px;height:40px;border-radius:50%;background:var(--lb-bg-2);display:grid;place-items:center;font-size:11px;font-weight:700;letter-spacing:-.3px}
.record-card p,.reminder-body p{margin:12px 0 0;font-size:13px;line-height:1.6;color:var(--lb-text-2)}
.record-fields{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:14px;padding:12px 14px;border-radius:12px;background:var(--lb-bg)}
.record-fields span{display:flex;flex-direction:column;min-width:0}.record-fields small{font-size:11px;color:var(--lb-text-3)}.record-fields b{margin-top:2px;font-size:14px;font-weight:600}
.record-time{margin-top:12px;font-size:12px;color:var(--lb-text-3)}
.signal-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px 16px;text-align:center}
.signal-empty-icon{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--lb-accent-soft);color:var(--lb-accent);font-size:28px}
.signal-empty strong{font-size:16px}.signal-empty p{margin:0;max-width:420px;font-size:14px;color:var(--lb-text-3)}
.reminder-subtitle{font-size:13px;color:var(--lb-text-3)}
.reminder-types{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.reminder-types i{background:currentColor}
.reminder-record{display:flex;gap:14px;padding:18px 0;border-top:1px solid var(--lb-border)}
.reminder-icon{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:18px}
.reminder-red .reminder-icon{background:rgba(232,70,124,.1);color:var(--lb-up)}.reminder-orange .reminder-icon{background:rgba(245,158,11,.12);color:#b45309}.reminder-blue .reminder-icon{background:var(--lb-accent-soft);color:var(--lb-accent)}
.reminder-body{flex:1;min-width:0}
.record-steps{margin:10px 0 0;padding-left:18px;font-size:13px;line-height:1.7;color:var(--lb-text-2)}
.record-more{margin:12px 0 0;font-size:12px;color:var(--lb-text-3);text-align:center}
.reminder-empty{display:flex;align-items:center;justify-content:center;gap:8px;padding:28px 0;border-top:1px solid var(--lb-border);font-size:14px;color:var(--lb-text-3)}
.panel-head-icon{margin-left:auto;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--lb-accent-soft);color:var(--lb-accent);font-size:18px}
.margin-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px}.margin-summary div{padding:16px;border-radius:14px;background:var(--lb-bg)}
.margin-summary span{font-size:13px;color:var(--lb-text-3)}.margin-summary strong{display:block;margin-top:6px;font-size:26px;font-weight:700}.margin-summary small{font-size:14px;font-weight:400;color:var(--lb-text-3)}
.margin-chart{margin-top:20px}
.chart-grid{position:relative;height:120px;margin-top:10px;border-bottom:1px solid var(--lb-border)}
.chart-empty-label{position:absolute;inset:0;display:grid;place-items:center;font-size:12px;color:var(--lb-text-4)}
.chart-bars{height:100%;display:flex;align-items:flex-end;gap:8px}.chart-bars i{flex:1;border-radius:6px 6px 2px 2px;background:#d7f3f3}.chart-bars i.current{background:linear-gradient(180deg,var(--lb-accent-bright),var(--lb-accent))}
.chart-dates{display:flex;justify-content:space-between;gap:4px;margin-top:6px;font-size:10px;color:var(--lb-text-4)}.chart-dates span{flex:1;text-align:center}
.margin-comparison{margin-top:16px}.margin-comparison div{display:flex;justify-content:space-between;padding:11px 0;border-top:1px solid var(--lb-border);font-size:14px;color:var(--lb-text-2)}.margin-comparison strong{color:var(--lb-text)}
.margin-note{display:flex;gap:6px;margin:14px 0 0;font-size:12px;line-height:1.6;color:var(--lb-text-3)}.margin-note .el-icon{flex:none;margin-top:3px}
.guide-card{display:flex;align-items:center;gap:14px;padding:22px 24px}.guide-card strong{display:block;font-size:15px}.guide-card small{font-size:13px;color:var(--lb-text-3)}
.guide-icon{flex:none;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:var(--lb-accent-soft);color:var(--lb-accent);font-size:22px}
.education-card{display:flex;gap:14px;padding:24px;border-radius:var(--lb-r-xl);background:linear-gradient(135deg,#000,#063236);color:var(--lb-on-dark)}
.education-icon{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1);color:#fbbf24;font-size:18px}
.education-card strong{font-size:16px}.education-card p{margin:6px 0 0;font-size:13px;line-height:1.6;color:var(--lb-on-dark-2)}
/* 响应式：与布局断点一致（1100 / 760） */
@media(max-width:1279px){.dashboard-grid{grid-template-columns:minmax(0,1fr) 320px}.record-grid{grid-template-columns:1fr}.market-data-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:1100px){.today-page{--pad-top:24px;--pad-bottom:36px}.lb-hero h1{font-size:40px}.dashboard-grid{grid-template-columns:1fr}.side-column{position:static;display:grid;grid-template-columns:1fr 1fr}.side-column .margin-panel{grid-row:span 2}.market-facts{grid-template-columns:1fr 1fr}.volatility-card{grid-template-columns:1fr 1fr}.vol-side{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:16px;padding-top:20px!important;margin-top:20px;border-left:0!important;border-top:1px solid var(--lb-border)}.vol-side>div{border:0;padding:0}.vol-side .side-hint{grid-column:1/-1}}
@media(max-width:760px){
  .today-page{--pad-top:20px;--pad-bottom:30px}.lb-wrap{padding:0 16px}
  .hero-inner{padding-top:32px;padding-bottom:40px}.lb-hero h1{font-size:30px}.lb-hero h1 em{display:inline-block}.lb-hero h1 :deep(.data-view-tag){display:flex;width:max-content;margin:10px auto 0}.date-line{font-size:14px}
  .preview-status{width:100%;justify-content:center;height:44px}.pill-btn{height:44px;padding:0 20px;font-size:14px}
  .hero-kpis{gap:8px;margin-top:28px}.kpi-card{padding:14px 12px;border-radius:16px}.kpi-card strong{font-size:28px}.kpi-card small,.kpi-head .hint{display:none}.kpi-head{font-size:12px}
  .lb-section{padding-top:36px;padding-bottom:36px}.section-head h2{font-size:26px}.section-head h2 span{font-size:17px}.section-head p{font-size:14px}
  .brief-callout{flex-direction:column;align-items:flex-start;gap:10px;padding:18px}
  .lb-card{padding:20px}.volatility-card{grid-template-columns:1fr;padding:20px 0}.volatility-card>div{padding:0 20px}.volatility-card>div+div{border-left:0;border-top:1px solid var(--lb-border);padding-top:18px;margin-top:18px}.vol-side{margin-top:18px!important}.vol-value{font-size:44px}
  .fact-pill{flex-wrap:wrap;gap:2px 8px;border-radius:16px;padding:10px 14px;font-size:12px}.fact-pill strong{margin-left:0;width:100%;text-align:left;font-size:14px}
  .rhythm-legend{margin-left:0;width:100%;flex-wrap:wrap}
  .calendar-grid{grid-template-columns:1fr}.calendar-row{grid-template-columns:8px 56px minmax(0,1fr)}.calendar-row .lb-tag{display:none}
  .market-data-grid{grid-template-columns:1fr 1fr}.panel-heading h3{font-size:20px}.panel-actions{margin-left:0;width:100%}
  .side-column{grid-template-columns:1fr}.side-column .margin-panel{grid-row:auto}
}
</style>
<style>
/* 今日页首屏与灰底区块需铺满视口宽度：仅在今日页存在时裁掉横向溢出 */
html:has(.today-page){overflow-x:clip}
</style>
