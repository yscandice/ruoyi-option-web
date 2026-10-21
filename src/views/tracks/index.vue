<template>
  <div class="tracks-page">
    <section class="lb-hero">
      <div class="lb-wrap hero-inner">
          <div class="eyebrow"><span class="eyebrow-dot" />TRACKED <span>·</span> MY MARKS</div>
          <h1>我的跟踪<DataViewTag resource="follow" /></h1>
          <p class="intro">你在信号上做过的标记，以及系统对该信号的参考估值。</p>
      </div>
    </section>

    <div class="lb-wrap lb-body">
    <section class="tracks-layout">
      <main class="main-column">

        <section class="marked-panel">
          <div class="panel-topline"><span class="panel-icon"><el-icon><Star /></el-icon></span><span class="panel-kicker">MY MARKS</span><span class="local-label"><i />{{ syncBadge }}</span></div>

          <DelayedEmpty v-if="dataView.empty" resource="follow" class="tracks-delayed-empty" />
          <div v-else-if="!ready" class="empty-content">
            <div class="empty-visual"><span class="orbit orbit-one"/><span class="orbit orbit-two"/><span class="empty-star"><el-icon><component :is="loading ? Loading : Star" :class="{ spinning: loading }" /></el-icon></span><i class="spark spark-one"/><i class="spark spark-two"/></div>
            <span class="empty-tag">TRACKING SPACE</span>
            <h2>{{ loading ? '正在加载数据' : '暂无数据' }}</h2>
            <p>{{ loading ? '正在从本地服务读取 OSM 同步的跟踪标记…' : (error || '后端定时任务尚未同步跟踪菜单的数据，请稍后刷新。') }}</p>
            <span v-if="!loading && !error" class="deploy-tip"><i />首次部署请由管理员在若依后台「系统监控 → 定时任务」对「OSM跟踪菜单强制同步」执行一次</span>
            <button v-if="!loading" type="button" class="today-link" @click="loadAll">重新加载<el-icon><Refresh /></el-icon></button>
          </div>

          <div v-else-if="!allMarks.length" class="empty-content">
            <div class="empty-visual"><span class="orbit orbit-one"/><span class="orbit orbit-two"/><span class="empty-star"><el-icon><Star /></el-icon></span><i class="spark spark-one"/><i class="spark spark-two"/></div>
            <span class="empty-tag">TRACKING SPACE</span>
            <h2>尚无任何标记</h2>
            <p>自动驾驶成交的信号会自动出现在这里；自己下的单在信号卡上点「手动」，也会记进来，并带上系统的参考估值。</p>
            <router-link class="today-link" to="/today">去看今日信号<el-icon><ArrowRight /></el-icon></router-link>
          </div>

          <div v-else class="marks-body">
            <div class="mark-chips" role="tablist" aria-label="标记类型">
              <button v-for="chip in chips" :key="chip.key" type="button" role="tab" :aria-selected="selectedMark === chip.key" :class="['mark-chip', { on: selectedMark === chip.key }]" @click="selectedMark = chip.key">{{ chip.label }}<b>{{ chip.count }}</b></button>
            </div>

            <div v-if="tally.openN > 0 || tally.closedN > 0" class="tally" title="我采用的这些标的的参考盈亏">
              <div><small>在架 · 浮动盈亏</small><b :class="tally.open >= 0 ? 'up' : 'dn'">{{ signedUsd(tally.open) }}</b><span>{{ tally.openN }} 笔 · 按中位价推算，还会变</span></div>
              <div><small>已结算 · 已实现</small><b :class="tally.closed >= 0 ? 'up' : 'dn'">{{ signedUsd(tally.closed) }}</b><span>{{ tally.closedN }} 笔 · 到期结果，已定</span></div>
              <p>只统计你跟了的信号；两个数不相加——一个还会变，一个已经定死。系统参考估值，不含费用与滑点。<template v-if="tally.unknown > 0">另有 {{ tally.unknown }} 笔暂无估值。</template><template v-if="tally.archived > 0">已了结的 {{ tally.archived }} 笔仍算在上面，卡在<router-link to="/settlement">结算页</router-link>。</template></p>
            </div>

            <div class="mark-toolbar">
              <label class="mark-search"><el-icon><Search /></el-icon><input v-model="searchText" placeholder="搜索标的" aria-label="搜索标的"></label>
              <div class="mark-sort" role="group" aria-label="跟踪排序">
                <button type="button" :class="{ on: sortBy === 'issued' }" @click="sortBy = 'issued'">按发报日</button>
                <button type="button" :class="{ on: sortBy === 'expiry' }" @click="sortBy = 'expiry'">按到期日</button>
                <small>{{ sortBy === 'issued' ? '新发的在前' : '快到期的在前' }}</small>
              </div>
            </div>

            <div v-if="visibleMarks.length" class="mark-list">
              <template v-for="mark in visibleMarks" :key="mark.key">
                <header v-if="mark.dayHead" class="day-head"><b>{{ mark.dayHead }}</b><span>发报</span></header>
                <article :class="['mark-card', { offscreen: !mark.onScreen }]">
                  <div class="mark-card-top">
                    <span :class="['kind-badge', mark.kindTone]">{{ mark.kindLabel }}</span>
                    <span v-if="mark.categoryLabel" :class="['category-badge', mark.category]">{{ mark.categoryLabel }}</span>
                    <span class="mark-expiry">{{ mark.expiryLabel }}</span>
                  </div>
                  <div class="mark-card-main">
                    <div class="mark-symbol"><strong>{{ mark.symbol }}</strong><span :title="mark.title">{{ mark.title }}</span><small>{{ mark.legs }}</small></div>
                    <div class="mark-headline"><small>{{ mark.headline.label }}</small><b :class="mark.headline.tone">{{ mark.headline.value }}</b></div>
                  </div>
                  <div class="mark-facts"><span v-for="fact in mark.facts" :key="fact.label"><small>{{ fact.label }}</small>{{ fact.value }}</span></div>
                  <footer class="mark-foot">
                    <span class="mark-tag"><em :class="['tk-mark', mark.mark.cls]">{{ mark.mark.label }}</em><time>{{ mark.markedAt }}</time><small v-if="mark.reason" class="why">{{ mark.reason }}</small></span>
                    <span v-if="mark.note" class="mark-note">{{ mark.note }}</span>
                  </footer>
                </article>
              </template>
              <button v-if="hasMore" type="button" class="more-button" @click="limit += PAGE_SIZE">再显示 {{ Math.min(PAGE_SIZE, filteredMarks.length - limit) }} 条</button>
            </div>
            <div v-else class="empty-filter"><el-icon><Search /></el-icon><strong>没有匹配的标记</strong><p>调整标记类型或搜索条件后再查看。</p><button type="button" @click="resetFilters">重置筛选</button></div>
          </div>
          <div class="panel-footnote"><el-icon><InfoFilled /></el-icon><span>OSM 看不到你的券商成交，此处不是账户记录。</span></div>
        </section>
      </main>

      <aside class="side-column">
        <section class="side-card week-card">
          <div class="side-card-heading"><div><span class="side-kicker">{{ weekClosed ? 'LAST WEEK · 上周' : 'THIS WEEK · 本周' }}</span><h2>{{ weekRange }}</h2></div><span class="week-icon"><el-icon><Calendar /></el-icon></span></div>
          <div class="weekday-grid">
            <div v-for="day in weekDays" :key="day.key" :class="['weekday', { today: day.today }]">
              <span>{{ day.label }}</span><strong>{{ day.date }}</strong>
              <em class="day-counts"><i class="dot system-dot"/>{{ day.system }}<i class="dot user-dot"/>{{ day.user }}</em>
            </div>
          </div>
          <div class="week-legend"><span><i class="dot system-dot"/>系统</span><span><i class="dot user-dot"/>你</span><span class="legend-caption">信号与标记概览</span></div>
          <div class="week-summary">
            <div class="summary-total"><span>系统发出</span><strong>{{ weekStats.issued }}</strong></div>
            <div class="summary-total followed"><span>你跟了</span><strong>{{ weekStats.followed }}</strong></div>
          </div>
          <div class="summary-breakdown">
            <div><span class="break-icon blue"><el-icon><TrendCharts /></el-icon></span><span>新卖方</span><strong>{{ weekStats.seller }}</strong></div>
            <div><span class="break-icon orange"><el-icon><Umbrella /></el-icon></span><span>保护窗</span><strong>{{ weekStats.protection }}</strong></div>
            <div><span class="break-icon purple"><el-icon><Operation /></el-icon></span><span>管理</span><strong>{{ weekStats.manage }}</strong></div>
            <div><span class="break-icon red"><el-icon><Lock /></el-icon></span><span>强制保护</span><strong>{{ weekStats.forced }}</strong></div>
            <div><span class="break-icon green"><el-icon><CircleCheck /></el-icon></span><span>止盈</span><strong>{{ weekStats.profit }}</strong></div>
          </div>
          <router-link class="week-action" to="/today">{{ weekStats.unmarked > 0 ? `${weekClosed ? '上周' : '本周'}还有 ${weekStats.unmarked} 张卡可以标记` : '查看今日信号' }}<el-icon><ArrowRight /></el-icon></router-link>
        </section>

        <section class="side-card positions-card">
          <div class="side-card-heading"><div><span class="side-kicker">POSITION WATCH</span><h2>在看的仓位</h2></div><span class="positions-total"><strong>{{ ready ? positions.length : '—' }}</strong><small>组</small></span></div>
          <div class="positions-columns"><span>标的</span><span>组合与风险状态</span></div>
          <div v-if="positions.length" class="positions-list">
            <div v-for="item in positions.slice(0, 8)" :key="item.key" class="position-row">
              <span class="position-symbol">{{ item.symbol }}<small>{{ item.kindLabel }}</small></span>
              <span class="position-state"><small>{{ item.legs }}</small><b :class="item.headline.tone">{{ item.headline.value }}</b></span>
            </div>
          </div>
          <div v-else class="positions-empty"><span class="positions-empty-icon"><el-icon><DataAnalysis /></el-icon></span><strong>{{ ready ? '暂无在看的仓位' : '等待跟踪数据' }}</strong><p>信号标记“跟了”且尚未结算的组合会显示在这里。</p></div>
          <div class="positions-foot"><el-icon><InfoFilled /></el-icon>止盈、止损或移仓后的组合不在此处展示。</div>
        </section>

        <section class="next-events">
          <div class="next-heading"><span class="next-icon"><el-icon><Clock /></el-icon></span><div><span class="side-kicker">UP NEXT</span><strong>接下来关注</strong></div></div>
          <template v-if="upcoming.length">
            <div v-for="item in upcoming" :key="item.key" class="event-placeholder"><span class="event-day">{{ item.day }}</span><span class="event-copy"><strong>{{ item.symbol }} · {{ item.legs }}</strong><small>{{ item.kindLabel }} · {{ item.mark.label }}</small></span><span class="event-category">到期</span></div>
          </template>
          <template v-else>
            <div class="event-placeholder"><span class="event-day">—</span><span class="event-copy"><strong>已标记组合的到期日</strong><small>暂无即将到期的标记</small></span><span class="event-category">到期</span></div>
          </template>
        </section>
      </aside>
    </section>
    <p class="disclaimer"><el-icon><InfoFilled /></el-icon>数据来自后端定时同步的 OSM 标记记录（feed + decisions + management-choices）。参考估值按中位价推算，不含费用与滑点，不构成交易记录或投资建议。</p>
    </div>
  </div>
