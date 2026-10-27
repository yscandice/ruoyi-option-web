<template>
  <div class="infv3">
    <!-- ===== Hero：标题 + 栏目卡 ===== -->
    <section class="hero"><div class="wrap">
      <div class="hero-top">
        <div>
          <span class="eyebrow"><i />INFO · RESEARCH DESK</span>
          <h1>信息，<em>开盘前先看一眼。</em><DataViewTag resource="info" /></h1>
          <p class="hero-sub">{{ hero.day }}<span class="sep">·</span>{{ hero.week }}<span class="sep">·</span><span class="tag-dk">{{ hero.session }}</span><span class="sep">·</span>盘前简报、财报、事件与札记</p>
        </div>
        <div class="hero-meta">
          <span class="glass-pill" :title="badgeTitle" @click="reload()"><span :class="loading[activeTab] ? 'off' : 'ok'" />今日已更新 {{ todayCount }} 篇</span>
          <span class="glass-pill">下一份简报 <b class="num">{{ countdown }}</b></span>
        </div>
      </div>
      <div class="tabs">
        <button v-for="t in tabCards" :key="t.key" type="button" :class="['tab', { on: activeTab === t.key }]" @click="switchTab(t.key)">
          <i v-if="t.unread" class="new" />
          <div class="tab-h"><strong>{{ t.label }}</strong><span class="tab-en">{{ t.en }}</span></div>
          <p>{{ t.desc }}</p>
          <div class="tab-f"><span>{{ t.last }}</span><span><b>{{ t.count }}</b> 篇</span></div>
        </button>
      </div>
    </div></section>

    <div class="wrap body">
      <DelayedEmpty v-if="dataView.empty" resource="info" />

      <!-- ========== 盘前简报 ========== -->
      <section v-else-if="activeTab === 'premarket'" class="panel on">
        <div v-if="!brief" class="card empty-card">
          <div class="over">PRE-MARKET · 盘前简报</div>
          <strong>{{ loading.premarket ? '正在加载盘前简报…' : '暂无盘前简报' }}</strong>
          <p v-if="!loading.premarket">{{ errors.premarket || emptyHint }}</p>
          <button v-if="!loading.premarket" class="pbtn" type="button" @click="reload()">重新加载</button>
        </div>
        <template v-else>
          <div class="card">
            <div class="ph">
              <div><div class="over">PRE-MARKET · 盘前简报</div><h2>{{ brief.dateLabel || dayLabel(brief.date) }}</h2><div class="meta">{{ brief.date }} · 约 {{ readMinutes(brief) }} 分钟读完<template v-if="loadedAt.premarket"> · {{ loadedAt.premarket }} 同步</template></div></div>
              <div class="tools">
                <button class="pbtn" type="button" :disabled="!olderDate || loading.premarket" @click="openPremarket(olderDate)">‹ 前一份</button>
                <el-dropdown trigger="click" max-height="320px" :disabled="!dates.length" @command="openPremarket">
                  <button class="pbtn" type="button">日历 ▾</button>
                  <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="d in dates" :key="d" :command="d" :class="{ 'is-current': d === currentDate }">{{ dayLabel(d) }}</el-dropdown-item></el-dropdown-menu></template>
                </el-dropdown>
                <button class="pbtn" type="button" :disabled="!newerDate || loading.premarket" @click="openPremarket(newerDate)">后一份 ›</button>
                <button class="pbtn dark" type="button" @click="share">分享 ↗</button>
              </div>
            </div>
            <div v-if="brief.headline" class="lead"><small>一句话看盘前</small>{{ money(brief.headline) }}</div>
          </div>

          <div v-if="quotes.length" class="sec"><div class="sh"><h3>盘前行情</h3><span>粉涨青跌 · 港式配色</span></div>
            <div class="quotes"><div v-for="q in quotes" :key="q.name" class="q"><small>{{ q.name }}</small><b :class="q.colorValue ? q.tone : ''">{{ q.value }}<i>{{ q.suffix }}</i></b><em :class="q.tone">{{ q.change }}</em></div></div>
          </div>

          <div v-if="movers.groups.length || rate" class="sec grid2">
            <div v-if="movers.groups.length"><div class="sh"><h3>{{ brief.movers?.title || '盘前个股' }}</h3><span>{{ money(brief.movers?.sub) }}</span></div>
              <div class="box bars">
                <template v-for="g in movers.groups" :key="g.name">
                  <div class="grp">{{ g.name }}</div>
                  <div v-for="r in g.rows" :key="g.name + r.ticker" class="brow"><b>{{ r.ticker }}</b><div class="btrack"><i :style="r.style" /></div><em :class="r.tone">{{ r.pct }}</em><span v-if="r.note" class="nt">{{ r.note }}</span></div>
                </template>
                <div class="axis"><span>−{{ movers.max }}%</span><span>0</span><span>+{{ movers.max }}%</span></div>
              </div>
            </div>
            <div v-if="rate"><div class="sh"><h3>{{ rate.title }}</h3><span>{{ rate.sub }}</span></div>
              <div class="box">
                <div v-if="rate.prob !== null" class="big"><b>{{ rate.prob.toFixed(1) }}<i>%</i></b><div><strong>{{ rate.label }}的概率</strong><span>{{ rate.note }}</span></div></div>
                <template v-if="rate.prob !== null"><div class="prog"><i :style="{ width: rate.prob + '%' }" /></div><div class="ticks"><span>0</span><span>50%</span><span>100%</span></div></template>
                <template v-if="rate.chart">
                  <div class="sub-h">{{ rate.trendLabel || '概率变化' }}<span>{{ rate.trendNote }}</span></div>
                  <svg class="chart" viewBox="0 0 500 120">
                    <defs><linearGradient id="infv3-rate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00b8b8" stop-opacity=".25" /><stop offset="1" stop-color="#00b8b8" stop-opacity="0" /></linearGradient></defs>
                    <path :d="rate.chart.area" fill="url(#infv3-rate)" /><path :d="rate.chart.line" fill="none" stroke="var(--lb-accent)" stroke-width="2.2" />
                    <g v-for="m in rate.chart.marks" :key="m.text"><circle :cx="m.cx" :cy="m.cy" r="4" fill="#fff" stroke="var(--lb-accent)" stroke-width="2" /><text :x="m.cx" :y="m.cy - 10" :text-anchor="m.anchor" font-size="11" font-family="var(--lb-font-num)" fill="var(--lb-text-2)">{{ m.text }}</text></g>
                  </svg>
                </template>
                <template v-if="rate.later.length">
                  <div class="sub-h">{{ rate.laterLabel }}</div>
                  <div class="stack"><i v-for="l in rate.later" :key="l.label" :style="{ width: l.p + '%', background: l.color }" /></div>
                  <div class="legend"><span v-for="l in rate.later" :key="l.label"><i :style="{ background: l.color }" />{{ l.label }} <b>{{ l.p }}%</b></span></div>
                </template>
                <p v-if="rate.text" class="p">{{ money(rate.text) }}</p>
              </div>
            </div>
          </div>

          <div v-if="gap || valuation" class="sec grid2">
            <div v-if="gap"><div class="sh"><h3>{{ gap.title }}</h3><span>{{ gap.sub }}</span></div>
              <div class="box">
                <div v-for="b in gap.bars" :key="b.label" class="cmp"><span>{{ b.label }}</span><div class="tr"><i :style="{ width: b.width + '%', background: b.color }" /></div><b>{{ b.value }}</b></div>
                <template v-if="gap.gauge">
                  <div class="sub-h">股票比美债多出的收益<span>单位：基点（100 基点 = 1 个百分点）</span></div>
                  <div class="gauge"><div class="ln" /><div v-if="gap.gauge.norm" class="norm" :style="{ left: gap.gauge.norm.left + '%', width: gap.gauge.norm.width + '%' }" /><div class="zero" :style="{ left: gap.gauge.zero + '%' }" /><div class="now" :style="{ left: gap.gauge.now + '%' }" />
                    <label :style="{ left: Math.max(0, gap.gauge.now - 6) + '%', top: 0, color: gap.gauge.tone, fontWeight: 700 }">{{ gap.gauge.nowText }}</label><label :style="{ left: gap.gauge.zero - 1 + '%', top: '44px' }">0</label><label v-if="gap.gauge.norm" :style="{ left: gap.gauge.norm.left + '%', top: '44px' }">{{ gap.gauge.norm.text }}</label></div>
                </template>
                <div v-if="gap.stats.length" class="stats"><div v-for="s in gap.stats" :key="s.label"><small>{{ s.label }}</small><b>{{ s.value }}</b><em>{{ s.sub || '—' }}</em></div></div>
                <p v-if="gap.text" class="p">{{ money(gap.text) }}</p>
              </div>
            </div>
            <div v-if="valuation"><div class="sh"><h3>{{ valuation.title }}</h3><span>{{ valuation.sub }}</span></div>
              <div class="box">
                <template v-if="valuation.peChart">
                  <div class="sub-h" style="margin-top:0">远期 12 个月市盈率<span><b style="color:var(--lb-accent)">—</b> 市盈率　<b>- -</b> 5 年均值</span></div>
                  <svg class="chart" viewBox="0 0 500 130">
                    <template v-if="valuation.peChart.avgY !== null"><line x1="14" x2="486" :y1="valuation.peChart.avgY" :y2="valuation.peChart.avgY" stroke="var(--lb-text-4)" stroke-dasharray="4 4" /><text x="486" :y="valuation.peChart.avgY - 5" text-anchor="end" font-size="10" fill="var(--lb-text-3)">{{ valuation.peChart.avgText }}</text></template>
                    <path :d="valuation.peChart.line" fill="none" stroke="var(--lb-accent)" stroke-width="1.6" />
                    <text v-for="y in valuation.peChart.years" :key="y.text" :x="y.x" y="130" font-size="10" fill="var(--lb-text-4)">{{ y.text }}</text>
                  </svg>
                </template>
                <template v-if="valuation.epsChart">
                  <div class="sub-h">指数和远期 EPS（首期 = 100）<span><b style="color:var(--lb-text)">—</b> 标普 500　<b style="color:var(--lb-accent)">—</b> 远期 EPS</span></div>
                  <svg class="chart" viewBox="0 0 500 130">
                    <g v-for="g in valuation.epsChart.grid" :key="g.v"><line x1="14" x2="486" :y1="g.y" :y2="g.y" stroke="var(--lb-bg-2)" /><text x="500" :y="g.y + 3" text-anchor="end" font-size="10" fill="var(--lb-text-4)">{{ g.v }}</text></g>
                    <path :d="valuation.epsChart.spx" fill="none" stroke="var(--lb-text)" stroke-width="1.6" /><path :d="valuation.epsChart.eps" fill="none" stroke="var(--lb-accent)" stroke-width="1.8" />
                    <text v-for="y in valuation.epsChart.years" :key="y.text" :x="y.x" y="130" font-size="10" fill="var(--lb-text-4)">{{ y.text }}</text>
                  </svg>
                </template>
                <div v-if="valuation.stats?.length" class="stats"><div v-for="s in valuation.stats" :key="s.label"><small>{{ s.label }}</small><b>{{ s.value }}</b><em>{{ s.sub || '—' }}</em></div></div>
                <p v-if="valuation.text" class="p">{{ money(valuation.text) }}</p>
              </div>
            </div>
          </div>

          <div v-if="otherBlocks.length" class="sec grid2">
            <div v-for="b in otherBlocks" :key="b.type + b.title"><div class="sh"><h3>{{ b.title || '补充' }}</h3><span>{{ money(b.sub) }}</span></div><div class="box"><p class="p" style="margin-top:0">{{ money(b.note || b.body || '') }}</p></div></div>
          </div>

          <div v-if="news.length" class="sec"><div class="sh"><h3>要闻</h3><span>{{ news.length }} 条</span></div>
            <div class="news"><article v-for="n in news" :key="n.title" class="ncard"><div class="top"><span :class="['tag', n.cls]">{{ n.tag }}</span><time v-if="n.time">{{ n.time }}</time></div><h4>{{ n.title }}</h4><p>{{ n.body }}</p><div v-if="n.tickers.length" class="chips"><span v-for="t in n.tickers" :key="t" class="chip">{{ t }}</span></div></article></div>
          </div>
          <div class="foot-note">今天几点公布什么数据、哪些公司发财报，在 <router-link to="/today">今日</router-link> 页的「今日要闻」里。<br>数字为盘前整理，未另外核对；内容仅供研究参考，不构成投资建议。</div>
        </template>
      </section>

      <!-- ========== 财报解读 ========== -->
      <section v-else-if="activeTab === 'earnings'" class="panel on">
        <div v-if="!piece" class="card empty-card">
          <div class="over">EARNINGS · 财报解读</div>
          <strong>{{ loading.earnings ? '正在加载财报解读…' : '暂无财报解读' }}</strong>
          <p v-if="!loading.earnings">{{ errors.earnings || emptyHint }}</p>
          <button v-if="!loading.earnings" class="pbtn" type="button" @click="reload()">重新加载</button>
        </div>
        <template v-else>
          <div class="card">
            <div class="ph">
              <div><div class="over">EARNINGS REVIEW · 财报解读</div><h2>{{ piece.company }} {{ piece.period }}财报解读</h2><div class="meta"><span class="chip">{{ piece.ticker }}</span>　{{ piece.reportDate }} {{ piece.session }}<template v-if="piece.periodNote"> · {{ piece.periodNote }}</template><template v-if="implied"> · 期权定价 ±{{ implied }}%</template></div></div>
              <div class="tools">
                <button class="pbtn" type="button" :disabled="!olderPiece || loading.earnings" @click="openEarnings(olderPiece?.id)">‹ 上一篇<template v-if="olderPiece"> · {{ olderPiece.company }}</template></button>
                <el-dropdown trigger="click" max-height="320px" :disabled="!refs.length" @command="openEarnings">
                  <button class="pbtn" type="button">全部 ▾</button>
                  <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="r in refs" :key="r.id" :command="r.id" :class="{ 'is-current': r.id === piece.id }">{{ r.company }} · {{ r.ticker }} · {{ shortDay(r.reportDate) }}</el-dropdown-item></el-dropdown-menu></template>
                </el-dropdown>
                <button class="pbtn" type="button" :disabled="!newerPiece || loading.earnings" @click="openEarnings(newerPiece?.id)">下一篇 ›</button>
                <button class="pbtn dark" type="button" @click="share">分享 ↗</button>
              </div>
            </div>
            <div v-if="refs.length" class="rail-h">
              <button v-for="r in refs" :key="r.id" type="button" :class="['co', { on: r.id === piece.id }]" @click="openEarnings(r.id)"><strong>{{ r.company }}<span class="tag t-ac">解读</span></strong><small>{{ r.ticker }} · {{ shortDay(r.reportDate) }}</small></button>
            </div>
          </div>

          <div v-if="previews.length" class="sec"><div class="sh"><h3>财报前瞻</h3><span>大概会是什么样、大家盯什么、股价可能怎么走</span></div>
            <div class="grid3"><article v-for="p in previews" :key="p.id" class="pv"><div class="top"><span class="chip">{{ p.ticker }}</span>{{ p.when }}<span class="tag t-warn" style="margin-left:auto">前瞻</span></div><h4>{{ p.title }}</h4><p>{{ p.summary }}</p><div v-if="p.iv" class="iv">期权给的幅度 <b>{{ p.iv }}</b><span style="margin-left:auto">{{ p.median }}</span></div><a href="javascript:;" @click="previewOpen = previewOpen === p.id ? '' : p.id">{{ previewOpen === p.id ? '收起 ↑' : '看要点 →' }}</a>
              <div v-if="previewOpen === p.id" class="pv-more"><p v-if="p.lede">{{ p.lede }}</p><div v-for="f in p.facts" :key="f.label" class="kv1"><b>{{ f.label }} {{ f.value }}</b><span>{{ f.sub }}</span></div><ul v-if="p.verdicts.length"><li v-for="v in p.verdicts" :key="v">{{ v }}</li></ul></div>
            </article></div>
          </div>

          <div class="sec card art">
            <div v-if="piece.headline" class="lead" style="margin:0 0 4px"><small>这次财报一句话</small>{{ money(piece.headline) }}</div>

            <div v-if="about" class="sec"><div class="sh"><h3>{{ piece.company }}是做什么的</h3><span>给第一次看这家公司的人</span></div>
              <div class="box" style="background:var(--lb-bg);box-shadow:none"><strong style="font-size:16px">{{ about.oneLiner }}</strong>
                <div v-if="about.split.length" class="split"><i v-for="l in about.split" :key="l.name" :style="{ width: l.share + '%', background: l.color }" :title="`${l.name} ${l.share}%`" /></div>
                <div class="kv"><div v-for="l in about.lines" :key="l.name"><b :style="{ color: l.color }">●</b> <b>{{ l.name }}<template v-if="l.share !== null"> 约 {{ l.share }}%</template></b>　{{ l.what }}</div></div>
                <p v-if="about.text" class="p" style="margin-top:10px">{{ about.text }}</p></div></div>

            <div v-if="tiles.length" class="sec"><div class="sh"><h3>这份财报长什么样</h3><span>关键数字，对去年同期和市场预期</span></div>
              <div class="grid3 stat3 grid4">
                <div v-for="t in tiles" :key="t.name" class="box"><small>{{ t.name }}</small><div class="v"><b :class="{ long: t.value.length > 8 }">{{ t.value }}<i v-if="t.unit" class="unit">{{ t.unit }}</i></b><span :class="t.tone">{{ t.chg }}</span></div><p>{{ t.note }}</p></div>
              </div>
            </div>

            <div v-if="vsRows.length || revenue" class="sec grid2">
              <div v-if="vsRows.length"><div class="sh"><h3>{{ piece.vsGuide.title }}</h3><span>{{ piece.vsGuide.sub }}</span></div>
                <div class="box"><div class="vg-h"><span /><span>{{ piece.vsGuide.guideLabel || '预期' }}</span><span>实际</span><span /></div>
                  <div v-for="r in vsRows" :key="r.label" class="vg-r"><b>{{ r.label }}</b><span>{{ r.guide }}</span><strong>{{ r.actual }}</strong><span :class="['tag', r.tone]">{{ r.gap }}</span></div>
                  <p v-if="piece.vsGuide.note" class="p">{{ money(piece.vsGuide.note) }}</p></div></div>
              <div v-if="revenue"><div class="sh"><h3>{{ piece.trend.title }}</h3><span>{{ piece.trend.sub }}</span></div>
                <div class="box">
                  <svg class="chart" viewBox="0 0 500 170">
                    <line x1="10" x2="490" :y1="revenue.base" :y2="revenue.base" stroke="var(--lb-border)" />
                    <g v-for="b in revenue.bars" :key="b.q">
                      <rect :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="6" :fill="b.guide ? 'var(--lb-accent-soft)' : 'var(--lb-accent)'" :stroke="b.guide ? 'var(--lb-accent)' : 'none'" :stroke-dasharray="b.guide ? '4 3' : ''" />
                      <text :x="b.cx" :y="b.y - 6" text-anchor="middle" font-size="11" font-weight="700" font-family="var(--lb-font-num)" fill="var(--lb-text)">{{ b.rev }}</text>
                      <text :x="b.cx" y="152" text-anchor="middle" font-size="10" fill="var(--lb-text-3)">{{ b.q }}</text>
                      <text v-if="b.gm" :x="b.cx" y="166" text-anchor="middle" font-size="10" font-family="var(--lb-font-num)" fill="#b45309">{{ b.gm }}</text>
                    </g>
                  </svg>
                  <p class="ch-s" style="margin:4px 0 0">柱：收入（亿美元）；橙字：{{ piece.trend.gmLabel || '毛利率' }}<template v-if="revenue.bars.some(b => b.guide)">；虚线柱为{{ piece.trend.guideLabel || '指引' }}</template></p>
                  <p v-if="piece.trend.note" class="p">{{ money(piece.trend.note) }}</p></div></div>
            </div>

            <div v-if="points.length" class="sec"><div class="sh"><h3>电话会和财报要点</h3><span>{{ points.length }} 条</span></div>
              <div class="grid3 watch"><div v-for="p in points" :key="p.title" class="box"><span v-if="p.tag" class="tag t-info">{{ p.tag }}</span><h4>{{ money(p.title) }}</h4><p>{{ money(p.body) }}</p></div></div></div>

            <div v-if="sides" class="sec"><div class="sh"><h3>大家盯什么</h3><span>{{ sides.goodTitle }} / {{ sides.watchTitle }}</span></div>
              <div class="grid2">
                <div class="box"><h4 class="ch-h"><span class="tag t-up">利多</span> {{ sides.goodTitle }}</h4><div v-for="s in sides.good" :key="s.title" class="bb side"><b>{{ money(s.title) }}<em v-if="s.num" class="up">{{ money(s.num) }}</em></b><p>{{ money(s.body) }}</p></div></div>
                <div class="box"><h4 class="ch-h"><span class="tag t-ac">利空</span> {{ sides.watchTitle }}</h4><div v-for="s in sides.watch" :key="s.title" class="bb side"><b>{{ money(s.title) }}<em v-if="s.num" class="down">{{ money(s.num) }}</em></b><p>{{ money(s.body) }}</p></div></div>
              </div></div>

            <div v-if="learn" class="sec"><div class="sh"><h3>新手怎么看这份财报</h3><span>先看这几个数；不懂的词在下面的小抄里</span></div>
              <div v-if="learn.steps.length" class="grid3 learn"><div v-for="(s, i) in learn.steps" :key="s.metric" class="box"><span class="n">{{ i + 1 }}</span><h4>{{ s.metric }}</h4><p><b>是什么</b>{{ money(s.what) }}</p><p><b>为什么重要</b>{{ money(s.why) }}</p><p v-if="s.thisTime"><b>这一次</b>{{ money(s.thisTime) }}</p></div></div>
              <div v-if="learn.glossary.length" class="box" style="margin-top:16px;background:var(--lb-bg);box-shadow:none"><div class="sh" style="margin-bottom:10px"><h3 style="font-size:15px">名词小抄</h3></div><div class="gloss"><div v-for="g in learn.glossary" :key="g.term"><b>{{ g.term }}</b>{{ money(g.plain) }}</div></div></div></div>

            <div v-if="piece.reaction" class="sec"><div class="sh"><h3>{{ piece.reaction.title || '股价怎么走' }}</h3><span>{{ piece.reaction.sub }}</span></div>
              <div class="grid2">
                <div class="box">
                  <h4 class="ch-h">{{ piece.reaction.impliedText || '财报当天的涨跌' }}</h4><p class="ch-s">{{ piece.reaction.afterText }}</p>
                  <svg v-if="reaction" class="chart" viewBox="0 0 500 150">
                    <template v-if="reaction.band"><rect :x="reaction.band.x" y="30" :width="reaction.band.w" height="90" rx="8" fill="var(--lb-warn-soft)" /><text :x="reaction.band.cx" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="#b45309">{{ reaction.band.text }}</text></template>
                    <line x1="20" x2="480" y1="112" y2="112" stroke="var(--lb-border)" />
                    <circle v-for="(d, i) in reaction.dots" :key="i" :cx="d.cx" :cy="d.cy" r="5" :fill="d.fill"><title>{{ d.title }}</title></circle>
                    <template v-if="reaction.now"><line :x1="reaction.now.x" :x2="reaction.now.x" y1="28" y2="118" stroke="var(--lb-text)" stroke-width="2" /><text :x="reaction.now.x + 4" y="40" font-size="11" font-weight="700" fill="var(--lb-text)">{{ reaction.now.text }}</text></template>
                    <text v-for="t in reaction.ticks" :key="t.text" :x="t.x" y="140" text-anchor="middle" font-size="10" font-family="var(--lb-font-num)" fill="var(--lb-text-4)">{{ t.text }}</text>
                  </svg>
                  <p v-if="piece.reaction.historyText" class="ch-s" style="margin:6px 0 0">{{ money(piece.reaction.historyText) }}</p>
                </div>
                <div class="box">
                  <div v-if="piece.reaction.facts?.length" class="stats" style="margin-top:0;grid-template-columns:repeat(2,1fr)"><div v-for="f in piece.reaction.facts" :key="f.label"><small>{{ f.label }}</small><b :class="toneOf(f.value)">{{ money(f.value) }}</b><em>{{ money(f.sub) || '—' }}</em></div></div>
                  <template v-if="piece.reaction.analysts?.length"><div class="sub-h">分析师怎么说</div><div class="tl" style="padding:0;box-shadow:none"><div v-for="a in piece.reaction.analysts" :key="a.who" class="tl-r"><time>{{ a.who }}</time><span>{{ money(a.text) }}</span></div></div></template>
                </div>
              </div></div>

            <div v-if="nextSteps.length" class="sec"><div class="sh"><h3>接下来看什么</h3><span>时间节点</span></div>
              <div class="flow"><div v-for="n in nextSteps" :key="n.title"><b>{{ n.when }}</b><span>{{ n.title }}<template v-if="n.whenSub"> · {{ n.whenSub }}</template></span></div></div>
              <div class="grid3" style="margin-top:16px"><div v-for="n in nextSteps" :key="n.title + 'b'" class="box act wait"><h4>{{ n.title }}</h4><p>{{ money(n.body) }}</p></div></div></div>

            <details v-if="piece.reaction?.history?.length" class="box" style="margin-top:16px"><summary>数据附录：过去 {{ piece.reaction.history.length }} 次财报当天收盘涨跌</summary><div class="tbl-wrap"><table class="tbl"><tr><th>财报日</th><th>当天收盘</th></tr><tr v-for="h in piece.reaction.history" :key="h.date"><td>{{ h.date }}</td><td><span :class="h.pct >= 0 ? 'up' : 'down'">{{ signedPct(h.pct, 2) }}</span></td></tr></table></div></details>
            <div class="foot-note"><template v-for="n in (piece.notes || [])" :key="n">{{ money(n) }}<br></template>内容仅供研究参考，不构成投资建议。</div>
          </div>
        </template>
      </section>

      <!-- ========== 事件解读 ========== -->
      <section v-else-if="activeTab === 'events'" class="panel on">
        <div class="card">
          <div class="ph"><div><div class="over">EVENTS · 事件解读</div><h2>事件解读</h2></div></div>
          <p class="intro">影响持仓的大事件，一张图说清：事情怎么走的、钱在哪、股价怎么反应过、在哪些价位该做什么。</p>
          <div class="filters" style="margin-top:18px"><button class="fbtn on" type="button">全部<em>0</em></button></div>
          <div class="covers"><div class="empty">事件解读暂未接入数据，OSM 同步后会在这里显示。</div></div>
        </div>
        <div class="foot-note">内容仅供研究参考，不构成投资建议。</div>
      </section>

      <!-- ========== 札记 ========== -->
      <section v-else class="panel on">
        <div v-if="note" class="card note-detail">
          <div class="ph">
            <div><div class="over">NOTES · {{ note.kind || '札记' }}</div><h2>{{ note.title }}</h2><div class="meta">{{ mdLabel(note.date) }} · {{ note.kind }}</div></div>
            <div class="tools"><button class="pbtn" type="button" @click="openNote()">‹ 全部札记</button><button class="pbtn dark" type="button" @click="share">分享 ↗</button></div>
          </div>
          <p v-if="note.summary" class="intro">{{ note.summary }}</p>
          <div class="nd-img"><img :src="note.image" :alt="note.title" :style="{ aspectRatio: note.width && note.height ? `${note.width} / ${note.height}` : 'auto' }" loading="lazy"></div>
        </div>
        <div class="card">
          <div class="ph"><div><div class="over">NOTES · 札记</div><h2>{{ note ? '更多札记' : '札记' }}</h2></div><div class="tools"><button class="pbtn" type="button" @click="noteAsc = !noteAsc">{{ noteAsc ? '最早' : '最新' }} ▾</button></div></div>
          <p class="intro">我们怎么想卖方这件事、出了事怎么复盘、系统是怎么一步步改过来的，写下来的都放在这里。</p>
          <div class="filters" style="margin-top:18px"><button v-for="f in noteFilters" :key="f.key" type="button" :class="['fbtn', { on: f.key === noteKind }]" @click="noteKind = f.key">{{ f.key }}<em>{{ f.n }}</em></button></div>
          <div class="covers">
            <article v-for="n in shownNotes" :key="n.id" class="cv" @click="openNote(n.id)">
              <div class="cv-img has-img"><img v-if="n.cover" :src="n.cover" :alt="n.title" loading="lazy"><div v-else class="lab"><i>O</i>期权卖方策略研究实验室<span>{{ n.kind }}</span></div></div>
              <div class="cv-b"><div class="top"><b>{{ n.kind }}</b><time>{{ mdLabel(n.date) }}</time></div><h4>{{ n.title }}</h4><p>{{ n.summary }}</p><a class="more" href="javascript:;">阅读全文</a></div>
            </article>
            <div v-if="!shownNotes.length" class="empty">{{ loading.notes ? '正在加载札记…' : errors.notes || '暂无内容' }}</div>
          </div>
        </div>
        <div class="foot-note">内容仅供研究参考，不构成投资建议。</div>
      </section>
    </div>
  </div>
