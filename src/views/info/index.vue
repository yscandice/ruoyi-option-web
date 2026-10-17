<template>
  <div class="info-page">
    <section class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-dot" />MARKET INTELLIGENCE</div>
        <h1>信息</h1>
        <p>盘前市场、公司财报与重要事件，一站整理。</p>
      </div>
      <span class="demo-badge"><i />静态演示数据</span>
    </section>

    <nav class="info-tabs" aria-label="信息栏目">
      <button v-for="item in sections" :key="item.key" type="button" :class="['info-tab', { active: activeTab === item.key }]" @click="activeTab = item.key">
        <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span><small>{{ item.hint }}</small>
      </button>
    </nav>

    <template v-if="activeTab === 'premarket'">
      <section class="brief-topline">
        <div class="brief-heading">
          <div class="brief-kicker">PRE-MARKET <span>·</span> 盘前简报</div>
          <h2>{{ demoDate }}</h2>
          <p>开盘前的市场脉搏、重点事件与当日观察</p>
        </div>
        <div class="brief-actions">
          <button class="date-button" type="button" @click="shiftDate(-1)"><el-icon><ArrowLeft /></el-icon><span>前一份</span></button>
          <div class="date-current"><el-icon><Calendar /></el-icon>{{ dateLabel }}</div>
          <button class="date-button next-button" type="button" @click="shiftDate(1)"><span>后一份</span><el-icon><ArrowRight /></el-icon></button>
        </div>
      </section>

      <section class="lead-brief">
        <div class="lead-icon"><el-icon><ChatLineRound /></el-icon></div>
        <div><div class="section-label">盘前摘要 <span>市场概览</span></div><p>市场风险偏好有所回落，资金在板块之间重新配置。关注利率预期、科技股表现与即将公布的公司业绩，开盘后留意波动变化。</p></div>
        <span class="summary-mark">TODAY<br />BRIEF</span>
      </section>

      <section class="market-grid">
        <article class="panel quote-panel">
          <div class="panel-heading"><div><div class="section-label">盘前行情 <span>MARKET SNAPSHOT</span></div><p>主要资产与指数期货</p></div><span class="market-status"><i />盘前观察</span></div>
          <div class="quote-grid">
            <div v-for="item in quotes" :key="item.name" class="quote-item">
              <span class="quote-name">{{ item.name }}</span><strong>{{ item.value }}</strong>
              <span :class="['quote-change', item.tone]">{{ item.change }}</span>
            </div>
          </div>
        </article>

        <article class="panel stocks-panel">
          <div class="panel-heading"><div><div class="section-label">盘前个股 <span>PRE-MARKET MOVERS</span></div><p>重点观察公司</p></div><el-icon class="heading-icon"><TrendCharts /></el-icon></div>
          <div class="stock-groups">
            <div v-for="group in stockGroups" :key="group.name" class="stock-group">
              <div class="stock-group-name"><i :class="group.tone" />{{ group.name }}</div>
              <div class="stock-list">
                <div v-for="stock in group.stocks" :key="stock.symbol" class="stock-row">
                  <strong>{{ stock.symbol }}</strong><span>{{ stock.name }}</span><b :class="stock.tone">{{ stock.change }}</b>
                </div>
              </div>
            </div>
          </div>
          <div class="scale-labels"><span>跌幅较大</span><span>涨跌幅</span><span>涨幅较大</span></div>
          <div class="scale-track"><i /></div>
        </article>
      </section>

      <section class="analysis-grid">
        <article class="panel rates-panel">
          <div class="panel-heading"><div><div class="section-label">利率与宏观 <span>RATES & MACRO</span></div><p>跟踪利率预期与重要经济数据</p></div><span class="macro-tag">宏观观察</span></div>
          <div class="macro-summary"><div class="macro-copy"><span>市场隐含概率</span><strong>利率预期变化</strong><p>关注经济数据公布后，市场对后续政策路径的定价变化。</p></div><div class="probability"><strong>—<small>%</small></strong><span>政策概率</span></div></div>
          <div class="probability-chart" aria-label="市场隐含概率示意图"><div class="chart-grid"><i/><i/><i/><i/></div><div class="chart-line"><span/><span/><span/><span/><span/><span/><span/></div><div class="chart-axis"><span>前两周</span><span>上周</span><span>本周</span></div></div>
          <div class="rate-outcomes"><div><span class="outcome-dot neutral"/><span>维持不变</span><strong>—</strong></div><div><span class="outcome-dot blue"/><span>小幅调整</span><strong>—</strong></div><div><span class="outcome-dot orange"/><span>较大调整</span><strong>—</strong></div></div>
          <div class="panel-footnote"><el-icon><InfoFilled /></el-icon>此处展示利率预期与宏观事件的观察位，未连接实时数据。</div>
        </article>

        <article class="panel valuation-panel">
          <div class="panel-heading"><div><div class="section-label">估值观察 <span>VALUATION WATCH</span></div><p>股票盈利收益率与长期利率</p></div><el-icon class="heading-icon"><DataAnalysis /></el-icon></div>
          <div class="valuation-compare">
            <div class="compare-metric"><span class="metric-dot blue"/><div><small>标普盈利收益率</small><strong>—<em>%</em></strong></div></div>
            <span class="compare-vs">VS</span>
            <div class="compare-metric"><span class="metric-dot orange"/><div><small>10 年期美债收益率</small><strong>—<em>%</em></strong></div></div>
          </div>
          <div class="valuation-chart"><div class="chart-ticks"><span>高</span><span>中</span><span>低</span></div><div class="valuation-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
          <div class="valuation-note"><span class="note-icon"><el-icon><Warning /></el-icon></span><p>比较股票盈利收益率与债券收益率，有助于观察两类资产的相对回报水平。</p></div>
          <div class="earnings-strip"><span>盈利预期 <strong>—</strong></span><span>估值倍数 <strong>—</strong></span><span>利差观察 <strong>待更新</strong></span></div>
        </article>
      </section>

      <section class="panel news-panel">
        <div class="panel-heading"><div><div class="section-label">要闻 <span>WHAT MATTERS TODAY</span></div><p>影响市场与重点公司的信息摘要</p></div><button class="text-action" type="button">查看全部<el-icon><ArrowRight /></el-icon></button></div>
        <div class="news-grid">
          <article v-for="(item, index) in newsItems" :key="item.title" class="news-item">
            <div class="news-meta"><span :class="['news-category', item.tone]">{{ item.category }}</span><span>0{{ index + 1 }}</span></div>
            <h3>{{ item.title }}</h3><p>{{ item.description }}</p>
            <div class="news-tickers"><span v-for="ticker in item.tickers" :key="ticker">{{ ticker }}</span></div>
          </article>
        </div>
      </section>

      <p class="disclaimer"><el-icon><InfoFilled /></el-icon>页面为静态演示，不代表实时行情或投资建议。交易决策请结合可靠数据与自身风险承受能力。</p>
    </template>

    <section v-else class="other-section panel">
      <div class="other-head"><span class="other-icon"><el-icon><component :is="activeSection.icon" /></el-icon></span><div><div class="section-label">{{ activeSection.label }} <span>{{ activeSection.english }}</span></div><p>{{ activeSection.description }}</p></div></div>
      <div class="other-content"><div class="other-illustration"><el-icon><component :is="activeSection.icon" /></el-icon><span/><span/></div><strong>{{ activeSection.emptyTitle }}</strong><p>{{ activeSection.emptyDescription }}</p><span class="coming-label"><i/>栏目页面已就绪</span></div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowLeft, ArrowRight, Calendar, ChatLineRound, DataAnalysis, InfoFilled, Notebook, TrendCharts, Warning } from '@element-plus/icons-vue'