</template>

<script setup>
import DataViewTag from '@/components/option/DataViewTag.vue'
import DelayedEmpty from '@/components/option/DelayedEmpty.vue'
import { useDataView } from '@/utils/accessStore'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ArrowRight, Calendar, CircleCheck, Clock, DataAnalysis, InfoFilled, Loading, Lock, Operation, Refresh, Search, Star, TrendCharts, Umbrella } from '@element-plus/icons-vue'
import { FOLLOW_KINDS, getFollowKind, getFollowSummary } from '@/api/option/follow'
import { getConductScope } from '@/api/option/conduct'
import { MARK_FILTERS, issuedLabel, signedUsd, toMarks } from '@/utils/followData'
import { etLabelDay, toTrades, weekOf } from '@/utils/conductData'
import { etToday, shortDay } from '@/utils/todayFeed'

// 盘后版：标题旁标签 / 尚未放出空状态（W4）
const dataView = useDataView('follow')

const PAGE_SIZE = 30
const WEEK_NAMES = ['一', '二', '三', '四', '五']

const summary = ref(null)
const cache = reactive({})
const conduct = reactive({})
const loading = ref(false)
const error = ref('')
const selectedMark = ref('ALL')
const searchText = ref('')
const sortBy = ref('issued')
const limit = ref(PAGE_SIZE)

