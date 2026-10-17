<template>
  <div class="settings-page">
    <section class="page-heading">
      <div>
        <span class="eyebrow"><i /> ACCOUNT &amp; PREFERENCES</span>
        <h1>设置</h1>
        <p>管理个人资料、通知偏好和工作台显示方式。</p>
      </div>
      <span class="demo-chip"><el-icon><InfoFilled /></el-icon> 本地演示设置</span>
    </section>

    <div class="settings-layout">
      <aside class="settings-sidebar panel">
        <div class="sidebar-title"><span class="sidebar-icon"><el-icon><Setting /></el-icon></span><div><strong>设置中心</strong><small>账户与工作台偏好</small></div></div>
        <nav aria-label="设置分类">
          <button v-for="section in sections" :key="section.id" :class="['section-link', { active: activeSection === section.id }]" @click="goToSection(section.id)">
            <el-icon><component :is="section.icon" /></el-icon><span>{{ section.label }}</span><el-icon class="section-arrow"><ArrowRight /></el-icon>
          </button>
        </nav>
        <div class="sidebar-hint"><el-icon><InfoFilled /></el-icon><span>此页面的修改保存在当前浏览器，不会同步到账户服务。</span></div>
      </aside>

      <main class="settings-content">
        <section id="profile" class="settings-card panel">
          <div class="card-heading"><div><span class="section-kicker">YOUR PROFILE</span><h2>个人资料</h2><p>设置在工作台中显示的名称与个人简介。</p></div><span class="heading-icon blue"><el-icon><User /></el-icon></span></div>
          <div class="profile-summary"><div class="profile-avatar">{{ avatarInitial }}</div><div class="profile-summary-copy"><strong>{{ profile.name || '交易员' }}</strong><span>工作台账户</span></div><span class="local-badge"><i /> 本地资料</span></div>
          <div class="form-grid">
            <label class="form-field"><span>显示名称</span><el-input v-model="profile.name" maxlength="24" placeholder="请输入显示名称" /></label>
            <label class="form-field"><span>个人简介 <small>选填</small></span><el-input v-model="profile.bio" maxlength="60" placeholder="用一句话介绍自己" /></label>
          </div>
          <div class="card-actions"><span class="save-hint">修改只保存在此浏览器</span><el-button type="primary" @click="saveProfile"><el-icon><Check /></el-icon>保存资料</el-button></div>
        </section>

        <section id="notifications" class="settings-card panel">
          <div class="card-heading"><div><span class="section-kicker">NOTIFICATIONS</span><h2>通知偏好</h2><p>选择你希望在工作台中关注的提醒类型。</p></div><span class="heading-icon violet"><el-icon><Bell /></el-icon></span></div>
          <div class="preference-list">
            <div v-for="item in notificationItems" :key="item.key" class="preference-row"><span class="preference-symbol" :class="item.tone"><el-icon><component :is="item.icon" /></el-icon></span><div class="preference-copy"><strong>{{ item.title }}</strong><small>{{ item.description }}</small></div><el-switch v-model="preferences.notifications[item.key]" :aria-label="item.title" /></div>
          </div>
        </section>

        <section id="display" class="settings-card panel">
          <div class="card-heading"><div><span class="section-kicker">WORKSPACE DISPLAY</span><h2>工作台显示</h2><p>调整日期、时区和内容密度的显示偏好。</p></div><span class="heading-icon cyan"><el-icon><Monitor /></el-icon></span></div>
          <div class="display-grid">
            <label class="form-field"><span>交易日时区</span><el-select v-model="preferences.timezone" aria-label="交易日时区"><el-option label="美国东部时间（ET）" value="ET"/><el-option label="北京时间（UTC+8）" value="Asia/Shanghai"/><el-option label="协调世界时（UTC）" value="UTC"/></el-select><small>日期分组将使用所选时区显示。</small></label>
            <label class="form-field"><span>界面语言</span><el-select v-model="preferences.language" aria-label="界面语言"><el-option label="简体中文" value="zh-CN"/><el-option label="English" value="en-US"/></el-select><small>部分演示页面目前仅提供中文。</small></label>
          </div>
          <div class="preference-row compact-row"><span class="preference-symbol blue"><el-icon><Monitor /></el-icon></span><div class="preference-copy"><strong>紧凑信息卡片</strong><small>减少卡片间距，在同一屏幕中查看更多内容。</small></div><el-switch v-model="preferences.compactCards" aria-label="紧凑信息卡片" /></div>
        </section>

        <section id="security" class="settings-card panel">
          <div class="card-heading"><div><span class="section-kicker">ACCOUNT SECURITY</span><h2>账户安全</h2><p>查看账户保护方式与会话信息。</p></div><span class="heading-icon orange"><el-icon><Lock /></el-icon></span></div>
          <div class="security-row"><span class="security-symbol"><el-icon><Message /></el-icon></span><div class="security-copy"><strong>登录账户</strong><small>当前浏览器已登录</small></div><span class="security-status"><el-icon><CircleCheck /></el-icon> 已验证</span></div>
          <div class="security-row"><span class="security-symbol"><el-icon><Lock /></el-icon></span><div class="security-copy"><strong>登录密码</strong><small>••••••••••••</small></div><el-button plain @click="showSecurityNotice('密码修改')">修改密码 <el-icon><ArrowRight /></el-icon></el-button></div>
          <div class="security-row"><span class="security-symbol"><el-icon><Monitor /></el-icon></span><div class="security-copy"><strong>当前会话</strong><small>此浏览器 · 当前设备</small></div><span class="current-session"><i /> 正在使用</span></div>
        </section>

        <div class="save-bar panel"><span><el-icon><InfoFilled /></el-icon>通知和显示偏好仅保存在当前浏览器中。</span><el-button type="primary" @click="savePreferences"><el-icon><Check /></el-icon>保存偏好</el-button></div>
      </main>
    </div>

    <el-dialog v-model="noticeVisible" :title="noticeTitle" width="min(420px, calc(100vw - 32px))">
      <div class="notice-content"><span class="notice-icon"><el-icon><InfoFilled /></el-icon></span><p>当前页面是前端静态演示，没有连接账户服务。此操作暂不可用。</p></div>
      <template #footer><el-button type="primary" @click="noticeVisible = false">知道了</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRight, Bell, Check, CircleCheck, InfoFilled, Lock, Message, Monitor, Setting, User } from '@element-plus/icons-vue'
