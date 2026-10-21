<template>
  <span v-if="info.delayed" :class="['data-view-tag', { stale: info.stale }]" :title="title"><i />{{ label }}<em v-if="info.stale">同步延迟</em></span>
</template>
<script setup>
import { computed } from 'vue'
import { useDataView } from '@/utils/accessStore'
import { bjMonthDayTime, tradeMonthDay } from '@/utils/beijing'

// 菜单标题旁的“盘后数据 · MM/DD”标签（W4）；实时数据不显示
const props = defineProps({ resource: { type: String, required: true } })
const info = useDataView(props.resource)
const label = computed(() => {
  if (info.value.empty) return '盘后数据 · 尚未放出'
  const day = tradeMonthDay(info.value.tradeDate)
  return day ? `盘后数据 · ${day}` : '盘后数据'
})
const title = computed(() => {
  const next = bjMonthDayTime(info.value.nextReleaseAt)
  return `当前为盘后数据，不是实时数据${next ? `；下次更新 ${next}（北京时间）` : ''}${info.value.stale ? '；数据同步延迟，可能不是最新' : ''}`
})
</script>
<style scoped>
.data-view-tag{display:inline-flex;align-items:center;gap:6px;margin-left:10px;padding:4px 9px;border-radius:999px;border:1px solid #f0dcbc;background:#fff8ee;color:#a06a25;font-size:11px;line-height:1;font-weight:700;letter-spacing:0;white-space:nowrap;vertical-align:middle}.data-view-tag i{width:6px;height:6px;border-radius:50%;background:#e09a3e}.data-view-tag em{font-style:normal;padding-left:6px;border-left:1px solid #efd5ae;color:#c8613f}
</style>
