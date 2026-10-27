<template>
  <div class="acv3">
    <section class="hero"><div class="wrap">
      <div class="hero-top">
        <div>
          <span class="eyebrow"><i />ACTIVE · POSITION DESK</span>
          <h1>进行中的参考路径，<em>一屏盯住。</em><DataViewTag resource="conduct" /></h1>
          <p class="hero-sub">{{ marketDay || '—' }}<span class="sep">·</span>{{ marketDay ? weekday(marketDay) : '' }}<span class="sep">·</span><span class="tag-dk">{{ session }}</span><span class="sep">·</span>最近同步 <span class="num">{{ syncLabel }}</span></p>
        </div>
        <div class="hero-ctl">
          <span class="glass-pill" :title="summary?.status?.message || ''"><i :class="summary ? 'ok' : 'off'" />{{ summary ? 'OSM 已同步 · 只读' : (loading.summary ? '正在加载' : '暂无同步数据') }}</span>
          <button class="glass-pill" type="button" :disabled="refreshing" @click="refresh">↻ {{ refreshing ? '刷新中' : '刷新' }}</button>
          <router-link class="glass-pill" to="/updates">🔔 提醒</router-link>
        </div>
      </div>
      <div class="tabs5">
        <button v-for="t in tabs" :key="t.key" type="button" :class="['t5', { on: tab === t.key }]" @click="tab = t.key"><small><i :style="{ background: t.color }" />{{ t.label }}</small><b class="num">{{ t.count }}</b><span>{{ t.sub }}</span></button>
      </div>
    </div></section>

    <div class="body"><div class="wrap">
      <DelayedEmpty v-if="dataView.empty" resource="conduct" />
      <div v-else class="layout">
        <main class="main">
          <!-- 进行中 -->
          <section v-if="tab === 'active'" class="panel on">
            <div class="card tool">
              <div class="seg"><button :class="{ on: groupBy === 'sent' }" type="button" @click="groupBy = 'sent'">按发报日</button><button :class="{ on: groupBy === 'expiry' }" type="button" @click="groupBy = 'expiry'">按到期日</button></div>
              <button class="chip" type="button" @click="desc = !desc">{{ desc ? (groupBy === 'sent' ? '新发的在前 ↓' : '晚到期在前 ↓') : (groupBy === 'sent' ? '旧的在前 ↑' : '先到期在前 ↑') }}</button>
              <div class="tool-r">
                <label class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg><input v-model="q" placeholder="搜索标的，如 DELL"></label>
                <div class="seg"><button v-for="s in SORTS" :key="s.key" :class="{ on: sortBy === s.key }" type="button" @click="sortBy = s.key">{{ s.label }}</button></div>
              </div>
            </div>
            <div class="tip"><i>i</i><span>系统参考路径自动记录，用户执行需单独确认 · 提醒不等于自动成交，OSM 看不到你的券商账户。</span></div>
            <div class="legend-row"><span><i class="lg up" />浮盈（涨）/ 买方</span><span><i class="lg dn" />浮亏（跌）</span><span><i class="lg mid" />中期买方</span><span><i class="lg prot" />保护卡 · 保护收</span></div>
            <template v-if="activeCards.length">
              <div v-for="g in activeGroups" :key="g.day" class="day"><div class="day-h"><b class="num">{{ g.label }}</b><span>{{ g.week }} · {{ groupBy === 'sent' ? '发报' : '到期' }}</span><em>{{ g.items.length }} 张</em></div><div class="grid2"><PathCard v-for="c in g.items" :key="c.id" :card="c" /></div></div>
            </template>
            <div v-else class="empty card">{{ emptyText('active') }}</div>
          </section>

          <!-- 保护窗口 / 动态管理 -->
          <section v-else-if="tab === 'protection' || tab === 'manage'" class="panel on">
            <div class="ph"><div><div class="kicker">{{ tab === 'protection' ? 'POSITION MANAGEMENT LEDGER' : 'DYNAMIC MANAGEMENT' }}</div><h2>{{ tab === 'protection' ? '保护窗口' : '动态管理' }}</h2><p>{{ tab === 'protection' ? '每条记录与原卖方策略绑定；窗口命中后立即按信号执行口径跟踪，不需要人工确认。' : '到期前 1 个交易日被测的持仓：早盘先决定保护，尾盘再决定移仓；选哪条都记账，到期后按真实结算对照推荐与不做。止盈 / 兑现窗口也归这里。' }}</p></div><button class="chip" type="button" @click="desc = !desc">{{ tab === 'protection' ? '按最近窗口排序' : '按发出时间排序' }} {{ desc ? '↓' : '↑' }}</button></div>
            <div v-if="tab === 'manage' && manageKinds.length > 1" class="seg kinds"><button v-for="k in manageKinds" :key="k.key" :class="{ on: mgKind === k.key }" type="button" @click="mgKind = k.key; limit = PAGE">{{ k.key }}<em>{{ k.n }}</em></button></div>
            <div v-if="lockedHint" class="tip"><i>!</i><span>{{ lockedHint }}</span></div>
            <div v-if="ledgerCards.length" class="lgrid"><PathCard v-for="c in ledgerCards.slice(0, limit)" :key="c.id" :card="c" /></div>
            <div v-else class="empty card">{{ emptyText(tab) }}</div>
            <div v-if="ledgerCards.length > limit" class="more-row"><button class="chip" type="button" @click="limit += PAGE">显示更多（剩余 {{ ledgerCards.length - limit }} 张）</button></div>
          </section>

          <!-- 已到期 -->
          <section v-else-if="tab === 'expired'" class="panel on">
            <div class="ph"><div><div class="kicker">EXPIRED · SETTLEMENT MARKS</div><h2>已到期</h2><p>这里采用终端到期结算标记，不使用盘后最优点位回填；属于研究口径，不是账户实际成交或已实现收益。</p></div></div>
            <div class="k3"><div class="card"><small>自然到期</small><b class="num">{{ expStats.settled }}</b><span>逐次正式发布分别保留</span></div><div class="card"><small>已有结算价</small><b class="num">{{ expStats.priced }}</b><span>{{ expStats.pos }} 正向 · {{ expStats.pending }} 待补齐</span></div><div class="card"><small>到期研究盈亏</small><b :class="['num', plCls(expStats.sum)]">{{ sgn(expStats.sum) }}</b><span>每张按一组精确两腿</span></div></div>
            <div v-if="expiredCards.length" class="lgrid"><PathCard v-for="c in expiredCards.slice(0, limit)" :key="c.id" :card="c" /></div>
            <div v-else class="empty card">{{ emptyText('expired') }}</div>
            <div v-if="expiredCards.length > limit" class="more-row"><button class="chip" type="button" @click="limit += PAGE">显示更多（剩余 {{ expiredCards.length - limit }} 张）</button></div>
          </section>

          <!-- 历史信号 -->
          <section v-else class="panel on">
            <div class="ph"><div><div class="kicker">SIGNAL ARCHIVE</div><h2>历史信号</h2><p>完整归档全部正式样本；研究口径按精确两腿标记，不等于账户实盘。</p></div></div>
            <div class="k3"><div class="card"><small>完整归档</small><b class="num">{{ histStats.total }}</b><span>全部正式样本</span></div><div class="card"><small>可评价样本</small><b class="num">{{ histStats.priced }}</b><span>{{ histStats.pos }} 正向 · {{ histStats.total - histStats.priced }} 数据不足</span></div><div class="card"><small>研究口径</small><b class="num">{{ histStats.rate === null ? '—' : histStats.rate.toFixed(1) + '%' }}</b><span>正向占比 · 精确两腿标记，不等于账户实盘</span></div></div>
            <div class="card tbl-card"><div class="tbl-h"><strong>归档明细</strong><div class="seg"><button v-for="(f, i) in ['全部', '正向', '负向']" :key="f" :class="{ on: histFilter === i }" type="button" @click="histFilter = i; histLimit = 30">{{ f }}</button></div></div>
              <div class="tbl">
                <div class="tr th"><span>标的</span><span>结构</span><span class="c4">发报</span><span class="c5">到期</span><span class="c6">标记</span><span class="r">研究盈亏</span></div>
                <div v-for="r in histRows.slice(0, histLimit)" :key="r.id" class="tr"><span class="sym"><b>{{ r.sym }}</b><small>{{ r.grp || '—' }}</small></span><span class="lg2 num">{{ r.legs }}</span><span class="num c4">{{ r.sent }}</span><span class="num c5">{{ r.exp }}</span><span class="c6"><span v-if="r.v === null" class="st st-warn">数据不足</span><span v-else-if="r.v > 0" class="st st-up">正向</span><span v-else class="st st-down">负向</span></span><span :class="['num', 'r', plCls(r.v)]">{{ sgn(r.v) }}</span></div>
                <div v-if="!histRows.length" class="empty">{{ emptyText('history') }}</div>
              </div>
              <div v-if="histRows.length > histLimit" style="text-align:center;padding:14px"><a class="link" href="javascript:;" @click="histLimit += 30">加载更多 →</a></div>
            </div>
          </section>
        </main>

        <aside class="side">
          <section v-if="week" class="card">
            <div class="sc-h"><strong>本周<small>THIS WEEK · {{ week.range }}</small></strong></div>
            <div class="week"><div v-for="c in week.cells" :key="c.day" :class="{ today: c.today, exp: c.exp }"><small>{{ c.label }}</small><b class="num">{{ c.value }}</b></div></div>
            <div class="duo"><div><small>系统发出</small><b class="num">{{ week.total }}</b></div><div><small>进行中</small><b class="num">{{ countOf('active') }}</b></div></div>
            <template v-if="week.stack.length"><div class="stack"><i v-for="s in week.stack" :key="s.label" :style="{ flex: s.count, background: s.color }" :title="`${s.label} ${s.count}`" /></div><div class="legend"><span v-for="s in week.stack" :key="s.label"><i :style="{ background: s.color }" />{{ s.label }} <b class="num">{{ s.count }}</b></span></div></template>
            <router-link class="mark-cta" to="/today">去今日页看新信号 <span>→</span></router-link>
          </section>
          <section v-if="watchList.items.length" class="card">
            <div class="sc-h"><strong>在看的仓位<small>{{ watchList.groups }} 组 · {{ watchList.session }}</small></strong></div>
            <div v-for="p in watchList.items" :key="p.key" class="pos">
              <div class="pos-h"><b>{{ p.symbol }}</b><span class="num">{{ p.spot }}</span><span :class="['num', p.moveTone]">{{ p.moveTone === 'up' ? '▲' : p.moveTone === 'down' ? '▼' : '' }} {{ p.move }}</span><span class="g">{{ p.count }} 组</span></div>
              <div v-for="g in p.groups" :key="g.key" class="leg-r">
                <span class="num">{{ g.leg }}</span><b :class="['num', g.pnlTone]">{{ g.pnl }}</b>
                <div :class="['track', { call: g.call }]"><span class="w" :style="{ left: `${g.track.wLeft}%`, width: `${g.track.wWidth}%` }" /><span v-if="g.track.short != null" class="s" :style="{ left: `calc(${g.track.short}% - 1px)` }" /><span v-if="g.track.spot != null" class="p" :style="{ left: `calc(${g.track.spot}% - 1px)` }" /></div>
                <span :class="['dist', { up: g.crossed }]">{{ g.dist }}</span>
              </div>
            </div>
            <div v-if="watchList.symbols > watchList.items.length" class="pos" style="text-align:center"><a class="link" href="javascript:;" @click="watchAll = true">查看全部 {{ watchList.groups }} 组 →</a></div>
            <div class="pos-legend"><span><i class="lg-s" />卖出的腿</span><span><i class="lg-w" />价差宽度</span><span><i class="lg-p" />现价</span></div>
            <div class="note">止盈中、已止损、已移仓的组不列在这里。</div>
          </section>
          <section class="card disc"><i>!</i><span>研究与教育用途，不构成个性化投资建议。卡片盈亏均为系统参考路径的研究口径，不代表你的账户实际成交。</span></section>
        </aside>
      </div>
    </div></div>
  </div>