</template>

<script setup>
import DataViewTag from '@/components/option/DataViewTag.vue'
import DelayedEmpty from '@/components/option/DelayedEmpty.vue'
import { useDataView } from '@/utils/accessStore'
import { isHandledError } from '@/services/http'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getEarningsPage, getInfoFeed, getNotesPage, getPremarketPage } from '@/api/option/info'
import { dayLabel, feedSummary, findBlock, shortDay } from '@/utils/infoData'
import { aboutModel, guideRows, heroLine, kindFilters, mdLabel, money, moverGroups, newsCards, nextBriefCountdown, previewCards, quoteCards, rateModel, reactionChart, readMinutes, revenueChart, signedPct, tileCards, valuationModel, yieldGapModel } from '@/utils/infoDesk'

// 盘后版：标题旁标签 / 尚未放出空状态（W4）
const dataView = useDataView('info')

const sections = [
  { key: 'premarket', label: '盘前简报', en: 'PRE-MARKET', desc: '每个交易日开盘前一份' },
  { key: 'earnings', label: '财报解读', en: 'EARNINGS', desc: '发财报前有前瞻，出来后有解读' },
  { key: 'events', label: '事件解读', en: 'EVENTS', desc: '影响持仓的大事件，一张图说清怎么看怎么做' },
  { key: 'notes', label: '札记', en: 'NOTES', desc: '系统哲学、案例复盘和交易员札记' }
]
const TAB_KEYS = sections.map(s => s.key)
const route = useRoute()
const router = useRouter()

