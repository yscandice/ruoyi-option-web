<template>
  <div class="tkv3">
    <section class="hero"><div class="wrap">
      <div class="hero-top">
        <div>
          <span class="eyebrow"><i />TRACKED · MY MARKS</span>
          <h1>我的跟踪，<em>只记你标过的。</em><DataViewTag resource="follow" /></h1>
          <p class="hero-sub">你在信号上做过的标记，以及系统对该信号的参考估值。OSM 看不到你的券商成交，此处不是账户记录。</p>
        </div>
        <div class="hero-ctl">
          <span class="glass-pill" :title="summary?.status?.message || ''"><i :class="summary ? 'ok' : 'off'" />{{ summary ? `OSM 已同步 · ${syncLabel}` : (loading ? '正在加载' : '暂无同步数据') }}</span>
          <router-link class="glass-pill" to="/today">去看今日信号 →</router-link>
        </div>
      </div>
      <div class="kpis">
        <div class="kpi"><div class="kpi-l"><i style="background:#4ade80" />在架 · 浮动盈亏</div><div class="kpi-v num" :style="{ color: tone(tally.open) }">{{ tally.openN ? sgn(tally.open) : '—' }}</div><div class="kpi-s">{{ tally.openN }} 笔 · 按中位价推算，还会变</div></div>
        <div class="kpi"><div class="kpi-l"><i style="background:#00f0c4" />已结算 · 已实现</div><div class="kpi-v num" :style="{ color: tone(tally.closed) }">{{ tally.closedN ? sgn(tally.closed) : '—' }}</div><div class="kpi-s">{{ tally.closedN }} 笔 · 到期结果，已定</div></div>
        <div class="kpi"><div class="kpi-l"><i style="background:#fff" />标记总数</div><div class="kpi-v num">{{ ready ? counts.ALL : '—' }}</div><div class="kpi-s">跟了 {{ counts.ADOPT_INTENT }}<template v-if="counts.OBSERVE"> · 观察 {{ counts.OBSERVE }}</template> · 否决 {{ counts.SKIP }}</div></div>
      </div>
    </div></section>

    <div class="body"><div class="wrap">
      <div class="layout">
        <main class="main">
          <section class="panel on">
            <DelayedEmpty v-if="dataView.empty" resource="follow" />
            <template v-else>
              <template v-if="cards.length">
                <div class="card tool">
                  <div class="seg"><button v-for="s in segs" :key="s.key" type="button" :class="{ on: mark === s.key }" @click="mark = s.key">{{ s.label }}<em>{{ s.n }}</em></button></div>
                  <div class="tool-r">
                    <label class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg><input v-model="q" placeholder="搜索标的" aria-label="搜索标的"></label>
                    <div class="seg"><button type="button" :class="{ on: sort === 'issued' }" @click="sort = 'issued'">按发报日</button><button type="button" :class="{ on: sort === 'expiry' }" @click="sort = 'expiry'">按到期日</button></div>
                    <small class="sort-hint">{{ sort === 'issued' ? '新发的在前' : '快到期的在前' }}</small>
                  </div>
                </div>
                <div class="tip"><i>i</i><span>只统计你<b>跟了</b>的信号（自动驾驶成交的，或它在券商里认出你自己下的）；两个数不相加——一个还会变，一个已经定死。系统参考估值，不含费用与滑点，OSM 看不到你的券商成交。<template v-if="tally.unknown">另有 {{ tally.unknown }} 笔暂无估值。</template><template v-if="tally.archived">已了结的 {{ tally.archived }} 笔仍算在上面，卡在<router-link class="link" to="/settlement">结算页</router-link>。</template></span></div>
                <div class="legend-row"><span><i class="lg up" />浮盈（涨）/ 买方</span><span><i class="lg dn" />浮亏（跌）</span><span><i class="lg mid" />中期买方</span><span><i class="lg prot" />保护卡 · 保护收</span><span><i class="lg gray" />快照外 / 待复核</span></div>
                <div v-for="g in visibleGroups" :key="g.key" class="day">
                  <div class="day-h"><b class="num">{{ g.title }}</b><span>{{ g.sub }}</span><em>{{ g.items.length }} 张</em></div>
                  <div class="grid2"><TrackCard v-for="c in g.items" :key="c.key" :card="c" /></div>
                </div>
                <div v-if="!visibleGroups.length" class="card tk-empty"><b>没有匹配的标记</b><p>调整标记类型或搜索条件后再查看。</p><button class="btn-go" type="button" @click="mark = 'ALL'; q = ''">重置筛选</button></div>
                <div v-if="total > limit" class="more-row"><button class="btn-s" type="button" @click="limit += PAGE">再显示 {{ Math.min(PAGE, total - limit) }} 张</button></div>
              </template>
              <div v-else class="card tk-empty">
                <template v-if="loading"><b>正在加载</b><p>正在从本地服务读取 OSM 同步的跟踪标记…</p></template>
                <template v-else-if="!summary"><b>暂无数据</b><p>{{ error || '后端定时任务尚未同步跟踪菜单的数据。首次部署请由管理员在若依后台「系统监控 → 定时任务」对「OSM跟踪菜单强制同步」执行一次。' }}</p><button class="btn-go" type="button" @click="load">重新加载 ↻</button></template>
                <template v-else><b>尚无任何标记</b><p>自动驾驶成交的信号会自动出现在这里；自己下的单在信号卡上点「手动」，也会记进来，并带上系统的参考估值。</p><router-link class="btn-go" to="/today">去看今日信号 →</router-link></template>
              </div>
            </template>
            <p class="sc-foot">系统参考浮盈按发报中位价与当前中位价推算，不含费用与滑点，不是你的账户盈亏。研究与教育用途，不构成个性化投资建议。</p>
          </section>
        </main>

        <aside class="side">
          <section v-if="week" class="card">
            <div class="sc-h"><strong>本周<small>THIS WEEK · {{ week.range }}</small></strong></div>
            <div class="week"><div v-for="c in week.cells" :key="c.day" :class="{ today: c.today, exp: c.exp }"><small>{{ c.label }}</small><b class="num">{{ c.value }}</b></div></div>
            <div class="duo"><div><small>系统发出</small><b class="num">{{ week.total }}</b></div><div><small>你跟了</small><b class="num">{{ ready ? weekFollowed : '—' }}</b></div></div>
            <template v-if="week.stack.length"><div class="stack"><i v-for="s in week.stack" :key="s.label" :style="{ flex: s.count, background: s.color }" :title="`${s.label} ${s.count}`" /></div><div class="legend"><span v-for="s in week.stack" :key="s.label"><i :style="{ background: s.color }" />{{ s.label }} <b class="num">{{ s.count }}</b></span></div></template>
            <router-link class="mark-cta" to="/today">{{ weekUnmarked > 0 ? `本周还有 ${weekUnmarked} 张卡可以标记` : '去看今日信号' }} <span>→</span></router-link>
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
          <section v-if="upcoming.length" class="card">
            <div class="sc-h"><strong>接下来</strong><router-link class="link" to="/scorecard">查看完整决策档案 →</router-link></div>
            <div v-for="e in upcoming" :key="e.key" class="ev"><time>{{ e.when }}</time><span :title="e.title">{{ e.title }}</span><span :class="['st', e.cls]">{{ e.tag }}</span></div>
          </section>
          <section class="card disc"><i>!</i><span>研究与教育用途，不构成个性化投资建议。卡片盈亏均为系统参考估值，不代表你的账户实际成交。</span></section>
        </aside>
      </div>
    </div></div>
  </div>