</template>

<script setup>
import DataViewTag from '@/components/option/DataViewTag.vue'
import DelayedEmpty from '@/components/option/DelayedEmpty.vue'
import PathCard from './components/PathCard.vue'
import { useDataView } from '@/utils/accessStore'
import { isHandledError } from '@/services/http'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getConductScope, getConductSummary } from '@/api/option/conduct'
import { getTodayFeed } from '@/api/option/today'
import { weekday } from '@/utils/todayFeed'
import { watchPositions } from '@/utils/todayDesk'
import { groupByDay, historyRows, manageCard, manageIndex, plCls, protectionCard, settleStats, sgn, signalCard, weekDesk } from '@/utils/conductDesk'

// 盘后版：标题旁标签 / 尚未放出空状态（W4）
const dataView = useDataView('conduct')

const PAGE = 24
const TABS = [
  { key: 'active', label: '进行中', sub: '在途参考路径', color: '#00f0c4' },
  { key: 'protection', label: '保护窗口', sub: '窗口记录', color: '#a855f7' },
  { key: 'manage', label: '动态管理', sub: '管理卡发出', color: '#f59e0b' },
  { key: 'expired', label: '已到期', sub: '已有结算价', color: '#a8aaad' },
  { key: 'history', label: '历史信号', sub: '完整归档', color: '#3b82f6' }
]
const SORTS = [{ key: 'updated', label: '最新变化' }, { key: 'expiry', label: '下一复核' }, { key: 'pnl', label: '浮盈最高' }]

