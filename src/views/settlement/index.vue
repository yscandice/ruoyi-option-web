<template>
  <div class="settlement-page">
    <section class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-dot" />SETTLED · TRADE REVIEW</div>
        <h1>结算<DataViewTag resource="settlement" /></h1>
        <p>已了结的每一笔，连同保护、加腿与平仓过程，集中回看。进行与跟踪只管还开着的仓位。</p>
      </div>
      <span class="demo-badge"><i />{{ syncBadge }}</span>
    </section>

    <DelayedEmpty v-if="dataView.empty" resource="settlement" />
    <section v-if="!dataView.empty" class="settlement-summary">
      <div class="summary-heading"><div><span class="summary-kicker">SETTLEMENT OVERVIEW</span><h2>结算统计</h2></div><span class="period-label"><el-icon><Calendar /></el-icon>{{ stats ? `已结算 ${stats.settledCount} 笔` : '全部已结算' }}</span></div>
      <div class="summary-grid">
        <article class="summary-card primary-stat"><div class="summary-label"><span class="stat-icon blue"><el-icon><Wallet /></el-icon></span><span>结算盈亏</span><el-icon class="info-icon"><InfoFilled /></el-icon></div><strong :class="toneOf(stats?.settledPnlUsd)">{{ signedUsd(stats?.settledPnlUsd) }}</strong><small>{{ stats ? `这 ${stats.settledCount} 笔实际拿到的钱（管理执行之后）` : '已结算交易的实际净结果' }}</small></article>
        <article class="summary-card"><div class="summary-label"><span class="stat-icon slate"><el-icon><ScaleToOriginal /></el-icon></span><span>管理前对照</span><el-icon class="info-icon"><InfoFilled /></el-icon></div><strong>{{ signedUsd(stats?.rawPnlUsd) }}</strong><small>{{ stats ? `同样 ${stats.rawPriced} 笔不做任何管理、持有到期的估算` : '不做管理、持有到期的估算对照' }}</small></article>
        <article class="summary-card"><div class="summary-label"><span class="stat-icon green"><el-icon><TrendCharts /></el-icon></span><span>管理净贡献</span><el-icon class="info-icon"><InfoFilled /></el-icon></div><strong :class="toneOf(stats?.manageNetUsd) || 'neutral'">{{ signedUsd(stats?.manageNetUsd) }}</strong><small>上面两个数的差 —— 动态管理这件事赚到的钱</small></article>
        <article class="summary-card"><div class="summary-label"><span class="stat-icon orange"><el-icon><Umbrella /></el-icon></span><span>保护成本</span><el-icon class="info-icon"><InfoFilled /></el-icon></div><strong>{{ plainUsd(stats?.protectionCostUsd) }}</strong><small>{{ stats ? `${stats.protectionPriced} / ${stats.protectionTotal} 条保护有定价` : '保护腿支出汇总' }}</small></article>
        <article class="summary-card"><div class="summary-label"><span class="stat-icon purple"><el-icon><Operation /></el-icon></span><span>动态管理成本</span><el-icon class="info-icon"><InfoFilled /></el-icon></div><strong>{{ plainUsd(stats?.manageCostUsd) }}</strong><small>{{ stats ? `收入 ${signedUsd(stats.manageCreditUsd)} · ${stats.managePriced} / ${stats.manageTotal} 张有定价` : '移仓与平仓的费用汇总' }}</small></article>
      </div>
      <p class="summary-note"><el-icon><InfoFilled /></el-icon>结算统计基于已了结组合；管理前对照仅用于观察，不等同于可实现的实际收益。</p>
    </section>

    <section v-if="!dataView.empty" class="records-section">
      <div class="records-heading"><div><span class="section-kicker">CLOSED POSITIONS</span><h2>结算记录</h2><p>结算结果、原策略对照与风险管理过程</p></div><span class="record-count">{{ allRecords.length }} 条记录</span></div>
      <div class="records-toolbar">
        <div class="control-block">
          <span class="control-label">排序</span>
          <div class="sort-toggle"><button :class="{ active: sortBy === 'settled' }" @click="sortBy = 'settled'"><el-icon><Calendar /></el-icon>按结算日</button><button :class="{ active: sortBy === 'issued' }" @click="sortBy = 'issued'"><el-icon><Clock /></el-icon>按发报日</button></div>
        </div>
        <div class="control-block range-block">
          <span class="control-label">区间</span>
          <div class="range-tabs"><button v-for="item in ranges" :key="item.key" :class="{ active: selectedRange === item.key }" @click="selectedRange = item.key">{{ item.label }}</button></div>
          <div v-if="selectedRange === 'custom'" class="custom-range"><input v-model="customFrom" type="date" aria-label="起始日"/><em>→</em><input v-model="customTo" type="date" aria-label="截止日"/></div>
        </div>
        <label class="search-box"><el-icon><Search /></el-icon><input v-model="searchText" placeholder="搜索标的" aria-label="搜索结算标的"/><button v-if="searchText" type="button" aria-label="清除搜索" @click="searchText = ''">×</button></label>
      </div>
      <div class="records-caption"><span>按{{ sortBy === 'issued' ? '发报' : '结算' }}日期归档{{ rangeText }}</span><span><strong>{{ filteredRecords.length }}</strong> / {{ allRecords.length }} 条 <i class="demo-mark"/></span></div>

      <div v-if="!ready" class="empty-state">
        <span class="empty-icon"><el-icon><component :is="loading ? Loading : Document" :class="{ spinning: loading }" /></el-icon></span>
        <strong>{{ loading ? '正在读取结算账…' : '暂无数据' }}</strong>
        <p>{{ loading ? '正在从本地服务读取 OSM 同步的结算数据' : (error || '后端定时任务尚未同步结算菜单的数据，请稍后刷新。') }}</p>
        <span v-if="!loading && !error" class="deploy-tip"><i />首次部署请由管理员在若依后台「系统监控 → 定时任务」对「OSM结算菜单强制同步」执行一次</span>
        <button v-if="!loading" type="button" @click="loadAll">重新加载</button>
      </div>
      <div v-else-if="!allRecords.length && selectedRange === 'all'" class="empty-state"><span class="empty-icon"><el-icon><Document /></el-icon></span><strong>还没有已结算的记录</strong><p>一笔到期结算、或被止盈/止损了结之后，它会从进行与跟踪里移到这里。</p></div>
      <div v-else-if="pageRecords.length" :class="['records-list', { 'is-loading': loading }]">
        <template v-for="(record, index) in pageRecords" :key="record.id">
          <div v-if="index === 0 || record.groupDay !== pageRecords[index - 1].groupDay" class="date-divider"><span>{{ record.groupDay }} {{ sortBy === 'issued' ? '发报' : '结算' }}</span><i/></div>
          <article class="settlement-card">
            <div class="record-main">
              <div class="record-top">
                <div class="record-identity"><span :class="['result-symbol', record.resultTone]"><el-icon><component :is="record.isRoll ? Refresh : Check" /></el-icon></span><div class="identity-copy"><div class="identity-title"><strong>{{ record.kind }}</strong><span class="open-date">{{ record.openDate }}{{ record.time ? ` · ${record.time} ET` : '' }} 发报</span><span v-if="record.group" class="group-label">{{ record.group }}</span></div><div class="symbol-line"><b>{{ record.symbol }}</b><span>{{ record.strategy }}</span></div></div></div>
                <div class="result-value"><span>{{ record.resultLabel }}</span><strong :class="record.resultTone">{{ record.net }}</strong></div>
              </div>

              <div class="contract-strip"><span class="contract-icon"><el-icon><Tickets /></el-icon></span><strong>{{ record.legs }}</strong><span class="expiry-label">到期 {{ record.expiry }} · {{ record.settledDay }} 结算</span><span :class="['closed-label', record.resultTone]">{{ record.closeLabel }}</span></div>

              <div v-if="record.isRoll" class="roll-note"><el-icon><Refresh /></el-icon><span>{{ record.rollDescription }}</span><strong v-if="record.cumulative">累计净收 {{ record.cumulative }}</strong></div>
              <div v-if="record.settle" class="roll-note settle-note"><el-icon><Tickets /></el-icon><span>{{ record.settle.left }}</span><strong>{{ record.settle.right }}</strong></div>

              <div class="comparison-row">
                <div class="comparison-card actual"><span class="comparison-title"><i/>{{ record.netLabel }}</span><strong :class="record.finalTone">{{ record.final }}</strong><small>已结算结果</small></div>
                <div class="comparison-arrow"><el-icon><Right /></el-icon></div>
                <div class="comparison-card baseline"><span class="comparison-title"><i/>{{ record.baselineLabel }}</span><strong :class="record.baselineTone">{{ record.baseline }}</strong><small>假设持有至到期</small></div>
                <div class="contribution-chip"><span>管理净贡献</span><strong :class="record.contributionTone">{{ record.contribution }}</strong></div>
              </div>

              <div class="detail-metrics">
                <div><span>持有</span><strong>{{ record.holding }}</strong></div>
                <div><span>保护窗口</span><strong>{{ record.protectionCount }}</strong></div>
                <div><span>入场权利金</span><strong>{{ record.premium }}</strong></div>
                <div><span>最大风险</span><strong>{{ record.maxRisk }}</strong></div>
              </div>

              <div class="lifecycle"><span class="lifecycle-label">生命周期</span><div class="lifecycle-track"><span class="done"><i/>发报</span><i class="connector done-line"/><span :class="record.protected ? 'done' : 'skipped'"><i/>保护窗口</span><i :class="['connector', record.protected ? 'done-line' : '']"/><span :class="record.managed ? 'done' : 'skipped'"><i/>动态管理</span><i :class="['connector', record.managed ? 'done-line' : '']"/><span class="current"><i/>结算</span></div><span class="demo-type">{{ record.trail }}</span></div>
            </div>
          </article>
        </template>
      </div>
      <div v-else class="empty-state"><span class="empty-icon"><el-icon><Document /></el-icon></span><strong>没有匹配的结算记录</strong><p>这个区间里没有已结算的记录，换个区间或标的看看。</p><button type="button" @click="resetFilters">清除筛选</button></div>

      <div class="records-footer"><span><el-icon><InfoFilled /></el-icon>数据来自 OSM 结算页定时同步；盈亏为系统按中间价记账的参考结果，不代表真实账户结算。</span><div class="pagination"><button :disabled="page <= 1" @click="page -= 1">上一页</button><span>{{ page }} / {{ pageCount }}</span><button :disabled="page >= pageCount" @click="page += 1">下一页</button></div></div>
    </section>

    <section class="risk-note"><span class="risk-icon"><el-icon><Warning /></el-icon></span><div><strong>结算口径说明</strong><p>“管理前对照”是基于原始策略的估算参考；实际结算需以合约成交、费用和券商账单为准。</p></div></section>
  </div>
