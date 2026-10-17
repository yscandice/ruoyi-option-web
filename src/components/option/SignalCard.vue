<template>
  <article class="signal-card">
    <div class="card-top">
      <div class="symbol-wrap"><span class="symbol-icon">{{ symbol.slice(0, 1) }}</span><div><strong>{{ symbol }}</strong><small>{{ title }}</small></div></div>
      <StatusTag :label="status" :tone="tone" />
    </div>
    <p v-if="description" class="description">{{ description }}</p>
    <div class="card-bottom"><span>{{ meta || '今日信号' }}</span><strong v-if="price">{{ price }}</strong><span v-else class="arrow">查看信号 <el-icon><ArrowRight /></el-icon></span></div>
  </article>
</template>
<script setup>
import { ArrowRight } from '@element-plus/icons-vue'
import StatusTag from './StatusTag.vue'
defineProps({ symbol: { type: String, default: '—' }, title: { type: String, default: '信号详情' }, status: { type: String, default: '待关注' }, tone: { type: String, default: 'blue' }, description: { type: String, default: '' }, meta: { type: String, default: '' }, price: { type: String, default: '' } })
</script>
<style scoped>
.signal-card{padding:17px 18px 14px;border:1px solid #e9eff6;border-radius:13px;background:#fff;transition:box-shadow .2s,border-color .2s}.signal-card:hover{border-color:#d7e7fa;box-shadow:0 8px 20px #173d6710}.card-top,.symbol-wrap,.card-bottom{display:flex;align-items:center;justify-content:space-between}.symbol-wrap{justify-content:flex-start;gap:10px;min-width:0}.symbol-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#eef5fd;color:#3175c4;font-weight:800}.symbol-wrap div{display:flex;flex-direction:column;gap:3px;min-width:0}.symbol-wrap strong{color:#1c2d47;font-size:14px}.symbol-wrap small{color:#98a5b5;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}.description{margin:14px 0;color:#64748b;font-size:12px;line-height:1.65;min-height:20px}.card-bottom{border-top:1px solid #f0f3f7;padding-top:11px;color:#98a5b5;font-size:11px}.card-bottom strong{font-size:13px;color:#233956}.arrow{color:#3479cb;display:flex;gap:3px;align-items:center}
</style>
