<template>
  <div class="active-page">
    <section class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-dot" />ACTIVE POSITIONS</div>
        <h1>进行</h1>
        <p>查看在途信号、保护动作与持仓管理进度。</p>
      </div>
      <div class="heading-tools"><span :class="['demo-pill', { live: summary }]"><i />{{ syncBadge }}</span><span class="sync-pill" :title="summary?.status?.message || ''"><el-icon><Connection /></el-icon>{{ marketBadge }}</span></div>
    </section>

    <section class="filter-panel">
      <div class="filter-heading"><span class="filter-title">信号范围</span><span class="filter-tip">选择状态查看对应组合</span></div>
      <div class="filter-row">
        <div class="filter-tabs" role="tablist" aria-label="信号范围">
          <button v-for="item in filters" :key="item.key" type="button" :class="['filter-tab', { active: selectedFilter === item.key }]" @click="selectFilter(item.key)">
            {{ item.label }}<span class="filter-count">{{ item.count }}</span>
          </button>
        </div>
        <div class="filter-tools">
          <el-input v-model="searchText" class="search-input" placeholder="搜索标的" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <label class="sort-select"><el-icon><Sort /></el-icon><select v-model="sortBy" aria-label="排序方式"><option value="updated">最新变化</option><option value="expiry">临近到期</option><option value="pnl">浮盈最高</option></select><el-icon><ArrowDown /></el-icon></label>
        </div>
      </div>
      <div class="list-options">
        <div class="sort-tabs"><button :class="{ active: groupBy === 'sent' }" @click="groupBy = 'sent'">按发报日</button><button :class="{ active: groupBy === 'expiry' }" @click="groupBy = 'expiry'">按到期日</button></div>
        <span class="sort-hint">{{ groupBy === 'sent' ? '新发信号优先' : (pastScope ? '最近到期优先' : '临近到期优先') }}</span>
        <span class="read-only-note"><el-icon><InfoFilled /></el-icon>数据由后端定时同步自 OSM，仅供研究复核，不代表账户实际持仓</span>
      </div>
    </section>

    <section v-if="!currentData" class="empty-results state-panel">
      <span class="empty-icon"><el-icon :class="{ spinning: currentLoading }"><Loading v-if="currentLoading" /><Search v-else /></el-icon></span>
      <strong>{{ currentLoading ? '正在加载数据' : '暂无数据' }}</strong>
      <p>{{ currentLoading ? '正在从本地服务读取 OSM 同步数据…' : (errors[currentScope] || '后端定时任务尚未同步该栏目的数据，请稍后刷新。') }}</p>
      <span v-if="!currentLoading && !errors[currentScope]" class="coming-label"><i />首次部署请由管理员在若依后台「系统监控 → 定时任务」对「OSM进行菜单强制同步」执行一次</span>
    </section>
    <section v-else-if="visibleGroups.length" class="trade-feed" aria-label="期权组合列表">
      <template v-for="group in visibleGroups" :key="group.key">
        <div class="day-divider"><span>{{ group.label }}<em>{{ group.items.length }} 组</em></span><i /></div>
        <article v-for="trade in group.items" :key="trade.id" class="trade-card">
          <div class="trade-main">
            <div class="trade-heading">
              <div class="symbol-block"><span class="symbol-avatar">{{ trade.symbol.slice(0, 1) }}</span><div><div class="symbol-line"><strong>{{ trade.symbol }}</strong><span v-if="trade.group">· {{ trade.group }}</span><span :class="['strategy-tag', trade.side]">{{ trade.strategy }}</span></div><div class="trade-subtitle">{{ trade.subtitle }}</div></div></div>
              <div class="trade-head-right"><span :class="['risk-badge', trade.statusTone]"><i />{{ trade.statusLabel }}</span><span v-if="trade.time" class="sent-time"><el-icon><Clock /></el-icon>{{ trade.time }} ET</span></div>
            </div>

            <div class="contract-line"><span class="contract-side">{{ trade.legs }}</span><span class="contract-expiry"><el-icon><Calendar /></el-icon>到期 {{ trade.expiry }}</span><span class="credit-pill">每组收 <strong>{{ trade.credit }}</strong></span></div>

            <div class="metrics-row">
              <div v-for="(metric, index) in trade.metrics" :key="metric.key" :class="['trade-metric', { 'pnl-metric': index === 0, 'max-risk': index === trade.metrics.length - 1 }]"><span>{{ metric.label }}</span><strong :class="metric.tone">{{ metric.value }}</strong></div>
            </div>

            <div v-if="trade.management" class="management-alert">
              <span class="management-icon"><el-icon><Warning /></el-icon></span><div><strong>{{ trade.management.title }}</strong><span>{{ trade.management.description }}</span></div><span v-if="trade.management.value" class="management-value">{{ trade.management.value }}</span>
            </div>

            <div class="lifecycle-row"><span class="lifecycle-label">生命周期</span><div class="lifecycle-track"><span v-for="(step, index) in lifecycle" :key="step" :class="['lifecycle-step', { complete: index < trade.stage, current: index === trade.stage }]"><i />{{ step }}</span></div><button class="record-button" type="button" @click="openNote(trade)"><el-icon><EditPen /></el-icon>{{ notes[trade.id] ? '已记录' : '记录判断' }}</button><button class="share-button" type="button" aria-label="复制卡片摘要" @click="copyTrade(trade)"><el-icon><Share /></el-icon></button></div>
          </div>
        </article>
      </template>
      <button v-if="hasMore" class="more-button" type="button" @click="limit += PAGE_SIZE">显示更多（剩余 {{ filteredCount - limit }} 组）</button>
    </section>
    <section v-else class="empty-results"><span class="empty-icon"><el-icon><Search /></el-icon></span><strong>{{ searchText ? '没有找到匹配的组合' : '该栏目暂无组合' }}</strong><p>{{ searchText ? '调整筛选状态或搜索条件后再查看。' : '最近一次同步中该栏目没有条目。' }}</p><button v-if="searchText" type="button" @click="resetFilters">重置筛选</button></section>

    <section class="lower-grid">
      <article class="bottom-panel week-panel">
        <div class="bottom-heading"><div><span class="bottom-kicker">THIS WEEK</span><h2>本周活动</h2></div><span class="week-date">{{ weekRange }}</span></div>
        <div class="week-days"><div v-for="day in weekDays" :key="day.day" :class="['week-day', { today: day.today }]"><span>{{ day.name }}</span><strong>{{ day.count }}</strong><i /></div></div>
        <div class="week-stats"><div><span>新信号</span><strong>{{ weekStats.signals }}</strong></div><div><span>保护提醒</span><strong class="orange-text">{{ weekStats.protection }}</strong></div><div><span>管理更新</span><strong>{{ weekStats.manage }}</strong></div><div><span>到期结算</span><strong class="green-text">{{ weekStats.settled }}</strong></div></div>
      </article>
      <article class="bottom-panel watch-panel">
        <div class="bottom-heading"><div><span class="bottom-kicker">POSITION WATCH</span><h2>关注中的标的</h2></div><span class="watch-count">{{ watchedSymbols.length }} 个</span></div>
        <div class="watch-list"><div v-for="item in watchedSymbols.slice(0, 8)" :key="item.symbol" class="watch-row"><span class="watch-symbol">{{ item.symbol }}</span><span class="watch-type">{{ item.type }}</span><span class="watch-position">{{ item.position }}</span><span :class="['watch-move', item.tone]">{{ item.move }}</span></div><div v-if="!watchedSymbols.length" class="watch-row"><span class="watch-position">暂无进行中的组合</span></div></div>
        <div class="watch-foot"><el-icon><InfoFilled /></el-icon>来自「进行中」信号，涨跌为标的自发报以来变化</div>
      </article>
    </section>

    <section class="risk-note"><span class="risk-icon"><el-icon><Warning /></el-icon></span><div><strong>交易风险提示</strong><p>期权策略可能导致本金损失。页面数据为 OSM 研究信号与估值标记，不是账户实际成交或已实现收益，也不构成自动交易或个性化投资建议。</p></div></section>

    <el-dialog v-model="noteDialogVisible" title="记录我的判断" width="min(440px, calc(100vw - 32px))" class="note-dialog">
      <div class="dialog-trade"><span class="dialog-symbol">{{ activeTrade?.symbol }}</span><span>{{ activeTrade?.strategy }} · {{ activeTrade?.legs }}</span></div>
      <el-input v-model="noteText" type="textarea" :rows="4" placeholder="记录观察、计划或复盘要点（仅保存在当前浏览器）" />
      <template #footer><el-button @click="noteDialogVisible = false">取消</el-button><el-button type="primary" @click="saveNote">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Calendar, Clock, Connection, EditPen, InfoFilled, Loading, Search, Share, Sort, Warning } from '@element-plus/icons-vue'
