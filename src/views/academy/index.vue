<template>
  <div class="academy-page">
    <section class="page-heading">
      <div><div class="eyebrow"><span class="eyebrow-dot"/>OSM NEWCOMER ACADEMY</div><h1>学堂</h1><p>{{ home?.kick ? `${home.kick} · ` : '' }}从认识工作台开始，学会读懂每一张信号卡与后续提醒。</p></div>
      <span class="demo-badge"><i :class="{ stale: !summary }"/>{{ syncLabel }}</span>
    </section>

    <section v-if="!ready" class="status-panel panel">
      <span class="status-icon"><el-icon><component :is="loading ? Loading : Document" :class="{ spinning: loading }" /></el-icon></span>
      <strong>{{ loading ? '正在读取学堂…' : '暂无数据' }}</strong>
      <p>{{ loading ? '正在从本地服务读取 OSM 同步的学堂课程' : (error || '后端定时任务尚未同步学堂菜单的数据，请稍后刷新。') }}</p>
      <span v-if="!loading && !error" class="deploy-tip"><i />首次部署请由管理员在若依后台「系统监控 → 定时任务」对「OSM学堂菜单强制同步」执行一次</span>
      <button v-if="!loading" type="button" @click="loadAll">重新加载</button>
    </section>

    <div v-else class="academy-layout">
      <aside class="course-sidebar panel">
        <div class="sidebar-heading"><span class="sidebar-icon"><el-icon><Collection /></el-icon></span><div><strong>新人学堂</strong><small>课程目录</small></div></div>
        <span class="sidebar-caption">按顺序学习</span>
        <button v-for="lesson in lessons" :key="lesson.id" class="sidebar-course" :class="{selected:activeLesson===lesson.id}" @click="scrollToLesson(lesson.id)">
          <span class="course-number">{{ lesson.number }}</span><span class="sidebar-course-copy"><strong>{{ lesson.navTitle }}</strong><small>{{ lesson.member?'会员课程':'公开课程' }}</small></span><el-icon v-if="lesson.member" class="sidebar-lock"><Lock /></el-icon><el-icon v-else class="sidebar-arrow"><ArrowRight /></el-icon>
        </button>
        <div class="sidebar-divider"/><span class="sidebar-caption quick-caption">随手查阅</span>
        <button class="sidebar-utility" @click="openResource('weekly')"><span class="utility-icon"><el-icon><ChatLineRound /></el-icon></span><span><strong>一周问答</strong><small>{{ latestQa ? `${latestQa.no} · ${latestQa.count || 0} 个问答` : '每周更新' }}</small></span><el-icon><ArrowRight /></el-icon></button>
        <button class="sidebar-utility" @click="openResource('glossary')"><span class="utility-icon glossary"><el-icon><CollectionTag /></el-icon></span><span><strong>术语速查</strong><small>{{ glossary.length ? `${glossary.length} 个卡片用语` : '卡片用语解释' }}</small></span><el-icon><ArrowRight /></el-icon></button>
        <div class="sidebar-help"><el-icon><InfoFilled /></el-icon><span>{{ scopeExclude || '课程讲解的是工作台使用方式，不替代期权基础知识或投资建议。' }}</span></div>
      </aside>

      <main class="academy-content">
        <section class="welcome-panel panel">
          <div class="welcome-copy"><span class="welcome-kicker">{{ home?.kick || 'OSM 新人学堂' }}</span><h2>{{ home?.title || '看懂工作台上的每一张卡' }}</h2><p>{{ home?.lede }}</p>
            <div class="welcome-points"><span v-for="point in welcomePoints" :key="point"><el-icon><CircleCheck /></el-icon>{{ point }}</span></div>
          </div>
          <div class="welcome-art" aria-hidden="true"><div class="orbit orbit-a"/><div class="orbit orbit-b"/><div class="lesson-paper"><i/><i/><i/><b/><span class="paper-check"><el-icon><Check /></el-icon></span></div><span class="art-star star-a">✦</span><span class="art-star star-b">✦</span><span class="art-dot dot-a"/><span class="art-dot dot-b"/></div>
          <div class="welcome-foot"><el-icon><InfoFilled /></el-icon><span>{{ scopeInclude ? `这里教：${scopeInclude}` : '课程说明的是软件功能和信息口径；是否交易、交易规模与个人风险判断由你自行决定。' }}</span></div>
        </section>

        <section v-if="video" class="intro-video panel">
          <div class="video-thumb"><img v-if="video.poster" class="video-poster" :src="video.poster" alt="" loading="lazy" @error="posterFailed = true"/><div class="video-grid"/><div class="video-orbit video-orbit-one"/><div class="video-orbit video-orbit-two"/><span class="video-brand">OSM<span>.AI</span></span><button class="play-button" aria-label="查看新人导览" @click="introVisible=true"><el-icon><VideoPlay /></el-icon></button><span class="video-length">{{ video.meta }}</span><span class="video-ribbon">新会员导览</span></div>
          <div class="video-copy"><span class="section-kicker">START HERE</span><h3>{{ video.title }}</h3><p>{{ video.summary }}</p><div class="video-meta"><span><el-icon><Clock /></el-icon>{{ videoLength }}</span><span><el-icon><Document /></el-icon>{{ videoExtra }}</span></div><el-button type="primary" class="video-action" @click="introVisible=true">打开导览 <el-icon><ArrowRight /></el-icon></el-button></div>
        </section>

        <section class="philosophy-section">
          <div class="section-heading"><div><span class="section-kicker">FIELD NOTES</span><h2><span class="step-word">先</span>懂为什么 <small>札记 · 我们怎么想卖方这件事</small></h2><p>用几篇短文了解信号生成与风险表达背后的原则。</p></div><span class="section-count">{{ notes.length }} 篇</span></div>
          <div class="notes-grid"><button v-for="note in notes" :key="note.id || note.title" class="note-card panel" @click="openNote(note)"><span :class="['note-icon',note.tone]"><el-icon><component :is="note.icon" /></el-icon></span><span class="note-kind">{{ note.kind }}</span><strong>{{ note.title }}</strong><small>{{ note.description }}</small><span class="note-link">阅读札记 <el-icon><ArrowRight /></el-icon></span></button></div>
        </section>

        <section class="lessons-section">
          <div class="section-heading"><div><span class="section-kicker">LEARNING PATH</span><h2><span class="step-word">再</span>学怎么做 <small>{{ lessons.length }} 课 · 按顺序阅读</small></h2><p>从工作台入口开始，逐步认识开仓、管理与自动驾驶的流程。</p></div><span class="section-count">{{ lessons.length }} 课</span></div>
          <div class="lesson-list">
            <article v-for="lesson in lessons" :id="`lesson-${lesson.id}`" :key="lesson.id" class="lesson-card panel" :class="{ 'lesson-selected': activeLesson===lesson.id }">
              <div class="lesson-cover" :class="lesson.cover"><span class="cover-number">{{ lesson.number }}</span><div class="cover-graphic"><el-icon><component :is="lesson.icon" /></el-icon><i/><i/><i/></div><span class="cover-caption">OSM · LEARN</span></div>
              <div class="lesson-body"><div class="lesson-topline"><span :class="['access-badge',lesson.member?'member':'public']"><el-icon v-if="lesson.member"><Lock /></el-icon>{{ lesson.member?'会员课程':'公开课程' }}</span><span class="lesson-duration"><el-icon><Clock /></el-icon>{{ lesson.duration }}</span><span v-if="lesson.tagline" class="lesson-tagline">{{ lesson.tagline }}</span></div><h3>{{ lesson.noLabel }} · {{ lesson.title }}</h3><p>{{ lesson.description }}</p><div class="lesson-topics"><span v-for="topic in lesson.topics" :key="topic">{{ topic }}</span></div><button class="lesson-link" @click="openLesson(lesson)">进入课程 <el-icon><ArrowRight /></el-icon></button></div>
            </article>
          </div>
        </section>

        <section class="resources-grid">
          <article class="resource-card panel qa-card" @click="openResource('weekly')"><span class="resource-icon"><el-icon><ChatLineRound /></el-icon></span><div><span class="section-kicker">WEEKLY Q&A</span><h3>一周问答</h3><p>{{ refSummary('weekly-qa') || '集中整理常见问题与功能说明，快速补上本周更新。' }}</p><span class="resource-link">查看问答 <el-icon><ArrowRight /></el-icon></span></div><span class="resource-mark">Q&amp;A</span></article>
          <article class="resource-card panel glossary-card" @click="openResource('glossary')"><span class="resource-icon"><el-icon><CollectionTag /></el-icon></span><div><span class="section-kicker">QUICK REFERENCE</span><h3>术语速查</h3><p>{{ refSummary('glossary') || '快速查找信号卡、管理动作与结果口径中的常用词。' }}</p><span class="resource-link">打开词表 <el-icon><ArrowRight /></el-icon></span></div><span class="resource-mark">A—Z</span></article>
        </section>

        <section class="academy-disclaimer"><el-icon><Warning /></el-icon><span>{{ disclaimer }}</span></section>
      </main>
    </div>

    <el-dialog v-model="introVisible" :title="video?.title || '新人上路 · 工作台导览'" width="min(520px, calc(100vw - 32px))" class="academy-dialog"><div class="dialog-video" :style="video?.poster ? { backgroundImage: `linear-gradient(135deg,#1e4c7ccc,#4b89bccc),url(${video.poster})` } : null"><el-icon><VideoPlay /></el-icon><strong>{{ video?.title || '新人上路' }}</strong><span>{{ video?.meta }}</span></div><p class="dialog-copy">{{ video?.summary }}{{ home?.note ? ` ${home.note}` : '' }}</p><div class="dialog-chapters"><span v-for="(lesson, index) in lessons.slice(0, 3)" :key="lesson.id"><b>{{ String(index + 1).padStart(2, '0') }}</b>{{ lesson.navTitle }}</span></div></el-dialog>

    <el-dialog v-model="detailVisible" :title="selectedTitle" :width="dialogWidth" class="academy-dialog" @closed="onDialogClosed">
      <div v-if="detailLoading" class="detail-state"><el-icon class="spinning"><Loading /></el-icon><span>正在读取内容…</span></div>
      <div v-else-if="detailError" class="detail-state error"><span>{{ detailError }}</span><button type="button" @click="reloadDetail">重试</button></div>

      <div v-else-if="selectedNote" class="resource-detail"><span class="detail-icon"><el-icon><component :is="selectedNote.icon" /></el-icon></span><span class="detail-kind">{{ selectedNote.kind }}</span><p>{{ selectedNote.description }}</p><div v-if="selectedNote.lessons.length" class="detail-placeholder">出现在：{{ selectedNote.lessons.join('、') }}</div><a v-if="selectedNote.href" class="detail-out" :href="selectedNote.href" target="_blank" rel="noopener">在 OSM 阅读完整札记 <el-icon><ArrowRight /></el-icon></a></div>

      <div v-else-if="lessonDetail" class="lesson-detail">
        <div class="lesson-detail-head"><span :class="['access-badge',lessonDetail.access==='会员'?'member':'public']">{{ lessonDetail.no }} · {{ lessonDetail.access }}</span><span class="lesson-duration">{{ lessonDetail.sections?.length || 0 }} 个小节 · 约 {{ lessonDetail.textLength }} 字</span></div>
        <div class="lesson-toc"><button v-for="(sec, index) in lessonDetail.sections" :key="index" type="button" @click="jumpSection(index)">{{ sec.num ? `${sec.num.split('·')[0].trim()} ` : '' }}{{ sec.title }}</button></div>
        <div ref="articleRef" class="lesson-article" @click="onArticleClick" v-html="lessonDetail.html"/>
        <a v-if="lessonDetail.why" class="detail-out" :href="lessonDetail.why.href" target="_blank" rel="noopener">{{ lessonDetail.why.tag }}：{{ lessonDetail.why.title }} <el-icon><ArrowRight /></el-icon></a>
      </div>

      <div v-else-if="selectedResource==='weekly'" class="qa-detail">
        <div v-if="qaIssues.length > 1" class="qa-issues"><button v-for="issue in qaIssues" :key="issue.key" type="button" :class="{ active: qaDetail?.key === issue.key }" @click="loadQa(issue.key)">{{ issue.no }}<small>{{ issue.publishDate }}</small></button></div>
        <template v-if="qaDetail">
          <div class="qa-head"><span class="access-badge public">{{ qaDetail.no }}{{ qaDetail.latest ? ' · 最新' : '' }}</span><span class="lesson-duration">{{ qaDetail.deck }} · {{ qaDetail.publishDate }} 出刊</span></div>
          <p class="qa-lede">{{ qaDetail.lede }}</p>
          <section v-for="chapter in qaDetail.chapters" :key="chapter.no" class="qa-chapter">
            <h4><b>{{ chapter.no }}</b>{{ chapter.title }}</h4>
            <article v-for="item in chapter.items" :key="item.q" class="qa-item">
              <h5><span>{{ item.q }}</span>{{ item.title }}</h5>
              <p class="qa-ask"><b>{{ item.askLabel || '群友问' }}</b>{{ item.ask }}</p>
              <div class="qa-answer" @click="onArticleClick" v-html="item.answerHtml"/>
              <p v-if="item.key" class="qa-key"><b>{{ item.keyLabel || '划重点' }}</b>{{ item.key }}</p>
            </article>
          </section>
        </template>
        <div v-else class="detail-placeholder">暂无一周问答，等待后端同步。</div>
      </div>

      <div v-else-if="selectedResource==='glossary'" class="glossary-detail">
        <el-input v-model="glossaryKeyword" size="small" clearable placeholder="搜索术语 / 英文 / 释义" class="glossary-search"/>
        <dl class="glossary-list">
          <div v-for="term in filteredGlossary" :key="term.key" class="glossary-item"><dt>{{ term.term }}<small>{{ term.en }}</small></dt><dd><p>{{ term.definition }}</p><p v-if="term.where" class="gloss-where"><span>{{ term.whereLabel || '在卡上' }}</span>{{ term.where }}</p><p v-if="term.not" class="gloss-not"><span>{{ term.notLabel || '不是' }}</span>{{ term.not }}</p></dd></div>
        </dl>
        <div v-if="!filteredGlossary.length" class="detail-placeholder">没有匹配的术语。</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ArrowRight, ChatLineRound, Check, CircleCheck, Clock, Collection, CollectionTag, Compass, Document, InfoFilled, Loading, Lock, Reading, Tickets, VideoPlay, Warning } from '@element-plus/icons-vue'
