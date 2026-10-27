<template>
  <div class="scorecard-page">
    <section class="lb-hero"><div class="lb-wrap">
    <section class="page-heading">
      <div><div class="eyebrow"><span class="eyebrow-dot"/>REVIEW · PERFORMANCE</div><h1>战绩<DataViewTag resource="record" /></h1><p>每日结算净额 · 管理后口径</p></div>
      <div class="heading-meta"><span>{{ syncBadge }}</span><el-button plain class="share-button" :disabled="!ready" @click="shareSummary"><el-icon><Share /></el-icon>{{ shareLabel }}</el-button></div>
    </section>
    </div></section>

    <div class="lb-wrap lb-body">

    <DelayedEmpty v-if="dataView.empty" resource="record" />
    <section v-else-if="!ready" class="panel status-panel">
      <span class="status-icon"><el-icon><component :is="loading ? Loading : Document" :class="{ spinning: loading }" /></el-icon></span>
      <strong>{{ loading ? '正在读取战绩…' : '暂无数据' }}</strong>
      <p>{{ loading ? '正在从本地服务读取 OSM 同步的战绩数据' : (error || '后端定时任务尚未同步战绩菜单的数据，请稍后刷新。') }}</p>
      <span v-if="!loading && !error" class="deploy-tip"><i />首次部署请由管理员在若依后台「系统监控 → 定时任务」对「OSM战绩菜单强制同步」执行一次</span>
      <button v-if="!loading" type="button" @click="loadAll">重新加载</button>
    </section>

    <template v-else>
    <section class="chart-panel panel" :class="{ 'is-loading': loading }">
      <div class="chart-panel-top"><div><span class="section-kicker">SETTLEMENT PERFORMANCE</span><h2>每日盈亏</h2><p>正式信号 · 管理后口径 · 按结算日（ET）归集</p></div><span class="demo-tag"><i/>OSM · {{ marketDayLabel }}</span></div>
      <div class="control-rows">
        <div class="control-row"><span class="control-label">口径</span><div class="segmented"><button :class="{active:scope==='all'}" @click="scope='all'">全部正式信号</button><button :class="{active:scope==='adopted'}" @click="scope='adopted'">我跟了的</button></div><span class="control-hint">{{ scope==='adopted' ? '按我跟了的组数放大金额' : '每条信号按独立组合计算' }}</span></div>
        <div class="control-row"><span class="control-label">粒度</span><div class="segmented compact"><button v-for="item in granularities" :key="item.key" :class="{active:granularity===item.key}" @click="granularity=item.key">{{ item.label }}</button></div><span class="control-label chart-type-label">图型</span><div class="segmented compact"><button v-for="item in chartTypes" :key="item.key" :class="{active:chartType===item.key}" @click="chartType=item.key">{{ item.label }}</button></div><span class="control-label range-label">区间</span><div class="segmented compact"><button :class="{active:range==='month'}" @click="range='month'">本月</button><button :class="{active:range==='all'}" @click="range='all'">全部</button></div><el-switch v-model="showFloating" class="floating-switch" :disabled="granularity!=='day'" /><span class="floating-switch-label">当日浮动盈亏（未结算）</span></div>
      </div>

      <div class="chart-legend"><span><i class="legend-settled"/>{{ chartType==='cumulative' ? '累计结算净额' : '结算净额' }}</span><span v-if="floatingOn"><i class="legend-floating"/>未结算浮动</span><small>美元 · ET 交易日</small></div>
      <div class="performance-chart">
        <div class="chart-axis"><span v-for="label in axisLabels" :key="label">{{ label }}</span></div>
        <div class="chart-plot" :class="`mode-${chartType}`">
          <div v-for="line in 5" :key="line" class="grid-line" :class="{zero:line===3}"/>
          <svg v-if="chartType!=='bar' && hasChartData" class="line-chart" viewBox="0 0 900 210" preserveAspectRatio="none" aria-label="每日盈亏趋势">
            <defs><linearGradient id="settledArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#4b8bc9" stop-opacity=".18"/><stop offset="100%" stop-color="#4b8bc9" stop-opacity="0"/></linearGradient></defs>
            <path v-if="trendPoints.length" :d="trendArea" fill="url(#settledArea)"/><polyline v-if="trendPoints.length" :points="trendPolyline" fill="none" stroke="#4d8bc5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline v-if="floatingOn && floatingPoints.length" :points="floatingPolyline" fill="none" stroke="#e7a54d" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div v-else class="bar-groups"><div v-for="(item,index) in chartData" :key="item.key" class="bar-group" :title="barTitle(item)"><div class="bars"><i v-if="item.settled!==null" class="settled-bar" :class="{loss:item.settled<0}" :style="barStyle(item.settled)"/><i v-if="floatingOn && item.floating!==null" class="floating-bar" :class="{loss:item.floating<0}" :style="barStyle(item.floating)"/></div><span v-if="showLabel(index)">{{ item.label }}</span></div></div>
          <div v-if="chartType!=='bar'" class="line-labels"><span v-for="(item,index) in chartData" :key="item.key">{{ showLabel(index) ? item.label : '' }}</span></div>
          <div class="zero-axis"/><div v-if="!hasChartData" class="chart-empty">{{ scope==='adopted' ? '当前区间还没有我跟了的结算记录' : '当前区间暂无结算数据' }}</div>
        </div>
      </div>
      <div class="chart-footnote">实心图形表示已结算净额（管理后）；橙色虚线 / 半透明柱表示未结算生命周期的当日收盘浮动盈亏（仅「日」粒度），不计入结算合计。今日 {{ marketDayLabel }} 为盘中估算。</div>
    </section>

    <section class="summary-strip panel">
      <div class="summary-total"><span>{{ range==='month'?'本月':'全部区间' }}结算合计 <small>· 按结算日</small></span><strong :class="tone(settledTotal)">{{ money(settledTotal) }}</strong></div>
      <div class="summary-cell"><span>最大单日盈利</span><strong class="positive">{{ money(maxGain) }}</strong></div>
      <div class="summary-cell"><span>最大单日亏损</span><strong class="negative">{{ money(maxLoss) }}</strong></div>
      <div class="summary-cell"><span>结算交易日 / 覆盖日</span><strong>{{ settledDays }} <small>/ {{ dayRows.length }}</small></strong></div>
      <div class="summary-cell"><span>已结算 / 独立样本</span><strong>{{ stats.priced.length }} <small>/ {{ stats.units }}</small></strong></div>
      <div class="summary-cell"><span>最亏 5 日占亏损</span><strong>{{ worstLossShare }}<small v-if="worstLossShare!=='—'">%</small></strong></div>
    </section>

    <section class="management-panel panel">
      <div class="section-heading"><div><span class="section-kicker">COUNTERFACTUAL REVIEW</span><h2>逆风处置对照 <small>· 被测样本</small></h2><p>只统计发生过管理动作或保护成本的已结算样本（管理后净结果 ≠ 原价差，或有保护成本）</p></div><el-tag effect="plain" type="warning">研究口径</el-tag></div>
      <div class="management-summary">
        <div><span>逆风样本</span><strong>{{ managedRecords.length }} 笔</strong></div><div><span>管理后净结果</span><strong :class="tone(managedNet)">{{ money(managedNet) }}</strong></div><div><span>若不管理（原价差）</span><strong :class="tone(baselineNet)">{{ money(baselineNet) }}</strong></div><div class="delta-cell"><span>管理差额</span><strong :class="tone(managedNet-baselineNet)">{{ money(managedNet-baselineNet) }}</strong></div>
      </div>
      <div class="rescued-heading"><span>管理差额较大的样本</span><small>管理后净结果 − 原价差对照</small></div>
      <div v-if="rescuedRecords.length" class="rescued-list"><article v-for="record in rescuedRecords" :key="record.id" class="rescued-item"><span class="rescued-symbol">{{ record.symbol }}</span><span class="rescued-detail">{{ record.legs }} · {{ record.closeDate }}</span><span :class="tone(record.pnl)">{{ money(record.pnl) }}</span><el-icon><Right /></el-icon><span :class="tone(record.baseline)">{{ money(record.baseline) }}</span><strong :class="tone(record.pnl-record.baseline)">{{ money(record.pnl-record.baseline) }}</strong></article></div>
      <div v-else class="rescued-empty">当前区间没有发生管理动作的已结算样本</div>
      <p class="management-note"><el-icon><InfoFilled /></el-icon>原价差对照 = 不做任何管理、持有到期的结果；对照只用于复盘，不代表真实可实现收益。</p>
    </section>

    <section class="monthly-grid">
      <article class="panel monthly-panel"><div class="section-heading"><div><span class="section-kicker">SIGNAL COHORT · {{ monthLabel }}</span><h2>本月开出的信号</h2><p>按开仓日归集 · 与上方图表按结算日口径不同 · 全部正式信号</p></div><el-icon class="heading-icon"><Calendar /></el-icon></div>
        <div class="cohort-total"><span>本月开仓 · 管理后</span><strong :class="tone(cohort.managedPnlUsd)">{{ money(cohort.managedPnlUsd) }}</strong><small>已结算 + 在途浮动</small></div>
        <div class="cohort-metrics"><div><span>原价差对照</span><strong>{{ money(cohort.rawPnlUsd) }}</strong><small>不含管理动作</small></div><div><span>已结算</span><strong :class="tone(cohort.settledPnlUsd)">{{ money(cohort.settledPnlUsd) }}</strong><small>{{ cohort.settledPriced ?? 0 }} 笔已结算</small></div><div><span>胜率 · 管理后</span><strong>{{ cohort.winRate ?? '—' }}<template v-if="cohort.winRate!==null && cohort.winRate!==undefined">%</template></strong><small>{{ cohortCounts.profit }} 胜 / {{ cohortCounts.loss }} 负</small></div><div><span>入场权利金</span><strong>{{ plainUsd(cohort.premiumUsd) }}</strong><small>{{ cohort.total ?? 0 }} 条信号</small></div></div>
        <div class="cohort-bars"><div v-for="metric in cohortBars" :key="metric.label"><span>{{ metric.label }}</span><div><i :class="metric.color" :style="{width:`${cohortCounts.total?metric.value/cohortCounts.total*100:0}%`}"/></div><strong>{{ metric.value }}</strong></div></div>
      </article>
      <article class="panel symbols-panel"><div class="section-heading"><div><span class="section-kicker">RESULT BY SYMBOL</span><h2>按标的 · 管理后净结果</h2><p>{{ range==='month'?'本月':'全部区间' }} · 已结算与在途浮动分开呈现 · 共 {{ symbolRows.length }} 个标的</p></div><el-icon class="heading-icon"><DataAnalysis /></el-icon></div>
        <div v-if="symbolSummary.length" class="symbol-list"><div v-for="item in symbolSummary" :key="item.symbol" class="symbol-row"><span class="symbol-badge">{{ item.symbol }}</span><div class="symbol-progress"><div class="symbol-values"><small>已结算 {{ money(item.settled) }} · 在途 {{ money(item.floating) }}</small><strong :class="tone(item.total)">{{ money(item.total) }}</strong></div><div class="progress-track"><i :class="tone(item.total)" :style="{width:`${symbolWidth(item.total)}%`}"/></div></div><span class="symbol-groups">{{ item.groups }} 组</span></div></div>
        <div v-else class="rescued-empty">当前区间暂无按标的数据</div>
      </article>
    </section>

    <section class="quality-grid">
      <article class="panel winloss-panel"><div class="section-heading"><div><span class="section-kicker">PROFITABLE / LOSSES</span><h2>胜负分布</h2></div></div><div class="winloss-content"><div class="winloss-donut" :style="winLossStyle"><strong>{{ stats.priced.length }}</strong><small>笔已结算</small></div><div class="winloss-legend"><div><span><i class="win-dot"/>盈利</span><strong>{{ stats.profit }} <small>{{ percent(stats.profit) }}%</small></strong></div><div><span><i class="loss-dot"/>亏损</span><strong>{{ stats.loss }} <small>{{ percent(stats.loss) }}%</small></strong></div><div><span><i class="flat-dot"/>持平</span><strong>{{ stats.flat }} <small>{{ percent(stats.flat) }}%</small></strong></div></div></div></article>
      <article class="panel range-panel"><div class="section-heading"><div><span class="section-kicker">PAYOUT RANGE</span><h2>单笔幅度范围</h2><p>已结算净盈亏 · 管理后口径</p></div></div><div class="range-values"><div><span>最大亏损</span><strong class="negative">{{ money(stats.min) }}</strong></div><div><span>平均亏损</span><strong class="negative">{{ money(stats.avgLoss) }}</strong></div><div><span>平均盈利</span><strong class="positive">{{ money(stats.avgWin) }}</strong></div><div><span>最大盈利</span><strong class="positive">{{ money(stats.max) }}</strong></div></div><div class="range-visual"><i class="range-track"/><i class="range-marker loss-marker"/><i class="range-marker avg-loss-marker"/><i class="range-marker avg-win-marker"/><i class="range-marker win-marker"/></div><small class="range-caption">极值与均值只描述当前区间的已结算样本，不构成收益预测。</small></article>
    </section>

    <section class="panel records-panel">
      <div class="records-heading"><div><span class="section-kicker">SETTLED RECORDS · {{ range==='all'?'ALL':monthLabel }}</span><h2>已结算记录</h2><p>管理后净结果缺失的记录标记为“待复核”；不计入战绩的记录单独标注</p></div><el-button plain class="export-button" :disabled="!visibleRecords.length" @click="exportCsv"><el-icon><Download /></el-icon>导出 CSV</el-button></div>
      <div class="records-toolbar"><div class="record-filters"><button v-for="filter in filters" :key="filter.key" :class="{active:selectedFilter===filter.key}" @click="selectedFilter=filter.key">{{ filter.label }} <small>{{ filter.count }}</small></button></div><el-input v-model="searchText" class="search-input" placeholder="搜索标的或结构" clearable><template #prefix><el-icon><Search /></el-icon></template></el-input></div>
      <div class="table-wrap"><table class="record-table"><thead><tr><th>标的 / 结构</th><th>到期</th><th>入场权利金</th><th>最大风险</th><th>持有日</th><th>保护成本</th><th>结果口径</th><th>管理后净结果</th><th>原价差对照</th></tr></thead><tbody v-if="pageRecords.length"><tr v-for="record in pageRecords" :key="record.id"><td><div class="record-symbol"><b>{{ record.symbol }}<em v-if="record.lots" class="lots-tag">跟 {{ record.lots }} 组</em></b><span>{{ record.legs }}</span></div></td><td>{{ record.expiry }}</td><td>{{ plainUsd(record.credit) }}</td><td>{{ plainUsd(record.risk) }}</td><td>{{ record.days ?? '—' }}</td><td>{{ record.protection ? plainUsd(record.protection) : '$0' }}</td><td><span class="basis-pill">{{ record.basis }}</span><span v-if="record.excluded" class="basis-pill excluded-pill" :title="record.exclusionReason">不计入</span></td><td :class="tone(record.pnl)"><span v-if="record.pending" class="basis-pill pending-pill">待复核</span><template v-else>{{ money(record.pnl) }}</template></td><td :class="tone(record.baseline)">{{ money(record.baseline) }}</td></tr></tbody><tbody v-else><tr><td colspan="9"><div class="table-empty"><el-icon><Document /></el-icon><strong>{{ allRecords.length ? '没有匹配的结算记录' : (scope==='adopted' ? '还没有我跟了的已结算记录' : '当前区间还没有已结算记录') }}</strong><span>{{ allRecords.length ? '切换筛选条件或清空搜索词试试。' : '在 OSM 记录跟单后，结算的记录会出现在这里。' }}</span><el-button v-if="allRecords.length" link type="primary" @click="resetFilters">重置筛选</el-button></div></td></tr></tbody></table></div>
      <div class="records-footer"><span>{{ pageRecords.length }} / {{ visibleRecords.length }} 条记录<el-button v-if="pageRecords.length<visibleRecords.length" link type="primary" class="more-button" @click="pageSize+=PAGE">显示更多</el-button></span><span>数据来自 OSM 同步 · 批次 {{ summary?.syncId ?? '—' }} · 结算日倒序</span></div>
    </section>
    </template>
    </div>

    <section class="lb-gray"><div class="lb-wrap">
    <section class="disclaimer"><el-icon><Warning /></el-icon><span>战绩为 OSM 正式信号按发报中间价记账、按管理规则了结的研究口径结果，不是任何会员的真实成交。历史表现不代表未来结果。</span></section>
    </div></section>
  </div>
