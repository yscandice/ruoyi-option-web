import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'Login', component: () => import('@/views/login/index.vue'), meta: { public: true } },
    { path: '/register', name: 'Register', component: () => import('@/views/register/index.vue'), meta: { public: true, title: '注册' } },
    { path: '/', redirect: '/today' },
    { path: '/today', name: 'Today', component: () => import('@/layout/OptionLayout.vue'), children: [
      { path: '', component: () => import('@/views/today/index.vue'), meta: { title: '今日信号' } }
    ] },
    { path: '/info', name: 'Info', component: () => import('@/layout/OptionLayout.vue'), children: [
      { path: '', component: () => import('@/views/info/index.vue'), meta: { title: '信息中心' } }
    ] },
    { path: '/active', name: 'Active', component: () => import('@/layout/OptionLayout.vue'), children: [
      { path: '', component: () => import('@/views/active/index.vue'), meta: { title: '进行中的交易' } }
    ] },
    { path: '/tracks', name: 'Tracks', component: () => import('@/layout/OptionLayout.vue'), children: [
      { path: '', component: () => import('@/views/tracks/index.vue'), meta: { title: '跟踪列表' } }
    ] },
    { path: '/settlement', name: 'Settlement', component: () => import('@/layout/OptionLayout.vue'), children: [
      { path: '', component: () => import('@/views/settlement/index.vue'), meta: { title: '结算记录' } }
    ] },
    { path: '/scorecard', name: 'Scorecard', component: () => import('@/layout/OptionLayout.vue'), children: [
      { path: '', component: () => import('@/views/scorecard/index.vue'), meta: { title: '交易战绩' } }
    ] },
    { path: '/academy', name: 'Academy', component: () => import('@/layout/OptionLayout.vue'), children: [
      { path: '', component: () => import('@/views/academy/index.vue'), meta: { title: '新人学堂' } }
    ] },
    { path: '/updates', name: 'Updates', component: () => import('@/layout/OptionLayout.vue'), children: [
      { path: '', component: () => import('@/views/updates/index.vue'), meta: { title: '功能更新' } }
    ] },
    { path: '/settings', name: 'Settings', component: () => import('@/layout/OptionLayout.vue'), children: [
      { path: '', component: () => import('@/views/settings/index.vue'), meta: { title: '账户设置' } }
    ] },
    { path: '/:pathMatch(.*)*', redirect: '/today' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(to => {
  if (to.meta.public) {
    if (getToken()) return '/today'
    return true
  }
  if (!getToken()) return { path: '/login', query: { redirect: to.fullPath } }
  return true
})

export default router