import { getAcademyItem, getAcademyKind, getAcademySummary } from '@/api/option/academy'

// 课程卡封面与图标沿用原静态页样式，按课序循环
const lessonLooks = [
  { icon: Compass, cover: 'cover-blue' }, { icon: Tickets, cover: 'cover-cyan' }, { icon: Clock, cover: 'cover-violet' },
  { icon: Lock, cover: 'cover-orange' }, { icon: CircleCheck, cover: 'cover-green' }, { icon: Reading, cover: 'cover-navy' }
]
const noteLooks = [{ icon: Compass, tone: 'blue' }, { icon: Reading, tone: 'violet' }, { icon: InfoFilled, tone: 'orange' }, { icon: Document, tone: 'green' }]

const loading = ref(false)
const error = ref('')
const summary = ref(null)
const home = ref(null)
const lessonItems = ref([])
const qaIssues = ref([])
const glossary = ref([])

const activeLesson = ref('')
const introVisible = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const selectedNote = ref(null)
const selectedResource = ref('')
const lessonDetail = ref(null)
const qaDetail = ref(null)
const glossaryKeyword = ref('')
const articleRef = ref(null)
const cache = new Map()
let lastRequest = null

const ready = computed(() => !!summary.value && lessonItems.value.length > 0)
const latestQa = computed(() => summary.value?.latestQa || null)
const syncLabel = computed(() => {
  if (!summary.value) return loading.value ? '正在加载' : '暂无同步数据'
  const time = summary.value.status?.lastSuccessAt || summary.value.syncTime
  return `OSM 同步 · ${time ? String(time).slice(5, 16) : '已同步'}`
})
const scopeInclude = computed(() => home.value?.scope?.find(s => s.type === 'include')?.text || '')
const scopeExclude = computed(() => home.value?.scope?.find(s => s.type === 'exclude')?.text || '')
const welcomePoints = ['读懂卡片字段', '了解提醒顺序', '回看结算过程']
const posterFailed = ref(false)
const video = computed(() => home.value?.video ? { ...home.value.video, poster: posterFailed.value ? '' : home.value.video.poster } : null)
const videoLength = computed(() => (video.value?.meta || '').split('·')[0].trim() || '约 1 分 39 秒')
const videoExtra = computed(() => (video.value?.meta || '').split('·').slice(1).map(s => s.trim()).filter(Boolean).join(' · ') || '含字幕')
const disclaimer = computed(() => home.value?.footer?.[1] || home.value?.footer?.[0] || '期权交易存在损失风险，课程仅介绍软件功能，不构成投资建议。')