import { getUser, setUser } from '@/utils/auth'

const user = getUser()
const profile = reactive({ name: user.nickName || '交易员', bio: user.profile || '' })
const preferences = reactive({
  notifications: { signals: true, management: true, product: false },
  timezone: 'ET',
  language: 'zh-CN',
  compactCards: false
})
const sections = [
  { id: 'profile', label: '个人资料', icon: User },
  { id: 'notifications', label: '通知偏好', icon: Bell },
  { id: 'display', label: '工作台显示', icon: Monitor },
  { id: 'security', label: '账户安全', icon: Lock }
]
const notificationItems = [
  { key: 'signals', title: '新信号提醒', description: '工作台出现新的期权信号时提醒我。', icon: CircleCheck, tone: 'blue' },
  { key: 'management', title: '管理与风险提醒', description: '保护、止盈或止损相关信息更新时提醒我。', icon: Bell, tone: 'orange' },
  { key: 'product', title: '产品功能更新', description: '收到工作台新功能和体验优化的消息。', icon: InfoFilled, tone: 'violet' }
]
const activeSection = ref('profile')
const noticeVisible = ref(false)
const noticeTitle = ref('')
const avatarInitial = computed(() => (profile.name || '交').trim().slice(0, 1).toUpperCase())

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('option-web-settings') || '{}')
    if (saved.notifications) Object.assign(preferences.notifications, saved.notifications)
    if (saved.timezone) preferences.timezone = saved.timezone
    if (saved.language) preferences.language = saved.language
    if (typeof saved.compactCards === 'boolean') preferences.compactCards = saved.compactCards
  } catch {}
})