const sections = [
  { key: 'premarket', label: '盘前简报', hint: '每日市场摘要', english: 'PRE-MARKET', icon: ChatLineRound },
  { key: 'earnings', label: '财报解读', hint: '业绩与波动观察', english: 'EARNINGS', icon: TrendCharts, description: '围绕财报前瞻、业绩结果与期权波动整理观察。', emptyTitle: '财报日历与解读', emptyDescription: '公司业绩日历、市场预期与财报后的期权波动观察将在这里呈现。' },
  { key: 'events', label: '事件解读', hint: '重要事件梳理', english: 'EVENTS', icon: DataAnalysis, description: '梳理可能影响市场与持仓的重要事件及关注方向。', emptyTitle: '重要事件观察', emptyDescription: '影响市场与持仓的宏观事件和公司事件将在这里集中解读。' },
  { key: 'notes', label: '札记', hint: '案例与交易思考', english: 'NOTES', icon: Notebook, description: '沉淀系统思路、案例复盘与交易观察。', emptyTitle: '交易员札记', emptyDescription: '系统哲学、案例复盘和交易观察将在这里整理。' }
]
const activeTab = ref('premarket')
const activeSection = computed(() => sections.find(item => item.key === activeTab.value) || sections[0])
const dateOffset = ref(0)
const baseDate = new Date(2026, 9, 15)
const demoDate = computed(() => {
  const value = new Date(baseDate)
  value.setDate(value.getDate() + dateOffset.value)
  return `${value.getMonth() + 1}月${value.getDate()}日 ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][value.getDay()]}`
})
const dateLabel = computed(() => dateOffset.value === 0 ? '演示日期' : `${Math.abs(dateOffset.value)} 天${dateOffset.value < 0 ? '前' : '后'}`)
function shiftDate(amount) { dateOffset.value += amount }

