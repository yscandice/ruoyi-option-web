<template>
  <div class="tdv3">
    <section class="hero">
      <div class="wrap">
        <div class="hero-top">
          <div>
            <span class="eyebrow"><i />TODAY · SIGNAL DESK</span>
            <h1>期权交易员，<em>欢迎回来。</em><DataViewTag resource="today" /></h1>
            <p class="hero-sub">
              <template v-if="hero.day">{{ hero.day }}<span class="sep">·</span>{{ hero.weekday }}<span class="sep">·</span></template>
              <span v-if="hero.phase" class="tag-dk">{{ hero.phase }}</span><span v-if="hero.phase" class="sep">·</span>今日信号与持仓管理一览
            </p>
          </div>
          <div class="hero-ctl">
            <button class="glass-pill" type="button" @click="toggleCat">招财猫 <span :class="['switch', { on: catEnabled }]" /></button>
            <button class="glass-pill" type="button" :title="loadError || '刷新今日数据'" @click="refreshTodayData()"><span :class="feed ? 'ok' : 'off'" />{{ loading ? '加载中…' : feed ? lastUpdated || '数据就绪' : '暂无数据' }}</button>
            <span v-if="hero.member" class="glass-pill"><span :class="hero.memberOk ? 'ok' : 'off'" />{{ hero.member }}</span>
          </div>
        </div>
        <div class="kpis">
          <a v-for="k in kpis" :key="k.key" class="kpi" :href="k.href" @click.prevent="jump(k.href)">
            <div class="kpi-l"><i :style="{ background: k.dot }" />{{ k.label }}</div>
            <div class="kpi-v num">{{ feed ? k.value : '—' }}</div>
            <div class="kpi-s">{{ feed ? k.note : '等待接口数据' }}</div>
            <span class="kpi-go">→</span>
          </a>
        </div>
      </div>
    </section>

    <div class="wrap body">
      <DelayedEmpty v-if="dataView.empty" resource="today" class="card empty-card" />
      <div v-else-if="!feed" class="card empty-card"><strong>{{ loading ? '正在加载今日数据…' : '今日数据暂不可用' }}</strong><p>{{ loadError || '后端尚未同步 OSM 今日看板数据。' }}</p><button class="btn btn-line btn-sm" type="button" @click="refreshTodayData()">重试</button></div>
      <div v-else class="layout">
        <div class="main">
          <section v-if="tested.rows.length" :class="['card', 'tested', { open: open.tested }]">
            <button class="tested-h" type="button" @click="open.tested = !open.tested">
              <span class="tested-ic">⚠</span>
              <span><strong>持仓被测试 · 为什么跌<em class="num">{{ tested.rows.length }}</em></strong><small><span v-if="tested.crossed" class="st st-alert">{{ tested.crossed }} 个已穿过卖腿</span><span v-if="tested.near" class="st st-warn">{{ tested.near }} 个贴近卖腿</span></small></span>
              <span class="chev">⌄</span>
            </button>
            <div class="tested-b"><div class="tested-grid">
              <div v-for="r in tested.rows" :key="r.key" class="trow"><b>{{ r.symbol }}</b><span class="leg"><span class="lg">{{ r.leg }}</span><template v-if="r.why"><br><span class="why">{{ r.why }}</span></template></span><span :class="['st', r.crossed ? 'st-alert' : 'st-warn']">{{ r.dist }}</span></div>
            </div></div>
          </section>

          <section id="signals">
            <div class="sec-h">
              <div><span class="kicker">NEW SIGNALS</span><h2>新信号<small class="num">{{ sigs.counts.all }}</small></h2></div>
              <div class="sec-tools">
                <div class="seg"><button v-for="t in sigTabs" :key="t.key" type="button" :class="{ on: sigTab === t.key }" @click="sigTab = t.key; sigLimit = 6">{{ t.label }}<em>{{ sigs.counts[t.key] }}</em></button></div>
                <router-link class="btn btn-line btn-sm" to="/academy">第一次做卖方？</router-link>
              </div>
            </div>
            <div v-if="sigList.length" class="sig-grid"><DeskSignalCard v-for="c in sigList.slice(0, sigLimit)" :key="c.key" :card="c" @share="share" /></div>
            <div v-else class="card blank">信号交易日 {{ tradeDay }} 暂无{{ sigTabs.find(t => t.key === sigTab).label === '全部' ? '' : sigTabs.find(t => t.key === sigTab).label }}信号</div>
            <div v-if="sigList.length > sigLimit" class="more"><button class="btn btn-line" type="button" @click="sigLimit += 6">显示更多（还有 {{ sigList.length - sigLimit }} 张）</button></div>
          </section>

          <section id="manage" class="card mg">
            <div class="sec-h">
              <div><span class="kicker">MANAGEMENT</span><h2>管理提醒<small><span class="num">{{ mg.symbols }}</span> 个标的 · {{ mg.total }} 张卡 · 点一行展开看卡</small></h2></div>
              <div class="sec-tools"><div class="seg"><button v-for="t in mgTabs" :key="t.key" type="button" :class="{ on: mgTab === t.key }" @click="mgTab = t.key; mgLimit = 12">{{ t.label }}<em>{{ t.count }}</em></button></div></div>
            </div>
            <div v-if="mg.hedges.length && (mgTab === 'all' || mgTab === 'hedge')" :class="['mg-group', { open: open.hedge }]">
              <button class="tested-h" type="button" @click="open.hedge = !open.hedge">
                <span class="tested-ic hedge-ic">◇</span>
                <span><strong>对冲卡</strong><small><span class="st st-info">{{ mg.hedges.length }} 张</span><span class="st st-gray">原卖方组临近到期或被测试时，对另一侧开价差</span></small></span>
                <span class="chev">⌄</span>
              </button>
              <div class="tested-b"><div class="sig-grid"><DeskSignalCard v-for="c in hedgeCards" :key="c.key" :card="c" @share="share" /></div></div>
            </div>
            <div v-for="r in mgRows.slice(0, mgLimit)" :key="r.key" :class="['mrow', { open: openRows[r.key] }]" @click="openRows[r.key] = !openRows[r.key]">
              <div :class="['mtype', r.cls]">{{ r.label }}<small v-if="r.sub">{{ r.sub }}</small></div>
              <div class="mmain"><b>{{ r.symbol }}<small v-if="r.group">{{ r.group }}</small></b><div class="mleg num">{{ r.leg }}</div><div v-if="r.trail.length" class="trail"><span v-for="t in r.trail" :key="t.text" :class="{ last: t.last }">{{ t.text }}</span></div></div>
              <div class="mpl"><small>{{ r.plLabel }}</small><b :class="['num', r.plTone]">{{ r.pl || '—' }}</b></div>
              <div class="mtime"><b class="num">{{ r.time }}</b><small>{{ r.sent || '—' }}</small></div>
              <span class="row-chev">⌄</span>
              <div class="mdetail" @click.stop>
                <p v-if="r.why">{{ r.why }}</p>
                <ol v-if="r.steps.length" class="mg-steps"><li v-for="s in r.steps" :key="s">{{ s }}</li></ol>
                <div v-if="r.figures.length" class="mg-figs"><span v-for="f in r.figures" :key="f.label"><small>{{ f.label }}</small><b class="num">{{ f.value }}</b><em v-if="f.note">{{ f.note }}</em></span></div>
              </div>
            </div>
            <div v-if="!mgRows.length && !(mg.hedges.length && (mgTab === 'all' || mgTab === 'hedge'))" class="blank">信号交易日 {{ tradeDay }} 没有需要处理的管理提醒</div>
            <div v-if="mgRows.length > mgLimit" class="more"><button class="btn btn-line" type="button" @click="mgLimit = mgRows.length">显示剩余 {{ mgRows.length - mgLimit }} 张</button></div>
          </section>
        </div>

        <aside class="side">
          <section class="card">
            <div class="sc-h"><strong>今日要闻<small>{{ news.day }}</small></strong><router-link class="link" to="/info">展开 ↗</router-link></div>
            <p v-if="news.lead" class="news-lead">{{ news.lead }}</p>
            <p v-else class="note">今日盘前简报尚未发布</p>
            <span v-if="news.tape" :class="['st', news.tape[1]]">{{ news.tape[0] }}</span>
            <div v-if="news.events.length" class="ev-list">
              <div v-for="e in news.events" :key="e.key" class="ev"><time class="num">{{ e.time }}</time><span :title="e.title"><i v-if="e.high" class="hi" />{{ e.title }}</span><em>{{ e.note }}</em></div>
            </div>
            <div v-if="news.earnings.length">
              <div v-for="e in news.earnings" :key="e.key" class="ev"><time>{{ news.earningsDay }}</time><span class="earn"><i class="logo">{{ e.symbol.slice(0, 1) }}</i>{{ e.label }}</span><em class="num">{{ e.eps ? `EPS 预期 ${e.eps}` : '' }}</em></div>
            </div>
            <div class="side-ft"><router-link class="link" to="/info">盘前简报 →</router-link></div>
          </section>

          <section v-if="infos.length" class="card">
            <div class="sc-h"><strong>信息 · 最近上的</strong><router-link class="link" to="/info">财报解读 →</router-link></div>
            <div v-for="f in infos" :key="f.key" class="feed"><span class="logo">{{ f.logo }}</span><div><h4>{{ f.title }}<span v-if="f.kind" :class="['st', f.dark ? 'st-black' : 'st-gray']">{{ f.kind }}</span></h4><p>{{ f.summary }}</p><small>{{ f.sub }}</small></div></div>
          </section>

          <section v-if="sigNews.total" class="card">
            <div class="sc-h"><strong>信号要闻<small>{{ sigNews.total }}</small></strong></div>
            <div v-for="n in sigNews.items" :key="n.key" class="feed"><span class="logo">{{ n.symbol.slice(0, 1) }}</span><div><h4>{{ n.symbol }}<span :class="['st', n.cls]">{{ n.direction }}</span></h4><p>{{ n.text }}</p><small>{{ n.meta }}</small></div></div>
          </section>

          <section v-if="margin" class="card">
            <div class="sc-h"><strong>保证金占用</strong><small class="sc-sub">{{ margin.currentCount }} 组在途 · 每组 1 张</small></div>
            <div class="margin-v num">{{ formatUsd(margin.currentUsd) }}</div>
            <div class="sc-desc">当前全站信号需要冻结的保证金</div>
            <div class="bars"><div v-for="b in margin.bars" :key="b.day" :class="{ today: b.label === '今天' }" :title="`${b.day} · ${formatUsd(b.usd)} · ${b.count} 组`"><i :style="{ height: `${b.height}%` }" /><small>{{ b.label }}</small></div></div>
            <div class="trio"><div><small>昨日收盘</small><b class="num">{{ margin.yesterday != null ? formatUsd(margin.yesterday) : '—' }}</b></div><div><small>本周日均</small><b class="num">{{ margin.thisWeek != null ? formatUsd(margin.thisWeek) : '—' }}</b></div><div><small>上周日均</small><b class="num">{{ margin.lastWeek != null ? formatUsd(margin.lastWeek) : '—' }}</b></div></div>
          </section>

          <section v-if="week" class="card">
            <div class="sc-h"><strong>本周<small>THIS WEEK · {{ week.range }}</small></strong></div>
            <div class="week"><div v-for="c in week.cells" :key="c.day" :class="{ today: c.today, exp: c.exp }"><small>{{ c.label }}</small><b class="num">{{ c.value }}</b></div></div>
            <div class="duo"><div><small>系统发出</small><b class="num">{{ week.total }}</b></div></div>
            <div v-if="week.stack.length" class="stack"><i v-for="s in week.stack" :key="s.type" :style="{ flex: s.count, background: s.color }" :title="`${s.label} ${s.count}`" /></div>
            <div v-if="week.stack.length" class="legend"><span v-for="s in week.stack" :key="s.type"><i :style="{ background: s.color }" />{{ s.label }} <b class="num">{{ s.count }}</b></span></div>
          </section>

          <section v-if="watch.items.length" class="card">
            <div class="sc-h"><strong>在看的仓位<small>{{ watch.groups }} 组 · {{ watch.session }}</small></strong></div>
            <div v-for="p in watch.items" :key="p.key" class="pos">
              <div class="pos-h"><b>{{ p.symbol }}</b><span class="num">{{ p.spot }}</span><span :class="['num', p.moveTone]">{{ p.moveTone === 'up' ? '▲' : p.moveTone === 'down' ? '▼' : '' }} {{ p.move }}</span><span class="g">{{ p.count }} 组</span></div>
              <div v-for="g in p.groups" :key="g.key" class="leg-r">
                <span class="num">{{ g.leg }}</span><b :class="['num', g.pnlTone]">{{ g.pnl }}</b>
                <div :class="['track', { call: g.call }]"><i class="w" :style="{ left: `${g.track.wLeft}%`, width: `${g.track.wWidth}%` }" /><i v-if="g.track.short != null" class="s" :style="{ left: `${g.track.short}%` }" /><i v-if="g.track.spot != null" class="p" :style="{ left: `${g.track.spot}%` }" /></div>
                <span :class="['dist', { up: g.crossed }]">{{ g.dist }}</span>
              </div>
            </div>
            <div class="side-ft center"><router-link class="link" to="/active">查看全部 {{ watch.groups }} 组 →</router-link></div>
            <div class="pos-legend"><span><i class="lg-s" />卖出的腿</span><span><i class="lg-w" />价差宽度</span><span><i class="lg-p" />现价</span></div>
            <div class="note">止盈中、已止损、已移仓的组不列在这里。</div>
          </section>

          <section v-if="upcoming.length" class="card">
            <div class="sc-h"><strong>接下来</strong><router-link class="link" to="/info">查看信息 →</router-link></div>
            <div v-for="e in upcoming" :key="e.key" class="ev"><time>{{ e.when }}</time><span :title="e.title">{{ e.title }}</span><span :class="['st', e.cls]">{{ e.tag }}</span></div>
          </section>

          <section class="card disc"><i>!</i><span>研究与教育用途，不构成个性化投资建议。没有任何信号服务是百分百有保障的，期权交易存在重大亏损风险。</span></section>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import DataViewTag from '@/components/option/DataViewTag.vue'
