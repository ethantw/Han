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
    description: '像素間的活字美學，講究螢幕上的每一個漢字。',
    docs: '文檔', langSwitcherLabel: '切換語言・LANGUAGE',
    langSwitcherFoot: '站本身切換5種語言・遊樂場可獨立選任一語言範文',
    themeToggle: '切換主題',
    pgMetricsLabel: '度量',
    pgSliderSize: '字級', pgSliderSizeEn: 'font-size',
    pgSliderLeading: '行距', pgSliderLeadingEn: 'line-height',
    pgSliderWeight: '字重', pgSliderWeightEn: 'font-weight',
    pgWritingLabel: '書寫方向', pgWritingHorizontal: '橫排', pgWritingVertical: '直排',

    pgGrpModules: '模組', pgGrpSemantics: '語意樣式標準化', pgGrpProse: '段落間距調整',
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
    pgTogLegacyRuby: '舊式ruby轉換', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用碼形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', pgOutInline: '內嵌', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '範文語言', dlHant: '繁', dlHans: '簡', dlJa: '日', dlKo: '韓',

    // ─── HP-2: new homepage stations (manifesto / station-* / closing) ───
    mfH1: '像素間的活字美學，<br />講究螢幕上的每一個漢字',
    mfLede: '或擠壓或懸掛的標點、強調文本旁的著重號、為漢字標上的注音與拼音、文種之間的分寸、專名之間的斷點——鉛字時代的匠人工藝，透過CSS自訂屬性與少量JavaScript回落，在螢幕上一一重現。',
    mfDogfood: '本頁即範文——面板隨手一撥，效果與代碼實時改寫。',

    // ─── HP v2: hero vertical lede + station ledes / specimen /
    // comparison labels / marginalia notes / snippet bridge ───
    mfVLede: '排版是文明的底稿——鉛字承載的智慧，在螢幕上繼續演化。',
    ssLede: '精心校調的語意元素樣式——與漢字水火不容的偽斜體，就此告別。',
    ssSpecimen: '文字之<em>道在細節</em>，讀<cite>考工記</cite>可知——<u>王羲之</u>寫過的每一筆，瀏覽器都該記得。',
    ssNote: '旁註記的是對應的變數名——寬螢幕才出現。',
    stLede: '黑體、明體、楷體，三大字體，各司其職。',
    stTrayNote: '活字印刷時代，排版工人憑記憶在字盤中揀取文章所需的活字，填入版框；Web字體時代，數萬字的漢字字體依使用頻率分割為120個切片，取字的差事交給瀏覽器與<code>unicode-range</code>——按需下載，經CDN毫秒級遞送，填補千萬終端上系統字體的美學空缺。',
    stCompareSample: '字距，行氣。',
    stCompareMoe: 'MOE・教育部', stCompareGb: 'GB・國標', stCompareOff: '關・原字體',
    stNote: '撥左欄「傳承字形」，三面互換。',
    slLede: '擠壓收其內，懸掛出其外，分寸勻乎文種之間。',
    slHangOffLabel: '懸掛・關', slHangOnLabel: '懸掛・開（han.css）',
    slHangOffSample: '「世界，你好！」句子走到行末，標點擠而不入，版面凹凸。',
    slHangOnSample: '「世界，你好！」句子走到行末，標點懸出格外，段落見方。',
    slNote: '間隙由CSS生成，文中沒有一個空格字元。',
    prNote: '作用域預設在<code>article</code>元素，透過<code>--han-prose: on/off</code>，在任何選擇器開關整個模塊。',
    snBridge: '配置即代碼',

    ssEyebrow: '壹・語意', ssH2: '名正言順的元素樣式',
    ssP1: '語意與樣式分離——著重號、書名號、專名號、深淺字重、黑明楷體——語意元素在漢字排版下應有的樣式，漢.css逐一重新定義，使用正確的元素即手可得，繁簡日韓各有所依。<em>著重號</em>標記文中緊要強調之處一如本句。',

    stEyebrow: '貳・字體排印', stH2: '百年傳承的字形，拂歧歸正的標點',
    stHeritageP: '學究式楷化的<strong>國字標準字體</strong> = 新世代的美學降級——透過Web字體切片技術，在顯示器上重現百年傳承的字形結構。',
    stPunctFixP: '中間斷開的破折號、落在基線上的刪節號、尺寸太小的間隔號，起自Unicode共用碼位的歷史問題，透過OpenType + CSS <code>unicode-range</code>字體技術，精準為讀者拂偏歸正。',
    stPunctP: '無論是遵循地區標點規範，或在簡中文本使用居中標點、在繁中文本使用偏倚式標點，透過Diantenjeom提供的4&times;2種標點字體，任意搭配，玩出排版新花樣。',
    stSqueezeP: '字體內建完整的GPOS標點擠壓規則，行首行尾、連續標點，緊湊自在，一次到位。',

    slEyebrow: '叁・行的調整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相鄰標點擠去多餘的半格，緊收而不空洞；句讀行至末端，懸而不入，字距不因禁則換行而鬆動。',
    slP2: '漢字與Latin、與Ελληνικά、與кириллица字母，與0-9的數字相遇，其間自動勻出髮絲之隙。不寬不窄，恰是跨文種間的優雅分寸。',
    prEyebrow: '肆・段落', prH2: '疏密有致的段落調配',
    prP1: '標點擠壓掌管主軸的留白，交叉軸的節奏由prose模塊指揮——標題、段落、清單之間，間距去蕪存菁，數位長文也舒適易讀。',
    prP2: '西文字母寬窄錯落，漢字方塊成格——中日韓縮排捨40像素的預設，用漢字整數倍的空間代之。以字為尺，版面縱橫對齊。',
    prQuote: '引文退兩字——這一段自己，就是那把尺。',

    // ── HP v2: station 伍・工法 (unlayered / won't-fight-your-CSS) ──
    arEyebrow: '伍・工法', arH2: '輕如鴻毛的排版框架',
    arLede: '一百〇九個〇，仍然是「〇」——隨意覆寫，後來者的樣式說了算。',
    arP1: '透過<code>:where()</code>偽類函數，漢.css放棄所有樣式的選擇器權重，配合可自由定義樣式模塊順序的<code>@layer</code>，作者可大膽而隨心所欲地覆寫、重構框架提供的任何機能。',
    arP3: '透過CSS變量及style query <code>@container</code>，在任何選擇器上開關、調校機能——原生CSS給作者最大的自訂彈性。',
    arOverrideLabel: '你的樣式表', arOverrideResult: '實際渲染——你贏了',
    arLayerNote: '四層，正是左欄的四顆模組開關。',
    arContainerA: '預設', arContainerB: '芝麻點——容器上一個變數的事',
    arSampleText: '排版的<em>要緊處</em>，一眼可辨。',
    arQuoteSample: '他說：<q>這行顏色是我的CSS說了算。</q>',
    arNote: '全庫零權重，覆寫從不需要!important。',
    arLedgerTotal: '四模塊合計', arLedgerGzip: 'gzip', arLedgerDeps: '運行時依賴',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '陸・試玩', pgStationH2: '遊樂場',
    pgStationLede: '編寫Markdown或HTML，這一整頁漢.css的講究，即刻套用於你的文字。',
    pgStationViewsLegend: '編輯器分頁', pgStationTabPreview: '預覽', pgStationTabCode: '原始碼',
    pgStationCodeLabel: '原始碼編輯區', pgStationPreviewLabel: '排版預覽',
    pgStationSample: '## 換你的字上場\n\n刪掉這段，貼上你的——漢字與Latin、與2026之間，髮絲之隙自動勻出；要緊的詞以<em>著重號</em>圈點。\n\n> 「引文退兩字，標點懸出行外，行末仍齊。」\n\n<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>注音、<cite>本草綱目</cite>書名號，皆隨字而至。',

    snEyebrow: '柒・引用碼', snH2: '生成引用碼', snLede: '這裡的代碼照著面板目前的配置即時生成，設定改了，代碼也跟著變。npm、CDN、內嵌三種形式，選一種複製貼上就能直接用。',
    snFinishLine: '選好了？三種引用方式，貼進<code>&lt;head&gt;</code>、打包入口，或單檔編輯器即完成。',
    snBrowserSupport: '支援現代常青瀏覽器。',

    clInstallLabel: '一行安裝', clZianoLabel: 'ziano・傳承字形Web字體',
    clDiantenjeomLabel: 'diantenjeom・標點符號字型', clOldHomeLabel: '舊版首頁',

    railHeader: '配置面板——撥動即改寫全頁',
    pgUseDefault: '使用預設值',
    railCollapse: '收合面板',
  },
  hans: {
    siteTitle: '汉.css・像素间的活字美学',
    description: '像素间的活字美学，讲究屏幕上的每一个汉字。',
    docs: '文档', langSwitcherLabel: '切换语言・LANGUAGE',
    langSwitcherFoot: '站本身切换5种语言・游乐场可独立选任一语言范文',
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
    pgTogLegacyRuby: '旧式ruby转换', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用码形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', pgOutInline: '内嵌', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '范文语言', dlHant: '繁', dlHans: '简', dlJa: '日', dlKo: '韩',

    // ─── HP-2: new homepage stations (manifesto / station-* / closing) ───
    mfH1: '像素间的活字美学，<br />讲究萤幕上的每一个汉字',
    mfLede: '或挤压或悬挂的标点、强调文本旁的着重号、为汉字标上的注音与拼音、文种之间的分寸、专名之间的断点——铅字时代的匠人工艺，通过CSS自定义属性与少量JavaScript回落，在屏幕上一一重现。',
    mfDogfood: '本页即范文——面板随手一拨，效果与代码实时改写。',

    // ─── HP v2: hero vertical lede + station ledes / specimen /
    // comparison labels / marginalia notes / snippet bridge ───
    mfVLede: '排版是文明的底稿——铅字承载的智慧，在屏幕上继续演化。',
    ssLede: '精心校调的语意元素样式——与汉字水火不容的伪斜体，就此告别。',
    ssSpecimen: '文字之<em>道在细节</em>，读<cite>考工记</cite>可知——<u>王羲之</u>写过的每一笔，浏览器都该记得。',
    ssNote: '旁注记的是对应的变量名——宽屏才出现。',
    stLede: '黑体、明体、楷体，三大字体，各司其职。',
    stTrayNote: '活字印刷时代，排版工人凭记忆在字盘中拣取文章所需的活字，填入版框；Web字体时代，数万字的汉字字体依使用频率分割为120个切片，取字的差事交给浏览器与<code>unicode-range</code>——按需下载，经CDN毫秒级递送，填补千万终端上系统字体的美学空缺。',
    stCompareSample: '字距，行气。',
    stCompareMoe: 'MOE・教育部', stCompareGb: 'GB・国标', stCompareOff: '关・原字体',
    stNote: '拨左栏「传承字形」，三面互换。',
    slLede: '挤压收其内，悬挂出其外，分寸匀乎文种之间。',
    slHangOffLabel: '悬挂・关', slHangOnLabel: '悬挂・开（han.css）',
    slHangOffSample: '「世界，你好！」句子走到行末，标点挤而不入，版面凹凸。',
    slHangOnSample: '「世界，你好！」句子走到行末，标点悬出格外，段落见方。',
    slNote: '间隙由CSS生成，文中没有一个空格字符。',
    prNote: '作用域默认在<code>article</code>元素，透过<code>--han-prose: on/off</code>，在任何选择器开关整个模块。',
    snBridge: '配置即代码',

    ssEyebrow: '壹・语意', ssH2: '名正言顺的元素样式',
    ssP1: '语意与样式分离——着重号、书名号、专名号、深浅字重、黑明楷体——语意元素在汉字排版下应有的样式，汉.css逐一重新定义，使用正确的元素即手可得，繁简日韩各有所依。<em>着重号</em>标记文中紧要强调之处一如本句。',

    stEyebrow: '贰・字体排印', stH2: '百年传承的字形，拂歧归正的标点',
    stHeritageP: '学究式楷化的<strong>国字标准字体</strong> = 新世代的美学降级——透过Web字体切片技术，在显示器上重现百年传承的字形结构。',
    stPunctFixP: '中间断开的破折号、落在基线上的删节号、尺寸太小的间隔号，起自Unicode共用码位的历史问题，透过OpenType + CSS <code>unicode-range</code>字体技术，精准为读者拂偏归正。',
    stPunctP: '无论是遵循地区标点规范，或在简体文本使用居中标点、在繁体文本使用偏倚式标点，透过Diantenjeom提供的4&times;2种标点字体，任意搭配，玩出排版新花样。',
    stSqueezeP: '字体内建完整的GPOS标点挤压规则，行首行尾、连续标点，紧凑自在，一次到位。',

    slEyebrow: '叁・行的调整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相邻标点挤去多余的半格，紧收而不空洞；句读行至末端，悬而不入，字距不因禁则换行而松动。',
    slP2: '汉字与Latin、与Ελληνικά、与кириллица字母，与0-9的数字相遇，其间自动匀出发丝之隙。不宽不窄，恰是跨文种间的优雅分寸。',
    prEyebrow: '肆・段落', prH2: '疏密有致的段落调配',
    prP1: '标点挤压掌管主轴的留白，交叉轴的节奏由prose模块指挥——标题、段落、清单之间，间距去芜存菁，数字长文也舒适易读。',
    prP2: '西文字母宽窄错落，汉字方块成格——中日韓缩进舍40像素的预设，用汉字整数倍的空间代之。以字为尺，版面纵横对齐。',
    prQuote: '引文退两字——这一段自己，就是那把尺。',

    // ── HP v2: station 伍・工法 (unlayered / won't-fight-your-CSS) ──
    arEyebrow: '伍・工法', arH2: '轻如鸿毛的排版框架',
    arLede: '一百〇九个〇，仍然是「〇」——随意覆写，后来者的样式说了算。',
    arP1: '透过<code>:where()</code>伪类函数，汉.css放弃所有样式的选择器权重，配合可自由定义样式模块顺序的<code>@layer</code>，作者可大胆而随心所欲地覆写、重构框架提供的任何机能。',
    arP3: '透过CSS变量及style query <code>@container</code>，在任何选择器上开关、调校机能——原生CSS给作者最大的自定义弹性。',
    arOverrideLabel: '你的样式表', arOverrideResult: '实际渲染——你赢了',
    arLayerNote: '四层，正是左栏的四颗模块开关。',
    arContainerA: '预设', arContainerB: '芝麻点——容器上一个变量的事',
    arSampleText: '排版的<em>要紧处</em>，一眼可辨。',
    arQuoteSample: '他说：<q>这行颜色是我的CSS说了算。</q>',
    arNote: '全库零权重，覆写从不需要!important。',
    arLedgerTotal: '四模块合计', arLedgerGzip: 'gzip', arLedgerDeps: '运行时依赖',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '陆・随手试', pgStationH2: '游乐场',
    pgStationLede: '编写Markdown或HTML，这一整页汉.css的讲究，即刻套用于你的文字。',
    pgStationViewsLegend: '编辑器页签', pgStationTabPreview: '预览', pgStationTabCode: '源码',
    pgStationCodeLabel: '源码编辑区', pgStationPreviewLabel: '排版预览',
    pgStationSample: '## 换你的字上场\n\n删掉这段，贴上你的——汉字与Latin、与2026之间，发丝之隙自动匀出；要紧的词以<em>着重号</em>圈点。\n\n> 「引文退两字，标点悬出行外，行末仍齐。」\n\n<ruby class="zhuyin">汉<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>注音、<cite>本草纲目</cite>书名号，皆随字而至。',

    snEyebrow: '柒・引用码', snH2: '生成引用码', snLede: '这里的代码按照面板当前的配置实时生成，设置改了，代码也跟着变。npm、CDN、内嵌三种形式，选一种复制粘贴就能直接用。',
    snFinishLine: '选好了？三种引用方式，贴进<code>&lt;head&gt;</code>、打包入口，或单档编辑器即完成。',
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
    pgOutBundler: 'npm', pgOutCdn: 'CDN', pgOutInline: 'Inline', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: 'Specimen language', dlHant: 'TC', dlHans: 'SC', dlJa: 'JA', dlKo: 'KO',

    // ─── HP-2: new homepage stations (manifesto / station-* / closing) ───
    mfH1: 'Crafting movable type within the pixels, <br /> for every Han character.',
    mfLede: 'A Hanzi typography system: CSS variables for bone, a little JavaScript for sinew — hanging punctuation, emphasis dots, ruby, mixed-script spacing, each with its rule. No hand-typed space between scripts, a fixed 0.125em gap — the discipline of hot metal, not a rule dropped.',
    mfDogfood: 'This page is the specimen — tweak the panel, watch the whole page respond.',

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

    stEyebrow: 'II・Typography', stH2: 'Century-old letterforms, punctuation set right',
    stHeritageP: 'Heritage forms (Shanggu／Genki, switchable in the panel) carry the unsimplified structure of the hot-metal era — not "older", but "never drifted".',
    stPunctFixP: 'Em dashes, ellipses and interpuncts share their codepoints with Western scripts — whichever font sits first in the stack has the final say, so “—” snaps in half and “…” sinks to the baseline. A punctuation-only font sits at the very front and puts every mark back where it belongs.',
    stPunctP: 'Even punctuation follows regional convention — the curve of「」『』（）, the position of commas and periods. MOE (Taiwan), JIS (Japan), GB (Mainland China) each differ; one CSS variable switches the whole page, and the rhythm of「，。」shifts with it.',

    slEyebrow: 'III・Line adjustments', slH2: 'How a line breathes',
    slP1: '"世界，你好。""你好，世界！" Adjacent punctuation no longer crowds together — when a full stop lands at line end, it hangs past the margin instead of pushing in.',
    slP2: 'Where Hanzi meets English, or digits like 2011, a 0.125em gap opens between scripts — exactly what CSS text-autospace measures out, no manual space required.',
    prEyebrow: 'IV・Prose', prH2: 'Paragraphs, well measured',
    prP1: 'Long-form text starts with justification — a Han paragraph sets as a solid block, no ragged edge. And when headings stack, the gap between them closes to zero, so an eyebrow and its title read as one piece.',
    prP2: 'One ruler for every indent — blockquotes, figures and lists all step in by two characters (2em), so hierarchy comes from a single measure. It applies inside <code>article</code> by default (the scope is yours to change in the panel); these very paragraphs sit in one, so flip the prose module switch and watch them reflow.',
    prQuote: 'A blockquote steps in two characters — this paragraph is its own ruler.',

    // ── HP v2: station V・Architecture (unlayered / won't-fight-your-CSS) ──
    arEyebrow: 'V・Architecture', arH2: 'The most flexible typesetting framework',
    arLede: 'Zero specificity, layered by design — your CSS always has the last word.',
    arP1: 'Every selector in the library is wrapped in <code>:where()</code>, so its specificity is zero — one line of your own <code>h2 { }</code> overrides the whole framework, with no <code>!important</code> and no selector-length arms race.',
    arP3: 'Customising needs no HTML either — <code>@container style()</code> lets any container stake a claim with a single custom property: set <code>--han-em-symbol: sesame</code> and the emphasis dots in that subtree turn to sesame; set <code>--han-prose: off</code> and that block opts out of the long-form rules.',
    arOverrideLabel: 'your stylesheet', arOverrideResult: 'what renders — you win',
    arLayerNote: 'Four layers — exactly the four module switches in the left column.',
    arContainerA: 'default', arContainerB: 'sesame — one variable on the container',
    arSampleText: 'The <em>part that matters</em> in typesetting, clear at a glance.',
    arQuoteSample: 'She said, <q>this colour is my call, set in CSS.</q>',
    arNote: 'Zero specificity across the whole library — overriding never needs !important.',
    arLedgerTotal: 'All four modules', arLedgerGzip: 'gzip', arLedgerDeps: 'runtime dependency',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: 'VI・Playground', pgStationH2: 'Bring your own words',
    pgStationLede: '— paste Markdown or harmless HTML, and the craft of this page applies to your words at once.',
    pgStationViewsLegend: 'Editor view', pgStationTabPreview: 'Preview', pgStationTabCode: 'Code',
    pgStationCodeLabel: 'Source editor', pgStationPreviewLabel: 'Rendered preview',
    pgStationSample: '## Bring your own words\n\nEdit this freely — Han typography just works. The spacing between 漢字 and Latin is automatic, and emphasis dots mark <em lang="zh-Hant">要緊處</em>.\n\n> A blockquote keeps its manners — hanging punctuation, tidy line ends.\n\nRuby too: <ruby class="zhuyin" lang="zh-Hant">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin" lang="zh-Hant">字<rt>ㄗˋ</rt></ruby>.',

    snEyebrow: 'VII・Snippet', snH2: 'Generate the snippet', snLede: '— generated live from your panel settings: flip a switch and the code updates. Pick npm, CDN, or inline, copy, paste, done.',
    snFinishLine: 'Made your picks? Three ways to bring it in — paste into <code>&lt;head&gt;</code>, your bundler entry, or straight into a single-file editor, and you\'re done.',
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
    pgGrpModules: '模組', pgGrpSemantics: '語意樣式標準化', pgGrpProse: '段落間距調整',
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
    pgTogLegacyRuby: '舊式ruby轉換', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用碼形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', pgOutInline: '內嵌', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '範文語言', dlHant: '繁', dlHans: '簡', dlJa: '日', dlKo: '韓',

    // NOTE: HP-2 station keys below are not yet localized for ja —
    // falling back to the hant (Traditional Chinese) values per
    // established convention. Revisit when ja copy is written.
    mfH1: 'ピクセルの間の活字美学、<br />画面に並ぶ漢字へ。',
    mfLede: '或擠壓或懸掛的標點、強調文本旁的著重號、為漢字標上的注音與拼音、文種之間的分寸、專名之間的斷點——鉛字時代的匠人工藝，透過CSS自訂屬性與少量JavaScript回落，在螢幕上一一重現。',
    mfDogfood: '本頁即範文——面板隨手一撥，效果與代碼實時改寫。',

    // ─── HP v2: hero vertical lede + station ledes / specimen /
    // comparison labels / marginalia notes / snippet bridge ───
    mfVLede: '排版是文明的底稿——鉛字承載的智慧，在螢幕上繼續演化。',
    ssLede: '精心校調的語意元素樣式——與漢字水火不容的偽斜體，就此告別。',
    ssSpecimen: '文字之<em>道在細節</em>，讀<cite>考工記</cite>可知——<u>王羲之</u>寫過的每一筆，瀏覽器都該記得。',
    ssNote: '旁註記的是對應的變數名——寬螢幕才出現。',
    stLede: '一字三面——黑、明、楷，各司其職。',
    stTrayNote: '活字印刷時代，排版工人憑記憶在字盤中揀取文章所需的活字，填入版框；Web字體時代，數萬字的漢字字體依使用頻率分割為120個切片，取字的差事交給瀏覽器與<code>unicode-range</code>——按需下載，經CDN毫秒級遞送，填補千萬終端上系統字體的美學空缺。',
    stCompareSample: '字距，行氣。',
    stCompareMoe: 'MOE・教育部', stCompareGb: 'GB・國標', stCompareOff: '關・原字體',
    stNote: '撥左欄「傳承字形」，三面互換。',
    slLede: '擠壓收其內，懸掛出其外，分寸勻乎文種之間。',
    slHangOffLabel: '懸掛・關', slHangOnLabel: '懸掛・開（han.css）',
    slHangOffSample: '「世界，你好！」句子走到行末，標點擠而不入，版面凹凸。',
    slHangOnSample: '「世界，你好！」句子走到行末，標點懸出格外，段落見方。',
    slNote: '間隙由CSS生成，文中沒有一個空格字元。',
    prNote: '作用域預設在<code>article</code>元素，透過<code>--han-prose: on/off</code>，在任何選擇器開關整個模塊。',
    snBridge: '配置即代碼',

    ssEyebrow: '壹・語意', ssH2: '名正言順的元素樣式',
    ssP1: '語意與樣式分離——著重號、書名號、專名號、深淺字重、黑明楷體——語意元素在漢字排版下應有的樣式，漢.css逐一重新定義，使用正確的元素即手可得，繁簡日韓各有所依。<em>著重號</em>標記文中緊要強調之處一如本句。',

    stEyebrow: '貳・字體排印', stH2: '百年傳承的字形，拂歧歸正的標點',
    stHeritageP: '傳承字形（尚古／源起，可由面板切換）承載了鉛字時代未經簡化的結構——非「更古老」，而是「未曾漂移」。',
    stPunctFixP: '破折號、刪節號、間隔號的碼位中西共用，字體堆疊裡誰排前面，誰就說了算——於是「——」常被西文字體斷成兩截，「……」沉到基線。標點字體只含標點、排在堆疊最前，把它們一一放回原位。',
    stPunctP: '標點斷連亦有地域公約——「」『』（）之弧直、逗句之位置，MOE（臺灣教育部）、JIS（日本工業規格）、GB（大陸國標）三制各異，一行CSS變量切換，「，。」之呼吸隨之而變。',

    slEyebrow: '叁・行的調整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相鄰標點擠去多餘的半格，緊收而不空洞；句讀行至末端，懸而不入，字距不因禁則換行而鬆動。',
    slP2: '漢字與Latin、與Ελληνικά、與кириллица字母，與0-9的數字相遇，其間自動勻出髮絲之隙。不寬不窄，恰是跨文種間的優雅分寸。',
    prEyebrow: '肆・段落', prH2: '疏密有致的段落調配',
    prP1: '標點擠壓掌管主軸的留白，交叉軸的節奏由prose模塊指揮——標題、段落、清單之間，間距去蕪存菁，數位長文也舒適易讀。',
    prP2: '西文字母寬窄錯落，漢字方塊成格——中日韓縮排捨40像素的預設，用漢字整數倍的空間代之。以字為尺，版面縱橫對齊。',
    prQuote: '引文退兩字——這一段自己，就是那把尺。',

    // ── HP v2: station 伍・工法 (unlayered / won't-fight-your-CSS) ──
    arEyebrow: '伍・工法', arH2: '輕如鴻毛的排版框架',
    arLede: '一百〇九個〇，仍然是「〇」——隨意覆寫，後來者的樣式說了算。',
    arP1: '透過<code>:where()</code>偽類函數，漢.css放棄所有樣式的選擇器權重，配合可自由定義樣式模塊順序的<code>@layer</code>，作者可大膽而隨心所欲地覆寫、重構框架提供的任何機能。',
    arP3: '透過CSS變量及style query <code>@container</code>，在任何選擇器上開關、調校機能——原生CSS給作者最大的自訂彈性。',
    arOverrideLabel: '你的樣式表', arOverrideResult: '實際渲染——你贏了',
    arLayerNote: '四層，正是左欄的四顆模組開關。',
    arContainerA: '預設', arContainerB: '芝麻點——容器上一個變數的事',
    arSampleText: '排版的<em>要緊處</em>，一眼可辨。',
    arQuoteSample: '他說：<q>這行顏色是我的CSS說了算。</q>',
    arNote: '全庫零權重，覆寫從不需要!important。',
    arLedgerTotal: '四模塊合計', arLedgerGzip: 'gzip', arLedgerDeps: '運行時依賴',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '陸・試玩', pgStationH2: '遊樂場',
    pgStationLede: '編寫Markdown或HTML，這一整頁漢.css的講究，即刻套用於你的文字。',
    pgStationViewsLegend: '編輯器分頁', pgStationTabPreview: '預覽', pgStationTabCode: '原始碼',
    pgStationCodeLabel: '原始碼編輯區', pgStationPreviewLabel: '排版預覽',
    pgStationSample: '## 換你的字上場\n\n刪掉這段，貼上你的——漢字與Latin、與2026之間，髮絲之隙自動勻出；要緊的詞以<em>著重號</em>圈點。\n\n> 「引文退兩字，標點懸出行外，行末仍齊。」\n\n<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>注音、<cite>本草綱目</cite>書名號，皆隨字而至。',

    snEyebrow: '柒・引用碼', snH2: '生成引用碼', snLede: '這裡的代碼照著面板目前的配置即時生成，設定改了，代碼也跟著變。npm、CDN、內嵌三種形式，選一種複製貼上就能直接用。',
    snFinishLine: '選好了？三種引用方式，貼進<code>&lt;head&gt;</code>、打包入口，或單檔編輯器即完成。',
    snBrowserSupport: '支援現代常青瀏覽器。',

    clInstallLabel: '一行安裝', clZianoLabel: 'ziano・傳承字形Web字體',
    clDiantenjeomLabel: 'diantenjeom・標點符號字型', clOldHomeLabel: '舊版首頁',

    // NOTE: rail keys below are not yet localized for ja — falling back
    // to the hant (Traditional Chinese) values per established
    // convention. Revisit when ja copy is written.
    railHeader: '配置面板——撥動即改寫全頁',
    pgUseDefault: '使用預設值',
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
    pgGrpModules: '模組', pgGrpSemantics: '語意樣式標準化', pgGrpProse: '段落間距調整',
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
    pgTogLegacyRuby: '舊式ruby轉換', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用碼形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', pgOutInline: '內嵌', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '範文語言', dlHant: '繁', dlHans: '簡', dlJa: '日', dlKo: '韓',

    // NOTE: HP-2 station keys below are not yet localized for ko —
    // falling back to the hant (Traditional Chinese) values per
    // established convention. Revisit when ko copy is written.
    mfH1: '<ruby>픽셀<rt>pixel</rt></ruby> 사이의 <ruby>活字<rt>활자</rt></ruby> <ruby>美學<rt>미학</rt></ruby>, <br /><ruby>畫面<rt>화면</rt></ruby>의 <ruby>漢字<rt>한자</rt></ruby>에게.',
    mfLede: '或擠壓或懸掛的標點、強調文本旁的著重號、為漢字標上的注音與拼音、文種之間的分寸、專名之間的斷點——鉛字時代的匠人工藝，透過CSS自訂屬性與少量JavaScript回落，在螢幕上一一重現。',
    mfDogfood: '本頁即範文——面板隨手一撥，效果與代碼實時改寫。',

    // ─── HP v2: hero vertical lede + station ledes / specimen /
    // comparison labels / marginalia notes / snippet bridge ───
    mfVLede: '排版是文明的底稿——鉛字承載的智慧，在螢幕上繼續演化。',
    ssLede: '精心校調的語意元素樣式——與漢字水火不容的偽斜體，就此告別。',
    ssSpecimen: '文字之<em>道在細節</em>，讀<cite>考工記</cite>可知——<u>王羲之</u>寫過的每一筆，瀏覽器都該記得。',
    ssNote: '旁註記的是對應的變數名——寬螢幕才出現。',
    stLede: '一字三面——黑、明、楷，各司其職。',
    stTrayNote: '活字印刷時代，排版工人憑記憶在字盤中揀取文章所需的活字，填入版框；Web字體時代，數萬字的漢字字體依使用頻率分割為120個切片，取字的差事交給瀏覽器與<code>unicode-range</code>——按需下載，經CDN毫秒級遞送，填補千萬終端上系統字體的美學空缺。',
    stCompareSample: '字距，行氣。',
    stCompareMoe: 'MOE・教育部', stCompareGb: 'GB・國標', stCompareOff: '關・原字體',
    stNote: '撥左欄「傳承字形」，三面互換。',
    slLede: '擠壓收其內，懸掛出其外，分寸勻乎文種之間。',
    slHangOffLabel: '懸掛・關', slHangOnLabel: '懸掛・開（han.css）',
    slHangOffSample: '「世界，你好！」句子走到行末，標點擠而不入，版面凹凸。',
    slHangOnSample: '「世界，你好！」句子走到行末，標點懸出格外，段落見方。',
    slNote: '間隙由CSS生成，文中沒有一個空格字元。',
    prNote: '作用域預設在<code>article</code>元素，透過<code>--han-prose: on/off</code>，在任何選擇器開關整個模塊。',
    snBridge: '配置即代碼',

    ssEyebrow: '壹・語意', ssH2: '名正言順的元素樣式',
    ssP1: '語意與樣式分離——著重號、書名號、專名號、深淺字重、黑明楷體——語意元素在漢字排版下應有的樣式，漢.css逐一重新定義，使用正確的元素即手可得，繁簡日韓各有所依。<em>著重號</em>標記文中緊要強調之處一如本句。',

    stEyebrow: '貳・字體排印', stH2: '百年傳承的字形，拂歧歸正的標點',
    stHeritageP: '傳承字形（尚古／源起，可由面板切換）承載了鉛字時代未經簡化的結構——非「更古老」，而是「未曾漂移」。',
    stPunctFixP: '破折號、刪節號、間隔號的碼位中西共用，字體堆疊裡誰排前面，誰就說了算——於是「——」常被西文字體斷成兩截，「……」沉到基線。標點字體只含標點、排在堆疊最前，把它們一一放回原位。',
    stPunctP: '標點斷連亦有地域公約——「」『』（）之弧直、逗句之位置，MOE（臺灣教育部）、JIS（日本工業規格）、GB（大陸國標）三制各異，一行CSS變量切換，「，。」之呼吸隨之而變。',

    slEyebrow: '叁・行的調整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相鄰標點擠去多餘的半格，緊收而不空洞；句讀行至末端，懸而不入，字距不因禁則換行而鬆動。',
    slP2: '漢字與Latin、與Ελληνικά、與кириллица字母，與0-9的數字相遇，其間自動勻出髮絲之隙。不寬不窄，恰是跨文種間的優雅分寸。',
    prEyebrow: '肆・段落', prH2: '疏密有致的段落調配',
    prP1: '標點擠壓掌管主軸的留白，交叉軸的節奏由prose模塊指揮——標題、段落、清單之間，間距去蕪存菁，數位長文也舒適易讀。',
    prP2: '西文字母寬窄錯落，漢字方塊成格——中日韓縮排捨40像素的預設，用漢字整數倍的空間代之。以字為尺，版面縱橫對齊。',
    prQuote: '引文退兩字——這一段自己，就是那把尺。',

    // ── HP v2: station 伍・工法 (unlayered / won't-fight-your-CSS) ──
    arEyebrow: '伍・工法', arH2: '輕如鴻毛的排版框架',
    arLede: '一百〇九個〇，仍然是「〇」——隨意覆寫，後來者的樣式說了算。',
    arP1: '透過<code>:where()</code>偽類函數，漢.css放棄所有樣式的選擇器權重，配合可自由定義樣式模塊順序的<code>@layer</code>，作者可大膽而隨心所欲地覆寫、重構框架提供的任何機能。',
    arP3: '透過CSS變量及style query <code>@container</code>，在任何選擇器上開關、調校機能——原生CSS給作者最大的自訂彈性。',
    arOverrideLabel: '你的樣式表', arOverrideResult: '實際渲染——你贏了',
    arLayerNote: '四層，正是左欄的四顆模組開關。',
    arContainerA: '預設', arContainerB: '芝麻點——容器上一個變數的事',
    arSampleText: '排版的<em>要緊處</em>，一眼可辨。',
    arQuoteSample: '他說：<q>這行顏色是我的CSS說了算。</q>',
    arNote: '全庫零權重，覆寫從不需要!important。',
    arLedgerTotal: '四模塊合計', arLedgerGzip: 'gzip', arLedgerDeps: '運行時依賴',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '陸・試玩', pgStationH2: '遊樂場',
    pgStationLede: '編寫Markdown或HTML，這一整頁漢.css的講究，即刻套用於你的文字。',
    pgStationViewsLegend: '編輯器分頁', pgStationTabPreview: '預覽', pgStationTabCode: '原始碼',
    pgStationCodeLabel: '原始碼編輯區', pgStationPreviewLabel: '排版預覽',
    pgStationSample: '## 換你的字上場\n\n刪掉這段，貼上你的——漢字與Latin、與2026之間，髮絲之隙自動勻出；要緊的詞以<em>著重號</em>圈點。\n\n> 「引文退兩字，標點懸出行外，行末仍齊。」\n\n<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>注音、<cite>本草綱目</cite>書名號，皆隨字而至。',

    snEyebrow: '柒・引用碼', snH2: '生成引用碼', snLede: '這裡的代碼照著面板目前的配置即時生成，設定改了，代碼也跟著變。npm、CDN、內嵌三種形式，選一種複製貼上就能直接用。',
    snFinishLine: '選好了？三種引用方式，貼進<code>&lt;head&gt;</code>、打包入口，或單檔編輯器即完成。',
    snBrowserSupport: '支援現代常青瀏覽器。',

    clInstallLabel: '一行安裝', clZianoLabel: 'ziano・傳承字形Web字體',
    clDiantenjeomLabel: 'diantenjeom・標點符號字型', clOldHomeLabel: '舊版首頁',

    // NOTE: rail keys below are not yet localized for ko — falling back
    // to the hant (Traditional Chinese) values per established
    // convention. Revisit when ko copy is written.
    railHeader: '配置面板——撥動即改寫全頁',
    pgUseDefault: '使用預設值',
    railCollapse: '收合面板',
  },
}