</template>

<script setup>
import DataViewTag from '@/components/option/DataViewTag.vue'
import DelayedEmpty from '@/components/option/DelayedEmpty.vue'
import { useDataView } from '@/utils/accessStore'
import { computed, onMounted, ref, watch } from 'vue'
import { Calendar, Check, Clock, Document, InfoFilled, Loading, Operation, Refresh, Right, ScaleToOriginal, Search, Tickets, TrendCharts, Umbrella, Wallet, Warning } from '@element-plus/icons-vue'
import { getSettlementKind, getSettlementSummary } from '@/api/option/settlement'
import { indexCards, plainUsd, recordParams, signedUsd, toneOf, toRecord } from '@/utils/settlementData'

// 盘后版：标题旁标签 / 尚未放出空状态（W4）
const dataView = useDataView('settlement')

const PAGE_SIZE = 20
const ranges = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
  { key: 'custom', label: '自定义' }
]

const summary = ref(null)
const recordBody = ref(null)
const cardMap = ref(new Map())
const loading = ref(false)
const error = ref('')
const selectedRange = ref('all')
const sortBy = ref('settled')
const customFrom = ref('')
const customTo = ref('')
const searchText = ref('')
const page = ref(1)

const ready = computed(() => !!summary.value && !!recordBody.value)
const stats = computed(() => summary.value?.stats || null)
const syncBadge = computed(() => {
  if (!summary.value) return loading.value ? '正在加载' : '暂无同步数据'
  const t = String(summary.value.syncTime || '').match(/\d{4}-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/)
  return `OSM 同步数据${t ? ` · ${t[1]}/${t[2]} ${t[3]}` : ''}`
})
const rangeText = computed(() => {
  const b = recordBody.value
  return b?.from && b?.to ? ` · ${b.from} — ${b.to}` : ''
})
const allRecords = computed(() => (recordBody.value?.items || []).map(item => toRecord(item, cardMap.value)))
const filteredRecords = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return allRecords.value
  return allRecords.value.filter(r => `${r.symbol} ${r.company}`.toLowerCase().includes(q))
})
const pageCount = computed(() => Math.max(1, Math.ceil(filteredRecords.value.length / PAGE_SIZE)))
const pageRecords = computed(() => filteredRecords.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

async function loadRecords() {
  if (selectedRange.value === 'custom' && !customFrom.value && !customTo.value) return
  recordBody.value = await getSettlementKind('record', recordParams(selectedRange.value, sortBy.value, customFrom.value, customTo.value))
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [sum, cards] = await Promise.all([getSettlementSummary(), getSettlementKind('card').catch(() => null)])
    summary.value = sum
    cardMap.value = indexCards(cards?.items)
    await loadRecords()
  } catch (e) {
    const message = e?.message || '加载失败'
    error.value = /暂无数据/.test(message) ? '' : message
    summary.value = null
  } finally {
    loading.value = false
  }
}