import DelayedEmpty from '@/components/option/DelayedEmpty.vue'
import DeskSignalCard from './components/DeskSignalCard.vue'
import { useDataView } from '@/utils/accessStore'
import { isHandledError } from '@/services/http'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getTodayFeed, getEntitlement, getPremarketBrief } from '@/api/option/today'
import { getInfoFeed } from '@/api/option/info'
import { etToday, formatUsd, marginStats, signalDay, zonedTime } from '@/utils/todayFeed'
import { heroInfo, infoFeeds, kpiCards, MG_LABELS, manageDeck, newsDesk, signalDeck, signalNewsItems, testedPositions, upcomingEvents, watchPositions, weekStats } from '@/utils/todayDesk'

// 盘后版：标题旁标签 / 尚未放出空状态（W4）
const dataView = useDataView('today')
const POLL_MS = 60000
// 盘后版数据是静态快照：轮询间隔放慢到 5 分钟
const DELAYED_POLL_MS = 300000
let lastPollAt = Date.now()
let pollTimer = null

const feed = ref(null)
const premarket = ref(null)
const entitlement = ref(null)
const info = ref(null)
const loading = ref(false)
const loadError = ref('')
const lastUpdated = ref('')
const catEnabled = ref(localStorage.getItem('option-today-cat') !== '0')
const open = reactive({ tested: false, hedge: true })
const openRows = reactive({})
const sigTab = ref('all')
const sigLimit = ref(6)
const mgTab = ref('all')
const mgLimit = ref(12)
const now = ref(Date.now())