</template>

<script setup>
import DataViewTag from '@/components/option/DataViewTag.vue'
import DelayedEmpty from '@/components/option/DelayedEmpty.vue'
import { useDataView } from '@/utils/accessStore'
import { computed, onMounted, ref, watch } from 'vue'
import { Calendar, DataAnalysis, Document, Download, InfoFilled, Loading, Right, Search, Share, Warning } from '@element-plus/icons-vue'
import { getRecordKind, getRecordSummary } from '@/api/option/record'
import { axisUsd, money, niceMax, num, plainUsd, summarize, toBuckets, toRecord, tone } from '@/utils/recordData'

// 盘后版：标题旁标签 / 尚未放出空状态（W4）
const dataView = useDataView('record')

const PAGE = 20
const scope = ref('all')
const granularity = ref('day')
const chartType = ref('bar')
const range = ref('month')
const showFloating = ref(true)
const selectedFilter = ref('all')
const searchText = ref('')
const pageSize = ref(PAGE)
const granularities = [{ key: 'day', label: '日' }, { key: 'week', label: '周' }, { key: 'month', label: '月' }]
const chartTypes = [{ key: 'bar', label: '柱状' }, { key: 'line', label: '折线' }, { key: 'cumulative', label: '累计' }]

const loading = ref(false)
const error = ref('')
const summary = ref(null)
const statItems = ref([])
const dayItems = ref([])
const bucketItems = ref([])
const tradeItems = ref([])
const symbolRows = ref([])
const ready = computed(() => !!summary.value)

