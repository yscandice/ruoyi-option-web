<template>
  <div class="info-page">
    <section class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-dot" />MARKET INTELLIGENCE</div>
        <h1>信息</h1>
        <p>盘前市场、公司财报与重要事件，一站整理。</p>
      </div>
      <div class="heading-actions">
        <span :class="['demo-badge', { live: badge.live, failed: badge.failed }]" :title="errors[activeTab] || ''"><i />{{ badge.text }}</span>
        <button class="date-button" type="button" :disabled="loading[activeTab]" @click="reload()"><el-icon :class="{ spinning: loading[activeTab] }"><Refresh /></el-icon><span>刷新</span></button>
      </div>
    </section>

    <nav class="info-tabs" aria-label="信息栏目">
      <button v-for="item in sections" :key="item.key" type="button" :class="['info-tab', { active: activeTab === item.key }]" @click="switchTab(item.key)">
        <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}<em v-if="feedStats[item.key]?.unread" class="tab-unread">{{ feedStats[item.key].unread }}</em></span><small>{{ tabHint(item) }}</small>
      </button>
    </nav>

    <!-- 无数据 / 加载失败 -->
    <section v-if="activeTab !== 'events' && showEmpty" class="other-section panel">
      <div class="other-head"><span class="other-icon"><el-icon><component :is="activeSection.icon" /></el-icon></span><div><div class="section-label">{{ activeSection.label }} <span>{{ activeSection.english }}</span></div><p>{{ activeSection.description }}</p></div></div>
      <div class="other-content">
        <div class="other-illustration"><el-icon v-if="!loading[activeTab]"><component :is="activeSection.icon" /></el-icon><el-icon v-else class="spinning"><Loading /></el-icon><span/><span/></div>
        <strong>{{ loading[activeTab] ? '正在加载数据' : '暂无数据' }}</strong>
        <p>{{ loading[activeTab] ? '正在从本地服务读取 OSM 同步数据…' : (errors[activeTab] || '后端定时任务尚未同步该栏目的数据，请稍后刷新。') }}</p>
        <span v-if="!loading[activeTab] && !errors[activeTab]" class="coming-label"><i/>首次部署请由管理员在若依后台「系统监控 → 定时任务」对「OSM信息菜单强制同步」执行一次</span>
      </div>
    </section>

    <!-- 盘前简报 -->
    <template v-else-if="activeTab === 'premarket'">
      <section class="brief-topline">
        <div class="brief-heading">
          <div class="brief-kicker">PRE-MARKET <span>·</span> 盘前简报</div>
          <h2>{{ brief?.dateLabel || dayLabel(premarket?.missing) || '—' }}</h2>
          <p>开盘前的市场脉搏、重点事件与当日观察</p>
        </div>
        <div class="brief-actions">
          <button class="date-button" type="button" :disabled="!olderDate" @click="openPremarket(olderDate)"><el-icon><ArrowLeft /></el-icon><span>前一份</span></button>
          <el-dropdown trigger="click" max-height="320px" @command="openPremarket">
            <div class="date-current clickable"><el-icon><Calendar /></el-icon>{{ currentDate === dates[0] ? `最新 · ${shortDay(currentDate)}` : shortDay(currentDate) || '选择日期' }}</div>
            <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="d in dates" :key="d" :command="d" :class="{ 'is-current': d === currentDate }">{{ dayLabel(d) }}</el-dropdown-item></el-dropdown-menu></template>
          </el-dropdown>
          <button class="date-button next-button" type="button" :disabled="!newerDate" @click="openPremarket(newerDate)"><span>后一份</span><el-icon><ArrowRight /></el-icon></button>
        </div>
      </section>

      <section v-if="!brief" class="panel missing-panel"><el-icon><Warning /></el-icon><div><strong>{{ premarket?.missing }} 没有盘前简报</strong><p>该日期可能是非交易日或尚未发布，可从日期列表选择其他交易日。</p></div></section>

      <template v-else>
        <section class="lead-brief">
          <div class="lead-icon"><el-icon><ChatLineRound /></el-icon></div>
          <div><div class="section-label">盘前摘要 <span>市场概览</span></div><p>{{ brief.headline }}</p></div>
          <span class="summary-mark">TODAY<br />BRIEF</span>
        </section>

        <section class="market-grid">
          <article class="panel quote-panel">
            <div class="panel-heading"><div><div class="section-label">盘前行情 <span>MARKET SNAPSHOT</span></div><p>主要资产与指数期货</p></div><span class="market-status"><i />盘前观察</span></div>
            <div class="quote-grid">
              <div v-for="item in quotes" :key="item.name" class="quote-item">
                <span class="quote-name">{{ item.name }}<template v-if="item.unit"> · {{ item.unit }}</template></span><strong>{{ item.value }}</strong>
                <span :class="['quote-change', item.tone]">{{ item.change }}</span>
              </div>
            </div>
          </article>

          <article class="panel stocks-panel">
            <div class="panel-heading"><div><div class="section-label">{{ brief.movers?.title || '盘前个股' }} <span>PRE-MARKET MOVERS</span></div><p>{{ brief.movers?.sub || '重点观察公司' }}</p></div><el-icon class="heading-icon"><TrendCharts /></el-icon></div>
            <div v-if="stockGroups.length" class="stock-groups">
              <div v-for="group in stockGroups" :key="group.name" class="stock-group">
                <div class="stock-group-name"><i :class="group.tone" />{{ group.name }}</div>
                <div class="stock-list">
                  <div v-for="stock in group.stocks" :key="stock.symbol" class="stock-row">
                    <strong>{{ stock.symbol }}</strong><span>{{ stock.name }}</span><b :class="stock.tone">{{ stock.change }}</b>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="panel-empty">当日没有盘前个股数据</p>
            <div class="scale-labels"><span>跌幅较大</span><span>涨跌幅</span><span>涨幅较大</span></div>
            <div class="scale-track"><i :style="{ marginLeft: `${moverPos}%` }" /></div>
          </article>
        </section>

        <section class="analysis-grid">
          <article class="panel rates-panel">
            <div class="panel-heading"><div><div class="section-label">利率与宏观 <span>RATES & MACRO</span></div><p>{{ rateBlock?.sub || '跟踪利率预期与重要经济数据' }}</p></div><span class="macro-tag">宏观观察</span></div>
            <template v-if="rateBlock">
              <div class="macro-summary"><div class="macro-copy"><span>{{ rateBlock.nextLabel }}</span><strong>{{ rateBlock.title }}</strong><p>{{ rateBlock.nextNote }}</p></div><div class="probability"><strong>{{ rateBlock.nextProb ?? '—' }}<small>%</small></strong><span>市场隐含概率</span></div></div>
              <div class="probability-chart" :aria-label="rateBlock.trendLabel">
                <div class="chart-grid"><i/><i/><i/><i/></div>
                <svg v-if="rateTrend.line" class="trend-svg" viewBox="0 0 100 60" preserveAspectRatio="none"><polyline :points="rateTrend.line" /></svg>
                <div class="trend-dots"><span v-for="(dot, i) in rateTrend.dots" :key="i" :style="{ left: `${dot.x}%`, top: `${dot.y / 60 * 100}%` }" :title="`${rateBlock.trend[i].d}：${dot.v}%`" /></div>
                <div class="chart-axis"><span v-for="label in rateAxis" :key="label">{{ label }}</span></div>
              </div>
              <div v-if="rateBlock.later?.items?.length" class="rate-outcomes"><div v-for="(item, i) in rateBlock.later.items.slice(0, 3)" :key="item.label"><span :class="['outcome-dot', ['neutral', 'blue', 'orange'][i]]"/><span>{{ item.label }}</span><strong>{{ item.p }}%</strong></div></div>
              <div class="panel-footnote"><el-icon><InfoFilled /></el-icon>{{ rateBlock.later?.label ? `${rateBlock.later.label} · ` : '' }}{{ rateBlock.trendNote || rateBlock.trendLabel }}</div>
              <p v-if="rateBlock.note" class="block-note">{{ rateBlock.note }}</p>
            </template>
            <p v-else class="panel-empty">当日简报没有利率预期模块</p>
          </article>

          <article class="panel valuation-panel">
            <div class="panel-heading"><div><div class="section-label">估值观察 <span>VALUATION WATCH</span></div><p>{{ gapBlock?.sub || '股票盈利收益率与长期利率' }}</p></div><el-icon class="heading-icon"><DataAnalysis /></el-icon></div>
            <template v-if="gapBlock || valuationBlock">
              <div v-if="gapBlock" class="valuation-compare">
                <div class="compare-metric"><span class="metric-dot blue"/><div><small>标普盈利收益率</small><strong>{{ gapBlock.earningsYield ?? '—' }}<em>%</em></strong></div></div>
                <span class="compare-vs">VS</span>
                <div class="compare-metric"><span class="metric-dot orange"/><div><small>10 年期美债收益率</small><strong>{{ gapBlock.bondYield ?? '—' }}<em>%</em></strong></div></div>
              </div>
              <div v-if="peBars.length" class="valuation-chart" :title="valuationBlock?.title"><div class="chart-ticks"><span>高</span><span>中</span><span>低</span></div><div class="valuation-bars"><i v-for="(h, i) in peBars" :key="i" :style="{ height: `${h}%` }"/></div></div>
              <div class="valuation-note"><span class="note-icon"><el-icon><Warning /></el-icon></span><p>{{ gapBlock?.title || valuationBlock?.title }}{{ valuationBlock?.sub ? `；${valuationBlock.sub}` : '' }}</p></div>
              <div v-if="gapBlock?.facts?.length" class="earnings-strip"><span v-for="fact in gapBlock.facts.slice(0, 3)" :key="fact.label">{{ fact.label }} <strong>{{ fact.value }}<small v-if="fact.sub"> {{ fact.sub }}</small></strong></span></div>
              <p v-if="gapBlock?.note" class="block-note">{{ gapBlock.note }}</p>
            </template>
            <p v-else class="panel-empty">当日简报没有估值模块</p>
          </article>
        </section>

        <section v-for="block in otherBlocks" :key="block.type" class="panel block-panel">
          <div class="panel-heading"><div><div class="section-label">{{ block.title }}</div><p>{{ block.sub }}</p></div></div>
          <div v-if="block.facts?.length" class="earnings-strip"><span v-for="fact in block.facts" :key="fact.label">{{ fact.label }} <strong>{{ fact.value }}</strong></span></div>
          <p v-if="block.note" class="block-note">{{ block.note }}</p>
        </section>

        <section class="panel news-panel">
          <div class="panel-heading"><div><div class="section-label">要闻 <span>WHAT MATTERS TODAY</span></div><p>影响市场与重点公司的信息摘要</p></div><span class="news-count">{{ news.length }} 条</span></div>
          <div class="news-grid">
            <article v-for="(item, index) in news" :key="item.title" class="news-item">
              <div class="news-meta"><span :class="['news-category', item.tone]">{{ item.category }}</span><span>{{ String(index + 1).padStart(2, '0') }}</span></div>
              <h3>{{ item.title }}</h3><p>{{ item.description }}</p>
              <div v-if="item.tickers.length" class="news-tickers"><span v-for="ticker in item.tickers" :key="ticker">{{ ticker }}</span></div>
            </article>
          </div>
        </section>
      </template>

      <p class="disclaimer"><el-icon><InfoFilled /></el-icon>数据来自 OSM 盘前简报，由后端定时同步；仅供参考，不构成投资建议。交易决策请结合可靠数据与自身风险承受能力。</p>
    </template>

    <!-- 财报解读 -->
    <template v-else-if="activeTab === 'earnings'">
      <section class="brief-topline">
        <div class="brief-heading">
          <div class="brief-kicker">EARNINGS <span>·</span> 财报解读</div>
          <h2>{{ piece ? `${piece.company} ${piece.ticker}` : earnings?.missing || '—' }}</h2>
          <p v-if="piece">{{ piece.period }}{{ piece.periodNote ? `（${piece.periodNote}）` : '' }} · {{ piece.reportDate }} {{ piece.session }}发布</p>
        </div>
        <div class="brief-actions">
          <button class="date-button" type="button" :disabled="!olderPiece" @click="openEarnings(olderPiece)"><el-icon><ArrowLeft /></el-icon><span>前一篇</span></button>
          <div class="date-current"><el-icon><Calendar /></el-icon>{{ pieceIndex >= 0 ? `${pieceIndex + 1} / ${refs.length}` : '—' }}</div>
          <button class="date-button next-button" type="button" :disabled="!newerPiece" @click="openEarnings(newerPiece)"><span>后一篇</span><el-icon><ArrowRight /></el-icon></button>
        </div>
      </section>

      <div class="ref-strip">
        <button v-for="ref in refs" :key="ref.id" type="button" :class="['ref-chip', { active: piece?.id === ref.id }]" @click="openEarnings(ref.id)"><strong>{{ ref.ticker }}</strong><span>{{ ref.company }}</span><small>{{ shortDay(ref.reportDate) }}</small></button>
      </div>

      <section v-if="!piece" class="panel missing-panel"><el-icon><Warning /></el-icon><div><strong>没有找到财报解读 {{ earnings?.missing }}</strong><p>可从上方列表选择其他公司。</p></div></section>

      <template v-else>
        <section class="lead-brief">
          <div class="lead-icon"><el-icon><TrendCharts /></el-icon></div>
          <div><div class="section-label">财报摘要 <span>{{ piece.ticker }}</span></div><p>{{ piece.headline }}</p></div>
          <span class="summary-mark">EARNINGS<br />BRIEF</span>
        </section>

        <section v-if="tiles.length" class="panel tiles-panel">
          <div class="panel-heading"><div><div class="section-label">核心指标 <span>KEY METRICS</span></div><p>本季关键财务数据与同比变化</p></div><span class="market-status"><i />{{ piece.session }}发布</span></div>
          <div class="quote-grid tile-grid">
            <div v-for="tile in tiles" :key="tile.name" class="quote-item">
              <span class="quote-name">{{ tile.name }}</span><strong>{{ tile.value }}<em v-if="tile.unit">{{ tile.unit }}</em></strong>
              <span :class="['quote-change', tile.tone]">{{ tile.change }}</span><small v-if="tile.note" class="tile-note">{{ tile.note }}</small>
            </div>
          </div>
        </section>

        <section class="analysis-grid">
          <article v-if="piece.vsGuide" class="panel">
            <div class="panel-heading"><div><div class="section-label">{{ piece.vsGuide.title }} <span>VS {{ piece.vsGuide.guideWord === '指引' ? 'GUIDANCE' : 'CONSENSUS' }}</span></div><p>{{ piece.vsGuide.sub }}</p></div><span class="macro-tag">{{ piece.vsGuide.guideLabel }}</span></div>
            <div class="guide-rows">
              <div v-for="row in piece.vsGuide.rows" :key="row.label" class="guide-row"><span>{{ row.label }}</span><small>{{ piece.vsGuide.guideWord }} {{ row.guideText }}</small><strong>{{ row.actualText }}</strong><b :class="gapTone(row.gapText)">{{ row.gapText }}</b></div>
            </div>
            <p v-if="piece.vsGuide.note" class="block-note">{{ piece.vsGuide.note }}</p>
          </article>

          <article v-if="piece.trend" class="panel">
            <div class="panel-heading"><div><div class="section-label">{{ piece.trend.title }} <span>TREND</span></div><p>{{ piece.trend.sub }}</p></div><el-icon class="heading-icon"><DataAnalysis /></el-icon></div>
            <div class="rev-bars"><div v-for="bar in revBars" :key="bar.q" :class="['rev-bar', { guide: bar.guide }]"><small>{{ bar.gm != null ? `${bar.gm}%` : '' }}</small><i :style="{ height: `${bar.height}%` }" /><b>{{ bar.rev }}</b><span>{{ bar.q }}</span></div></div>
            <div class="panel-footnote"><el-icon><InfoFilled /></el-icon>柱为收入，上方为{{ piece.trend.gmLabel || '毛利率' }}<template v-if="revBars.some(b => b.guide)">；浅色柱为{{ piece.trend.guideLabel }}</template></div>
            <p v-if="piece.trend.note" class="block-note">{{ piece.trend.note }}</p>
          </article>
        </section>

        <section v-if="piece.segments?.rows?.length" class="panel block-panel">
          <div class="panel-heading"><div><div class="section-label">{{ piece.segments.title }} <span>SEGMENTS</span></div><p>{{ piece.segments.sub }}</p></div></div>
          <div class="guide-rows"><div v-for="row in piece.segments.rows" :key="row.name" class="guide-row segment-row"><span>{{ row.name }}</span><small>环比 {{ signed(row.qoq, 0) }} · 毛利率 {{ row.gm }}%</small><strong>{{ row.rev }}</strong><b>占比 {{ row.share }}%</b></div></div>
          <p v-if="piece.segments.note" class="block-note">{{ piece.segments.note }}</p>
        </section>

        <section v-if="piece.points?.length" class="panel news-panel">
          <div class="panel-heading"><div><div class="section-label">电话会与要点 <span>KEY POINTS</span></div><p>管理层表态与值得关注的变化</p></div><span class="news-count">{{ piece.points.length }} 条</span></div>
          <div class="news-grid"><article v-for="(item, index) in piece.points" :key="item.title" class="news-item"><div class="news-meta"><span :class="['news-category', ['blue', 'purple', 'orange'][index % 3]]">{{ item.tag }}</span><span>{{ String(index + 1).padStart(2, '0') }}</span></div><h3>{{ item.title }}</h3><p>{{ item.body }}</p></article></div>
        </section>

        <section v-if="piece.sides" class="market-grid sides-grid">
          <article class="panel"><div class="panel-heading"><div><div class="section-label">{{ piece.sides.goodTitle }} <span>STRENGTHS</span></div></div><span class="side-tag up">利好</span></div><div class="side-list"><div v-for="item in piece.sides.good" :key="item.title" class="side-item"><div><strong>{{ item.title }}</strong><b class="up">{{ item.num }}</b></div><p>{{ item.body }}</p></div></div></article>
          <article class="panel"><div class="panel-heading"><div><div class="section-label">{{ piece.sides.watchTitle }} <span>WATCH</span></div></div><span class="side-tag down">留意</span></div><div class="side-list"><div v-for="item in piece.sides.watch" :key="item.title" class="side-item"><div><strong>{{ item.title }}</strong><b class="down">{{ item.num }}</b></div><p>{{ item.body }}</p></div></div></article>
        </section>

        <section v-if="piece.reaction" class="panel reaction-panel">
          <div class="panel-heading"><div><div class="section-label">{{ piece.reaction.title }} <span>MARKET REACTION</span></div><p>{{ piece.reaction.sub }}</p></div><span class="macro-tag">{{ piece.reaction.impliedText }}</span></div>
          <div class="quote-grid reaction-facts"><div v-for="fact in piece.reaction.facts" :key="fact.label" class="quote-item"><span class="quote-name">{{ fact.label }}</span><strong :class="toneOfText(fact.value)">{{ fact.value }}</strong><span class="quote-change muted">{{ fact.sub }}</span></div></div>
          <div v-if="reaction.dots.length" class="reaction-axis">
            <div class="axis-track"><i v-if="reaction.implied" class="implied-band" :style="{ left: `${reaction.implied.lo}%`, width: `${reaction.implied.hi - reaction.implied.lo}%` }"/><span v-for="dot in reaction.dots" :key="dot.date" :class="['history-dot', { out: dot.out }]" :style="{ left: `${dot.left}%` }" :title="`${dot.date}：${signed(dot.pct, 2)}`"/><b v-if="reaction.now != null" class="now-dot" :style="{ left: `${reaction.now}%` }" :title="piece.reaction.afterText"/></div>
            <div class="chart-axis static-axis"><span>-{{ reaction.axis }}%</span><span>{{ piece.reaction.dayLabel }} · <b>{{ piece.reaction.nowLabel }} {{ piece.reaction.afterText }}</b></span><span>+{{ reaction.axis }}%</span></div>
          </div>
          <p v-if="piece.reaction.historyText" class="block-note">{{ piece.reaction.historyText }}</p>
          <div v-if="piece.reaction.analysts?.length" class="analyst-list"><div v-for="item in piece.reaction.analysts" :key="item.who" class="analyst-item"><strong>{{ item.who }}</strong><p>{{ item.text }}</p></div></div>
        </section>

        <section v-if="piece.next?.length" class="panel news-panel">
          <div class="panel-heading"><div><div class="section-label">接下来看什么 <span>WHAT'S NEXT</span></div><p>后续值得跟踪的时间点</p></div></div>
          <div class="news-grid"><article v-for="item in piece.next" :key="item.title" class="news-item"><div class="news-meta"><span class="news-category orange">{{ item.when }}</span><span>{{ item.whenSub }}</span></div><h3>{{ item.title }}</h3><p>{{ item.body }}</p></article></div>
        </section>

        <section v-if="piece.about" class="analysis-grid">
          <article class="panel"><div class="panel-heading"><div><div class="section-label">公司是做什么的 <span>ABOUT</span></div><p>{{ piece.about.oneLiner }}</p></div></div><div class="guide-rows"><div v-for="line in piece.about.lines" :key="line.name" class="guide-row about-row"><span>{{ line.name }}</span><small>{{ line.what }}</small><b>{{ line.share }}%</b></div></div><p v-if="piece.about.typeNote" class="block-note">{{ piece.about.typeNote }}</p></article>
          <article v-if="piece.learn" class="panel"><div class="panel-heading"><div><div class="section-label">读懂这份财报 <span>LEARN</span></div><p>关键指标与术语</p></div></div><div class="side-list"><div v-for="step in piece.learn.steps" :key="step.metric" class="side-item"><div><strong>{{ step.metric }}</strong><b>{{ step.thisTime }}</b></div><p>{{ step.what }}{{ step.why }}</p></div></div><div v-if="piece.learn.glossary?.length" class="glossary"><span v-for="g in piece.learn.glossary" :key="g.term" :title="g.plain">{{ g.term }}</span></div></article>
        </section>
      </template>

      <section v-if="previews.length" class="panel news-panel">
        <div class="panel-heading"><div><div class="section-label">财报前瞻 <span>PREVIEWS</span></div><p>即将或刚刚公布财报的公司</p></div><span class="news-count">{{ previews.length }} 篇</span></div>
        <div class="news-grid preview-grid"><article v-for="item in previews" :key="item.id" class="news-item"><div class="news-meta"><span class="news-category purple">{{ item.ticker }}</span><span>{{ item.reportDate }} {{ item.session }}</span></div><h3>{{ item.title }}</h3><p>{{ item.summary }}</p><ul v-if="item.share?.verdicts?.length" class="verdicts"><li v-for="v in item.share.verdicts" :key="v">{{ v }}</li></ul></article></div>
      </section>

      <p class="disclaimer"><el-icon><InfoFilled /></el-icon>{{ piece?.notes?.length ? piece.notes.join('；') : '数据来自 OSM 财报解读，由后端定时同步；仅供参考，不构成投资建议。' }}</p>
    </template>

    <!-- 札记 -->
    <template v-else-if="activeTab === 'notes'">
      <section class="brief-topline">
        <div class="brief-heading">
          <div class="brief-kicker">NOTES <span>·</span> 札记</div>
          <h2>{{ note ? note.title : '交易员札记' }}</h2>
          <p>{{ note ? `${note.kind} · ${note.date}` : '系统哲学、案例复盘与交易观察' }}</p>
        </div>
        <div class="brief-actions">
          <button v-if="note" class="date-button" type="button" @click="openNote(null)"><el-icon><ArrowLeft /></el-icon><span>返回列表</span></button>
          <div class="date-current"><el-icon><Notebook /></el-icon>共 {{ noteList.length }} 篇</div>
        </div>
      </section>

      <section v-if="note" class="panel note-detail">
        <p class="note-summary">{{ note.summary }}</p>
        <img :src="note.image" :alt="note.title" :style="{ aspectRatio: note.width && note.height ? `${note.width} / ${note.height}` : 'auto' }" loading="lazy" />
      </section>
      <section v-else-if="notes?.missing" class="panel missing-panel"><el-icon><Warning /></el-icon><div><strong>没有找到札记 {{ notes.missing }}</strong><p>可从下方列表选择其他札记。</p></div></section>

      <section v-if="!note" class="note-grid">
        <article v-for="item in noteList" :key="item.id" class="panel note-card" tabindex="0" @click="openNote(item.id)" @keyup.enter="openNote(item.id)">
          <div class="note-cover"><img :src="item.cover" :alt="item.title" loading="lazy" /></div>
          <div class="news-meta"><span class="news-category blue">{{ item.kind }}</span><span>{{ item.date }}</span></div>
          <h3>{{ item.title }}</h3><p>{{ item.summary }}</p>
        </article>
      </section>

      <p class="disclaimer"><el-icon><InfoFilled /></el-icon>札记来自 OSM，由后端定时同步；图片直接加载自 osmtrade.com。</p>
    </template>

    <!-- 事件解读：接口文档暂未提供 -->
    <section v-else class="other-section panel">
      <div class="other-head"><span class="other-icon"><el-icon><component :is="activeSection.icon" /></el-icon></span><div><div class="section-label">{{ activeSection.label }} <span>{{ activeSection.english }}</span></div><p>{{ activeSection.description }}</p></div></div>
      <div class="other-content"><div class="other-illustration"><el-icon><component :is="activeSection.icon" /></el-icon><span/><span/></div><strong>{{ activeSection.emptyTitle }}</strong><p>{{ activeSection.emptyDescription }}</p><span class="coming-label"><i/>后端暂未提供事件解读接口</span></div>
    </section>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Calendar, ChatLineRound, DataAnalysis, InfoFilled, Loading, Notebook, Refresh, TrendCharts, Warning } from '@element-plus/icons-vue'