const hero = computed(() => heroInfo(feed.value, entitlement.value))
const kpis = computed(() => kpiCards(feed.value))
const tradeDay = computed(() => signalDay(feed.value) || '—')
const tested = computed(() => testedPositions(feed.value))
const sigs = computed(() => signalDeck(feed.value))
const sigTabs = [{ key: 'all', label: '全部' }, { key: 'seller', label: '卖方' }, { key: 'buyer', label: '买方' }, { key: 'mid', label: '中期' }]
const sigList = computed(() => (sigTab.value === 'all' ? sigs.value.all : sigs.value.all.filter(c => c.kind === sigTab.value)))
const mg = computed(() => manageDeck(feed.value))
const mgTabs = computed(() => [{ key: 'all', label: '全部', count: mg.value.total }, ...Object.entries(mg.value.counts).sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, label: MG_LABELS[key] || key, count }))])
const mgRows = computed(() => (mgTab.value === 'all' ? mg.value.rows : mg.value.rows.filter(r => r.type === mgTab.value)))
// 对冲卡用信号卡样式展示：腿取原卖方组，指标取卡片 figures
const hedgeCards = computed(() => mg.value.hedges.map(r => ({
  key: r.key, kind: 'hedge', color: 'k-prot', symbol: r.symbol, group: r.group, name: '对冲卡', tier: r.sub.length > 10 ? `${r.sub.slice(0, 10)}…` : r.sub, tierClass: 'tg-light',
  time: r.time ? `${r.time} ET` : '', leg: r.steps[0] || r.leg, expiry: '', premLabel: r.plLabel || '卡片', prem: r.pl || '—', origin: r.origin,
  metrics: r.figures.slice(0, 6).map(f => [f.label, f.value]), floor: null, pnl: null, why: r.figures.length ? '' : r.why, steps: { done: [true, true, true, false], cur: 2 }
})))
const news = computed(() => newsDesk(feed.value, premarket.value, now.value))
const infos = computed(() => infoFeeds(info.value))
const sigNews = computed(() => signalNewsItems(feed.value))
const margin = computed(() => marginStats(feed.value))
const week = computed(() => weekStats(feed.value))
const watch = computed(() => watchPositions(feed.value))
const upcoming = computed(() => upcomingEvents(feed.value))