// ---------------------------------------------------------------- 头部
const marketDayLabel = computed(() => (summary.value?.marketDay || '').replaceAll('-', '/') || '—')
const monthLabel = computed(() => (summary.value?.marketDay || '').slice(0, 7).replace('-', '/') || '—')
const syncBadge = computed(() => {
  if (!summary.value) return loading.value ? '正在加载' : '暂无同步数据'
  const t = String(summary.value.syncTime || '').match(/\d{4}-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/)
  return `交易日 ${marketDayLabel.value}${t ? ` · 同步于 ${t[1]}/${t[2]} ${t[3]}` : ''}`
})
const shareLabel = computed(() => (range.value === 'month' ? '分享本月' : '分享全部'))

// ---------------------------------------------------------------- 图表
const dayRows = computed(() => toBuckets(dayItems.value, 'day'))
const chartData = computed(() => (granularity.value === 'day' ? dayRows.value : toBuckets(bucketItems.value, granularity.value)))
const hasChartData = computed(() => chartData.value.some(item => item.settled !== null || (floatingOn.value && item.floating !== null)))
const floatingOn = computed(() => showFloating.value && granularity.value === 'day' && chartType.value !== 'cumulative')
const axisMax = computed(() => niceMax(chartType.value === 'cumulative'
  ? chartData.value.map(item => item.cumulative)
  : chartData.value.flatMap(item => [item.settled, floatingOn.value ? item.floating : null])))
const axisLabels = computed(() => [axisMax.value, axisMax.value / 2, 0, -axisMax.value / 2, -axisMax.value].map(axisUsd))
const trendPoints = computed(() => scalePoints(chartData.value.map(item => (chartType.value === 'cumulative' ? item.cumulative : item.settled ?? 0))))
const floatingPoints = computed(() => scalePoints(chartData.value.map(item => item.floating ?? 0)))
const trendPolyline = computed(() => trendPoints.value.map(point => `${point.x},${point.y}`).join(' '))
const floatingPolyline = computed(() => floatingPoints.value.map(point => `${point.x},${point.y}`).join(' '))
const trendArea = computed(() => (trendPoints.value.length ? `M ${trendPoints.value[0].x},105 L ${trendPolyline.value} L ${trendPoints.value.at(-1).x},105 Z` : ''))

// ---------------------------------------------------------------- 汇总条（按结算日）
const settledTotal = computed(() => dayRows.value.reduce((sum, day) => sum + (day.settled || 0), 0))
const maxGain = computed(() => { const gains = dayRows.value.map(day => day.settled).filter(v => v !== null && v > 0); return gains.length ? Math.max(...gains) : null })
const maxLoss = computed(() => { const losses = dayRows.value.map(day => day.settled).filter(v => v !== null && v < 0); return losses.length ? Math.min(...losses) : null })
const settledDays = computed(() => dayRows.value.filter(day => day.settled !== null).length)
const worstLossShare = computed(() => {
  const losses = dayRows.value.map(day => day.settled || 0).filter(value => value < 0).sort((a, b) => a - b)
  if (!losses.length) return '—'
  const total = Math.abs(losses.reduce((sum, value) => sum + value, 0))
  return Math.round(Math.abs(losses.slice(0, 5).reduce((sum, value) => sum + value, 0)) / total * 100)
})

// ---------------------------------------------------------------- 明细
const allRecords = computed(() => tradeItems.value.map(toRecord))
const stats = computed(() => summarize(allRecords.value))
const managedRecords = computed(() => stats.value.priced.filter(r => r.baseline !== null && (r.protection > 0 || Math.abs(r.pnl - r.baseline) >= 0.5)))
const managedNet = computed(() => managedRecords.value.reduce((sum, r) => sum + r.pnl, 0))
const baselineNet = computed(() => managedRecords.value.reduce((sum, r) => sum + r.baseline, 0))
const rescuedRecords = computed(() => [...managedRecords.value].sort((a, b) => (b.pnl - b.baseline) - (a.pnl - a.baseline)).slice(0, 3))
const winLossStyle = computed(() => { const n = stats.value.priced.length || 1; const win = stats.value.profit / n * 100; const loss = win + stats.value.loss / n * 100; return { background: `conic-gradient(#46a97b 0 ${win}%,#d86e69 ${win}% ${loss}%,#cbd5df ${loss}% 100%)` } })
const filters = computed(() => [
  { key: 'all', label: '全部记录', count: allRecords.value.length },
  { key: 'profit', label: '盈利', count: allRecords.value.filter(r => r.pnl > 0).length },
  { key: 'loss', label: '亏损', count: allRecords.value.filter(r => r.pnl < 0).length },
  { key: 'pending', label: '待复核', count: allRecords.value.filter(r => r.pending).length }
].filter(f => f.key !== 'pending' || f.count))
const visibleRecords = computed(() => {
  const query = searchText.value.trim().toLowerCase()
  const f = selectedFilter.value
  return allRecords.value.filter(r => (f === 'all' || (f === 'profit' ? r.pnl > 0 : f === 'loss' ? r.pnl < 0 : r.pending))
    && (!query || `${r.symbol} ${r.company} ${r.legs}`.toLowerCase().includes(query)))
})
const pageRecords = computed(() => visibleRecords.value.slice(0, pageSize.value))

// ---------------------------------------------------------------- 本月开出的信号 / 按标的
const cohort = computed(() => statItems.value.find(item => item.id === 'month')?.tracking || {})
const cohortCounts = computed(() => {
  const total = num(cohort.value.total) ?? 0
  const priced = num(cohort.value.priced) ?? 0
  const profit = num(cohort.value.winners) ?? 0
  return { total, profit, loss: Math.max(0, priced - profit), open: Math.max(0, total - priced) }
})
const cohortBars = computed(() => [{ label: '盈利', value: cohortCounts.value.profit, color: 'green' }, { label: '亏损', value: cohortCounts.value.loss, color: 'red' }, { label: '未定价', value: cohortCounts.value.open, color: 'gray' }])
const symbolSummary = computed(() => [...symbolRows.value]
  .map(item => ({ symbol: item.symbol, settled: num(item.settledPnlUsd) ?? 0, floating: num(item.livePnlUsd) ?? 0, total: num(item.pnlUsd) ?? 0, groups: (num(item.settledGroups) ?? 0) + (num(item.liveGroups) ?? 0) }))
  .sort((a, b) => Math.abs(b.total) - Math.abs(a.total)).slice(0, 6).sort((a, b) => b.total - a.total))
const symbolMax = computed(() => Math.max(1, ...symbolSummary.value.map(item => Math.abs(item.total))))

