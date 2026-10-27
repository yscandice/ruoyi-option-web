<template>
  <div class="upv3">
    <section class="hero up-hero"><div class="wrap">
      <div class="up-hero-copy">
        <span class="eyebrow"><i />{{ head.kick || "UPDATES · WHAT'S NEW" }}</span>
        <h1>{{ head.title || '功能更新' }}</h1>
        <p v-if="head.subHtml" class="hero-sub" @click="onRichClick" v-html="head.subHtml" />
        <p v-else class="hero-sub">我们每一次上线了什么、你该怎么用。</p>
      </div>
      <img v-if="head.mascot" class="up-mascot" :src="head.mascot" alt="" aria-hidden="true" />
    </div></section>

    <div class="body"><div class="wrap">
      <main class="main solo pu">
        <section v-if="!ready" class="up-state">
          <span v-if="loading" class="dot" />
          <strong>{{ loading ? '正在读取功能更新…' : '暂无更新记录' }}</strong>
          <p>{{ loading ? '正在从本地服务读取 OSM 同步的功能更新' : (error || '后端定时任务尚未同步「功能更新」的数据，请稍后刷新。') }}</p>
          <button v-if="!loading" type="button" @click="loadAll">重新加载</button>
        </section>

        <template v-else>
          <ol class="pu-list">
            <li v-for="(item, index) in shown" :key="item.key" :class="['pu-item', { latest: index === 0 }]" :id="item.anchor || undefined">
              <div class="card pu-card">
                <div :class="['pu-visual', { 'pu-visual-video': item.visual.type === 'video' }]">
                  <video v-if="item.visual.type === 'video'" class="uv uv-video" :src="item.visual.src" :poster="item.visual.poster || undefined" muted loop playsinline preload="metadata" aria-hidden="true" />
                  <div v-else-if="item.visual.type === 'svg'" class="pu-visual-svg" aria-hidden="true" v-html="item.visual.html" />
                  <img v-else-if="item.visual.type === 'image'" class="pu-visual-img" :src="item.visual.src" :alt="item.visual.alt || ''" loading="lazy" />
                </div>
                <div class="pu-body">
                  <div class="pu-head">
                    <time :datetime="item.date || undefined">{{ item.dateText || item.date || '—' }}</time>
                    <em v-if="index === 0" class="pu-badge">最新</em>
                  </div>
                  <h2>{{ item.title }}</h2>
                  <p v-if="item.what" class="pu-what" @click="onRichClick" v-html="item.whatHtml || item.what" />
                  <p v-if="item.how" class="pu-how">
                    <b>{{ item.howLabel || '怎么用' }}</b>
                    <span @click="onRichClick" v-html="item.howHtml || item.how" />
                  </p>
                  <div class="pu-foot">
                    <a class="pu-go" href="#" @click.prevent="visit(item)">{{ item.target.label || '去用一下' }} →</a>
                  </div>
                </div>
              </div>
            </li>
          </ol>

          <div v-if="hasMore" class="pu-more">
            <button type="button" @click="more">显示更多 →</button>
            <span>已显示 {{ shown.length }} / {{ entries.length }} 条</span>
          </div>

          <p class="pu-meta">
            <span>共 {{ entries.length }} 条记录</span><i />
            <span>{{ rangeText }}</span><i />
            <span>同步 {{ syncText }}</span>
            <template v-if="unread > 0"><i /><em class="pu-unread">本次新增 {{ unread }} 条</em></template>
          </p>
          <p v-if="footText" class="pu-end">{{ footText }}</p>
        </template>
      </main>
    </div></div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getUpdateKind, getUpdateSummary } from '@/api/option/update'
import { markAllUpdatesSeen } from '@/utils/updateStore'

// 首屏与每次「显示更多」各展示多少条
const PAGE_STEP = 10

// 目标链接：OSM 会员站路径 → 本地路由（未列出的（自动驾驶、升级、客服等）保持外链）
const LOCAL_ROUTES = {
  '/member/settings': '/settings',
  '/member/earnings': '/info',
  '/member/premarket': '/info',
  '/member/scorecard': '/scorecard',
  '/member/settlement': '/settlement',
  '/member/tracks': '/tracks',
  '/member/updates': '/updates',
  '/member/upgrade': '/upgrade',
  '/academy': '/academy'
}

