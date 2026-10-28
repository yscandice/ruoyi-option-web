<template>
  <div class="acv3">
    <section class="hero ac-hero"><div class="wrap">
      <nav class="ac-tabs" aria-label="新人学堂目录">
        <span class="ac-tabs-h">新人学堂</span>
        <a v-for="book in books" :key="book.key" role="button" tabindex="0" :class="[tabClass(book), { on: activeKey === book.key }]" @click="openBook(book)" @keydown.enter.prevent="openBook(book)">
          <em class="num">{{ book.no }}</em><b>{{ book.title }}</b><small :class="['ac-tag', tagClass(book.access)]">{{ book.access }}</small>
        </a>
      </nav>
      <div class="hero-top">
        <div>
          <span class="eyebrow"><i />{{ head.kick }}</span>
          <h1>{{ head.title || '看懂工作台上的每一张卡' }}</h1>
          <p class="hero-sub">{{ head.lede }}</p>
        </div>
        <span :class="['ac-sync', { stale: !summary }]"><i />{{ syncLabel }}</span>
      </div>
    </div></section>

    <div class="body"><div class="wrap"><main class="main solo ac">
      <section v-if="!ready" class="ac-state">
        <strong>{{ loading ? '正在读取学堂…' : '暂无学堂数据' }}</strong>
        <p>{{ loading ? '正在从本地服务读取 OSM 同步的学堂课程与札记。' : (error || '后端定时任务尚未同步学堂数据，请稍后刷新。') }}</p>
        <button v-if="!loading" type="button" class="btn" @click="loadAll">重新加载</button>
      </section>

      <template v-else>
        <div class="ac-two">
          <section v-for="item in scopeItems" :key="item.type" class="card" :class="item.type === 'include' ? 'ac-do' : 'ac-dont'">
            <small>{{ item.label }}</small><p>{{ item.text }}</p>
          </section>
        </div>

        <section v-if="video" class="card ac-video">
          <button type="button" class="vthumb" :aria-label="`播放「${video.title}」`" @click="showToast(`播放「${video.title}」`)"><b>欢迎</b><i>▶</i></button>
          <div><h3>{{ video.title }}</h3><p>{{ video.summary }}</p><small class="num">{{ video.meta }}</small></div>
        </section>

        <div class="ac-sh"><b>先</b><h2>懂为什么</h2><span>{{ notesSub }}</span></div>
        <div class="notes">
          <button v-for="note in notes" :key="note.id || note.title" type="button" class="note" @click="openNote(note)">
            <small>{{ note.tag }}</small><b>{{ note.title }}</b>
          </button>
        </div>

        <div class="ac-sh"><b>再</b><h2>学怎么做</h2><span>学堂 · {{ lessons.length }} 课，按顺序读</span></div>
        <div class="lessons">
          <button v-for="lesson in lessons" :key="lesson.key" type="button" class="card lesson" :class="{ first: lesson.first }" @click="openLesson(lesson.key)">
            <div class="ls-h"><span class="ls-n">{{ lesson.no }}</span><span v-if="lesson.first" class="ac-tag go">从这里开始</span><span :class="['ac-tag', tagClass(lesson.access)]">{{ lesson.access }}</span></div>
            <h3>{{ lesson.title }}</h3>
            <p>{{ lesson.summary }}</p>
            <small class="num">{{ lesson.caseLine }}</small>
          </button>
        </div>

        <button v-for="ref in refs" :key="ref.key" type="button" class="ac-row" @click="openRef(ref)">
          <b>{{ ref.title }}</b><span>{{ ref.summary }}</span><i>→</i>
        </button>

        <div v-if="tipText" class="ac-tip">{{ tipParts.head }}<b v-if="tipParts.hl">{{ tipParts.hl }}</b>{{ tipParts.tail }}</div>

        <div class="ac-foot">
          <p v-for="(line, index) in footLines" :key="index">
            {{ line.head }}<router-link v-if="line.link" to="/scorecard">{{ line.link }}</router-link>{{ line.tail }}
          </p>
        </div>
      </template>
    </main></div></div>

    <transition name="ac-fade">
      <div v-if="modal" class="ac-modal" @click.self="closeModal">
        <div class="ac-sheet" role="dialog" aria-modal="true">
          <header class="ac-sheet-h">
            <div class="tt">
              <h3>{{ modalTitle }}</h3>
              <div class="ac-sheet-meta">{{ modalMeta }}</div>
            </div>
            <button type="button" class="ac-x" aria-label="关闭" @click="closeModal">×</button>
          </header>
          <div class="ac-sheet-b">
            <div v-if="detailLoading" class="ac-empty">正在读取内容…</div>
            <div v-else-if="detailError" class="ac-empty">{{ detailError }}</div>

            <template v-else-if="modal.type === 'lesson' && lessonDetail">
              <div v-if="lessonDetail.sections && lessonDetail.sections.length" class="ac-toc">
                <button v-for="(sec, index) in lessonDetail.sections" :key="index" type="button" @click="jumpSection(index)">{{ sec.title }}</button>
              </div>
              <article ref="articleEl" class="ac-article" v-html="lessonDetail.html" />
              <a v-if="lessonDetail.why && lessonDetail.why.href" class="ac-out" :href="lessonDetail.why.href" target="_blank" rel="noopener">{{ lessonDetail.why.tag }}：{{ lessonDetail.why.title }} →</a>
            </template>

            <template v-else-if="modal.type === 'qa' && qaDetail">
              <div v-if="qaIssues.length > 1" class="ac-qa-issues">
                <button v-for="issue in qaIssues" :key="issue.key" type="button" :class="{ on: qaDetail.key === issue.key }" @click="loadQa(issue.key)">{{ issue.no }}<small>{{ issue.publishDate }}</small></button>
              </div>
              <p v-if="qaDetail.lede" class="ac-lede">{{ qaDetail.lede }}</p>
              <section v-for="chapter in qaDetail.chapters" :key="chapter.no" class="ac-chapter">
                <h4><b>{{ chapter.no }}</b>{{ chapter.title }}</h4>
                <article v-for="item in chapter.items" :key="item.q" class="ac-item">
                  <h5><span>{{ item.q }}</span>{{ item.title }}</h5>
                  <p class="ac-ask"><b>{{ item.askLabel || '群友问' }}</b>{{ item.ask }}</p>
                  <div class="ac-answer" v-html="item.answerHtml" />
                  <p v-if="item.key" class="ac-key"><b>{{ item.keyLabel || '划重点' }}</b>{{ item.key }}</p>
                </article>
              </section>
            </template>

            <template v-else-if="modal.type === 'glossary'">
              <label class="ac-search"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg><input v-model="glossaryWord" type="search" placeholder="搜索术语 / 英文 / 释义" /></label>
              <dl class="ac-gloss">
                <div v-for="term in filteredGlossary" :key="term.key" class="ac-gloss-item">
                  <dt>{{ term.term }}<small v-if="term.en">{{ term.en }}</small></dt>
                  <dd>
                    <p>{{ term.definition }}</p>
                    <p v-if="term.where" class="ac-gloss-where"><span>{{ term.whereLabel || '在卡上' }}</span>{{ term.where }}</p>
                    <p v-if="term.not" class="ac-gloss-not"><span>{{ term.notLabel || '不是' }}</span>{{ term.not }}</p>
                  </dd>
                </div>
              </dl>
              <div v-if="!filteredGlossary.length" class="ac-empty">没有匹配的术语。</div>
            </template>

            <template v-else-if="modal.type === 'note' && selectedNote">
              <p class="ac-lede">{{ selectedNote.description || `${selectedNote.tag}：${selectedNote.title}` }}</p>
              <p v-if="selectedNote.lessons.length" class="ac-gloss-where"><span>出现在</span>{{ selectedNote.lessons.join('、') }}</p>
              <a v-if="selectedNote.href" class="ac-out" :href="selectedNote.href" target="_blank" rel="noopener">在 OSM 阅读完整札记 →</a>
            </template>
          </div>
        </div>
      </div>
    </transition>

    <transition name="ac-fade"><div v-if="toast" class="ac-toast">{{ toast }}</div></transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getAcademyItem, getAcademyKind, getAcademySummary } from '@/api/option/academy'