import { getConductScope, getConductSummary } from '@/api/option/conduct'
import { dayLabel, etLabelDay, toTrades, weekOf } from '@/utils/conductData'
import { shortDay } from '@/utils/todayFeed'

const NOTE_KEY = 'option-web-conduct-notes'
const PAGE_SIZE = 40
const FILTERS = [
  { key: 'open', scope: 'active', label: '进行中' },
  { key: 'protection', scope: 'protection', label: '保护窗口' },
  { key: 'management', scope: 'manage', label: '动态管理' },
  { key: 'expired', scope: 'expired', label: '已到期' },
  { key: 'history', scope: 'history', label: '历史信号' }
]
const WEEK_NAMES = ['一', '二', '三', '四', '五']
const lifecycle = ['发报', '保护窗口', '动态管理', '到期结算']

const selectedFilter = ref('open')
const searchText = ref('')
const sortBy = ref('updated')
const groupBy = ref('sent')
const limit = ref(PAGE_SIZE)
const noteDialogVisible = ref(false)
const activeTrade = ref(null)
const noteText = ref('')
const notes = ref(readNotes())
const summary = ref(null)
const cache = reactive({})
const loading = reactive({})
const errors = reactive({})

const currentScope = computed(() => FILTERS.find(f => f.key === selectedFilter.value)?.scope || 'active')
const currentData = computed(() => cache[currentScope.value] || null)
const currentLoading = computed(() => !!loading[currentScope.value])
const pastScope = computed(() => ['expired', 'history'].includes(currentScope.value))
const marketDay = computed(() => summary.value?.marketDay || cache.active?.marketDay || '')
const filters = computed(() => FILTERS.map(f => {
  const count = summary.value?.scopes?.find(s => s.scope === f.scope)?.count ?? cache[f.scope]?.count
  return { ...f, count: count === undefined || count === null ? '—' : String(count).padStart(2, '0') }
}))
const syncBadge = computed(() => {
  if (!summary.value) return loading.summary ? '正在加载' : '暂无同步数据'
  const t = String(summary.value.syncTime || '').match(/\d{4}-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/)
  return `OSM 同步数据${t ? ` · ${t[1]}/${t[2]} ${t[3]}` : ''}`
})
const marketBadge = computed(() => (marketDay.value ? `交易日 ${shortDay(marketDay.value)}` : '未同步'))

