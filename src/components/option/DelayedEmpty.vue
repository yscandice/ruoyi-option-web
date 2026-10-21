<template>
  <section class="delayed-empty" role="status">
    <span class="delayed-empty-icon"><el-icon><Clock /></el-icon></span>
    <strong>{{ headline }}</strong>
    <p>{{ next ? '时间为北京时间，' : '' }}放出后此页会显示最新的盘后数据。当前为盘后数据版，每个交易日收盘后放出前一交易日的数据。</p>
    <span v-if="info.stale" class="delayed-empty-stale">数据同步延迟，可能不是最新</span>
  </section>
</template>
<script setup>
import { computed } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { useDataView } from '@/utils/accessStore'
import { bjMonthDayTime } from '@/utils/beijing'

// 盘后版“尚未放出”空状态（W4）：替代“暂无数据”
const props = defineProps({ resource: { type: String, required: true } })
const info = useDataView(props.resource)
const next = computed(() => bjMonthDayTime(info.value.nextReleaseAt))
const headline = computed(() => `盘后数据尚未放出${next.value ? `，预计 ${next.value} 更新` : ''}`)
</script>
<style scoped>
.delayed-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:260px;margin-bottom:16px;padding:32px 20px;border:1px dashed #f0dcbc;border-radius:16px;background:#fffcf7;text-align:center;color:#9a6a2c}.delayed-empty-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#fdecd3;color:#c0812f;font-size:19px}.delayed-empty strong{color:#7c5218;font-size:15px}.delayed-empty p{max-width:420px;margin:0;color:#a88a62;font-size:12px;line-height:1.7}.delayed-empty-stale{padding:3px 9px;border-radius:999px;background:#fff0ea;color:#c8613f;font-size:11px;font-weight:700}
@media(max-width:620px){.delayed-empty{min-height:210px;padding:26px 16px}.delayed-empty strong{font-size:14px}}
</style>