const tab = ref('active')
const groupBy = ref('sent')
const desc = ref(true)
const sortBy = ref('updated')
const q = ref('')
const limit = ref(PAGE)
const mgKind = ref('全部')
const histFilter = ref(0)
const histLimit = ref(30)
const watchAll = ref(false)
const summary = ref(null)
const feed = ref(null)
const refreshing = ref(false)
const cache = reactive({})
const loading = reactive({})
const errors = reactive({})

const marketDay = computed(() => summary.value?.marketDay || cache.active?.marketDay || '')
const session = computed(() => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(new Date()).map(x => [x.type, x.value]))
  if (p.weekday === 'Sat' || p.weekday === 'Sun') return '美股休市'
  const t = (+p.hour % 24) * 60 + +p.minute
  return t < 570 ? '美股盘前' : t < 960 ? '美股盘中' : '美股盘后'
})
const syncLabel = computed(() => {
  const m = String(summary.value?.syncTime || '').match(/\d{4}-(\d{2})-(\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/)
  return m ? `${m[1]}/${m[2]} ${m[3]}` : '—'
})
const countOf = key => summary.value?.scopes?.find(s => s.scope === key)?.count ?? cache[key]?.count ?? '—'
const tabs = computed(() => TABS.map(t => ({ ...t, count: countOf(t.key) })))

// ---- 进行中 ----
const mIndex = computed(() => manageIndex(cache.manage))
const matchQ = c => !q.value.trim() || c.sym.toUpperCase().includes(q.value.trim().toUpperCase())
const activeCards = computed(() => (cache.active?.items || []).map(i => signalCard(i, 'active', marketDay.value, mIndex.value)).filter(matchQ))
const activeGroups = computed(() => {
  const sorter = sortBy.value === 'pnl' ? (a, b) => (b.pnl ?? -Infinity) - (a.pnl ?? -Infinity) : sortBy.value === 'expiry' ? (a, b) => (a.days ?? 9999) - (b.days ?? 9999) || b.sortAt - a.sortAt : (a, b) => b.sortAt - a.sortAt
  return groupByDay([...activeCards.value].sort(sorter), groupBy.value, desc.value)
})

// ---- 保护窗口 / 动态管理 ----
const manageAll = computed(() => (cache.manage?.items || []).map(i => manageCard(i, marketDay.value)))
const manageKinds = computed(() => {
  const m = new Map()
  for (const c of manageAll.value) { const k = c.tags[0].text.split('·')[0].trim(); m.set(k, (m.get(k) || 0) + 1) }
  return [{ key: '全部', n: manageAll.value.length }, ...[...m.entries()].sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n }))]
})
const ledgerCards = computed(() => {
  const list = tab.value === 'protection'
    ? (cache.protection?.items || []).map(i => protectionCard(i, marketDay.value))
    : manageAll.value.filter(c => mgKind.value === '全部' || c.tags[0].text.startsWith(mgKind.value))
  return list.sort((a, b) => (desc.value ? b.sortAt - a.sortAt : a.sortAt - b.sortAt))
})
const lockedHint = computed(() => {
  const items = cache[tab.value]?.items || []
  return items.length && items.every(i => i.locked) ? '当前同步账号为免费档：OSM 只公开卡型、标的和时间，具体结构、成本与盈亏仅实时会员可见。' : ''
})