const trades = computed(() => (currentData.value ? toTrades(currentScope.value, currentData.value) : []))
const filteredTrades = computed(() => {
  const query = searchText.value.trim().toLowerCase()
  let result = trades.value
  if (query) result = result.filter(t => `${t.symbol} ${t.company} ${t.strategy} ${t.legs}`.toLowerCase().includes(query))
  const byExpiry = (a, b) => (a.days ?? 9999) - (b.days ?? 9999) || b.sortAt - a.sortAt
  const sorter = sortBy.value === 'pnl' ? (a, b) => (b.pnlValue ?? -Infinity) - (a.pnlValue ?? -Infinity) : sortBy.value === 'expiry' ? byExpiry : (a, b) => b.sortAt - a.sortAt
  return [...result].sort(sorter)
})
const filteredCount = computed(() => filteredTrades.value.length)
const hasMore = computed(() => filteredCount.value > limit.value)
const visibleGroups = computed(() => {
  const sent = groupBy.value === 'sent'
  const groups = new Map()
  for (const trade of filteredTrades.value.slice(0, limit.value)) {
    const day = sent ? trade.sentDay : trade.expiryDay
    if (!groups.has(day)) groups.set(day, { key: day || 'unknown', day, label: dayLabel(day, sent ? '发报' : '到期'), items: [] })
    groups.get(day).items.push(trade)
  }
  const desc = sent || pastScope.value
  return [...groups.values()].sort((a, b) => (desc ? (b.day || '').localeCompare(a.day || '') : (a.day || '9').localeCompare(b.day || '9')))
})