import { getEarningsPage, getInfoFeed, getNotesPage, getPremarketPage } from '@/api/option/info'
import { dayLabel, earningsTiles, feedSummary, findBlock, moversPosition, premarketMovers, premarketQuotes, premarketStories, reactionDots, shortDay, signed, trendBars, trendPath, valuationBars } from '@/utils/infoData'

const sections = [
  { key: 'premarket', label: '盘前简报', hint: '每日市场摘要', english: 'PRE-MARKET', icon: ChatLineRound, description: '开盘前的市场脉搏、重点事件与当日观察。' },
  { key: 'earnings', label: '财报解读', hint: '业绩与波动观察', english: 'EARNINGS', icon: TrendCharts, description: '围绕财报前瞻、业绩结果与期权波动整理观察。' },
  { key: 'events', label: '事件解读', hint: '重要事件梳理', english: 'EVENTS', icon: DataAnalysis, description: '梳理可能影响市场与持仓的重要事件及关注方向。', emptyTitle: '重要事件观察', emptyDescription: '影响市场与持仓的宏观事件和公司事件将在这里集中解读。' },
  { key: 'notes', label: '札记', hint: '案例与交易思考', english: 'NOTES', icon: Notebook, description: '沉淀系统思路、案例复盘与交易观察。' }
]
const TAB_KEYS = sections.map(s => s.key)
const route = useRoute()
const router = useRouter()

