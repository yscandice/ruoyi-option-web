<template>
  <article v-if="card.block" class="pc k-gray blk">
    <div class="pc-hd"><div class="pc-r1"><span class="logo2">{{ card.logo }}</span><strong>{{ card.sym }}</strong><span class="pc-time num">{{ card.time }}</span></div>
      <div class="pc-tags"><span class="tg c">{{ card.block }}</span></div>
      <div class="pc-r2"><div class="legs num"><small v-if="card.small">{{ card.small }}</small>{{ card.legs }}</div><div class="pnl"><small>参考估值</small><b class="num">—</b></div></div></div>
    <TrackFoot :card="card" />
  </article>
  <article v-else :class="['pc', `k-${card.k}`, { open }]">
    <div class="pc-hd">
      <div class="pc-r1"><span class="logo2">{{ card.logo || card.sym.slice(0, 1) }}</span><strong>{{ card.sym }}</strong><span v-if="card.grp" class="g">· {{ card.grp }}</span><span class="pc-time num">{{ card.time }}</span></div>
      <div class="pc-tags"><span v-for="t in card.tags" :key="t.text" :class="['tg', t.cls]">{{ t.text }}</span></div>
      <div class="pc-r2"><div class="legs num"><small>{{ card.small }}</small>{{ card.legs }}</div><div class="pnl"><small>{{ card.plLabel }}</small><b class="num">{{ card.plValue }}</b><div v-if="card.plSub" class="sub num">{{ card.plSub }}</div></div></div>
    </div>
    <div v-if="card.orig" class="orig"><span><b>{{ card.orig.a }}</b>　<span class="num">{{ card.orig.b }}</span></span><span>{{ card.orig.c }}</span></div>
    <div class="met"><div v-for="m in card.met" :key="m.l"><small>{{ m.l }}</small><b :class="['num', m.c]">{{ m.v }}</b></div></div>
    <ol class="steps"><li v-for="(s, i) in STEPS" :key="s" :class="{ done: i < card.step, cur: i === card.step }">{{ i === 3 ? card.lastStep : s }}</li></ol>
    <TrackFoot :card="card" />
    <template v-if="card.dm && card.dm.length">
      <button class="dm-t" type="button" @click="open = !open"><i />动态管理策略 · {{ card.dm.length }} 项<em>{{ open ? '收起' : '展开' }}</em></button>
      <div class="dm"><div class="tl">
        <div v-for="d in card.dm" :key="d.key" class="tl-i"><div class="tl-h"><span class="num">{{ d.time }}</span><b>{{ d.kind }}</b><span class="st st-gray">{{ d.tag }}</span></div>
          <div class="mini"><div class="mini-h"><span>{{ d.legs || '—' }}</span><b v-if="d.pnl !== null" :class="['num', d.pnl > 0 ? 'up' : d.pnl < 0 ? 'down' : 'flat']">{{ sgn(d.pnl) }}</b></div><p>{{ d.desc }}</p></div></div>
      </div></div>
    </template>
  </article>
</template>
<script setup>
import { defineComponent, h, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { sgn } from '@/utils/conductDesk'
defineProps({ card: { type: Object, required: true } })
const STEPS = ['发报', '保护窗口', '动态管理', '到期结算']
const open = ref(false)
// 底部标记行：标记徽章 / 标记时间 / 否决原因 / 组数 / 详情；系统参考提示另起一行
const TrackFoot = defineComponent({
  props: { card: Object },
  setup: p => () => {
    const c = p.card
    const row = [h('em', { class: ['tk-mark', c.mark.cls] }, c.mark.label), h('time', { class: 'num' }, c.at)]
    if (c.why) row.push(h('small', { class: 'tk-why' }, c.why))
    if (c.lots) row.push(h('span', { class: 'tk-lots' }, `· ${c.lots} 组`))
    row.push(h('span', { class: 'sp' }))
    if (!c.block) row.push(h(RouterLink, { class: 'btn-s', to: c.detail }, () => '详情 →'))
    return h('div', { class: 'tk-ft' }, [h('div', { class: 'tk-row' }, row), c.note ? h('div', { class: 'tk-note' }, c.note) : null])
  }
})
</script>
