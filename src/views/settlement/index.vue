<template>
  <div class="stv3">
    <section class="hero"><div class="wrap">
      <div class="hero-top">
        <div>
          <span class="eyebrow"><i />SETTLED · 已了结</span>
          <h1>结算，<em>每一笔整档收好。</em></h1>
          <p class="hero-sub">已经了结的每一笔，连同这一笔上发生过的保护、加腿与平仓，整档收在这里。进行与跟踪只管还开着的仓位。</p>
        </div>
        <div class="hero-ctl">
          <span class="glass-pill"><i class="ok" />已结算 <b class="num">{{ settledTotal }}</b> 笔</span>
        </div>
      </div>
      <div class="kpis k5">
        <div v-for="kpi in kpis" :key="kpi.key" :class="['kpi', { hl: kpi.hl }]">
          <div class="kpi-l"><i :style="{ background: kpi.dot }" />{{ kpi.label }}</div>
          <div class="kpi-v num" :style="{ color: kpi.color }">{{ kpi.value }}</div>
          <div class="kpi-s">{{ kpi.sub }}</div>
        </div>
      </div>
    </div></section>

    <div class="body"><div class="wrap">
      <main class="main solo">
        <section class="panel">
          <div class="card st-tool">
            <div class="tg-grp">
              <small>排序</small>
              <div class="seg">
                <button type="button" :class="{ on: sort === 'settled' }" @click="sort = 'settled'">按结算日</button>
                <button type="button" :class="{ on: sort === 'issued' }" @click="sort = 'issued'">按发报日</button>
              </div>
            </div>
            <div class="tg-grp">
              <small>区间</small>
              <div class="seg">
                <button v-for="item in ranges" :key="item.key" type="button" :class="{ on: range === item.key }" @click="range = item.key">{{ item.label }}</button>
              </div>
            </div>
            <div v-if="range === 'custom'" class="tg-grp">
              <input v-model="from" type="date" aria-label="起始日" />
              <span>—</span>
              <input v-model="to" type="date" aria-label="截止日" />
            </div>
            <span class="st-count num">{{ shownCount }} / {{ totalCount }} 笔</span>
          </div>

          <div v-for="day in dayGroups" :key="day.key" class="day">
            <div class="day-h">
              <b class="num">{{ day.key }}</b>
              <span>{{ sort === 'issued' ? '发报' : '结算' }}</span>
              <em>{{ day.items.length }} 笔</em>
            </div>
            <div class="grid3">
              <article v-for="card in day.items" :key="card.id" :class="['pc', card.tone, { open: openIds.has(card.id) }]">
                <div class="pc-hd">
                  <div class="pc-r1">
                    <span class="logo2">■</span>
                    <strong>{{ card.symbol }}</strong>
                    <span v-if="card.group" class="g">{{ card.group }}</span>
                    <span class="pc-time num">{{ card.time }}</span>
                  </div>
                  <div class="pc-tags"><span class="tg c">{{ card.tag }}</span></div>
                  <div class="pc-r2">
                    <div class="legs num"><small>到期 {{ card.expiry }}</small>{{ card.legs }}</div>
                    <div class="pnl"><small>{{ card.headLabel }}</small><b class="num">{{ card.valueText }}</b></div>
                  </div>
                </div>

                <div v-if="card.isRoll" class="sbar roll">
                  <span class="num">{{ card.barText }}</span>
                  <span class="acc num">{{ card.barAcc }}</span>
                </div>
                <div v-else class="sbar">
                  <span class="num">{{ card.barText }}</span>
                  <em :class="['oc', { tp: card.outcome === '提前止盈' }]">{{ card.outcome }}</em>
                </div>

                <div class="met">
                  <div><small>结果</small><b class="num">{{ card.outcome }}</b></div>
                  <div><small>{{ card.netLabel }}</small><b :class="['num', card.netTone]">{{ card.netText }}</b></div>
                  <div><small>{{ card.baseLabel }}</small><b :class="['num', card.baseTone]">{{ card.baseText }}</b></div>
                  <div><small>持有</small><b class="num">{{ card.holdText }}</b></div>
                  <div><small>保护窗口</small><b class="num">{{ card.windowText }}</b></div>
                  <div><small title="入场权利金 / 最大风险">入场权利金 / 最大风险</small><b class="num sm">{{ card.entryRisk }}</b></div>
                </div>

                <ol class="steps">
                  <li class="done">发报</li>
                  <li :class="card.hasProtection ? 'done' : ''">保护窗口</li>
                  <li :class="card.manages.length ? 'done' : ''">动态管理</li>
                  <li class="cur">{{ card.lastStep }}</li>
                </ol>

                <template v-if="card.manages.length">
                  <button class="dm-t" type="button" @click="toggle(card.id)">
                    <i><b v-for="(m, i) in card.manages" :key="i" :class="`k-${m.type}-c`" /></i>
                    动态管理策略 · {{ card.manages.length }} 项
                    <span class="done">已了结</span>
                    <em>展开</em>
                  </button>
                  <div class="dm">
                    <div class="tl">
                      <div v-for="m in card.manages" :key="m.id" :class="['tl-i', m.type]">
                        <div class="tl-h">
                          <span class="num">{{ m.at }}</span>
                          <b class="k">{{ m.title }}</b>
                          <span class="st st-gray">{{ m.tag }}</span>
                        </div>
                        <div class="mini">
                          <div class="mini-h">
                            <span class="num">{{ m.legs }}</span>
                            <b :class="['num', m.valueTone]">{{ m.valueText }}</b>
                          </div>
                          <p>{{ m.label }} · {{ m.origin }}</p>
                          <div class="met">
                            <div v-for="(f, i) in m.metrics" :key="i"><small>{{ f.label }}</small><b class="num">{{ f.value }}</b></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </article>
            </div>
          </div>

          <div v-if="!loading && !dayGroups.length" class="card tk-empty">
            <b>{{ range === 'all' ? '还没有已结算的记录' : '这个区间没有结算' }}</b>
            <p>换一个区间看看；还开着的仓位在「进行」与「跟踪」里。</p>
          </div>
          <div v-if="loading && !dayGroups.length" class="card tk-empty"><b>正在读取结算账…</b><p>正在从本地服务读取 OSM 同步的结算数据</p></div>
        </section>
      </main>
    </div></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getSettlementKind, getSettlementSummary } from '@/api/option/settlement'
