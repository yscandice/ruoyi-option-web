<template>
  <div class="metric-card"><div class="metric-label"><span class="metric-icon" :class="`icon-${tone}`"><slot /></span><span>{{ label }}</span><el-icon v-if="hint" class="hint"><InfoFilled /></el-icon></div><div class="metric-value" :class="`value-${tone}`">{{ value }}<small v-if="unit">{{ unit }}</small></div><div class="metric-foot">{{ foot }}</div></div>
</template>
<script setup>
import { InfoFilled } from '@element-plus/icons-vue'
defineProps({ label: String, value: { type: [String, Number], default: '—' }, unit: String, foot: { type: String, default: '今日概览' }, tone: { type: String, default: 'blue' }, hint: Boolean })
</script>
<style scoped>
.metric-card{background:#fff;border:1px solid #e9eff6;border-radius:13px;padding:17px 18px;min-width:0}.metric-label{display:flex;align-items:center;gap:8px;color:#7e8da2;font-size:12px}.metric-icon{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;font-size:14px}.icon-blue{background:#edf5ff;color:#3478c9}.icon-green{background:#eaf8f1;color:#279567}.icon-orange{background:#fff5e8;color:#c98125}.icon-red{background:#fff0ef;color:#d95e59}.hint{margin-left:auto;color:#b9c3d0}.metric-value{margin-top:13px;font-size:26px;font-weight:750;letter-spacing:-.7px;color:#1d3150;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.metric-value small{font-size:12px;margin-left:4px;font-weight:500;color:#8090a5;letter-spacing:0}.value-green{color:#21875b}.value-red{color:#d45750}.value-orange{color:#b87920}.metric-foot{margin-top:3px;color:#a0adbd;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>