const activeTab = ref(TAB_KEYS.includes(route.query.tab) ? route.query.tab : 'premarket')
const activeSection = computed(() => sections.find(item => item.key === activeTab.value) || sections[0])
const premarket = ref(null)
const earnings = ref(null)
const notes = ref(null)
const infoFeed = ref(null)
const loading = reactive({ premarket: false, earnings: false, notes: false, events: false })
const errors = reactive({ premarket: '', earnings: '', notes: '', events: '' })
const loadedAt = reactive({ premarket: '', earnings: '', notes: '' })
const dataOf = key => ({ premarket, earnings, notes })[key]?.value

// ---- 盘前简报 ----
const brief = computed(() => premarket.value?.brief || null)
const dates = computed(() => premarket.value?.dates || [])
const currentDate = computed(() => brief.value?.date || premarket.value?.missing || dates.value[0] || '')
const dateIndex = computed(() => dates.value.indexOf(currentDate.value))
const olderDate = computed(() => (dateIndex.value >= 0 ? dates.value[dateIndex.value + 1] : dates.value.find(d => d < currentDate.value)) || '')
const newerDate = computed(() => (dateIndex.value > 0 ? dates.value[dateIndex.value - 1] : dateIndex.value < 0 ? [...dates.value].reverse().find(d => d > currentDate.value) : '') || '')
const quotes = computed(() => premarketQuotes(brief.value))
const stockGroups = computed(() => premarketMovers(brief.value))
const moverPos = computed(() => moversPosition(brief.value))
const news = computed(() => premarketStories(brief.value))
const rateBlock = computed(() => findBlock(brief.value, 'rate_path'))
const gapBlock = computed(() => findBlock(brief.value, 'yield_gap'))
const valuationBlock = computed(() => findBlock(brief.value, 'valuation_trend'))
const otherBlocks = computed(() => (brief.value?.blocks || []).filter(b => !['rate_path', 'yield_gap', 'valuation_trend'].includes(b?.type)))
const rateTrend = computed(() => trendPath(rateBlock.value?.trend))
const rateAxis = computed(() => {
  const trend = rateBlock.value?.trend || []
  if (trend.length < 3) return trend.map(t => t.d)
  return [trend[0].d, trend[Math.floor(trend.length / 2)].d, trend[trend.length - 1].d]
})
const peBars = computed(() => valuationBars(valuationBlock.value))