const week = computed(() => weekOf(marketDay.value))
const weekRange = computed(() => (week.value.length ? `${shortDay(week.value[0])} — ${shortDay(week.value[4])}` : '—'))
const weekSignals = computed(() => {
  const seen = new Map()
  for (const scope of ['history', 'active', 'expired']) for (const t of cache[scope] ? toTrades(scope, cache[scope]) : []) if (!seen.has(t.raw.id)) seen.set(t.raw.id, t)
  return [...seen.values()]
})
const weekDays = computed(() => week.value.map((day, i) => {
  const ready = cache.active || cache.history
  return { day, name: WEEK_NAMES[i], today: day === marketDay.value, count: ready ? weekSignals.value.filter(t => t.sentDay === day).length : '—' }
}))
const weekStats = computed(() => {
  const days = new Set(week.value)
  const year = marketDay.value.slice(0, 4)
  const signals = weekSignals.value
  const ready = cache.active || cache.history
  return {
    signals: ready ? signals.filter(t => days.has(t.sentDay)).length : '—',
    protection: ready ? signals.filter(t => days.has(etLabelDay(t.raw.firstProtectionWindowAt, year))).length + (cache.protection?.count || 0) : '—',
    manage: cache.manage ? toTrades('manage', cache.manage).filter(t => days.has(t.sentDay)).length : '—',
    settled: ready ? signals.filter(t => t.raw.statusCode === 'SETTLED' && days.has(t.expiryDay)).length : '—'
  }
})
const watchedSymbols = computed(() => {
  const map = new Map()
  for (const t of cache.active ? toTrades('active', cache.active) : []) {
    const row = map.get(t.symbol) || { symbol: t.symbol, sides: new Set(), n: 0, move: t.raw.sinceSignal || t.dayMove || '—', at: 0 }
    row.sides.add(t.side === 'call' ? '看涨' : '看跌')
    row.n += 1
    if (t.sortAt > row.at) { row.at = t.sortAt; row.move = t.raw.sinceSignal || t.dayMove || '—' }
    map.set(t.symbol, row)
  }
  return [...map.values()].sort((a, b) => b.n - a.n || b.at - a.at).map(r => ({ symbol: r.symbol, type: [...r.sides].join('/'), position: `${r.n} 组组合`, move: r.move, tone: /^-/.test(r.move) ? 'negative' : /^\+/.test(r.move) ? 'positive' : 'neutral' }))
})

async function loadSummary() {
  loading.summary = true
  try { summary.value = await getConductSummary() } catch { summary.value = null } finally { loading.summary = false }
}
async function loadScope(scope, { silent = false } = {}) {
  if (cache[scope] || loading[scope]) return
  loading[scope] = true
  try {
    cache[scope] = await getConductScope(scope)
    errors[scope] = ''
  } catch (error) {
    const message = error.message || '加载失败'
    errors[scope] = /暂无数据/.test(message) ? '' : message
    if (!silent && errors[scope]) ElMessage.warning(errors[scope])
  } finally {
    loading[scope] = false
  }
}
function selectFilter(key) { selectedFilter.value = key }
watch(currentScope, scope => { limit.value = PAGE_SIZE; loadScope(scope) })
watch([searchText, sortBy, groupBy], () => { limit.value = PAGE_SIZE })

