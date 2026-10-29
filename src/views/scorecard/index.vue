<template>
  <div class="rcv3">
    <section class="hero"><div class="wrap">
      <div class="hero-top">
        <div>
          <span class="eyebrow"><i />REVIEW · PERFORMANCE</span>
          <h1>战绩<DataViewTag resource="record" /></h1>
          <p class="hero-sub">{{ heroSub }}</p>
        </div>
        <div class="hero-ctl">
          <span class="glass-pill"><i />{{ syncLabel }}</span>
          <button class="glass-pill" type="button" :disabled="!ready" @click="shareSummary">分享{{ range === 'month' ? '本月' : '全部' }}</button>
        </div>
      </div>
    </div></section>

    <div class="body"><div class="wrap">
      <section v-if="dataView.empty" class="card rc-sec"><DelayedEmpty resource="record" /></section>

      <main v-else class="main solo rc" :class="{ skeleton: loading && ready }">
        <section v-if="!ready" class="card rc-sec">
          <div class="rc-empty">
            <template v-if="loading"><b>正在读取战绩…</b>正在从本地服务读取 OSM 同步的战绩数据</template>
            <template v-else><b>暂无数据</b>{{ error || '后端定时任务尚未同步战绩菜单的数据，请稍后刷新。' }}<br><button class="btn-s" type="button" @click="loadAll">重新加载</button></template>
          </div>
        </section>

        <template v-else>
          <!-- ① 每日结算净额 -->
          <section class="card rc-sec">
            <div class="rc-h"><h2>每日结算净额 · 管理后口径</h2>
              <div class="seg"><button type="button" :class="{ on: scope === 'all' }" @click="scope = 'all'">全部正式信号</button><button type="button" :class="{ on: scope === 'mine' }" @click="scope = 'mine'">我跟了的</button></div>
              <span class="rc-d">{{ scopeDesc }}</span>
              <code class="rc-f">finalNetPnlUsd · 样本起点 {{ sampleStart }}</code>
            </div>
            <div class="rc-ctl">
              <div class="seg"><button v-for="g in grains" :key="g.key" type="button" :class="{ on: granularity === g.key }" @click="granularity = g.key">{{ g.label }}</button></div>
              <div class="seg"><button v-for="t in chartTypes" :key="t.key" type="button" :class="{ on: chartType === t.key }" @click="chartType = t.key">{{ t.label }}</button></div>
              <div class="seg"><button type="button" :class="{ on: range === 'month' }" @click="range = 'month'">本月</button><button type="button" :class="{ on: range === 'all' }" @click="range = 'all'">全部</button></div>
              <div class="rc-lg"><span><i class="sq up" />结算盈利</span><span><i class="sq dn" />结算亏损</span><span v-if="floatingOn"><i class="sq fl" />当日浮动盈亏（未结算）</span></div>
            </div>
            <div ref="chartEl" class="chart">
              <svg v-if="chartModel" :viewBox="`0 0 ${chartModel.w} ${chartModel.h}`" :width="chartModel.w" :height="chartModel.h" role="img" aria-label="每日结算净额">
                <line :x1="chartModel.pad" :x2="chartModel.w - chartModel.pad" :y1="chartModel.y0" :y2="chartModel.y0" class="ax" />
                <template v-if="chartType === 'bar'">
                  <rect v-for="(b, i) in chartModel.floats" :key="`f${i}`" :x="b.x" :y="b.y" :width="b.w" :height="b.h" :class="`fl ${b.cls}`" />
                  <rect v-for="(b, i) in chartModel.bars" :key="`b${i}`" :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="2" :class="b.cls"><title>{{ b.title }}</title></rect>
                </template>
                <template v-else>
                  <path :d="chartModel.area" :class="`area ${chartModel.lineCls}`" />
                  <path :d="chartModel.line" :class="`ln ${chartModel.lineCls}`" />
                </template>
                <text v-for="(t, i) in chartModel.marks" :key="`m${i}`" :x="t.x" :y="t.y" :class="`lb ${t.cls}`" :text-anchor="t.anchor">{{ t.text }}</text>
                <text v-for="(t, i) in chartModel.xlabels" :key="`x${i}`" :x="t.x" :y="chartModel.h - 6" :class="`xl ${t.cls}`" :text-anchor="t.anchor">{{ t.text }}</text>
              </svg>
              <div v-else class="rc-empty">当前区间暂无结算数据</div>
            </div>
            <div class="rc-sub"><span>全部信号 · <b>按结算日归集</b><template v-if="daySpan"> · 逐日序列 {{ daySpan }}（{{ chartRows.length }} 个交易日）</template></span></div>
            <div class="tiles t6">
              <div v-for="tile in chartTiles" :key="tile.label" class="tile"><small>{{ tile.label }}</small><b class="num" :class="tile.cls">{{ tile.value }}</b><em>{{ tile.sub }}</em></div>
            </div>
            <details class="more"><summary>详细说明</summary><p>上面六格<b>按开仓日归集</b>，与图表（按结算日）切法不同：一笔上月末开仓、本月到期的单，图上算本月、这里算上月。实心柱 = 当日到期结算净额（仅结算日出现）；虚线半透明细柱 = 当日未结算生命周期的浮动盈亏，取终端收盘标记（管理后），当天未收盘时用盘中 livePnlUsd，不计入上面的结算合计。逐笔明细见下方「已结算记录」。</p></details>
          </section>

          <!-- ② 按账户规模 -->
          <section class="card rc-sec">
            <div class="rc-h"><h2>按账户规模 · 自动驾驶默认设置跟单</h2>
              <span class="rc-d">{{ accountDesc }}</span>
              <code class="rc-f">{{ accountAsOf }}</code>
            </div>
            <div v-if="accountCards.length" class="acc3">
              <div v-for="acc in accountCards" :key="acc.id" class="acc">
                <div class="acc-h"><b>{{ acc.title }}</b><small>每条 {{ acc.qty }} 张</small><span class="num" :class="cls(acc.pnlUsd)">{{ money(acc.pnlUsd) }} · {{ pctText(acc.pnlPct) }}</span></div>
                <svg v-if="acc.sp" class="spk" viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true">
                  <line x1="0" x2="300" :y1="acc.sp.y0" :y2="acc.sp.y0" class="ax" />
                  <path :d="`M${acc.sp.d}L300,90L0,90Z`" :class="`area ${acc.sp.positive ? 'u' : 'd'}`" />
                  <path :d="`M${acc.sp.d}`" :class="`ln ${acc.sp.positive ? 'u' : 'd'}`" />
                </svg>
                <div class="acc-x num"><span>{{ acc.sp ? acc.sp.start : '—' }}</span><span>{{ acc.replayUntil || '—' }} 后跟踪</span><span>{{ acc.sp ? acc.sp.end : '—' }}</span></div>
                <div class="acc-m">
                  <div><small>最大回撤</small><b class="num">{{ plainPct(acc.maxDrawdownPct) }}</b><em>{{ money(acc.maxDrawdownUsd) }} · 谷底 {{ shortDay(acc.maxDrawdownTroughDay) }}</em></div>
                  <div><small>最差一周</small><b class="num down">{{ money(acc.worstWeek && acc.worstWeek.pnlUsd) }}</b><em>{{ shortDay(acc.worstWeek && acc.worstWeek.weekOf) }} 那周</em></div>
                  <div><small>跟了 / 被挡</small><b class="num">{{ acc.taken }} / {{ acc.skipped }}</b><em>{{ acc.skipText }}</em></div>
                  <div><small>在途</small><b class="num">{{ acc.inFlightN }} 组</b><em>占用最高 {{ plainPct(acc.peakUtilPct) }} · 风险 {{ plainUsd(acc.inFlightRisk) }}</em></div>
                </div>
              </div>
            </div>
            <div v-else class="tap-empty">账户模拟暂不可用</div>
            <p class="rc-note">按自动驾驶默认设置模拟跟单，不是任何会员的真实成交。买方、中期卡、对冲卡不在里面；在途仓位按当前估值计入。</p>
            <details class="more"><summary>详细说明 · 每档用的设置</summary>
              <div class="tbl-w"><table class="tbl"><thead><tr><th>每档设置</th><th>$20,000</th><th>$35,000</th><th>$50,000</th></tr></thead><tbody>
                <tr><td>每条张数</td><td>1 张</td><td>2 张</td><td>3 张</td></tr>
                <tr><td>账户档位</td><td>2 万以下</td><td>2.5–5 万</td><td>5 万以上</td></tr>
                <tr><td>跟哪些宽度</td><td>5、7.5、10 美元宽</td><td>5、7.5、10、15 美元宽</td><td>5、7.5、10、15、20+ 美元宽</td></tr>
                <tr><td>同一标的同方向最多</td><td>3 组</td><td>3 组</td><td>3 组</td></tr>
                <tr><td>同一行业最多</td><td>3 只标的</td><td>4 只标的</td><td>5 只标的</td></tr>
                <tr><td>同簇占用（半导体 + AI 硬件）</td><td>不超过净资产 50%</td><td>不超过净资产 55%</td><td>不超过净资产 60%</td></tr>
                <tr><td>常规额度</td><td>在途占用 ≤ 净资产 50%</td><td>在途占用 ≤ 净资产 50%</td><td>在途占用 ≤ 净资产 60%</td></tr>
                <tr><td>短期卖方每天最多</td><td>10 组</td><td>20 组</td><td>不限</td></tr>
              </tbody></table></div>
            </details>
          </section>

          <!-- ③ 移仓链账 -->
          <section class="card rc-sec">
            <div class="rc-h"><h2>移仓链账 · 移仓前后对照</h2><span class="rc-d">{{ managementDesc }}</span></div>
            <div v-if="management && management.available !== false" class="nums4">
              <div v-for="cell in managementNums" :key="cell.label"><small>{{ cell.label }}</small><b class="num" :class="cell.cls">{{ cell.value }}</b></div>
            </div>
            <div v-else class="tap-empty">移仓链账暂不可用</div>
            <p v-if="management && management.note" class="rc-note">{{ management.note }}</p>
            <details v-if="management" class="more"><summary>详细说明 · 选择分布与场景对照</summary>
              <p>「所选」= 你真走的那条路，「推荐」= 系统当时给的那条路，「不做」= 卡发出来但你什么都不做。</p>
              <div class="tbl-w"><table class="tbl"><thead><tr><th>选择</th><th>卡数</th><th>结算净额</th></tr></thead><tbody>
                <tr v-for="row in management.byChoice || []" :key="row.key"><td><b>{{ row.key }}</b></td><td class="num">{{ row.n }}</td><td class="num" :class="cls(row.pnl)">{{ money(row.pnl) }}</td></tr>
              </tbody></table></div>
              <div class="tbl-w"><table class="tbl"><thead><tr><th>到期日场景</th><th>卡数</th><th>不做</th><th>按推荐</th><th>推荐 − 不做</th></tr></thead><tbody>
                <tr v-for="row in managementScenarios" :key="row.key"><td>{{ row.key }}</td><td class="num">{{ row.n }}</td><td class="num" :class="cls(row.nodo)">{{ money(row.nodo) }}</td><td class="num" :class="cls(row.rec)">{{ money(row.rec) }}</td><td class="num" :class="cls(row.diff)">{{ money(row.diff) }}</td></tr>
              </tbody></table></div>
            </details>
          </section>

          <!-- ④ 按标的 -->
          <section class="card rc-sec">
            <div class="rc-h"><h2>按标的 · 管理后净结果</h2><span class="rc-d">{{ rangeLabel }} · 已结算 + 在途 · 共 {{ symbolRows.length }} 个标的</span><code class="rc-f">symbols[].pnlUsd / settledPnlUsd / livePnlUsd</code></div>
            <div v-if="symbolRows.length" class="sym2">
              <div v-for="row in symbolRows" :key="row.symbol" class="sy"><b>{{ row.symbol }}</b><span class="bar"><i :class="row.pnl >= 0 ? 'u' : 'd'" :style="{ width: `${row.width}%` }" /></span><em class="num" :class="cls(row.pnl)">{{ money(row.pnl) }}</em><small>{{ row.groups }} 组</small></div>
            </div>
            <div v-else class="tap-empty">当前区间暂无按标的数据</div>
          </section>

          <!-- ⑤ 胜负 / 幅度 -->
          <div class="two">
            <section class="card rc-sec"><div class="rc-k">胜负分布 · PROFITABLE / LOSSES</div>
              <div v-for="row in winRows" :key="row.label" class="wl"><span>{{ row.label }} <b class="num">{{ row.n }}</b></span><span class="bar"><i :class="row.cls" :style="{ width: `${row.pct}%` }" /></span><em class="num">{{ row.pct }}%</em></div>
              <p class="rc-note">已结算 {{ evaluated }} 笔 · 胜率 {{ winRateText }}（管理后口径）</p>
            </section>
            <section class="card rc-sec"><div class="rc-k">单笔幅度范围 · 研究口径</div>
              <div class="rng"><div class="rng-l" />
                <span v-for="pt in rangePoints" :key="pt.key" class="pt" :class="pt.cls" :style="{ left: `${pt.x}%` }"><i /><em class="num">{{ pt.text }}</em></span>
                <span class="zero" :style="{ left: `${zeroPos}%` }" />
              </div>
              <p class="rc-note">实心＝区间极值（maxSingle*Usd）· 空心＝均值（average*Usd）</p>
            </section>
          </div>

          <!-- ⑥ 已结算记录 -->
          <section class="card rc-sec">
            <div class="rc-h"><h2>已结算记录 · {{ sampleStart }} 起</h2><span class="rc-d">{{ recordsCaption }}</span><code class="rc-f">管理后净结果缺失 = 终端 lifecycle 未完成，显示「待复核」</code></div>
            <div class="tbl-w"><table class="tbl rec"><thead><tr><th>标的 / 结构</th><th>到期</th><th>入场权利金</th><th>最大风险</th><th>持有日</th><th>保护成本</th><th>结果口径</th><th>管理后净结果</th><th>原价差对照</th></tr></thead><tbody>
              <template v-for="record in pageRecords" :key="record.id">
                <tr class="r1"><td><b>{{ record.symbol }}</b> <span class="num">{{ record.legs }}</span></td><td class="num">{{ record.expiry }}</td><td class="num">{{ plainUsd(record.credit) }}</td><td class="num">{{ record.riskText }}</td><td class="num">{{ record.days === null ? '—' : record.days }}</td><td class="num">{{ record.protection ? plainUsd(record.protection) : '$0' }}</td><td class="rs" :class="outcomeCls(record)">{{ record.basis }}</td><td class="num" :class="cls(record.pnl)"><template v-if="record.pending"><span class="stt rv">待复核</span></template><template v-else>{{ money(record.pnl) }}</template></td><td class="num mut">{{ money(record.baseline) }}</td></tr>
                <tr class="r2"><td colspan="9"><div><span class="why">卖方理由</span><span v-if="record.excluded" class="why">不计入</span><span class="wt">{{ record.reason }}</span><span class="stt" :class="record.excluded ? 'rv' : 'na'">{{ record.tag }}</span></div></td></tr>
              </template>
            </tbody></table></div>
            <div class="rec-m">
              <div v-for="record in pageRecords" :key="record.id" class="rm">
                <div class="rm-h"><b>{{ record.symbol }}</b><span class="num">{{ record.legs }}</span><em class="num" :class="cls(record.pnl)">{{ record.pending ? '待复核' : money(record.pnl) }}</em></div>
                <div class="rm-g num"><span><small>到期</small>{{ record.expiry }}</span><span><small>权利金 / 风险</small>{{ plainUsd(record.credit) }} / {{ record.riskText }}</span><span><small>持有 · 保护</small>{{ record.days === null ? '—' : record.days }} 日 · {{ plainUsd(record.protection) }}</span><span><small>原价差对照</small>{{ money(record.baseline) }}</span></div>
                <div class="rm-f"><span class="rs" :class="outcomeCls(record)">{{ record.basis }}</span><span class="stt" :class="record.excluded ? 'rv' : 'na'">{{ record.tag }}</span></div>
                <p>{{ record.reason }}</p>
              </div>
            </div>
            <div v-if="pageRecords.length < visibleRecords.length" class="more-row"><button class="btn-s" type="button" @click="limit += PAGE">再显示 {{ Math.min(PAGE, visibleRecords.length - pageRecords.length) }} 条</button></div>
            <p class="rc-note mono">字段：symbol · structure · expiry · entryPricing.midpointCredit×100 · maxRisk · holdingTradingDays · protectionCostUsd · resultKind · finalNetPnlUsd（管理后）· researchPnlUsd（原价差）· lifecyclePnlBasis · sellerReason</p>
          </section>

          <!-- ⑦ 中期卖方卡 -->
          <section class="card rc-sec">
            <div class="rc-h"><h2>中期卖方卡 · 单独统计</h2>
              <span class="rc-d">{{ midtermDesc }}</span>
              <span class="rc-r">不计入上方战绩合计</span>
            </div>
            <template v-if="midterm && midterm.available">
              <div class="tiles t4">
                <div v-for="tile in midtermTiles" :key="tile.label" class="tile"><small>{{ tile.label }}</small><b class="num" :class="tile.cls">{{ tile.value }}</b><em>{{ tile.sub }}</em></div>
              </div>
              <div class="chips">
                <span v-for="row in midtermRows" :key="row.id" class="mc" :class="row.cls">{{ row.label }} <b class="num">{{ money(row.pnl) }}</b></span>
              </div>
              <p class="rc-note">{{ midterm.basis }}</p>
            </template>
            <div v-else class="tap-empty">中期卡族还没有发过卡。</div>
          </section>

          <!-- ⑧ 买方机会卡 -->
          <section class="card rc-sec">
            <div class="rc-h"><h2>买方机会卡 · 另一把尺</h2>
              <span class="rc-d">{{ buyerDesc }}</span>
              <span class="rc-r">{{ buyer && buyer.basis }}</span>
            </div>
            <template v-if="buyer && buyer.available">
              <div class="chips st">
                <span>发卡 {{ counts.ISSUED || 0 }}</span><span>窗口中 {{ counts.IN_WINDOW || 0 }}</span><span>触及买腿 {{ counts.REACHED_LONG || 0 }}</span><span>到期结算 {{ counts.SETTLED || 0 }}</span>
              </div>
              <div class="tiles t4">
                <div v-for="tile in buyerTiles" :key="tile.label" class="tile"><small>{{ tile.label }}</small><b class="num">{{ tile.value }}</b><em>{{ tile.sub }}</em></div>
              </div>
              <div class="nums4 n3">
                <div v-for="cell in buyerNums" :key="cell.label"><small>{{ cell.label }}</small><b class="num" :class="cell.cls">{{ cell.value }}</b></div>
              </div>
              <div class="tbl-w"><table class="tbl"><thead><tr><th>卡上声称</th><th>实测到过</th><th>差</th><th>样本</th></tr></thead><tbody>
                <tr v-for="row in buyerLadder" :key="row.claimedPct"><td><b>{{ row.claimedPct }}% 概率涨到</b></td><td class="num">{{ row.actualPct }}%</td><td class="num" :class="cls(row.gapPp)">{{ row.gapText }}</td><td class="num mut">n={{ row.n }}</td></tr>
              </tbody></table></div>
              <p class="rc-note">「赚 50%／100% 的最好平仓点」不在本表：那要沿路径给期权重定价，是模型不是事实。卡面上那两格是<b>同类卡的历史基率</b>，不是这些卡的结算结果。结算表生成于 {{ buyerAsOf }}。</p>
            </template>
            <div v-else class="tap-empty">买方卡族还没有发过卡。</div>
          </section>
        </template>
      </main>
    </div></div>
  </div>