function symbolWidth(value) { return Math.max(8, Math.min(100, Math.abs(value) / symbolMax.value * 100)) }
function scalePoints(values) { if (!values.length) return []; const max = axisMax.value; return values.map((value, index) => ({ x: values.length === 1 ? 450 : 12 + index * 876 / (values.length - 1), y: 105 - value / max * 83 })) }
function percent(value) { return stats.value.priced.length ? Math.round(value / stats.value.priced.length * 100) : 0 }
function barStyle(value) { const height = Math.max(2, Math.min(48, Math.abs(value) / axisMax.value * 48)); return { height: `${height}%`, top: value < 0 ? '50%' : `calc(50% - ${height}%)` } }
function barTitle(item) { return `${item.key} · 结算 ${money(item.settled)}（${item.count} 笔）${item.floating !== null ? ` · 浮动 ${money(item.floating)}` : ''}` }
function showLabel(index) { const n = chartData.value.length; const step = Math.ceil(n / 14); return n <= 14 || index % step === 0 || index === n - 1 }
function resetFilters() { selectedFilter.value = 'all'; searchText.value = '' }
function exportCsv() {
  const rows = [['标的', '结构', '到期', '结算日', '入场权利金', '最大风险', '持有日', '保护成本', '结果口径', '管理后净结果', '原价差对照', '不计入战绩'], ...visibleRecords.value.map(r => [r.symbol, r.legs, r.expiryDate || r.expiry, r.day, r.credit ?? '', r.risk ?? '', r.days ?? '', r.protection, r.basis, r.pending ? '待复核' : r.pnl, r.baseline ?? '', r.excluded ? '是' : ''])]
  const csv = `\uFEFF${rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a'); link.href = url; link.download = `scorecard-${range.value}-${summary.value?.marketDay || ''}.csv`; link.click(); URL.revokeObjectURL(url)
}
async function shareSummary() {
  const label = range.value === 'month' ? `${monthLabel.value} 本月` : '全部区间'
  const text = `OSM 战绩 · ${label}：结算合计 ${money(settledTotal.value)} · ${stats.value.priced.length} 笔已结算 · 胜率 ${percent(stats.value.profit)}%（管理后口径）`
  if (navigator.clipboard) await navigator.clipboard.writeText(text)
}

// ---------------------------------------------------------------- 数据加载
async function loadDaily() {
  const base = { range: range.value, scope: scope.value }
  const [days, buckets] = await Promise.all([
    getRecordKind('daily', { ...base, granularity: 'day' }),
    granularity.value === 'day' ? null : getRecordKind('daily', { ...base, granularity: granularity.value })
  ])
  dayItems.value = days?.items || []
  bucketItems.value = buckets?.items || []
}
async function loadPeriod() {
  const [trades, symbols] = await Promise.all([
    getRecordKind('trade', { range: range.value, scope: scope.value }),
    getRecordKind('symbol', { range: range.value }),
    loadDaily()
  ])
  tradeItems.value = trades?.items || []
  symbolRows.value = symbols?.items || []
  pageSize.value = PAGE
}
async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [head, stat] = await Promise.all([getRecordSummary(), getRecordKind('stat')])
    summary.value = head
    statItems.value = stat?.items || []
    await loadPeriod()
  } catch (e) {
    summary.value = null
    const message = e?.message || '加载失败'
    error.value = /暂无数据/.test(message) ? '' : message
  } finally {
    loading.value = false
  }
}
async function reload(task) {
  if (!ready.value) return
  loading.value = true
  try { await task() } catch (e) { error.value = e?.message || '加载失败' } finally { loading.value = false }
}
watch([range, scope], () => reload(loadPeriod))
watch(granularity, () => reload(loadDaily))
watch([selectedFilter, searchText], () => { pageSize.value = PAGE })
onMounted(loadAll)
</script>

<style scoped>
.scorecard-page{color:#203754}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:2px 0 14px;gap:15px}.eyebrow{display:flex;align-items:center;gap:7px;color:#4a86c4;font-size:9px;letter-spacing:.8px;font-weight:700}.eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#55b18b;box-shadow:0 0 0 4px #55b18b20}.page-heading h1{margin:6px 0 4px;color:#17365e;font-size:25px;line-height:1.2}.page-heading p{margin:0;color:#8997a9;font-size:10px}.heading-meta{display:flex;align-items:center;gap:10px;color:#8e9eb1;font-size:9px}.share-button,.export-button{height:29px;border-radius:7px;font-size:9px}.panel{background:#fff;border:1px solid #e6edf5;border-radius:12px;min-width:0}.chart-panel{padding:15px 16px 10px}.chart-panel-top,.section-heading,.records-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.section-kicker{color:#8da6c0;font-size:8px;font-weight:700;letter-spacing:.9px}.chart-panel-top h2,.section-heading h2,.records-heading h2{margin:4px 0 3px;color:#203957;font-size:13px}.chart-panel-top p,.section-heading p,.records-heading p{margin:0;color:#9ba8b7;font-size:8px}.demo-tag{display:flex;align-items:center;gap:5px;padding:5px 7px;border:1px solid #e6eff8;border-radius:5px;color:#7798b8;font-size:7px;letter-spacing:.5px}.demo-tag i{width:5px;height:5px;border-radius:50%;background:#62a2d8}.control-rows{margin-top:12px;padding:7px 9px;border:1px solid #eef2f6;border-radius:8px;background:#fbfcfe}.control-row{display:flex;align-items:center;gap:7px;min-height:29px}.control-row+.control-row{margin-top:4px}.control-label{color:#92a0b1;font-size:8px;white-space:nowrap}.segmented{display:flex;align-items:center;gap:2px;padding:2px;border:1px solid #e9eef4;border-radius:6px;background:#fff}.segmented button{padding:5px 8px;border:0;border-radius:4px;background:transparent;color:#8293a7;font-size:8px;white-space:nowrap;cursor:pointer}.segmented button.active{background:#eaf3fd;color:#3477b9;font-weight:700}.segmented.compact button{padding:5px 7px}.control-hint{margin-left:4px;color:#a5b1bf;font-size:7px}.chart-type-label,.range-label{margin-left:7px}.floating-switch{margin-left:auto;--el-switch-on-color:#4a8bc8}.floating-switch-label{color:#8293a7;font-size:7px;white-space:nowrap}.floating-switch :deep(.el-switch__label){font-size:7px;color:#8293a7}.chart-legend{display:flex;align-items:center;gap:13px;margin:11px 4px 3px;color:#8798ab;font-size:8px}.chart-legend span{display:flex;align-items:center;gap:5px}.chart-legend i{width:7px;height:7px;border-radius:2px}.legend-settled{background:#5796d1}.legend-floating{background:#edb15e}.chart-legend small{margin-left:auto;color:#a0adba;font-size:7px}.performance-chart{height:178px;display:grid;grid-template-columns:57px minmax(0,1fr);gap:8px}.chart-axis{display:flex;flex-direction:column;justify-content:space-between;padding:8px 0 20px;text-align:right;color:#a0adba;font-size:7px}.chart-plot{position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:8px 0 20px}.grid-line{height:1px;background:#edf1f5}.grid-line.zero{background:#cbd6e1}.zero-axis{position:absolute;left:0;right:0;top:50%;height:1px;background:#cbd6e1;pointer-events:none}.bar-groups{position:absolute;inset:7px 0 20px;display:flex;align-items:stretch;justify-content:space-around}.bar-group{position:relative;flex:1;min-width:0;display:flex;align-items:flex-end;justify-content:center}.bar-group>span{position:absolute;bottom:-15px;color:#9aa8b6;font-size:7px;white-space:nowrap}.bars{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:2px}.settled-bar,.floating-bar{position:absolute;width:min(13px,40%);min-height:2px;border-radius:3px 3px 0 0;background:#5796d1}.settled-bar.loss{border-radius:0 0 3px 3px;background:#da7771}.floating-bar.loss{border-radius:0 0 3px 3px;background:#de8a78aa}.floating-bar{left:calc(50% + 3px);background:#edb15eaa}.floating-bar.loss{background:#de8a78aa}.line-chart{position:absolute;inset:0 0 20px;width:100%;height:calc(100% - 20px);overflow:visible}.line-labels{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-around;color:#9aa8b6;font-size:7px}.chart-footnote{padding-top:7px;border-top:1px solid #f0f3f6;color:#9aa8b5;font-size:7px;line-height:1.5}.summary-strip{display:grid;grid-template-columns:1.25fr repeat(5,1fr);margin:10px 0 12px;padding:12px 13px}.summary-total,.summary-cell{display:flex;flex-direction:column;justify-content:center;gap:5px;padding:0 10px;border-right:1px solid #edf1f5}.summary-total{padding-left:2px}.summary-cell:last-child{border:0}.summary-total span,.summary-cell span{color:#8999ac;font-size:8px;white-space:nowrap}.summary-total span small{color:#abb6c2}.summary-total strong{font-size:17px}.summary-cell strong{color:#48627f;font-size:12px;white-space:nowrap}.summary-cell strong small{color:#a0adba;font-size:8px;font-weight:400}.positive{color:#259366!important}.negative{color:#cf6864!important}.neutral{color:#7488a0!important}.section-heading{align-items:flex-start}.section-heading h2 small{color:#91a1b3;font-size:9px;font-weight:500}.section-heading> .el-tag{font-size:8px}.management-panel{padding:14px 15px;margin-bottom:12px}.management-summary{display:grid;grid-template-columns:repeat(4,1fr);margin:13px 0 12px;padding:10px 0;border:1px solid #edf2f7;border-radius:8px;background:#fbfcfe}.management-summary>div{display:flex;flex-direction:column;gap:5px;padding:0 12px;border-right:1px solid #e9eef4}.management-summary>div:last-child{border:0}.management-summary span{color:#8f9fb1;font-size:8px}.management-summary strong{color:#526b87;font-size:15px}.management-summary .delta-cell strong{color:#2d8c67}.rescued-heading{display:flex;align-items:center;justify-content:space-between;color:#6c829b;font-size:8px}.rescued-heading small{color:#a6b1bf;font-size:7px}.rescued-list{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:7px}.rescued-item{display:flex;align-items:center;gap:6px;min-width:0;padding:8px;border:1px solid #edf1f5;border-radius:7px;background:#fff;font-size:8px}.rescued-symbol{color:#46698e;font-weight:700}.rescued-detail{flex:1;overflow:hidden;color:#99a7b7;text-overflow:ellipsis;white-space:nowrap;font-size:7px}.rescued-item strong{padding-left:5px;border-left:1px solid #e9eef4}.management-note{display:flex;align-items:center;gap:5px;margin:9px 0 0;color:#9ba9b7;font-size:7px}.management-note .el-icon{color:#94aac0}.monthly-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:12px}.monthly-panel,.symbols-panel{padding:13px 14px}.heading-icon{color:#82a1c3;font-size:16px}.cohort-total{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;margin:11px 0 9px;padding:9px 10px;border-radius:7px;background:#f5f9fd}.cohort-total span{color:#8497ac;font-size:8px}.cohort-total strong{font-size:14px}.cohort-total small{color:#a1afbd;font-size:7px}.cohort-metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.cohort-metrics>div{display:flex;flex-direction:column;gap:4px;padding:8px;border:1px solid #eef2f6;border-radius:7px}.cohort-metrics span{color:#91a1b2;font-size:7px}.cohort-metrics strong{color:#4e6885;font-size:12px}.cohort-metrics small{color:#a4b0bd;font-size:7px}.cohort-bars{display:flex;flex-direction:column;gap:6px;margin-top:10px}.cohort-bars>div{display:grid;grid-template-columns:28px 1fr 18px;align-items:center;gap:7px;color:#929fb0;font-size:7px}.cohort-bars>div>div{height:5px;overflow:hidden;border-radius:5px;background:#eff2f5}.cohort-bars i{display:block;height:100%;border-radius:inherit}.cohort-bars i.green{background:#54a980}.cohort-bars i.red{background:#d77470}.cohort-bars i.gray{background:#bac5d0}.cohort-bars strong{text-align:right;color:#71869f;font-weight:600}.symbol-list{display:flex;flex-direction:column;gap:7px;margin-top:12px}.symbol-row{display:flex;align-items:center;gap:8px}.symbol-badge{width:47px;overflow:hidden;color:#4d6d90;font-size:8px;font-weight:700;text-overflow:ellipsis}.symbol-progress{flex:1;min-width:0}.symbol-values{display:flex;align-items:center;justify-content:space-between;gap:8px}.symbol-values small{overflow:hidden;color:#98a6b5;font-size:7px;text-overflow:ellipsis;white-space:nowrap}.symbol-values strong{font-size:8px}.progress-track{height:4px;margin-top:4px;overflow:hidden;border-radius:4px;background:#f0f3f7}.progress-track i{display:block;height:100%;border-radius:4px;background:#69a787}.progress-track i.negative{background:#d77b73}.symbol-groups{width:35px;text-align:right;color:#9aa8b6;font-size:7px}.quality-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:11px;margin-bottom:12px}.winloss-panel,.range-panel{padding:13px 14px}.winloss-content{display:flex;align-items:center;justify-content:center;gap:20px;min-height:140px}.winloss-donut{width:94px;height:94px;position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;border-radius:50%;color:#fff}.winloss-donut:before{position:absolute;inset:12px;border-radius:50%;background:#fff;content:''}.winloss-donut strong,.winloss-donut small{z-index:1;color:#4f6782}.winloss-donut strong{font-size:17px}.winloss-donut small{font-size:7px}.winloss-legend{display:flex;flex-direction:column;gap:9px}.winloss-legend>div{display:flex;justify-content:space-between;gap:20px;color:#8596a9;font-size:8px}.winloss-legend>div span{display:flex;align-items:center;gap:5px}.winloss-legend i{width:6px;height:6px;border-radius:50%}.win-dot{background:#4caf7f}.loss-dot{background:#d8736e}.flat-dot{background:#bcc7d2}.winloss-legend strong{color:#536c87}.winloss-legend small{color:#9eabba;font-weight:400}.range-values{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:19px 2px 12px}.range-values>div{display:flex;flex-direction:column;gap:6px}.range-values span{color:#9aa8b7;font-size:7px}.range-values strong{font-size:10px}.range-visual{position:relative;height:11px;margin:0 4px}.range-track{position:absolute;left:0;right:0;top:5px;height:2px;background:linear-gradient(90deg,#d8736e,#d7dfe7 50%,#55a982)}.range-marker{position:absolute;top:2px;width:8px;height:8px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px currentColor}.loss-marker{left:2%;color:#d8736e;background:#d8736e}.avg-loss-marker{left:34%;color:#d8736e;background:#d8736e}.avg-win-marker{left:66%;color:#55a982;background:#55a982}.win-marker{right:2%;color:#55a982;background:#55a982}.range-caption{display:block;margin-top:13px;color:#a1adba;font-size:7px}.records-panel{overflow:hidden}.records-heading{padding:14px 15px 10px}.records-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 15px 9px}.record-filters{display:flex;gap:3px}.record-filters button{padding:6px 8px;border:0;border-radius:6px;background:transparent;color:#8294a8;font-size:8px;cursor:pointer}.record-filters button.active{background:#edf5ff;color:#3478b9;font-weight:700}.record-filters small{margin-left:3px;color:#9aabba}.search-input{width:180px}.search-input :deep(.el-input__wrapper){height:28px;box-shadow:0 0 0 1px #e9eef4 inset;border-radius:6px}.search-input :deep(.el-input__inner){font-size:8px}.table-wrap{overflow-x:auto;border-top:1px solid #edf1f5}.record-table{width:100%;min-width:840px;border-collapse:collapse;text-align:left}.record-table th{height:34px;padding:0 9px;background:#f8fafd;color:#8797a9;font-size:7px;font-weight:650;white-space:nowrap}.record-table td{height:44px;padding:4px 9px;border-top:1px solid #f0f3f6;color:#70849a;font-size:8px;white-space:nowrap}.record-table th:first-child,.record-table td:first-child{padding-left:14px}.record-symbol{display:flex;flex-direction:column;gap:3px}.record-symbol b{color:#456483;font-size:8px}.record-symbol span{color:#9caab8;font-size:7px}.basis-pill{padding:4px 6px;border-radius:5px;background:#f0f5fa;color:#6f89a2;font-size:7px}.table-empty{min-height:155px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;color:#9ba8b8;font-size:8px;white-space:normal}.table-empty .el-icon{font-size:20px;color:#84a5c9}.table-empty strong{color:#637d99;font-size:10px}.table-empty .el-button{font-size:8px}.records-footer{display:flex;justify-content:space-between;gap:10px;padding:9px 14px;border-top:1px solid #edf1f5;color:#9caab7;font-size:7px}.disclaimer{display:flex;align-items:center;gap:7px;margin-top:11px;padding:9px 11px;border:1px solid #f1e7d5;border-radius:8px;background:#fffaf2;color:#98815c;font-size:8px;line-height:1.5}.disclaimer .el-icon{flex:none;color:#d39b4b}
@media(max-width:950px){.summary-strip{grid-template-columns:repeat(3,1fr);row-gap:12px}.summary-cell:nth-child(4){border-right:0}.monthly-grid{grid-template-columns:1fr}.quality-grid{grid-template-columns:1fr 1fr}.control-hint{display:none}}
@media(max-width:700px){.page-heading{align-items:flex-start;flex-direction:column;gap:9px}.heading-meta{width:100%;justify-content:space-between}.chart-panel{padding:12px}.control-row{flex-wrap:wrap}.control-row+.control-row{margin-top:7px}.control-hint{display:none}.chart-type-label{margin-left:auto}.range-label{margin-left:0}.floating-switch{margin:3px 0 0 auto}.performance-chart{height:160px;grid-template-columns:44px minmax(0,1fr)}.chart-axis{font-size:6px}.chart-legend{gap:8px;font-size:7px}.summary-strip{grid-template-columns:repeat(2,1fr);padding:10px}.summary-total,.summary-cell{min-height:44px;padding:0 8px}.summary-strip>div:nth-child(odd){border-right:0}.summary-total strong{font-size:15px}.rescued-list{grid-template-columns:1fr}.management-summary{grid-template-columns:repeat(2,1fr);row-gap:12px}.management-summary>div:nth-child(2){border-right:0}.quality-grid{grid-template-columns:1fr}.records-toolbar{align-items:flex-start;flex-direction:column;padding:0 11px 9px}.record-filters{max-width:100%;overflow:auto}.search-input{width:100%}.records-heading{padding:12px}.records-footer{flex-direction:column}.disclaimer{align-items:flex-start}}
@media(max-width:390px){.segmented button{padding:5px 6px;font-size:7px}.segmented.compact button{padding:5px}.floating-switch :deep(.el-switch__label){font-size:6px}.summary-cell span{font-size:7px}.summary-cell strong{font-size:11px}.chart-footnote{font-size:6px}}
.status-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:260px;padding:30px 20px;text-align:center}.status-icon{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#eef5fc;color:#5b91c7;font-size:18px}.status-panel strong{color:#3d5a7a;font-size:13px}.status-panel p{margin:0;color:#8e9daf;font-size:9px}.status-panel button{margin-top:6px;padding:6px 12px;border:1px solid #dfe8f2;border-radius:7px;background:#fff;color:#3c78b5;font-size:9px;cursor:pointer}.deploy-tip{display:flex;align-items:center;gap:6px;max-width:420px;margin-top:4px;padding:7px 10px;border-radius:7px;background:#f4f8fc;color:#7d93aa;font-size:8px;line-height:1.5;text-align:left}.deploy-tip i{flex:none;width:5px;height:5px;border-radius:50%;background:#7ea8d3}.spinning{animation:sc-spin 1s linear infinite}@keyframes sc-spin{to{transform:rotate(360deg)}}.is-loading{opacity:.6;transition:opacity .15s}.chart-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#a0adba;font-size:9px}.rescued-empty{margin-top:10px;padding:14px;border:1px dashed #e6edf5;border-radius:7px;color:#a0adba;font-size:8px;text-align:center}.lots-tag{margin-left:5px;padding:1px 4px;border-radius:4px;background:#eaf6f0;color:#3f9670;font-size:7px;font-style:normal;font-weight:600}.excluded-pill{margin-left:4px;background:#f6f1ea;color:#a3814f}.pending-pill{background:#fdf4e6;color:#c58a3c}.more-button{margin-left:8px;font-size:7px}
</style>

<style>
html:has(.scorecard-page){overflow-x:clip}
</style>

<!-- 长桥风格覆盖层（docs/longbridge-ui.md） -->
<style scoped>
.scorecard-page{
  --lb-text:#070a13;--lb-text-2:#4b5563;--lb-text-3:#6b7280;--lb-text-4:#a8aaad;
  --lb-accent:#00b8b8;--lb-accent-bright:#00f0c4;--lb-accent-soft:rgba(0,184,184,.1);
  --lb-bg:#f9fafb;--lb-bg-2:#f1f3f4;--lb-border:#e5e7eb;
  --lb-up:#e8467c;--lb-up-soft:rgba(232,70,124,.1);--lb-down:#00b8b8;--lb-warn:#f59e0b;--lb-warn-soft:rgba(245,158,11,.12);
  --pad-top:30px;--pad-bottom:42px;
  --ink:var(--lb-text);--muted:var(--lb-text-3);--line:var(--lb-border);
  margin:calc(var(--pad-top)*-1) calc(50% - 50vw) calc(var(--pad-bottom)*-1);
  background:var(--lb-bg-2);color:var(--lb-text);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue","Microsoft YaHei",sans-serif;
}
.lb-wrap{max-width:1248px;margin:0 auto;padding:0 24px}

/* ---------- Hero ---------- */
.lb-hero{position:relative;overflow:hidden;padding:56px 0 120px;color:#fff;
  background:radial-gradient(900px 420px at 85% -10%,rgba(0,240,196,.22),transparent 60%),radial-gradient(700px 380px at 0% 120%,rgba(0,184,184,.18),transparent 60%),linear-gradient(180deg,#05070d,#0b1220)}
.page-heading{align-items:flex-end;gap:24px;margin:0}
.eyebrow{display:inline-flex;gap:8px;padding:6px 14px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.78);font-size:12px;font-weight:600;letter-spacing:1.6px}
.eyebrow-dot{background:var(--lb-accent-bright);box-shadow:0 0 0 4px rgba(0,240,196,.18)}
.page-heading h1{display:flex;align-items:center;gap:12px;margin:18px 0 10px;color:#fff;font-size:48px;font-weight:700;line-height:1.1;letter-spacing:-1px}
.page-heading p{color:rgba(255,255,255,.62);font-size:16px}
.heading-meta{gap:12px;color:rgba(255,255,255,.7);font-size:13px}
.heading-meta>span{display:inline-flex;align-items:center;height:36px;padding:0 16px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.08);backdrop-filter:blur(12px);white-space:nowrap}
.share-button{height:36px;padding:0 18px;border:0;border-radius:999px;background:#fff;color:var(--lb-text);font-size:13px;font-weight:600}
.share-button:hover,.share-button:focus{background:var(--lb-accent-bright);color:var(--lb-text)}
.share-button.is-disabled{background:rgba(255,255,255,.2);color:rgba(255,255,255,.5)}

/* ---------- 正文（上浮叠在 Hero 上） ---------- */
.lb-body{position:relative;margin-top:-84px;padding-bottom:24px}
.panel{border:0;border-radius:20px;background:#fff;box-shadow:0 1px 2px rgba(7,10,19,.04),0 12px 32px rgba(7,10,19,.06)}
.positive{color:var(--lb-up)!important}
.negative{color:var(--lb-down)!important}
.neutral{color:var(--lb-text-3)!important}
.section-kicker{color:var(--lb-text-4);font-size:12px;font-weight:600;letter-spacing:1.6px}
.chart-panel-top h2,.section-heading h2,.records-heading h2{margin:6px 0 6px;color:var(--lb-text);font-size:24px;font-weight:700;letter-spacing:-.3px}
.section-heading h2 small{color:var(--lb-text-3);font-size:15px;font-weight:500}
.chart-panel-top p,.section-heading p,.records-heading p{color:var(--lb-text-3);font-size:14px;line-height:1.5}
.heading-icon{color:var(--lb-text-3);font-size:22px}
.section-heading>.el-tag{height:28px;padding:0 12px;border:0;border-radius:999px;background:var(--lb-warn-soft);color:#b45309;font-size:12px;font-weight:600}

/* 图表面板 */
.chart-panel{padding:28px 28px 20px}
.demo-tag{gap:6px;padding:6px 12px;border:0;border-radius:999px;background:var(--lb-bg-2);color:var(--lb-text-2);font-size:12px;letter-spacing:.3px}
.demo-tag i{width:6px;height:6px;background:var(--lb-accent)}
.control-rows{margin-top:20px;padding:14px 16px;border:0;border-radius:16px;background:var(--lb-bg)}
.control-row{gap:10px;min-height:40px;flex-wrap:wrap}
.control-row+.control-row{margin-top:8px}
.control-label{color:var(--lb-text-3);font-size:13px}
.segmented{gap:2px;padding:3px;border:0;border-radius:999px;background:var(--lb-bg-2)}
.segmented button,.segmented.compact button{height:32px;padding:0 14px;border-radius:999px;color:var(--lb-text-2);font-size:13px;font-weight:500;transition:background .15s,color .15s}
.segmented button:hover{background:rgba(7,10,19,.05);color:var(--lb-text)}
.segmented button.active{background:var(--lb-text);color:#fff;font-weight:600}
.control-hint{color:var(--lb-text-4);font-size:12px}
.chart-type-label,.range-label{margin-left:14px}
.floating-switch{--el-switch-on-color:var(--lb-text)}
.floating-switch-label,.floating-switch :deep(.el-switch__label){color:var(--lb-text-2);font-size:13px}
.chart-legend{gap:18px;margin:20px 4px 8px;color:var(--lb-text-2);font-size:13px}
.chart-legend i{width:10px;height:10px;border-radius:3px}
.legend-settled{background:var(--lb-text)}
.legend-floating{background:var(--lb-warn)}
.chart-legend small{color:var(--lb-text-4);font-size:12px}
.performance-chart{height:280px;grid-template-columns:64px minmax(0,1fr);gap:10px}
.chart-axis{color:var(--lb-text-4);font-size:12px;font-variant-numeric:tabular-nums}
.grid-line{background:var(--lb-bg-2)}
.grid-line.zero,.zero-axis{background:#d1d5db}
.bar-group>span,.line-labels{color:var(--lb-text-4);font-size:12px}
.bar-group>span{bottom:-18px}
.settled-bar{width:min(16px,42%);border-radius:4px 4px 0 0;background:var(--lb-up)}
.settled-bar.loss{border-radius:0 0 4px 4px;background:var(--lb-down)}
.floating-bar,.floating-bar.loss{background:rgba(245,158,11,.45)}
.line-chart polyline:first-of-type{stroke:var(--lb-text)}
.line-chart polyline[stroke-dasharray]{stroke:var(--lb-warn)}
.line-chart stop{stop-color:var(--lb-accent)}
.chart-empty{color:var(--lb-text-4);font-size:14px}
.chart-footnote{margin-top:8px;padding-top:14px;border-color:var(--lb-border);color:var(--lb-text-4);font-size:12px;line-height:1.6}

/* 汇总条：黑底 */
.summary-strip{margin:20px 0;padding:24px 8px;background:var(--lb-text);box-shadow:0 12px 32px rgba(7,10,19,.12)}
.summary-total,.summary-cell{gap:10px;padding:0 20px;border-color:rgba(255,255,255,.1)}
.summary-total span,.summary-cell span{color:rgba(255,255,255,.55);font-size:13px}
.summary-total span small{color:rgba(255,255,255,.35)}
.summary-total strong{color:#fff;font-size:32px;font-weight:700;letter-spacing:-.5px;font-variant-numeric:tabular-nums}
.summary-cell strong{color:#fff;font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}
.summary-cell strong small{color:rgba(255,255,255,.4);font-size:14px}
.summary-strip .positive{color:#ff7aa5!important}
.summary-strip .negative{color:var(--lb-accent-bright)!important}

/* 逆风处置对照 */
.management-panel{margin-bottom:20px;padding:28px}
.management-summary{margin:20px 0;padding:20px 0;border:0;border-radius:16px;background:var(--lb-bg)}
.management-summary>div{gap:8px;padding:0 20px;border-color:var(--lb-border)}
.management-summary span{color:var(--lb-text-3);font-size:13px}
.management-summary strong{color:var(--lb-text);font-size:26px;font-weight:700;font-variant-numeric:tabular-nums}
.rescued-heading{color:var(--lb-text);font-size:15px;font-weight:600}
.rescued-heading small{color:var(--lb-text-4);font-size:12px;font-weight:400}
.rescued-list{gap:12px;margin-top:12px}
.rescued-item{gap:8px;padding:14px 16px;border:1px solid var(--lb-border);border-radius:14px;font-size:13px;transition:border-color .2s,box-shadow .2s}
.rescued-item:hover{border-color:#d1d5db;box-shadow:0 8px 20px rgba(7,10,19,.06)}
.rescued-symbol{color:var(--lb-text);font-size:15px}
.rescued-detail{color:var(--lb-text-3);font-size:12px}
.rescued-item .el-icon{color:var(--lb-text-4)}
.rescued-item strong{padding:3px 10px;border:0;border-radius:999px;background:var(--lb-bg-2)}
.rescued-empty{margin-top:12px;padding:24px;border:1px dashed var(--lb-border);border-radius:14px;color:var(--lb-text-4);font-size:14px}
.management-note{gap:6px;margin-top:16px;color:var(--lb-text-3);font-size:13px}
.management-note .el-icon{color:var(--lb-text-4)}

/* 本月信号 / 按标的 */
.monthly-grid,.quality-grid{gap:20px;margin-bottom:20px}
.monthly-panel,.symbols-panel,.winloss-panel,.range-panel{padding:28px}
.cohort-total{gap:12px;margin:20px 0 12px;padding:18px 20px;border-radius:16px;background:var(--lb-text)}
.cohort-total span{color:rgba(255,255,255,.6);font-size:13px}
.cohort-total strong{color:#fff;font-size:28px;font-weight:700}
.cohort-total strong.positive{color:#ff7aa5!important}
.cohort-total strong.negative{color:var(--lb-accent-bright)!important}
.cohort-total small{color:rgba(255,255,255,.45);font-size:12px}
.cohort-metrics{gap:12px}
.cohort-metrics>div{gap:6px;padding:16px;border:0;border-radius:14px;background:var(--lb-bg)}
.cohort-metrics span{color:var(--lb-text-3);font-size:13px}
.cohort-metrics strong{color:var(--lb-text);font-size:22px;font-weight:700}
.cohort-metrics small{color:var(--lb-text-4);font-size:12px}
.cohort-bars{gap:10px;margin-top:18px}
.cohort-bars>div{grid-template-columns:48px 1fr 32px;gap:10px;color:var(--lb-text-3);font-size:13px}
.cohort-bars>div>div{height:8px;border-radius:999px;background:var(--lb-bg-2)}
.cohort-bars i.green{background:var(--lb-up)}
.cohort-bars i.red{background:var(--lb-down)}
.cohort-bars i.gray{background:var(--lb-text-4)}
.cohort-bars strong{color:var(--lb-text)}
.symbol-list{gap:14px;margin-top:20px}
.symbol-row{gap:12px}
.symbol-badge{width:60px;color:var(--lb-text);font-size:14px}
.symbol-values small{color:var(--lb-text-3);font-size:12px}
.symbol-values strong{flex:none;font-size:14px;font-weight:700;white-space:nowrap}
.progress-track{height:8px;margin-top:8px;border-radius:999px;background:var(--lb-bg-2)}
.progress-track i{border-radius:999px;background:var(--lb-up)}
.progress-track i.negative{background:var(--lb-down)}
.symbol-groups{width:44px;color:var(--lb-text-4);font-size:12px}

/* 胜负分布 / 幅度范围 */
.winloss-content{gap:40px;min-height:200px}
.winloss-donut{width:150px;height:150px;filter:hue-rotate(180deg) saturate(1.3)}
.winloss-donut:before{inset:18px}
.winloss-donut strong,.winloss-donut small{color:var(--lb-text)}
.winloss-donut strong{font-size:30px;font-weight:700}
.winloss-donut small{color:var(--lb-text-3);font-size:12px}
.winloss-legend{gap:14px}
.winloss-legend>div{gap:40px;color:var(--lb-text-2);font-size:14px}
.winloss-legend i{width:10px;height:10px}
.win-dot{background:var(--lb-up)}
.loss-dot{background:var(--lb-down)}
.flat-dot{background:var(--lb-text-4)}
.winloss-legend strong{color:var(--lb-text);font-size:15px}
.winloss-legend small{color:var(--lb-text-4);font-size:12px}
.range-values{gap:12px;margin:28px 0 20px}
.range-values>div{gap:8px;padding:16px;border-radius:14px;background:var(--lb-bg)}
.range-values span{color:var(--lb-text-3);font-size:13px}
.range-values strong{font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}
.range-visual{height:16px}
.range-track{top:6px;height:4px;border-radius:999px;background:linear-gradient(90deg,var(--lb-down),var(--lb-border) 50%,var(--lb-up))}
.range-marker{top:1px;width:14px;height:14px;border:3px solid #fff}
.loss-marker,.avg-loss-marker{color:var(--lb-down);background:var(--lb-down)}
.avg-win-marker,.win-marker{color:var(--lb-up);background:var(--lb-up)}
.range-caption{margin-top:16px;color:var(--lb-text-4);font-size:12px}

/* 已结算记录 */
.records-heading{padding:28px 28px 20px}
.export-button{height:40px;padding:0 20px;border:0;border-radius:999px;background:var(--lb-text);color:#fff;font-size:14px;font-weight:600}
.export-button:hover,.export-button:focus{background:#1f2937;color:#fff}
.export-button.is-disabled{background:var(--lb-bg-2);color:var(--lb-text-4)}
.records-toolbar{flex-wrap:wrap;gap:12px;padding:0 28px 20px}
.record-filters{gap:2px;padding:3px;border-radius:999px;background:var(--lb-bg-2)}
.record-filters button{height:32px;padding:0 14px;border-radius:999px;color:var(--lb-text-2);font-size:13px;font-weight:500;white-space:nowrap}
.record-filters button:hover{color:var(--lb-text)}
.record-filters button.active{background:var(--lb-text);color:#fff;font-weight:600}
.record-filters small{color:var(--lb-text-4)}
.record-filters button.active small{color:rgba(255,255,255,.6)}
.search-input{width:260px}
.search-input :deep(.el-input__wrapper){height:40px;padding:0 16px;border-radius:999px;box-shadow:0 0 0 1px var(--lb-border) inset}
.search-input :deep(.el-input__wrapper.is-focus){box-shadow:0 0 0 1px var(--lb-text) inset,0 0 0 3px rgba(7,10,19,.06)}
.search-input :deep(.el-input__inner){color:var(--lb-text);font-size:14px}
.table-wrap{border-color:var(--lb-border)}
.record-table{min-width:1000px}
.record-table th{height:44px;padding:0 14px;background:var(--lb-bg);color:var(--lb-text-3);font-size:12px;font-weight:600}
.record-table td{height:60px;padding:6px 14px;border-color:var(--lb-bg-2);color:var(--lb-text-2);font-size:14px;font-variant-numeric:tabular-nums}
.record-table th:first-child,.record-table td:first-child{padding-left:28px}
.record-table th:last-child,.record-table td:last-child{padding-right:28px}
.record-table tbody tr{transition:background .15s}
.record-table tbody tr:hover{background:var(--lb-bg)}
.record-table td:nth-last-child(-n+2){font-weight:700}
.record-symbol{gap:4px}
.record-symbol b{color:var(--lb-text);font-size:15px}
.record-symbol span{color:var(--lb-text-3);font-size:12px}
.lots-tag{margin-left:8px;padding:2px 8px;border-radius:999px;background:var(--lb-accent-soft);color:#008a8a;font-size:11px}
.basis-pill{padding:4px 10px;border-radius:999px;background:var(--lb-bg-2);color:var(--lb-text-2);font-size:12px;font-weight:500}
.excluded-pill{background:var(--lb-warn-soft);color:#b45309}
.pending-pill{background:var(--lb-warn-soft);color:#b45309}
.table-empty{min-height:240px;gap:10px;color:var(--lb-text-3);font-size:14px}
.table-empty .el-icon{color:var(--lb-text-4);font-size:28px}
.table-empty strong{color:var(--lb-text);font-size:18px}
.table-empty .el-button{font-size:14px;color:var(--lb-text)}
.records-footer{align-items:center;padding:18px 28px;border-color:var(--lb-border);color:var(--lb-text-3);font-size:13px}
.more-button{height:32px;margin-left:12px;padding:0 16px!important;border-radius:999px;background:var(--lb-text)!important;color:#fff!important;font-size:13px}

/* 状态面板 */
.status-panel{min-height:360px;gap:10px}
.status-icon{width:56px;height:56px;border-radius:16px;background:var(--lb-bg-2);color:var(--lb-text-2);font-size:24px}
.status-panel strong{color:var(--lb-text);font-size:18px}
.status-panel p{color:var(--lb-text-3);font-size:14px}
.status-panel button{height:40px;padding:0 22px;border:0;border-radius:999px;background:var(--lb-text);color:#fff;font-size:14px;font-weight:600}
.deploy-tip{padding:10px 14px;border-radius:12px;background:var(--lb-bg);color:var(--lb-text-2);font-size:13px}
.deploy-tip i{background:var(--lb-accent)}

/* 灰底免责区 */
.lb-gray{padding:8px 0 64px}
.disclaimer{gap:14px;margin:0;padding:20px 24px;border:0;border-radius:20px;background:#fff;color:var(--lb-text-2);font-size:14px;line-height:1.6;box-shadow:0 1px 2px rgba(7,10,19,.04)}
.disclaimer .el-icon{width:40px;height:40px;border-radius:12px;background:var(--lb-warn-soft);color:var(--lb-warn);font-size:18px}

/* ---------- 响应式 ---------- */
@media(max-width:1279px){.summary-total strong{font-size:28px}.summary-cell strong{font-size:19px}.summary-total,.summary-cell{padding:0 14px}}
@media(max-width:1100px){.scorecard-page{--pad-top:24px;--pad-bottom:36px}.page-heading h1{font-size:40px}.summary-strip{grid-template-columns:repeat(3,1fr);row-gap:20px}.summary-cell:nth-child(3){border-right:0}.rescued-list{grid-template-columns:1fr 1fr}}
@media(max-width:950px){.monthly-grid{grid-template-columns:1fr}.quality-grid{grid-template-columns:1fr}}
@media(max-width:760px){
  .scorecard-page{--pad-top:20px;--pad-bottom:30px}
  .lb-wrap{padding:0 16px}
  .lb-hero{padding:40px 0 100px}
  .page-heading{align-items:flex-start}
  .page-heading h1{font-size:34px}
  .bar-group:nth-child(even)>span,.line-labels span:nth-child(even){visibility:hidden}
  .page-heading p{font-size:14px}
  .heading-meta{flex-wrap:wrap}
  .heading-meta>span{height:32px;padding:0 12px;font-size:12px}
  .share-button{height:32px}
  .lb-body{margin-top:-72px}
  .chart-panel,.management-panel,.monthly-panel,.symbols-panel,.winloss-panel,.range-panel{padding:20px 18px}
  .chart-panel-top,.section-heading,.records-heading{align-items:flex-start}
  .chart-panel-top h2,.section-heading h2,.records-heading h2{font-size:20px}
  .chart-panel-top{flex-direction:column}
  .control-rows{padding:12px}
  .segmented{max-width:100%;overflow-x:auto}
  .segmented button,.segmented.compact button{height:30px;padding:0 11px;font-size:12px}
  .chart-type-label,.range-label{margin-left:0}
  .floating-switch{margin:0}
  .performance-chart{height:220px;grid-template-columns:48px minmax(0,1fr)}
  .chart-axis,.bar-group>span,.line-labels{font-size:10px}
  .summary-strip{grid-template-columns:repeat(2,1fr);padding:20px 4px;row-gap:18px}
  .summary-total{grid-column:1/-1;border-right:0}
  .summary-strip>div:nth-child(3){border-right:1px solid rgba(255,255,255,.1)}
  .summary-strip>div:nth-child(odd):not(:first-child){border-right:0}
  .summary-total,.summary-cell{padding:0 14px}
  .summary-total strong{font-size:28px}
  .summary-cell strong{font-size:18px}
  .summary-cell span{white-space:normal}
  .management-summary{grid-template-columns:1fr 1fr;row-gap:16px;padding:16px 0}
  .management-summary>div{padding:0 14px}
  .management-summary strong{font-size:20px}
  .rescued-list{grid-template-columns:1fr}
  .cohort-total{grid-template-columns:1fr;gap:4px;padding:16px}
  .cohort-total strong{font-size:24px}
  .cohort-metrics strong,.range-values strong{font-size:18px}
  .winloss-content{gap:24px}
  .winloss-donut{width:120px;height:120px}
  .winloss-donut strong{font-size:24px}
  .winloss-legend>div{gap:20px}
  .range-values{grid-template-columns:1fr 1fr}
  .records-heading{padding:20px 18px 16px;gap:12px}
  .records-toolbar{padding:0 18px 16px}
  .record-filters{max-width:100%;overflow-x:auto}
  .search-input{width:100%}
  .record-table th:first-child,.record-table td:first-child{padding-left:18px}
  .records-footer{align-items:flex-start;padding:16px 18px}
  .lb-gray{padding-bottom:40px}
}
@media(max-width:390px){.page-heading h1{font-size:30px}.summary-cell strong{font-size:16px}.management-summary strong{font-size:18px}}
</style>