const activeTab = ref(TAB_KEYS.includes(route.query.tab) ? route.query.tab : 'premarket')
const premarket = ref(null)
const earnings = ref(null)
const notes = ref(null)
const infoFeed = ref(null)
const loading = reactive({ premarket: false, earnings: false, notes: false })
const errors = reactive({ premarket: '', earnings: '', notes: '' })
const loadedAt = reactive({ premarket: '', earnings: '', notes: '' })
const dataOf = key => ({ premarket, earnings, notes })[key]?.value
const emptyHint = '数据由后台定时从 OSM 同步；当前同步账号没有取到这一栏的内容（OSM 该栏目只对会员开放），同步到后会显示在这里。'

// ---- Hero：日期 / 时段 / 倒计时 ----
const now = ref(new Date())
let timer = null
const hero = computed(() => heroLine(now.value))
const countdown = computed(() => nextBriefCountdown(now.value))

// ---- 盘前简报 ----
const brief = computed(() => premarket.value?.brief || null)
const dates = computed(() => premarket.value?.dates || [])
const currentDate = computed(() => brief.value?.date || premarket.value?.missing || dates.value[0] || '')
const dateIndex = computed(() => dates.value.indexOf(currentDate.value))
const olderDate = computed(() => (dateIndex.value >= 0 ? dates.value[dateIndex.value + 1] : dates.value.find(d => d < currentDate.value)) || '')
const newerDate = computed(() => (dateIndex.value > 0 ? dates.value[dateIndex.value - 1] : dateIndex.value < 0 ? [...dates.value].reverse().find(d => d > currentDate.value) : '') || '')
const quotes = computed(() => quoteCards(brief.value))
const movers = computed(() => moverGroups(brief.value))
const rate = computed(() => rateModel(findBlock(brief.value, 'rate_path')))
const gap = computed(() => yieldGapModel(findBlock(brief.value, 'yield_gap')))
const valuation = computed(() => valuationModel(findBlock(brief.value, 'valuation_trend')))
const otherBlocks = computed(() => (brief.value?.blocks || []).filter(b => b && !['rate_path', 'yield_gap', 'valuation_trend'].includes(b.type) && (b.title || b.note)))
const news = computed(() => newsCards(brief.value))