const quotes = [
  { name: '标普 500 期货', value: '—', change: '待更新', tone: 'muted' },
  { name: '纳指 100 期货', value: '—', change: '待更新', tone: 'muted' },
  { name: '10 年期美债', value: '—', change: '待更新', tone: 'muted' },
  { name: '布伦特原油', value: '—', change: '待更新', tone: 'muted' },
  { name: '黄金', value: '—', change: '待更新', tone: 'muted' },
  { name: '比特币', value: '—', change: '待更新', tone: 'muted' }
]
const stockGroups = [
  { name: '科技与芯片', tone: 'blue', stocks: [{ symbol: 'NVDA', name: '英伟达', change: '—', tone: 'muted' }, { symbol: 'AVGO', name: '博通', change: '—', tone: 'muted' }, { symbol: 'TSM', name: '台积电', change: '—', tone: 'muted' }] },
  { name: '重点公司', tone: 'orange', stocks: [{ symbol: 'TSLA', name: '特斯拉', change: '—', tone: 'muted' }, { symbol: 'LLY', name: '礼来', change: '—', tone: 'muted' }] }
]
const newsItems = [
  { category: '市场', tone: 'blue', title: '市场情绪与板块轮动', description: '跟踪指数期货、利率和板块相对表现，观察风险偏好的变化。', tickers: ['SPX', 'NDX'] },
  { category: '财报', tone: 'purple', title: '重点公司财报日程', description: '留意财报发布时间、市场预期及隐含波动变化。', tickers: ['EARNINGS'] },
  { category: '宏观', tone: 'orange', title: '宏观数据与利率预期', description: '重要经济数据可能影响利率定价与市场波动。', tickers: ['RATES', 'MACRO'] }
]
</script>

