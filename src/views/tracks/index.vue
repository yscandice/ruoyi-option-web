<template>
  <div class="tracks-page">
    <section class="tracks-layout">
      <main class="main-column">
        <div class="eyebrow"><span class="eyebrow-dot" />TRACKED <span>·</span> MY MARKS</div>
        <h1>我的跟踪</h1>
        <p class="intro">你在信号上做过的标记，以及系统对该信号的参考估值。</p>

        <section class="marked-panel">
          <div class="panel-topline"><span class="panel-icon"><el-icon><Star /></el-icon></span><span class="panel-kicker">MY MARKS</span><span class="local-label"><i />本地页面预览</span></div>
          <div class="empty-content">
            <div class="empty-visual"><span class="orbit orbit-one"/><span class="orbit orbit-two"/><span class="empty-star"><el-icon><Star /></el-icon></span><i class="spark spark-one"/><i class="spark spark-two"/></div>
            <span class="empty-tag">TRACKING SPACE</span>
            <h2>尚无任何标记</h2>
            <p>在今日信号卡片上选择“手动标记”，即可把关注的信号加入这里，并查看系统参考估值。</p>
            <router-link class="today-link" to="/today">去看今日信号<el-icon><ArrowRight /></el-icon></router-link>
          </div>
          <div class="panel-footnote"><el-icon><InfoFilled /></el-icon><span>OSM 看不到你的券商成交，此处不是账户记录。</span></div>
        </section>
      </main>

      <aside class="side-column">
        <section class="side-card week-card">
          <div class="side-card-heading"><div><span class="side-kicker">THIS WEEK · 本周</span><h2>{{ weekRange }}</h2></div><span class="week-icon"><el-icon><Calendar /></el-icon></span></div>
          <div class="weekday-grid">
            <div v-for="day in weekDays" :key="day.key" :class="['weekday', { today: day.today }]">
              <span>{{ day.label }}</span><strong>{{ day.date }}</strong><i v-if="day.today" />
            </div>
          </div>
          <div class="week-legend"><span><i class="dot system-dot"/>系统</span><span><i class="dot user-dot"/>你</span><span class="legend-caption">信号与标记概览</span></div>
          <div class="week-summary">
            <div class="summary-total"><span>系统发出</span><strong>—</strong></div>
            <div class="summary-total followed"><span>你跟了</span><strong>—</strong></div>
          </div>
          <div class="summary-breakdown">
            <div><span class="break-icon blue"><el-icon><TrendCharts /></el-icon></span><span>新卖方</span><strong>—</strong></div>
            <div><span class="break-icon orange"><el-icon><Umbrella /></el-icon></span><span>保护窗</span><strong>—</strong></div>
            <div><span class="break-icon purple"><el-icon><Operation /></el-icon></span><span>管理</span><strong>—</strong></div>
            <div><span class="break-icon red"><el-icon><Lock /></el-icon></span><span>强制保护</span><strong>—</strong></div>
            <div><span class="break-icon green"><el-icon><CircleCheck /></el-icon></span><span>止盈</span><strong>—</strong></div>
          </div>
          <router-link class="week-action" to="/today">查看今日信号<el-icon><ArrowRight /></el-icon></router-link>
        </section>

        <section class="side-card positions-card">
          <div class="side-card-heading"><div><span class="side-kicker">POSITION WATCH</span><h2>在看的仓位</h2></div><span class="positions-total"><strong>—</strong><small>组</small></span></div>
          <div class="positions-columns"><span>标的</span><span>组合与风险状态</span></div>
          <div class="positions-empty"><span class="positions-empty-icon"><el-icon><DataAnalysis /></el-icon></span><strong>等待跟踪数据</strong><p>信号标记后的组合观察内容会显示在这里。</p></div>
          <div class="positions-foot"><el-icon><InfoFilled /></el-icon>止盈、止损或移仓后的组合不在此处展示。</div>
        </section>

        <section class="next-events">
          <div class="next-heading"><span class="next-icon"><el-icon><Clock /></el-icon></span><div><span class="side-kicker">UP NEXT</span><strong>接下来关注</strong></div></div>
          <div class="event-placeholder"><span class="event-day">—</span><span class="event-copy"><strong>经济数据与公司事件</strong><small>日历信息待更新</small></span><span class="event-category">宏观</span></div>
          <div class="event-placeholder"><span class="event-day">—</span><span class="event-copy"><strong>下一项重要日程</strong><small>日历信息待更新</small></span><span class="event-category">事件</span></div>
        </section>
      </aside>
    </section>
    <p class="disclaimer"><el-icon><InfoFilled /></el-icon>演示页面未连接实时信号、券商账户或市场数据。参考估值仅用于说明界面用途，不构成交易记录或投资建议。</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight, Calendar, CircleCheck, Clock, DataAnalysis, InfoFilled, Lock, Operation, Star, TrendCharts, Umbrella } from '@element-plus/icons-vue'