watch([selectedRange, sortBy, customFrom, customTo], async () => {
  page.value = 1
  if (!summary.value) return
  loading.value = true
  try { await loadRecords() } catch (e) { error.value = e?.message || '加载失败' } finally { loading.value = false }
})
watch(searchText, () => { page.value = 1 })

function resetFilters() {
  selectedRange.value = 'all'
  customFrom.value = ''
  customTo.value = ''
  searchText.value = ''
}

onMounted(loadAll)
</script>

<style scoped>
.settlement-page{--ink:#1d3858;--line:#e7edf4;--muted:#8798ac;color:var(--ink)}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:15px;margin:1px 0 16px}.eyebrow{display:flex;align-items:center;gap:7px;color:#5683b2;font-size:9px;font-weight:750;letter-spacing:1.15px}.eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#4c90ce;box-shadow:0 0 0 4px #4c90ce1c}.page-heading h1{margin:7px 0 4px;color:#19395f;font-size:27px;line-height:1.15;letter-spacing:-.4px}.page-heading p{margin:0;color:#8797aa;font-size:11px}.demo-badge{display:flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:#fff;color:#8394a7;font-size:9px;white-space:nowrap}.demo-badge i{width:6px;height:6px;border-radius:50%;background:#7fa8d1}
.settlement-summary,.records-section{background:#fff;border:1px solid var(--line);border-radius:13px;box-shadow:0 4px 16px #233e5b08}.settlement-summary{margin-bottom:13px;padding:15px}.summary-heading{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:13px}.summary-kicker,.section-kicker{display:block;color:#8ba2b9;font-size:8px;font-weight:750;letter-spacing:1px}.summary-heading h2,.records-heading h2{margin:4px 0 0;color:#345372;font-size:13px}.period-label{display:flex;align-items:center;gap:5px;padding:5px 7px;border-radius:6px;background:#f4f8fc;color:#7894af;font-size:8px}.summary-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.summary-card{min-width:0;padding:11px 12px;border:1px solid #ebf0f5;border-radius:9px;background:#fcfdff}.summary-card.primary-stat{background:linear-gradient(145deg,#f6faff,#fff);border-color:#e0ebf7}.summary-label{display:flex;align-items:center;gap:6px;color:#788ba1;font-size:9px;white-space:nowrap}.stat-icon{width:23px;height:23px;flex:none;display:grid;place-items:center;border-radius:7px;font-size:12px}.stat-icon.blue{background:#eaf3fd;color:#4484c2}.stat-icon.slate{background:#f0f3f7;color:#788da4}.stat-icon.green{background:#eaf7f0;color:#4b9a75}.stat-icon.orange{background:#fff4e6;color:#cb9149}.stat-icon.purple{background:#f2effb;color:#887bb5}.info-icon{margin-left:auto;color:#c1ccd8;font-size:10px}.summary-card>strong{display:block;margin:10px 0 4px;color:#506b88;font-size:19px;line-height:1}.summary-card>strong.neutral{color:#778da3}.summary-card>small{display:block;overflow:hidden;color:#9aa8b7;font-size:7px;line-height:1.45;text-overflow:ellipsis;white-space:nowrap}.summary-note{display:flex;align-items:flex-start;gap:5px;margin:10px 1px 0;color:#9ca9b7;font-size:8px;line-height:1.5}.summary-note .el-icon{margin-top:1px;color:#8ca9c7}
.records-section{overflow:hidden}.records-heading{display:flex;align-items:flex-end;justify-content:space-between;padding:16px 17px 12px}.records-heading h2{font-size:14px}.records-heading p{margin:5px 0 0;color:#98a6b6;font-size:9px}.record-count{padding:5px 7px;border-radius:6px;background:#f3f6f9;color:#8b9bad;font-size:8px}.records-toolbar{display:flex;align-items:center;gap:17px;padding:10px 17px;border-top:1px solid #f0f3f6;border-bottom:1px solid #edf1f5;background:#fcfdff}.control-block{display:flex;align-items:center;gap:7px}.control-label{color:#9ba8b6;font-size:8px}.sort-toggle,.range-tabs{display:flex;align-items:center;gap:3px}.sort-toggle button,.range-tabs button{display:flex;align-items:center;gap:5px;padding:6px 8px;border:0;border-radius:6px;background:transparent;color:#8394a8;font-size:8px;white-space:nowrap;cursor:pointer}.sort-toggle button:hover,.range-tabs button:hover{background:#f2f6fa}.sort-toggle button.active,.range-tabs button.active{background:#edf5ff;color:#3478bc;font-weight:700}.range-block{margin-left:auto}.search-box{height:29px;min-width:145px;display:flex;align-items:center;gap:6px;padding:0 8px;border:1px solid #e8edf3;border-radius:7px;background:#fff;color:#a0afbe}.search-box .el-icon{font-size:11px}.search-box input{width:100%;min-width:40px;border:0;outline:0;background:transparent;color:#506b87;font:inherit;font-size:8px}.search-box input::placeholder{color:#a5b1be}.search-box button{border:0;background:none;color:#a2adba;font-size:15px;cursor:pointer}.records-caption{display:flex;align-items:center;justify-content:space-between;padding:10px 17px;color:#99a7b5;font-size:8px}.records-caption strong{color:#627d99}.demo-mark{display:inline-block;width:5px;height:5px;margin-left:4px;border-radius:50%;background:#80a9d2;vertical-align:1px}.records-list{padding:0 13px 9px}.date-divider{display:flex;align-items:center;gap:9px;margin:2px 4px 8px;color:#8294a8;font-size:8px;font-weight:700}.date-divider i{height:1px;flex:1;background:#e9eef3}.settlement-card{position:relative;margin-bottom:8px;padding:12px;border:1px solid #e9eef4;border-radius:10px;background:#fff;transition:border-color .15s,box-shadow .15s}.settlement-card:hover{border-color:#d2e2f1;box-shadow:0 4px 13px #315a7d0c}.record-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.record-identity{display:flex;align-items:center;gap:8px;min-width:0}.result-symbol{width:29px;height:29px;flex:none;display:grid;place-items:center;border-radius:8px;background:#edf8f2;color:#4e9b75;font-size:12px}.result-symbol.negative{background:#fff0ef;color:#cf6a69}.identity-copy{min-width:0}.identity-title{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.identity-title>strong{color:#516d89;font-size:9px}.open-date{color:#9caab8;font-size:7px}.group-label{padding:3px 5px;border-radius:4px;background:#f2f6fa;color:#899bad;font-size:7px}.symbol-line{display:flex;align-items:center;gap:6px;margin-top:3px}.symbol-line b{color:#284c70;font-size:11px}.symbol-line span{color:#93a2b2;font-size:8px}.result-value{display:flex;align-items:flex-end;flex-direction:column;gap:4px;white-space:nowrap}.result-value>span{color:#9ba8b6;font-size:7px}.result-value>strong{font-size:15px;line-height:1}.positive{color:#218d68!important}.negative{color:#cf6262!important}.contract-strip{display:flex;align-items:center;gap:7px;margin:10px 0;padding:8px 9px;border-radius:7px;background:#f7f9fc}.contract-icon{color:#7e9bb9;font-size:11px}.contract-strip>strong{color:#496581;font-size:9px}.expiry-label{color:#9aa8b6;font-size:7px}.closed-label{margin-left:auto;padding:4px 6px;border-radius:5px;background:#eef7f2;color:#579372;font-size:7px;white-space:nowrap}.closed-label.negative{background:#fff1f0;color:#c96968!important}.roll-note{display:flex;align-items:center;gap:6px;margin:-2px 0 9px;padding:7px 8px;border:1px solid #e7eef8;border-radius:6px;background:#f7faff;color:#7b96b2;font-size:7px}.roll-note .el-icon{flex:none;color:#6f98c2}.roll-note span{flex:1}.roll-note strong{color:#5e82a6;font-size:7px;white-space:nowrap}.comparison-row{display:flex;align-items:stretch;gap:7px}.comparison-card{position:relative;display:flex;flex:1;min-width:0;flex-direction:column;gap:5px;padding:8px 9px;border:1px solid #edf1f5;border-radius:7px;background:#fcfdff}.comparison-card.actual{border-color:#e1eee7;background:#f9fcfa}.comparison-title{display:flex;align-items:center;gap:5px;color:#8c9bab;font-size:7px}.comparison-title i{width:5px;height:5px;border-radius:50%;background:#57a17d}.baseline .comparison-title i{background:#9cb0c5}.comparison-card strong{font-size:12px}.comparison-card small{color:#a0adba;font-size:7px}.comparison-arrow{display:grid;place-items:center;color:#b4bfcb;font-size:10px}.contribution-chip{min-width:85px;display:flex;align-items:flex-end;justify-content:center;flex-direction:column;gap:5px;padding:8px 9px;border-radius:7px;background:#f4f7fa}.contribution-chip span{color:#91a0af;font-size:7px}.contribution-chip strong{font-size:11px}.detail-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:9px;padding:8px 9px;border:1px solid #edf1f5;border-radius:7px}.detail-metrics>div{display:flex;align-items:center;justify-content:space-between;gap:5px}.detail-metrics span{color:#99a7b5;font-size:7px;white-space:nowrap}.detail-metrics strong{color:#617b95;font-size:8px;white-space:nowrap}.lifecycle{display:flex;align-items:center;gap:8px;margin-top:9px}.lifecycle-label{color:#a0adba;font-size:7px;white-space:nowrap}.lifecycle-track{display:flex;align-items:center;flex:1;max-width:330px}.lifecycle-track>span{display:flex;align-items:center;gap:4px;color:#a6b1bd;font-size:7px;white-space:nowrap}.lifecycle-track>span i{width:5px;height:5px;border-radius:50%;background:#d5dee7}.lifecycle-track>span.done{color:#7898b6}.lifecycle-track>span.done i{background:#78a6d0}.lifecycle-track>span.current{color:#397fbd;font-weight:700}.lifecycle-track>span.current i{background:#3786c8;box-shadow:0 0 0 3px #3786c81c}.lifecycle-track>span.skipped{color:#aeb8c3}.connector{height:1px;flex:1;min-width:9px;margin:0 5px;background:#e5ebf1}.connector.done-line{background:#cbddec}.demo-type{margin-left:auto;color:#a6b1bd;font-size:7px;white-space:nowrap}
.empty-state{min-height:250px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;border-top:1px solid #edf1f5;color:#9ba8b7;text-align:center}.empty-icon{width:41px;height:41px;display:grid;place-items:center;border-radius:12px;background:#eef5fc;color:#7da2c8;font-size:18px}.empty-state strong{margin-top:2px;color:#607890;font-size:10px}.empty-state p{margin:0;font-size:8px}.empty-state button{margin-top:4px;border:0;background:none;color:#3c7dbc;font-size:8px;cursor:pointer}.records-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 15px;border-top:1px solid #edf1f5;color:#9aa8b6;font-size:7px}.records-footer>span{display:flex;align-items:center;gap:5px}.records-footer .el-icon{color:#8ba8c6}.pagination{display:flex;align-items:center;gap:7px;white-space:nowrap}.pagination button{padding:5px 6px;border:1px solid #edf1f5;border-radius:5px;background:#fff;color:#b0bbc7;font-size:7px}.pagination span{color:#8294a8}.risk-note{display:flex;align-items:flex-start;gap:8px;margin-top:12px;padding:10px 12px;border:1px solid #f2e7d5;border-radius:9px;background:#fffaf2}.risk-icon{margin-top:1px;color:#d19a4d;font-size:13px}.risk-note strong{color:#9d7a48;font-size:8px}.risk-note p{margin:4px 0 0;color:#a18d6d;font-size:7px;line-height:1.5}
.custom-range{display:flex;align-items:center;gap:4px;margin-left:4px}.custom-range input{height:25px;padding:0 5px;border:1px solid #e8edf3;border-radius:6px;background:#fff;color:#506b87;font:inherit;font-size:8px}.custom-range em{color:#a7b2bf;font-size:8px;font-style:normal}.settle-note{border-color:#eef0f4;background:#fafbfd}.settle-note .el-icon{color:#8ea6be}.records-list.is-loading{opacity:.55;transition:opacity .15s}.deploy-tip{display:flex;align-items:center;gap:6px;max-width:420px;margin-top:4px;padding:7px 10px;border-radius:7px;background:#f4f8fc;color:#7d93aa;font-size:8px;line-height:1.5;text-align:left}.deploy-tip i{flex:none;width:5px;height:5px;border-radius:50%;background:#7ea8d3}.spinning{animation:st-spin 1s linear infinite}@keyframes st-spin{to{transform:rotate(360deg)}}
@media(max-width:1000px){.summary-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.records-toolbar{gap:9px}.search-box{min-width:125px}}
@media(max-width:700px){.page-heading{align-items:flex-start;flex-direction:column;gap:10px}.page-heading h1{font-size:24px}.settlement-summary{padding:12px}.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.summary-card{padding:9px}.summary-card>strong{font-size:17px}.summary-card>small{font-size:7px}.summary-heading{margin-bottom:10px}.records-heading{padding:14px 13px 11px}.records-toolbar{align-items:flex-start;flex-direction:column;padding:9px 13px}.range-block{margin-left:0}.search-box{width:100%;box-sizing:border-box}.records-caption{padding:9px 13px}.records-list{padding:0 8px 8px}.settlement-card{padding:10px}.comparison-row{gap:5px}.comparison-card{padding:7px}.contribution-chip{min-width:65px;padding:7px}.detail-metrics{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:8px}.lifecycle{flex-wrap:wrap}.lifecycle-label{width:100%}.lifecycle-track{order:2;flex-basis:100%;max-width:none}.demo-type{margin-left:auto}.records-footer{align-items:flex-start;flex-direction:column}.pagination{align-self:flex-end}}
@media(max-width:390px){.summary-label{gap:4px;font-size:8px}.stat-icon{width:21px;height:21px}.info-icon{display:none}.summary-card>small{white-space:normal;min-height:19px}.sort-toggle button,.range-tabs button{padding:6px;font-size:7px}.control-block{gap:4px}.identity-title{gap:5px}.comparison-title,.comparison-card small{font-size:6px}.detail-metrics{gap:7px}.roll-note{align-items:flex-start;flex-wrap:wrap}.roll-note strong{margin-left:17px}}
</style>