onMounted(() => {
  refreshTodayData()
  pollTimer = window.setInterval(() => {
    now.value = Date.now()
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
  const tasks = [getTodayFeed, getEntitlement, () => getPremarketBrief(etToday()), getInfoFeed]
  try {
    const [feedResult, entResult, pmResult, infoResult] = await Promise.allSettled(tasks.map(request => request()))
    if (entResult.status === 'fulfilled') entitlement.value = entResult.value
    if (pmResult.status === 'fulfilled') premarket.value = pmResult.value
    if (infoResult.status === 'fulfilled') info.value = infoResult.value?.data || infoResult.value
    if (feedResult.status === 'fulfilled') {
      feed.value = feedResult.value
      loadError.value = ''
      const at = feed.value?.serverReceivedAt || feed.value?.generated_at
      lastUpdated.value = at ? `${zonedTime(at, 'Asia/Shanghai')} 更新` : '数据就绪'
    } else if (!silent || !feed.value) {
      feed.value = null
      loadError.value = friendlyError(feedResult.reason, '今日数据加载失败')
      // 会员端不连接 OSM 账号（W7）：后端暂无数据时只在页面提示，不弹错误
      if (!silent && !/暂无数据|请先同步/.test(loadError.value) && !isHandledError(feedResult.reason)) ElMessage.error(loadError.value)
    }
  } finally {
    loading.value = false
  }
}

function friendlyError(error, fallback) {
  const message = error?.message || ''
  if (/handshake|SSL|TLS|I\/O error|ECONN|timed? out|connection reset/i.test(message)) return '无法连接 OSM 上游服务（网络或 TLS 握手失败），请稍后重试。'
  return message || fallback
}

function toggleCat() {
  catEnabled.value = !catEnabled.value
  localStorage.setItem('option-today-cat', catEnabled.value ? '1' : '0')
  ElMessage.success(`招财猫已${catEnabled.value ? '开启' : '关闭'}`)
}

function jump(hash) {
  document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function share(card) {
  const text = `${card.symbol} ${card.name} ${card.leg}${card.expiry ? ` · ${card.expiry}` : ''} · ${card.premLabel} ${card.prem}（OSMTRADE.COM）`
  try { await navigator.clipboard.writeText(text); ElMessage.success('卡片摘要已复制') } catch { ElMessage.info(text) }
}
</script>

<style src="./today-v3.css"></style>