const loading = ref(false)
const error = ref('')
const summary = ref(null)
const home = ref(null)
const lessonItems = ref([])
const qaIssues = ref([])
const glossary = ref([])

const modal = ref(null)
const detailLoading = ref(false)
const detailError = ref('')
const lessonDetail = ref(null)
const qaDetail = ref(null)
const selectedNote = ref(null)
const glossaryWord = ref('')
const articleEl = ref(null)
const toast = ref('')
let toastTimer = 0
const cache = new Map()

const ready = computed(() => !!home.value && lessonItems.value.length > 0)
const head = computed(() => home.value || summary.value || {})
const books = computed(() => home.value?.books || [])
const scopeItems = computed(() => (home.value?.scope || []).filter(item => item.text))
const video = computed(() => home.value?.video || null)
const notes = computed(() => home.value?.notes || [])
const notesSub = computed(() => home.value?.notesHeading || '札记 · 我们怎么想卖方这件事')
const lessons = computed(() => home.value?.lessons || [])
const refs = computed(() => home.value?.refs || [])
const tipText = computed(() => home.value?.note || '')
// 设计稿把「开了自动驾驶，这些卡由程序照做」加粗
const TIP_HIGHLIGHT = '开了自动驾驶，这些卡由程序照做'
const tipParts = computed(() => {
  const text = tipText.value
  const at = text.indexOf(TIP_HIGHLIGHT)
  if (at < 0) return { head: text, hl: '', tail: '' }
  return { head: text.slice(0, at), hl: TIP_HIGHLIGHT, tail: text.slice(at + TIP_HIGHLIGHT.length) }
})
const footLines = computed(() => (home.value?.footer || []).map(splitFooter).filter(line => line.head || line.tail))
const activeKey = computed(() => (modal.value?.type === 'lesson' ? modal.value.key : ''))