// ---- 财报解读 ----
const piece = computed(() => earnings.value?.piece || null)
const refs = computed(() => earnings.value?.refs || [])
const previews = computed(() => previewCards(earnings.value?.previews))
const previewOpen = ref('')
const pieceIndex = computed(() => refs.value.findIndex(r => r.id === piece.value?.id))
const olderPiece = computed(() => (pieceIndex.value >= 0 ? refs.value[pieceIndex.value + 1] : null) || null)
const newerPiece = computed(() => (pieceIndex.value > 0 ? refs.value[pieceIndex.value - 1] : null) || null)
const implied = computed(() => (typeof piece.value?.reaction?.impliedPct === 'number' ? piece.value.reaction.impliedPct.toFixed(1) : ''))
const about = computed(() => aboutModel(piece.value?.about))
const tiles = computed(() => tileCards(piece.value))
const vsRows = computed(() => guideRows(piece.value?.vsGuide))
const revenue = computed(() => revenueChart(piece.value?.trend))
const points = computed(() => piece.value?.points || [])
const sides = computed(() => (piece.value?.sides && ((piece.value.sides.good || []).length || (piece.value.sides.watch || []).length) ? { goodTitle: '站得住的地方', watchTitle: '要留心的地方', good: [], watch: [], ...piece.value.sides } : null))
const learn = computed(() => { const l = piece.value?.learn; return l && ((l.steps || []).length || (l.glossary || []).length) ? { steps: l.steps || [], glossary: l.glossary || [] } : null })
const reaction = computed(() => reactionChart(piece.value?.reaction))
const nextSteps = computed(() => piece.value?.next || [])
const toneOf = v => (/^\s*\+/.test(v || '') ? 'up' : /^\s*[-−]/.test(v || '') ? 'down' : '')

