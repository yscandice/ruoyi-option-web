<template>
  <article :class="['sig', card.color, { buyer: card.kind === 'buyer' }]">
    <div class="sig-hd">
      <div class="sig-r1">
        <span class="sig-sym">{{ card.symbol }}</span>
        <span class="sig-name">{{ [card.group, card.name].filter(Boolean).join(' · ') }}</span>
        <span v-if="card.tier" :class="['tg', card.tierClass]">{{ card.tier }}</span>
        <span class="sig-time num">{{ card.time }}</span>
      </div>
      <div class="sig-r2">
        <div class="sig-leg num">{{ card.leg || '—' }}<span v-if="card.expiry"> · {{ card.expiry }}</span></div>
        <div class="sig-prem"><small>{{ card.premLabel }}</small><b class="num">{{ card.prem }}</b></div>
      </div>
    </div>
    <div v-if="card.origin" class="floor good origin"><i />{{ card.origin }}</div>
    <div v-if="card.metrics.length" class="sig-m">
      <div v-for="[label, value] in card.metrics" :key="label"><small>{{ label }}</small><b class="num" :title="value">{{ value }}</b></div>
    </div>
    <div v-if="card.floor" :class="['floor', card.floor.good ? 'good' : 'bad']"><i /><span class="fl-t num">{{ card.floor.text }}</span><b>{{ card.floor.verdict }}</b></div>
    <div v-else-if="card.pnl" class="floor pnl-line"><span>浮动盈亏</span><b :class="card.pnl.tone">{{ card.pnl.text }}</b></div>
    <p v-if="card.why" class="sig-why">{{ card.why }}</p>
    <ol v-if="card.steps" class="steps">
      <li v-for="(label, i) in STEPS" :key="label" :class="{ done: card.steps.done[i] && i !== card.steps.cur, cur: i === card.steps.cur }">{{ label }}</li>
    </ol>
    <div class="sig-ft"><span class="wm">OSM<b>TRADE</b>.COM</span><button class="btn btn-line btn-sm" type="button" @click="$emit('share', card)">分享</button></div>
  </article>
</template>
<script setup>
defineProps({ card: { type: Object, required: true } })
defineEmits(['share'])
const STEPS = ['发报', '保护窗口', '动态管理', '到期结算']
</script>
