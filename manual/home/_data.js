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
    siteTitle: '漢.css・印刷品般的漢字排版框架',
    description: '印刷品般的漢字網頁排版框架。',
    docs: '文檔', langSwitcherLabel: '切換語言・LANGUAGE',
    langSwitcherFoot: '站本身切換 5 種語言・操場可獨立選任一語言範文',
    themeToggle: '切換主題',
    pgMetricsLabel: '度量',
    pgSliderSize: '字級', pgSliderSizeEn: 'font-size',
    pgSliderLeading: '行距', pgSliderLeadingEn: 'line-height',
    pgSliderWeight: '字重', pgSliderWeightEn: 'font-weight',
    pgWritingLabel: '書寫方向', pgWritingHorizontal: '橫排', pgWritingVertical: '直排',

    pgGrpSemantics: '語意樣式標準化', pgGrpProse: '長文段落優化', pgTogEnabled: '啟用',
   
   
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
    pgZianoDelivery: 'Ziano引入', pgZianoCdnSource: 'CDN來源',
    pgCursive: '楷體',
    pgModeWebfont: 'Web字體', pgModeSystem: '系統日文字體', pgModeOff: '關閉',
    pgGrpPunct: '標點字體（Diantenjeom）',
    pgPunctHant: '繁體中文', pgPunctHans: '簡體中文', pgPunctJa: '日文', pgPunctKo: '韓文直排',
    pgTogZhuyin: '注音Web字體',
    pgGrpJs: 'JavaScript',
    pgTogFallbacks: 'JS排版補全', pgTogFallbacksEn: 'installFallbacks',
    pgTogLegacyRuby: '舊式 ruby 轉換', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用碼形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '範文語言', dlHant: '繁', dlHans: '簡', dlJa: '日', dlKo: '韓',

    // ─── HP-2: new homepage stations (manifesto / station-* / closing) ───
    mfH1a: '印刷品般的', mfH1b: '漢字排版',
    mfLede: '這是一套以CSS custom properties與少量JavaScript撐起的漢字排版系統——標點懸掛、著重號、注音、跨文種混排，字距不假空格字元，間隙定量0.125em，一如鉛字時代的講究。',
    mfDogfood: '本頁即範文——面板隨手撥，全頁隨你而變。',
    mfStatLocales: '支援語種', mfStatSize: 'Gzip體積（css+js）', mfStatDeps: '外部依賴',

    ssEyebrow: '壹・語意', ssH2: '語意，先於樣式',
    ssP1: 'HTML5語意元素在漢字排版下自有其正確樣式——<em>著重號</em>標記文中緊要之詞，效果一如手寫圈點。',
    ssP2: '引用書名時可用<cite>說文解字</cite>標記。書名號預設關閉（<code>--han-cite-title-marks: none</code>），此處另加一行<code>--han-cite-title-marks: bracket</code>方得見《》。',
    ssP3: '專有名詞可用<u>專名號</u>標示，如人名地名。<abbr title="Cascading Style Sheets">CSS</abbr>一類縮寫，則交由&lt;abbr&gt;元素承載完整釋義。',
    ssJaLead: '日文引文亦各得其所——',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: '貳・字體排印', stH2: '一字三面',
    stHeritageP: '傳承字形（尚古／源起，可由面板切換）承載了鉛字時代未經簡化的結構——非「更古老」，而是「未曾漂移」。',
    stPunctP: '標點斷連亦有地域公約——「」『』（）之弧直、逗句之位置，MOE（臺灣教育部）、JIS（日本工業規格）、GB（大陸國標）三制各異，一行CSS變量切換，「，。」之呼吸隨之而變。',
    stPunctExamples: '同一頁上，各語言標點各從其規範——簡體如<span lang="zh-Hans">「简体的引号与句号。」</span>，日文如<span lang="ja">「日本語の約物です。」</span>，韓文如<span lang="ko">「한국어 문장입니다.」</span>。',

    slEyebrow: '叁・行的調整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相鄰標點不再擠成一團——句尾若逢行末，標點懸而不入，版面仍齊。',
    slP2: '漢字與English、與2011一類數字相遇，中西之間留隙0.125em——不多不少，恰是CSS text-autospace的量尺，無需手動空格。',
    slP3: '東京<ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby>，一行標記，字旁直書；日文原寫作<span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>，假名注音，兩制並陳。',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '肆・試玩', pgStationH2: '換你的字上場',
    pgStationLede: '——貼上Markdown或無傷大雅的HTML，切到預覽即見漢字排版。',
    pgStationViewsLegend: '編輯器分頁', pgStationTabPreview: '預覽', pgStationTabCode: '原始碼',
    pgStationCodeLabel: '原始碼編輯區', pgStationPreviewLabel: '排版預覽',
    pgStationSample: '## 換你的字上場\n\n這是一段可自由編輯的範文。漢字與Latin、與2024並肩時，字距自動勻稱，不必手動空格。文中要緊的詞用<em>著重號</em>圈點。\n\n> 「引文自有其講究——標點懸掛，行末仍齊。」\n\n注音直書亦不在話下：<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>。\n\n<cite>本草綱目</cite><cite>辭海</cite>',

    snEyebrow: '伍・引用碼', snH2: '生成引用碼', snLede: '——切換頁籤，取你要的引用方式。',
    snFinishLine: '選好了？兩種引用方式，貼進<code>&lt;head&gt;</code>或打包入口即完成。',
    snBrowserSupport: '支援現代常青瀏覽器。',

    clInstallLabel: '一行安裝', clZianoLabel: 'ziano・傳承字形Web字體',
    clDiantenjeomLabel: 'diantenjeom・標點符號字型', clOldHomeLabel: '舊版首頁',

    railHeader: '配置面板——撥動即改寫全頁',
    pgUseDefault: '使用預設値',
  },
  hans: {
    siteTitle: '汉.css・印刷品般的汉字排版框架',
    description: '印刷品般的汉字网页排版框架。',
    docs: '文档', langSwitcherLabel: '切换语言・LANGUAGE',
    langSwitcherFoot: '站本身切换 5 种语言・操场可独立选任一语言范文',
    themeToggle: '切换主题',
    pgMetricsLabel: '度量',
    pgSliderSize: '字级', pgSliderSizeEn: 'font-size',
    pgSliderLeading: '行距', pgSliderLeadingEn: 'line-height',
    pgSliderWeight: '字重', pgSliderWeightEn: 'font-weight',
    pgWritingLabel: '书写方向', pgWritingHorizontal: '横排', pgWritingVertical: '直排',

    pgGrpSemantics: '语义样式标准化', pgGrpProse: '长文段落优化', pgTogEnabled: '启用',
   
   
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
    pgZianoDelivery: 'Ziano引入', pgZianoCdnSource: 'CDN来源',
    pgCursive: '楷体',
    pgModeWebfont: 'Web字体', pgModeSystem: '系统字体', pgModeOff: '关闭',
    pgGrpPunct: '标点字体（Diantenjeom）',
    pgPunctHant: '繁体中文', pgPunctHans: '简体中文', pgPunctJa: '日文', pgPunctKo: '韩文直排',
    pgTogZhuyin: '注音Web字体',
    pgGrpJs: 'JavaScript',
    pgTogFallbacks: 'JS排版补全', pgTogFallbacksEn: 'installFallbacks',
    pgTogLegacyRuby: '旧式 ruby 转换', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: '引用码形式',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: '范文语言', dlHant: '繁', dlHans: '简', dlJa: '日', dlKo: '韩',

    // ─── HP-2: new homepage stations (manifesto / station-* / closing) ───
    mfH1a: '印刷品般的', mfH1b: '汉字排版',
    mfLede: '这是一套以CSS custom properties与少量JavaScript撑起的汉字排版系统——标点悬挂、着重号、注音、跨文种混排，字距不假空格字符，间隙定量0.125em，一如铅字时代的讲究。',
    mfDogfood: '本页即范文——面板随手拨，全页随你而变。',
    mfStatLocales: '支持语种', mfStatSize: 'Gzip体积（css+js）', mfStatDeps: '外部依赖',

    ssEyebrow: '壹・语意', ssH2: '语意，先于样式',
    ssP1: 'HTML5语意元素在汉字排版下自有其正确样式——<em>着重号</em>标记文中紧要之词，效果一如手写圈点。',
    ssP2: '引用书名时可用<cite>说文解字</cite>标记。书名号默认关闭（<code>--han-cite-title-marks: none</code>），此处另加一行<code>--han-cite-title-marks: bracket</code>方得见《》。',
    ssP3: '专有名词可用<u>专名号</u>标示，如人名地名。<abbr title="Cascading Style Sheets">CSS</abbr>一类缩写，则交由&lt;abbr&gt;元素承载完整释义。',
    ssJaLead: '日文引文亦各得其所——',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: '贰・字体排印', stH2: '一字三面',
    stHeritageP: '传承字形（尚古／源起，可由面板切换）承载了铅字时代未经简化的结构——非「更古老」，而是「未曾漂移」。',
    stPunctP: '标点断连亦有地域公约——「」『』（）之弧直、逗句之位置，MOE（台湾教育部）、JIS（日本工业规格）、GB（大陆国标）三制各异，一行CSS变量切换，「，。」之呼吸随之而变。',
    stPunctExamples: '同一页上，各语言标点各从其规范——简体如<span lang="zh-Hans">「简体的引号与句号。」</span>，日文如<span lang="ja">「日本語の約物です。」</span>，韩文如<span lang="ko">「한국어 문장입니다.」</span>。',

    slEyebrow: '叁・行的调整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相邻标点不再挤成一团——句尾若逢行末，标点悬而不入，版面仍齐。',
    slP2: '汉字与English、与2011一类数字相遇，中西之间留隙0.125em——不多不少，恰是CSS text-autospace的量尺，无需手动空格。',
    slP3: '东京<ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby>，一行标记，字旁直书；日文原写作<span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>，假名注音，两制并陈。',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '肆・随手试', pgStationH2: '换你的字上场',
    pgStationLede: '——贴上Markdown或无伤大雅的HTML，切到预览即见汉字排版。',
    pgStationViewsLegend: '编辑器页签', pgStationTabPreview: '预览', pgStationTabCode: '源码',
    pgStationCodeLabel: '源码编辑区', pgStationPreviewLabel: '排版预览',
    pgStationSample: '## 换你的字上场\n\n这是一段可自由编辑的范文。汉字与Latin、与2024并肩时，字距自动匀称，不必手动空格。文中要紧的词用<em>着重号</em>圈点。\n\n> 「引文自有其讲究——标点悬挂，行末仍齐。」\n\n注音直书亦不在话下：<ruby class="zhuyin">汉<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>。',

    snEyebrow: '伍・引用码', snH2: '生成引用码', snLede: '——切换页签，取你要的引用方式。',
    snFinishLine: '选好了？两种引用方式，贴进<code>&lt;head&gt;</code>或打包入口即完成。',
    snBrowserSupport: '支持现代常青浏览器。',

    clInstallLabel: '一行安装', clZianoLabel: 'ziano・传承字形Web字体',
    clDiantenjeomLabel: 'diantenjeom・标点符号字型', clOldHomeLabel: '旧版首页',

    railHeader: '配置面板——拨动即改写全页',
    pgUseDefault: '使用预设值',
  },
  en: {
    siteTitle: 'Han.css・Print-quality Hanzi typography for the web',
    description: 'A typography framework for print-quality Hanzi on the web.',
    docs: 'Docs', langSwitcherLabel: 'Switch language・LANGUAGE',
    langSwitcherFoot: 'Site supports 5 languages・the playground sample picks any independently.',
    themeToggle: 'Toggle theme',
    pgMetricsLabel: 'Metrics',
    pgSliderSize: 'Size', pgSliderSizeEn: 'font-size',
    pgSliderLeading: 'Leading', pgSliderLeadingEn: 'line-height',
    pgSliderWeight: 'Weight', pgSliderWeightEn: 'font-weight',
    pgWritingLabel: 'Writing mode', pgWritingHorizontal: 'Horizontal', pgWritingVertical: 'Vertical',

    pgGrpSemantics: 'Semantic styling', pgGrpProse: 'Long-form prose', pgTogEnabled: 'Enabled',
   
   
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
    pgZianoDelivery: 'Ziano delivery', pgZianoCdnSource: 'CDN source',
    pgCursive: 'Cursive',
    pgModeWebfont: 'Webfont', pgModeSystem: 'System font', pgModeOff: 'Off',
    pgGrpPunct: 'Punctuation fonts (Diantenjeom)',
    pgPunctHant: 'Traditional Chinese', pgPunctHans: 'Simplified Chinese', pgPunctJa: 'Japanese', pgPunctKo: 'Korean (vertical)',
    pgTogZhuyin: 'Zhuyin Webfont',
    pgGrpJs: 'JavaScript',
    pgTogFallbacks: 'JS typesetting shims', pgTogFallbacksEn: 'installFallbacks',
    pgTogLegacyRuby: 'Legacy ruby conversion', pgTogLegacyRubyEn: 'convertLegacyRuby',

    pgViewsLegend: 'Snippet format',
    pgOutBundler: 'npm', pgOutCdn: 'CDN', // label only — codegen's renderBundler export + radio value 'bundler' stay

    dlLegend: 'Specimen language', dlHant: 'TC', dlHans: 'SC', dlJa: 'JA', dlKo: 'KO',

    // ─── HP-2: new homepage stations (manifesto / station-* / closing) ───
    mfH1a: 'Print-quality', mfH1b: 'Hanzi typography',
    mfLede: 'A Hanzi typography system built on CSS custom properties and a touch of JavaScript — hanging punctuation, emphasis dots, ruby, mixed-script spacing. No hand-typed spaces, a measured 0.125em gap, the rigor of hot metal.',
    mfDogfood: 'This page is the specimen — tweak the panel, watch the whole page respond.',
    mfStatLocales: 'locales', mfStatSize: 'gzip size (css+js)', mfStatDeps: 'dependency',

    ssEyebrow: 'I・Semantics', ssH2: 'Semantics before style',
    ssP1: 'HTML5 semantic elements have their own correct typographic treatment — <em>emphasis dots</em> mark the words that matter, the way a hand-drawn circle would.',
    ssP2: 'Citing a title uses <cite>Shuowen Jiezi</cite>; title marks default to off (<code>--han-cite-title-marks: none</code>) — here one extra line, <code>--han-cite-title-marks: bracket</code>, turns the 《》 back on.',
    ssP3: 'Proper nouns take <u>a proper-noun underline</u>, for names and places; abbreviations like <abbr title="Cascading Style Sheets">CSS</abbr> carry their full expansion in the &lt;abbr&gt; element itself.',
    ssJaLead: 'Japanese citations, too, find their proper place —',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: 'II・Typography', stH2: 'One glyph, three faces',
    stHeritageP: 'Heritage forms (Shanggu／Genki, switchable in the panel) carry the unsimplified structure of the hot-metal era — not "older", but "never drifted".',
    stPunctP: 'Even punctuation follows regional convention — the curve of「」『』（）, the position of commas and periods. MOE (Taiwan), JIS (Japan), GB (Mainland China) each differ; one CSS variable switches the whole page, and the rhythm of「，。」shifts with it.',
    stPunctExamples: 'On this very page, each language keeps its own punctuation convention — Simplified as in <span lang="zh-Hans">「简体的引号与句号。」</span>, Japanese as in <span lang="ja">「日本語の約物です。」</span>, Korean as in <span lang="ko">「한국어 문장입니다.」</span>.',

    slEyebrow: 'III・Line adjustments', slH2: 'How a line breathes',
    slP1: '"世界，你好。""你好，世界！" Adjacent punctuation no longer crowds together — when a full stop lands at line end, it hangs past the margin instead of pushing in.',
    slP2: 'Where Hanzi meets English, or digits like 2011, a 0.125em gap opens between scripts — exactly what CSS text-autospace measures out, no manual space required.',
    slP3: 'Tokyo <ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby> Skytree — one ruby per character, set beside its base; the Japanese original writes it as <span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>, kana ruby instead of zhuyin — two conventions, side by side.',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: 'IV・Playground', pgStationH2: 'Bring your own words',
    pgStationLede: '— paste Markdown or plain HTML and watch han.css typeset it.',
    pgStationViewsLegend: 'Editor view', pgStationTabPreview: 'Preview', pgStationTabCode: 'Code',
    pgStationCodeLabel: 'Source editor', pgStationPreviewLabel: 'Rendered preview',
    pgStationSample: '## Bring your own words\n\nEdit this freely — Han typography just works. The spacing between 漢字 and Latin is automatic, and emphasis dots mark <em lang="zh-Hant">要緊處</em>.\n\n> A blockquote keeps its manners — hanging punctuation, tidy line ends.\n\nRuby too: <ruby class="zhuyin" lang="zh-Hant">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin" lang="zh-Hant">字<rt>ㄗˋ</rt></ruby>.',

    snEyebrow: 'V・Snippet', snH2: 'Generate the snippet', snLede: '— switch tabs to get the form you need.',
    snFinishLine: 'Made your picks? Two ways to bring it in — paste into <code>&lt;head&gt;</code> or your bundler entry and you\'re done.',
    snBrowserSupport: 'Supports modern evergreen browsers.',

    clInstallLabel: 'One-line install', clZianoLabel: 'ziano・heritage Webfont',
    clDiantenjeomLabel: 'diantenjeom・punctuation font', clOldHomeLabel: 'Previous homepage',

    railHeader: 'Configurator — flip a switch, the whole page rewrites itself',
    pgUseDefault: 'Use default',
  },
  ja: {
    siteTitle: '漢.css・印刷品質の漢字組版フレームワーク',
    description: '印刷品質の漢字組版フレームワーク。',
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
    pgGrpSemantics: '語意樣式標準化', pgGrpProse: '長文段落優化', pgTogEnabled: '啟用',
   
   
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
    pgZianoDelivery: 'Ziano引入', pgZianoCdnSource: 'CDN來源',
    pgCursive: '楷體',
    pgModeWebfont: 'Web字體', pgModeSystem: '系統日文字體', pgModeOff: '關閉',
    pgGrpPunct: '標點字體（Diantenjeom）',
    pgPunctHant: '繁體中文', pgPunctHans: '簡體中文', pgPunctJa: '日文', pgPunctKo: '韓文直排',
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
    mfH1a: '印刷品般的', mfH1b: '漢字排版',
    mfLede: '這是一套以CSS custom properties與少量JavaScript撐起的漢字排版系統——標點懸掛、著重號、注音、跨文種混排，字距不假空格字元，間隙定量0.125em，一如鉛字時代的講究。',
    mfDogfood: '本頁即範文——面板隨手撥，全頁隨你而變。',
    mfStatLocales: '支援語種', mfStatSize: 'Gzip體積（css+js）', mfStatDeps: '外部依賴',

    ssEyebrow: '壹・語意', ssH2: '語意，先於樣式',
    ssP1: 'HTML5語意元素在漢字排版下自有其正確樣式——<em>著重號</em>標記文中緊要之詞，效果一如手寫圈點。',
    ssP2: '引用書名時可用<cite>說文解字</cite>標記。書名號預設關閉（<code>--han-cite-title-marks: none</code>），此處另加一行<code>--han-cite-title-marks: bracket</code>方得見《》。',
    ssP3: '專有名詞可用<u>專名號</u>標示，如人名地名。<abbr title="Cascading Style Sheets">CSS</abbr>一類縮寫，則交由&lt;abbr&gt;元素承載完整釋義。',
    ssJaLead: '日文引文亦各得其所——',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: '貳・字體排印', stH2: '一字三面',
    stHeritageP: '傳承字形（尚古／源起，可由面板切換）承載了鉛字時代未經簡化的結構——非「更古老」，而是「未曾漂移」。',
    stPunctP: '標點斷連亦有地域公約——「」『』（）之弧直、逗句之位置，MOE（臺灣教育部）、JIS（日本工業規格）、GB（大陸國標）三制各異，一行CSS變量切換，「，。」之呼吸隨之而變。',
    stPunctExamples: '同一頁上，各語言標點各從其規範——簡體如<span lang="zh-Hans">「简体的引号与句号。」</span>，日文如<span lang="ja">「日本語の約物です。」</span>，韓文如<span lang="ko">「한국어 문장입니다.」</span>。',

    slEyebrow: '叁・行的調整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相鄰標點不再擠成一團——句尾若逢行末，標點懸而不入，版面仍齊。',
    slP2: '漢字與English、與2011一類數字相遇，中西之間留隙0.125em——不多不少，恰是CSS text-autospace的量尺，無需手動空格。',
    slP3: '東京<ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby>，一行標記，字旁直書；日文原寫作<span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>，假名注音，兩制並陳。',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '肆・試玩', pgStationH2: '換你的字上場',
    pgStationLede: '——貼上Markdown或無傷大雅的HTML，切到預覽即見漢字排版。',
    pgStationViewsLegend: '編輯器分頁', pgStationTabPreview: '預覽', pgStationTabCode: '原始碼',
    pgStationCodeLabel: '原始碼編輯區', pgStationPreviewLabel: '排版預覽',
    pgStationSample: '## 換你的字上場\n\n這是一段可自由編輯的範文。漢字與Latin、與2024並肩時，字距自動勻稱，不必手動空格。文中要緊的詞用<em>著重號</em>圈點。\n\n> 「引文自有其講究——標點懸掛，行末仍齊。」\n\n注音直書亦不在話下：<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>。',

    snEyebrow: '伍・引用碼', snH2: '生成引用碼', snLede: '——切換頁籤，取你要的引用方式。',
    snFinishLine: '選好了？兩種引用方式，貼進<code>&lt;head&gt;</code>或打包入口即完成。',
    snBrowserSupport: '支援現代常青瀏覽器。',

    clInstallLabel: '一行安裝', clZianoLabel: 'ziano・傳承字形Web字體',
    clDiantenjeomLabel: 'diantenjeom・標點符號字型', clOldHomeLabel: '舊版首頁',

    // NOTE: rail keys below are not yet localized for ja — falling back
    // to the hant (Traditional Chinese) values per established
    // convention. Revisit when ja copy is written.
    railHeader: '配置面板——撥動即改寫全頁',
    pgUseDefault: '使用預設値',
  },
  ko: {
    siteTitle: '한.css・인쇄 품질의 한자 조판 프레임워크',
    description: '인쇄 품질의 한자 조판 프레임워크.',
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
    pgGrpSemantics: '語意樣式標準化', pgGrpProse: '長文段落優化', pgTogEnabled: '啟用',
   
   
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
    pgZianoDelivery: 'Ziano引入', pgZianoCdnSource: 'CDN來源',
    pgCursive: '楷體',
    pgModeWebfont: 'Web字體', pgModeSystem: '系統日文字體', pgModeOff: '關閉',
    pgGrpPunct: '標點字體（Diantenjeom）',
    pgPunctHant: '繁體中文', pgPunctHans: '簡體中文', pgPunctJa: '日文', pgPunctKo: '韓文直排',
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
    mfH1a: '印刷品般的', mfH1b: '漢字排版',
    mfLede: '這是一套以CSS custom properties與少量JavaScript撐起的漢字排版系統——標點懸掛、著重號、注音、跨文種混排，字距不假空格字元，間隙定量0.125em，一如鉛字時代的講究。',
    mfDogfood: '本頁即範文——面板隨手撥，全頁隨你而變。',
    mfStatLocales: '支援語種', mfStatSize: 'Gzip體積（css+js）', mfStatDeps: '外部依賴',

    ssEyebrow: '壹・語意', ssH2: '語意，先於樣式',
    ssP1: 'HTML5語意元素在漢字排版下自有其正確樣式——<em>著重號</em>標記文中緊要之詞，效果一如手寫圈點。',
    ssP2: '引用書名時可用<cite>說文解字</cite>標記。書名號預設關閉（<code>--han-cite-title-marks: none</code>），此處另加一行<code>--han-cite-title-marks: bracket</code>方得見《》。',
    ssP3: '專有名詞可用<u>專名號</u>標示，如人名地名。<abbr title="Cascading Style Sheets">CSS</abbr>一類縮寫，則交由&lt;abbr&gt;元素承載完整釋義。',
    ssJaLead: '日文引文亦各得其所——',
    ssJaQuote: '春はあけぼの。やうやう白くなりゆく山際、すこしあかりて。',

    stEyebrow: '貳・字體排印', stH2: '一字三面',
    stHeritageP: '傳承字形（尚古／源起，可由面板切換）承載了鉛字時代未經簡化的結構——非「更古老」，而是「未曾漂移」。',
    stPunctP: '標點斷連亦有地域公約——「」『』（）之弧直、逗句之位置，MOE（臺灣教育部）、JIS（日本工業規格）、GB（大陸國標）三制各異，一行CSS變量切換，「，。」之呼吸隨之而變。',
    stPunctExamples: '同一頁上，各語言標點各從其規範——簡體如<span lang="zh-Hans">「简体的引号与句号。」</span>，日文如<span lang="ja">「日本語の約物です。」</span>，韓文如<span lang="ko">「한국어 문장입니다.」</span>。',

    slEyebrow: '叁・行的調整', slH2: '行的呼吸',
    slP1: '「世界，你好。」「你好，世界！」相鄰標點不再擠成一團——句尾若逢行末，標點懸而不入，版面仍齊。',
    slP2: '漢字與English、與2011一類數字相遇，中西之間留隙0.125em——不多不少，恰是CSS text-autospace的量尺，無需手動空格。',
    slP3: '東京<ruby class="zhuyin">晴<rt>ㄑㄧㄥˊ</rt></ruby><ruby class="zhuyin">空<rt>ㄎㄨㄥ</rt></ruby><ruby class="zhuyin">塔<rt>ㄊㄚˇ</rt></ruby>，一行標記，字旁直書；日文原寫作<span lang="ja"><ruby>東京<rt>とうきょう</rt></ruby>スカイツリー</span>，假名注音，兩制並陳。',

    // ── HP-2b: station⑤ playground (user-content editor) ──
    pgStationEyebrow: '肆・試玩', pgStationH2: '換你的字上場',
    pgStationLede: '——貼上Markdown或無傷大雅的HTML，切到預覽即見漢字排版。',
    pgStationViewsLegend: '編輯器分頁', pgStationTabPreview: '預覽', pgStationTabCode: '原始碼',
    pgStationCodeLabel: '原始碼編輯區', pgStationPreviewLabel: '排版預覽',
    pgStationSample: '## 換你的字上場\n\n這是一段可自由編輯的範文。漢字與Latin、與2024並肩時，字距自動勻稱，不必手動空格。文中要緊的詞用<em>著重號</em>圈點。\n\n> 「引文自有其講究——標點懸掛，行末仍齊。」\n\n注音直書亦不在話下：<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>。',

    snEyebrow: '伍・引用碼', snH2: '生成引用碼', snLede: '——切換頁籤，取你要的引用方式。',
    snFinishLine: '選好了？兩種引用方式，貼進<code>&lt;head&gt;</code>或打包入口即完成。',
    snBrowserSupport: '支援現代常青瀏覽器。',

    clInstallLabel: '一行安裝', clZianoLabel: 'ziano・傳承字形Web字體',
    clDiantenjeomLabel: 'diantenjeom・標點符號字型', clOldHomeLabel: '舊版首頁',

    // NOTE: rail keys below are not yet localized for ko — falling back
    // to the hant (Traditional Chinese) values per established
    // convention. Revisit when ko copy is written.
    railHeader: '配置面板——撥動即改寫全頁',
    pgUseDefault: '使用預設値',
  },
}