// ---- 札记 ----
const note = computed(() => notes.value?.note || null)
const noteList = computed(() => notes.value?.notes || [])
const noteKind = ref('全部')
const noteAsc = ref(false)
const noteFilters = computed(() => kindFilters(noteList.value))
const shownNotes = computed(() => {
  const list = noteList.value.filter(n => noteKind.value === '全部' || n.kind === noteKind.value)
  return [...list].sort((a, b) => (noteAsc.value ? 1 : -1) * String(a.date || '').localeCompare(String(b.date || '')))
})

// ---- 栏目卡：最新日期 / 篇数 / 未读（信息流） ----
const feedStats = computed(() => feedSummary(infoFeed.value))
const todayCount = computed(() => (infoFeed.value?.items || []).filter(i => i.day === hero.value.day).length)
const tabCards = computed(() => sections.map(s => {
  const f = feedStats.value[s.key] || {}
  let last = '', count = 0
  if (s.key === 'premarket') { last = dates.value[0] ? dayLabel(dates.value[0]).split(' ')[0] : ''; count = dates.value.length }
  if (s.key === 'earnings') { last = refs.value[0] ? `${refs.value[0].ticker} · ${mdLabel(refs.value[0].reportDate)}` : ''; count = refs.value.length }
  if (s.key === 'events') { last = '暂未接入' }
  if (s.key === 'notes') { last = noteList.value[0] ? mdLabel(noteList.value[0].date) : ''; count = noteList.value.length }
  return { ...s, last: last || (f.latest ? mdLabel(f.latest) : loading[s.key] ? '加载中' : '暂无'), count: count || f.total || 0, unread: f.unread || 0 }
}))
const badgeTitle = computed(() => {
  const k = activeTab.value
  if (k === 'events') return '事件解读暂未接入'
  return errors[k] || (loadedAt[k] ? `OSM 同步数据 · ${loadedAt[k]} 加载；点击刷新` : '点击刷新')
})