const syncLabel = computed(() => {
  const time = summary.value?.syncTime
  return time ? `OSM 同步 · ${String(time).slice(5, 16)}` : '暂无同步记录'
})

const modalTitle = computed(() => {
  if (!modal.value) return ''
  if (modal.value.type === 'lesson') return lessonDetail.value?.title || modal.value.title || '课程'
  if (modal.value.type === 'qa') return qaDetail.value?.title || '一周问答'
  if (modal.value.type === 'glossary') return `术语速查 · ${glossary.value.length} 个词`
  return selectedNote.value?.title || '札记'
})

const modalMeta = computed(() => {
  if (!modal.value) return ''
  if (modal.value.type === 'lesson') {
    const detail = lessonDetail.value
    if (!detail) return '课程'
    const count = detail.sections?.length || 0
    return [detail.no, detail.access, `${count} 个小节`, detail.textLength ? `约 ${detail.textLength} 字` : ''].filter(Boolean).join(' · ')
  }
  if (modal.value.type === 'qa') {
    const detail = qaDetail.value
    if (!detail) return '一周问答'
    return [detail.no, detail.deck, detail.publishDate ? `${detail.publishDate} 出刊` : ''].filter(Boolean).join(' · ')
  }
  if (modal.value.type === 'glossary') return '卡上会出现的词，一词一句'
  return selectedNote.value?.tag || '札记'
})

const filteredGlossary = computed(() => {
  const word = glossaryWord.value.trim().toLowerCase()
  if (!word) return glossary.value
  return glossary.value.filter(term => [term.term, term.en, term.definition, term.where, term.not].some(value => value && String(value).toLowerCase().includes(word)))
})

