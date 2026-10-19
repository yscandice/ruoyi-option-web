<template>
  <div class="scorecard-page">
    <section class="page-heading">
      <div><div class="eyebrow"><span class="eyebrow-dot"/>REVIEW · PERFORMANCE</div><h1>战绩</h1><p>每日结算净额 · 管理后口径</p></div>
      <div class="heading-meta"><span>{{ syncBadge }}</span><el-button plain class="share-button" :disabled="!ready" @click="shareSummary"><el-icon><Share /></el-icon>{{ shareLabel }}</el-button></div>
    </section>

    <section v-if="!ready" class="panel status-panel">
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
    <section class="disclaimer"><el-icon><Warning /></el-icon><span>战绩为 OSM 正式信号按发报中间价记账、按管理规则了结的研究口径结果，不是任何会员的真实成交。历史表现不代表未来结果。</span></section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Calendar, DataAnalysis, Document, Download, InfoFilled, Loading, Right, Search, Share, Warning } from '@element-plus/icons-vue'
import { getRecordKind, getRecordSummary } from '@/api/option/record'
import { axisUsd, money, niceMax, num, plainUsd, summarize, toBuckets, toRecord, tone } from '@/utils/recordData'

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
