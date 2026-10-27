<template>
  <div :class="['option-shell', { 'is-scrolled': scrolled, 'menu-open': menuOpen }]">
    <AccessBanner />
    <header class="option-header"><div class="header-inner">
      <router-link class="brand" to="/today"><span class="brand-mark">O</span><span class="brand-copy"><strong>OSM<span>.AI</span></strong><small>OPTIONS INTELLIGENCE</small></span></router-link>
      <nav class="main-nav" aria-label="期权导航">
        <router-link v-for="item in menus" :key="item.path" :class="['nav-item', { active: currentPath === item.path }]" :to="item.path">{{ item.label }}<em v-if="item.path === '/updates' && updateBadge" class="nav-badge" :title="`${updateState.unseen} 条未读更新`">{{ updateBadge }}</em></router-link>
      </nav>
      <div class="account-area">
        <span v-if="levelLabel" class="level-pill"><i />{{ levelLabel }}</span>
        <router-link class="account-link" to="/settings" title="账户设置"><span class="account-avatar"><img v-if="avatarUrl" :src="avatarUrl" alt=""><template v-else>{{ initials }}</template></span><span class="account-name">{{ userName }}</span></router-link>
        <button class="icon-button logout-button" type="button" title="退出登录" aria-label="退出登录" @click="handleLogout"><el-icon><SwitchButton /></el-icon></button>
      </div>
      <div class="mobile-actions">
        <router-link class="icon-button mobile-avatar" to="/settings" aria-label="账户设置" @click="menuOpen = false"><img v-if="avatarUrl" :src="avatarUrl" alt=""><template v-else>{{ initials }}</template></router-link>
        <button class="icon-button mobile-menu" type="button" :aria-label="menuOpen ? '收起导航' : '展开导航'" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><el-icon><component :is="menuOpen ? Close : Menu" /></el-icon><i v-if="updateBadge && !menuOpen" class="menu-dot" /></button>
      </div>
    </div>
    <transition name="drawer">
      <nav v-if="menuOpen" class="mobile-nav" aria-label="移动端期权导航">
        <div class="mobile-grid">
          <router-link v-for="item in menus" :key="item.path" :class="['mobile-item', { 'mobile-nav-active': currentPath === item.path }]" :to="item.path" @click="menuOpen = false"><span class="mobile-icon"><el-icon><component :is="item.icon" /></el-icon><em v-if="item.path === '/updates' && updateBadge" class="nav-badge">{{ updateBadge }}</em></span><span>{{ item.label }}</span></router-link>
        </div>
        <div class="mobile-account"><span class="account-avatar"><img v-if="avatarUrl" :src="avatarUrl" alt=""><template v-else>{{ initials }}</template></span><span class="mobile-account-copy"><strong>{{ userName }}</strong><small>{{ levelLabel || '工作台账户' }}</small></span><button type="button" class="mobile-logout" @click="handleLogout">退出登录</button></div>
      </nav>
    </transition>
    </header>
    <div v-if="menuOpen" class="mobile-mask" @click="menuOpen = false" />

    <aside class="side-rail" aria-label="快捷导航">
      <router-link v-for="item in menus" :key="item.path" :class="['rail-item', { active: currentPath === item.path }]" :to="item.path" :title="item.label"><span class="rail-icon"><el-icon><component :is="item.icon" /></el-icon><i v-if="item.path === '/updates' && updateBadge" class="rail-dot" /></span><span>{{ item.label }}</span></router-link>
      <router-link class="rail-account" to="/settings" title="账户设置"><img v-if="avatarUrl" :src="avatarUrl" alt=""><template v-else>{{ initials }}</template></router-link>
    </aside>

    <main class="option-main"><router-view /></main>

    <footer v-if="!hideChromeFooter" class="option-footer"><div class="footer-bottom"><span>© OSM.AI · 期权交易工作台</span><span>市场数据仅供参考</span></div></footer>

    <transition name="fab"><button v-if="showTop" class="fab" type="button" aria-label="回到顶部" title="回到顶部" @click="scrollTop"><el-icon><Top /></el-icon></button></transition>
  </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, Close, DataLine, Menu, Reading, Setting, Sunny, SwitchButton, Top, TrendCharts, Trophy, View, Wallet } from '@element-plus/icons-vue'