</template>

<script setup>
import DataViewTag from '@/components/option/DataViewTag.vue'
import DelayedEmpty from '@/components/option/DelayedEmpty.vue'
import { useDataView } from '@/utils/accessStore'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getRecordKind, getRecordSummary } from '@/api/option/record'
import { money, num, plainUsd, toRecord } from '@/utils/recordData'

const dataView = useDataView('record')
const PAGE = 40
const grains = [{ key: 'day', label: '日' }, { key: 'week', label: '周' }, { key: 'month', label: '月' }]
const chartTypes = [{ key: 'bar', label: '柱状' }, { key: 'line', label: '折线' }, { key: 'cum', label: '累计' }]

const scope = ref('all')
const granularity = ref('day')
const chartType = ref('bar')
const range = ref('all')
const limit = ref(PAGE)

const loading = ref(false)
const error = ref('')
const head = ref(null)
const statItems = ref([])
const dailyItems = ref([])
const trades = ref([])
const symbolItems = ref([])
const accounts = ref([])
const ready = computed(() => !!head.value)

const statOf = id => statItems.value.find(item => item.id === id) || null
const statAll = computed(() => statOf('all'))
const statRange = computed(() => statOf(range.value === 'month' ? 'month' : 'all'))
const management = computed(() => statOf('management'))
const midterm = computed(() => statOf('midterm'))
const buyer = computed(() => statOf('buyer'))