import { buildKpis, recordParams, toRecord } from '@/utils/settlementData'

const ranges = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
  { key: 'custom', label: '自定义' }
]

const summary = ref(null)
const recordBody = ref(null)
const loading = ref(false)
const sort = ref('settled')
const range = ref('all')
const from = ref('')
const to = ref('')
const openIds = ref(new Set())

const stats = computed(() => summary.value?.stats || null)
const kpis = computed(() => buildKpis(stats.value))
const settledTotal = computed(() => stats.value?.settledCount ?? recordBody.value?.count ?? 0)
const totalCount = computed(() => summary.value?.stats?.recordCount ?? recordBody.value?.count ?? 0)
const records = computed(() => (recordBody.value?.items || []).map(toRecord))
const shownCount = computed(() => recordBody.value?.count ?? records.value.length)

// 接口已按 groupDay 倒序、同日按发报时间倒序排好，这里只做分桶
const dayGroups = computed(() => {
  const groups = []
  const index = new Map()
  for (const [i, item] of (recordBody.value?.items || []).entries()) {
    const key = item.groupDay || '—'
    let bucket = index.get(key)
    if (!bucket) {
      bucket = { key, items: [] }
      index.set(key, bucket)
      groups.push(bucket)
    }
    bucket.items.push(records.value[i])
  }
  return groups
})

function toggle(id) {
  const next = new Set(openIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openIds.value = next
}

async function loadRecords() {
  if (range.value === 'custom' && !from.value && !to.value) return
  recordBody.value = await getSettlementKind('record', recordParams(range.value, sort.value, from.value, to.value))
}

onMounted(async () => {
  loading.value = true
  try {
    summary.value = await getSettlementSummary()
    await loadRecords()
  } catch (e) {
    recordBody.value = null
  } finally {
    loading.value = false
  }
})

watch([sort, range, from, to], async () => {
  if (!summary.value) return
  loading.value = true
  try {
    await loadRecords()
  } catch (e) {
    recordBody.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style src="./settle-v3.css"></style>
