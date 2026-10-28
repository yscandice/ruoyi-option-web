<template>
  <article :class="['pc', `k-${card.k}`, { open }]">
    <div class="pc-hd">
      <div class="pc-r1"><span class="logo2">{{ card.logo || card.sym.slice(0, 1) }}</span><strong>{{ card.sym }}</strong><span v-if="card.grp" class="g">· {{ card.grp }}</span><span class="pc-time num">{{ card.time }}</span></div>
      <div class="pc-tags"><span v-for="t in card.tags" :key="t.text" :class="['tg', t.cls]">{{ t.text }}</span></div>
      <div class="pc-r2"><div class="legs num"><small>{{ card.small }}</small>{{ card.legs }}</div><div class="pnl"><small>{{ card.plLabel }}</small><b :class="['num', card.plCls]">{{ card.plValue }}</b><div v-if="card.plSub" class="sub num">{{ card.plSub }}</div></div></div>
    </div>
    <div v-if="card.orig" class="orig"><span><b>{{ card.orig.a }}</b>　<span class="num">{{ card.orig.b }}</span></span><span>{{ card.orig.c }}</span></div>
    <div class="met"><div v-for="m in card.met" :key="m.l"><small>{{ m.l }}</small><b :class="['num', m.c]">{{ m.v }}</b></div></div>
    <ol class="steps"><li v-for="(s, i) in STEPS" :key="s" :class="{ done: i < card.step, cur: i === card.step }">{{ i === 3 ? card.lastStep : s }}</li></ol>
    <div v-if="card.evid" class="evid num">{{ card.evid }}</div>
    <div class="pc-ft"><span class="wm">OSM<i>TRADE</i>.COM</span><span class="sp" /><button class="btn-s" type="button" @click="share">↗ 分享</button></div>
    <template v-if="card.dm.length">
      <button class="dm-t" type="button" @click="open = !open"><i />动态管理策略 · {{ card.dm.length }} 项<em>{{ open ? '收起' : '展开' }}</em></button>
      <div class="dm"><div class="tl">
        <div v-for="d in card.dm" :key="d.key" class="tl-i"><div class="tl-h"><span class="num">{{ d.time }}</span><b>{{ d.kind }}</b><span class="st st-gray">{{ d.tag }}</span></div>
          <div class="mini"><div class="mini-h"><span>{{ d.legs || '—' }}</span><b v-if="d.pnl !== null" :class="['num', d.pnl > 0 ? 'up' : d.pnl < 0 ? 'down' : 'flat']">{{ sgn(d.pnl) }}</b></div><p>{{ d.desc }}</p></div></div>
      </div></div>
    </template>
  </article>
</template>
<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { sgn } from '@/utils/conductDesk'
const props = defineProps({ card: { type: Object, required: true } })
const STEPS = ['发报', '保护窗口', '动态管理', '到期结算']
const open = ref(false)
async function share() {
  try { await navigator.clipboard.writeText(props.card.share); ElMessage.success('已复制卡片摘要') } catch { ElMessage.info(props.card.share) }
}
</script>