// ---------------------------------------------------------------- 格式化
const cls = value => (num(value) === null ? 'mut' : value > 0 ? 'up' : value < 0 ? 'down' : 'mut')
const pctText = value => (num(value) === null ? '—' : `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}%`)
const plainPct = value => (num(value) === null ? '—' : `${Math.abs(value).toFixed(1)}%`)
const shortDay = value => (value ? String(value).slice(5).replace('-', '/') : '—')
const rangeLabel = computed(() => (range.value === 'month' ? '本月' : '全部'))

// ---------------------------------------------------------------- 头部
const marketDay = computed(() => head.value?.marketDay || '')
const marketDayLabel = computed(() => marketDay.value.replaceAll('-', '/') || '—')
const sampleStart = computed(() => statAll.value?.tracking?.start || head.value?.marketDay || '—')
const syncLabel = computed(() => {
  if (!head.value) return loading.value ? '正在加载' : '暂无同步数据'
  const t = String(head.value.syncTime || '').match(/\d{4}-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/)
  return `交易日 ${marketDayLabel.value}${t ? ` · 同步 ${t[1]}/${t[2]} ${t[3]}` : ''}`
})
const heroSub = computed(() => `正式信号的逐笔复盘 · 每条按管理后净结果记账 · 按结算日（ET）归集${statAll.value?.asOfEt ? ` · 终端口径 ${statAll.value.asOfEt}` : ''}`)
const scopeDesc = computed(() => (scope.value === 'all' ? '全部正式发布信号 · 每条 1 组' : '只算你标记「跟了」的信号 · 按组数放大金额'))