const lessons = computed(() => lessonItems.value.map((item, index) => {
  const look = lessonLooks[index % lessonLooks.length]
  const sections = item.sections || []
  return {
    id: item.key,
    number: String(item.order || index + 1).padStart(2, '0'),
    noLabel: item.no || `第${index + 1}课`,
    title: item.title || item.navTitle,
    navTitle: item.navTitle || item.title,
    member: item.access === '会员' || item.open === false,
    duration: item.caseLine || `${sections.length} 个小节`,
    tagline: item.tagline,
    description: item.summary || item.lede || item.deck,
    topics: sections.map(s => s.title).filter(Boolean).slice(0, 4),
    ...look
  }
}))

const notes = computed(() => (home.value?.notes || []).map((note, index) => {
  const owners = lessonItems.value.filter(l => l.why?.id === note.id)
  return {
    ...noteLooks[index % noteLooks.length],
    id: note.id,
    kind: note.tag,
    title: note.title,
    href: note.href,
    description: owners[0]?.why?.summary || `${note.tag}：${note.title}`,
    lessons: owners.map(l => `${l.no} ${l.navTitle || l.title}`)
  }
}))

const filteredGlossary = computed(() => {
  const word = glossaryKeyword.value.trim().toLowerCase()
  if (!word) return glossary.value
  return glossary.value.filter(t => [t.term, t.en, t.definition, t.where, t.not].some(v => v && v.toLowerCase().includes(word)))
})
const selectedTitle = computed(() => {
  if (selectedNote.value) return selectedNote.value.title
  if (lessonDetail.value) return lessonDetail.value.title
  if (selectedResource.value === 'weekly') return qaDetail.value?.title || '一周问答'
  if (selectedResource.value === 'glossary') return `术语速查 · ${glossary.value.length} 个词`
  return detailLoading.value ? '加载中' : ''
})
const dialogWidth = computed(() => selectedNote.value ? 'min(520px, calc(100vw - 32px))' : 'min(820px, calc(100vw - 32px))')

