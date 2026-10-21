<template>
  <div class="option-shell">
    <header class="option-header"><div class="header-inner">
      <router-link class="brand" to="/today"><span class="brand-mark">O</span><span class="brand-copy"><strong>OSM<span>.AI</span></strong><small>OPTIONS INTELLIGENCE</small></span></router-link>
      <nav class="main-nav" aria-label="期权导航"><router-link :class="['nav-item', { active: currentPath === '/today' }]" to="/today"><span v-if="currentPath === '/today'" class="nav-dot"/>今日</router-link><router-link :class="['nav-item', { active: currentPath === '/info' }]" to="/info"><span v-if="currentPath === '/info'" class="nav-dot"/>信息</router-link><router-link :class="['nav-item', { active: currentPath === '/active' }]" to="/active"><span v-if="currentPath === '/active'" class="nav-dot"/>进行</router-link><router-link :class="['nav-item', { active: currentPath === '/tracks' }]" to="/tracks"><span v-if="currentPath === '/tracks'" class="nav-dot"/>跟踪</router-link><router-link :class="['nav-item', { active: currentPath === '/settlement' }]" to="/settlement"><span v-if="currentPath === '/settlement'" class="nav-dot"/>结算</router-link><router-link :class="['nav-item', { active: currentPath === '/scorecard' }]" to="/scorecard"><span v-if="currentPath === '/scorecard'" class="nav-dot"/>战绩</router-link><router-link :class="['nav-item', { active: currentPath === '/academy' }]" to="/academy"><span v-if="currentPath === '/academy'" class="nav-dot"/>学堂</router-link><router-link :class="['nav-item', { active: currentPath === '/updates' }]" to="/updates"><span v-if="currentPath === '/updates'" class="nav-dot"/>更新<em v-if="updateBadge" class="nav-badge" :title="`${updateState.unseen} 条未读更新`">{{ updateBadge }}</em></router-link><router-link :class="['nav-item', { active: currentPath === '/settings' }]" to="/settings"><span v-if="currentPath === '/settings'" class="nav-dot"/>设置</router-link></nav>
      <div class="account-area"><span class="account-avatar"><img v-if="avatarUrl" :src="avatarUrl" alt=""><template v-else>{{ initials }}</template></span><span class="account-name">{{ userName }}</span><el-button link class="logout-button" @click="handleLogout">退出</el-button></div>
      <button class="mobile-menu" type="button" aria-label="展开导航" @click="menuOpen = !menuOpen"><el-icon><Menu /></el-icon><i v-if="updateBadge" class="menu-dot" /></button>
    </div><nav v-if="menuOpen" class="mobile-nav" aria-label="移动端期权导航"><router-link :class="{ 'mobile-nav-active': currentPath === '/today' }" to="/today" @click="menuOpen = false">今日</router-link><router-link :class="{ 'mobile-nav-active': currentPath === '/info' }" to="/info" @click="menuOpen = false">信息</router-link><router-link :class="{ 'mobile-nav-active': currentPath === '/active' }" to="/active" @click="menuOpen = false">进行</router-link><router-link :class="{ 'mobile-nav-active': currentPath === '/tracks' }" to="/tracks" @click="menuOpen = false">跟踪</router-link><router-link :class="{ 'mobile-nav-active': currentPath === '/settlement' }" to="/settlement" @click="menuOpen = false">结算</router-link><router-link :class="{ 'mobile-nav-active': currentPath === '/scorecard' }" to="/scorecard" @click="menuOpen = false">战绩</router-link><router-link :class="{ 'mobile-nav-active': currentPath === '/academy' }" to="/academy" @click="menuOpen = false">学堂</router-link><router-link :class="{ 'mobile-nav-active': currentPath === '/updates' }" to="/updates" @click="menuOpen = false">更新<em v-if="updateBadge" class="nav-badge">{{ updateBadge }}</em></router-link><router-link :class="{ 'mobile-nav-active': currentPath === '/settings' }" to="/settings" @click="menuOpen = false">设置</router-link></nav></header>
    <AccessBanner />
    <main class="option-main"><router-view /></main>
    <footer class="option-footer"><span>OSM.AI · 期权交易工作台</span><span>市场数据仅供参考</span></footer>
  </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu } from '@element-plus/icons-vue'
