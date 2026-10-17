<template>
  <span class="status-tag" :class="`tone-${tone}`"><i v-if="dot" />{{ label }}</span>
</template>
<script setup>
defineProps({ label: { type: String, default: '—' }, tone: { type: String, default: 'neutral' }, dot: { type: Boolean, default: false } })
</script>
<style scoped>
.status-tag{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 9px;font-size:11px;line-height:1;font-weight:700;white-space:nowrap}.status-tag i{width:6px;height:6px;border-radius:50%;background:currentColor}.tone-blue{background:#edf5ff;color:#3174c5}.tone-green{background:#eaf8f1;color:#269364}.tone-red{background:#fff0ef;color:#d95d58}.tone-orange{background:#fff5e8;color:#c98224}.tone-neutral{background:#f1f4f8;color:#7b899d}
</style>