</template>

<script setup>
import DataViewTag from '@/components/option/DataViewTag.vue'
import DelayedEmpty from '@/components/option/DelayedEmpty.vue'
import TrackCard from './components/TrackCard.vue'
import { useDataView } from '@/utils/accessStore'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getFollowKind, getFollowSummary } from '@/api/option/follow'
import { getConductScope } from '@/api/option/conduct'
import { getTodayFeed } from '@/api/option/today'
import { upcomingEvents, watchPositions } from '@/utils/todayDesk'
import { zonedDay } from '@/utils/todayFeed'
import { sgn, weekDesk } from '@/utils/conductDesk'
import { MARK_SEG, markCounts, trackCard, trackGroups } from '@/utils/trackDesk'

// 盘后版：标题旁标签 / 尚未放出空状态（W4）
const dataView = useDataView('follow')

const PAGE = 30
const summary = ref(null)
const list = ref(null)
const feed = ref(null)
const conduct = reactive({})
const loading = ref(false)
const error = ref('')
const mark = ref('ALL')
const q = ref('')
const sort = ref('issued')
const limit = ref(PAGE)
const watchAll = ref(false)

const ready = computed(() => !!summary.value && !!list.value)
const marketDay = computed(() => summary.value?.marketDay || feed.value?.marketEtDay || '')
const syncLabel = computed(() => {
  const m = String(summary.value?.syncTime || '').match(/\d{4}-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/)
  return m ? `${m[1]}/${m[2]} ${m[3]}` : '只读'
})
const tone = n => (!n ? '#fff' : n > 0 ? '#4ade80' : '#ff7a7f')
const tally = computed(() => summary.value?.tally || { open: 0, openN: 0, closed: 0, closedN: 0, unknown: 0, archived: 0 })