function refSummary(key) { return home.value?.refs?.find(r => r.key === key)?.summary || '' }

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [head, pages, lessonList, qaList, glossaryList] = await Promise.all([
      getAcademySummary(), getAcademyKind('page'), getAcademyKind('lesson'), getAcademyKind('qa'), getAcademyKind('glossary')
    ])
    summary.value = head
    home.value = (pages?.items || []).find(p => p.key === 'home') || null
    lessonItems.value = [...(lessonList?.items || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
    qaIssues.value = qaList?.items || []
    glossary.value = glossaryList?.items || []
    activeLesson.value = lessonItems.value[0]?.key || ''
  } catch (e) {
    const message = e?.message || '加载失败'
    error.value = /暂无数据/.test(message) ? '' : message
  } finally {
    loading.value = false
  }
}

async function fetchItem(kind, key) {
  const id = `${kind}/${key}`
  if (!cache.has(id)) cache.set(id, await getAcademyItem(kind, key))
  return cache.get(id)
}

async function runDetail(task) {
  lastRequest = task
  detailLoading.value = true
  detailError.value = ''
  try { await task() } catch (e) { detailError.value = e?.message || '加载失败' } finally { detailLoading.value = false }
}
function reloadDetail() { if (lastRequest) runDetail(lastRequest) }
function resetDetail() { selectedNote.value = null; selectedResource.value = ''; lessonDetail.value = null; detailError.value = '' }
function onDialogClosed() { lastRequest = null }