const ready = computed(() => !!summary.value && FOLLOW_KINDS.every(kind => cache[kind]))
const marketDay = computed(() => summary.value?.marketDay || etToday())
const syncBadge = computed(() => {
  if (!summary.value) return loading.value ? '正在加载' : '暂无同步数据'
  const t = String(summary.value.syncTime || '').match(/\d{4}-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/)
  return `OSM 同步数据${t ? ` · ${t[1]}/${t[2]} ${t[3]}` : ''}`
})

const marksByKind = computed(() => Object.fromEntries(FOLLOW_KINDS.map(kind => [kind, toMarks(cache[kind])])))
// 页面计数与 OSM 一致：卖方 + 中期 + 买方（动态管理不计入）；列表不展示已归档（结算日不是当前交易日）的标记
const counted = computed(() => ['signal', 'midterm', 'buyer'].flatMap(kind => marksByKind.value[kind]))
const allMarks = computed(() => FOLLOW_KINDS.flatMap(kind => marksByKind.value[kind]).filter(m => !m.archived))
const markCounts = computed(() => {
  const local = { ALL: 0, ADOPT_INTENT: 0, OBSERVE: 0, SKIP: 0 }
  for (const m of counted.value) { local.ALL += 1; if (m.decisionType in local) local[m.decisionType] += 1 }
  return summary.value?.marks || local
})
const chips = computed(() => MARK_FILTERS.filter(f => f.key !== 'OBSERVE' || markCounts.value.OBSERVE > 0).map(f => ({ ...f, count: markCounts.value[f.key] ?? 0 })))
const tally = computed(() => summary.value?.tally || { open: 0, openN: 0, closed: 0, closedN: 0, unknown: 0, archived: 0 })

const filteredMarks = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  const list = allMarks.value
    .filter(m => selectedMark.value === 'ALL' || m.decisionType === selectedMark.value)
    .filter(m => !q || m.symbol.toLowerCase().includes(q))
  return [...list].sort(sortBy.value === 'expiry' ? (a, b) => a.expiryAt - b.expiryAt || b.sortAt - a.sortAt : (a, b) => b.sortAt - a.sortAt)
})
const hasMore = computed(() => filteredMarks.value.length > limit.value)
const visibleMarks = computed(() => {
  let last = ''
  return filteredMarks.value.slice(0, limit.value).map(m => {
    let dayHead = ''
    if (sortBy.value === 'issued' && m.issuedDay && m.issuedDay !== last) { last = m.issuedDay; dayHead = issuedLabel(m.issuedDay) }
    return { ...m, dayHead }
  })
})

const week = computed(() => weekOf(marketDay.value))
// 周末 / 节后交易日落在本周五之后时，概览展示刚结束的一周（与 OSM 一致标为「上周」）
const weekClosed = computed(() => week.value.length === 5 && marketDay.value > week.value[4])
const weekRange = computed(() => (week.value.length ? `${shortDay(week.value[0])} — ${shortDay(week.value[4])}` : '—'))
const signals = computed(() => (conduct.history ? toTrades('history', conduct.history) : []))
const manageCards = computed(() => (conduct.manage ? toTrades('manage', conduct.manage) : []))
const weekDays = computed(() => week.value.map((day, i) => ({
  key: day,
  label: WEEK_NAMES[i],
  date: day.slice(8, 10),
  today: day === marketDay.value,
  system: conduct.history ? signals.value.filter(t => t.sentDay === day).length : '—',
  user: ready.value ? counted.value.filter(m => m.issuedDay === day).length : '—'
})))
const weekStats = computed(() => {
  const days = new Set(week.value)
  const year = marketDay.value.slice(0, 4)
  const inWeek = signals.value.filter(t => days.has(t.sentDay))
  const has = !!conduct.history
  const followedIds = new Set(counted.value.filter(m => m.decisionType === 'ADOPT_INTENT').flatMap(m => [m.raw.recommendationId, m.raw.signalId]).filter(Boolean))
  const markedIds = new Set(counted.value.flatMap(m => [m.raw.recommendationId, m.raw.signalId]).filter(Boolean))
  return {
    issued: has ? inWeek.length : '—',
    followed: ready.value ? counted.value.filter(m => m.decisionType === 'ADOPT_INTENT' && days.has(m.issuedDay)).length : '—',
    seller: has ? inWeek.length : '—',
    protection: has ? signals.value.filter(t => days.has(etLabelDay(t.raw.firstProtectionWindowAt, year))).length : '—',
    manage: conduct.manage ? manageCards.value.filter(t => days.has(t.sentDay)).length : '—',
    forced: has ? inWeek.filter(t => t.raw.protectionExecuted === true).length : '—',
    profit: has ? inWeek.filter(t => String(t.raw.statusCode || '').startsWith('TAKE_PROFIT') || t.raw.resultKind === 'EARLY_TAKE_PROFIT').length : '—',
    unmarked: has && ready.value ? inWeek.filter(t => ![t.raw.id, t.raw.recommendationId].some(id => markedIds.has(id) || followedIds.has(id))).length : 0
  }
})
const positions = computed(() => allMarks.value.filter(m => m.decisionType === 'ADOPT_INTENT' && m.category !== 'settled' && m.onScreen).sort((a, b) => b.sortAt - a.sortAt))
const upcoming = computed(() => allMarks.value
  .filter(m => m.decisionType === 'ADOPT_INTENT' && m.expiry && m.expiry >= marketDay.value && m.category !== 'settled')
  .sort((a, b) => a.expiryAt - b.expiryAt)
  .slice(0, 3)
  .map(m => ({ ...m, day: shortDay(m.expiry) })))

watch([selectedMark, searchText, sortBy], () => { limit.value = PAGE_SIZE })

function resetFilters() {
  selectedMark.value = 'ALL'
  searchText.value = ''
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [sum, ...lists] = await Promise.all([getFollowSummary(), ...FOLLOW_KINDS.map(kind => getFollowKind(kind))])
    summary.value = sum
    FOLLOW_KINDS.forEach((kind, i) => { cache[kind] = lists[i] })
  } catch (e) {
    const message = e?.message || '加载失败'
    error.value = /暂无数据/.test(message) ? '' : message
    summary.value = null
  } finally {
    loading.value = false
  }
  // 右侧「本周」系统发出数据来自「进行」菜单同步数据，失败时显示 —
  for (const scope of ['history', 'manage']) {
    if (!conduct[scope]) getConductScope(scope).then(data => { conduct[scope] = data }).catch(() => {})
  }
}

onMounted(loadAll)
</script>