// ---- 财报解读 ----
const piece = computed(() => earnings.value?.piece || null)
const refs = computed(() => earnings.value?.refs || [])
const previews = computed(() => earnings.value?.previews || [])
const pieceIndex = computed(() => refs.value.findIndex(r => r.id === piece.value?.id))
const olderPiece = computed(() => (pieceIndex.value >= 0 ? refs.value[pieceIndex.value + 1]?.id : '') || '')
const newerPiece = computed(() => (pieceIndex.value > 0 ? refs.value[pieceIndex.value - 1]?.id : '') || '')
const tiles = computed(() => earningsTiles(piece.value))
const revBars = computed(() => trendBars(piece.value?.trend))
const reaction = computed(() => reactionDots(piece.value?.reaction))
const gapTone = text => (/^(低|少|差|弱|不及)/.test(text || '') ? 'gap-down' : '')
const toneOfText = text => (/^\s*\+/.test(text || '') ? 'up' : /^\s*[-−]/.test(text || '') ? 'down' : '')

// ---- 札记 ----
const note = computed(() => notes.value?.note || null)
const noteList = computed(() => notes.value?.notes || [])

// ---- 信息流（栏目未读 / 最新日期） ----
const feedStats = computed(() => feedSummary(infoFeed.value))
function tabHint(item) {
  if (item.key === 'premarket' && dates.value[0]) return `最新 ${shortDay(dates.value[0])} · 共 ${dates.value.length} 期`
  if (item.key === 'earnings' && refs.value.length) return `最新 ${refs.value[0].ticker} · 共 ${refs.value.length} 篇`
  if (item.key === 'notes' && noteList.value.length) return `共 ${noteList.value.length} 篇札记`
  return item.hint
}