onMounted(async () => {
  loadSummary()
  await loadScope('active')
  // 底部「本周活动」需要管理卡与历史信号（含已到期），首屏后静默加载并缓存，切换栏目时直接复用
  loadScope('manage', { silent: true })
  loadScope('protection', { silent: true })
  loadScope('history', { silent: true })
})

function resetFilters() { searchText.value = ''; sortBy.value = 'updated' }
function readNotes() {
  try { return JSON.parse(localStorage.getItem(NOTE_KEY) || '{}') || {} } catch { return {} }
}
function openNote(trade) { activeTrade.value = trade; noteText.value = notes.value[trade.id] || ''; noteDialogVisible.value = true }
function saveNote() {
  if (activeTrade.value) {
    const text = noteText.value.trim()
    if (text) notes.value[activeTrade.value.id] = text
    else delete notes.value[activeTrade.value.id]
    try { localStorage.setItem(NOTE_KEY, JSON.stringify(notes.value)) } catch { /* 存储不可用时仅保留在本页 */ }
  }
  noteDialogVisible.value = false
}
async function copyTrade(trade) {
  const pnl = trade.metrics[0]
  const text = `${trade.symbol} ${trade.strategy} ${trade.legs} · 到期 ${trade.expiry} · 每组收 ${trade.credit} · ${pnl.label} ${pnl.value} · ${trade.statusLabel}`
  try { await navigator.clipboard.writeText(text); ElMessage.success('已复制卡片摘要') } catch { ElMessage.info(text) }
}
</script>