const router = useRouter()
const loading = ref(true)
const error = ref('')
const head = ref({})
const entries = ref([])
const pageSize = ref(PAGE_STEP)
const unread = ref(0)

const ready = computed(() => !loading.value && entries.value.length > 0)
const shown = computed(() => entries.value.slice(0, pageSize.value))
const hasMore = computed(() => entries.value.length > shown.value.length)
const syncText = computed(() => (head.value.syncTime ? head.value.syncTime.slice(5, 16) : '—'))
// 页脚说明：去掉源站附带的「研究与教育用途，不构成个性化投资建议」免责声明
const footText = computed(() => String(head.value.foot || '')
  .replace(/[^。]*研究与教育用途[^。]*。?/g, '')
  .replace(/[^。]*不构成个性化投资建议[^。]*。?/g, '')
  .trim())
const rangeText = computed(() => {
  const a = head.value.earliestDate
  const b = head.value.latestDate
  if (!a || !b) return '按上线日期整理'
  return `${a.replace(/-/g, '.')} — ${b.replace(/-/g, '.')}`
})

// 配图：视频进入视口才播放，离开即暂停（首屏就十多条，避免同时解码过多）
let observer = null
function bindVideos() {
  if (typeof IntersectionObserver === 'undefined') return
  if (!observer) {
    observer = new IntersectionObserver(list => {
      list.forEach(entry => {
        const video = entry.target
        if (entry.isIntersecting) {
          const playing = video.play()
          if (playing && typeof playing.catch === 'function') playing.catch(() => {})
        } else {
          video.pause()
        }
      })
    }, { rootMargin: '160px 0px' })
  }
  document.querySelectorAll('.upv3 .pu-visual video').forEach(video => {
    if (video.dataset.bound) return
    video.dataset.bound = '1'
    observer.observe(video)
  })
}

function more() {
  pageSize.value += PAGE_STEP
  nextTick(bindVideos)
}

// OSM 会员站路径 → 本地路由；返回空串表示本站没有对应页面
function localPath(path) {
  const clean = String(path || '').replace(/^https?:\/\/[^/]+/, '')
  if (!clean) return ''
  const [pure, search] = clean.split('?')
  if (/^\/member(\/home)?\/?$/.test(pure)) return /view=active/.test(search || '') ? '/active' : '/today'
  if (LOCAL_ROUTES[pure]) return LOCAL_ROUTES[pure]
  const hit = Object.keys(LOCAL_ROUTES).find(prefix => pure.startsWith(`${prefix}/`))
  return hit ? LOCAL_ROUTES[hit] : ''
}

function visit(item) {
  const local = localPath(item.target?.path)
  if (local) router.push(local)
  else if (item.target?.url) window.open(item.target.url, '_blank', 'noopener')
}

// 正文里的链接：本站有对应页面就走站内，否则新窗口打开
function onRichClick(event) {
  const link = event.target?.closest?.('a')
  if (!link) return
  event.preventDefault()
  const local = localPath(link.getAttribute('href'))
  if (local) router.push(local)
  else if (link.href) window.open(link.href, '_blank', 'noopener')
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [summary, list] = await Promise.all([getUpdateSummary(), getUpdateKind('entry')])
    head.value = summary || {}
    unread.value = Number(summary?.progress?.unseen) || 0
    entries.value = [...(list?.items || [])]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(item => ({ ...item, visual: item.visual || { type: 'none' }, target: item.target || {} }))
    pageSize.value = PAGE_STEP
    // 打开更新列表即标记已读到当前序号（W6）；「本次新增」保留打开时的状态
    markAllUpdatesSeen(summary?.progress?.currentSeq)
  } catch (e) {
    const message = e?.message || '加载失败'
    error.value = /暂无数据/.test(message) ? '' : message
  } finally {
    loading.value = false
  }
  // 等列表真正渲染出来再挂视频观察器
  await nextTick()
  bindVideos()
}

onMounted(loadAll)
onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style src="./updates-v3.css"></style>
