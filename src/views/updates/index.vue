<template>
  <div class="updates-page">
    <section class="lb-hero"><div class="lb-wrap">
    <section class="page-heading">
      <div>
        <span class="eyebrow"><i /> {{ summary?.kick || 'PRODUCT UPDATES' }}</span>
        <h1>{{ summary?.title || '功能更新' }}</h1>
        <p v-if="summary?.subHtml" class="heading-sub" @click="onRichClick" v-html="summary.subHtml" />
        <p v-else>查看工作台的新功能、体验优化与问题修复。</p>
      </div>
      <span class="demo-chip"><i :class="['sync-dot', { stale: !summary }]" /> {{ syncLabel }}</span>
    </section>
    </div></section>

    <div class="lb-wrap lb-body">

    <section v-if="!ready" class="status-panel panel">
      <span class="empty-icon"><el-icon><component :is="loading ? Loading : Bell" :class="{ spinning: loading }" /></el-icon></span>
      <strong>{{ loading ? '正在读取功能更新…' : '暂无数据' }}</strong>
      <p>{{ loading ? '正在从本地服务读取 OSM 同步的功能更新' : (error || '后端定时任务尚未同步更新菜单的数据，请稍后刷新。') }}</p>
      <span v-if="!loading && !error" class="deploy-tip"><i />首次部署请由管理员在若依后台「系统监控 → 定时任务」对「OSM更新菜单强制同步」执行一次</span>
      <button v-if="!loading" type="button" @click="loadAll">重新加载</button>
    </section>

    <template v-else>
      <section class="updates-hero panel">
        <div class="hero-copy">
          <span class="hero-kicker"><el-icon><Bell /></el-icon> RELEASE NOTES</span>
          <h2>{{ entries.length }} 条上线记录，最新一条在 {{ formatDate(summary.latestDate) }}</h2>
          <p>{{ summary.foot || '只记会员能直接用上的改动。' }}</p>
          <div class="hero-meta">
            <span><el-icon><Calendar /></el-icon> {{ formatDate(summary.earliestDate) }} — {{ formatDate(summary.latestDate) }}</span>
            <span><el-icon><Tickets /></el-icon> {{ monthLine }}</span>
            <span v-if="summary.visuals"><el-icon><VideoPlay /></el-icon> 视频 {{ summary.visuals.video || 0 }} · 示意图 {{ summary.visuals.svg || 0 }}</span>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="orbit orbit-one" /><div class="orbit orbit-two" />
          <div class="note-sheet"><span class="note-dot"/><i/><i/><i class="short-line"/><b><el-icon><Check /></el-icon></b></div>
          <span class="sparkle sparkle-one">✦</span><span class="sparkle sparkle-two">✦</span>
        </div>
      </section>

      <section class="updates-toolbar panel" aria-label="筛选更新">
        <div class="toolbar-label"><strong>更新记录</strong><span>{{ visibleUpdates.length }} 条内容</span></div>
        <div class="filter-tabs" role="tablist" aria-label="更新类型">
          <button v-for="filter in filters" :key="filter.value" :class="['filter-tab', { selected: activeFilter === filter.value }]" @click="selectFilter(filter.value)">{{ filter.label }}<em>{{ filterCount(filter.value) }}</em></button>
        </div>
        <label class="search-box"><el-icon><Search /></el-icon><input v-model="searchText" type="search" placeholder="搜索更新内容" aria-label="搜索更新内容" /></label>
      </section>

      <section v-if="featuredUpdate && activeFilter === 'all' && !searchText" class="featured-update panel">
        <div class="featured-mark"><el-icon><Promotion /></el-icon></div>
        <div class="featured-body">
          <div class="update-meta"><span :class="['type-pill', `${featuredUpdate.type}-pill`]">{{ featuredUpdate.typeLabel }}</span><span>{{ formatDate(featuredUpdate.date) }}</span><span class="meta-divider">·</span><span>{{ featuredUpdate.area }}</span></div>
          <h2>{{ featuredUpdate.title }}</h2>
          <p class="clamp-3">{{ featuredUpdate.what }}</p>
          <button class="text-action" @click="openUpdate(featuredUpdate)">查看更新详情 <el-icon><ArrowRight /></el-icon></button>
        </div>
        <div v-if="featuredUpdate.cover" class="featured-cover" :style="{ backgroundImage: `url(${featuredUpdate.cover})` }" />
        <span class="featured-version">{{ unseen > 0 ? `${unseen} 条未读` : 'NEW' }}</span>
      </section>

      <section class="timeline-section">
        <div class="timeline-heading"><div><span class="section-kicker">WHAT'S NEW</span><h2>近期更新</h2></div><span class="timeline-note"><i /> 来自 OSM 功能更新</span></div>
        <div v-if="visibleUpdates.length" class="timeline-list">
          <article v-for="item in shownUpdates" :key="item.key" class="update-row">
            <div class="date-column"><span class="date-label">{{ formatDate(item.date) }}</span><span class="timeline-marker" :class="item.type" /></div>
            <div class="update-card panel">
              <div class="card-topline">
                <div class="update-meta"><span :class="['type-pill', `${item.type}-pill`]">{{ item.typeLabel }}</span><span>{{ item.area }}</span><span class="meta-divider">·</span><span>{{ item.visualLabel }}</span></div>
                <span v-if="item.key === entries[0]?.key" class="latest-label">最新</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p class="clamp-3">{{ item.what }}</p>
              <div class="tag-list"><span v-for="tag in item.tags" :key="tag">{{ tag }}</span></div>
              <button class="detail-action" @click="openUpdate(item)">查看详情 <el-icon><ArrowRight /></el-icon></button>
            </div>
          </article>
          <div v-if="visibleUpdates.length > shownUpdates.length" class="more-row">
            <button class="detail-action" @click="pageSize += PAGE_STEP">显示更多（还有 {{ visibleUpdates.length - shownUpdates.length }} 条） <el-icon><ArrowRight /></el-icon></button>
          </div>
        </div>
        <div v-else class="empty-state panel"><span class="empty-icon"><el-icon><Search /></el-icon></span><strong>没有找到匹配的更新</strong><p>试试其他关键词或更新类型。</p><button @click="resetFilters">清除筛选</button></div>
      </section>

      <section class="subscribe-card panel">
        <div class="subscribe-icon"><el-icon><Message /></el-icon></div>
        <div><h3>持续关注工作台变化</h3><p>{{ summary.sub || '重要功能说明会在对应页面同步展示。' }}</p></div>
        <span class="subscribe-state"><el-icon><CircleCheck /></el-icon> {{ progressLabel }}</span>
      </section>
    </template>
    </div>

    <el-dialog v-model="detailVisible" :title="selectedUpdate?.title || '更新详情'" width="min(640px, calc(100vw - 32px))" class="update-dialog">
      <template v-if="selectedUpdate">
        <div class="dialog-meta"><span :class="['type-pill', `${selectedUpdate.type}-pill`]">{{ selectedUpdate.typeLabel }}</span><span>{{ formatDate(selectedUpdate.date) }}</span><span>·</span><span>{{ selectedUpdate.area }}</span></div>
        <div v-if="selectedUpdate.visual?.type === 'video'" class="dialog-visual"><video :src="selectedUpdate.visual.src" :poster="selectedUpdate.visual.poster" controls muted playsinline preload="metadata" /></div>
        <div v-else-if="selectedUpdate.visual?.type === 'svg'" class="dialog-visual svg-visual" v-html="selectedUpdate.visual.html" />
        <div v-else-if="selectedUpdate.visual?.type === 'image'" class="dialog-visual"><img :src="selectedUpdate.visual.src" :alt="selectedUpdate.visual.alt || ''" /></div>
        <div class="dialog-summary rich" @click="onRichClick" v-html="selectedUpdate.whatHtml || selectedUpdate.what" />
        <ul v-if="selectedUpdate.how" class="detail-list"><li><el-icon><CircleCheck /></el-icon><span><b>{{ selectedUpdate.howLabel || '怎么用' }}</b><span class="rich" @click="onRichClick" v-html="selectedUpdate.howHtml || selectedUpdate.how" /></span></li></ul>
        <a v-if="selectedUpdate.target?.url" class="go-action" :href="selectedUpdate.target.url" target="_blank" rel="noopener noreferrer">{{ selectedUpdate.target.label || '去用一下' }} <el-icon><ArrowRight /></el-icon></a>
        <div class="demo-disclaimer"><el-icon><InfoFilled /></el-icon> 内容来自 OSM「功能更新」（{{ selectedUpdate.target?.path || selectedUpdate.path }}），由后端定时同步，同步时间 {{ summary?.syncTime || '—' }}。</div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowRight, Bell, Calendar, Check, CircleCheck, InfoFilled, Loading, Message, Promotion, Search, Tickets, VideoPlay } from '@element-plus/icons-vue'
