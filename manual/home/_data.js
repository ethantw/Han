/**
 * Homepage i18n dictionary — site-level copy for the v4 landing page.
 *
 * Sourced from Claude Design's `漢.css v4 — 方向 B v2` (see
 * `docs/plans/homepage-b-v2.md`). Five locales: zh-Hant / zh-Hans / EN / ja / ko.
 *
 * Locale slugs follow `_nav.js` conventions (`hant` is the default at `/`).
 * Sections like `hero`, `features`, etc., are populated by their respective
 * build tasks (T8–T11). Stub strings shipped alongside the scaffold.
 */

// Locale metadata is defined in `manual/_locales.js` (single source of
// truth shared with the docs chrome). Re-export under HOME_* names so
// the homepage build pipeline (`vite.config.js`) can keep its existing
// imports.
import {
  DEFAULT_LOCALE, ALL_LOCALES, HTML_LANG, LOCALE_LABELS,
} from '../_locales.js'

export const HOME_LOCALE_SLUGS = ALL_LOCALES
export const HOME_DEFAULT_LOCALE = DEFAULT_LOCALE
export const HOME_HTML_LANG = HTML_LANG
export const HOME_LOCALE_LABELS = LOCALE_LABELS

export const HOME_I18N = {
  hant: {
    siteTitle: '漢.css・像素間的活字美學',
    description: '像素間的活字美學，為螢幕上的每一個漢字。',
    docs: '文檔', langSwitcherLabel: '切換語言・LANGUAGE',
    langSwitcherFoot: '站本身切換 5 種語言・操場可獨立選任一語言範文',
    themeToggle: '切換主題',
    pgMetricsLabel: '度量',
    pgSliderSize: '字級', pgSliderSizeEn: 'font-size',
    pgSliderLeading: '行距', pgSliderLeadingEn: 'line-height',
    pgSliderWeight: '字重', pgSliderWeightEn: 'font-weight',
    pgWritingLabel: '書寫方向', pgWritingHorizontal: '橫排', pgWritingVertical: '直排',

    pgGrpModules: '模組', pgGrpSemantics: '語意樣式標準化', pgGrpProse: '長文段落間距調整',
    pgProseScope: '作用選擇器', pgProseScopeHint: '僅影響生成碼',
    pgCiteMarks: '書名號',
    pgCiteBracket: '《》乙式', pgCiteWavy: '﹏甲式',
    pgEmSymbol: '著重號', pgEmPosition: '著重號位置',
    pgEmCircle: '圈', pgEmDot: '點', pgEmSesame: '芝麻點', pgEmTriangle: '三角',
    pgEmPosAuto: '自動', pgEmPosUnder: '字下', pgEmPosOver: '字上',
    pgGrpLines: '行的調整',
    pgTogHangNew: '標點懸掛',
    pgTogSqueeze: '標點擠壓',
    pgTogAutospace: '跨文種混排間隙',
    pgAutospaceMode: '進階模式',
    pgGrpFonts: '字體',
    pgHeritage: '傳承字形',
    pgGrpHeritage: '繁體專項',
    pgBaseGeneric: '默認字體',
    pgHeritageFamily: '印刷字體',
    pgFamShanggu: '尚古', pgFamGenki: '源起', pgCursiveFamily: '楷體家族', pgFamLxgw: '霞鶩文楷TC', pgFamIansui: '芫荽',
    pgWebfontDelivery: 'Web字體來源', pgDeliveryNone: '不使用', pgWebfontCdnSource: 'CDN來源',
    pgCursive: '楷體',
    pgModeWebfont: 'Web字體', pgModeSystem: '系統字體', pgModeSystemJa: '系統日文字體', pgModeOff: '關閉',
    pgPunctHant: '標點字體', pgPunctHans: '簡體・標點字體', pgPunctJa: '日文・標點字體', pgPunctKo: '韓文・直排標點',
    pgGrpPunctOther: '其他語言標點',
    pgTogZhuyin: '注音Web字體',
    pgGrpJs: 'JavaScript',
    pgTogFallbacks: 'JS排版補全', pgTogFallbacksEn: 'installFallbacks',
    pgTogLegacyRuby: '舊式 ruby 轉換', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用碼形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '範文語言', dlHant: '繁', dlHans: '簡', dlJa: '日', dlKo: '韓',

    // ─── HP-2: new homepage stations (manifesto / station-* / closing) ───
    mfH1a: '像素間的活字美學，', mfH1b: '為螢幕上的每一個漢字',
    mfLede: '以CSS變數為骨、少量JavaScript為筋——標點懸掛、著重號、注音、跨文種混排，皆有定法。中西之間不假空格字元，間隙一律0.125em：鉛字時代的規矩，一條不少。',
    mfDogfood: '本頁即範文——面板隨手撥，全頁隨你而變。',
    mfStatLocales: '支援語種', mfStatSize: 'Gzip體積（css+js）', mfStatDeps: '外部依賴',

    // ─── HP v2: hero vertical lede + station ledes / specimen /
    // comparison labels / marginalia notes / snippet bridge ───
    mfVLede: '排版是文明的底稿——鉛字時代的講究，不該亡於像素。',
    ssLede: '標籤名正，則樣式言順——圈點自來。',
    ssSpecimen: '文字之<em>道在細節</em>，讀<cite>考工記</cite>可知——<u>王羲之</u>寫過的每一筆，瀏覽器都該記得。',
    ssNote: '旁註記的是對應的變數名——寬螢幕才出現。',
    stLede: '一字三面——黑、明、楷，各司其職。',
    stTrayNote: '鉛字反著刻，紙上才是正的——CSS變數是這個時代的活字盤，撥一格，全頁重排。',
    stCompareSample: '字距，行氣。',
    stCompareMoe: 'MOE・教育部', stCompareGb: 'GB・國標', stCompareOff: '關・原字體',
    stNote: '撥左欄「傳承字形」，三面互換。',
    slLede: '好的段落是一塊方正的墨——標點懸出行外，字字落在格上。',
    slHangOffLabel: '懸掛・關', slHangOnLabel: '懸掛・開（han.css）',
    slHangOffSample: '「世界，你好！」句子走到行末，標點擠而不入，版面凹凸。',
    slHangOnSample: '「世界，你好！」句子走到行末，標點懸出格外，段落見方。',
    slNote: '間隙由CSS生成，文中沒有一個空格字元。',
    prNote: '作用範圍預設article，可在面板指定。',
    snBridge: '配置即代碼',

    ssEyebrow: '壹・語意', ssH2: '名正言順的元素樣式',
    ssP1: 'HTML5語意元素在漢字排版下自有其正確樣式——<em>著重號</em>標記文中緊要之詞，效果一如手寫圈點。',
    ssP2: '引用書名時可用<cite>說文解字</cite>標記。書名號預設關閉（<code>--han-cite-title-marks: none</code>），此處另加一行<code>--han-cite-title-marks: bracket</code>方得見《》。',
    ssP3: '專有名詞可用<u>專名號</u>標示，如人名地名。<abbr title="Cascading Style Sheets">CSS</abbr>一類縮寫，則交由&lt;abbr&gt;元素承載完整釋義。',
    ssJaLead: '日文引文亦各得其所——',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: '貳・字體排印', stH2: '百年傳承的字體，拂偏歸正的標點',
    stHeritageP: '傳承字形（尚古／源起，可由面板切換）承載了鉛字時代未經簡化的結構——非「更古老」，而是「未曾漂移」。',
    stPunctFixP: '破折號、刪節號、間隔號的碼位中西共用，字體堆疊裡誰排前面，誰就說了算——於是「——」常被西文字體斷成兩截，「……」沉到基線。標點字體只含標點、排在堆疊最前，把它們一一放回原位。',
    stPunctP: '標點斷連亦有地域公約——「」『』（）之弧直、逗句之位置，MOE（臺灣教育部）、JIS（日本工業規格）、GB（大陸國標）三制各異，一行CSS變量切換，「，。」之呼吸隨之而變。',
    stPunctExamples: '同一頁上，各語言標點各從其規範——簡體如<span lang="zh-Hans">「简体的引号与句号。」</span>，日文如<span lang="ja">「日本語の約物です。」</span>，韓文如<span lang="ko">「한국어 문장입니다.」</span>。',

    slEyebrow: '叁・行的調整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相鄰標點不再擠成一團——句尾若逢行末，標點懸而不入，版面仍齊。',
    slP2: '漢字與English、與2011一類數字相遇，中西之間留隙0.125em——不多不少，恰是CSS text-autospace的量尺，無需手動空格。',
    slP3: '東京<ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby>，一行標記，字旁直書。日文原寫作<span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>，假名注音，兩制並陳。',
    prEyebrow: '肆・段落', prH2: '疏密有致的段落調配',
    prP1: '長文的規矩，先是兩端對齊——漢字的段落是一塊完整的版，不留毛邊。標題連著標題時，中間的空白收攏歸零，眉題與題目貼成一組，不讓版面漏風。',
    prP2: '縮排只用一把尺——引文、圖表、清單，一律退兩字（2em），層次靠同一個刻度分明。這套規矩預設只在<code>article</code>內生效，作用範圍可在面板指定。本站這幾段自己就排在一個<code>article</code>裡，撥一下對應的模組開關，疏密立見。',
    prQuote: '引文退兩字——這一段自己，就是那把尺。',

    // ── HP v2: station 伍・工法 (unlayered / won't-fight-your-CSS) ──
    arEyebrow: '伍・工法', arH2: '最具彈性的排版框架',
    arLede: '權重歸零，樣式分層——你的CSS永遠說了算。',
    arP1: '全庫每一條選擇器都包在<code>:where()</code>裡，權重一律歸零——你寫一行<code>h2 { }</code>，就蓋過整個框架，不必<code>!important</code>，不必比選擇器長短。',
    arP2: 'Tailwind改寫你的HTML，Bootstrap要你排隊比權重——han.css兩樣都不做：語意標籤照舊、你的樣式表照舊，四個模塊各居一個cascade layer，層外的樣式天然勝過層內。它只在最底層鋪好規矩，等你來蓋。',
    arP3: '自訂也不用碰HTML——<code>@container style()</code>讓任何容器用一個custom property圈地：寫上<code>--han-em-symbol: sesame</code>，這個子樹的著重號就換成芝麻點。寫上<code>--han-prose: off</code>，這一塊就退出長文規矩。',
    arOverrideLabel: '你的樣式表', arOverrideResult: '實際渲染——你贏了',
    arLayerNote: '四層，正是左欄的四顆模組開關。',
    arContainerA: '預設', arContainerB: '芝麻點——容器上一個變數的事',
    arSampleText: '排版的<em>要緊處</em>，一眼可辨。',
    arQuoteSample: '他說：<q>這行顏色是我的CSS說了算。</q>',
    arNote: '全庫零權重，覆寫從不需要!important。',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '陸・試玩', pgStationH2: '遊樂場',
    pgStationLede: '——貼上Markdown或無傷大雅的HTML，這一頁的講究，即刻用在你的字上。',
    pgStationViewsLegend: '編輯器分頁', pgStationTabPreview: '預覽', pgStationTabCode: '原始碼',
    pgStationCodeLabel: '原始碼編輯區', pgStationPreviewLabel: '排版預覽',
    pgStationSample: '## 換你的字上場\n\n這是一段可自由編輯的範文。漢字與Latin、與2024並肩時，字距自動勻稱，不必手動空格。文中要緊的詞用<em>著重號</em>圈點。\n\n> 「引文自有其講究——標點懸掛，行末仍齊。」\n\n注音直書亦不在話下：<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>。\n\n<cite>本草綱目</cite><cite>辭海</cite>',

    snEyebrow: '柒・引用碼', snH2: '生成引用碼', snLede: '——這裡的代碼照著面板目前的配置即時生成，設定改了，代碼也跟著變。選npm或CDN其中一種，複製貼上就能直接用。',
    snFinishLine: '選好了？兩種引用方式，貼進<code>&lt;head&gt;</code>或打包入口即完成。',
    snBrowserSupport: '支援現代常青瀏覽器。',

    clInstallLabel: '一行安裝', clZianoLabel: 'ziano・傳承字形Web字體',
    clDiantenjeomLabel: 'diantenjeom・標點符號字型', clOldHomeLabel: '舊版首頁',

    railHeader: '配置面板——撥動即改寫全頁',
    pgUseDefault: '使用預設値',
    railCollapse: '收合面板',
  },
  hans: {
    siteTitle: '汉.css・像素间的活字美学',
    description: '像素间的活字美学，为屏幕上的每一个汉字。',
    docs: '文档', langSwitcherLabel: '切换语言・LANGUAGE',
    langSwitcherFoot: '站本身切换 5 种语言・操场可独立选任一语言范文',
    themeToggle: '切换主题',
    pgMetricsLabel: '度量',
    pgSliderSize: '字级', pgSliderSizeEn: 'font-size',
    pgSliderLeading: '行距', pgSliderLeadingEn: 'line-height',
    pgSliderWeight: '字重', pgSliderWeightEn: 'font-weight',
    pgWritingLabel: '书写方向', pgWritingHorizontal: '横排', pgWritingVertical: '直排',

    pgGrpModules: '模块', pgGrpSemantics: '语义样式标准化', pgGrpProse: '长文段落间距调整',
    pgProseScope: '作用选择器', pgProseScopeHint: '仅影响生成码',
    pgCiteMarks: '书名号',
    pgCiteBracket: '《》乙式', pgCiteWavy: '﹏甲式',
    pgEmSymbol: '着重号', pgEmPosition: '着重号位置',
    pgEmCircle: '圈', pgEmDot: '点', pgEmSesame: '芝麻点', pgEmTriangle: '三角',
    pgEmPosAuto: '自动', pgEmPosUnder: '字下', pgEmPosOver: '字上',
    pgGrpLines: '行的调整',
    pgTogHangNew: '标点悬挂',
    pgTogSqueeze: '标点挤压',
    pgTogAutospace: '跨文种混排间隙',
    pgAutospaceMode: '进阶模式',
    pgGrpFonts: '字体',
    pgHeritage: '传承字形',
    pgGrpHeritage: '繁体专项',
    pgBaseGeneric: '默认字体',
    pgHeritageFamily: '印刷字体',
    pgFamShanggu: '尚古', pgFamGenki: '源起', pgCursiveFamily: '楷体家族', pgFamLxgw: '霞鶩文楷TC', pgFamIansui: '芫荽',
    pgWebfontDelivery: 'Web字体来源', pgDeliveryNone: '不使用', pgWebfontCdnSource: 'CDN来源',
    pgCursive: '楷体',
    pgModeWebfont: 'Web字体', pgModeSystem: '系统字体', pgModeSystemJa: '系统日文字体', pgModeOff: '关闭',
    pgPunctHant: '标点字体', pgPunctHans: '简体・标点字体', pgPunctJa: '日文・标点字体', pgPunctKo: '韩文・竖排标点',
    pgGrpPunctOther: '其他语言标点',
    pgTogZhuyin: '注音Web字体',
    pgGrpJs: 'JavaScript',
    pgTogFallbacks: 'JS排版补全', pgTogFallbacksEn: 'installFallbacks',
    pgTogLegacyRuby: '旧式 ruby 转换', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用码形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '范文语言', dlHant: '繁', dlHans: '简', dlJa: '日', dlKo: '韩',

    // ─── HP-2: new homepage stations (manifesto / station-* / closing) ───
    mfH1a: '像素间的活字美学，', mfH1b: '为屏幕上的每一个汉字',
    mfLede: '以CSS变量为骨、少量JavaScript为筋——标点悬挂、着重号、注音、跨文种混排，皆有定法。中西之间不假空格字符，间隙一律0.125em：铅字时代的规矩，一条不少。',
    mfDogfood: '本页即范文——面板随手拨，全页随你而变。',
    mfStatLocales: '支持语种', mfStatSize: 'Gzip体积（css+js）', mfStatDeps: '外部依赖',

    // ─── HP v2: hero vertical lede + station ledes / specimen /
    // comparison labels / marginalia notes / snippet bridge ───
    mfVLede: '排版是文明的底稿——铅字时代的讲究，不该亡于像素。',
    ssLede: '标签名正，则样式言顺——圈点自来。',
    ssSpecimen: '文字之<em>道在细节</em>，读<cite>考工记</cite>可知——<u>王羲之</u>写过的每一笔，浏览器都该记得。',
    ssNote: '旁注记的是对应的变量名——宽屏才出现。',
    stLede: '一字三面——黑、明、楷，各司其职。',
    stTrayNote: '铅字反着刻，纸上才是正的——CSS变量是这个时代的活字盘，拨一格，全页重排。',
    stCompareSample: '字距，行气。',
    stCompareMoe: 'MOE・教育部', stCompareGb: 'GB・国标', stCompareOff: '关・原字体',
    stNote: '拨左栏「传承字形」，三面互换。',
    slLede: '好的段落是一块方正的墨——标点悬出行外，字字落在格上。',
    slHangOffLabel: '悬挂・关', slHangOnLabel: '悬挂・开（han.css）',
    slHangOffSample: '「世界，你好！」句子走到行末，标点挤而不入，版面凹凸。',
    slHangOnSample: '「世界，你好！」句子走到行末，标点悬出格外，段落见方。',
    slNote: '间隙由CSS生成，文中没有一个空格字符。',
    prNote: '作用范围默认article，可在面板指定。',
    snBridge: '配置即代码',

    ssEyebrow: '壹・语意', ssH2: '名正言顺的元素样式',
    ssP1: 'HTML5语意元素在汉字排版下自有其正确样式——<em>着重号</em>标记文中紧要之词，效果一如手写圈点。',
    ssP2: '引用书名时可用<cite>说文解字</cite>标记。书名号默认关闭（<code>--han-cite-title-marks: none</code>），此处另加一行<code>--han-cite-title-marks: bracket</code>方得见《》。',
    ssP3: '专有名词可用<u>专名号</u>标示，如人名地名。<abbr title="Cascading Style Sheets">CSS</abbr>一类缩写，则交由&lt;abbr&gt;元素承载完整释义。',
    ssJaLead: '日文引文亦各得其所——',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: '贰・字体排印', stH2: '百年传承的字体，拂偏归正的标点',
    stHeritageP: '传承字形（尚古／源起，可由面板切换）承载了铅字时代未经简化的结构——非「更古老」，而是「未曾漂移」。',
    stPunctFixP: '破折号、删节号、间隔号的码位中西共用，字体堆叠里谁排前面，谁就说了算——于是「——」常被西文字体断成两截，「……」沉到基线。标点字体只含标点、排在堆叠最前，把它们一一放回原位。',
    stPunctP: '标点断连亦有地域公约——「」『』（）之弧直、逗句之位置，MOE（台湾教育部）、JIS（日本工业规格）、GB（大陆国标）三制各异，一行CSS变量切换，「，。」之呼吸随之而变。',
    stPunctExamples: '同一页上，各语言标点各从其规范——简体如<span lang="zh-Hans">「简体的引号与句号。」</span>，日文如<span lang="ja">「日本語の約物です。」</span>，韩文如<span lang="ko">「한국어 문장입니다.」</span>。',

    slEyebrow: '叁・行的调整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相邻标点不再挤成一团——句尾若逢行末，标点悬而不入，版面仍齐。',
    slP2: '汉字与English、与2011一类数字相遇，中西之间留隙0.125em——不多不少，恰是CSS text-autospace的量尺，无需手动空格。',
    slP3: '东京<ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby>，一行标记，字旁直书。日文原写作<span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>，假名注音，两制并陈。',
    prEyebrow: '肆・段落', prH2: '疏密有致的段落调配',
    prP1: '长文的规矩，先是两端对齐——汉字的段落是一块完整的版，不留毛边。标题连着标题时，中间的空白收拢归零，眉题与题目贴成一组，不让版面漏风。',
    prP2: '缩进只用一把尺——引文、图表、列表，一律退两字（2em），层次靠同一个刻度分明。这套规矩默认只在<code>article</code>内生效，作用范围可在面板指定。本站这几段自己就排在一个<code>article</code>里，拨一下对应的模块开关，疏密立见。',
    prQuote: '引文退两字——这一段自己，就是那把尺。',

    // ── HP v2: station 伍・工法 (unlayered / won't-fight-your-CSS) ──
    arEyebrow: '伍・工法', arH2: '最具弹性的排版框架',
    arLede: '权重归零，样式分层——你的CSS永远说了算。',
    arP1: '全库每一条选择器都包在<code>:where()</code>里，权重一律归零——你写一行<code>h2 { }</code>，就盖过整个框架，不必<code>!important</code>，不必比选择器长短。',
    arP2: 'Tailwind改写你的HTML，Bootstrap要你排队比权重——han.css两样都不做：语义标签照旧、你的样式表照旧，四个模块各居一个cascade layer，层外的样式天然胜过层内。它只在最底层铺好规矩，等你来盖。',
    arP3: '自定义也不用碰HTML——<code>@container style()</code>让任何容器用一个custom property圈地：写上<code>--han-em-symbol: sesame</code>，这个子树的着重号就换成芝麻点。写上<code>--han-prose: off</code>，这一块就退出长文规矩。',
    arOverrideLabel: '你的样式表', arOverrideResult: '实际渲染——你赢了',
    arLayerNote: '四层，正是左栏的四颗模块开关。',
    arContainerA: '预设', arContainerB: '芝麻点——容器上一个变量的事',
    arSampleText: '排版的<em>要紧处</em>，一眼可辨。',
    arQuoteSample: '他说：<q>这行颜色是我的CSS说了算。</q>',
    arNote: '全库零权重，覆写从不需要!important。',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '陆・随手试', pgStationH2: '游乐场',
    pgStationLede: '——贴上Markdown或无伤大雅的HTML，这一页的讲究，即刻用在你的字上。',
    pgStationViewsLegend: '编辑器页签', pgStationTabPreview: '预览', pgStationTabCode: '源码',
    pgStationCodeLabel: '源码编辑区', pgStationPreviewLabel: '排版预览',
    pgStationSample: '## 换你的字上场\n\n这是一段可自由编辑的范文。汉字与Latin、与2024并肩时，字距自动匀称，不必手动空格。文中要紧的词用<em>着重号</em>圈点。\n\n> 「引文自有其讲究——标点悬挂，行末仍齐。」\n\n注音直书亦不在话下：<ruby class="zhuyin">汉<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>。',

    snEyebrow: '柒・引用码', snH2: '生成引用码', snLede: '——这里的代码按照面板当前的配置实时生成，设置改了，代码也跟着变。选npm或CDN其中一种，复制粘贴就能直接用。',
    snFinishLine: '选好了？两种引用方式，贴进<code>&lt;head&gt;</code>或打包入口即完成。',
    snBrowserSupport: '支持现代常青浏览器。',

    clInstallLabel: '一行安装', clZianoLabel: 'ziano・传承字形Web字体',
    clDiantenjeomLabel: 'diantenjeom・标点符号字型', clOldHomeLabel: '旧版首页',

    railHeader: '配置面板——拨动即改写全页',
    pgUseDefault: '使用预设值',
    railCollapse: '收合面板',
  },
  en: {
    siteTitle: 'Han.css・Movable type within the pixels',
    description: 'Crafting movable type within the pixels, for every Han character.',
    docs: 'Docs', langSwitcherLabel: 'Switch language・LANGUAGE',
    langSwitcherFoot: 'Site supports 5 languages・the playground sample picks any independently.',
    themeToggle: 'Toggle theme',
    pgMetricsLabel: 'Metrics',
    pgSliderSize: 'Size', pgSliderSizeEn: 'font-size',
    pgSliderLeading: 'Leading', pgSliderLeadingEn: 'line-height',
    pgSliderWeight: 'Weight', pgSliderWeightEn: 'font-weight',
    pgWritingLabel: 'Writing mode', pgWritingHorizontal: 'Horizontal', pgWritingVertical: 'Vertical',

    pgGrpModules: 'Modules', pgGrpSemantics: 'Semantic styling', pgGrpProse: 'Prose spacing',
    pgProseScope: 'Applies to (selector)', pgProseScopeHint: 'Affects generated code only',
    pgCiteMarks: 'Title marks',
    pgCiteBracket: '《》 bracket', pgCiteWavy: '﹏ wavy',
    pgEmSymbol: 'Emphasis mark', pgEmPosition: 'Emphasis position',
    pgEmCircle: 'Circle', pgEmDot: 'Dot', pgEmSesame: 'Sesame', pgEmTriangle: 'Triangle',
    pgEmPosAuto: 'Auto', pgEmPosUnder: 'Under text', pgEmPosOver: 'Over text',
    pgGrpLines: 'Line adjustments',
    pgTogHangNew: 'Hanging punct',
    pgTogSqueeze: 'Punct squeeze',
    pgTogAutospace: 'Mixed-script spacing',
    pgAutospaceMode: 'Advanced mode',
    pgGrpFonts: 'Fonts',
    pgHeritage: 'Heritage glyphs',
    pgGrpHeritage: 'Traditional-Chinese specifics',
    pgBaseGeneric: 'Default typeface',
    pgHeritageFamily: 'Type family',
    pgFamShanggu: 'Shanggu', pgFamGenki: 'Genki', pgCursiveFamily: 'Kai family', pgFamLxgw: 'LXGW WenKai TC', pgFamIansui: 'Iansui',
    pgWebfontDelivery: 'Webfont source', pgDeliveryNone: 'None', pgWebfontCdnSource: 'CDN source',
    pgCursive: 'Cursive',
    pgModeWebfont: 'Webfont', pgModeSystem: 'System font', pgModeSystemJa: 'System JP font', pgModeOff: 'Off',
    pgPunctHant: 'Punctuation', pgPunctHans: 'Hans · punctuation', pgPunctJa: 'Japanese · punctuation', pgPunctKo: 'Korean · vertical punctuation',
    pgGrpPunctOther: 'Other-language punctuation',
    pgTogZhuyin: 'Zhuyin Webfont',
    pgGrpJs: 'JavaScript',
    pgTogFallbacks: 'JS typesetting shims', pgTogFallbacksEn: 'installFallbacks',
    pgTogLegacyRuby: 'Legacy ruby conversion', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: 'Snippet format',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: 'Specimen language', dlHant: 'TC', dlHans: 'SC', dlJa: 'JA', dlKo: 'KO',

    // ─── HP-2: new homepage stations (manifesto / station-* / closing) ───
    mfH1a: 'Crafting movable type within the pixels,', mfH1b: 'for every Han character.',
    mfLede: 'A Hanzi typography system: CSS variables for bone, a little JavaScript for sinew — hanging punctuation, emphasis dots, ruby, mixed-script spacing, each with its rule. No hand-typed space between scripts, a fixed 0.125em gap — the discipline of hot metal, not a rule dropped.',
    mfDogfood: 'This page is the specimen — tweak the panel, watch the whole page respond.',
    mfStatLocales: 'locales', mfStatSize: 'gzip size (css+js)', mfStatDeps: 'dependency',

    // ─── HP v2: hero vertical lede + station ledes / specimen /
    // comparison labels / marginalia notes / snippet bridge ───
    mfVLede: 'Typography is the first draft of a civilization — the care of the metal-type age deserves better than dying in pixels.',
    ssLede: 'Name the tag right and the style follows — the marks come for free.',
    ssSpecimen: 'The <em>truth is in the detail</em>, as the <cite>Kaogongji</cite> teaches — every stroke <u>Wang Xizhi</u> ever set, the browser ought to remember.',
    ssNote: 'The margin notes the matching variable name — wide screens only.',
    stLede: 'One character, three faces — sans, serif and cursive, each to its task.',
    stTrayNote: 'Type is cut in reverse; only on paper does it read true — a CSS variable is the type case of this era: nudge one slug and the whole page resets.',
    stCompareSample: '字距，行氣。',
    stCompareMoe: 'MOE · Taiwan', stCompareGb: 'GB · Mainland', stCompareOff: 'off · raw font',
    stNote: 'Flip the heritage-glyph switch in the left column to swap the three faces.',
    slLede: 'A good paragraph is a solid block of ink — punctuation hangs past the line, every character on the grid.',
    slHangOffLabel: 'hang · off', slHangOnLabel: 'hang · on (han.css)',
    slHangOffSample: '「世界，你好！」— when the sentence hits the line end, the punctuation jams in and the margin turns ragged.',
    slHangOnSample: '「世界，你好！」— here the punctuation hangs past the grid instead, and the block stays square.',
    slNote: 'The gap is generated by CSS; there is not a single space character in the text.',
    prNote: 'Scoped to article by default; set the selector in the panel.',
    snBridge: 'Config is code',

    ssEyebrow: 'I・Semantics', ssH2: 'Semantics before style',
    ssP1: 'HTML5 semantic elements have their own correct typographic treatment — <em>emphasis dots</em> mark the words that matter, the way a hand-drawn circle would.',
    ssP2: 'Citing a title uses <cite>Shuowen Jiezi</cite>; title marks default to off (<code>--han-cite-title-marks: none</code>) — here one extra line, <code>--han-cite-title-marks: bracket</code>, turns the 《》 back on.',
    ssP3: 'Proper nouns take <u>a proper-noun underline</u>, for names and places; abbreviations like <abbr title="Cascading Style Sheets">CSS</abbr> carry their full expansion in the &lt;abbr&gt; element itself.',
    ssJaLead: 'Japanese citations, too, find their proper place —',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: 'II・Typography', stH2: 'Century-old letterforms, punctuation set right',
    stHeritageP: 'Heritage forms (Shanggu／Genki, switchable in the panel) carry the unsimplified structure of the hot-metal era — not "older", but "never drifted".',
    stPunctFixP: 'Em dashes, ellipses and interpuncts share their codepoints with Western scripts — whichever font sits first in the stack has the final say, so “—” snaps in half and “…” sinks to the baseline. A punctuation-only font sits at the very front and puts every mark back where it belongs.',
    stPunctP: 'Even punctuation follows regional convention — the curve of「」『』（）, the position of commas and periods. MOE (Taiwan), JIS (Japan), GB (Mainland China) each differ; one CSS variable switches the whole page, and the rhythm of「，。」shifts with it.',
    stPunctExamples: 'On this very page, each language keeps its own punctuation convention — Simplified as in <span lang="zh-Hans">「简体的引号与句号。」</span>, Japanese as in <span lang="ja">「日本語の約物です。」</span>, Korean as in <span lang="ko">「한국어 문장입니다.」</span>.',

    slEyebrow: 'III・Line adjustments', slH2: 'How a line breathes',
    slP1: '"世界，你好。""你好，世界！" Adjacent punctuation no longer crowds together — when a full stop lands at line end, it hangs past the margin instead of pushing in.',
    slP2: 'Where Hanzi meets English, or digits like 2011, a 0.125em gap opens between scripts — exactly what CSS text-autospace measures out, no manual space required.',
    slP3: 'Tokyo <ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby> Skytree — one ruby per character, set beside its base; the Japanese original writes it as <span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>, kana ruby instead of zhuyin — two conventions, side by side.',
    prEyebrow: 'IV・Prose', prH2: 'Paragraphs, well measured',
    prP1: 'Long-form text starts with justification — a Han paragraph sets as a solid block, no ragged edge. And when headings stack, the gap between them closes to zero, so an eyebrow and its title read as one piece.',
    prP2: 'One ruler for every indent — blockquotes, figures and lists all step in by two characters (2em), so hierarchy comes from a single measure. It applies inside <code>article</code> by default (the scope is yours to change in the panel); these very paragraphs sit in one, so flip the prose module switch and watch them reflow.',
    prQuote: 'A blockquote steps in two characters — this paragraph is its own ruler.',

    // ── HP v2: station V・Architecture (unlayered / won't-fight-your-CSS) ──
    arEyebrow: 'V・Architecture', arH2: 'The most flexible typesetting framework',
    arLede: 'Zero specificity, layered by design — your CSS always has the last word.',
    arP1: 'Every selector in the library is wrapped in <code>:where()</code>, so its specificity is zero — one line of your own <code>h2 { }</code> overrides the whole framework, with no <code>!important</code> and no selector-length arms race.',
    arP2: 'Tailwind rewrites your HTML; Bootstrap makes you win a specificity contest — han.css does neither. Your semantic tags stay, your stylesheet stays, and the four modules each sit in their own cascade layer, so anything outside the layers beats everything inside them. It only lays the groundwork at the very bottom, waiting for you to build over it.',
    arP3: 'Customising needs no HTML either — <code>@container style()</code> lets any container stake a claim with a single custom property: set <code>--han-em-symbol: sesame</code> and the emphasis dots in that subtree turn to sesame; set <code>--han-prose: off</code> and that block opts out of the long-form rules.',
    arOverrideLabel: 'your stylesheet', arOverrideResult: 'what renders — you win',
    arLayerNote: 'Four layers — exactly the four module switches in the left column.',
    arContainerA: 'default', arContainerB: 'sesame — one variable on the container',
    arSampleText: 'The <em>part that matters</em> in typesetting, clear at a glance.',
    arQuoteSample: 'She said, <q>this colour is my call, set in CSS.</q>',
    arNote: 'Zero specificity across the whole library — overriding never needs !important.',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: 'VI・Playground', pgStationH2: 'Bring your own words',
    pgStationLede: '— paste Markdown or harmless HTML, and the craft of this page applies to your words at once.',
    pgStationViewsLegend: 'Editor view', pgStationTabPreview: 'Preview', pgStationTabCode: 'Code',
    pgStationCodeLabel: 'Source editor', pgStationPreviewLabel: 'Rendered preview',
    pgStationSample: '## Bring your own words\n\nEdit this freely — Han typography just works. The spacing between 漢字 and Latin is automatic, and emphasis dots mark <em lang="zh-Hant">要緊處</em>.\n\n> A blockquote keeps its manners — hanging punctuation, tidy line ends.\n\nRuby too: <ruby class="zhuyin" lang="zh-Hant">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin" lang="zh-Hant">字<rt>ㄗˋ</rt></ruby>.',

    snEyebrow: 'VII・Snippet', snH2: 'Generate the snippet', snLede: '— generated live from your panel settings: flip a switch and the code updates. Pick npm or CDN, copy, paste, done.',
    snFinishLine: 'Made your picks? Two ways to bring it in — paste into <code>&lt;head&gt;</code> or your bundler entry and you\'re done.',
    snBrowserSupport: 'Supports modern evergreen browsers.',

    clInstallLabel: 'One-line install', clZianoLabel: 'ziano・heritage Webfont',
    clDiantenjeomLabel: 'diantenjeom・punctuation font', clOldHomeLabel: 'Previous homepage',

    railHeader: 'Configurator — flip a switch, the whole page rewrites itself',
    pgUseDefault: 'Use default',
    railCollapse: 'Collapse panel',
  },
  ja: {
    siteTitle: '漢.css・ピクセルの間の活字美学',
    description: 'ピクセルの間の活字美学、画面に並ぶ漢字へ。',
    docs: 'ドキュメント', langSwitcherLabel: '言語切替・LANGUAGE',
    langSwitcherFoot: 'サイトは 5 言語対応・実験室では言語を独立して選択可能',
    themeToggle: 'テーマ切り替え',
    pgMetricsLabel: '度量',
    pgSliderSize: '字級', pgSliderSizeEn: 'font-size',
    pgSliderLeading: '行送り', pgSliderLeadingEn: 'line-height',
    pgSliderWeight: '字重', pgSliderWeightEn: 'font-weight',
    pgWritingLabel: '書寫方向', pgWritingHorizontal: '橫排', pgWritingVertical: '直排',

    // NOTE: pg{Grp,Tog,...} configurator strings below are not yet localized
    // for ja — falling back to the hant (Traditional Chinese) values per
    // Task 3 instructions. Revisit when ja copy is written.
    pgGrpModules: '模組', pgGrpSemantics: '語意樣式標準化', pgGrpProse: '長文段落間距調整',
    pgProseScope: '作用選擇器', pgProseScopeHint: '僅影響生成碼',
    pgCiteMarks: '書名號',
    pgCiteBracket: '《》乙式', pgCiteWavy: '﹏甲式',
    pgEmSymbol: '著重號', pgEmPosition: '著重號位置',
    pgEmCircle: '圈', pgEmDot: '點', pgEmSesame: '芝麻點', pgEmTriangle: '三角',
    pgEmPosAuto: '自動', pgEmPosUnder: '字下', pgEmPosOver: '字上',
    pgGrpLines: '行的調整',
    pgTogHangNew: '標點懸掛',
    pgTogSqueeze: '標點擠壓',
    pgTogAutospace: '跨文種混排間隙',
    pgAutospaceMode: '進階模式',
    pgGrpFonts: '字體',
    pgHeritage: '傳承字形',
    pgGrpHeritage: '繁體專項',
    pgBaseGeneric: '默認字體',
    pgHeritageFamily: '印刷字體',
    pgFamShanggu: '尚古', pgFamGenki: '源起', pgCursiveFamily: '楷體家族', pgFamLxgw: '霞鶩文楷TC', pgFamIansui: '芫荽',
    pgWebfontDelivery: 'Web字體來源', pgDeliveryNone: '不使用', pgWebfontCdnSource: 'CDN來源',
    pgCursive: '楷體',
    pgModeWebfont: 'Web字體', pgModeSystem: '系統字體', pgModeSystemJa: '系統日文字體', pgModeOff: '關閉',
    pgPunctHant: '標點字體', pgPunctHans: '簡體・標點字體', pgPunctJa: '日文・標點字體', pgPunctKo: '韓文・直排標點',
    pgGrpPunctOther: '其他語言標點',
    pgTogZhuyin: '注音Web字體',
    pgGrpJs: 'JavaScript',
    pgTogFallbacks: 'JS排版補全', pgTogFallbacksEn: 'installFallbacks',
    pgTogLegacyRuby: '舊式 ruby 轉換', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用碼形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '範文語言', dlHant: '繁', dlHans: '簡', dlJa: '日', dlKo: '韓',

    // NOTE: HP-2 station keys below are not yet localized for ja —
    // falling back to the hant (Traditional Chinese) values per
    // established convention. Revisit when ja copy is written.
    mfH1a: 'ピクセルの間の活字美学、', mfH1b: '画面に並ぶ漢字へ。',
    mfLede: '以CSS變數為骨、少量JavaScript為筋——標點懸掛、著重號、注音、跨文種混排，皆有定法。中西之間不假空格字元，間隙一律0.125em：鉛字時代的規矩，一條不少。',
    mfDogfood: '本頁即範文——面板隨手撥，全頁隨你而變。',
    mfStatLocales: '支援語種', mfStatSize: 'Gzip體積（css+js）', mfStatDeps: '外部依賴',

    // ─── HP v2: hero vertical lede + station ledes / specimen /
    // comparison labels / marginalia notes / snippet bridge ───
    mfVLede: '排版是文明的底稿——鉛字時代的講究，不該亡於像素。',
    ssLede: '標籤名正，則樣式言順——圈點自來。',
    ssSpecimen: '文字之<em>道在細節</em>，讀<cite>考工記</cite>可知——<u>王羲之</u>寫過的每一筆，瀏覽器都該記得。',
    ssNote: '旁註記的是對應的變數名——寬螢幕才出現。',
    stLede: '一字三面——黑、明、楷，各司其職。',
    stTrayNote: '鉛字反著刻，紙上才是正的——CSS變數是這個時代的活字盤，撥一格，全頁重排。',
    stCompareSample: '字距，行氣。',
    stCompareMoe: 'MOE・教育部', stCompareGb: 'GB・國標', stCompareOff: '關・原字體',
    stNote: '撥左欄「傳承字形」，三面互換。',
    slLede: '好的段落是一塊方正的墨——標點懸出行外，字字落在格上。',
    slHangOffLabel: '懸掛・關', slHangOnLabel: '懸掛・開（han.css）',
    slHangOffSample: '「世界，你好！」句子走到行末，標點擠而不入，版面凹凸。',
    slHangOnSample: '「世界，你好！」句子走到行末，標點懸出格外，段落見方。',
    slNote: '間隙由CSS生成，文中沒有一個空格字元。',
    prNote: '作用範圍預設article，可在面板指定。',
    snBridge: '配置即代碼',

    ssEyebrow: '壹・語意', ssH2: '名正言順的元素樣式',
    ssP1: 'HTML5語意元素在漢字排版下自有其正確樣式——<em>著重號</em>標記文中緊要之詞，效果一如手寫圈點。',
    ssP2: '引用書名時可用<cite>說文解字</cite>標記。書名號預設關閉（<code>--han-cite-title-marks: none</code>），此處另加一行<code>--han-cite-title-marks: bracket</code>方得見《》。',
    ssP3: '專有名詞可用<u>專名號</u>標示，如人名地名。<abbr title="Cascading Style Sheets">CSS</abbr>一類縮寫，則交由&lt;abbr&gt;元素承載完整釋義。',
    ssJaLead: '日文引文亦各得其所——',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: '貳・字體排印', stH2: '百年傳承的字體，拂偏歸正的標點',
    stHeritageP: '傳承字形（尚古／源起，可由面板切換）承載了鉛字時代未經簡化的結構——非「更古老」，而是「未曾漂移」。',
    stPunctFixP: '破折號、刪節號、間隔號的碼位中西共用，字體堆疊裡誰排前面，誰就說了算——於是「——」常被西文字體斷成兩截，「……」沉到基線。標點字體只含標點、排在堆疊最前，把它們一一放回原位。',
    stPunctP: '標點斷連亦有地域公約——「」『』（）之弧直、逗句之位置，MOE（臺灣教育部）、JIS（日本工業規格）、GB（大陸國標）三制各異，一行CSS變量切換，「，。」之呼吸隨之而變。',
    stPunctExamples: '同一頁上，各語言標點各從其規範——簡體如<span lang="zh-Hans">「简体的引号与句号。」</span>，日文如<span lang="ja">「日本語の約物です。」</span>，韓文如<span lang="ko">「한국어 문장입니다.」</span>。',

    slEyebrow: '叁・行的調整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相鄰標點不再擠成一團——句尾若逢行末，標點懸而不入，版面仍齊。',
    slP2: '漢字與English、與2011一類數字相遇，中西之間留隙0.125em——不多不少，恰是CSS text-autospace的量尺，無需手動空格。',
    slP3: '東京<ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby>，一行標記，字旁直書。日文原寫作<span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>，假名注音，兩制並陳。',
    prEyebrow: '肆・段落', prH2: '疏密有致的段落調配',
    prP1: '長文的規矩，先是兩端對齊——漢字的段落是一塊完整的版，不留毛邊。標題連著標題時，中間的空白收攏歸零，眉題與題目貼成一組，不讓版面漏風。',
    prP2: '縮排只用一把尺——引文、圖表、清單，一律退兩字（2em），層次靠同一個刻度分明。這套規矩預設只在<code>article</code>內生效，作用範圍可在面板指定。本站這幾段自己就排在一個<code>article</code>裡，撥一下對應的模組開關，疏密立見。',
    prQuote: '引文退兩字——這一段自己，就是那把尺。',

    // ── HP v2: station 伍・工法 (unlayered / won't-fight-your-CSS) ──
    arEyebrow: '伍・工法', arH2: '最具彈性的排版框架',
    arLede: '權重歸零，樣式分層——你的CSS永遠說了算。',
    arP1: '全庫每一條選擇器都包在<code>:where()</code>裡，權重一律歸零——你寫一行<code>h2 { }</code>，就蓋過整個框架，不必<code>!important</code>，不必比選擇器長短。',
    arP2: 'Tailwind改寫你的HTML，Bootstrap要你排隊比權重——han.css兩樣都不做：語意標籤照舊、你的樣式表照舊，四個模塊各居一個cascade layer，層外的樣式天然勝過層內。它只在最底層鋪好規矩，等你來蓋。',
    arP3: '自訂也不用碰HTML——<code>@container style()</code>讓任何容器用一個custom property圈地：寫上<code>--han-em-symbol: sesame</code>，這個子樹的著重號就換成芝麻點。寫上<code>--han-prose: off</code>，這一塊就退出長文規矩。',
    arOverrideLabel: '你的樣式表', arOverrideResult: '實際渲染——你贏了',
    arLayerNote: '四層，正是左欄的四顆模組開關。',
    arContainerA: '預設', arContainerB: '芝麻點——容器上一個變數的事',
    arSampleText: '排版的<em>要緊處</em>，一眼可辨。',
    arQuoteSample: '他說：<q>這行顏色是我的CSS說了算。</q>',
    arNote: '全庫零權重，覆寫從不需要!important。',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '陸・試玩', pgStationH2: '遊樂場',
    pgStationLede: '——貼上Markdown或無傷大雅的HTML，這一頁的講究，即刻用在你的字上。',
    pgStationViewsLegend: '編輯器分頁', pgStationTabPreview: '預覽', pgStationTabCode: '原始碼',
    pgStationCodeLabel: '原始碼編輯區', pgStationPreviewLabel: '排版預覽',
    pgStationSample: '## 換你的字上場\n\n這是一段可自由編輯的範文。漢字與Latin、與2024並肩時，字距自動勻稱，不必手動空格。文中要緊的詞用<em>著重號</em>圈點。\n\n> 「引文自有其講究——標點懸掛，行末仍齊。」\n\n注音直書亦不在話下：<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>。',

    snEyebrow: '柒・引用碼', snH2: '生成引用碼', snLede: '——這裡的代碼照著面板目前的配置即時生成，設定改了，代碼也跟著變。選npm或CDN其中一種，複製貼上就能直接用。',
    snFinishLine: '選好了？兩種引用方式，貼進<code>&lt;head&gt;</code>或打包入口即完成。',
    snBrowserSupport: '支援現代常青瀏覽器。',

    clInstallLabel: '一行安裝', clZianoLabel: 'ziano・傳承字形Web字體',
    clDiantenjeomLabel: 'diantenjeom・標點符號字型', clOldHomeLabel: '舊版首頁',

    // NOTE: rail keys below are not yet localized for ja — falling back
    // to the hant (Traditional Chinese) values per established
    // convention. Revisit when ja copy is written.
    railHeader: '配置面板——撥動即改寫全頁',
    pgUseDefault: '使用預設値',
    railCollapse: '收合面板',
  },
  ko: {
    siteTitle: '漢.css・픽셀 사이의 活字 美學',
    description: '픽셀 사이의 活字 美學, 畫面의 漢字에게.',
    docs: '문서', langSwitcherLabel: '언어 전환・LANGUAGE',
    langSwitcherFoot: '사이트는 5 개 언어 지원・놀이터에서 독립적으로 언어 선택',
    themeToggle: '테마 전환',
    pgMetricsLabel: '수치・METRICS',
    pgSliderSize: '글자 크기', pgSliderSizeEn: 'font-size',
    pgSliderLeading: '행간', pgSliderLeadingEn: 'line-height',
    pgSliderWeight: '字重', pgSliderWeightEn: 'font-weight',
    pgWritingLabel: '書寫方向', pgWritingHorizontal: '橫排', pgWritingVertical: '直排',

    // NOTE: pg{Grp,Tog,...} configurator strings below are not yet localized
    // for ko — falling back to the hant (Traditional Chinese) values per
    // Task 3 instructions. Revisit when ko copy is written.
    pgGrpModules: '模組', pgGrpSemantics: '語意樣式標準化', pgGrpProse: '長文段落間距調整',
    pgProseScope: '作用選擇器', pgProseScopeHint: '僅影響生成碼',
    pgCiteMarks: '書名號',
    pgCiteBracket: '《》乙式', pgCiteWavy: '﹏甲式',
    pgEmSymbol: '著重號', pgEmPosition: '著重號位置',
    pgEmCircle: '圈', pgEmDot: '點', pgEmSesame: '芝麻點', pgEmTriangle: '三角',
    pgEmPosAuto: '自動', pgEmPosUnder: '字下', pgEmPosOver: '字上',
    pgGrpLines: '行的調整',
    pgTogHangNew: '標點懸掛',
    pgTogSqueeze: '標點擠壓',
    pgTogAutospace: '跨文種混排間隙',
    pgAutospaceMode: '進階模式',
    pgGrpFonts: '字體',
    pgHeritage: '傳承字形',
    pgGrpHeritage: '繁體專項',
    pgBaseGeneric: '默認字體',
    pgHeritageFamily: '印刷字體',
    pgFamShanggu: '尚古', pgFamGenki: '源起', pgCursiveFamily: '楷體家族', pgFamLxgw: '霞鶩文楷TC', pgFamIansui: '芫荽',
    pgWebfontDelivery: 'Web字體來源', pgDeliveryNone: '不使用', pgWebfontCdnSource: 'CDN來源',
    pgCursive: '楷體',
    pgModeWebfont: 'Web字體', pgModeSystem: '系統字體', pgModeSystemJa: '系統日文字體', pgModeOff: '關閉',
    pgPunctHant: '標點字體', pgPunctHans: '簡體・標點字體', pgPunctJa: '日文・標點字體', pgPunctKo: '韓文・直排標點',
    pgGrpPunctOther: '其他語言標點',
    pgTogZhuyin: '注音Web字體',
    pgGrpJs: 'JavaScript',
    pgTogFallbacks: 'JS排版補全', pgTogFallbacksEn: 'installFallbacks',
    pgTogLegacyRuby: '舊式 ruby 轉換', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用碼形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '範文語言', dlHant: '繁', dlHans: '簡', dlJa: '日', dlKo: '韓',

    // NOTE: HP-2 station keys below are not yet localized for ko —
    // falling back to the hant (Traditional Chinese) values per
    // established convention. Revisit when ko copy is written.
    mfH1a: '<ruby>픽셀<rt>pixel</rt></ruby> 사이의 <ruby>活字<rt>활자</rt></ruby> <ruby>美學<rt>미학</rt></ruby>,', mfH1b: '<ruby>畫面<rt>화면</rt></ruby>의 <ruby>漢字<rt>한자</rt></ruby>에게.',
    mfLede: '以CSS變數為骨、少量JavaScript為筋——標點懸掛、著重號、注音、跨文種混排，皆有定法。中西之間不假空格字元，間隙一律0.125em：鉛字時代的規矩，一條不少。',
    mfDogfood: '本頁即範文——面板隨手撥，全頁隨你而變。',
    mfStatLocales: '支援語種', mfStatSize: 'Gzip體積（css+js）', mfStatDeps: '外部依賴',

    // ─── HP v2: hero vertical lede + station ledes / specimen /
    // comparison labels / marginalia notes / snippet bridge ───
    mfVLede: '排版是文明的底稿——鉛字時代的講究，不該亡於像素。',
    ssLede: '標籤名正，則樣式言順——圈點自來。',
    ssSpecimen: '文字之<em>道在細節</em>，讀<cite>考工記</cite>可知——<u>王羲之</u>寫過的每一筆，瀏覽器都該記得。',
    ssNote: '旁註記的是對應的變數名——寬螢幕才出現。',
    stLede: '一字三面——黑、明、楷，各司其職。',
    stTrayNote: '鉛字反著刻，紙上才是正的——CSS變數是這個時代的活字盤，撥一格，全頁重排。',
    stCompareSample: '字距，行氣。',
    stCompareMoe: 'MOE・教育部', stCompareGb: 'GB・國標', stCompareOff: '關・原字體',
    stNote: '撥左欄「傳承字形」，三面互換。',
    slLede: '好的段落是一塊方正的墨——標點懸出行外，字字落在格上。',
    slHangOffLabel: '懸掛・關', slHangOnLabel: '懸掛・開（han.css）',
    slHangOffSample: '「世界，你好！」句子走到行末，標點擠而不入，版面凹凸。',
    slHangOnSample: '「世界，你好！」句子走到行末，標點懸出格外，段落見方。',
    slNote: '間隙由CSS生成，文中沒有一個空格字元。',
    prNote: '作用範圍預設article，可在面板指定。',
    snBridge: '配置即代碼',

    ssEyebrow: '壹・語意', ssH2: '名正言順的元素樣式',
    ssP1: 'HTML5語意元素在漢字排版下自有其正確樣式——<em>著重號</em>標記文中緊要之詞，效果一如手寫圈點。',
    ssP2: '引用書名時可用<cite>說文解字</cite>標記。書名號預設關閉（<code>--han-cite-title-marks: none</code>），此處另加一行<code>--han-cite-title-marks: bracket</code>方得見《》。',
    ssP3: '專有名詞可用<u>專名號</u>標示，如人名地名。<abbr title="Cascading Style Sheets">CSS</abbr>一類縮寫，則交由&lt;abbr&gt;元素承載完整釋義。',
    ssJaLead: '日文引文亦各得其所——',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: '貳・字體排印', stH2: '百年傳承的字體，拂偏歸正的標點',
    stHeritageP: '傳承字形（尚古／源起，可由面板切換）承載了鉛字時代未經簡化的結構——非「更古老」，而是「未曾漂移」。',
    stPunctFixP: '破折號、刪節號、間隔號的碼位中西共用，字體堆疊裡誰排前面，誰就說了算——於是「——」常被西文字體斷成兩截，「……」沉到基線。標點字體只含標點、排在堆疊最前，把它們一一放回原位。',
    stPunctP: '標點斷連亦有地域公約——「」『』（）之弧直、逗句之位置，MOE（臺灣教育部）、JIS（日本工業規格）、GB（大陸國標）三制各異，一行CSS變量切換，「，。」之呼吸隨之而變。',
    stPunctExamples: '同一頁上，各語言標點各從其規範——簡體如<span lang="zh-Hans">「简体的引号与句号。」</span>，日文如<span lang="ja">「日本語の約物です。」</span>，韓文如<span lang="ko">「한국어 문장입니다.」</span>。',

    slEyebrow: '叁・行的調整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相鄰標點不再擠成一團——句尾若逢行末，標點懸而不入，版面仍齊。',
    slP2: '漢字與English、與2011一類數字相遇，中西之間留隙0.125em——不多不少，恰是CSS text-autospace的量尺，無需手動空格。',
    slP3: '東京<ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby>，一行標記，字旁直書。日文原寫作<span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>，假名注音，兩制並陳。',
    prEyebrow: '肆・段落', prH2: '疏密有致的段落調配',
    prP1: '長文的規矩，先是兩端對齊——漢字的段落是一塊完整的版，不留毛邊。標題連著標題時，中間的空白收攏歸零，眉題與題目貼成一組，不讓版面漏風。',
    prP2: '縮排只用一把尺——引文、圖表、清單，一律退兩字（2em），層次靠同一個刻度分明。這套規矩預設只在<code>article</code>內生效，作用範圍可在面板指定。本站這幾段自己就排在一個<code>article</code>裡，撥一下對應的模組開關，疏密立見。',
    prQuote: '引文退兩字——這一段自己，就是那把尺。',

    // ── HP v2: station 伍・工法 (unlayered / won't-fight-your-CSS) ──
    arEyebrow: '伍・工法', arH2: '最具彈性的排版框架',
    arLede: '權重歸零，樣式分層——你的CSS永遠說了算。',
    arP1: '全庫每一條選擇器都包在<code>:where()</code>裡，權重一律歸零——你寫一行<code>h2 { }</code>，就蓋過整個框架，不必<code>!important</code>，不必比選擇器長短。',
    arP2: 'Tailwind改寫你的HTML，Bootstrap要你排隊比權重——han.css兩樣都不做：語意標籤照舊、你的樣式表照舊，四個模塊各居一個cascade layer，層外的樣式天然勝過層內。它只在最底層鋪好規矩，等你來蓋。',
    arP3: '自訂也不用碰HTML——<code>@container style()</code>讓任何容器用一個custom property圈地：寫上<code>--han-em-symbol: sesame</code>，這個子樹的著重號就換成芝麻點。寫上<code>--han-prose: off</code>，這一塊就退出長文規矩。',
    arOverrideLabel: '你的樣式表', arOverrideResult: '實際渲染——你贏了',
    arLayerNote: '四層，正是左欄的四顆模組開關。',
    arContainerA: '預設', arContainerB: '芝麻點——容器上一個變數的事',
    arSampleText: '排版的<em>要緊處</em>，一眼可辨。',
    arQuoteSample: '他說：<q>這行顏色是我的CSS說了算。</q>',
    arNote: '全庫零權重，覆寫從不需要!important。',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '陸・試玩', pgStationH2: '遊樂場',
    pgStationLede: '——貼上Markdown或無傷大雅的HTML，這一頁的講究，即刻用在你的字上。',
    pgStationViewsLegend: '編輯器分頁', pgStationTabPreview: '預覽', pgStationTabCode: '原始碼',
    pgStationCodeLabel: '原始碼編輯區', pgStationPreviewLabel: '排版預覽',
    pgStationSample: '## 換你的字上場\n\n這是一段可自由編輯的範文。漢字與Latin、與2024並肩時，字距自動勻稱，不必手動空格。文中要緊的詞用<em>著重號</em>圈點。\n\n> 「引文自有其講究——標點懸掛，行末仍齊。」\n\n注音直書亦不在話下：<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>。',

    snEyebrow: '柒・引用碼', snH2: '生成引用碼', snLede: '——這裡的代碼照著面板目前的配置即時生成，設定改了，代碼也跟著變。選npm或CDN其中一種，複製貼上就能直接用。',
    snFinishLine: '選好了？兩種引用方式，貼進<code>&lt;head&gt;</code>或打包入口即完成。',
    snBrowserSupport: '支援現代常青瀏覽器。',

    clInstallLabel: '一行安裝', clZianoLabel: 'ziano・傳承字形Web字體',
    clDiantenjeomLabel: 'diantenjeom・標點符號字型', clOldHomeLabel: '舊版首頁',

    // NOTE: rail keys below are not yet localized for ko — falling back
    // to the hant (Traditional Chinese) values per established
    // convention. Revisit when ko copy is written.
    railHeader: '配置面板——撥動即改寫全頁',
    pgUseDefault: '使用預設値',
    railCollapse: '收合面板',
  },
}