const showEmpty = computed(() => !dataOf(activeTab.value))
const badge = computed(() => {
  const key = activeTab.value
  if (key === 'events') return { text: '暂无接口', live: false }
  if (loading[key] && !dataOf(key)) return { text: '正在加载', live: false }
  if (!dataOf(key)) return { text: '暂无数据', failed: true }
  return { text: `OSM 同步数据${loadedAt[key] ? ` · ${loadedAt[key]}` : ''}`, live: true }
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
    if (dataOf(key)) ElMessage.warning(errors[key])
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

watch(() => route.query.tab, tab => { if (TAB_KEYS.includes(tab) && tab !== activeTab.value) { activeTab.value = tab; if (!dataOf(tab)) load(tab) } })

onMounted(() => {
  loadFeed()
  const tab = activeTab.value
  load('premarket', tab === 'premarket' ? route.query.d : undefined)
  load('earnings', tab === 'earnings' ? route.query.id : undefined)
  load('notes', tab === 'notes' ? route.query.id : undefined)
})
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
.heading-actions{display:flex;align-items:center;gap:7px}.heading-actions .date-button{height:30px}.demo-badge.live i{background:#58b88a;box-shadow:0 0 0 3px #58b88a1a}.demo-badge.failed{color:#c47a54;border-color:#f2e2d6}.demo-badge.failed i{background:#e1a054}.date-button:disabled{cursor:not-allowed;opacity:.45}.date-button:disabled:hover{border-color:var(--line);color:#71849a}.date-current.clickable{cursor:pointer}.date-current.clickable:hover{border-color:#c6dbf2}.spinning{animation:info-spin 1s linear infinite}@keyframes info-spin{to{transform:rotate(360deg)}}
.tab-unread{display:inline-block;min-width:14px;margin-left:5px;padding:0 4px;border-radius:7px;background:#e76c6c;color:#fff;font-size:8px;font-style:normal;line-height:14px;text-align:center}
.panel-empty{margin:18px 0;color:#a4afbc;font-size:9px;text-align:center}.block-note{margin:10px 0 0;color:#8a9aab;font-size:9px;line-height:1.65}.block-panel{margin-bottom:13px}.news-count{color:#a3b0bf;font-size:9px}
.missing-panel{display:flex;align-items:center;gap:10px;margin-bottom:13px;color:#c78b40}.missing-panel strong{color:#506b89;font-size:11px}.missing-panel p{margin:4px 0 0;color:#97a5b4;font-size:9px}

.probability-chart .trend-svg{position:absolute;left:0;right:0;top:0;width:100%;height:calc(100% - 15px);overflow:visible}.trend-svg polyline{fill:none;stroke:#4f91d0;stroke-width:2;vector-effect:non-scaling-stroke;stroke-linejoin:round}.trend-dots{position:absolute;left:0;right:0;top:0;height:calc(100% - 15px)}.trend-dots span{position:absolute;width:6px;height:6px;margin:-3px 0 0 -3px;border:2px solid #fff;border-radius:50%;background:#4c8fce;box-shadow:0 0 0 1px #4c8fce}
.earnings-strip small{color:#9aa8b7;font-size:8px;font-weight:500}
.ref-strip{display:flex;gap:6px;margin:0 0 13px;padding:6px;overflow-x:auto;background:#fff;border:1px solid var(--line);border-radius:11px}.ref-chip{flex:none;display:flex;align-items:baseline;gap:5px;padding:7px 10px;border:0;border-radius:8px;background:transparent;color:#71839a;cursor:pointer}.ref-chip:hover{background:#f6f9fd}.ref-chip.active{background:#edf5ff;color:#2e72bb}.ref-chip strong{font-size:11px}.ref-chip span{font-size:9px}.ref-chip small{color:#a3b0bf;font-size:8px}
.tiles-panel{margin-bottom:13px}.tile-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.quote-item strong em{margin-left:2px;color:#8a9aab;font-size:10px;font-style:normal;font-weight:600}.tile-note{color:#a7b2bf;font-size:8px}.quote-item strong.up{color:#299972}.quote-item strong.down{color:#d66767}
.guide-rows{display:flex;flex-direction:column;gap:6px}.guide-row{display:grid;grid-template-columns:80px 1fr auto auto;align-items:center;gap:9px;padding:8px 10px;border:1px solid #eff3f7;border-radius:7px;background:#fcfdff}.guide-row span{color:#426080;font-size:10px;font-weight:700}.guide-row small{color:#9aa8b7;font-size:9px}.guide-row strong{color:#415a76;font-size:11px}.guide-row b{min-width:62px;padding:3px 6px;border-radius:4px;background:#eef8f3;color:#299972;font-size:9px;text-align:center}.guide-row b.gap-down{background:#fdf0f0;color:#d66767}.about-row{grid-template-columns:70px 1fr auto}.about-row b{background:#edf5ff;color:#3d82c8}.segment-row b{background:#f3efff;color:#8975c2}
.rev-bars{height:150px;display:flex;align-items:flex-end;gap:10px;padding:0 6px 4px;border-bottom:1px solid #e9eff5}.rev-bar{flex:1;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px}.rev-bar small{color:#c78b40;font-size:8px}.rev-bar i{width:60%;max-width:34px;border-radius:5px 5px 1px 1px;background:linear-gradient(180deg,#7fb0df,#d7e7f7)}.rev-bar.guide i{background:repeating-linear-gradient(45deg,#e3eef9,#e3eef9 4px,#f4f8fc 4px,#f4f8fc 8px);border:1px dashed #9fc2e6}.rev-bar b{color:#45617f;font-size:9px}.rev-bar span{color:#a2afbd;font-size:8px;white-space:nowrap}
.sides-grid{grid-template-columns:1fr 1fr}.side-tag{padding:4px 7px;border-radius:5px;font-size:8px}.side-tag.up{background:#eef8f3;color:#299972}.side-tag.down{background:#fdf0f0;color:#d66767}.side-list{display:flex;flex-direction:column;gap:7px}.side-item{padding:9px 10px;border:1px solid #eff3f7;border-radius:8px;background:#fcfdff}.side-item>div{display:flex;justify-content:space-between;gap:8px}.side-item strong{color:#405a77;font-size:10px}.side-item b{color:#5c7490;font-size:9px;text-align:right}.side-item b.up{color:#299972}.side-item b.down{color:#d66767}.side-item p{margin:5px 0 0;color:#929faf;font-size:9px;line-height:1.55}
.reaction-panel{margin-bottom:13px}.reaction-facts{grid-template-columns:repeat(4,minmax(0,1fr))}.reaction-axis{margin:16px 4px 0}.axis-track{position:relative;height:26px;border-radius:6px;background:#f6f9fd}.implied-band{position:absolute;top:0;bottom:0;background:#e3eefa;border-left:1px dashed #9fc2e6;border-right:1px dashed #9fc2e6}.history-dot{position:absolute;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#9fb5cc;opacity:.85}.history-dot.out{background:#e1a054}.now-dot{position:absolute;top:2px;bottom:2px;width:3px;margin-left:-1px;border-radius:2px;background:#d66767}.static-axis{position:static;margin-top:6px}.static-axis b{color:#d66767;font-weight:650}.analyst-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.analyst-item{padding:9px 10px;border-radius:8px;background:#f7f9fc}.analyst-item strong{color:#426080;font-size:10px}.analyst-item p{margin:5px 0 0;color:#8a9aab;font-size:9px;line-height:1.55}
.glossary{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}.glossary span{padding:4px 7px;border-radius:4px;background:#f0f4f8;color:#6f849b;font-size:8px;cursor:help}.preview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.verdicts{margin:9px 0 0;padding-left:14px;color:#7f91a8;font-size:8px;line-height:1.7}
.note-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-bottom:13px}.note-card{display:flex;flex-direction:column;cursor:pointer;transition:border-color .16s,box-shadow .16s}.note-card:hover,.note-card:focus{border-color:#c6dbf2;box-shadow:0 6px 18px #203f6214;outline:none}.note-cover{height:150px;margin:-15px -16px 12px;overflow:hidden;border-radius:12px 12px 0 0;background:#f0f5fb}.note-cover img{width:100%;height:100%;object-fit:cover;display:block}.note-card h3{margin:10px 0 6px;color:#405a77;font-size:12px;line-height:1.4}.note-card p{margin:0;color:#929faf;font-size:9px;line-height:1.6}
.note-detail{margin-bottom:13px;text-align:center}.note-summary{max-width:720px;margin:2px auto 14px;color:#71849a;font-size:11px;line-height:1.7;text-align:left}.note-detail img{display:block;width:100%;max-width:720px;margin:0 auto;border-radius:9px;background:#f0f5fb}
@media(max-width:900px){.tile-grid,.reaction-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.note-grid{grid-template-columns:1fr 1fr}.analyst-list{grid-template-columns:1fr}}
@media(max-width:650px){.page-heading{flex-wrap:wrap;gap:10px}.sides-grid,.preview-grid,.note-grid{grid-template-columns:1fr}.guide-row{grid-template-columns:1fr auto;row-gap:4px}.guide-row small{grid-column:1/3;grid-row:2}.rev-bars{gap:5px}}
</style>