function openLesson(lesson) {
  resetDetail()
  activeLesson.value = lesson.id
  detailVisible.value = true
  runDetail(async () => { lessonDetail.value = await fetchItem('lesson', lesson.id) })
}
function openNote(note) { resetDetail(); selectedNote.value = note; detailVisible.value = true }
function openResource(key) {
  resetDetail()
  selectedResource.value = key
  glossaryKeyword.value = ''
  detailVisible.value = true
  if (key === 'weekly' && qaIssues.value.length && !qaDetail.value) loadQa(qaIssues.value[0].key)
}
function loadQa(key) { runDetail(async () => { qaDetail.value = await fetchItem('qa', key) }) }
function scrollToLesson(id) { activeLesson.value = id; document.getElementById(`lesson-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

// 正文小节跳转：正文 HTML 中含标题的 section 与 sections 顺序一致
async function jumpSection(index) {
  await nextTick()
  const heads = [...(articleRef.value?.querySelectorAll('section') || [])].filter(s => s.querySelector(':scope > h2, :scope > div > h2, :scope > h3') && !s.classList.contains('acd-first') && !s.classList.contains('first'))
  const target = heads.filter(s => !s.parentElement?.closest('section'))[index]
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
// 正文中的链接：站内锚点在弹窗内滚动，其余在新窗口打开 OSM
function onArticleClick(event) {
  const link = event.target.closest?.('a[href]')
  if (!link) return
  event.preventDefault()
  const href = link.getAttribute('href')
  if (href.startsWith('#')) { articleRef.value?.querySelector(`[id="${CSS.escape(decodeURIComponent(href.slice(1)))}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
  window.open(href, '_blank', 'noopener')
}

onMounted(loadAll)
</script>

<style scoped>
.academy-page{color:#1e3552}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:15px;margin:2px 0 17px}.eyebrow{display:flex;align-items:center;gap:7px;color:#4380c4;font-size:9px;letter-spacing:.8px;font-weight:700}.eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#59b58d;box-shadow:0 0 0 4px #59b58d20}.page-heading h1{margin:7px 0 4px;color:#17365e;font-size:26px;line-height:1.2}.page-heading p{margin:0;color:#8997a9;font-size:11px}.demo-badge{display:flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid #e3edf7;border-radius:20px;background:#f7fbff;color:#7591ad;font-size:8px;white-space:nowrap}.demo-badge i{width:6px;height:6px;border-radius:50%;background:#65a4dc}.panel{border:1px solid #e7edf4;border-radius:12px;background:#fff}.academy-layout{display:grid;grid-template-columns:225px minmax(0,1fr);align-items:start;gap:14px}.course-sidebar{position:sticky;top:90px;padding:13px 10px}.sidebar-heading{display:flex;align-items:center;gap:9px;padding:2px 5px 12px;border-bottom:1px solid #edf1f5}.sidebar-icon{width:31px;height:31px;display:grid;place-items:center;border-radius:9px;background:#eaf3fd;color:#4686c4;font-size:15px}.sidebar-heading div{display:flex;flex-direction:column;gap:3px}.sidebar-heading strong{color:#314b68;font-size:10px}.sidebar-heading small{color:#9caabb;font-size:8px}.sidebar-caption{display:block;margin:13px 6px 6px;color:#9aa8b7;font-size:7px;letter-spacing:.5px}.sidebar-course{width:100%;display:flex;align-items:center;gap:8px;padding:8px 6px;border:0;border-radius:7px;background:transparent;text-align:left;cursor:pointer;transition:background .15s}.sidebar-course:hover,.sidebar-course.selected{background:#f0f6fd}.course-number{width:25px;height:25px;flex:none;display:grid;place-items:center;border:1px solid #e7eef6;border-radius:7px;background:#fff;color:#7392b2;font-size:8px;font-weight:700}.selected .course-number{border-color:#cbdff2;background:#eaf3fd;color:#3277ba}.sidebar-course-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}.sidebar-course-copy strong{overflow:hidden;color:#536b85;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.sidebar-course-copy small{color:#a6b1bd;font-size:7px}.sidebar-arrow{color:#a4b4c5;font-size:11px}.sidebar-lock{color:#c19860;font-size:10px}.sidebar-divider{height:1px;margin:10px 4px;background:#edf1f5}.quick-caption{margin-top:8px}.sidebar-utility{width:100%;display:flex;align-items:center;gap:8px;padding:8px 6px;border:0;border-radius:7px;background:transparent;text-align:left;cursor:pointer}.sidebar-utility:hover{background:#f8fafd}.utility-icon{width:25px;height:25px;display:grid;place-items:center;border-radius:7px;background:#eef6ff;color:#6193c3;font-size:12px}.utility-icon.glossary{background:#f2f0fb;color:#8478af}.sidebar-utility>span:nth-child(2){display:flex;flex:1;flex-direction:column;gap:3px}.sidebar-utility strong{color:#627b96;font-size:8px}.sidebar-utility small{color:#a3afbd;font-size:7px}.sidebar-utility>.el-icon:last-child{color:#aeb9c5;font-size:10px}.sidebar-help{display:flex;align-items:flex-start;gap:6px;margin:13px 3px 1px;padding:8px;border:1px solid #f1e9da;border-radius:7px;background:#fffaf2;color:#9a896b;font-size:7px;line-height:1.5}.sidebar-help .el-icon{flex:none;margin-top:1px;color:#c9a369}.academy-content{min-width:0}.welcome-panel{position:relative;display:grid;grid-template-columns:minmax(0,1.45fr) minmax(150px,.7fr);min-height:166px;overflow:hidden;padding:20px 22px 37px;background:linear-gradient(110deg,#fff 0%,#fff 64%,#f3f8fe 100%)}.welcome-copy{position:relative;z-index:2}.welcome-kicker{color:#4786c1;font-size:8px;letter-spacing:.7px;font-weight:700}.welcome-copy h2{margin:8px 0 8px;color:#1d3b60;font-size:19px;letter-spacing:-.3px}.welcome-copy p{max-width:540px;margin:0;color:#8192a6;font-size:9px;line-height:1.75}.welcome-points{display:flex;flex-wrap:wrap;gap:13px;margin-top:13px}.welcome-points span{display:flex;align-items:center;gap:4px;color:#6f8ba8;font-size:8px}.welcome-points .el-icon{color:#53a580;font-size:10px}.welcome-art{position:relative;min-height:105px}.orbit{position:absolute;border:1px solid #c8dcee90;border-radius:50%}.orbit-a{width:132px;height:132px;top:-13px;right:5px}.orbit-b{width:88px;height:88px;top:9px;right:27px}.lesson-paper{position:absolute;width:58px;height:72px;top:18px;right:45px;display:flex;flex-direction:column;gap:7px;padding:12px 9px;border:1px solid #dce8f4;border-radius:8px;background:#fff;box-shadow:0 10px 24px #315d8a18;transform:rotate(6deg)}.lesson-paper i{height:3px;border-radius:3px;background:#dce8f4}.lesson-paper i:nth-child(2){width:80%}.lesson-paper i:nth-child(3){width:60%}.lesson-paper b{width:25px;height:14px;margin-top:3px;border-radius:4px;background:#e8f4ee}.paper-check{position:absolute;right:-13px;bottom:7px;width:23px;height:23px;display:grid;place-items:center;border:2px solid #fff;border-radius:50%;background:#5aaa82;color:#fff;font-size:11px}.art-star{position:absolute;color:#84afd5}.star-a{top:10px;right:19px;font-size:15px}.star-b{bottom:12px;right:121px;font-size:10px}.art-dot{position:absolute;width:6px;height:6px;border-radius:50%;background:#9bc6e7}.dot-a{top:28px;right:132px}.dot-b{bottom:12px;right:16px;background:#f0bd76}.welcome-foot{position:absolute;right:20px;bottom:11px;left:20px;display:flex;align-items:center;gap:5px;padding-top:7px;border-top:1px solid #edf2f6;color:#9aa9b8;font-size:7px}.welcome-foot .el-icon{color:#8ba7c4}.intro-video{display:grid;grid-template-columns:minmax(220px,.9fr) minmax(0,1.1fr);overflow:hidden;margin-top:11px}.video-thumb{position:relative;min-height:132px;overflow:hidden;background:linear-gradient(135deg,#1b4777,#2e79b5 66%,#69a6d1)}.video-grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff0c 1px,transparent 1px),linear-gradient(90deg,#ffffff0c 1px,transparent 1px);background-size:22px 22px;mask-image:linear-gradient(90deg,#000,transparent)}.video-orbit{position:absolute;border:1px solid #ffffff32;border-radius:50%}.video-orbit-one{width:190px;height:190px;top:-105px;right:-19px}.video-orbit-two{width:135px;height:135px;right:8px;bottom:-87px}.video-brand{position:absolute;top:13px;left:15px;color:#fff;font-size:10px;font-weight:800;letter-spacing:.3px}.video-brand span{color:#b4d8f5}.play-button{position:absolute;top:50%;left:50%;width:41px;height:41px;display:grid;place-items:center;border:1px solid #ffffff80;border-radius:50%;background:#ffffffeb;color:#3478b7;font-size:21px;cursor:pointer;transform:translate(-50%,-50%);box-shadow:0 6px 17px #10355835;transition:transform .15s}.play-button:hover{transform:translate(-50%,-50%) scale(1.06)}.video-length{position:absolute;bottom:9px;left:12px;color:#e0effb;font-size:7px}.video-ribbon{position:absolute;right:10px;bottom:8px;padding:4px 6px;border:1px solid #ffffff40;border-radius:5px;color:#e4f1fc;font-size:7px}.video-copy{align-self:center;padding:15px 18px}.video-copy h3{margin:5px 0;color:#244263;font-size:14px}.video-copy p{max-width:370px;margin:0;color:#8999ac;font-size:8px;line-height:1.7}.video-meta{display:flex;gap:12px;margin-top:8px;color:#9aa8b7;font-size:7px}.video-meta span{display:flex;align-items:center;gap:4px}.video-meta .el-icon{color:#7fa2c5}.video-action{height:27px;margin-top:10px;border-radius:6px;font-size:8px}.video-action .el-icon{margin-left:4px}.philosophy-section,.lessons-section{margin-top:19px}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:9px}.section-heading h2{margin:4px 0;color:#274261;font-size:14px}.section-heading h2 small{margin-left:4px;color:#9aa8b7;font-size:8px;font-weight:500}.section-heading p{margin:0;color:#9aa8b7;font-size:8px}.step-word{display:inline-grid;width:21px;height:21px;place-items:center;margin-right:4px;border-radius:6px;background:#edf5fd;color:#4382bf;font-size:10px}.section-count{padding:4px 7px;border:1px solid #eaf0f5;border-radius:12px;color:#8fa0b2;font-size:7px;white-space:nowrap}.notes-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.note-card{min-height:128px;display:flex;align-items:flex-start;flex-direction:column;padding:10px;text-align:left;cursor:pointer;transition:transform .15s,border-color .15s}.note-card:hover,.lesson-card:hover{transform:translateY(-2px);border-color:#d4e3f2}.note-icon{width:25px;height:25px;display:grid;place-items:center;border-radius:7px;font-size:12px}.note-icon.blue{background:#edf5ff;color:#4c85bd}.note-icon.violet{background:#f2f0fa;color:#8579ae}.note-icon.orange{background:#fff4e7;color:#c58d49}.note-icon.green{background:#edf7f1;color:#58a07c}.note-kind{margin-top:7px;color:#9caaba;font-size:7px}.note-card>strong{margin-top:4px;color:#526d89;font-size:9px}.note-card>small{margin-top:4px;color:#9aa8b7;font-size:7px;line-height:1.45}.note-link{display:flex;align-items:center;gap:3px;margin-top:auto;padding-top:8px;color:#5c8bb9;font-size:7px}.note-link .el-icon{font-size:9px}.lesson-list{display:flex;flex-direction:column;gap:8px}.lesson-card{display:grid;grid-template-columns:130px minmax(0,1fr);min-height:117px;overflow:hidden;transition:transform .15s,border-color .15s;scroll-margin-top:94px}.lesson-selected{border-color:#d7e6f4;box-shadow:0 3px 12px #356b9910}.lesson-cover{position:relative;overflow:hidden;display:grid;place-items:center;min-height:117px}.cover-blue{background:linear-gradient(140deg,#e8f2fd,#dceafa)}.cover-cyan{background:linear-gradient(140deg,#e5f5f7,#d9eef2)}.cover-violet{background:linear-gradient(140deg,#f0edfa,#e5e1f5)}.cover-orange{background:linear-gradient(140deg,#fbf0e1,#f6e7d1)}.cover-green{background:linear-gradient(140deg,#eaf5ed,#dbeee2)}.cover-navy{background:linear-gradient(140deg,#e8eef6,#dbe4ef)}.cover-number{position:absolute;top:7px;left:9px;color:#809bb7;font-size:8px;font-weight:700;letter-spacing:.7px}.cover-graphic{position:relative;width:54px;height:54px;display:grid;place-items:center;border:1px solid #ffffffc9;border-radius:15px;background:#ffffffa6;color:#5a90c0;font-size:23px;box-shadow:0 8px 20px #577aa01a}.cover-graphic i{position:absolute;width:7px;height:7px;border:2px solid #fff;border-radius:50%;background:#71b28d}.cover-graphic i:nth-of-type(1){top:1px;right:0}.cover-graphic i:nth-of-type(2){bottom:4px;left:-4px;background:#e4ad60}.cover-graphic i:nth-of-type(3){right:-7px;bottom:7px;background:#739dcc}.cover-caption{position:absolute;right:8px;bottom:7px;color:#98adc0;font-size:6px;letter-spacing:.6px}.lesson-body{padding:10px 12px}.lesson-topline{display:flex;align-items:center;gap:8px}.access-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 6px;border-radius:5px;font-size:7px}.access-badge.public{background:#eef7f1;color:#548e70}.access-badge.member{background:#fff5e8;color:#b2864d}.access-badge .el-icon{font-size:8px}.lesson-duration{display:flex;align-items:center;gap:4px;color:#9ba9b8;font-size:7px}.lesson-body h3{margin:6px 0 4px;color:#385675;font-size:10px}.lesson-body p{max-width:690px;margin:0;color:#8999ab;font-size:8px;line-height:1.6}.lesson-topics{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.lesson-topics span{padding:3px 5px;border-radius:4px;background:#f4f7fa;color:#899bad;font-size:6px}.lesson-link{display:flex;align-items:center;gap:4px;margin-top:7px;padding:0;border:0;background:transparent;color:#3f7fb9;font-size:7px;font-weight:650;cursor:pointer}.lesson-link .el-icon{font-size:9px}.resources-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}.resource-card{position:relative;display:flex;align-items:flex-start;gap:10px;min-height:108px;overflow:hidden;padding:13px;cursor:pointer;transition:transform .15s,border-color .15s}.resource-card:hover{transform:translateY(-2px);border-color:#d5e4f2}.resource-icon{width:31px;height:31px;flex:none;display:grid;place-items:center;border-radius:9px;background:#eaf4fd;color:#548cbd;font-size:15px}.glossary-card .resource-icon{background:#f1effa;color:#887daf}.resource-card>div{position:relative;z-index:1}.resource-card h3{margin:4px 0;color:#3f5f80;font-size:11px}.resource-card p{max-width:240px;margin:0;color:#98a6b4;font-size:7px;line-height:1.55}.resource-link{display:flex;align-items:center;gap:3px;margin-top:8px;color:#5488b7;font-size:7px}.resource-mark{position:absolute;right:8px;bottom:-4px;color:#f2f6fa;font-size:32px;font-weight:800;letter-spacing:-1px}.academy-disclaimer{display:flex;align-items:flex-start;gap:6px;margin-top:11px;padding:9px 10px;border:1px solid #f1e8d9;border-radius:8px;background:#fffaf2;color:#9a896a;font-size:7px;line-height:1.5}.academy-disclaimer .el-icon{flex:none;margin-top:1px;color:#c79d5c}.dialog-video{height:170px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;border-radius:10px;background:linear-gradient(135deg,#1e4c7c,#4b89bc);color:#fff}.dialog-video .el-icon{font-size:34px}.dialog-video strong{font-size:12px}.dialog-video span{color:#d2e4f4;font-size:9px}.dialog-copy{margin:12px 0;color:#71849a;font-size:10px;line-height:1.7}.dialog-chapters{display:flex;gap:7px}.dialog-chapters span{flex:1;padding:8px;border:1px solid #eaf0f5;border-radius:7px;color:#7489a1;font-size:8px}.dialog-chapters b{display:block;margin-bottom:5px;color:#4282bd;font-size:8px}.resource-detail,.lesson-detail{color:#70859c;font-size:10px;line-height:1.7}.detail-icon{width:35px;height:35px;display:grid;place-items:center;margin-bottom:9px;border-radius:10px;background:#edf5fd;color:#578cbb;font-size:17px}.detail-placeholder{margin-top:10px;padding:10px;border:1px dashed #dce5ee;border-radius:7px;background:#f9fbfd;color:#96a5b4;font-size:8px}
.status-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:260px;padding:30px 20px;text-align:center}.status-icon{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#eef5fc;color:#5b91c7;font-size:18px}.status-panel strong{color:#3d5a7a;font-size:13px}.status-panel p{margin:0;color:#8e9daf;font-size:9px}.status-panel button,.detail-state button{margin-top:6px;padding:6px 12px;border:1px solid #dfe8f2;border-radius:7px;background:#fff;color:#3c78b5;font-size:9px;cursor:pointer}.deploy-tip{display:flex;align-items:center;gap:6px;max-width:420px;margin-top:4px;padding:7px 10px;border-radius:7px;background:#f4f8fc;color:#7d93aa;font-size:8px;line-height:1.5;text-align:left}.deploy-tip i{flex:none;width:5px;height:5px;border-radius:50%;background:#7ea8d3}.spinning{animation:ac-spin 1s linear infinite}@keyframes ac-spin{to{transform:rotate(360deg)}}.demo-badge i.stale{background:#c9d3de}
.video-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.28;mix-blend-mode:luminosity}.lesson-tagline{padding:2px 5px;border-radius:4px;background:#edf5fd;color:#4a83bb;font-size:6px}.dialog-video{background-size:cover;background-position:center}
.detail-state{display:flex;flex-direction:column;align-items:center;gap:6px;padding:40px 0;color:#8e9daf;font-size:10px}.detail-state.error{color:#c0715a}.detail-kind{display:block;margin-bottom:4px;color:#9caaba;font-size:8px}.detail-out{display:inline-flex;align-items:center;gap:4px;margin-top:12px;color:#3f7fb9;font-size:9px;font-weight:600;text-decoration:none}
.lesson-detail-head,.qa-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}.lesson-toc{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #edf1f5}.lesson-toc button{padding:3px 7px;border:1px solid #e6edf5;border-radius:5px;background:#f7fafd;color:#5d7894;font-size:8px;cursor:pointer}.lesson-toc button:hover{border-color:#cfe0f1;color:#3277ba}
.lesson-article{max-height:62vh;overflow:auto;padding-right:6px;color:#4d6580;font-size:10px;line-height:1.75;word-break:break-word}
.lesson-article :deep(h1){margin:4px 0 6px;color:#1d3b60;font-size:17px}.lesson-article :deep(h2){margin:16px 0 6px;color:#274261;font-size:13px}.lesson-article :deep(h3){margin:12px 0 5px;color:#385675;font-size:11px}.lesson-article :deep(p){margin:5px 0}.lesson-article :deep(ol),.lesson-article :deep(ul){margin:5px 0;padding-left:18px}.lesson-article :deep(li){margin:3px 0}
.lesson-article :deep(.acd-kick),.lesson-article :deep(.kick),.lesson-article :deep(.num),.lesson-article :deep(.sog-long-num){color:#4786c1;font-size:8px;font-weight:700;letter-spacing:.5px}.lesson-article :deep(.acd-deck),.lesson-article :deep(.deck){color:#8a9bb0;font-size:9px}.lesson-article :deep(.acd-lede),.lesson-article :deep(.lede),.lesson-article :deep(.sog-long-lede){color:#5f7790}
.lesson-article :deep(section){scroll-margin-top:8px}.lesson-article :deep(.acd-first),.lesson-article :deep(.first){margin:10px 0;padding:9px 12px;border:1px solid #e3edf7;border-radius:8px;background:#f7fbff}.lesson-article :deep(.scope),.lesson-article :deep(.acd-scope){display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.lesson-article :deep(.scope>div),.lesson-article :deep(.acd-scope>div){padding:8px 10px;border-radius:7px;background:#eef7f1}.lesson-article :deep(.scope>div.no),.lesson-article :deep(.acd-scope>div.no){background:#fff5e8}
.lesson-article :deep(.sog-em),.lesson-article :deep(.acd-sec-note),.lesson-article :deep(.sog-note){padding:6px 9px;border-left:3px solid #9bc6e7;border-radius:4px;background:#f6f9fc;color:#5a7591}.lesson-article :deep(.sog-em.warn){border-left-color:#e4ad60;background:#fffaf2}
.lesson-article :deep(article),.lesson-article :deep(.sog-card),.lesson-article :deep(.sog-panel),.lesson-article :deep(.sd-card){margin:8px 0;padding:8px 10px;border:1px solid #e7edf4;border-radius:8px;background:#fbfcfe;font-size:9px}
.lesson-article :deep(table){width:100%;margin:8px 0;border-collapse:collapse;font-size:9px}.lesson-article :deep(th),.lesson-article :deep(td){padding:4px 6px;border:1px solid #e7edf4;text-align:left}.lesson-article :deep(th){background:#f4f8fc;color:#4f6b88}
.lesson-article :deep(img){max-width:100%;height:auto}.lesson-article :deep(svg){max-width:100%;height:auto;max-height:220px}.lesson-article :deep(pre),.lesson-article :deep(code){font-family:Menlo,Consolas,monospace;font-size:8px}.lesson-article :deep(pre){overflow:auto;padding:8px;border-radius:6px;background:#f4f7fa}.lesson-article :deep(a){color:#3f7fb9}.lesson-article :deep(button){display:none}.lesson-article :deep(footer){margin-top:12px;padding-top:8px;border-top:1px solid #edf1f5;color:#98a6b4;font-size:8px}
.qa-detail{max-height:66vh;overflow:auto;padding-right:6px;color:#4d6580;font-size:10px;line-height:1.7}.qa-issues{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.qa-issues button{display:flex;flex-direction:column;padding:5px 9px;border:1px solid #e6edf5;border-radius:7px;background:#fff;color:#5d7894;font-size:9px;cursor:pointer}.qa-issues button.active{border-color:#cbdff2;background:#eaf3fd;color:#3277ba}.qa-issues small{color:#9aa8b7;font-size:7px}.qa-lede{margin:0 0 10px;color:#71849a}
.qa-chapter h4{display:flex;align-items:center;gap:6px;margin:14px 0 6px;color:#274261;font-size:12px}.qa-chapter h4 b{padding:2px 6px;border-radius:5px;background:#edf5fd;color:#4382bf;font-size:9px}.qa-item{margin:8px 0;padding:10px 12px;border:1px solid #e7edf4;border-radius:9px;background:#fff}.qa-item h5{margin:0 0 5px;color:#385675;font-size:10px}.qa-item h5 span{margin-right:6px;color:#4786c1;font-size:8px}.qa-ask{margin:0 0 6px;padding:6px 9px;border-radius:6px;background:#f6f9fc;color:#6d8299}.qa-ask b,.qa-key b,.gloss-where span,.gloss-not span{margin-right:6px;font-size:8px}.qa-ask b{color:#7d93aa}.qa-answer :deep(p){margin:4px 0}.qa-key{margin:6px 0 0;padding:6px 9px;border-radius:6px;background:#eef7f1;color:#4c7d64}.qa-key b{color:#3f9670}
.glossary-search{margin-bottom:8px}.glossary-list{max-height:60vh;overflow:auto;margin:0;padding-right:6px}.glossary-item{padding:9px 0;border-bottom:1px solid #edf1f5}.glossary-item dt{color:#274261;font-size:11px;font-weight:700}.glossary-item dt small{margin-left:6px;color:#9aa8b7;font-size:8px;font-weight:500}.glossary-item dd{margin:4px 0 0;color:#5f7790;font-size:9px;line-height:1.65}.glossary-item p{margin:3px 0}.gloss-where span{color:#4a83bb}.gloss-not span{color:#b2864d}
@media(max-width:1000px){.academy-layout{grid-template-columns:195px minmax(0,1fr);gap:10px}.course-sidebar{padding:11px 8px}.lesson-card{grid-template-columns:110px minmax(0,1fr)}.notes-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.lesson-article :deep(.scope),.lesson-article :deep(.acd-scope){grid-template-columns:1fr}.page-heading{align-items:flex-start;flex-direction:column;gap:8px}.academy-layout{grid-template-columns:1fr}.course-sidebar{position:static;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px;padding:9px}.sidebar-heading,.sidebar-caption,.sidebar-divider,.sidebar-help{grid-column:1/-1}.sidebar-heading{padding-bottom:9px}.sidebar-caption{margin:7px 4px 3px}.sidebar-course{padding:6px 4px}.sidebar-course-copy strong{font-size:7px}.sidebar-course-copy small{font-size:6px}.sidebar-utility{padding:6px 4px}.welcome-panel{grid-template-columns:minmax(0,1fr) 115px;padding:15px 14px 37px}.welcome-copy h2{font-size:16px}.welcome-copy p{font-size:8px}.welcome-art{transform:scale(.8);transform-origin:center right}.welcome-foot{right:12px;left:12px;font-size:6px}.intro-video{grid-template-columns:1fr}.video-thumb{min-height:150px}.video-copy{padding:12px 14px}.notes-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.note-card{min-height:120px}.lesson-card{grid-template-columns:96px minmax(0,1fr)}.lesson-cover{min-height:133px}.lesson-body{padding:9px}.lesson-body p{font-size:7px}.lesson-topics{gap:3px}.resources-grid{grid-template-columns:1fr}}
@media(max-width:390px){.welcome-panel{grid-template-columns:minmax(0,1fr) 70px}.welcome-art{transform:scale(.65)}.welcome-copy h2{font-size:14px}.welcome-points{gap:7px}.welcome-points span{font-size:7px}.lesson-card{grid-template-columns:78px minmax(0,1fr)}.cover-graphic{width:44px;height:44px}.lesson-body h3{font-size:9px}.lesson-topline{gap:5px}.access-badge{font-size:6px}.lesson-duration{font-size:6px}.dialog-chapters{flex-direction:column}}
</style>