const now = new Date()
const monday = new Date(now)
const dayOfWeek = (now.getDay() + 6) % 7
monday.setDate(now.getDate() - dayOfWeek)
const weekDays = computed(() => Array.from({ length: 5 }, (_, index) => {
  const date = new Date(monday)
  date.setDate(monday.getDate() + index)
  return {
    key: date.toISOString().slice(0, 10),
    label: ['一', '二', '三', '四', '五'][index],
    date: String(date.getDate()).padStart(2, '0'),
    today: date.toDateString() === now.toDateString()
  }
}))
const weekRange = computed(() => {
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const format = date => `${date.getMonth() + 1}/${date.getDate()}`
  return `${format(monday)} — ${format(friday)}`
})
</script>

<style scoped>
.tracks-page{--ink:#1d3858;--muted:#8798ac;--line:#e7edf4;color:var(--ink)}.tracks-layout{display:grid;grid-template-columns:minmax(0,1fr) 345px;gap:16px;align-items:start}.main-column{min-width:0}.eyebrow{display:flex;align-items:center;gap:7px;color:#5785b6;font-size:9px;font-weight:750;letter-spacing:1.2px}.eyebrow>span:nth-child(2){color:#a6b3c2}.eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#4d91d2;box-shadow:0 0 0 4px #4d91d21c}.main-column h1{margin:8px 0 5px;color:#19395f;font-size:27px;line-height:1.2;letter-spacing:-.4px}.intro{margin:0 0 16px;color:#8797aa;font-size:11px;line-height:1.6}.marked-panel,.side-card{background:#fff;border:1px solid var(--line);border-radius:13px;box-shadow:0 4px 16px #233e5b08}.marked-panel{min-height:500px;display:flex;flex-direction:column;overflow:hidden}.panel-topline{display:flex;align-items:center;gap:9px;padding:15px 17px;border-bottom:1px solid #eff3f7}.panel-icon{width:29px;height:29px;display:grid;place-items:center;border-radius:8px;background:#edf5ff;color:#4b88c6;font-size:14px}.panel-kicker{color:#8298ae;font-size:8px;font-weight:750;letter-spacing:1px}.local-label{display:flex;align-items:center;gap:5px;margin-left:auto;padding:5px 7px;border-radius:5px;background:#f4f8fc;color:#91a2b4;font-size:8px}.local-label i{width:5px;height:5px;border-radius:50%;background:#7ea8d3}.empty-content{flex:1;min-height:365px;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:32px 24px;text-align:center}.empty-visual{position:relative;width:100px;height:90px;display:grid;place-items:center;margin-bottom:10px}.orbit{position:absolute;border:1px solid #e1edf8;border-radius:50%;transform:rotate(-22deg)}.orbit-one{width:88px;height:54px}.orbit-two{width:67px;height:90px;transform:rotate(37deg);border-color:#edf3f9}.empty-star{z-index:1;width:48px;height:48px;display:grid;place-items:center;border-radius:16px;background:linear-gradient(145deg,#f4f9ff,#e5f1fd);color:#5c96ce;font-size:21px;box-shadow:0 8px 20px #3678b31c}.spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#7eafe0}.spark-one{right:8px;top:14px}.spark-two{left:9px;bottom:12px;width:4px;height:4px;background:#b8cde1}.empty-tag{color:#9cb0c5;font-size:8px;font-weight:750;letter-spacing:1.3px}.empty-content h2{margin:8px 0 6px;color:#3f5e7e;font-size:15px}.empty-content p{max-width:390px;margin:0;color:#929faf;font-size:10px;line-height:1.7}.today-link{display:inline-flex;align-items:center;gap:7px;margin-top:16px;padding:9px 13px;border-radius:8px;background:#347fc4;color:#fff;font-size:10px;font-weight:650;text-decoration:none;box-shadow:0 4px 11px #347fc426;transition:background .15s,transform .15s}.today-link:hover{background:#246cb0;transform:translateY(-1px)}.panel-footnote{display:flex;align-items:center;gap:6px;padding:11px 15px;border-top:1px solid #eff3f7;color:#9ba8b7;font-size:8px}.panel-footnote .el-icon{color:#89a9ca}
.side-column{display:flex;flex-direction:column;gap:12px}.side-card{padding:14px}.side-card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.side-kicker{display:block;color:#91a7bc;font-size:8px;font-weight:750;letter-spacing:.75px}.side-card-heading h2{margin:4px 0 0;color:#345372;font-size:12px}.week-icon{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:#f1f6fb;color:#6d98c2;font-size:13px}.weekday-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.weekday{position:relative;display:flex;align-items:center;flex-direction:column;gap:6px;padding:8px 3px;border:1px solid #edf1f5;border-radius:7px;color:#9aa8b7;font-size:8px}.weekday strong{color:#607992;font-size:10px;font-weight:650}.weekday.today{border-color:#cfe1f3;background:#f3f8fe;color:#4a83bb}.weekday.today strong{color:#3477b9}.weekday>i{position:absolute;bottom:4px;width:4px;height:4px;border-radius:50%;background:#4f94d3}.week-legend{display:flex;align-items:center;gap:11px;margin:10px 0 8px;color:#8d9caf;font-size:8px}.week-legend>span{display:flex;align-items:center;gap:4px}.dot{width:5px;height:5px;border-radius:50%}.system-dot{background:#78a9d7}.user-dot{background:#a3cbb6}.legend-caption{margin-left:auto;color:#a7b2bf}.week-summary{display:grid;grid-template-columns:1fr 1fr;gap:7px}.summary-total{display:flex;align-items:center;justify-content:space-between;padding:9px 10px;border:1px solid #edf1f5;border-radius:7px;background:#fbfcfe}.summary-total span{color:#8d9bac;font-size:8px}.summary-total strong{color:#4b759a;font-size:14px}.summary-total.followed{border-color:#dcebe4;background:#f7fbf8}.summary-total.followed strong{color:#569577}.summary-breakdown{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.summary-breakdown>div{display:grid;grid-template-columns:19px 1fr auto;align-items:center;gap:5px;padding:7px 6px;border:1px solid #eff2f6;border-radius:6px}.break-icon{width:19px;height:19px;display:grid;place-items:center;border-radius:5px;font-size:10px}.break-icon.blue{background:#edf5ff;color:#4f89c4}.break-icon.orange{background:#fff5e8;color:#c68a3f}.break-icon.purple{background:#f3efff;color:#8572b9}.break-icon.red{background:#fff0ef;color:#ce7170}.break-icon.green{background:#edf8f2;color:#4c9c76}.summary-breakdown>div>span:nth-child(2){color:#8798aa;font-size:8px}.summary-breakdown strong{color:#8e9eaf;font-size:9px}.week-action{display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding:8px 9px;border-radius:7px;background:#f2f7fc;color:#4d80b2;font-size:8px;text-decoration:none}.week-action:hover{background:#eaf3fc}.positions-total{display:flex;align-items:baseline;gap:3px;padding:5px 7px;border-radius:6px;background:#f4f7fa;color:#91a0b0}.positions-total strong{font-size:13px}.positions-total small{font-size:8px}.positions-columns{display:flex;justify-content:space-between;padding:7px 2px;border-top:1px solid #eff3f7;border-bottom:1px solid #eff3f7;color:#a0adba;font-size:8px}.positions-empty{display:flex;align-items:center;flex-direction:column;padding:18px 8px 14px;text-align:center}.positions-empty-icon{width:35px;height:35px;display:grid;place-items:center;margin-bottom:7px;border-radius:10px;background:#f0f6fc;color:#87a9cb;font-size:15px}.positions-empty strong{color:#687f98;font-size:9px}.positions-empty p{margin:4px 0 0;color:#a0adba;font-size:8px;line-height:1.5}.positions-foot{display:flex;align-items:flex-start;gap:5px;padding-top:9px;border-top:1px solid #eff3f7;color:#9ba8b6;font-size:7px;line-height:1.45}.positions-foot .el-icon{flex:none;color:#90aaca}.next-events{padding:2px 2px 0}.next-heading{display:flex;align-items:center;gap:8px;margin-bottom:7px}.next-icon{width:25px;height:25px;display:grid;place-items:center;border-radius:7px;background:#eef5fc;color:#6f98bf;font-size:12px}.next-heading>div{display:flex;flex-direction:column;gap:2px}.next-heading strong{color:#4d6885;font-size:10px}.event-placeholder{display:flex;align-items:center;gap:8px;padding:8px 7px;border-top:1px solid #e9eef4}.event-day{width:23px;height:23px;display:grid;place-items:center;border-radius:6px;background:#fff;color:#a6b2bf;font-size:8px}.event-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}.event-copy strong{overflow:hidden;color:#71869d;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.event-copy small{color:#a2adba;font-size:7px}.event-category{padding:4px 5px;border-radius:4px;background:#f2f6fa;color:#8ea0b2;font-size:7px}.disclaimer{display:flex;align-items:flex-start;gap:6px;margin:13px 1px 0;color:#9aa8b6;font-size:8px;line-height:1.5}.disclaimer .el-icon{margin-top:1px;color:#88a7c7}
@media(max-width:900px){.tracks-layout{grid-template-columns:minmax(0,1fr) 295px;gap:12px}.marked-panel{min-height:470px}.side-card{padding:12px}}
@media(max-width:680px){.tracks-layout{grid-template-columns:1fr;gap:13px}.main-column h1{font-size:24px}.marked-panel{min-height:390px}.empty-content{min-height:280px;padding:25px 18px}.side-column{display:grid;grid-template-columns:1fr}.week-card{order:0}.positions-card{order:1}.next-events{order:2}.side-card{padding:13px}.summary-breakdown{grid-template-columns:repeat(3,1fr)}}
@media(max-width:390px){.marked-panel{min-height:360px}.empty-content p{font-size:9px}.week-card{padding:11px}.summary-breakdown{gap:4px}.summary-breakdown>div{grid-template-columns:17px 1fr auto;gap:3px;padding:6px 4px}.break-icon{width:17px;height:17px}.summary-breakdown>div>span:nth-child(2){font-size:7px}}
</style>