<style scoped>
.tracks-page{--ink:#1d3858;--muted:#8798ac;--line:#e7edf4;color:var(--ink)}.tracks-layout{display:grid;grid-template-columns:minmax(0,1fr) 345px;gap:16px;align-items:start}.main-column{min-width:0}.eyebrow{display:flex;align-items:center;gap:7px;color:#5785b6;font-size:9px;font-weight:750;letter-spacing:1.2px}.eyebrow>span:nth-child(2){color:#a6b3c2}.eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#4d91d2;box-shadow:0 0 0 4px #4d91d21c}.main-column h1{margin:8px 0 5px;color:#19395f;font-size:27px;line-height:1.2;letter-spacing:-.4px}.intro{margin:0 0 16px;color:#8797aa;font-size:11px;line-height:1.6}.marked-panel,.side-card{background:#fff;border:1px solid var(--line);border-radius:13px;box-shadow:0 4px 16px #233e5b08}.marked-panel{min-height:500px;display:flex;flex-direction:column;overflow:hidden}.panel-topline{display:flex;align-items:center;gap:9px;padding:15px 17px;border-bottom:1px solid #eff3f7}.panel-icon{width:29px;height:29px;display:grid;place-items:center;border-radius:8px;background:#edf5ff;color:#4b88c6;font-size:14px}.panel-kicker{color:#8298ae;font-size:8px;font-weight:750;letter-spacing:1px}.local-label{display:flex;align-items:center;gap:5px;margin-left:auto;padding:5px 7px;border-radius:5px;background:#f4f8fc;color:#91a2b4;font-size:8px}.local-label i{width:5px;height:5px;border-radius:50%;background:#7ea8d3}.empty-content{flex:1;min-height:365px;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:32px 24px;text-align:center}.empty-visual{position:relative;width:100px;height:90px;display:grid;place-items:center;margin-bottom:10px}.orbit{position:absolute;border:1px solid #e1edf8;border-radius:50%;transform:rotate(-22deg)}.orbit-one{width:88px;height:54px}.orbit-two{width:67px;height:90px;transform:rotate(37deg);border-color:#edf3f9}.empty-star{z-index:1;width:48px;height:48px;display:grid;place-items:center;border-radius:16px;background:linear-gradient(145deg,#f4f9ff,#e5f1fd);color:#5c96ce;font-size:21px;box-shadow:0 8px 20px #3678b31c}.spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#7eafe0}.spark-one{right:8px;top:14px}.spark-two{left:9px;bottom:12px;width:4px;height:4px;background:#b8cde1}.empty-tag{color:#9cb0c5;font-size:8px;font-weight:750;letter-spacing:1.3px}.empty-content h2{margin:8px 0 6px;color:#3f5e7e;font-size:15px}.empty-content p{max-width:390px;margin:0;color:#929faf;font-size:10px;line-height:1.7}.today-link{display:inline-flex;align-items:center;gap:7px;margin-top:16px;padding:9px 13px;border-radius:8px;background:#347fc4;color:#fff;font-size:10px;font-weight:650;text-decoration:none;box-shadow:0 4px 11px #347fc426;transition:background .15s,transform .15s}.today-link:hover{background:#246cb0;transform:translateY(-1px)}.panel-footnote{display:flex;align-items:center;gap:6px;padding:11px 15px;border-top:1px solid #eff3f7;color:#9ba8b7;font-size:8px}.panel-footnote .el-icon{color:#89a9ca}
.side-column{display:flex;flex-direction:column;gap:12px}.side-card{padding:14px}.side-card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.side-kicker{display:block;color:#91a7bc;font-size:8px;font-weight:750;letter-spacing:.75px}.side-card-heading h2{margin:4px 0 0;color:#345372;font-size:12px}.week-icon{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:#f1f6fb;color:#6d98c2;font-size:13px}.weekday-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.weekday{position:relative;display:flex;align-items:center;flex-direction:column;gap:6px;padding:8px 3px;border:1px solid #edf1f5;border-radius:7px;color:#9aa8b7;font-size:8px}.weekday strong{color:#607992;font-size:10px;font-weight:650}.weekday.today{border-color:#cfe1f3;background:#f3f8fe;color:#4a83bb}.weekday.today strong{color:#3477b9}.weekday>i{position:absolute;bottom:4px;width:4px;height:4px;border-radius:50%;background:#4f94d3}.week-legend{display:flex;align-items:center;gap:11px;margin:10px 0 8px;color:#8d9caf;font-size:8px}.week-legend>span{display:flex;align-items:center;gap:4px}.dot{width:5px;height:5px;border-radius:50%}.system-dot{background:#78a9d7}.user-dot{background:#a3cbb6}.legend-caption{margin-left:auto;color:#a7b2bf}.week-summary{display:grid;grid-template-columns:1fr 1fr;gap:7px}.summary-total{display:flex;align-items:center;justify-content:space-between;padding:9px 10px;border:1px solid #edf1f5;border-radius:7px;background:#fbfcfe}.summary-total span{color:#8d9bac;font-size:8px}.summary-total strong{color:#4b759a;font-size:14px}.summary-total.followed{border-color:#dcebe4;background:#f7fbf8}.summary-total.followed strong{color:#569577}.summary-breakdown{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.summary-breakdown>div{display:grid;grid-template-columns:19px 1fr auto;align-items:center;gap:5px;padding:7px 6px;border:1px solid #eff2f6;border-radius:6px}.break-icon{width:19px;height:19px;display:grid;place-items:center;border-radius:5px;font-size:10px}.break-icon.blue{background:#edf5ff;color:#4f89c4}.break-icon.orange{background:#fff5e8;color:#c68a3f}.break-icon.purple{background:#f3efff;color:#8572b9}.break-icon.red{background:#fff0ef;color:#ce7170}.break-icon.green{background:#edf8f2;color:#4c9c76}.summary-breakdown>div>span:nth-child(2){color:#8798aa;font-size:8px}.summary-breakdown strong{color:#8e9eaf;font-size:9px}.week-action{display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding:8px 9px;border-radius:7px;background:#f2f7fc;color:#4d80b2;font-size:8px;text-decoration:none}.week-action:hover{background:#eaf3fc}.positions-total{display:flex;align-items:baseline;gap:3px;padding:5px 7px;border-radius:6px;background:#f4f7fa;color:#91a0b0}.positions-total strong{font-size:13px}.positions-total small{font-size:8px}.positions-columns{display:flex;justify-content:space-between;padding:7px 2px;border-top:1px solid #eff3f7;border-bottom:1px solid #eff3f7;color:#a0adba;font-size:8px}.positions-empty{display:flex;align-items:center;flex-direction:column;padding:18px 8px 14px;text-align:center}.positions-empty-icon{width:35px;height:35px;display:grid;place-items:center;margin-bottom:7px;border-radius:10px;background:#f0f6fc;color:#87a9cb;font-size:15px}.positions-empty strong{color:#687f98;font-size:9px}.positions-empty p{margin:4px 0 0;color:#a0adba;font-size:8px;line-height:1.5}.positions-foot{display:flex;align-items:flex-start;gap:5px;padding-top:9px;border-top:1px solid #eff3f7;color:#9ba8b6;font-size:7px;line-height:1.45}.positions-foot .el-icon{flex:none;color:#90aaca}.next-events{padding:2px 2px 0}.next-heading{display:flex;align-items:center;gap:8px;margin-bottom:7px}.next-icon{width:25px;height:25px;display:grid;place-items:center;border-radius:7px;background:#eef5fc;color:#6f98bf;font-size:12px}.next-heading>div{display:flex;flex-direction:column;gap:2px}.next-heading strong{color:#4d6885;font-size:10px}.event-placeholder{display:flex;align-items:center;gap:8px;padding:8px 7px;border-top:1px solid #e9eef4}.event-day{width:23px;height:23px;display:grid;place-items:center;border-radius:6px;background:#fff;color:#a6b2bf;font-size:8px}.event-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}.event-copy strong{overflow:hidden;color:#71869d;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.event-copy small{color:#a2adba;font-size:7px}.event-category{padding:4px 5px;border-radius:4px;background:#f2f6fa;color:#8ea0b2;font-size:7px}.disclaimer{display:flex;align-items:flex-start;gap:6px;margin:13px 1px 0;color:#9aa8b6;font-size:8px;line-height:1.5}.disclaimer .el-icon{margin-top:1px;color:#88a7c7}
@media(max-width:900px){.tracks-layout{grid-template-columns:minmax(0,1fr) 295px;gap:12px}.marked-panel{min-height:470px}.side-card{padding:12px}}
@media(max-width:680px){.tracks-layout{grid-template-columns:1fr;gap:13px}.main-column h1{font-size:24px}.marked-panel{min-height:390px}.empty-content{min-height:280px;padding:25px 18px}.side-column{display:grid;grid-template-columns:1fr}.week-card{order:0}.positions-card{order:1}.next-events{order:2}.side-card{padding:13px}.summary-breakdown{grid-template-columns:repeat(3,1fr)}}
@media(max-width:390px){.marked-panel{min-height:360px}.empty-content p{font-size:9px}.week-card{padding:11px}.summary-breakdown{gap:4px}.summary-breakdown>div{grid-template-columns:17px 1fr auto;gap:3px;padding:6px 4px}.break-icon{width:17px;height:17px}.summary-breakdown>div>span:nth-child(2){font-size:7px}}

.spinning{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.deploy-tip{display:flex;align-items:center;gap:6px;max-width:420px;margin-top:12px;padding:7px 10px;border-radius:7px;background:#f4f8fc;color:#7d93aa;font-size:9px;line-height:1.5;text-align:left}.deploy-tip i{flex:none;width:5px;height:5px;border-radius:50%;background:#7ea8d3}
button.today-link{border:0;cursor:pointer}
.marks-body{flex:1;display:flex;flex-direction:column;gap:12px;padding:14px 16px 16px}
.mark-chips{display:flex;flex-wrap:wrap;gap:6px}.mark-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border:1px solid #e3eaf2;border-radius:999px;background:#fff;color:#6f8399;font-size:10px;cursor:pointer;transition:all .15s}.mark-chip b{color:#9aabbd;font-size:9px;font-weight:700}.mark-chip:hover{border-color:#c9dbee;color:#3f6f9f}.mark-chip.on{border-color:#347fc4;background:#347fc4;color:#fff}.mark-chip.on b{color:#d8e8f8}
.tally{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:11px;border:1px solid #e9eff5;border-radius:10px;background:#fbfcfe}.tally>div{display:flex;flex-direction:column;gap:3px;padding:8px 10px;border-radius:8px;background:#fff;border:1px solid #eff3f7}.tally small{color:#8fa0b2;font-size:8px;font-weight:650}.tally b{font-size:17px;letter-spacing:-.3px}.tally b.up{color:#3f9670}.tally b.dn{color:#cf6464}.tally span{color:#9aa8b7;font-size:8px}.tally p{grid-column:1/-1;margin:0;color:#97a5b4;font-size:8px;line-height:1.6}.tally p a{color:#3e7fbd}
.mark-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}.mark-search{display:flex;align-items:center;gap:6px;flex:1;min-width:150px;max-width:260px;padding:7px 10px;border:1px solid #e3eaf2;border-radius:8px;background:#fff;color:#9aabbd;font-size:11px}.mark-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--ink);font-size:10px}.mark-search:focus-within{border-color:#9cc2e7;box-shadow:0 0 0 3px #347fc414}
.mark-sort{display:flex;align-items:center;gap:4px;padding:3px;border-radius:8px;background:#f3f7fb}.mark-sort button{padding:5px 9px;border:0;border-radius:6px;background:transparent;color:#7d90a5;font-size:9px;cursor:pointer}.mark-sort button.on{background:#fff;color:#2f6faf;box-shadow:0 1px 4px #23446a14;font-weight:650}.mark-sort small{padding:0 6px;color:#a3b0be;font-size:8px}
.mark-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:9px}.day-head{grid-column:1/-1;display:flex;align-items:baseline;gap:6px;margin-top:4px;padding-bottom:4px;border-bottom:1px dashed #e6edf4}.day-head b{color:#4a6888;font-size:10px}.day-head span{color:#a2b0bf;font-size:8px}
.mark-card{display:flex;flex-direction:column;gap:9px;padding:11px 12px;border:1px solid #e7edf4;border-radius:10px;background:#fff;box-shadow:0 2px 8px #233e5b06;transition:border-color .15s,box-shadow .15s}.mark-card:hover{border-color:#cfe0f1;box-shadow:0 5px 14px #233e5b0f}.mark-card.offscreen{background:#fbfcfd;border-style:dashed}
.mark-card-top{display:flex;align-items:center;gap:5px}.kind-badge,.category-badge{padding:3px 6px;border-radius:4px;font-size:8px;font-weight:650}.kind-badge.blue{background:#edf5ff;color:#3f7dbb}.kind-badge.purple{background:#f3efff;color:#7a64b3}.kind-badge.green{background:#edf8f2;color:#3f9670}.kind-badge.orange{background:#fff5e8;color:#bb7d33}.category-badge{background:#f3f6f9;color:#7f92a6}.category-badge.protect{background:#fff5e8;color:#bb7d33}.category-badge.profit,.category-badge.settled{background:#edf8f2;color:#3f9670}.category-badge.unknown{background:#fff0ef;color:#c46a69}.mark-expiry{margin-left:auto;color:#97a6b6;font-size:8px}
.mark-card-main{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.mark-symbol{display:flex;flex-direction:column;gap:2px;min-width:0}.mark-symbol strong{color:#19395f;font-size:15px;letter-spacing:-.2px}.mark-symbol span{overflow:hidden;color:#6f8399;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.mark-symbol small{color:#93a3b4;font-size:8px}.mark-headline{display:flex;flex:none;flex-direction:column;align-items:flex-end;gap:2px}.mark-headline small{color:#97a6b6;font-size:8px}.mark-headline b{color:#6f8399;font-size:14px}.mark-headline b.positive{color:#3f9670}.mark-headline b.negative{color:#cf6464}
.mark-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.mark-facts span{display:flex;flex-direction:column;gap:2px;overflow:hidden;padding:6px 7px;border-radius:6px;background:#f7f9fc;color:#56708b;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.mark-facts small{color:#a0adba;font-size:7px}
.mark-foot{display:flex;flex-direction:column;gap:4px;padding-top:8px;border-top:1px solid #eff3f7}.mark-tag{display:flex;align-items:center;gap:6px}.tk-mark{padding:2px 7px;border-radius:999px;font-size:8px;font-style:normal;font-weight:700}.tk-mark.adopt{background:#e9f6ef;color:#3a8f68}.tk-mark.observe{background:#eef3f9;color:#6b84a0}.tk-mark.skip{background:#fff0ef;color:#c46a69}.mark-tag time{color:#97a6b6;font-size:8px}.mark-tag .why{padding:2px 5px;border-radius:4px;background:#f6f3ee;color:#a2835b;font-size:7px}.mark-note{color:#93a2b2;font-size:8px;line-height:1.5}
.more-button{grid-column:1/-1;justify-self:center;padding:7px 14px;border:1px solid #dbe6f1;border-radius:8px;background:#fff;color:#3f78b0;font-size:9px;cursor:pointer}.more-button:hover{background:#f3f8fd}
.empty-filter{display:flex;align-items:center;flex-direction:column;gap:5px;padding:40px 12px;color:#9aa8b7;text-align:center}.empty-filter .el-icon{font-size:18px;color:#8fb0d0}.empty-filter strong{color:#4f6984;font-size:11px}.empty-filter p{margin:0;font-size:9px}.empty-filter button{margin-top:6px;padding:6px 12px;border:1px solid #dbe6f1;border-radius:7px;background:#fff;color:#3f78b0;font-size:9px;cursor:pointer}
.day-counts{display:flex;align-items:center;gap:2px;color:#97a6b6;font-size:7px;font-style:normal}.day-counts .dot{width:4px;height:4px;margin-left:2px}
.positions-list{display:flex;flex-direction:column}.position-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 2px;border-bottom:1px solid #f1f4f8}.position-symbol{display:flex;flex-direction:column;gap:2px;color:#2f4f70;font-size:10px;font-weight:700}.position-symbol small{color:#9eacbb;font-size:7px;font-weight:500}.position-state{display:flex;flex-direction:column;align-items:flex-end;gap:2px;min-width:0}.position-state small{overflow:hidden;max-width:170px;color:#8e9eaf;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.position-state b{color:#6f8399;font-size:10px}.position-state b.positive{color:#3f9670}.position-state b.negative{color:#cf6464}
@media(max-width:680px){.tally{grid-template-columns:1fr}.mark-list{grid-template-columns:1fr}.mark-search{max-width:none}}
.tracks-delayed-empty{margin:14px 0 0;min-height:380px;border-radius:14px}
</style>

<style>
html:has(.tracks-page){overflow-x:clip}
</style>

<!-- 长桥风格覆盖层（docs/longbridge-ui.md） -->
<style scoped>
.tracks-page{
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

/* Hero */
.lb-hero{position:relative;overflow:hidden;padding:56px 0 120px;color:#fff;
  background:radial-gradient(900px 420px at 85% -10%,rgba(0,240,196,.22),transparent 60%),radial-gradient(700px 380px at 0% 120%,rgba(0,184,184,.18),transparent 60%),linear-gradient(180deg,#05070d,#0b1220)}
.eyebrow{display:inline-flex;padding:6px 14px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.78);font-size:12px;font-weight:600;letter-spacing:1.6px}
.eyebrow>span:nth-child(2){color:rgba(255,255,255,.4)}
.eyebrow-dot{background:var(--lb-accent-bright);box-shadow:0 0 0 4px rgba(0,240,196,.18)}
.lb-hero h1{display:flex;align-items:center;gap:12px;margin:18px 0 10px;color:#fff;font-size:48px;font-weight:700;line-height:1.1;letter-spacing:-1px}
.lb-hero .intro{margin:0;color:rgba(255,255,255,.62);font-size:16px}

/* 主体：上浮叠在 Hero 上 */
.lb-body{position:relative;margin-top:-84px}
.tracks-layout{grid-template-columns:minmax(0,1fr) 360px;gap:20px}
.marked-panel,.side-card{border:0;border-radius:20px;background:#fff;box-shadow:0 1px 2px rgba(7,10,19,.04),0 12px 32px rgba(7,10,19,.06)}
.panel-topline{gap:12px;padding:20px 24px;border-bottom-color:var(--lb-border)}
.panel-icon{width:40px;height:40px;border-radius:14px;background:var(--lb-text);color:var(--lb-accent-bright);font-size:18px}
.panel-kicker{color:var(--lb-text);font-size:14px;letter-spacing:1.4px;white-space:nowrap}
.local-label{gap:6px;padding:6px 14px;border-radius:999px;background:var(--lb-bg-2);color:var(--lb-text-2);font-size:13px}
.local-label i{width:6px;height:6px;background:var(--lb-accent)}
.marks-body{gap:20px;padding:24px}

/* 标记胶囊 */
.mark-chips{gap:8px}
.mark-chip{gap:8px;padding:9px 18px;border-color:var(--lb-border);color:var(--lb-text-2);font-size:14px;font-weight:500}
.mark-chip b{color:var(--lb-text-4);font-size:13px}
.mark-chip:hover{border-color:var(--lb-text);color:var(--lb-text)}
.mark-chip.on{border-color:var(--lb-text);background:var(--lb-text);color:#fff}
.mark-chip.on b{color:var(--lb-accent-bright)}

/* 盈亏汇总：黑底简报条 */
.tally{gap:12px;padding:20px;border:0;border-radius:20px;background:radial-gradient(500px 220px at 100% 0%,rgba(0,240,196,.16),transparent 60%),var(--lb-text)}
.tally>div{gap:6px;padding:16px 18px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.05)}
.tally small{color:rgba(255,255,255,.6);font-size:13px;font-weight:500}
.tally b{font-size:32px;font-weight:700;letter-spacing:-.6px;font-variant-numeric:tabular-nums}
.tally b.up{color:#ff7aa5}
.tally b.dn{color:var(--lb-accent-bright)}
.tally span{color:rgba(255,255,255,.5);font-size:12px}
.tally p{color:rgba(255,255,255,.55);font-size:12px;line-height:1.7}
.tally p a{color:var(--lb-accent-bright)}

/* 工具栏 */
.mark-toolbar{gap:12px}
.mark-search{max-width:300px;padding:0 16px;height:42px;gap:8px;border-color:var(--lb-border);border-radius:999px;background:var(--lb-bg);color:var(--lb-text-3);font-size:15px}
.mark-search input{color:var(--lb-text);font-size:14px}
.mark-search:focus-within{border-color:var(--lb-text);box-shadow:none;background:#fff}
.mark-sort{gap:4px;padding:4px;border-radius:999px;background:var(--lb-bg-2)}
.mark-sort button{padding:8px 18px;border-radius:999px;color:var(--lb-text-2);font-size:14px}
.mark-sort button.on{background:var(--lb-text);color:#fff;box-shadow:none;font-weight:600}
.mark-sort small{padding:0 10px;color:var(--lb-text-3);font-size:12px}

/* 标记卡 */
.mark-list{grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}
.day-head{gap:10px;margin-top:10px;padding-bottom:10px;border-bottom:1px solid var(--lb-border)}
.day-head b{color:var(--lb-text);font-size:20px;font-weight:700}
.day-head span{color:var(--lb-text-3);font-size:13px}
.mark-card{gap:14px;padding:18px;border:1px solid var(--lb-border);border-radius:16px;box-shadow:none;transition:border-color .16s,box-shadow .16s,transform .16s}
.mark-card:hover{border-color:transparent;box-shadow:0 12px 32px rgba(7,10,19,.08);transform:translateY(-2px)}
.mark-card.offscreen{background:var(--lb-bg)}
.mark-card-top{gap:6px}
.kind-badge,.category-badge{padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600}
.kind-badge.blue{background:var(--lb-accent-soft);color:#008a8a}
.kind-badge.purple{background:var(--lb-text);color:#fff}
.kind-badge.green{background:var(--lb-up-soft);color:var(--lb-up)}
.kind-badge.orange{background:var(--lb-warn-soft);color:#b45309}
.category-badge{background:var(--lb-bg-2);color:var(--lb-text-2)}
.category-badge.protect{background:var(--lb-warn-soft);color:#b45309}
.category-badge.profit,.category-badge.settled{background:var(--lb-accent-soft);color:#008a8a}
.category-badge.unknown{background:var(--lb-up-soft);color:var(--lb-up)}
.mark-expiry{color:var(--lb-text-3);font-size:12px}
.mark-symbol{gap:4px}
.mark-symbol strong{color:var(--lb-text);font-size:22px;font-weight:700;letter-spacing:-.3px}
.mark-symbol span{color:var(--lb-text-2);font-size:13px}
.mark-symbol small{color:var(--lb-text-3);font-size:12px}
.mark-headline{gap:4px}
.mark-headline small{color:var(--lb-text-3);font-size:12px}
.mark-headline b{color:var(--lb-text-2);font-size:22px;font-weight:700;letter-spacing:-.3px;font-variant-numeric:tabular-nums}
.mark-headline b.positive{color:var(--lb-up)}
.mark-headline b.negative{color:var(--lb-down)}
.mark-facts{gap:8px}
.mark-facts span{gap:4px;padding:10px 12px;border-radius:12px;background:var(--lb-bg);color:var(--lb-text);font-size:13px;font-weight:600}
.mark-facts small{color:var(--lb-text-3);font-size:12px;font-weight:400}
.mark-foot{gap:6px;padding-top:12px;border-top-color:var(--lb-border)}
.mark-tag{gap:8px}
.tk-mark{padding:3px 12px;font-size:12px}
.tk-mark.adopt{background:var(--lb-text);color:var(--lb-accent-bright)}
.tk-mark.observe{background:var(--lb-bg-2);color:var(--lb-text-2)}
.tk-mark.skip{background:var(--lb-up-soft);color:var(--lb-up)}
.mark-tag time{color:var(--lb-text-3);font-size:12px}
.mark-tag .why{padding:2px 10px;border-radius:999px;background:var(--lb-warn-soft);color:#b45309;font-size:12px}
.mark-note{color:var(--lb-text-3);font-size:12px;line-height:1.6}
.more-button{padding:12px 28px;border:0;border-radius:999px;background:var(--lb-text);color:#fff;font-size:14px;font-weight:600}
.more-button:hover{background:#1f2430}
.empty-filter strong{color:var(--lb-text);font-size:16px}
.empty-filter p{color:var(--lb-text-3);font-size:14px}
.empty-filter .el-icon{color:var(--lb-accent);font-size:24px}
.empty-filter button{padding:8px 18px;border-color:var(--lb-text);border-radius:999px;color:var(--lb-text);font-size:13px}
.panel-footnote{display:flex;align-items:center;gap:6px;padding:16px 24px;border-top:1px solid var(--lb-border);color:var(--lb-text-3);font-size:13px}
.panel-footnote .el-icon{color:var(--lb-accent)}

/* 空状态 */
.empty-tag{color:var(--lb-accent)!important;font-size:12px!important;letter-spacing:1.6px}
.empty-content h2{color:var(--lb-text)!important;font-size:28px!important}
.empty-content p{color:var(--lb-text-3)!important;font-size:14px!important}
.empty-star{background:var(--lb-text)!important;color:var(--lb-accent-bright)!important}
.today-link{padding:10px 22px!important;border-radius:999px!important;background:var(--lb-text)!important;color:#fff!important;font-size:14px!important}
.deploy-tip{padding:8px 16px;border-radius:999px;background:var(--lb-bg-2);color:var(--lb-text-2);font-size:13px}

/* 侧栏 */
.side-column{gap:20px}
.side-card{padding:24px}
.side-card-heading{margin-bottom:18px}
.side-kicker{color:var(--lb-accent);font-size:12px;letter-spacing:1.4px}
.side-card-heading h2{margin-top:8px;color:var(--lb-text);font-size:22px;font-weight:700;letter-spacing:-.3px}
.week-icon{width:40px;height:40px;border-radius:14px;background:var(--lb-bg-2);color:var(--lb-text);font-size:17px}
.weekday-grid{gap:6px}
.weekday{gap:6px;padding:12px 2px;border:0;border-radius:14px;background:var(--lb-bg);color:var(--lb-text-3);font-size:12px}
.weekday strong{color:var(--lb-text);font-size:18px;font-weight:700}
.weekday.today{background:var(--lb-text);color:rgba(255,255,255,.7)}
.weekday.today strong{color:#fff}
.day-counts{gap:3px;color:var(--lb-text-3);font-size:11px}
.weekday.today .day-counts{color:rgba(255,255,255,.7)}
.day-counts .dot{width:5px;height:5px}
.system-dot{background:var(--lb-accent)}
.user-dot{background:var(--lb-up)}
.week-legend{gap:14px;margin:14px 0 12px;color:var(--lb-text-2);font-size:12px}
.dot{width:7px;height:7px}
.legend-caption{color:var(--lb-text-4)}
.week-summary{gap:10px}
.summary-total{padding:14px 16px!important;border:0!important;border-radius:16px!important;background:var(--lb-bg)!important}
.summary-total span{color:var(--lb-text-3)!important;font-size:13px!important}
.summary-total strong{color:var(--lb-text)!important;font-size:28px!important;font-weight:700}
.summary-total.followed{background:var(--lb-text)!important}
.summary-total.followed span{color:rgba(255,255,255,.65)!important}
.summary-total.followed strong{color:var(--lb-accent-bright)!important}
.summary-breakdown{gap:8px!important;margin-top:10px}
.summary-breakdown>div{gap:8px!important;padding:10px 12px!important;border:0!important;border-radius:14px!important;background:var(--lb-bg)!important}
.summary-breakdown>div>span:nth-child(2){color:var(--lb-text-2)!important;font-size:13px!important}
.summary-breakdown strong{color:var(--lb-text)!important;font-size:16px!important}
.break-icon{width:26px!important;height:26px!important;border-radius:9px!important;font-size:13px}
.break-icon.blue{background:var(--lb-accent-soft)!important;color:#008a8a!important}
.break-icon.orange{background:var(--lb-warn-soft)!important;color:#b45309!important}
.break-icon.purple{background:var(--lb-text)!important;color:#fff!important}
.break-icon.red{background:var(--lb-up-soft)!important;color:var(--lb-up)!important}
.break-icon.green{background:var(--lb-accent-soft)!important;color:#008a8a!important}
.week-action{margin-top:16px!important;padding:12px 18px!important;border:0!important;border-radius:999px!important;background:var(--lb-text)!important;color:#fff!important;font-size:14px!important;font-weight:600}
.positions-total strong{color:var(--lb-text)!important;font-size:28px!important}
.positions-total small{color:var(--lb-text-3)!important;font-size:13px!important}
.positions-columns{color:var(--lb-text-4)!important;font-size:12px!important;border-bottom-color:var(--lb-border)!important}
.position-row{gap:10px;padding:12px 2px;border-bottom-color:var(--lb-border)}
.position-symbol{gap:4px;color:var(--lb-text);font-size:15px}
.position-symbol small{color:var(--lb-text-3);font-size:12px}
.position-state{gap:4px}
.position-state small{color:var(--lb-text-3);font-size:12px}
.position-state b{color:var(--lb-text-2);font-size:15px;font-variant-numeric:tabular-nums}
.position-state b.positive{color:var(--lb-up)}
.position-state b.negative{color:var(--lb-down)}
.positions-foot{color:var(--lb-text-3)!important;font-size:12px!important}
.positions-empty strong{color:var(--lb-text)!important;font-size:15px!important}
.positions-empty p{color:var(--lb-text-3)!important;font-size:13px!important}
.next-events{padding:24px!important;border:0!important;border-radius:20px!important;background:#fff!important;box-shadow:0 1px 2px rgba(7,10,19,.04)!important}
.next-icon{width:40px!important;height:40px!important;border-radius:14px!important;background:var(--lb-text)!important;color:var(--lb-accent-bright)!important;font-size:17px}
.next-heading strong{color:var(--lb-text)!important;font-size:20px!important}
.event-placeholder{gap:12px!important;padding:12px 14px!important;border:0!important;border-radius:14px!important;background:var(--lb-bg)!important}
.event-day{flex:none;min-width:44px;color:var(--lb-text)!important;font-size:14px!important;font-weight:700}
.event-copy strong{color:var(--lb-text)!important;font-size:13px!important}
.event-copy small{color:var(--lb-text-3)!important;font-size:12px!important}
.event-category{padding:3px 10px!important;border-radius:999px!important;background:var(--lb-warn-soft)!important;color:#b45309!important;font-size:12px!important}
.disclaimer{display:flex;align-items:flex-start;gap:8px;margin:28px 0 0;padding:16px 20px;border-radius:16px;background:#fff;color:var(--lb-text-3);font-size:13px;line-height:1.7}
.disclaimer .el-icon{margin-top:3px;color:var(--lb-accent)}

@media(max-width:1279px){.lb-hero h1{font-size:40px}}
@media(max-width:1100px){.tracks-page{--pad-top:24px;--pad-bottom:36px}.tracks-layout{grid-template-columns:minmax(0,1fr) 320px}}
@media(max-width:900px){.tracks-layout{grid-template-columns:1fr}.side-column{display:grid;grid-template-columns:1fr 1fr}.next-events{grid-column:1/-1}}
@media(max-width:760px){
  .tracks-page{--pad-top:20px;--pad-bottom:30px}
  .lb-wrap{padding:0 16px}
  .lb-hero{padding:36px 0 96px}
  .lb-hero h1{font-size:34px}
  .lb-hero .intro{font-size:14px}
  .lb-body{margin-top:-68px}
  .side-column{grid-template-columns:1fr}
  .panel-topline{padding:16px 18px}
  .local-label{padding:5px 10px;font-size:12px;white-space:nowrap}
  .panel-kicker{font-size:13px;letter-spacing:1px}
  .marks-body{padding:18px;gap:16px}
  .tally{padding:14px}
  .tally b{font-size:26px}
  .mark-search{max-width:none;flex-basis:100%}
  .mark-sort{flex-wrap:wrap}
  .day-head b{font-size:17px}
  .side-card,.next-events{padding:20px!important}
}
@media(max-width:390px){.mark-chip{padding:8px 14px;font-size:13px}.mark-sort button{padding:7px 14px;font-size:13px}.weekday strong{font-size:16px}}
</style>