import { getUpdateKind, getUpdateSummary } from '@/api/option/update'
import { markAllUpdatesSeen } from '@/utils/updateStore'

const PAGE_STEP = 20
// 按「去用一下」目标链接归类（沿用原有 功能 / 优化 / 修复 三种配色）
const AREAS = [
  { test: p => p.startsWith('/member/autopilot'), area: '自动驾驶', group: 'autopilot', type: 'feature', typeLabel: '自动驾驶' },
  { test: p => /^\/member\/(earnings|premarket)/.test(p), area: '信息', group: 'info', type: 'improvement', typeLabel: '信息' },
  { test: p => p.startsWith('/academy'), area: '学堂', group: 'info', type: 'improvement', typeLabel: '学堂' },
  { test: p => /^\/member\/(settings|upgrade|support|wechat-group|updates)/.test(p), area: { '/member/settings': '设置', '/member/upgrade': '会员', '/member/support': '客服', '/member/wechat-group': '微信群', '/member/updates': '更新' }, group: 'account', type: 'fix', typeLabel: '账户与设置' },
  { test: p => p.startsWith('/member/tracks'), area: '跟踪', group: 'desk', type: 'feature', typeLabel: '信号台' },
  { test: p => p.startsWith('/member/settlement'), area: '结算', group: 'desk', type: 'feature', typeLabel: '信号台' },
  { test: p => p.startsWith('/member/scorecard'), area: '战绩', group: 'desk', type: 'feature', typeLabel: '信号台' },
  { test: () => true, area: '今日', group: 'desk', type: 'feature', typeLabel: '信号台' }
]
const filters = [
  { label: '全部', value: 'all' },
  { label: '自动驾驶', value: 'autopilot' },
  { label: '信号台', value: 'desk' },
  { label: '信息', value: 'info' },
  { label: '账户与设置', value: 'account' }
]
const VISUAL_LABEL = { video: '视频演示', svg: '示意图', image: '配图', none: '图文' }

const loading = ref(true)
const error = ref('')
const summary = ref(null)
const entries = ref([])
const activeFilter = ref('all')
const searchText = ref('')
const pageSize = ref(PAGE_STEP)
const detailVisible = ref(false)
const selectedUpdate = ref(null)