function goToSection(id) {
  activeSection.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function saveProfile() {
  setUser({ ...getUser(), nickName: profile.name.trim() || '交易员', profile: profile.bio.trim() })
  ElMessage.success('资料已保存在当前浏览器')
}
function savePreferences() {
  localStorage.setItem('option-web-settings', JSON.stringify(preferences))
  ElMessage.success('偏好已保存在当前浏览器')
}
function showSecurityNotice(title) {
  noticeTitle.value = title
  noticeVisible.value = true
}
</script>

<style scoped>
.settings-page{--ink:#1d3150;--muted:#7d8da4;--line:#e8eef6;color:var(--ink)}
.panel{background:#fff;border:1px solid var(--line);border-radius:15px;box-shadow:0 8px 28px rgba(30,67,112,.035)}
.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:0 0 20px}.eyebrow,.section-kicker{display:flex;align-items:center;gap:8px;color:#6e8caf;font-size:10px;font-weight:800;letter-spacing:1.2px}.eyebrow i{width:7px;height:7px;border-radius:50%;background:#59b697;box-shadow:0 0 0 4px #e9f7f2}.page-heading h1{margin:9px 0 5px;color:#172f53;font-size:28px;letter-spacing:-.5px}.page-heading p{margin:0;color:#8391a6;font-size:13px}.demo-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid #e4edf7;border-radius:18px;background:#fff;color:#8798ad;font-size:10px;white-space:nowrap}
.settings-layout{display:grid;grid-template-columns:230px minmax(0,1fr);align-items:start;gap:18px}.settings-sidebar{position:sticky;top:94px;padding:17px 12px}.sidebar-title{display:flex;align-items:center;gap:10px;padding:2px 5px 16px;border-bottom:1px solid #eff2f7}.sidebar-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#eff6ff;color:#4181ca;font-size:16px}.sidebar-title strong,.sidebar-title small{display:block}.sidebar-title strong{color:#344c6c;font-size:12px}.sidebar-title small{margin-top:4px;color:#98a6b7;font-size:9px}.settings-sidebar nav{display:grid;gap:4px;padding-top:11px}.section-link{width:100%;height:39px;padding:0 10px;display:flex;align-items:center;gap:9px;border:0;border-radius:8px;background:transparent;color:#71839b;text-align:left;font-size:11px;cursor:pointer;transition:.15s}.section-link:hover{background:#f5f8fc;color:#376fae}.section-link.active{background:#edf5ff;color:#2d72c4;font-weight:700}.section-link .el-icon{font-size:14px}.section-link .section-arrow{margin-left:auto;font-size:12px;opacity:.65}.sidebar-hint{display:flex;align-items:flex-start;gap:7px;margin:18px 2px 0;padding:10px 9px;border-radius:8px;background:#f5f8fc;color:#8798ad;font-size:9px;line-height:1.65}.sidebar-hint .el-icon{margin-top:1px;flex:none;color:#76a0cc}
.settings-content{display:grid;gap:14px}.settings-card{padding:19px 21px;scroll-margin-top:94px}.card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding-bottom:15px;border-bottom:1px solid #eef2f7}.section-kicker{font-size:9px;color:#8ca2bc}.card-heading h2{margin:6px 0 4px;color:#294465;font-size:16px}.card-heading p{margin:0;color:#8b9aaf;font-size:10px}.heading-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;font-size:15px;flex:none}.heading-icon.blue{background:#edf5ff;color:#4787d0}.heading-icon.violet{background:#f2efff;color:#8a79ca}.heading-icon.cyan{background:#eaf8fa;color:#48a1ae}.heading-icon.orange{background:#fff5e9;color:#ce9650}.profile-summary{display:flex;align-items:center;gap:11px;padding:15px 0 14px}.profile-avatar{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(145deg,#70a6e8,#3e78c1);color:#fff;font-size:17px;font-weight:700;box-shadow:0 5px 12px #3270b42a}.profile-summary-copy strong,.profile-summary-copy span{display:block}.profile-summary-copy strong{color:#3d5574;font-size:12px}.profile-summary-copy span{margin-top:4px;color:#96a4b5;font-size:9px}.local-badge{display:inline-flex;align-items:center;gap:5px;margin-left:auto;padding:5px 8px;border-radius:6px;background:#f3f8fd;color:#859bb3;font-size:9px}.local-badge i{width:5px;height:5px;border-radius:50%;background:#6db59a}.form-grid,.display-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.form-field{display:flex;flex-direction:column;gap:7px;color:#667b96;font-size:10px;font-weight:600}.form-field>span{display:flex;gap:5px;align-items:center}.form-field small{font-size:9px;color:#a0acbb;font-weight:400}.form-field :deep(.el-input__wrapper),.form-field :deep(.el-select__wrapper){min-height:36px;border-radius:8px;box-shadow:0 0 0 1px #e6edf5 inset;background:#fbfcfe}.form-field :deep(.el-input__inner){font-size:11px;color:#3d5573}.form-field :deep(.el-select){width:100%}.card-actions{display:flex;align-items:center;justify-content:flex-end;gap:15px;margin-top:15px}.save-hint{margin-right:auto;color:#a0acbb;font-size:9px}.card-actions :deep(.el-button),.save-bar :deep(.el-button){height:32px;padding:0 13px;border-radius:8px;font-size:10px}.card-actions :deep(.el-button .el-icon),.save-bar :deep(.el-button .el-icon){margin-right:5px}
.preference-list{padding-top:3px}.preference-row{min-height:59px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #f0f3f7}.preference-row:last-child{border-bottom:0}.preference-symbol,.security-symbol{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;flex:none;font-size:13px}.preference-symbol.blue{background:#eef5ff;color:#4b88cf}.preference-symbol.orange{background:#fff5ea;color:#ce9651}.preference-symbol.violet{background:#f3f0ff;color:#8978c7}.preference-copy,.security-copy{min-width:0;flex:1}.preference-copy strong,.security-copy strong{display:block;color:#435a78;font-size:10px;font-weight:650}.preference-copy small,.security-copy small{display:block;margin-top:4px;color:#94a2b4;font-size:9px;line-height:1.5}.preference-row :deep(.el-switch){--el-switch-on-color:#4b88d0;--el-switch-off-color:#d8e0ea}.display-grid{padding:15px 0}.display-grid .form-field small{line-height:1.4}.compact-row{border-top:1px solid #f0f3f7;padding-top:2px}.compact-row .preference-symbol{background:#eef5ff;color:#4b88cf}.security-row{min-height:58px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #f0f3f7}.security-row:last-child{border-bottom:0}.security-symbol{background:#f2f6fb;color:#7792b2}.security-status,.current-session{display:inline-flex;align-items:center;gap:5px;color:#55a184;font-size:9px;white-space:nowrap}.security-row :deep(.el-button){height:28px;padding:0 9px;border-color:#e2eaf3;border-radius:7px;color:#6883a2;font-size:9px}.security-row :deep(.el-button .el-icon){margin-left:5px}.current-session i{width:6px;height:6px;border-radius:50%;background:#56b28d;box-shadow:0 0 0 3px #e7f6ef}.save-bar{position:sticky;bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 13px;border-color:#deebf8;box-shadow:0 8px 24px #214c7c12}.save-bar>span{display:flex;align-items:center;gap:7px;color:#8495aa;font-size:9px}.save-bar>span .el-icon{color:#6e99c6}.notice-content{display:flex;align-items:flex-start;gap:12px}.notice-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#eff6ff;color:#5588c0;flex:none}.notice-content p{margin:2px 0;color:#657991;font-size:12px;line-height:1.75}
@media(max-width:900px){.settings-layout{grid-template-columns:190px minmax(0,1fr);gap:12px}.settings-sidebar{padding:14px 9px}.settings-card{padding:17px}.save-bar{bottom:8px}}
@media(max-width:680px){.page-heading{align-items:flex-start}.page-heading h1{font-size:25px}.page-heading p{max-width:250px;line-height:1.6}.demo-chip{padding:6px 8px;font-size:9px}.settings-layout{display:flex;flex-direction:column;gap:12px}.settings-sidebar{position:static;width:100%;padding:10px}.sidebar-title{padding:2px 4px 10px}.sidebar-icon{width:30px;height:30px}.settings-sidebar nav{display:flex;gap:6px;overflow:auto;padding-top:9px}.section-link{width:auto;min-width:max-content;height:33px;padding:0 9px;gap:6px;font-size:9px}.section-link .section-arrow,.sidebar-hint{display:none}.settings-content{width:100%;gap:11px}.settings-card{padding:15px 13px;scroll-margin-top:12px}.card-heading{padding-bottom:12px}.card-heading h2{font-size:15px}.card-heading p{max-width:250px;font-size:9px;line-height:1.5}.heading-icon{width:31px;height:31px}.form-grid,.display-grid{grid-template-columns:1fr;gap:11px}.profile-summary{padding:12px 0}.profile-avatar{width:38px;height:38px}.preference-row{min-height:56px;gap:8px}.preference-copy small{max-width:230px}.security-row{gap:8px}.security-row :deep(.el-button){padding:0 7px}.save-bar{position:static}.save-bar>span{line-height:1.5}.save-bar :deep(.el-button){flex:none}}
</style>