const cards = computed(() => (list.value?.items || []).map(i => trackCard(i, marketDay.value)))
const counts = computed(() => summary.value?.marks || markCounts(cards.value))
const segs = computed(() => MARK_SEG.filter(s => s.key !== 'OBSERVE' || counts.value.OBSERVE > 0).map(s => ({ ...s, n: counts.value[s.key] ?? 0 })))
const groups = computed(() => trackGroups(cards.value, { mark: mark.value, q: q.value, sort: sort.value }))
const total = computed(() => groups.value.reduce((n, g) => n + g.items.length, 0))
// 分页按卡片计数，跨日分组截断
const visibleGroups = computed(() => {
  let left = limit.value
  const out = []
  for (const g of groups.value) {
    if (left <= 0) break
    out.push({ ...g, items: g.items.slice(0, left) })
    left -= g.items.length
  }
  return out
})

// ---- 侧栏 ----
const week = computed(() => weekDesk(marketDay.value, conduct))
const weekDays = computed(() => new Set((week.value?.cells || []).map(c => c.day)))
const marked = computed(() => (list.value?.items || []).filter(i => i.kind !== 'manage'))
const weekFollowed = computed(() => marked.value.filter(i => i.decisionType === 'ADOPT_INTENT' && weekDays.value.has(i.issuedDay)).length)
const weekUnmarked = computed(() => {
  const ids = new Set(marked.value.flatMap(i => [i.signalId, i.recommendationId]).filter(Boolean))
  const sig = new Map()
  for (const s of ['history', 'active']) for (const i of conduct[s]?.items || []) if (i.id) sig.set(i.id, i)
  return [...sig.values()].filter(i => weekDays.value.has(zonedDay(i.emittedAtUtc)) && ![i.id, i.recommendationId].some(id => ids.has(id))).length
})
const watchList = computed(() => watchPositions(feed.value, watchAll.value ? 99 : 8))
const upcoming = computed(() => upcomingEvents(feed.value))

watch([mark, q, sort], () => { limit.value = PAGE })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [sum, all] = await Promise.all([getFollowSummary(), getFollowKind('all')])
    summary.value = sum
    list.value = all
  } catch (e) {
    const message = e?.message || '加载失败'
    error.value = /暂无数据/.test(message) ? '' : message
    summary.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  getTodayFeed().then(d => { feed.value = d }).catch(() => {})
  // 「本周」系统发出 / 可标记数来自「进行」菜单同步数据，失败时侧栏不显示
  for (const s of ['active', 'history', 'protection', 'manage']) getConductScope(s).then(d => { conduct[s] = d }).catch(() => {})
})
</script>

<style src="./tracks-v3.css"></style>