const ready = computed(() => !loading.value && !!summary.value && entries.value.length > 0)
const unseen = computed(() => summary.value?.progress?.unseen || 0)
const syncLabel = computed(() => summary.value?.syncTime ? `OSM 同步 · ${summary.value.syncTime.slice(5, 16)}` : (loading.value ? '读取中' : '未同步'))
const monthLine = computed(() => (summary.value?.months || []).map(m => `${Number(m.month.slice(5))} 月 ${m.count} 条`).join(' · ') || '按上线日期整理')
const progressLabel = computed(() => {
  const p = summary.value?.progress
  if (!p) return '页面内查看'
  return p.unseen > 0 ? `已读 ${p.seenSeq} / ${p.currentSeq} · ${p.unseen} 条未读` : `已读到第 ${p.currentSeq} 条`
})

function decorate(item) {
  const path = item.target?.path || ''
  const rule = AREAS.find(r => r.test(path))
  const clean = path.replace(/[?#].*$/, '')
  const area = typeof rule.area === 'string' ? rule.area : (rule.area[clean] || '账户')
  const visualType = item.visual?.type || 'none'
  return {
    ...item,
    area,
    group: rule.group,
    type: rule.type,
    typeLabel: rule.typeLabel,
    visualLabel: VISUAL_LABEL[visualType] || '图文',
    cover: item.visual?.poster || (visualType === 'image' ? item.visual?.src : ''),
    tags: [area, item.month ? `${Number(item.month.slice(5))} 月` : '', item.howLabel ? '含使用说明' : '', path].filter(Boolean)
  }
}

const featuredUpdate = computed(() => entries.value[0] || null)
const visibleUpdates = computed(() => {
  const query = searchText.value.trim().toLowerCase()
  return entries.value.filter(item => {
    const matchesType = activeFilter.value === 'all' || item.group === activeFilter.value
    const matchesText = !query || [item.title, item.what, item.how, item.area].join(' ').toLowerCase().includes(query)
    return matchesType && matchesText
  })
})
const shownUpdates = computed(() => visibleUpdates.value.slice(0, pageSize.value))
watch([activeFilter, searchText], () => { pageSize.value = PAGE_STEP })

function filterCount(value) {
  return value === 'all' ? entries.value.length : entries.value.filter(item => item.group === value).length
}
function selectFilter(value) {
  activeFilter.value = value
}
function formatDate(value) {
  return value ? value.replace(/-/g, '.') : '—'
}
function openUpdate(item) {
  selectedUpdate.value = item
  detailVisible.value = true
}
function resetFilters() {
  activeFilter.value = 'all'
  searchText.value = ''
}
// 正文中的链接（OSM 站内绝对地址）新窗口打开
function onRichClick(event) {
  const link = event.target?.closest?.('a')
  if (!link || !link.href) return
  event.preventDefault()
  window.open(link.href, '_blank', 'noopener')
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [head, list] = await Promise.all([getUpdateSummary(), getUpdateKind('entry')])
    summary.value = head
    entries.value = [...(list?.items || [])].sort((a, b) => (a.order || 0) - (b.order || 0)).map(decorate)
    // 打开更新列表即标记已读到当前序号（W6）；页面上的“N 条未读”保留本次打开时的状态
    markAllUpdatesSeen(head?.progress?.currentSeq)
  } catch (e) {
    const message = e?.message || '加载失败'
    error.value = /暂无数据/.test(message) ? '' : message
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.updates-page{--ink:#1d3150;--muted:#7788a1;--blue:#2d75cf;--line:#e8eef6;color:var(--ink)}
.panel{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 8px 28px rgba(30,67,112,.035)}
.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:0 0 20px}.eyebrow,.section-kicker{display:flex;align-items:center;gap:8px;color:#6d8aaf;font-size:10px;font-weight:800;letter-spacing:1.25px}.eyebrow i{width:7px;height:7px;border-radius:50%;background:#55b799;box-shadow:0 0 0 4px #e9f7f2}.page-heading h1{margin:9px 0 5px;color:#172f53;font-size:28px;letter-spacing:-.5px}.page-heading p{margin:0;color:#8291a7;font-size:13px}.demo-chip{display:flex;align-items:center;gap:6px;padding:7px 11px;border:1px solid #e4edf7;border-radius:20px;background:#fff;color:#8193aa;font-size:10px;white-space:nowrap}
.updates-hero{min-height:202px;position:relative;overflow:hidden;display:flex;align-items:center;padding:28px 34px;margin-bottom:16px;background:linear-gradient(105deg,#fff 0%,#fff 57%,#f3f8ff 100%)}.hero-copy{position:relative;z-index:1;max-width:640px}.hero-kicker{display:inline-flex;align-items:center;gap:6px;color:#4e83bd;font-size:10px;font-weight:800;letter-spacing:1.25px}.hero-copy h2{margin:12px 0 8px;color:#19375e;font-size:22px;letter-spacing:-.35px}.hero-copy p{max-width:590px;margin:0;color:#74859c;font-size:12px;line-height:1.8}.hero-meta{display:flex;gap:18px;margin-top:16px;color:#8b9bb0;font-size:10px}.hero-meta span{display:flex;align-items:center;gap:5px}.hero-art{position:absolute;right:6%;top:50%;width:192px;height:160px;transform:translateY(-50%)}.orbit{position:absolute;border:1px solid #dce9fa;border-radius:50%;transform:rotate(-20deg)}.orbit-one{inset:3px 8px 3px 0}.orbit-two{inset:18px 25px 18px 18px;transform:rotate(35deg)}.note-sheet{position:absolute;left:67px;top:24px;width:76px;height:98px;padding:15px 12px;background:#fff;border:1px solid #e4edf7;border-radius:12px;box-shadow:0 12px 28px #3974bd1c;transform:rotate(7deg)}.note-dot{display:block;width:9px;height:9px;margin-bottom:11px;border-radius:3px;background:#74a9e9}.note-sheet i{display:block;height:4px;margin:7px 0;border-radius:4px;background:#e5edf7}.note-sheet .short-line{width:65%}.note-sheet b{position:absolute;right:-11px;bottom:8px;width:25px;height:25px;display:grid;place-items:center;border:3px solid #fff;border-radius:50%;background:#62b89b;color:#fff;font-size:12px}.sparkle{position:absolute;color:#75a5df}.sparkle-one{top:18px;right:25px;font-size:19px}.sparkle-two{bottom:19px;left:26px;font-size:12px;color:#e5bd6c}
.updates-toolbar{min-height:66px;padding:12px 18px;display:flex;align-items:center;gap:20px;margin-bottom:16px}.toolbar-label{display:flex;align-items:baseline;gap:9px;min-width:130px}.toolbar-label strong{font-size:14px;color:#294365}.toolbar-label span{font-size:10px;color:#9aa8b9}.filter-tabs{display:flex;align-items:center;gap:4px;padding:3px;border-radius:10px;background:#f4f7fb}.filter-tab{border:0;border-radius:8px;padding:8px 13px;background:transparent;color:#7f8fa6;font-size:11px;font-weight:600;cursor:pointer;transition:.18s}.filter-tab:hover{color:#3c70b0}.filter-tab.selected{background:#fff;color:#286fc5;box-shadow:0 2px 8px #1f45700e}.search-box{margin-left:auto;width:214px;height:36px;padding:0 11px;display:flex;align-items:center;gap:8px;border:1px solid #e8edf4;border-radius:9px;color:#9aabc0}.search-box input{width:100%;border:0;outline:0;background:transparent;color:#324966;font:inherit;font-size:11px}.search-box input::placeholder{color:#a6b2c1}
.featured-update{position:relative;display:flex;gap:17px;align-items:flex-start;padding:21px 24px;margin-bottom:27px;overflow:hidden;border-color:#dce9f8;background:linear-gradient(110deg,#fff 0%,#fff 72%,#f6faff 100%)}.featured-mark{width:38px;height:38px;flex:none;display:grid;place-items:center;border:1px solid #d9eaff;border-radius:12px;background:#f0f7ff;color:#4185d4;font-size:17px}.featured-body{min-width:0}.update-meta{display:flex;align-items:center;gap:8px;color:#94a2b4;font-size:10px}.type-pill{display:inline-flex;align-items:center;padding:4px 8px;border-radius:6px;font-size:9px;font-weight:700;white-space:nowrap}.feature-pill{background:#edf5ff;color:#3978be}.improvement-pill{background:#eef8f4;color:#409878}.fix-pill{background:#fff4e9;color:#c18b45}.featured-update h2{margin:10px 0 6px;font-size:17px;color:#213c60}.featured-update p{margin:0;color:#7789a0;font-size:11px;line-height:1.7}.text-action,.detail-action{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#3379ca;font-size:10px;font-weight:700;cursor:pointer}.text-action{margin-top:12px;padding:0}.featured-version{position:absolute;right:23px;top:21px;color:#91afd2;font-size:9px;font-weight:800;letter-spacing:1.2px}
.timeline-section{margin-top:25px}.timeline-heading{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:13px}.section-kicker{font-size:9px;color:#8ba2be}.timeline-heading h2{margin:6px 0 0;color:#233e62;font-size:18px}.timeline-note{display:flex;align-items:center;gap:6px;color:#9aa8ba;font-size:10px}.timeline-note i{width:6px;height:6px;border-radius:50%;background:#7eabdf}.timeline-list{position:relative;padding-bottom:2px}.timeline-list:before{position:absolute;content:"";left:95px;top:16px;bottom:25px;width:1px;background:#e1eaf5}.update-row{display:grid;grid-template-columns:96px minmax(0,1fr);gap:18px;position:relative;margin-bottom:13px}.date-column{position:relative;padding-top:19px;text-align:right}.date-label{display:block;padding-right:17px;color:#91a1b5;font-size:10px}.timeline-marker{position:absolute;right:-5px;top:20px;width:11px;height:11px;border:3px solid #f3f7fc;border-radius:50%;background:#4d8bd1;box-shadow:0 0 0 1px #bed5f1}.timeline-marker.improvement{background:#52a586;box-shadow:0 0 0 1px #bfe0d3}.timeline-marker.fix{background:#d8a05c;box-shadow:0 0 0 1px #eed5b4}.update-card{position:relative;padding:17px 19px 15px;border-radius:14px;transition:transform .18s ease,box-shadow .18s ease}.update-card:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(30,67,112,.07)}.card-topline{display:flex;align-items:center;justify-content:space-between;gap:12px}.meta-divider{color:#c2ccd8}.latest-label{padding:4px 7px;border-radius:5px;background:#f1f6fd;color:#6e8caf;font-size:9px}.update-card h3{margin:10px 0 5px;color:#294465;font-size:14px}.update-card p{max-width:780px;margin:0;color:#7b8ba1;font-size:11px;line-height:1.75}.tag-list{display:flex;gap:6px;margin-top:11px}.tag-list span{padding:4px 7px;border:1px solid #edf1f6;border-radius:5px;color:#8b9bb0;font-size:9px}.detail-action{margin-top:10px;padding:0}.empty-state{padding:40px 20px;text-align:center}.empty-icon{width:42px;height:42px;margin:0 auto 12px;display:grid;place-items:center;border-radius:13px;background:#f1f6fc;color:#7f9cbd;font-size:17px}.empty-state strong{display:block;color:#3c526e;font-size:13px}.empty-state p{margin:7px 0 14px;color:#91a0b3;font-size:11px}.empty-state button{padding:7px 13px;border:1px solid #dce8f6;border-radius:8px;background:#f5f9ff;color:#3978be;font-size:10px;cursor:pointer}
.subscribe-card{display:flex;align-items:center;gap:13px;padding:16px 19px;margin-top:25px;background:linear-gradient(105deg,#fff 0%,#f7faff 100%)}.subscribe-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;background:#edf5ff;color:#4786cd}.subscribe-card h3{margin:0 0 4px;color:#385372;font-size:12px}.subscribe-card p{margin:0;color:#8b9aaf;font-size:10px;line-height:1.6}.subscribe-state{margin-left:auto;display:flex;align-items:center;gap:5px;color:#73a58e;font-size:10px;white-space:nowrap}.subscribe-state .el-icon{font-size:13px}.dialog-meta{display:flex;align-items:center;gap:8px;color:#8b9bb0;font-size:11px}.dialog-summary{margin:17px 0;color:#526983;font-size:13px;line-height:1.8}.detail-list{display:grid;gap:11px;margin:0;padding:0;list-style:none}.detail-list li{display:flex;align-items:flex-start;gap:9px;color:#61758e;font-size:12px;line-height:1.6}.detail-list li .el-icon{margin-top:2px;color:#56a484;flex:none}.demo-disclaimer{display:flex;align-items:flex-start;gap:7px;margin-top:21px;padding:11px 12px;border-radius:9px;background:#f4f8fd;color:#8799af;font-size:10px;line-height:1.6}.demo-disclaimer .el-icon{margin-top:1px;color:#6b98c9;flex:none}
@media(max-width:850px){.updates-toolbar{flex-wrap:wrap;gap:10px}.toolbar-label{min-width:unset;flex:1}.filter-tabs{order:3;width:100%;justify-content:flex-start;overflow:auto}.search-box{width:min(220px,45%)}.hero-art{right:3%;opacity:.65}.hero-copy{max-width:65%}.timeline-list:before{left:75px}.update-row{grid-template-columns:76px minmax(0,1fr);gap:14px}}
@media(max-width:600px){.page-heading{align-items:flex-start}.page-heading h1{font-size:25px}.page-heading p{max-width:280px;line-height:1.6}.demo-chip{padding:6px 8px;font-size:9px}.updates-hero{min-height:196px;padding:22px 19px}.hero-copy{max-width:100%}.hero-copy h2{max-width:260px;font-size:19px;line-height:1.45}.hero-copy p{max-width:300px;font-size:11px}.hero-meta{flex-direction:column;gap:6px;margin-top:12px}.hero-art{right:-55px;opacity:.17}.updates-toolbar{padding:12px}.toolbar-label{flex-basis:100%}.search-box{margin-left:0;flex:1;width:auto;order:2}.filter-tabs{order:3}.filter-tab{padding:8px 12px}.featured-update{padding:17px 15px;gap:11px}.featured-mark{width:33px;height:33px}.featured-version{right:14px;top:16px}.featured-body{padding-right:15px}.featured-update h2{font-size:15px}.featured-update p{font-size:10px}.timeline-heading{align-items:center}.timeline-heading h2{font-size:17px}.timeline-note{font-size:9px}.timeline-list:before{left:0;top:18px;bottom:15px}.update-row{display:block;padding-left:14px;margin-bottom:12px}.date-column{position:static;padding:0;text-align:left}.date-label{padding:0 0 7px;color:#9aa7b7;font-size:9px}.timeline-marker{left:-18px;right:auto;top:3px}.update-card{padding:14px 13px}.update-meta{gap:6px;font-size:9px;flex-wrap:wrap}.update-card h3{font-size:13px}.update-card p{font-size:10px}.subscribe-card{align-items:flex-start;padding:14px}.subscribe-state{align-self:center}.subscribe-card p{max-width:210px}}
</style>

<style scoped>
.heading-sub :deep(a){color:#3379ca;text-decoration:none;font-weight:600}.heading-sub :deep(a:hover){text-decoration:underline}
.sync-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#55b799}.sync-dot.stale{background:#c9d3de}
.status-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:260px;padding:30px 20px;text-align:center}.status-panel .empty-icon{margin:0 0 4px}.status-panel strong{color:#3c526e;font-size:13px}.status-panel p{margin:0;color:#91a0b3;font-size:11px}.status-panel button{margin-top:6px;padding:7px 13px;border:1px solid #dce8f6;border-radius:8px;background:#f5f9ff;color:#3978be;font-size:10px;cursor:pointer}.deploy-tip{display:flex;align-items:center;gap:6px;max-width:460px;margin-top:4px;padding:8px 11px;border-radius:8px;background:#f4f8fd;color:#7d93aa;font-size:10px;line-height:1.5;text-align:left}.deploy-tip i{flex:none;width:5px;height:5px;border-radius:50%;background:#7ea8d3}.spinning{animation:up-spin 1s linear infinite}@keyframes up-spin{to{transform:rotate(360deg)}}
.filter-tab em{margin-left:5px;font-style:normal;font-size:9px;color:#a5b3c4}.filter-tab.selected em{color:#7ea6d6}
.clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.featured-body{flex:1}.featured-cover{flex:none;width:200px;height:112px;margin-top:18px;border:1px solid #e4edf7;border-radius:12px;background:#f3f8ff center/cover no-repeat}
.tag-list{flex-wrap:wrap}
.more-row{padding:4px 0 0 114px}
.dialog-visual{margin:16px 0 0;overflow:hidden;border:1px solid #e8eef6;border-radius:12px;background:#f7faff}.dialog-visual video,.dialog-visual img{display:block;width:100%;max-height:340px;object-fit:contain;background:#0f1c2e}.svg-visual{display:flex;justify-content:center;padding:12px}.svg-visual :deep(svg){width:100%;max-width:420px;height:auto}
.dialog-summary :deep(a),.detail-list :deep(a){color:#3379ca}.detail-list b{margin-right:6px;color:#3d5a7a}
.go-action{display:inline-flex;align-items:center;gap:5px;margin-top:16px;padding:8px 14px;border-radius:8px;background:#2d75cf;color:#fff;font-size:11px;font-weight:700;text-decoration:none}.go-action:hover{background:#2566b6}
@media(max-width:850px){.featured-cover{display:none}.more-row{padding-left:90px}}
</style>

<style>
html:has(.updates-page){overflow-x:clip}
</style>

<style scoped>
/* ================= 长桥风格覆盖层（docs/longbridge-ui.md） ================= */
.updates-page{
  --lb-text:#070a13;--lb-text-2:#4b5563;--lb-text-3:#6b7280;--lb-text-4:#a8aaad;
  --lb-accent:#00b8b8;--lb-accent-bright:#00f0c4;--lb-accent-soft:rgba(0,184,184,.1);
  --lb-bg:#f9fafb;--lb-bg-2:#f1f3f4;--lb-border:#e5e7eb;
  --lb-up:#e8467c;--lb-up-soft:rgba(232,70,124,.1);--lb-down:#00b8b8;--lb-warn:#f59e0b;--lb-warn-soft:rgba(245,158,11,.12);
  --pad-top:30px;--pad-bottom:42px;
  --ink:var(--lb-text);--muted:var(--lb-text-3);--line:var(--lb-border);--blue:var(--lb-accent);
  margin:calc(var(--pad-top)*-1) calc(50% - 50vw) calc(var(--pad-bottom)*-1);
  padding-bottom:64px;background:var(--lb-bg-2);color:var(--lb-text);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue","Microsoft YaHei",sans-serif;
}
.lb-wrap{max-width:1248px;margin:0 auto;padding:0 24px}

/* ---------- Hero ---------- */
.lb-hero{position:relative;overflow:hidden;padding:56px 0 120px;color:#fff;
  background:radial-gradient(900px 420px at 85% -10%,rgba(0,240,196,.22),transparent 60%),radial-gradient(700px 380px at 0% 120%,rgba(0,184,184,.18),transparent 60%),linear-gradient(180deg,#05070d,#0b1220)}
.page-heading{align-items:flex-end;gap:24px;margin:0}
.eyebrow{display:inline-flex;gap:8px;padding:6px 14px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.78);font-size:12px;font-weight:600;letter-spacing:1.6px}
.eyebrow i{background:var(--lb-accent-bright);box-shadow:0 0 0 4px rgba(0,240,196,.18)}
.page-heading h1{margin:18px 0 10px;color:#fff;font-size:48px;font-weight:700;line-height:1.1;letter-spacing:-1px}
.page-heading p{max-width:720px;color:rgba(255,255,255,.62);font-size:16px;line-height:1.6}
.heading-sub :deep(a){color:var(--lb-accent-bright)}
.demo-chip{height:36px;box-sizing:border-box;gap:8px;padding:0 16px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.08);backdrop-filter:blur(12px);color:rgba(255,255,255,.82);font-size:13px}
.sync-dot{width:7px;height:7px;background:var(--lb-accent-bright);box-shadow:0 0 0 4px rgba(0,240,196,.18)}
.sync-dot.stale{background:var(--lb-text-4);box-shadow:none}

/* ---------- 正文 ---------- */
.lb-body{position:relative;margin-top:-84px}
.panel{border:0;border-radius:20px;background:#fff;box-shadow:0 1px 2px rgba(7,10,19,.04),0 12px 32px rgba(7,10,19,.06)}
.section-kicker,.hero-kicker{color:var(--lb-text-4);font-size:12px;font-weight:600;letter-spacing:1.6px}

/* 状态 */
.status-panel{min-height:320px;gap:10px}
.status-panel strong{color:var(--lb-text);font-size:20px}
.status-panel p{color:var(--lb-text-3);font-size:14px}
.status-panel button,.empty-state button{height:40px;padding:0 22px;border:0;border-radius:999px;background:var(--lb-text);color:#fff;font-size:14px;font-weight:600;cursor:pointer}
.deploy-tip{padding:10px 14px;border-radius:14px;background:var(--lb-warn-soft);color:#92580a;font-size:13px}
.deploy-tip i{background:var(--lb-warn)}

/* 概览大卡 */
.updates-hero{min-height:240px;padding:36px 40px;margin-bottom:20px;background:radial-gradient(520px 260px at 100% 0%,rgba(0,240,196,.12),transparent 65%),#fff}
.hero-kicker{color:var(--lb-accent)}
.hero-copy{max-width:720px}
.hero-copy h2{margin:14px 0 10px;color:var(--lb-text);font-size:32px;font-weight:700;line-height:1.25;letter-spacing:-.6px}
.hero-copy p{max-width:640px;color:var(--lb-text-2);font-size:15px;line-height:1.7}
.hero-meta{flex-wrap:wrap;gap:10px;margin-top:20px}
.hero-meta span{height:32px;padding:0 14px;border-radius:999px;background:var(--lb-bg-2);color:var(--lb-text-2);font-size:13px;font-weight:500}
.hero-meta .el-icon{color:var(--lb-accent)}
.orbit{border-color:rgba(0,184,184,.22)}
.note-sheet{border:0;border-radius:16px;box-shadow:0 16px 36px rgba(7,10,19,.12)}
.note-dot{background:var(--lb-accent)}
.note-sheet i{background:var(--lb-bg-2)}
.note-sheet b{background:var(--lb-text)!important;color:var(--lb-accent-bright)!important;border:0!important}
.sparkle{color:var(--lb-accent)!important}

/* 工具条 */
.updates-toolbar{min-height:76px;padding:16px 20px;gap:20px;margin-bottom:20px}
.toolbar-label strong{color:var(--lb-text);font-size:18px}
.toolbar-label span{color:var(--lb-text-3);font-size:13px}
.filter-tabs{gap:4px;padding:4px;border-radius:999px;background:var(--lb-bg-2)}
.filter-tab{height:34px;padding:0 16px;border-radius:999px;color:var(--lb-text-2);font-size:14px;font-weight:600}
.filter-tab:hover{color:var(--lb-text)}
.filter-tab.selected{background:var(--lb-text);color:#fff;box-shadow:none}
.filter-tab em{color:var(--lb-text-4);font-size:12px}
.filter-tab.selected em{color:var(--lb-accent-bright)}
.search-box{width:260px;height:40px;padding:0 16px;border:1px solid var(--lb-border);border-radius:999px;background:var(--lb-bg);color:var(--lb-text-3)}
.search-box:focus-within{border-color:var(--lb-accent);background:#fff}
.search-box input{color:var(--lb-text);font-size:14px}
.search-box input::placeholder{color:var(--lb-text-4)}

/* 类型胶囊 */
.type-pill{height:24px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:600}
.feature-pill{background:var(--lb-accent-soft);color:#008a8a}
.improvement-pill{background:rgba(59,130,246,.1);color:#2563eb}
.fix-pill{background:var(--lb-warn-soft);color:#b45309}
.update-meta{gap:10px;color:var(--lb-text-3);font-size:13px}
.meta-divider{color:var(--lb-text-4)}

/* 置顶更新：黑底强调卡 */
.featured-update{gap:24px;padding:32px 36px;margin-bottom:32px;background:radial-gradient(560px 280px at 100% 100%,rgba(0,240,196,.18),transparent 65%),linear-gradient(135deg,#070a13,#111827);color:#fff}
.featured-mark{width:48px;height:48px;border:0;border-radius:14px;background:rgba(0,240,196,.14);color:var(--lb-accent-bright);font-size:22px}
.featured-update .update-meta{color:rgba(255,255,255,.6)}
.featured-update .type-pill{background:rgba(0,240,196,.16);color:var(--lb-accent-bright)}
.featured-update .meta-divider{color:rgba(255,255,255,.3)}
.featured-update h2{margin:14px 0 10px;color:#fff;font-size:26px;font-weight:700;line-height:1.3;letter-spacing:-.4px}
.featured-update p{color:rgba(255,255,255,.66);font-size:15px;line-height:1.7}
.text-action{margin-top:20px;height:40px;padding:0 20px;border-radius:999px;background:#fff;color:var(--lb-text);font-size:14px}
.text-action:hover{background:var(--lb-accent-bright)}
.featured-cover{width:240px;height:136px;margin-top:8px;border:0;border-radius:16px;background-color:rgba(255,255,255,.06)}
.featured-version{right:28px;top:24px;padding:4px 12px;border-radius:999px;background:rgba(0,240,196,.16);color:var(--lb-accent-bright);font-size:12px;letter-spacing:1.2px}

/* 时间线 */
.timeline-section{margin-top:0}
.timeline-heading{margin-bottom:20px}
.timeline-heading h2{margin:8px 0 0;color:var(--lb-text);font-size:28px;font-weight:700;letter-spacing:-.5px}
.timeline-note{height:32px;padding:0 14px;border-radius:999px;background:#fff;color:var(--lb-text-3);font-size:13px}
.timeline-note i{background:var(--lb-accent)}
.timeline-list:before{left:119px;background:var(--lb-border)}
.update-row{grid-template-columns:120px minmax(0,1fr);gap:24px;margin-bottom:16px}
.date-column{padding-top:26px}
.date-label{padding-right:22px;color:var(--lb-text-3);font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
.timeline-marker{top:28px;right:-6px;width:12px;height:12px;border:3px solid var(--lb-bg-2);background:var(--lb-accent);box-shadow:0 0 0 1px rgba(0,184,184,.35)}
.timeline-marker.improvement{background:#3b82f6;box-shadow:0 0 0 1px rgba(59,130,246,.35)}
.timeline-marker.fix{background:var(--lb-warn);box-shadow:0 0 0 1px rgba(245,158,11,.35)}
.update-card{padding:24px 28px 22px;border-radius:20px}
.update-card:hover{transform:translateY(-2px);box-shadow:0 1px 2px rgba(7,10,19,.04),0 18px 40px rgba(7,10,19,.1)}
.latest-label{padding:4px 10px!important;border-radius:999px!important;background:var(--lb-up-soft)!important;color:var(--lb-up)!important;font-size:12px!important;font-weight:600}
.update-card h3{margin:14px 0 8px!important;color:var(--lb-text)!important;font-size:20px!important;font-weight:700;line-height:1.4;letter-spacing:-.3px}
.update-card p{color:var(--lb-text-2)!important;font-size:14px!important;line-height:1.75!important}
.tag-list{gap:8px!important;margin-top:14px!important}
.tag-list span{padding:4px 12px!important;border:0!important;border-radius:999px!important;background:var(--lb-bg-2)!important;color:var(--lb-text-2)!important;font-size:12px!important}
.detail-action{margin-top:16px;height:36px;padding:0 18px;border-radius:999px;background:var(--lb-text);color:#fff;font-size:13px}
.detail-action:hover{background:#1f2937}
.more-row{padding:8px 0 0 144px}
.more-row .detail-action{height:40px;padding:0 22px;background:#fff;color:var(--lb-text);box-shadow:0 1px 2px rgba(7,10,19,.06),0 6px 16px rgba(7,10,19,.06)}
.empty-state{padding:48px 24px}
.empty-state strong{color:var(--lb-text);font-size:18px}
.empty-state p{color:var(--lb-text-3);font-size:14px}

/* 订阅卡 */
.subscribe-card{gap:16px;padding:24px 28px;margin-top:32px;background:#fff}
.subscribe-icon{width:48px;height:48px;border-radius:14px;background:var(--lb-text);color:var(--lb-accent-bright);font-size:20px}
.subscribe-card h3{color:var(--lb-text);font-size:18px;margin:0 0 6px}
.subscribe-card p{color:var(--lb-text-3);font-size:14px}
.subscribe-state{height:36px;padding:0 16px;border-radius:999px;background:var(--lb-accent-soft);color:#008a8a;font-size:13px;font-weight:600}

/* 弹窗 */
.dialog-meta{gap:10px;color:var(--lb-text-3);font-size:13px}
.dialog-summary{color:var(--lb-text-2);font-size:15px}
.dialog-summary :deep(a),.detail-list :deep(a){color:#008a8a}
.dialog-visual{border:0;border-radius:16px;background:var(--lb-bg-2)}
.detail-list li{padding:14px 16px;border-radius:14px;background:var(--lb-bg);color:var(--lb-text-2);font-size:14px}
.detail-list li .el-icon{color:var(--lb-accent)}
.detail-list b{color:var(--lb-text)}
.go-action{height:40px;box-sizing:border-box;padding:0 22px;border-radius:999px;background:var(--lb-text);font-size:14px}
.go-action:hover{background:#1f2937}
.demo-disclaimer{padding:12px 14px;border-radius:14px;background:var(--lb-warn-soft);color:#92580a;font-size:12px}
.demo-disclaimer .el-icon{color:var(--lb-warn)}

/* ---------- 响应式 ---------- */
@media(max-width:1100px){.updates-page{--pad-top:24px;--pad-bottom:36px}.page-heading h1{font-size:40px}.featured-cover{width:200px;height:112px}}
@media(max-width:1000px){.search-box{width:220px}}
@media(max-width:850px){.timeline-list:before{left:89px}.update-row{grid-template-columns:90px minmax(0,1fr);gap:18px}.more-row{padding-left:108px}.hero-copy{max-width:62%}}
@media(max-width:760px){
  .updates-page{--pad-top:20px;--pad-bottom:30px;padding-bottom:40px}
  .lb-wrap{padding:0 16px}
  .lb-hero{padding:40px 0 100px}
  .page-heading{align-items:flex-start;flex-direction:column;gap:16px}
  .page-heading h1{font-size:34px}
  .page-heading p{font-size:14px;max-width:none}
  .lb-body{margin-top:-72px}
  .updates-hero{min-height:0;padding:24px 20px}
  .hero-copy{max-width:100%}
  .hero-copy h2{max-width:none;font-size:24px}
  .hero-copy p{max-width:none;font-size:14px}
  .hero-meta{flex-direction:row;gap:8px}
  .hero-meta span{height:30px;font-size:12px}
  .hero-art{display:none}
  .updates-toolbar{padding:16px}
  .search-box{flex:1;width:auto}
  .filter-tab{padding:0 14px;font-size:13px;white-space:nowrap}
  .featured-update{padding:60px 20px 24px;gap:14px}
  .featured-mark{width:40px;height:40px;font-size:18px}
  .featured-update h2{font-size:21px}
  .featured-update p{font-size:14px}
  .featured-version{right:auto;left:20px;top:20px}
  .timeline-heading h2{font-size:22px}
  .timeline-note{font-size:12px;height:28px;padding:0 10px}
  .timeline-list:before{left:0}
  .update-row{display:block;padding-left:18px}
  .date-label{padding:0 0 8px;font-size:12px}
  .date-column{padding:0}
  .timeline-marker{left:-5px;right:auto;top:4px}
  .update-card{padding:20px 18px}
  .update-card h3{font-size:17px!important}
  .update-card p{font-size:13px!important}
  .more-row{padding-left:18px}
  .subscribe-card{padding:20px 18px;flex-wrap:wrap}
  .subscribe-card p{max-width:none}
  .subscribe-state{margin-left:64px}
}
@media(max-width:390px){.page-heading h1{font-size:30px}.hero-copy h2{font-size:22px}.filter-tab{padding:0 12px}}
</style>