// ---------------------------------------------------------------- 图表
const chartEl = ref(null)
const chartW = ref(900)
let observer = null
const grain = computed(() => granularity.value)
const floatingOn = computed(() => grain.value === 'day' && chartType.value === 'bar')
const labelOf = (key, g) => {
  const raw = String(key || '')
  if (g === 'month') return raw.length >= 7 ? `${raw.slice(5)} 月` : raw
  return raw.length >= 10 ? raw.slice(5).replace('-', '/') : raw
}
const chartRows = computed(() => (dailyItems.value || []).map(item => ({
  key: String(item.key ?? ''),
  label: labelOf(item.key, grain.value),
  settled: num(item.pnl),
  floating: num(item.floatPnl),
  cumulative: num(item.cumulativePnl) ?? 0,
  count: num(item.count) ?? 0,
  intraday: item.intraday === true
})).filter(row => row.key))
// 逐日序列的真实覆盖区间（取接口返回的第一天与最后一天）
const daySpan = computed(() => {
  const rows = chartRows.value
  if (rows.length < 2) return ''
  return `${labelOf(rows[0].key, grain.value)}–${labelOf(rows[rows.length - 1].key, grain.value)}`
})
const chartModel = computed(() => {
  const rows = chartRows.value
  const w = Math.max(320, chartW.value)
  const h = 240
  const pad = 8
  const top = 24
  const bottom = 26
  if (!rows.length) return null
  const n = rows.length
  const bw = (w - pad * 2) / n
  const isBar = chartType.value === 'bar'
  const isCum = chartType.value === 'cum'
  let accum = 0
  const cumValues = rows.map(row => (accum += row.settled || 0))
  const flat = isCum ? cumValues : rows.flatMap(row => (isBar ? [row.settled || 0, row.floating || 0] : [row.settled || 0]))
  const max = Math.max(1, ...flat)
  const min = Math.min(0, ...flat)
  const span = max - min || 1
  const y = value => top + ((max - value) / span) * (h - top - bottom)
  const y0 = y(0)
  const bars = []
  const floats = []
  if (isBar) {
    rows.forEach((row, i) => {
      const x = pad + i * bw
      const body = Math.max(2, bw * 0.56)
      const thin = Math.max(1.5, bw * 0.22)
      if (row.floating) floats.push({ x: x + bw / 2 - thin / 2 + body * 0.32, y: Math.min(y(row.floating), y0), w: thin, h: Math.max(1, Math.abs(y(row.floating) - y0)), cls: row.floating > 0 ? 'u' : 'd' })
      if (row.settled) bars.push({ x: x + bw / 2 - body / 2, y: Math.min(y(row.settled), y0), w: body, h: Math.max(1, Math.abs(y(row.settled) - y0)), cls: row.settled > 0 ? 'u' : 'd', title: `${row.label} ${money(row.settled)}` })
    })
  }
  const marks = []
  const settledRows = rows.filter(row => row.settled)
  if (settledRows.length && isBar) {
    const best = settledRows.reduce((a, b) => (b.settled > a.settled ? b : a))
    const worst = settledRows.reduce((a, b) => (b.settled < a.settled ? b : a))
    for (const row of [best, worst]) {
      const i = rows.indexOf(row)
      marks.push({ x: pad + i * bw + bw / 2, y: row.settled > 0 ? y(row.settled) - 6 : y(row.settled) + 13, cls: row.settled > 0 ? 'up' : 'down', anchor: 'middle', text: money(row.settled) })
    }
  }
  let line = ''
  let area = ''
  let lineCls = 'u'
  if (!isBar) {
    const values = isCum ? cumValues : rows.map(row => row.settled || 0)
    const points = values.map((value, i) => [pad + i * bw + bw / 2, y(value)])
    const last = values[values.length - 1] || 0
    lineCls = last >= 0 ? 'u' : 'd'
    line = `M${points.map(point => point.join(',')).join('L')}`
    area = `${line}L${points[points.length - 1][0]},${y0}L${points[0][0]},${y0}Z`
    marks.push({ x: points[points.length - 1][0], y: points[points.length - 1][1] - 8, cls: last > 0 ? 'up' : last < 0 ? 'down' : 'mut', anchor: 'end', text: money(last) })
  } else {
    const lastRow = rows[rows.length - 1]
    if (lastRow.floating) marks.push({ x: w - pad - 12, y: Math.min(y(lastRow.floating) + 13, h - bottom - 6), cls: lastRow.floating > 0 ? 'up' : 'down', anchor: 'end', text: money(lastRow.floating) })
  }
  const step = Math.max(1, Math.ceil(n / (w < 600 ? 4 : 9)))
  const xlabels = []
  rows.forEach((row, i) => {
    if (i % step === 0 || i === n - 1) xlabels.push({ x: pad + i * bw + bw / 2, cls: i === n - 1 ? 'b' : '', anchor: i === n - 1 ? 'end' : 'middle', text: row.label })
  })
  return { w, h, pad, y0, bars, floats, marks, xlabels, line, area, lineCls }
})