<style scoped>
.info-page{--ink:#193454;--muted:#7f91a8;--line:#e8eef5;--blue:#347ac5;color:var(--ink)}
.page-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:1px 0 19px}.eyebrow{display:flex;align-items:center;gap:8px;color:#5786b9;font-size:10px;font-weight:750;letter-spacing:1.15px}.eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#4d91dc;box-shadow:0 0 0 4px #4d91dc1d}.page-heading h1{margin:7px 0 5px;color:#18395f;font-size:27px;letter-spacing:-.45px}.page-heading p{margin:0;color:#8898aa;font-size:12px}.demo-badge{display:flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #e4edf7;border-radius:8px;background:#fff;color:#8396ad;font-size:10px}.demo-badge i,.market-status i,.coming-label i{width:6px;height:6px;border-radius:50%;background:#89a7c7}
.info-tabs{display:flex;gap:7px;padding:7px;margin-bottom:16px;background:#fff;border:1px solid var(--line);border-radius:13px;box-shadow:0 3px 12px #203f6210}.info-tab{flex:1;min-width:0;display:grid;grid-template-columns:27px 1fr;grid-template-rows:auto auto;align-items:center;column-gap:9px;padding:10px 12px;border:0;border-radius:9px;background:transparent;text-align:left;cursor:pointer;color:#71839a;transition:background .16s,color .16s}.info-tab:hover{background:#f6f9fd}.info-tab.active{background:#edf5ff;color:#2e72bb}.info-tab>.el-icon{grid-row:1/3;width:27px;height:27px;display:grid;place-items:center;border-radius:8px;background:#f0f4f9;font-size:14px}.info-tab.active>.el-icon{background:#dcecff;color:#3279c5}.info-tab span{font-size:11px;font-weight:700}.info-tab small{margin-top:3px;color:#9aa8b8;font-size:9px;white-space:nowrap}.brief-topline{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:0 1px 13px}.brief-kicker{color:#4b83bc;font-size:9px;font-weight:750;letter-spacing:1.2px}.brief-kicker span{padding:0 3px;color:#a6b5c6}.brief-heading h2{margin:5px 0 3px;color:#203d60;font-size:21px;letter-spacing:-.3px}.brief-heading p{margin:0;color:#8b9aad;font-size:10px}.brief-actions{display:flex;align-items:center;gap:7px}.date-button,.date-current{height:32px;display:flex;align-items:center;gap:6px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:#fff;color:#71849a;font-size:10px}.date-button{cursor:pointer}.date-button:hover{border-color:#c6dbf2;color:#3275bd}.date-current{color:#3f6e9e;background:#f9fbfe}.lead-brief,.panel{background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 4px 16px #203f6208}.lead-brief{position:relative;display:flex;align-items:flex-start;gap:12px;overflow:hidden;margin-bottom:13px;padding:15px 17px}.lead-icon{width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:10px;background:#edf5ff;color:#3d82c8;font-size:16px}.section-label{color:#294767;font-size:12px;font-weight:750}.section-label>span{margin-left:7px;color:#a3b0bf;font-size:8px;font-weight:650;letter-spacing:.85px}.lead-brief .section-label span{padding:3px 6px;border-radius:4px;background:#f0f5fb;letter-spacing:0}.lead-brief p{max-width:920px;margin:7px 0 0;color:#71849a;font-size:11px;line-height:1.7}.summary-mark{position:absolute;right:17px;bottom:8px;color:#eff4fa;font-size:18px;font-weight:800;line-height:1.1;letter-spacing:1px;text-align:right}
.market-grid,.analysis-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,.9fr);gap:13px;margin-bottom:13px}.panel{padding:15px 16px}.panel-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px}.panel-heading p{margin:5px 0 0;color:#9aa8b8;font-size:9px}.market-status{display:flex;align-items:center;gap:6px;color:#8b9caf;font-size:9px}.market-status i{background:#58b88a;box-shadow:0 0 0 3px #58b88a1a}.quote-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid #eff3f7;border-left:1px solid #eff3f7}.quote-item{min-height:76px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;padding:8px 12px;border-right:1px solid #eff3f7;border-bottom:1px solid #eff3f7}.quote-name{color:#8a9aab;font-size:9px}.quote-item strong{color:#415a76;font-size:16px;font-weight:700;line-height:1}.quote-change{font-size:9px;font-weight:650}.quote-change.muted,.stock-row b.muted{color:#a7b2bf}.quote-change.up,.stock-row b.up{color:#299972}.quote-change.down,.stock-row b.down{color:#d66767}.heading-icon{color:#82a3c8;font-size:17px}.stock-groups{display:flex;flex-direction:column;gap:12px}.stock-group-name{display:flex;align-items:center;gap:6px;margin-bottom:7px;color:#8697aa;font-size:9px}.stock-group-name i{width:6px;height:6px;border-radius:2px}.stock-group-name i.blue{background:#5a95d5}.stock-group-name i.orange{background:#e1a054}.stock-list{display:flex;flex-direction:column;gap:5px}.stock-row{display:grid;grid-template-columns:45px 1fr 35px;align-items:center;gap:7px;padding:7px 8px;border:1px solid #eff3f7;border-radius:7px;background:#fcfdff}.stock-row strong{color:#426080;font-size:10px}.stock-row>span{color:#9aa8b7;font-size:9px}.stock-row b{text-align:right;font-size:10px}.scale-labels{display:flex;justify-content:space-between;margin-top:11px;color:#a7b2c0;font-size:8px}.scale-track{height:4px;margin-top:5px;border-radius:4px;background:linear-gradient(90deg,#df8585,#e9c5b3 46%,#e3eaf1 50%,#b8daca 60%,#68bc9b)}.scale-track i{display:block;width:5px;height:10px;margin-left:50%;transform:translateY(-3px);border-radius:3px;background:#718da9}
.macro-summary{display:flex;justify-content:space-between;align-items:center;padding:12px;border-radius:9px;background:#f6f9fd}.macro-copy>span{color:#91a0b1;font-size:9px}.macro-copy strong{display:block;margin-top:5px;color:#355474;font-size:12px}.macro-copy p{max-width:250px;margin:5px 0 0;color:#95a3b2;font-size:9px;line-height:1.5}.probability{min-width:70px;text-align:center}.probability strong{color:#3980c2;font-size:22px}.probability strong small{font-size:11px}.probability span{display:block;color:#99a7b6;font-size:8px}.macro-tag{padding:5px 7px;border-radius:5px;background:#fff6e9;color:#c78b40;font-size:8px}.probability-chart{height:94px;position:relative;margin:14px 3px 9px 22px}.chart-grid{position:absolute;inset:0 0 15px;display:flex;flex-direction:column;justify-content:space-between}.chart-grid i{height:1px;background:#eff3f7}.chart-line{position:absolute;left:0;right:0;top:13px;height:55px;display:flex;align-items:center;justify-content:space-between}.chart-line:before{position:absolute;content:'';left:0;right:0;top:25px;height:2px;background:linear-gradient(90deg,#7daee1,#4f91d0);transform:rotate(-5deg);border-radius:2px}.chart-line span{z-index:1;width:6px;height:6px;border:2px solid #fff;border-radius:50%;background:#4c8fce;box-shadow:0 0 0 1px #4c8fce}.chart-axis{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;color:#a2afbd;font-size:8px}.rate-outcomes{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.rate-outcomes>div{display:grid;grid-template-columns:7px 1fr;align-items:center;gap:5px;padding:8px 7px;border:1px solid #eef2f6;border-radius:7px}.rate-outcomes>div>span:nth-child(2){color:#8b9bac;font-size:8px}.rate-outcomes strong{grid-column:2;color:#5d7590;font-size:11px}.outcome-dot,.metric-dot{width:6px;height:6px;border-radius:50%;background:#abb9c8}.outcome-dot.blue,.metric-dot.blue{background:#4f91d0}.outcome-dot.orange,.metric-dot.orange{background:#e4a051}.panel-footnote{display:flex;align-items:center;gap:5px;margin-top:11px;color:#a4afbc;font-size:8px}.panel-footnote .el-icon{color:#86a8cb}.valuation-compare{display:flex;align-items:center;justify-content:space-between;gap:7px;padding:11px 10px;background:#f7f9fc;border-radius:8px}.compare-metric{display:flex;align-items:center;gap:7px}.compare-metric>div{display:flex;flex-direction:column;gap:4px}.compare-metric small{color:#8d9cad;font-size:8px;white-space:nowrap}.compare-metric strong{color:#45617f;font-size:15px}.compare-metric em{font-size:9px;font-style:normal}.compare-vs{color:#b4bfca;font-size:8px;font-weight:700}.valuation-chart{height:102px;display:flex;gap:9px;margin:14px 4px}.chart-ticks{display:flex;flex-direction:column;justify-content:space-between;padding:0 0 4px;color:#a6b1bd;font-size:8px}.valuation-bars{flex:1;display:flex;align-items:flex-end;justify-content:space-around;gap:6px;padding:0 8px 4px;border-bottom:1px solid #e9eff5;background:repeating-linear-gradient(to bottom,transparent 0,transparent 32px,#eef2f6 33px,#eef2f6 34px)}.valuation-bars i{width:9px;border-radius:4px 4px 1px 1px;background:linear-gradient(180deg,#7fb0df,#d7e7f7)}.valuation-bars i:nth-child(3n){background:linear-gradient(180deg,#efc287,#faecd8)}.valuation-bars i:nth-child(1){height:45%}.valuation-bars i:nth-child(2){height:56%}.valuation-bars i:nth-child(3){height:51%}.valuation-bars i:nth-child(4){height:67%}.valuation-bars i:nth-child(5){height:61%}.valuation-bars i:nth-child(6){height:70%}.valuation-bars i:nth-child(7){height:62%}.valuation-bars i:nth-child(8){height:75%}.valuation-bars i:nth-child(9){height:64%}.valuation-bars i:nth-child(10){height:80%}.valuation-bars i:nth-child(11){height:69%}.valuation-bars i:nth-child(12){height:73%}.valuation-note{display:flex;align-items:flex-start;gap:7px;padding:9px;border:1px solid #f2eadc;border-radius:7px;background:#fffaf2}.note-icon{color:#d5a15b;font-size:12px}.valuation-note p{margin:0;color:#998463;font-size:8px;line-height:1.5}.earnings-strip{display:flex;justify-content:space-between;gap:5px;margin-top:11px;color:#9aa8b7;font-size:8px}.earnings-strip strong{display:block;margin-top:4px;color:#5c7490;font-size:10px}
.news-panel{margin-bottom:12px}.text-action{display:flex;align-items:center;gap:5px;border:0;background:none;color:#6e93b8;font-size:9px;cursor:pointer}.news-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.news-item{min-height:120px;padding:12px;border:1px solid #edf1f6;border-radius:9px;background:#fcfdff}.news-meta{display:flex;align-items:center;justify-content:space-between;color:#b2bdc9;font-size:8px}.news-category{padding:4px 6px;border-radius:4px;background:#edf5ff;color:#5186bc}.news-category.purple{background:#f3efff;color:#8975c2}.news-category.orange{background:#fff5e8;color:#c48d4e}.news-item h3{margin:10px 0 6px;color:#405a77;font-size:10px;line-height:1.4}.news-item p{min-height:27px;margin:0;color:#929faf;font-size:8px;line-height:1.55}.news-tickers{display:flex;gap:5px;margin-top:9px}.news-tickers span{padding:3px 5px;border-radius:4px;background:#f0f4f8;color:#8294a7;font-size:7px}.disclaimer{display:flex;align-items:flex-start;gap:6px;margin:0;color:#9aa7b6;font-size:9px;line-height:1.5}.disclaimer .el-icon{margin-top:1px;color:#8ba9c8}
.other-section{min-height:410px;padding:20px}.other-head{display:flex;align-items:center;gap:11px;padding-bottom:16px;border-bottom:1px solid #eef2f6}.other-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#edf5ff;color:#3c80c3;font-size:17px}.other-head p{margin:5px 0 0;color:#97a5b4;font-size:9px}.other-content{min-height:315px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}.other-illustration{position:relative;width:58px;height:58px;display:grid;place-items:center;margin-bottom:12px;border-radius:18px;background:#edf5ff;color:#5790c9;font-size:24px}.other-illustration span{position:absolute;width:7px;height:7px;border-radius:50%;background:#93b8df;right:-2px;top:4px}.other-illustration span:last-child{width:5px;height:5px;right:auto;left:-3px;top:auto;bottom:6px}.other-content>strong{color:#506b89;font-size:12px}.other-content>p{margin:7px 0 14px;color:#9ba8b7;font-size:9px}.coming-label{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:999px;background:#f4f8fc;color:#93a2b2;font-size:8px}
@media(max-width:900px){.market-grid,.analysis-grid{grid-template-columns:1fr 1fr}.quote-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.quote-item{min-height:65px}.stock-groups{gap:9px}.news-grid{grid-template-columns:1fr 1fr}.news-item:last-child{display:none}}
@media(max-width:650px){.page-heading{align-items:flex-start}.page-heading h1{font-size:23px}.demo-badge{padding:6px 8px;font-size:9px}.info-tabs{gap:3px;padding:5px;overflow:auto}.info-tab{flex:none;min-width:105px;padding:8px}.info-tab small{font-size:8px}.brief-topline{align-items:flex-start;flex-direction:column}.brief-actions{width:100%;justify-content:space-between}.brief-heading h2{font-size:19px}.lead-brief{padding:12px}.lead-brief p{font-size:10px}.summary-mark{display:none}.market-grid,.analysis-grid{grid-template-columns:1fr;gap:10px;margin-bottom:10px}.panel{padding:13px}.quote-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.quote-item{min-height:63px;padding:7px}.quote-name{font-size:8px}.quote-item strong{font-size:14px}.news-grid{grid-template-columns:1fr}.news-item:last-child{display:block}.news-item{min-height:0}.news-item p{min-height:0}.other-section{padding:14px}.other-content{min-height:270px}}
@media(max-width:390px){.info-tab{min-width:95px;grid-template-columns:24px 1fr;column-gap:6px}.info-tab>.el-icon{width:24px;height:24px}.info-tab span{font-size:10px}.info-tab small{font-size:7px}.quote-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.date-button,.date-current{padding:0 7px;font-size:9px}.section-label{font-size:11px}}
</style>