// ---- 已到期 / 历史 ----
const expiredItems = computed(() => cache.expired?.items || [])
const expStats = computed(() => settleStats(expiredItems.value))
const expiredCards = computed(() => expiredItems.value.map(i => signalCard(i, 'expired', marketDay.value, mIndex.value)).sort((a, b) => (b.expiryDay || '').localeCompare(a.expiryDay || '') || b.emittedAt - a.emittedAt))
const histStats = computed(() => settleStats(cache.history?.items))
const histRows = computed(() => historyRows(cache.history?.items).filter(r => histFilter.value === 0 || (histFilter.value === 1 ? r.v > 0 : r.v !== null && r.v < 0)))

// ---- 侧栏 ----
const week = computed(() => weekDesk(marketDay.value, cache))
const watchList = computed(() => watchPositions(feed.value, watchAll.value ? 99 : 8))

function emptyText(key) {
  if (loading[key]) return '正在读取 OSM 同步数据…'
  if (errors[key]) return errors[key]
  if (!cache[key]) return '后端尚未同步该栏目，请管理员在若依后台对「OSM进行菜单强制同步」执行一次。'
  return q.value ? '没有匹配的标的，换个关键词试试。' : '最近一次同步中该栏目没有条目。'
}

async function loadSummary() {
  loading.summary = true
  try { summary.value = await getConductSummary() } catch { summary.value = null } finally { loading.summary = false }
}
async function loadScope(scope, { force = false, silent = false } = {}) {
  if ((!force && cache[scope]) || loading[scope]) return
  loading[scope] = true
  try {
    cache[scope] = await getConductScope(scope)
    errors[scope] = ''
  } catch (error) {
    const message = error.message || '加载失败'
    errors[scope] = /暂无数据/.test(message) ? '' : message
    if (!silent && errors[scope] && !isHandledError(error)) ElMessage.warning(errors[scope])
  } finally {
    loading[scope] = false
  }
}
async function loadFeed() { try { feed.value = await getTodayFeed() } catch { feed.value = null } }
async function refresh() {
  refreshing.value = true
  await Promise.all([loadSummary(), loadFeed(), ...TABS.map(t => loadScope(t.key, { force: true, silent: t.key !== tab.value }))])
  refreshing.value = false
}
watch(tab, key => { limit.value = PAGE; desc.value = true; loadScope(key) })

onMounted(async () => {
  loadSummary()
  loadFeed()
  await loadScope('active')
  // 卡片里的「动态管理策略」与侧栏「本周」需要管理卡 / 保护窗 / 历史信号，首屏后静默加载
  for (const s of ['manage', 'protection', 'history']) loadScope(s, { silent: true })
})
</script>

<style src="./active-v3.css"></style>