import { clearSession, getUser } from '@/utils/auth'
import { logout } from '@/api/auth'
import AccessBanner from '@/components/option/AccessBanner.vue'
import { accessState, resetAccess } from '@/utils/accessStore'
import { refreshUpdateProgress, updateState } from '@/utils/updateStore'
const router = useRouter()
const route = useRoute()
const currentPath = computed(() => route.path)
// 战绩 / 结算 / 学堂页按设计稿取消底部通栏文案（品牌行 + 免责声明）
const HIDE_FOOTER_PATHS = ['/scorecard', '/settlement', '/academy']
const hideChromeFooter = computed(() => HIDE_FOOTER_PATHS.includes(currentPath.value))
const menuOpen = ref(false)
// 主菜单（顺序与原导航一致）
const menus = [
  { path: '/today', label: '今日', icon: Sunny },
  { path: '/info', label: '信息', icon: DataLine },
  { path: '/active', label: '进行', icon: TrendCharts },
  { path: '/tracks', label: '跟踪', icon: View },
  { path: '/settlement', label: '结算', icon: Wallet },
  { path: '/scorecard', label: '战绩', icon: Trophy },
  { path: '/academy', label: '学堂', icon: Reading },
  { path: '/updates', label: '更新', icon: Bell },
  { path: '/settings', label: '设置', icon: Setting }
]
const user = ref(getUser())
const userName = computed(() => user.value.nickName || user.value.userName || '交易员')
const avatarUrl = computed(() => { const v = user.value.avatar; return v ? (/^(https?:)?\/\//.test(v) ? v : `${import.meta.env.VITE_API_BASE_URL || ''}${v}`) : '' })
// 当前身份（/api/member/access，由 AccessBanner 拉取）
const LEVEL_LABELS = { TRIAL: '完整体验', DELAYED: '盘后数据版', PAID: '会员', MEMBER: '会员', VIP: '会员' }
const levelLabel = computed(() => LEVEL_LABELS[accessState.access?.level] || '')
// 设置页保存昵称 / 头像后刷新页头
const onUserUpdated = () => { user.value = getUser() }
// 更新菜单未读数（W6）：进入页面、切换路由（节流 60 秒）、页面重新可见时刷新；在更新页由页面自己标记已读
const updateBadge = computed(() => (updateState.unseen > 0 && currentPath.value !== '/updates' ? (updateState.unseen > 99 ? '99+' : String(updateState.unseen)) : ''))
const onVisible = () => { if (document.visibilityState === 'visible') refreshUpdateProgress() }
watch(() => route.path, path => { menuOpen.value = false; if (path !== '/updates') refreshUpdateProgress() })
// 滚动状态：> 8px 导航转浅色毛玻璃；> 480px 显示回到顶部
const scrolled = ref(false)
const showTop = ref(false)
const onScroll = () => { const y = window.scrollY || document.documentElement.scrollTop; scrolled.value = y > 8; showTop.value = y > 480 }
const scrollTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
onMounted(() => { refreshUpdateProgress(); document.addEventListener('visibilitychange', onVisible); window.addEventListener('scroll', onScroll, { passive: true }); onScroll() })
onBeforeUnmount(() => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('scroll', onScroll) })
onMounted(() => window.addEventListener('option-user-updated', onUserUpdated))
onBeforeUnmount(() => window.removeEventListener('option-user-updated', onUserUpdated))
const initials = computed(() => userName.value.trim().slice(0, 1).toUpperCase())
async function handleLogout() { try { await logout() } catch {} finally { clearSession(); resetAccess(); router.replace('/login') } }
</script>
<style scoped>
/* ================= 公共布局 · 长桥风格（docs/longbridge-ui.md §4.1–4.4、§6） ================= */
.option-shell{
  --lb-text:#070a13;--lb-text-2:#4b5563;--lb-text-3:#6b7280;--lb-text-4:#a8aaad;
  --lb-accent:#00b8b8;--lb-accent-bright:#00f0c4;--lb-accent-soft:rgba(0,184,184,.1);
  --lb-bg:#f9fafb;--lb-bg-2:#f1f3f4;--lb-border:#e5e7eb;--lb-up:#e8467c;
  --lb-glass-light:rgba(255,255,255,.72);--lb-glass-dark:rgba(255,255,255,.08);--lb-blur:saturate(180%) blur(16px);
  --lb-nav-h:64px;--lb-ease:cubic-bezier(.2,.8,.2,1);
  min-height:100vh;display:flex;flex-direction:column;background:var(--lb-bg-2);color:var(--lb-text);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue","Microsoft YaHei",sans-serif
}

/* ---------- 顶部导航：深色 Hero 上为深色，滚动后转浅色毛玻璃 ---------- */
.option-header{position:sticky;top:0;z-index:30;height:var(--lb-nav-h);background:#05070d;border-bottom:1px solid rgba(255,255,255,.06);transition:background .2s var(--lb-ease),border-color .2s var(--lb-ease)}
.is-scrolled .option-header,.menu-open .option-header{background:var(--lb-glass-light);-webkit-backdrop-filter:var(--lb-blur);backdrop-filter:var(--lb-blur);border-bottom-color:var(--lb-border)}
@supports not (backdrop-filter:blur(1px)){.is-scrolled .option-header,.menu-open .option-header{background:rgba(255,255,255,.95)}}
.header-inner{max-width:1440px;height:var(--lb-nav-h);margin:0 auto;padding:0 32px;display:flex;align-items:center;gap:40px}
.brand{display:flex;align-items:center;gap:10px;flex:none;color:#fff;text-decoration:none;transition:color .2s}
.brand-mark{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:var(--lb-accent-bright);color:var(--lb-text);font-size:20px;font-weight:800;box-shadow:0 0 0 4px rgba(0,240,196,.16)}
.brand-copy{display:flex;flex-direction:column;gap:3px}
.brand-copy strong{font-size:18px;font-weight:800;line-height:1;letter-spacing:.3px}
.brand-copy strong span{color:var(--lb-accent-bright)}
.brand-copy small{color:rgba(255,255,255,.5);font-size:8px;font-weight:700;letter-spacing:1.4px}
.is-scrolled .option-header .brand,.menu-open .option-header .brand{color:var(--lb-text)}
.is-scrolled .option-header .brand-copy strong span,.menu-open .option-header .brand-copy strong span{color:var(--lb-accent)}
.is-scrolled .option-header .brand-copy small,.menu-open .option-header .brand-copy small{color:var(--lb-text-4)}

.main-nav{flex:1;height:100%;display:flex;align-items:center;gap:4px;min-width:0}
.nav-item{position:relative;height:40px;padding:0 14px;display:flex;align-items:center;gap:6px;border-radius:999px;color:rgba(255,255,255,.66);font-size:15px;font-weight:500;text-decoration:none;white-space:nowrap;transition:color .2s var(--lb-ease),background .2s var(--lb-ease)}
.nav-item:hover{color:#fff;background:var(--lb-glass-dark)}
.nav-item.active{color:#fff;font-weight:600}
.nav-item.active:after{content:"";position:absolute;left:50%;bottom:2px;width:18px;height:2px;border-radius:2px;background:var(--lb-accent-bright);transform:translateX(-50%)}
.is-scrolled .nav-item{color:var(--lb-text-2)}
.is-scrolled .nav-item:hover{color:var(--lb-text);background:rgba(7,10,19,.04)}
.is-scrolled .nav-item.active{color:var(--lb-text)}
.is-scrolled .nav-item.active:after{background:var(--lb-accent)}
.nav-badge{min-width:16px;height:16px;padding:0 5px;border-radius:999px;background:var(--lb-up);color:#fff;font-size:10px;font-style:normal;font-weight:700;line-height:16px;text-align:center}

.account-area{display:flex;align-items:center;gap:10px;flex:none;white-space:nowrap}
.level-pill{height:28px;padding:0 12px;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:var(--lb-glass-dark);color:rgba(255,255,255,.78);font-size:12px;font-weight:600}
.level-pill i{width:6px;height:6px;border-radius:50%;background:var(--lb-accent-bright)}
.is-scrolled .level-pill{border-color:transparent;background:var(--lb-accent-soft);color:#008a8a}
.is-scrolled .level-pill i{background:var(--lb-accent)}
.account-link{height:40px;padding:0 14px 0 4px;display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:var(--lb-glass-dark);color:#fff;font-size:14px;font-weight:500;text-decoration:none;transition:.2s var(--lb-ease)}
.account-link:hover{background:rgba(255,255,255,.14)}
.is-scrolled .account-link{border-color:var(--lb-border);background:#fff;color:var(--lb-text)}
.is-scrolled .account-link:hover{background:var(--lb-bg-2)}
.account-avatar{width:32px;height:32px;flex:none;overflow:hidden;display:grid;place-items:center;border-radius:50%;background:var(--lb-accent-bright);color:var(--lb-text);font-size:14px;font-weight:700}
.account-avatar img,.mobile-avatar img,.rail-account img{width:100%;height:100%;display:block;object-fit:cover}
.account-name{max-width:120px;overflow:hidden;text-overflow:ellipsis}
.icon-button{position:relative;width:40px;height:40px;flex:none;display:grid;place-items:center;padding:0;overflow:hidden;border:1px solid rgba(255,255,255,.14);border-radius:50%;background:var(--lb-glass-dark);color:#fff;font-size:17px;text-decoration:none;cursor:pointer;transition:background .2s var(--lb-ease),border-color .2s var(--lb-ease)}
.icon-button:hover{background:rgba(255,255,255,.16)}
.is-scrolled .icon-button,.menu-open .icon-button{border-color:var(--lb-border);background:#fff;color:var(--lb-text)}
.is-scrolled .icon-button:hover,.menu-open .icon-button:hover{background:var(--lb-bg-2)}
.mobile-actions,.mobile-nav,.mobile-mask{display:none}

/* ---------- 左侧竖向图标栏（≥1440 显示，避免压住内容） ---------- */
.side-rail{position:fixed;left:16px;top:50%;z-index:25;width:72px;padding:12px 0;display:none;flex-direction:column;align-items:center;gap:4px;border-radius:40px;background:var(--lb-glass-light);-webkit-backdrop-filter:var(--lb-blur);backdrop-filter:var(--lb-blur);box-shadow:0 1px 2px rgba(7,10,19,.06),0 16px 40px rgba(7,10,19,.12);transform:translateY(-50%)}
.rail-item{width:60px;padding:7px 0 6px;display:flex;flex-direction:column;align-items:center;gap:3px;border-radius:16px;color:var(--lb-text-2);font-size:11px;font-weight:500;text-decoration:none;transition:.2s var(--lb-ease)}
.rail-item:hover{background:rgba(7,10,19,.05);color:var(--lb-text)}
.rail-icon{position:relative;font-size:20px;line-height:1}
.rail-item.active{background:var(--lb-accent-soft);color:#008a8a;font-weight:600}
.rail-item.active .rail-icon{color:var(--lb-accent)}
.rail-dot{position:absolute;top:-2px;right:-4px;width:7px;height:7px;border-radius:50%;background:var(--lb-up);box-shadow:0 0 0 2px #fff}
.rail-account{width:40px;height:40px;margin-top:8px;overflow:hidden;display:grid;place-items:center;border-radius:50%;background:var(--lb-text);color:#fff;font-size:15px;font-weight:700;text-decoration:none}
@supports not (backdrop-filter:blur(1px)){.side-rail{background:rgba(255,255,255,.95)}}

/* ---------- 正文：保留原内边距（各页根元素用负 margin 抵消，实现通栏 Hero） ---------- */
.option-main{width:100%;max-width:1440px;margin:0 auto;padding:30px 34px 42px;flex:1}

/* ---------- 多列页脚 ---------- */
.option-footer{background:#fff;border-top:1px solid var(--lb-border)}
.footer-bottom{max-width:1248px;margin:0 auto;padding:18px 24px 24px;display:flex;justify-content:space-between;gap:16px;color:var(--lb-text-4);font-size:12px}

/* ---------- 右下角圆形悬浮按钮 ---------- */
.fab{position:fixed;right:24px;bottom:24px;z-index:28;width:48px;height:48px;display:grid;place-items:center;border:0;border-radius:50%;background:var(--lb-text);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 8px 24px rgba(7,10,19,.24);transition:transform .2s var(--lb-ease),background .2s}
.fab:hover{background:#1f2937;transform:translateY(-2px)}
.fab-enter-active,.fab-leave-active{transition:opacity .2s,transform .2s}
.fab-enter-from,.fab-leave-to{opacity:0;transform:translateY(8px)}

/* ---------- 响应式 ---------- */
@media(min-width:1440px){.side-rail{display:flex}}
@media(max-width:1279px){.header-inner{gap:24px;padding:0 24px}.main-nav{gap:0}.nav-item{padding:0 11px;font-size:14px}.level-pill{display:none}}
@media(max-width:1100px){.header-inner{gap:16px;padding:0 20px}.nav-item{padding:0 9px}.account-name{display:none}.account-link{padding:0 4px}.option-main{padding:24px 20px 36px}}
@media(max-width:960px){.brand-copy small{display:none}.nav-item{padding:0 7px;font-size:13px}}
@media(max-width:760px){
  .header-inner{padding:0 16px;justify-content:space-between}
  .brand-mark{width:34px;height:34px;font-size:18px}
  .main-nav,.account-area{display:none}
  .mobile-actions{display:flex;align-items:center;gap:8px}
  .mobile-avatar{font-size:14px;font-weight:700}
  .icon-button{width:44px;height:44px}
  .menu-dot{position:absolute;top:9px;right:9px;width:8px;height:8px;border-radius:50%;background:var(--lb-up);box-shadow:0 0 0 2px #05070d}
  .is-scrolled .menu-dot{box-shadow:0 0 0 2px #fff}
  .mobile-nav{position:absolute;left:0;right:0;top:var(--lb-nav-h);display:block;padding:16px;background:#fff;border-bottom:1px solid var(--lb-border);box-shadow:0 24px 48px rgba(7,10,19,.16);border-radius:0 0 24px 24px}
  .mobile-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .mobile-item{min-height:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border-radius:16px;background:var(--lb-bg);color:var(--lb-text-2);font-size:14px;font-weight:500;text-decoration:none}
  .mobile-icon{position:relative;font-size:22px;line-height:1}
  .mobile-icon .nav-badge{position:absolute;top:-8px;left:14px}
  .mobile-item.mobile-nav-active{background:var(--lb-text);color:#fff;font-weight:600}
  .mobile-item.mobile-nav-active .mobile-icon{color:var(--lb-accent-bright)}
  .mobile-account{display:flex;align-items:center;gap:12px;margin-top:12px;padding:12px;border-radius:16px;background:var(--lb-bg)}
  .mobile-account-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  .mobile-account-copy strong{color:var(--lb-text);font-size:15px}
  .mobile-account-copy small{color:var(--lb-text-3);font-size:12px}
  .mobile-logout{height:44px;padding:0 18px;border:1px solid var(--lb-border);border-radius:999px;background:#fff;color:var(--lb-text);font-size:14px;font-weight:600;cursor:pointer}
  .mobile-mask{position:fixed;inset:0;z-index:29;display:block;background:rgba(7,10,19,.4)}
  .option-main{padding:20px 14px 30px}
  .footer-bottom{padding:16px 16px 24px;flex-direction:column;gap:6px}
  .fab{right:16px;bottom:16px;width:44px;height:44px}
}
.drawer-enter-active,.drawer-leave-active{transition:opacity .2s var(--lb-ease),transform .2s var(--lb-ease)}
.drawer-enter-from,.drawer-leave-to{opacity:0;transform:translateY(-8px)}
@media(prefers-reduced-motion:reduce){.option-header,.nav-item,.fab,.drawer-enter-active,.drawer-leave-active,.fab-enter-active,.fab-leave-active{transition:none}}
</style>