function tagClass(access) {
  if (access === '会员') return 'mem'
  if (access === '每周更新') return 'wk'
  return 'pub'
}
function tabClass(book) {
  if (book.type === 'qa') return 'qa'
  if (book.type === 'glossary') return 'gl'
  return ''
}
// 页脚第二句含「见卖方战绩页」，拆成 前文 + 链接 + 后文
function splitFooter(text) {
  const key = '卖方战绩页'
  const at = String(text || '').indexOf(key)
  if (at < 0) return { head: text, tail: '' }
  return { head: text.slice(0, at), link: key, tail: text.slice(at + key.length) }
}
function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [headBody, pages, lessonList, qaList, glossaryList] = await Promise.all([
      getAcademySummary(), getAcademyKind('page'), getAcademyKind('lesson'), getAcademyKind('qa'), getAcademyKind('glossary')
    ])
    summary.value = headBody
    home.value = (pages?.items || []).find(page => page.key === 'home') || null
    lessonItems.value = [...(lessonList?.items || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
    qaIssues.value = qaList?.items || []
    glossary.value = glossaryList?.items || []
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

function closeModal() {
  modal.value = null
  lessonDetail.value = null
  qaDetail.value = null
  selectedNote.value = null
  detailError.value = ''
  glossaryWord.value = ''
}
function openBook(book) {
  if (book.type === 'qa') return openQa()
  if (book.type === 'glossary') return openGlossary()
  return openLesson(book.key)
}
function openRef(ref) {
  if (ref.key === 'glossary') return openGlossary()
  return openQa()
}
async function openLesson(key) {
  if (!key) return
  const brief = lessons.value.find(lesson => lesson.key === key) || lessonItems.value.find(lesson => lesson.key === key) || {}
  closeModal()
  modal.value = { type: 'lesson', key, title: brief.title }
  detailLoading.value = true
  try { lessonDetail.value = await fetchItem('lesson', key) } catch (e) { detailError.value = e?.message || '课程读取失败' } finally { detailLoading.value = false }
}
function openQa() {
  closeModal()
  modal.value = { type: 'qa' }
  if (qaIssues.value.length) loadQa(qaIssues.value[0].key)
  else detailError.value = '暂无一周问答，等待后端同步。'
}
async function loadQa(key) {
  detailLoading.value = true
  detailError.value = ''
  try { qaDetail.value = await fetchItem('qa', key) } catch (e) { detailError.value = e?.message || '问答读取失败' } finally { detailLoading.value = false }
}
function openGlossary() {
  closeModal()
  modal.value = { type: 'glossary' }
}
function openNote(note) {
  closeModal()
  const owners = lessonItems.value.filter(lesson => lesson.why?.id === note.id)
  selectedNote.value = {
    ...note,
    description: owners[0]?.why?.summary || '',
    lessons: owners.map(lesson => `${lesson.no} ${lesson.navTitle || lesson.title}`)
  }
  modal.value = { type: 'note' }
}

// 正文小节跳转：优先用小节 id，其次按 section.acd-sec 顺序
async function jumpSection(index) {
  await nextTick()
  const root = articleEl.value
  if (!root) return
  const sec = lessonDetail.value?.sections?.[index]
  let target = sec?.id ? root.querySelector(`#${CSS.escape(sec.id)}`) : null
  if (!target) target = root.querySelectorAll('section.acd-sec')[index]
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const onKeydown = event => { if (event.key === 'Escape' && modal.value) closeModal() }
watch(modal, value => {
  document.body.style.overflow = value ? 'hidden' : ''
})
onMounted(() => {
  loadAll()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  clearTimeout(toastTimer)
})
</script>

<style src="./academy-v3.css"></style>

<style>
.acv3 .ac-fade-enter-active,.acv3 .ac-fade-leave-active{transition:opacity .18s ease}
.acv3 .ac-fade-enter-from,.acv3 .ac-fade-leave-to{opacity:0}
.acv3 .ac-toast{position:fixed;left:50%;bottom:32px;z-index:130;padding:12px 20px;border-radius:999px;background:#070a13;color:#fff;font-size:14px;box-shadow:0 16px 40px rgba(7,10,19,.18);transform:translateX(-50%)}
html:has(.acv3){overflow-x:clip}
body:has(.acv3) .option-main{overflow:visible}
</style>