const nowLabel = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

async function load(key, param) {
  const fetcher = { premarket: getPremarketPage, earnings: getEarningsPage, notes: getNotesPage }[key]
  if (!fetcher) return
  loading[key] = true
  try {
    const data = await fetcher(param)
    ;({ premarket, earnings, notes })[key].value = data
    errors[key] = ''
    loadedAt[key] = nowLabel()
  } catch (error) {
    const message = error.message || '加载失败'
    errors[key] = /暂无数据/.test(message) ? '' : message
    if (dataOf(key) && !isHandledError(error)) ElMessage.warning(errors[key])
  } finally {
    loading[key] = false
  }
}
async function loadFeed() {
  try { infoFeed.value = await getInfoFeed() } catch { infoFeed.value = null }
}

function syncQuery(patch) {
  const query = { ...route.query, ...patch }
  Object.keys(query).forEach(k => (query[k] === undefined || query[k] === null || query[k] === '') && delete query[k])
  router.replace({ query })
}
function switchTab(key) {
  if (key === activeTab.value) return
  activeTab.value = key
  syncQuery({ tab: key, d: undefined, id: undefined })
  if (!dataOf(key) && key !== 'events') load(key)
}
function openPremarket(date) {
  if (!date) return
  syncQuery({ tab: 'premarket', d: date === dates.value[0] ? undefined : date })
  load('premarket', date)
}
function openEarnings(id) {
  if (!id) return
  syncQuery({ tab: 'earnings', id })
  load('earnings', id)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function openNote(id) {
  syncQuery({ tab: 'notes', id: id || undefined })
  load('notes', id || undefined)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function currentParam(key) {
  if (key === 'premarket') return brief.value ? (currentDate.value === dates.value[0] ? undefined : currentDate.value) : route.query.d
  if (key === 'earnings') return piece.value?.id || route.query.id
  if (key === 'notes') return note.value?.id || route.query.id
  return undefined
}
function reload() {
  loadFeed()
  if (activeTab.value !== 'events') load(activeTab.value, currentParam(activeTab.value))
}
async function share() {
  try { await navigator.clipboard.writeText(window.location.href); ElMessage.success('链接已复制') } catch { ElMessage.info(window.location.href) }
}

watch(() => route.query.tab, tab => { if (TAB_KEYS.includes(tab) && tab !== activeTab.value) { activeTab.value = tab; if (!dataOf(tab) && tab !== 'events') load(tab) } })

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
  loadFeed()
  const tab = activeTab.value
  load('premarket', tab === 'premarket' ? route.query.d : undefined)
  load('earnings', tab === 'earnings' ? route.query.id : undefined)
  load('notes', tab === 'notes' ? route.query.id : undefined)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style src="./info-v3.css"></style>