import { clearSession, getUser } from '@/utils/auth'
import { logout } from '@/api/auth'
import AccessBanner from '@/components/option/AccessBanner.vue'
import { resetAccess } from '@/utils/accessStore'
import { refreshUpdateProgress, updateState } from '@/utils/updateStore'
const router = useRouter()
const route = useRoute()
const currentPath = computed(() => route.path)
const menuOpen = ref(false)
const comingSoon = []
const user = ref(getUser())
const userName = computed(() => user.value.nickName || user.value.userName || '交易员')
const avatarUrl = computed(() => { const v = user.value.avatar; return v ? (/^(https?:)?\/\//.test(v) ? v : `${import.meta.env.VITE_API_BASE_URL || ''}${v}`) : '' })
// 设置页保存昵称 / 头像后刷新页头
const onUserUpdated = () => { user.value = getUser() }
// 更新菜单未读数（W6）：进入页面、切换路由（节流 60 秒）、页面重新可见时刷新；在更新页由页面自己标记已读
const updateBadge = computed(() => (updateState.unseen > 0 && currentPath.value !== '/updates' ? (updateState.unseen > 99 ? '99+' : String(updateState.unseen)) : ''))
const onVisible = () => { if (document.visibilityState === 'visible') refreshUpdateProgress() }
watch(() => route.path, path => { if (path !== '/updates') refreshUpdateProgress() })
onMounted(() => { refreshUpdateProgress(); document.addEventListener('visibilitychange', onVisible) })
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible))
onMounted(() => window.addEventListener('option-user-updated', onUserUpdated))
onBeforeUnmount(() => window.removeEventListener('option-user-updated', onUserUpdated))
const initials = computed(() => userName.value.trim().slice(0, 1).toUpperCase())
async function handleLogout() { try { await logout() } catch {} finally { clearSession(); resetAccess(); router.replace('/login') } }
</script>
<style scoped>
.option-shell{min-height:100vh;background:#f3f7fc;color:#1c2d47;display:flex;flex-direction:column}.option-header{height:76px;background:#fff;border-bottom:1px solid #e8eef6;position:sticky;top:0;z-index:20}.header-inner{max-width:1440px;height:100%;padding:0 34px;margin:auto;display:flex;align-items:center;gap:48px}.brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:#102c54;flex:none}.brand-mark{width:38px;height:38px;border-radius:12px;background:linear-gradient(145deg,#2878dc,#1556b2);color:#fff;display:grid;place-items:center;font-size:24px;font-weight:800;box-shadow:0 5px 12px #1b64bd33}.brand-copy{display:flex;flex-direction:column;gap:2px}.brand-copy strong{font-size:18px;letter-spacing:.4px;line-height:1}.brand-copy strong span{color:#3984dc}.brand-copy small{font-size:8px;color:#91a0b5;letter-spacing:1.25px;font-weight:700}.main-nav{height:100%;display:flex;align-items:center;gap:7px;flex:1}.nav-item{height:40px;padding:0 14px;border-radius:9px;display:flex;align-items:center;gap:8px;color:#71819a;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap}.nav-item.active{background:#edf5ff;color:#246bc2}.nav-dot{width:6px;height:6px;background:#3984df;border-radius:50%}.nav-disabled{cursor:default;color:#a6b0bf}.account-area{display:flex;align-items:center;gap:9px;color:#40516b;font-size:12px;white-space:nowrap}.account-avatar{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;color:#2365b7;background:#e7f1ff;font-weight:700}.logout-button{font-size:11px;color:#8998aa}.mobile-menu,.mobile-nav{display:none}.option-main{width:100%;max-width:1440px;margin:0 auto;padding:30px 34px 42px;flex:1}.option-footer{max-width:1440px;width:100%;margin:0 auto;padding:0 34px 20px;color:#a3afbf;display:flex;justify-content:space-between;font-size:11px}@media(max-width:1100px){.header-inner{gap:22px;padding:0 20px}.main-nav{gap:0}.nav-item{padding:0 9px}.option-main{padding:24px 20px 36px}.option-footer{padding:0 20px 18px}}@media(max-width:760px){.option-header{height:auto;min-height:64px}.header-inner{height:64px;padding:0 16px;justify-content:space-between}.brand-mark{width:34px;height:34px}.main-nav,.account-area{display:none}.mobile-menu{border:0;background:#f0f5fb;color:#426080;width:36px;height:36px;border-radius:9px;display:grid;place-items:center;font-size:18px}.mobile-nav{padding:8px 16px 14px;display:flex;gap:8px;overflow:auto;border-top:1px solid #f0f3f8}.mobile-nav span,.mobile-nav a{padding:8px 11px;border-radius:8px;white-space:nowrap;text-decoration:none;color:#8a98aa;font-size:13px}.mobile-nav .mobile-nav-active{background:#edf5ff;color:#246bc2;font-weight:700}.option-main{padding:20px 14px 30px}.option-footer{padding:0 16px 16px;font-size:10px}}
.account-avatar{overflow:hidden}.account-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.nav-badge{min-width:16px;height:16px;margin-left:-3px;padding:0 4px;border-radius:999px;background:#e5534b;color:#fff;font-size:9px;font-style:normal;font-weight:700;line-height:16px;text-align:center;box-shadow:0 0 0 2px #fff}.mobile-nav .nav-badge{margin-left:6px;box-shadow:none}.mobile-menu{position:relative}.menu-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#e5534b;box-shadow:0 0 0 2px #fff}
</style>
