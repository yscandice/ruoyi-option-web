<template>
  <div class="active-page">
    <section class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-dot" />ACTIVE POSITIONS</div>
        <h1>进行</h1>
        <p>查看在途信号、保护动作与持仓管理进度。</p>
      </div>
      <div class="heading-tools"><span class="demo-pill"><i />静态演示数据</span><span class="sync-pill"><el-icon><Connection /></el-icon>未连接账户</span></div>
    </section>

    <section class="filter-panel">
      <div class="filter-heading"><span class="filter-title">信号范围</span><span class="filter-tip">选择状态查看对应组合</span></div>
      <div class="filter-row">
        <div class="filter-tabs" role="tablist" aria-label="信号范围">
          <button v-for="item in filters" :key="item.key" type="button" :class="['filter-tab', { active: selectedFilter === item.key }]" @click="selectedFilter = item.key">
            {{ item.label }}<span class="filter-count">{{ item.count }}</span>
          </button>
        </div>
        <div class="filter-tools">
          <el-input v-model="searchText" class="search-input" placeholder="搜索标的" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <label class="sort-select"><el-icon><Sort /></el-icon><select v-model="sortBy" aria-label="排序方式"><option value="updated">最新变化</option><option value="expiry">下一复核</option><option value="pnl">浮盈最高</option></select><el-icon><ArrowDown /></el-icon></label>
        </div>
      </div>
      <div class="list-options">
        <div class="sort-tabs"><button :class="{ active: groupBy === 'sent' }" @click="groupBy = 'sent'">按发报日</button><button :class="{ active: groupBy === 'expiry' }" @click="groupBy = 'expiry'">按到期日</button></div>
        <span class="sort-hint">{{ groupBy === 'sent' ? '新发信号优先' : '临近到期优先' }}</span>
        <span class="read-only-note"><el-icon><InfoFilled /></el-icon>示例数据仅用于页面预览，不代表实时持仓</span>
      </div>
    </section>

    <section v-if="visibleTrades.length" class="trade-feed" aria-label="期权组合列表">
      <div class="day-divider"><span>{{ groupBy === 'sent' ? '10/15 · 周四 发报' : '10/21 · 周三 到期' }}</span><i /></div>
      <article v-for="trade in visibleTrades" :key="trade.id" class="trade-card">
        <div class="trade-main">
          <div class="trade-heading">
            <div class="symbol-block"><span class="symbol-avatar">{{ trade.symbol.slice(0, 1) }}</span><div><div class="symbol-line"><strong>{{ trade.symbol }}</strong><span v-if="trade.group">· {{ trade.group }}</span><span :class="['strategy-tag', trade.side]">{{ trade.strategy }}</span></div><div class="trade-subtitle">{{ trade.subtitle }}</div></div></div>
            <div class="trade-head-right"><span :class="['risk-badge', trade.statusTone]"><i />{{ trade.statusLabel }}</span><span class="sent-time"><el-icon><Clock /></el-icon>{{ trade.time }} ET</span></div>
          </div>

          <div class="contract-line"><span class="contract-side">{{ trade.legs }}</span><span class="contract-expiry"><el-icon><Calendar /></el-icon>到期 {{ trade.expiry }}</span><span class="credit-pill">每组收 <strong>{{ trade.credit }}</strong></span></div>

          <div class="metrics-row">
            <div class="trade-metric pnl-metric"><span>{{ trade.pnlLabel || '当前浮盈' }}</span><strong :class="trade.pnlTone">{{ trade.pnl }}</strong></div>
            <div class="trade-metric"><span>价差</span><strong>{{ trade.width }}</strong></div>
            <div class="trade-metric"><span>剩余</span><strong>{{ trade.days }} 天</strong></div>
            <div class="trade-metric"><span>距离现价</span><strong :class="trade.distanceTone">{{ trade.distance }}</strong></div>
            <div class="trade-metric"><span>风险收益比</span><strong>{{ trade.riskReward }}</strong></div>
            <div class="trade-metric max-risk"><span>最大风险</span><strong>{{ trade.maxRisk }}</strong></div>
          </div>

          <div v-if="trade.management" class="management-alert">
            <span class="management-icon"><el-icon><Warning /></el-icon></span><div><strong>{{ trade.management.title }}</strong><span>{{ trade.management.description }}</span></div><span class="management-value">{{ trade.management.value }}</span>
          </div>

          <div class="lifecycle-row"><span class="lifecycle-label">生命周期</span><div class="lifecycle-track"><span v-for="(step, index) in lifecycle" :key="step" :class="['lifecycle-step', { complete: index < trade.stage, current: index === trade.stage }]"><i />{{ step }}</span></div><button class="record-button" type="button" @click="openNote(trade)"><el-icon><EditPen /></el-icon>{{ notes[trade.id] ? '已记录' : '记录判断' }}</button><button class="share-button" type="button" aria-label="分享卡片"><el-icon><Share /></el-icon></button></div>
        </div>
      </article>
    </section>
    <section v-else class="empty-results"><span class="empty-icon"><el-icon><Search /></el-icon></span><strong>没有找到匹配的组合</strong><p>调整筛选状态或搜索条件后再查看。</p><button type="button" @click="resetFilters">重置筛选</button></section>

    <section class="lower-grid">
      <article class="bottom-panel week-panel">
        <div class="bottom-heading"><div><span class="bottom-kicker">THIS WEEK</span><h2>本周活动</h2></div><span class="week-date">10/12 — 10/16</span></div>
        <div class="week-days"><div v-for="day in weekDays" :key="day.name" :class="['week-day', { today: day.today }]"><span>{{ day.name }}</span><strong>{{ day.count }}</strong><i /></div></div>
        <div class="week-stats"><div><span>新信号</span><strong>—</strong></div><div><span>保护提醒</span><strong class="orange-text">—</strong></div><div><span>管理更新</span><strong>—</strong></div><div><span>止盈止损</span><strong class="green-text">—</strong></div></div>
      </article>
      <article class="bottom-panel watch-panel">
        <div class="bottom-heading"><div><span class="bottom-kicker">POSITION WATCH</span><h2>关注中的标的</h2></div><span class="watch-count">{{ watchedSymbols.length }} 个</span></div>
        <div class="watch-list"><div v-for="item in watchedSymbols" :key="item.symbol" class="watch-row"><span class="watch-symbol">{{ item.symbol }}</span><span class="watch-type">{{ item.type }}</span><span class="watch-position">{{ item.position }}</span><span :class="['watch-move', item.tone]">{{ item.move }}</span></div></div>
        <div class="watch-foot"><el-icon><InfoFilled /></el-icon>列表为页面示例，不含账户或行情同步</div>
      </article>
    </section>

    <section class="risk-note"><span class="risk-icon"><el-icon><Warning /></el-icon></span><div><strong>交易风险提示</strong><p>期权策略可能导致本金损失。此页面仅演示界面结构，提醒信息不代表自动交易或个性化投资建议。</p></div></section>

    <el-dialog v-model="noteDialogVisible" title="记录我的判断" width="min(440px, calc(100vw - 32px))" class="note-dialog">
      <div class="dialog-trade"><span class="dialog-symbol">{{ activeTrade?.symbol }}</span><span>{{ activeTrade?.strategy }} · {{ activeTrade?.legs }}</span></div>
      <el-input v-model="noteText" type="textarea" :rows="4" placeholder="记录观察、计划或复盘要点（仅保存在当前页面）" />
      <template #footer><el-button @click="noteDialogVisible = false">取消</el-button><el-button type="primary" @click="saveNote">保存到本页</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowDown, Calendar, Clock, Connection, EditPen, InfoFilled, Search, Share, Sort, Warning } from '@element-plus/icons-vue'