// ---------------------------------------------------------------- 六格
const chartTiles = computed(() => {
  const tracking = statRange.value?.tracking || {}
  if (scope.value === 'all') {
    const priced = num(tracking.priced) ?? 0
    const winners = num(tracking.winners) ?? 0
    const rate = num(tracking.winRate)
    const settledPnl = num(tracking.settledPnlUsd)
    const managed = num(tracking.managedPnlUsd)
    // 月 / 周口径的 tracking 不带 livePnlUsd、liveTotal，用 管理后 − 已结算 还原
    const livePnl = num(tracking.livePnlUsd) ?? (managed !== null && settledPnl !== null ? managed - settledPnl : null)
    const liveN = num(tracking.liveTotal) ?? Math.max(0, (num(tracking.total) ?? 0) - (num(tracking.settledPriced) ?? 0))
    return [
      { label: '全部 · 管理后', value: money(tracking.managedPnlUsd), cls: cls(tracking.managedPnlUsd), sub: '已结算 + 在途浮动' },
      { label: '原价差对照', value: money(tracking.rawPnlUsd), cls: cls(tracking.rawPnlUsd), sub: '未含管理动作' },
      { label: '已结算', value: money(tracking.settledPnlUsd), cls: cls(tracking.settledPnlUsd), sub: `${num(tracking.settledPriced) ?? 0} 笔已到期` },
      { label: '在途', value: money(livePnl), cls: cls(livePnl), sub: `livePnlUsd · ${liveN} 笔` },
      { label: '胜率 · 管理后', value: rate === null ? '—' : `${rate}%`, cls: 'mut', sub: `${winners} 胜 / ${Math.max(0, priced - winners)} 负` },
      { label: '入场权利金', value: plainUsd(tracking.premiumUsd), cls: 'mut', sub: `${num(tracking.eligibleTotal ?? tracking.total) ?? 0} 笔 · 自 ${tracking.start || '—'}` }
    ]
  }
  const adopted = statAll.value?.adoptedSummary || {}
  const settled = chartRows.value.reduce((sum, row) => sum + (row.settled || 0), 0)
  const live = grain.value === 'day' ? (chartRows.value[chartRows.value.length - 1]?.floating || 0) : 0
  const rate = num(adopted.winRate)
  return [
    { label: '全部 · 管理后', value: money(settled + live), cls: cls(settled + live), sub: '已结算 + 在途浮动' },
    { label: '原价差对照', value: '—', cls: 'mut', sub: '接口未按跟单口径拆分' },
    { label: '已结算', value: money(settled), cls: cls(settled), sub: `${num(adopted.evaluated) ?? 0} 笔已到期` },
    { label: '在途', value: money(live), cls: cls(live), sub: '按当日收盘标记' },
    { label: '胜率 · 管理后', value: rate === null ? '—' : `${rate}%`, cls: 'mut', sub: `${num(adopted.profitable) ?? 0} 胜 / ${num(adopted.losses) ?? 0} 负` },
    { label: '入场权利金', value: plainUsd(adopted.premium), cls: 'mut', sub: `${num(adopted.evaluated) ?? 0} 笔 · 自 ${adopted.sampleStart || sampleStart.value}` }
  ]
})