<style scoped>
.demo-pill.live i{background:#4fb487;box-shadow:0 0 0 3px #4fb4871f}.day-divider em{margin-left:6px;color:#a6b2c1;font-style:normal;font-weight:500}.state-panel .coming-label{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:999px;background:#f4f8fc;color:#93a2b2;font-size:8px}.state-panel .coming-label i{width:6px;height:6px;border-radius:50%;background:#89a7c7}.spinning{animation:conduct-spin 1s linear infinite}@keyframes conduct-spin{to{transform:rotate(360deg)}}.more-button{align-self:center;margin-top:4px;padding:7px 14px;border:1px solid #e1eaf3;border-radius:8px;background:#fff;color:#3d7fbd;font-size:9px;cursor:pointer}.more-button:hover{background:#f4f9ff}
.active-page{--ink:#1d3858;--muted:#8798ac;--line:#e7edf4;color:var(--ink)}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:1px 0 18px}.eyebrow{display:flex;align-items:center;gap:8px;color:#5284b7;font-size:10px;font-weight:750;letter-spacing:1.1px}.eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#5799d4;box-shadow:0 0 0 4px #5799d41b}.page-heading h1{margin:7px 0 4px;color:#19395f;font-size:27px;line-height:1.15;letter-spacing:-.4px}.page-heading p{margin:0;color:#8999ab;font-size:11px}.heading-tools{display:flex;align-items:center;gap:8px}.demo-pill,.sync-pill{display:flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:#fff;color:#8293a7;font-size:9px;white-space:nowrap}.demo-pill i{width:6px;height:6px;border-radius:50%;background:#80a9d4}.sync-pill .el-icon{color:#91a6bc}
.filter-panel,.trade-card,.bottom-panel{background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 3px 14px #233e5b08}.filter-panel{margin-bottom:14px;padding:14px 16px 0}.filter-heading{display:flex;align-items:center;gap:8px;margin-bottom:10px}.filter-title{color:#526c88;font-size:11px;font-weight:700}.filter-tip{color:#a4afbc;font-size:9px}.filter-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.filter-tabs{display:flex;align-items:center;gap:3px;overflow:auto}.filter-tab{display:flex;align-items:center;gap:7px;padding:8px 9px;border:0;border-radius:7px;background:transparent;color:#7b8da2;font-size:10px;white-space:nowrap;cursor:pointer}.filter-tab:hover{background:#f6f9fc}.filter-tab.active{background:#edf5ff;color:#2d73ba;font-weight:700}.filter-count{color:#a6b2c1;font-size:8px}.filter-tab.active .filter-count{color:#5f91c7}.filter-tools{display:flex;align-items:center;gap:7px;flex:none}.search-input{width:170px}.search-input :deep(.el-input__wrapper){height:30px;border-radius:7px;box-shadow:0 0 0 1px #e8edf3 inset}.search-input :deep(.el-input__inner){font-size:9px}.search-input :deep(.el-input__prefix){color:#9aabbd}.sort-select{height:30px;display:flex;align-items:center;gap:6px;padding:0 8px;border:1px solid #e8edf3;border-radius:7px;color:#8a9bad;font-size:9px}.sort-select select{max-width:80px;border:0;outline:0;background:transparent;color:#6e8198;font:inherit;cursor:pointer}.list-options{display:flex;align-items:center;gap:10px;margin-top:10px;padding:9px 0;border-top:1px solid #eff3f7}.sort-tabs{display:flex;gap:3px}.sort-tabs button{padding:5px 7px;border:0;border-radius:5px;background:transparent;color:#8d9bad;font-size:9px;cursor:pointer}.sort-tabs button.active{background:#f1f6fc;color:#467fb7;font-weight:700}.sort-hint{color:#a3afbc;font-size:8px}.read-only-note{display:flex;align-items:center;gap:5px;margin-left:auto;color:#a0adbb;font-size:8px}.read-only-note .el-icon{color:#86a8ca}
.trade-feed{display:flex;flex-direction:column;gap:9px}.day-divider{display:flex;align-items:center;gap:10px;margin:3px 2px 1px;color:#8495a9;font-size:9px;font-weight:650}.day-divider i{height:1px;flex:1;background:#e7edf4}.trade-card{overflow:hidden;padding:14px 15px 11px;transition:box-shadow .18s,border-color .18s}.trade-card:hover{border-color:#d4e3f2;box-shadow:0 6px 18px #244e7611}.trade-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.symbol-block{display:flex;align-items:center;gap:9px;min-width:0}.symbol-avatar{width:32px;height:32px;flex:none;display:grid;place-items:center;border-radius:9px;background:linear-gradient(145deg,#edf5ff,#e3effd);color:#3476b7;font-size:14px;font-weight:750}.symbol-line{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.symbol-line>strong{color:#244567;font-size:13px}.symbol-line>span{color:#9aa8b7;font-size:9px}.strategy-tag{padding:4px 6px;border-radius:5px;background:#f0f5fb;color:#6584a4!important;font-size:8px!important}.strategy-tag.put{background:#edf5ff;color:#4b80b7!important}.strategy-tag.call{background:#f3efff;color:#8270b5!important}.trade-subtitle{margin-top:3px;color:#a1adba;font-size:8px}.trade-head-right{display:flex;align-items:center;gap:10px}.risk-badge{display:flex;align-items:center;gap:5px;padding:5px 7px;border-radius:999px;background:#edf5ff;color:#4b80b8;font-size:8px;white-space:nowrap}.risk-badge i{width:5px;height:5px;border-radius:50%;background:currentColor}.risk-badge.orange{background:#fff6e9;color:#c58b46}.risk-badge.green{background:#edf8f2;color:#4c9b73}.risk-badge.muted{background:#f3f5f7;color:#8492a2}.sent-time{display:flex;align-items:center;gap:4px;color:#9eabb9;font-size:8px;white-space:nowrap}.contract-line{display:flex;align-items:center;gap:10px;margin:12px 0 11px;padding:9px 10px;border-radius:8px;background:#f8fafd}.contract-side{color:#425f7e;font-size:10px;font-weight:650}.contract-expiry{display:flex;align-items:center;gap:4px;color:#8b9caf;font-size:8px}.contract-expiry .el-icon{color:#91a9c3}.credit-pill{margin-left:auto;color:#95a3b2;font-size:8px;white-space:nowrap}.credit-pill strong{margin-left:3px;color:#4e7397;font-size:10px}.metrics-row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;border:1px solid #edf1f5;border-radius:8px}.trade-metric{display:flex;flex-direction:column;gap:5px;padding:8px 10px;border-right:1px solid #edf1f5}.trade-metric:last-child{border-right:0}.trade-metric span{color:#9aa8b6;font-size:8px;white-space:nowrap}.trade-metric strong{color:#506983;font-size:11px;font-weight:700}.trade-metric strong.positive{color:#258b68}.trade-metric strong.negative{color:#cf6666}.trade-metric strong.orange-text{color:#c78b3f}.management-alert{display:flex;align-items:center;gap:8px;margin-top:9px;padding:8px 9px;border:1px solid #f5e8d2;border-radius:7px;background:#fffaf2}.management-icon{color:#d09a4c;font-size:13px}.management-alert>div{display:flex;align-items:center;gap:7px;min-width:0;flex:1}.management-alert strong{color:#a47b42;font-size:9px;white-space:nowrap}.management-alert>div span{overflow:hidden;color:#ac9b7e;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.management-value{padding:4px 6px;border-radius:4px;background:#fff2dd;color:#bb8744;font-size:8px;white-space:nowrap}.lifecycle-row{display:flex;align-items:center;gap:9px;margin-top:10px}.lifecycle-label{color:#a0adbb;font-size:8px;white-space:nowrap}.lifecycle-track{display:flex;align-items:center;flex:1;max-width:390px}.lifecycle-step{position:relative;display:flex;align-items:center;gap:4px;flex:1;color:#a5b0bd;font-size:8px;white-space:nowrap}.lifecycle-step:not(:last-child):after{height:1px;content:'';flex:1;margin:0 5px;background:#e7edf3}.lifecycle-step i{width:6px;height:6px;flex:none;border-radius:50%;background:#d8e0e9}.lifecycle-step.complete{color:#6e93b8}.lifecycle-step.complete i,.lifecycle-step.current i{background:#5a97d2}.lifecycle-step.current{color:#3979b9;font-weight:700}.lifecycle-step.current:not(:last-child):after{background:#bfd5eb}.record-button,.share-button{display:flex;align-items:center;justify-content:center;gap:5px;height:27px;padding:0 8px;border:1px solid #e6edf4;border-radius:6px;background:#fff;color:#7188a0;font-size:8px;cursor:pointer;white-space:nowrap}.record-button:hover,.share-button:hover{border-color:#c7dcef;color:#3477b8}.share-button{width:27px;padding:0;font-size:11px}
.empty-results{display:flex;align-items:center;justify-content:center;flex-direction:column;min-height:240px;border:1px dashed #dfe8f1;border-radius:12px;background:#fbfdff;text-align:center}.empty-icon{width:39px;height:39px;display:grid;place-items:center;margin-bottom:9px;border-radius:12px;background:#edf5ff;color:#77a0ca;font-size:16px}.empty-results strong{color:#5c7390;font-size:11px}.empty-results p{margin:5px 0 10px;color:#9ba9b8;font-size:9px}.empty-results button{border:0;background:transparent;color:#3d7fbd;font-size:9px;cursor:pointer}.lower-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.bottom-panel{padding:14px 15px}.bottom-heading{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:11px}.bottom-kicker{color:#86a2bd;font-size:8px;font-weight:750;letter-spacing:1px}.bottom-heading h2{margin:4px 0 0;color:#385676;font-size:12px}.week-date,.watch-count{padding:5px 7px;border-radius:5px;background:#f5f8fb;color:#96a5b5;font-size:8px}.week-days{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.week-day{display:flex;align-items:center;flex-direction:column;gap:5px;padding:8px 4px;border:1px solid #edf1f5;border-radius:7px;color:#9aa8b7;font-size:8px}.week-day strong{color:#58728e;font-size:11px}.week-day i{width:4px;height:4px;border-radius:50%;background:#c8d5e2}.week-day.today{border-color:#d9e8f7;background:#f4f9ff;color:#4780b8}.week-day.today strong{color:#3477b8}.week-day.today i{background:#4a91d1}.week-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #eff3f7}.week-stats>div{display:flex;flex-direction:column;gap:4px}.week-stats span{color:#9ba9b7;font-size:8px}.week-stats strong{color:#55718f;font-size:11px}.week-stats .orange-text{color:#c89248}.week-stats .green-text{color:#429b75}.watch-list{display:flex;flex-direction:column}.watch-row{display:grid;grid-template-columns:52px 45px 1fr auto;align-items:center;gap:7px;padding:8px 2px;border-top:1px solid #f0f3f6}.watch-symbol{color:#496987;font-size:9px;font-weight:700}.watch-type,.watch-position{color:#9ba8b7;font-size:8px}.watch-move{color:#8fa1b4;font-size:8px}.watch-move.positive{color:#328c6c}.watch-move.negative{color:#cf6868}.watch-foot{display:flex;align-items:center;gap:5px;margin-top:5px;color:#a4afbc;font-size:8px}.watch-foot .el-icon{color:#8caaca}.risk-note{display:flex;align-items:flex-start;gap:9px;margin-top:13px;padding:11px 13px;border:1px solid #f1e7d7;border-radius:9px;background:#fffaf2}.risk-icon{margin-top:1px;color:#d29a4c;font-size:14px}.risk-note strong{color:#9e7b4a;font-size:9px}.risk-note p{margin:4px 0 0;color:#a28d6d;font-size:8px;line-height:1.5}.dialog-trade{display:flex;align-items:center;gap:8px;margin-bottom:11px;color:#8192a5;font-size:9px}.dialog-symbol{padding:5px 7px;border-radius:5px;background:#edf5ff;color:#3b79b8;font-size:10px;font-weight:700}.note-dialog :deep(.el-textarea__inner){font-size:11px}.note-dialog :deep(.el-button){border-radius:7px}
@media(max-width:900px){.filter-row{align-items:flex-start;flex-direction:column}.filter-tools{width:100%;justify-content:flex-end}.search-input{flex:1;max-width:250px}.metrics-row{grid-template-columns:repeat(3,minmax(0,1fr))}.trade-metric:nth-child(3){border-right:0}.trade-metric:nth-child(-n+3){border-bottom:1px solid #edf1f5}.trade-metric:nth-child(4){border-right:1px solid #edf1f5}.lower-grid{grid-template-columns:1fr}}
@media(max-width:620px){.page-heading{align-items:flex-start;flex-direction:column;gap:11px}.heading-tools{width:100%;justify-content:flex-start}.filter-panel{padding:12px 12px 0}.filter-tabs{width:100%;padding-bottom:2px}.filter-tab{padding:8px 7px;font-size:9px}.filter-tools{justify-content:stretch}.search-input{max-width:none}.list-options{gap:6px;flex-wrap:wrap}.read-only-note{width:100%;margin:1px 0 0}.trade-card{padding:12px 11px 10px}.trade-heading{align-items:flex-start}.trade-head-right{align-items:flex-end;flex-direction:column;gap:5px}.symbol-avatar{width:29px;height:29px}.symbol-line{gap:5px}.symbol-line>strong{font-size:12px}.contract-line{flex-wrap:wrap;gap:6px;padding:8px}.contract-side{width:100%;font-size:9px}.credit-pill{margin-left:auto}.metrics-row{grid-template-columns:repeat(3,minmax(0,1fr))}.trade-metric{padding:7px 8px}.lifecycle-row{flex-wrap:wrap}.lifecycle-label{width:100%}.lifecycle-track{order:2;flex-basis:100%;max-width:none;margin:3px 0}.record-button{margin-left:auto}.management-alert>div{align-items:flex-start;flex-direction:column;gap:3px}.lower-grid{gap:9px}.bottom-panel{padding:12px}.week-stats{grid-template-columns:repeat(2,1fr);row-gap:9px}}
@media(max-width:380px){.filter-tab{gap:4px;padding:7px 5px;font-size:8px}.filter-count{font-size:7px}.sort-select{gap:4px;padding:0 5px}.sort-select select{max-width:67px}.trade-metric{padding:7px 6px}.trade-metric span{font-size:7px}.trade-metric strong{font-size:10px}.sent-time{font-size:7px}.risk-badge{font-size:7px}}
</style>