const selectedFilter = ref('open')
const searchText = ref('')
const sortBy = ref('updated')
const groupBy = ref('sent')
const noteDialogVisible = ref(false)
const activeTrade = ref(null)
const noteText = ref('')
const notes = ref({})
const lifecycle = ['发报', '保护窗口', '动态管理', '到期结算']

const trades = [
  { id: 1, symbol: 'DEMO', group: '第 3 组', strategy: '卖方看跌价差', side: 'put', subtitle: '演示组合 · 核心档', time: '10:32', legs: '卖 $100P / 买 $95P', expiry: '10/23', credit: '$150', pnl: '+$24', pnlTone: 'positive', width: '$5', days: 7, distance: '+3.2%', distanceTone: 'positive', riskReward: '1:2.3', maxRisk: '$350', statusLabel: '进行中', statusTone: 'blue', status: 'open', stage: 0, management: null },
  { id: 2, symbol: 'SAMP', group: '第 1 组', strategy: '卖方看涨价差', side: 'call', subtitle: '演示组合 · 风险观察', time: '09:48', legs: '卖 $120C / 买 $125C', expiry: '10/21', credit: '$135', pnl: '−$18', pnlTone: 'negative', width: '$5', days: 5, distance: '−1.1%', distanceTone: 'negative', riskReward: '1:2.7', maxRisk: '$365', statusLabel: '保护窗口', statusTone: 'orange', status: 'protection', stage: 1, management: { title: '保护窗口开启', description: '此处展示保护动作与复核提醒', value: '待确认' } },
  { id: 3, symbol: 'TEST', group: '第 2 组', strategy: '卖方看跌价差', side: 'put', subtitle: '演示组合 · 动态管理', time: '09:15', legs: '卖 $80P / 买 $75P', expiry: '10/30', credit: '$210', pnl: '+$62', pnlTone: 'positive', width: '$5', days: 14, distance: '+5.6%', distanceTone: 'positive', riskReward: '1:1.8', maxRisk: '$290', statusLabel: '动态管理', statusTone: 'green', status: 'management', stage: 2, management: { title: '管理计划已更新', description: '止盈、止损与保护记录会显示在此处', value: '演示记录' } },
  { id: 4, symbol: 'MOCK', group: '', strategy: '买方看涨价差', side: 'call', subtitle: '演示组合 · 已到期样例', time: '昨日', legs: '买 $50C / 卖 $55C', expiry: '10/15', credit: '$80', pnl: '+$36', pnlTone: 'positive', width: '$5', days: 0, distance: '+4.0%', distanceTone: 'positive', riskReward: '1:1.6', maxRisk: '$80', statusLabel: '已到期', statusTone: 'muted', status: 'expired', stage: 3, management: null },
  { id: 5, symbol: 'SAMPLE', group: '', strategy: '卖方看跌价差', side: 'put', subtitle: '历史演示组合', time: '10/14', legs: '卖 $70P / 买 $65P', expiry: '10/21', credit: '$125', pnl: '−$12', pnlTone: 'negative', width: '$5', days: 5, distance: '+0.8%', distanceTone: 'orange-text', riskReward: '1:2.4', maxRisk: '$375', statusLabel: '历史信号', statusTone: 'muted', status: 'history', stage: 2, management: null }
]
const filters = [
  { key: 'open', label: '进行中', count: '01' },
  { key: 'protection', label: '保护窗口', count: '01' },
  { key: 'management', label: '动态管理', count: '01' },
  { key: 'expired', label: '已到期', count: '01' },
  { key: 'history', label: '历史信号', count: '01' }
]
const visibleTrades = computed(() => {
  const query = searchText.value.trim().toLowerCase()
  let result = trades.filter(trade => trade.status === selectedFilter.value)
  if (query) result = result.filter(trade => `${trade.symbol} ${trade.strategy} ${trade.legs}`.toLowerCase().includes(query))
  if (sortBy.value === 'pnl') result = [...result].sort((a, b) => parsePnl(b.pnl) - parsePnl(a.pnl))
  if (sortBy.value === 'expiry') result = [...result].sort((a, b) => a.days - b.days)
  return result
})
function parsePnl(value) { return Number(value.replace(/[^\d.-]/g, '')) * (value.includes('−') ? -1 : 1) }
function resetFilters() { selectedFilter.value = 'open'; searchText.value = ''; sortBy.value = 'updated' }
function openNote(trade) { activeTrade.value = trade; noteText.value = notes.value[trade.id] || ''; noteDialogVisible.value = true }
function saveNote() {
  if (activeTrade.value) notes.value[activeTrade.value.id] = noteText.value.trim()
  noteDialogVisible.value = false
}