// ---------------------------------------------------------------- 账户规模
const accountSim = computed(() => statOf('accountSim') || {})
const accountAsOf = computed(() => {
  const raw = String(accountSim.value.asOf || '')
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/)
  return m ? `估值 ${m[2]}/${m[3]} ${m[4]} ET` : ''
})
const accountDesc = computed(() => {
  const sim = accountSim.value
  if (!sim.n) return '2026 年起正式短期卖方信号 · 按自动驾驶默认设置逐条过门'
  return `${sim.sampleStart || '—'} 起 ${sim.n} 条正式短期卖方信号 · 每条张数 2 万 1 张 / 3.5 万 2 张 / 5 万 3 张${sim.replayUntil ? ` · ${sim.replayUntil} 前为回放，之后每天往后跟踪` : ''}`
})
const sparkOf = curve => {
  const points = (curve || []).filter(point => Array.isArray(point) && point.length >= 2).map(point => [String(point[0]), Number(point[1]) || 0])
  if (points.length < 2) return null
  const width = 300
  const height = 90
  const values = points.map(point => point[1])
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const y = value => 6 + ((max - value) / ((max - min) || 1)) * (height - 12)
  return {
    d: values.map((value, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${y(value).toFixed(1)}`).join('L'),
    y0: y(0),
    start: shortDay(points[0][0]),
    end: shortDay(points[points.length - 1][0]),
    positive: values[values.length - 1] >= 0
  }
}
const accountCards = computed(() => (accounts.value || []).map(acc => ({
  id: acc.id,
  title: `${acc.size ? `$${Math.round(acc.size / 1000)}k` : acc.id} 账户`,
  qty: num(acc.qty) ?? 1,
  pnlUsd: num(acc.pnlUsd),
  pnlPct: num(acc.pnlPct),
  maxDrawdownPct: num(acc.maxDrawdownPct),
  maxDrawdownUsd: num(acc.maxDrawdownUsd),
  maxDrawdownTroughDay: acc.maxDrawdownTroughDay,
  worstWeek: acc.worstWeek || null,
  taken: num(acc.taken) ?? 0,
  skipped: num(acc.skipped) ?? 0,
  skipText: (acc.skipTop || []).slice(0, 2).map(item => `${item.why} ${item.n}`).join('、') || '—',
  inFlightN: num(acc.inFlight?.n) ?? 0,
  inFlightRisk: num(acc.inFlight?.riskUsd),
  peakUtilPct: num(acc.peakUtilPct),
  replayUntil: acc.replayUntil || accountSim.value.replayUntil || '',
  sp: sparkOf(acc.curve)
})))

// ---------------------------------------------------------------- 移仓链账
const managementDesc = computed(() => {
  const item = management.value
  if (!item) return '暂不可用'
  return `${num(item.chosen) ?? 0} 条选择 · 已结算 ${num(item.settled) ?? 0} · 跟随推荐 ${num(item.followRecRate) ?? 0}%`
})
const managementNums = computed(() => {
  const item = management.value || {}
  return [
    { label: '所选路 · 真实结算', value: money(item.choicePnlUsd), cls: cls(item.choicePnlUsd) },
    { label: '推荐路', value: money(item.recPnlUsd), cls: cls(item.recPnlUsd) },
    { label: '最优路', value: money(item.bestPnlUsd), cls: cls(item.bestPnlUsd) },
    { label: '什么都不做', value: money(item.noDoPnlUsd), cls: cls(item.noDoPnlUsd) }
  ]
})
const managementScenarios = computed(() => Object.entries(management.value?.byScenario || {})
  .map(([key, row]) => ({ key, n: num(row.n) ?? 0, nodo: num(row.nodo_pnl), rec: num(row.rec_pnl), diff: (num(row.rec_pnl) ?? 0) - (num(row.nodo_pnl) ?? 0) }))
  .sort((a, b) => b.n - a.n))

// ---------------------------------------------------------------- 按标的
const symbolRows = computed(() => {
  const rows = (symbolItems.value || []).map(item => ({
    symbol: item.symbol || '—',
    pnl: num(item.pnlUsd) ?? 0,
    settled: num(item.settledPnlUsd) ?? 0,
    live: num(item.livePnlUsd) ?? 0,
    groups: (num(item.settledGroups) ?? 0) + (num(item.liveGroups) ?? 0)
  })).sort((a, b) => b.pnl - a.pnl)
  const max = Math.max(1, ...rows.map(row => Math.abs(row.pnl)))
  return rows.map(row => ({ ...row, width: Math.max(1.5, (Math.abs(row.pnl) / max) * 100) }))
})

// ---------------------------------------------------------------- 胜负 / 幅度
const summary = computed(() => statRange.value?.summary || {})
const evaluated = computed(() => num(summary.value.evaluated) ?? 0)
const winRateText = computed(() => (num(summary.value.winRate) === null ? '—' : `${summary.value.winRate}%`))
const winRows = computed(() => {
  const total = evaluated.value || 1
  const winners = num(summary.value.profitable) ?? 0
  const losses = num(summary.value.losses) ?? 0
  return [
    { label: '盈利', n: winners, pct: Math.round((winners / total) * 100), cls: 'u' },
    { label: '亏损', n: losses, pct: Math.round((losses / total) * 100), cls: 'd' }
  ]
})
// 极值 / 均值：优先取 research；月 / 周口径的 research 缺均值与最大盈利，回落到 summary
const rangeValues = computed(() => {
  const research = statRange.value?.research || {}
  const stats = summary.value || {}
  const pick = (a, b) => (num(a) !== null ? num(a) : num(b))
  return [
    { key: 'max-loss', label: '最大亏损', value: pick(research.maxSingleLossUsd, stats.maxLoss), solid: true, side: 'd' },
    { key: 'avg-loss', label: '平均亏损', value: pick(research.averageLossUsd, stats.avgLoss), solid: false, side: 'd' },
    { key: 'avg-profit', label: '平均盈利', value: pick(research.averageProfitUsd, stats.avgProfit), solid: false, side: 'u' },
    { key: 'max-profit', label: '最大盈利', value: pick(research.maxSingleProfitUsd, stats.maxProfit), solid: true, side: 'u' }
  ].filter(item => item.value !== null)
})
const rangePoints = computed(() => {
  const items = rangeValues.value
  if (!items.length) return []
  const values = items.map(item => item.value).concat(0)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return items.map(item => ({ ...item, x: ((item.value - min) / span) * 100, cls: `${item.side}${item.solid ? ' f' : ''}`, text: money(item.value) }))
})
const zeroPos = computed(() => {
  const values = rangeValues.value.map(item => item.value)
  if (!values.length) return 50
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  return ((0 - min) / ((max - min) || 1)) * 100
})

// ---------------------------------------------------------------- 已结算记录
// 口径标签：realized_after_confirmed_management = 已确认管理；DATA_INCOMPLETE / 空 = 待复核
const BASIS_TAG = { realized_after_confirmed_management: '已确认管理', live_original_only_mid: '无管理动作', DATA_INCOMPLETE: '待复核' }
const records = computed(() => (trades.value || []).map((item, index) => {
  const record = toRecord(item, index)
  const close = item.executedClose
  // 「到期结算兜底」不是管理动作，仍按到期结算呈现
  const managed = close && close.familyCn && !/兜底|到期/.test(close.familyCn)
  const basis = managed ? `已执行平仓 · ${close.familyCn}` : record.basis
  return {
    ...record,
    basis,
    riskText: record.risk === null ? '—' : plainUsd(record.risk),
    reason: record.exclusionReason || item.sellerReason || '—',
    tag: record.excluded ? '不计入' : (BASIS_TAG[item.lifecycleBasis] || '待复核')
  }
}))
const visibleRecords = computed(() => (scope.value === 'mine' ? records.value.filter(record => record.lots) : records.value))
const pageRecords = computed(() => visibleRecords.value.slice(0, limit.value))
const recordsCaption = computed(() => `共 ${visibleRecords.value.length} 条${scope.value === 'mine' ? ' · 只算你跟了的' : ''} · 结算日倒序`)
const outcomeCls = record => (String(record.basis).includes('止盈') ? 'up' : String(record.basis).includes('止损') ? 'down' : '')

// ---------------------------------------------------------------- 中期卡
const midtermDesc = computed(() => {
  const item = midterm.value
  if (!item) return '暂不可用'
  const total = num(item.total) ?? 0
  const settled = num(item.settledN) ?? 0
  return `${total} 组 · 已了结 ${settled} · 在途 ${Math.max(0, total - settled)}`
})
const stageLabel = stage => ({
  OPEN: '在途',
  SHRUNK: '已减仓',
  EXPIRED: '到期',
  CLOSED_TAKE_PROFIT: '止盈',
  CLOSED_STOP_LOSS: '止损'
}[stage] || stage || '—')
const midtermRows = computed(() => (midterm.value?.rows || []).map(row => ({
  id: row.id,
  label: `${row.symbol} 卖 ${row.shortStrike}${row.side} / 买 ${row.longStrike}${row.side} · ${stageLabel(row.stage)}`,
  pnl: num(row.pnl),
  cls: (num(row.pnl) ?? 0) >= 0 ? 'u' : 'd'
})))
const midtermTiles = computed(() => {
  const item = midterm.value || {}
  const priced = num(item.priced) ?? 0
  const winners = num(item.winners) ?? 0
  const total = num(item.total) ?? 0
  const settled = num(item.settledN) ?? 0
  return [
    { label: '管理后合计', value: money(item.managedPnlUsd), cls: cls(item.managedPnlUsd), sub: '含在途' },
    { label: '胜率', value: num(item.winRate) === null ? '—' : `${item.winRate}%`, cls: 'mut', sub: `${winners} 胜 ${Math.max(0, priced - winners)} 负` },
    { label: '已了结', value: money(item.settledPnlUsd), cls: cls(item.settledPnlUsd), sub: `${settled} 组` },
    { label: '在途浮动', value: money(item.livePnlUsd), cls: cls(item.livePnlUsd), sub: `${Math.max(0, total - settled)} 组` }
  ]
})

// ---------------------------------------------------------------- 买方卡
const counts = computed(() => buyer.value?.counts || {})
const buyerDesc = computed(() => {
  const item = buyer.value
  if (!item) return '暂不可用'
  return `已发 ${num(item.issuedN) ?? 0} · 已结算 ${num(item.settledN) ?? 0} · 待结算 ${num(item.pendingN) ?? 0}`
})
const buyerTiles = computed(() => {
  const item = buyer.value || {}
  const pct = value => (num(value) === null ? '—' : `${value}%`)
  return [
    { label: '触及买腿', value: pct(item.reachLongPct), sub: '窗内最高价越过买腿' },
    { label: '到期在两腿之间', value: pct(item.expiryAboveLongPct), sub: '拿回部分内在价值' },
    { label: '到期吃满', value: pct(item.expiryFullPct), sub: '站上卖腿之外' },
    { label: '到期归零', value: pct(item.expiryZeroPct), sub: '亏损封顶成本' }
  ]
})
const buyerNums = computed(() => {
  const pnl = buyer.value?.pnl || {}
  return [
    { label: '已结算 · 按系统管理后', value: money(pnl.total), cls: cls(pnl.total) },
    { label: '总计成本', value: plainUsd(pnl.totalCost), cls: 'mut' },
    { label: '回报', value: pctText(pnl.returnPct), cls: cls(pnl.returnPct) },
    { label: '盈利张数', value: `${num(pnl.winN) ?? 0}`.concat(` / ${num(pnl.n) ?? 0}`), cls: 'mut' }
  ]
})
const buyerLadder = computed(() => (buyer.value?.ladder || []).map(row => ({
  claimedPct: row.claimedPct,
  actualPct: row.actualPct,
  n: num(row.n) ?? 0,
  gapPp: num(row.gapPp),
  gapText: num(row.gapPp) === null ? '—' : `${row.gapPp > 0 ? '+' : row.gapPp < 0 ? '−' : ''}${Math.abs(row.gapPp)} pp`
})))
const buyerAsOf = computed(() => {
  const raw = String(buyer.value?.generatedAt || '')
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/)
  return m ? `${m[2]}/${m[3]} ${m[4]}` : raw || '—'
})

// ---------------------------------------------------------------- 加载
async function loadDaily() {
  const body = await getRecordKind('daily', { range: range.value, scope: scope.value, granularity: grain.value })
  dailyItems.value = body?.items || []
}
async function loadPeriod() {
  const [tradeBody, symbolBody] = await Promise.all([
    getRecordKind('trade', { range: range.value }),
    getRecordKind('symbol', { range: range.value })
  ])
  trades.value = tradeBody?.items || []
  symbolItems.value = symbolBody?.items || []
  limit.value = PAGE
}
async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [headBody, statBody, accountBody] = await Promise.all([getRecordSummary(), getRecordKind('stat'), getRecordKind('account')])
    head.value = headBody
    statItems.value = statBody?.items || []
    accounts.value = accountBody?.items || []
    await Promise.all([loadPeriod(), loadDaily()])
  } catch (e) {
    head.value = null
    const message = e?.message || '加载失败'
    error.value = /暂无数据/.test(message) ? '' : message
  } finally {
    loading.value = false
  }
}
async function reload(task) {
  if (!ready.value) return
  loading.value = true
  try {
    await task()
  } catch (e) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}
async function shareSummary() {
  const tracking = statRange.value?.tracking || {}
  const text = `OSM 战绩 · ${rangeLabel.value}：管理后合计 ${money(tracking.managedPnlUsd)} · 已结算 ${money(tracking.settledPnlUsd)} · 胜率 ${tracking.winRate ?? '—'}%（研究口径）`
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* 剪贴板不可用时静默忽略 */
  }
}

watch([range, scope], () => {
  reload(async () => {
    await Promise.all([loadPeriod(), loadDaily()])
  })
})
watch(granularity, () => reload(loadDaily))
// 图表宽度跟随容器（设计稿按像素宽度重绘 SVG，文字才不会被拉伸）
const attachChart = () => {
  if (!observer || !chartEl.value) return
  observer.disconnect()
  const width = Math.round(chartEl.value.clientWidth)
  if (width > 0) chartW.value = width
  observer.observe(chartEl.value)
}
watch(ready, async value => {
  if (!value) return
  await nextTick()
  attachChart()
})
onMounted(() => {
  loadAll()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(entries => {
      const width = Math.round(entries[0].contentRect.width)
      if (width > 0 && Math.abs(width - chartW.value) > 2) chartW.value = width
    })
  }
})
onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})
</script>

<style src="./scorecard-v3.css"></style>