const weekDays = [
  { name: '一', count: '—' }, { name: '二', count: '—' }, { name: '三', count: '—' }, { name: '四', count: '—', today: true }, { name: '五', count: '—' }
]
const watchedSymbols = [
  { symbol: 'DEMO', type: '盘前', position: '1 组组合', move: '—', tone: 'neutral' },
  { symbol: 'SAMP', type: '盘前', position: '1 组组合', move: '—', tone: 'neutral' },
  { symbol: 'TEST', type: '盘前', position: '1 组组合', move: '—', tone: 'neutral' }
]
</script>

<style scoped>
.active-page{--ink:#1d3858;--muted:#8798ac;--line:#e7edf4;color:var(--ink)}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:1px 0 18px}.eyebrow{display:flex;align-items:center;gap:8px;color:#5284b7;font-size:10px;font-weight:750;letter-spacing:1.1px}.eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#5799d4;box-shadow:0 0 0 4px #5799d41b}.page-heading h1{margin:7px 0 4px;color:#19395f;font-size:27px;line-height:1.15;letter-spacing:-.4px}.page-heading p{margin:0;color:#8999ab;font-size:11px}.heading-tools{display:flex;align-items:center;gap:8px}.demo-pill,.sync-pill{display:flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:#fff;color:#8293a7;font-size:9px;white-space:nowrap}.demo-pill i{width:6px;height:6px;border-radius:50%;background:#80a9d4}.sync-pill .el-icon{color:#91a6bc}
.filter-panel,.trade-card,.bottom-panel{background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 3px 14px #233e5b08}.filter-panel{margin-bottom:14px;padding:14px 16px 0}.filter-heading{display:flex;align-items:center;gap:8px;margin-bottom:10px}.filter-title{color:#526c88;font-size:11px;font-weight:700}.filter-tip{color:#a4afbc;font-size:9px}.filter-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.filter-tabs{display:flex;align-items:center;gap:3px;overflow:auto}.filter-tab{display:flex;align-items:center;gap:7px;padding:8px 9px;border:0;border-radius:7px;background:transparent;color:#7b8da2;font-size:10px;white-space:nowrap;cursor:pointer}.filter-tab:hover{background:#f6f9fc}.filter-tab.active{background:#edf5ff;color:#2d73ba;font-weight:700}.filter-count{color:#a6b2c1;font-size:8px}.filter-tab.active .filter-count{color:#5f91c7}.filter-tools{display:flex;align-items:center;gap:7px;flex:none}.search-input{width:170px}.search-input :deep(.el-input__wrapper){height:30px;border-radius:7px;box-shadow:0 0 0 1px #e8edf3 inset}.search-input :deep(.el-input__inner){font-size:9px}.search-input :deep(.el-input__prefix){color:#9aabbd}.sort-select{height:30px;display:flex;align-items:center;gap:6px;padding:0 8px;border:1px solid #e8edf3;border-radius:7px;color:#8a9bad;font-size:9px}.sort-select select{max-width:80px;border:0;outline:0;background:transparent;color:#6e8198;font:inherit;cursor:pointer}.list-options{display:flex;align-items:center;gap:10px;margin-top:10px;padding:9px 0;border-top:1px solid #eff3f7}.sort-tabs{display:flex;gap:3px}.sort-tabs button{padding:5px 7px;border:0;border-radius:5px;background:transparent;color:#8d9bad;font-size:9px;cursor:pointer}.sort-tabs button.active{background:#f1f6fc;color:#467fb7;font-weight:700}.sort-hint{color:#a3afbc;font-size:8px}.read-only-note{display:flex;align-items:center;gap:5px;margin-left:auto;color:#a0adbb;font-size:8px}.read-only-note .el-icon{color:#86a8ca}
.trade-feed{display:flex;flex-direction:column;gap:9px}.day-divider{display:flex;align-items:center;gap:10px;margin:3px 2px 1px;color:#8495a9;font-size:9px;font-weight:650}.day-divider i{height:1px;flex:1;background:#e7edf4}.trade-card{overflow:hidden;padding:14px 15px 11px;transition:box-shadow .18s,border-color .18s}.trade-card:hover{border-color:#d4e3f2;box-shadow:0 6px 18px #244e7611}.trade-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.symbol-block{display:flex;align-items:center;gap:9px;min-width:0}.symbol-avatar{width:32px;height:32px;flex:none;display:grid;place-items:center;border-radius:9px;background:linear-gradient(145deg,#edf5ff,#e3effd);color:#3476b7;font-size:14px;font-weight:750}.symbol-line{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.symbol-line>strong{color:#244567;font-size:13px}.symbol-line>span{color:#9aa8b7;font-size:9px}.strategy-tag{padding:4px 6px;border-radius:5px;background:#f0f5fb;color:#6584a4!important;font-size:8px!important}.strategy-tag.put{background:#edf5ff;color:#4b80b7!important}.strategy-tag.call{background:#f3efff;color:#8270b5!important}.trade-subtitle{margin-top:3px;color:#a1adba;font-size:8px}.trade-head-right{display:flex;align-items:center;gap:10px}.risk-badge{display:flex;align-items:center;gap:5px;padding:5px 7px;border-radius:999px;background:#edf5ff;color:#4b80b8;font-size:8px;white-space:nowrap}.risk-badge i{width:5px;height:5px;border-radius:50%;background:currentColor}.risk-badge.orange{background:#fff6e9;color:#c58b46}.risk-badge.green{background:#edf8f2;color:#4c9b73}.risk-badge.muted{background:#f3f5f7;color:#8492a2}.sent-time{display:flex;align-items:center;gap:4px;color:#9eabb9;font-size:8px;white-space:nowrap}.contract-line{display:flex;align-items:center;gap:10px;margin:12px 0 11px;padding:9px 10px;border-radius:8px;background:#f8fafd}.contract-side{color:#425f7e;font-size:10px;font-weight:650}.contract-expiry{display:flex;align-items:center;gap:4px;color:#8b9caf;font-size:8px}.contract-expiry .el-icon{color:#91a9c3}.credit-pill{margin-left:auto;color:#95a3b2;font-size:8px;white-space:nowrap}.credit-pill strong{margin-left:3px;color:#4e7397;font-size:10px}.metrics-row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;border:1px solid #edf1f5;border-radius:8px}.trade-metric{display:flex;flex-direction:column;gap:5px;padding:8px 10px;border-right:1px solid #edf1f5}.trade-metric:last-child{border-right:0}.trade-metric span{color:#9aa8b6;font-size:8px;white-space:nowrap}.trade-metric strong{color:#506983;font-size:11px;font-weight:700}.trade-metric strong.positive{color:#258b68}.trade-metric strong.negative{color:#cf6666}.trade-metric strong.orange-text{color:#c78b3f}.management-alert{display:flex;align-items:center;gap:8px;margin-top:9px;padding:8px 9px;border:1px solid #f5e8d2;border-radius:7px;background:#fffaf2}.management-icon{color:#d09a4c;font-size:13px}.management-alert>div{display:flex;align-items:center;gap:7px;min-width:0;flex:1}.management-alert strong{color:#a47b42;font-size:9px;white-space:nowrap}.management-alert>div span{overflow:hidden;color:#ac9b7e;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.management-value{padding:4px 6px;border-radius:4px;background:#fff2dd;color:#bb8744;font-size:8px;white-space:nowrap}.lifecycle-row{display:flex;align-items:center;gap:9px;margin-top:10px}.lifecycle-label{color:#a0adbb;font-size:8px;white-space:nowrap}.lifecycle-track{display:flex;align-items:center;flex:1;max-width:390px}.lifecycle-step{position:relative;display:flex;align-items:center;gap:4px;flex:1;color:#a5b0bd;font-size:8px;white-space:nowrap}.lifecycle-step:not(:last-child):after{height:1px;content:'';flex:1;margin:0 5px;background:#e7edf3}.lifecycle-step i{width:6px;height:6px;flex:none;border-radius:50%;background:#d8e0e9}.lifecycle-step.complete{color:#6e93b8}.lifecycle-step.complete i,.lifecycle-step.current i{background:#5a97d2}.lifecycle-step.current{color:#3979b9;font-weight:700}.lifecycle-step.current:not(:last-child):after{background:#bfd5eb}.record-button,.share-button{display:flex;align-items:center;justify-content:center;gap:5px;height:27px;padding:0 8px;border:1px solid #e6edf4;border-radius:6px;background:#fff;color:#7188a0;font-size:8px;cursor:pointer;white-space:nowrap}.record-button:hover,.share-button:hover{border-color:#c7dcef;color:#3477b8}.share-button{width:27px;padding:0;font-size:11px}
.empty-results{display:flex;align-items:center;justify-content:center;flex-direction:column;min-height:240px;border:1px dashed #dfe8f1;border-radius:12px;background:#fbfdff;text-align:center}.empty-icon{width:39px;height:39px;display:grid;place-items:center;margin-bottom:9px;border-radius:12px;background:#edf5ff;color:#77a0ca;font-size:16px}.empty-results strong{color:#5c7390;font-size:11px}.empty-results p{margin:5px 0 10px;color:#9ba9b8;font-size:9px}.empty-results button{border:0;background:transparent;color:#3d7fbd;font-size:9px;cursor:pointer}.lower-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.bottom-panel{padding:14px 15px}.bottom-heading{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:11px}.bottom-kicker{color:#86a2bd;font-size:8px;font-weight:750;letter-spacing:1px}.bottom-heading h2{margin:4px 0 0;color:#385676;font-size:12px}.week-date,.watch-count{padding:5px 7px;border-radius:5px;background:#f5f8fb;color:#96a5b5;font-size:8px}.week-days{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.week-day{display:flex;align-items:center;flex-direction:column;gap:5px;padding:8px 4px;border:1px solid #edf1f5;border-radius:7px;color:#9aa8b7;font-size:8px}.week-day strong{color:#58728e;font-size:11px}.week-day i{width:4px;height:4px;border-radius:50%;background:#c8d5e2}.week-day.today{border-color:#d9e8f7;background:#f4f9ff;color:#4780b8}.week-day.today strong{color:#3477b8}.week-day.today i{background:#4a91d1}.week-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #eff3f7}.week-stats>div{display:flex;flex-direction:column;gap:4px}.week-stats span{color:#9ba9b7;font-size:8px}.week-stats strong{color:#55718f;font-size:11px}.week-stats .orange-text{color:#c89248}.week-stats .green-text{color:#429b75}.watch-list{display:flex;flex-direction:column}.watch-row{display:grid;grid-template-columns:52px 45px 1fr auto;align-items:center;gap:7px;padding:8px 2px;border-top:1px solid #f0f3f6}.watch-symbol{color:#496987;font-size:9px;font-weight:700}.watch-type,.watch-position{color:#9ba8b7;font-size:8px}.watch-move{color:#8fa1b4;font-size:8px}.watch-move.positive{color:#328c6c}.watch-move.negative{color:#cf6868}.watch-foot{display:flex;align-items:center;gap:5px;margin-top:5px;color:#a4afbc;font-size:8px}.watch-foot .el-icon{color:#8caaca}.risk-note{display:flex;align-items:flex-start;gap:9px;margin-top:13px;padding:11px 13px;border:1px solid #f1e7d7;border-radius:9px;background:#fffaf2}.risk-icon{margin-top:1px;color:#d29a4c;font-size:14px}.risk-note strong{color:#9e7b4a;font-size:9px}.risk-note p{margin:4px 0 0;color:#a28d6d;font-size:8px;line-height:1.5}.dialog-trade{display:flex;align-items:center;gap:8px;margin-bottom:11px;color:#8192a5;font-size:9px}.dialog-symbol{padding:5px 7px;border-radius:5px;background:#edf5ff;color:#3b79b8;font-size:10px;font-weight:700}.note-dialog :deep(.el-textarea__inner){font-size:11px}.note-dialog :deep(.el-button){border-radius:7px}
@media(max-width:900px){.filter-row{align-items:flex-start;flex-direction:column}.filter-tools{width:100%;justify-content:flex-end}.search-input{flex:1;max-width:250px}.metrics-row{grid-template-columns:repeat(3,minmax(0,1fr))}.trade-metric:nth-child(3){border-right:0}.trade-metric:nth-child(-n+3){border-bottom:1px solid #edf1f5}.trade-metric:nth-child(4){border-right:1px solid #edf1f5}.lower-grid{grid-template-columns:1fr}}
@media(max-width:620px){.page-heading{align-items:flex-start;flex-direction:column;gap:11px}.heading-tools{width:100%;justify-content:flex-start}.filter-panel{padding:12px 12px 0}.filter-tabs{width:100%;padding-bottom:2px}.filter-tab{padding:8px 7px;font-size:9px}.filter-tools{justify-content:stretch}.search-input{max-width:none}.list-options{gap:6px;flex-wrap:wrap}.read-only-note{width:100%;margin:1px 0 0}.trade-card{padding:12px 11px 10px}.trade-heading{align-items:flex-start}.trade-head-right{align-items:flex-end;flex-direction:column;gap:5px}.symbol-avatar{width:29px;height:29px}.symbol-line{gap:5px}.symbol-line>strong{font-size:12px}.contract-line{flex-wrap:wrap;gap:6px;padding:8px}.contract-side{width:100%;font-size:9px}.credit-pill{margin-left:auto}.metrics-row{grid-template-columns:repeat(3,minmax(0,1fr))}.trade-metric{padding:7px 8px}.lifecycle-row{flex-wrap:wrap}.lifecycle-label{width:100%}.lifecycle-track{order:2;flex-basis:100%;max-width:none;margin:3px 0}.record-button{margin-left:auto}.management-alert>div{align-items:flex-start;flex-direction:column;gap:3px}.lower-grid{gap:9px}.bottom-panel{padding:12px}.week-stats{grid-template-columns:repeat(2,1fr);row-gap:9px}}
@media(max-width:380px){.filter-tab{gap:4px;padding:7px 5px;font-size:8px}.filter-count{font-size:7px}.sort-select{gap:4px;padding:0 5px}.sort-select select{max-width:67px}.trade-metric{padding:7px 6px}.trade-metric span{font-size:7px}.trade-metric strong{font-size:10px}.sent-time{font-size:7px}.risk-badge{font-size:7px}}
</style>
