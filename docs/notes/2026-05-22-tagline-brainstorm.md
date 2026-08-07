# 2026-05-22 — Tagline 鬥智記

四語 tagline 的迭代過程。docs/ 在 gitignore 內，本檔不會 commit，純供未來改 brand copy 時參考。

## 最終四語版本

| 語言 | Tagline | Agency 機制 |
|---|---|---|
| 繁中 | **漢.css——像素間的活字美學。** | brand 名（漢） |
| 日 | **活字としての漢字を、ピクセルの間で。** | としての |
| 英 | **Crafting the art of movable type within the pixels, for Han characters.** | for Han characters |
| 韓 | **`<ruby>`活字`<rt>`활자`</rt></ruby>`로서의 `<ruby>`漢字`<rt>`한자`</rt></ruby>`, 픽셀 사이의 `<ruby>`美學`<rt>`미학`</rt></ruby>`.** | 로서의 |

簡中尚未轉換。

## 起點

v3 sticker（用了十年）：

> 印刷品般的漢字網頁排版框架。

問題清單：
1. blockquote 不對——這不是「引用」、是自己的副標題。一個尊重 HTML5 語意的框架自己卻濫用 blockquote 排版，立場站不住。
2. 「框架」是 jQuery / Backbone 年代詞彙、過時
3. 「網頁」綁手綁腳——框架押注的 CSS 規範未來會在 e-reader、app webview 通用，不該自限
4. v4 是 from-scratch rewrite，希望 slogan 也煥然一新

## 演化路徑

```
[v3] 印刷品般的漢字網頁排版框架
  ↓ 拿掉「框架」、「網頁」
[v4 try 1] 印刷品般的漢字數位排版
  ↓ 「數位漢字」vs「漢字數位」: 主詞應錨在「漢字排版」這個千年學問，不是「數位排版」
[v4 try 2] 印刷品般的數位漢字排版
  ↓ 換 candidate 路線：用「像素」當主視覺
[v4 try 3] 漢字，像素級的印刷工藝
  ↓ 「像素級」會被誤讀為「pixel-perfect 強迫症」——本框架的強迫症不在 sub-pixel rendering
[v4 try 4] 漢字，像素間的印刷工藝
  ↓ 「工藝」太樸實、不夠 v4-fresh
[v4 try 5] 漢字，像素間的印刷美學
  ↓ 「印刷」是 v3 slogan 用了十年的關鍵字，整批換掉才有 v4 換代感
  ↓ 像素↔活字 的原子單位對位太強，超越像素↔印刷的媒介對位
[v4 try 6] 漢字，像素間的活字美學
  ↓ 想引入日文「活字としての漢字」的 frame：「為漢字而生」的 agency
  ↓ 中文嘗試 1: 作為活字的漢字（agency 病、荒謬）
  ↓ 中文嘗試 2: 漢字如活字（沒排他性、任何字都如活字）
  ↓ 中文嘗試 3: 活字之姿的漢字（contrast 削弱、像素遠離活字）
  ↓ 中文嘗試 4: 漢字，像素間的活字之姿（之姿太抽象、不可 parse）
  ↓ 想通：中文沒有としての對等工具，brand 名「漢.css」本身就承載「為漢字」訊息
[v4 final] 漢.css——像素間的活字美學
```

## 三個 anchor 概念

整套 tagline 跨四語都錨在這三個詞：

| 概念 | 中 | 日 | 英 | 韓 |
|---|---|---|---|---|
| 對象 | 漢字（隱於 漢.css） | 漢字 | Han characters | 漢字 |
| 對位媒介 | 像素 | ピクセル | pixels | 픽셀 |
| 工藝 | 活字（美學） | 活字（としての） | movable type | 活字（美學） |

**像素 vs 活字 的 atomic-unit 對位**是整個 tagline 的詩意支柱：
- 像素 = 數位的最小單位
- 活字 = 印刷的最小單位
- 兩者都是 typography 的「原子」，跨時代呼應

## 跨語言 grammar 戰爭：「為漢字而生」怎麼說

這是最辛苦的一個問題。各語言工具不對等：

### 日：としての（無 agency 病）

「活字としての漢字」= "Han characters seen as movable type"

「として」是 lens 詞、純觀察視角。漢字被動、不主動扮演。

### 韓：로서의（與日 1:1）

「活字로서의 漢字」= 同上。

韓文文法剛好提供完全平行的工具（로서 + 의 = として + の）。

### 英：trailing for-clause

「for Han characters」= dedicated-to 關係的明示。

英文沒有 としての 的精確對等，但 trailing prepositional phrase 可以清楚講「for」。

### 中：沒有 clean 工具，最後用 brand 名解

| 嘗試 | 問題 |
|---|---|
| 作為活字的漢字 | 「作為」帶 agency，讓漢字「主動扮演」活字、荒謬 |
| 漢字如活字 | 「如」是觀察、無排他性。任何字都「如活字」、不專屬漢字 |
| 化作活字的漢字 | 「化作」帶 transformation 動感、不對：漢字沒被「變成」活字 |
| 視漢字為活字 / 以漢字為活字 | 古典文言、tagline register 太重 |
| 活字之姿的漢字 | 結構漂亮但「之姿」抽象、跟「像素間的」一起會 parse 不出來 |
| **漢.css——X** | ✅ Brand 名「漢」字本身承載「為漢字」訊息、不需要 grammar tool |

**洞察**：中文沒有 としての/로서의 那種 grammatically clean 的「as-frame」工具，但**brand 名可以承載這個 anchor 訊息**。不需要在 grammar 裡硬擠出來。

破折號 `——` 是關鍵：「漢.css——X」= 「漢.css，即 X」= **自我定義**。逗號做不到這層。

## 中日韓修辭 register 差異

### 日文：助詞止め (joshidome)

「を、で。」這種助詞後斷句、省略動詞的修辭，是日文文案的招牌技法。

歷史：
- 来自和歌/俳句的 **体言止め**（10 世紀傳統）
- 現代日本廣告 1960-70 年代電通把它系統化（糸井重里、仲畑貴志）
- 已經有正名、有定義、是一套完整修辭傳統

例：
- 「未来を、君と。」（三得利）
- 「想いを、かたちに。」

### 韓文：文法上有、修辭上未發展同等

韓文助詞（을/를、에서、의）後也可以斷句，**但**：

1. **韓文動詞結尾載荷重**——尾巴塞了敬語、語氣、句型整套（-다 / -요 / -니다 / -지 / -네）。日文省動詞、讀者損失不多；韓文省動詞、讀者損失敬語級跟態度。
2. **韓國古典詩傳統**（시조、한시）偏向完整句構，沒有「未盡而斷」的美學傳承可以接續到現代廣告。
3. **韓國現代廣告**起步晚、參考美式 slogan model（完整句、命令句、品牌斷言）。
4. **韓文文案花樣在別處**：名詞化收尾（-임/-함）、hashtag-style 斷言、口語入侵廣告、疊字擬聲詞。

**對「活字としての漢字を、ピクセルの間で。」這種日文助詞止め在韓文裡的反應**：grammar 上不錯誤，但讀者潛意識會覺得「這句話沒寫完」+「這像是翻譯自日文的」。所以韓文版改走 noun-phrase tagline 路線（최종版用 로서의 + 名詞片語）。

### 中文：對偶／並排優於 grammar 鏡像

中文 tagline 的強項是**對偶結構**和**名詞排比**，不是助詞修辭。

例：「漢字，像素間的活字美學」中 漢字／活字／像素 三詞排布，靠語義對位、不靠 grammar particle。

所以中日韓不必語法一一對應，**conceptual move 跨語對齊，syntactic structure 各依其語自然展開**。

## 文青三連擊

「活字之姿的漢字美學，像素之間」——這個版本融合了三個 high-文青 元素：

| 元素 | 文青指數 | 為什麼 |
|---|---|---|
| 之姿 | ⭐⭐⭐ | 古典 + 抽象（之 + 姿態擬人）|
| 美學 | ⭐⭐⭐ | 高度抽象的學術／藝術詞 |
| 之間 | ⭐⭐ | 之 + 文言結構 |

單獨用一個還好，**三個同台 = 過載**。減重策略：

1. 美學 → 排版（具體 typography 動作）或留下、視 register 而定
2. 之間 → 間（去 文言 助詞）
3. 之姿 → 留下/換 般（般 = 像...一樣、口語）

**意外發現**：用 brand 名 + 破折號 自定義後，「美學」反而 register 對了——這個句子本來就是 declare 品牌價值，「美學」當定義詞沒問題。Cringe 來自「自我吹噓 X 是美學」，不來自「美學」這個詞本身。

## 「漢字 as 活字」的 Chinese grammar 之痛

「X としての Y」這個 frame 在日文乾淨、中文沒一個對等工具。試過的：

| 機制 | 結構 | 問題 |
|---|---|---|
| 作為 | 作為X的Y | agency 病：Y 變主動 |
| 如 | Y 如 X | 無排他性 |
| 若 | Y 若 X | 同上、更古意 |
| 即 | Y 即 X | 太斷然、宣言式 |
| 為 | Y 為 X | 古典書面 |
| 以...為... | 以 Y 為 X | 古典「以X為Y」、文言 |
| 化作 | 化作 X 的 Y | 帶 transformation、不對 |
| 之姿 | X 之姿的 Y | 美但抽象、parse 困難 |
| 般 | X 般的 Y | 口語、白話、丟 craft 暗碼 |

**結論**：中文這條路打通不了，最終用 brand 名繞過。

## English 的特殊處理

英文一度考慮的版本：

| 版本 | 問題 |
|---|---|
| Han, ... | "Han" 單獨用、英語讀者一頭霧水（漢朝？Star Wars？）|
| pixel-perfect / pixel-grade | 暗示「強迫症在像素準度」、與本框架的 craft 強迫症不同 |
| "the pxs" | dev slang、跟 "Crafting the art" 的高 register 打架 |
| within the pixels | ✅ 採用——pixels 當 medium、不是 unit |
| Crafting | gerund-led、有 ongoing craftsmanship 感 |
| for Han characters | trailing for-clause 承擔 "為漢字而生" 訊息 |
| movable type vs type | "movable type" 顯式、"type" 精簡。typography 圈兩個都懂、選 movable type 為一般讀者保留歷史厚度 |

## Korean ruby + 漢諺混寫

Korean tagline 走 **Option 2: 漢字當主文 + ruby 標한글音**：

```html
<ruby>活字<rt>활자</rt></ruby>로서의 <ruby>漢字<rt>한자</rt></ruby>, 픽셀 사이의 <ruby>美學<rt>미학</rt></ruby>.
```

理由：
1. README 第一行就是 typography demo
2. 漢諺混寫 + ruby 是漢字文化圈共有的 typography 遺產
3. 跨 CJK 視覺主軸統一（漢字 visible across 中日韓）
4. 「Walks the talk」: 框架支援這個，README 就用這個展示
5. 稀缺性 = 記憶點：大多韓文 README 不會這樣寫

## 重要的 anchor 詞典

未來改寫時，這些詞的 connotation 要記得：

| 詞 | 中文 connotation | 跨語對應 |
|---|---|---|
| 印刷 | 廣譜、含現代媒介 | print（uncountable） |
| 活字 | 特指 movable type 傳統、畢昇 / 直指 / 古滕堡 | movable type / 活字 (jp/ko) |
| 排版 | 排活字版的動作、漢字 typography 歷史名詞 | typesetting / 組版 (jp) |
| 美學 | 抽象、品味、學術；當主詞自稱會 cringe，當定義詞 OK | aesthetics / art of |
| 工藝 | 手作、craft、具體技藝 | craft |
| 之姿 | 字粒姿態、letterform aesthetic 暗碼 | (no clean equivalent) |
| 像素 | 數位原子 | pixel |
| 間 | typography 圈專業詞（字間、行間、ma in Japanese aesthetics） | between / の間 / 사이 |
| 間 vs 裡 | 間 = 縫隙／關係；裡 = 容器／內部 | between vs inside |

## Lesson learned

1. **不要強行 grammar 鏡像跨語**——各語言有自家修辭工具，conceptual move 對齊就好
2. **Brand 名是被低估的 anchor 工具**——尤其中文沒有 grammatical agency 工具時，brand 名可以承載這個訊息
3. **破折號 vs 逗號 vs 冒號** 對句子語用功能影響很大：
   - `，` = 並列、提示
   - `——` = 定義、闡釋
   - `：` = 引介、列舉（user 在繁中討厭 `：` `；`）
4. **文青指標可量化**：之 + 抽象名詞 + 文言助詞，加起來 ≥3 個 = 過載
5. **agency 不必明說**——title-card 結構＋及物動詞（如「排版」）能隱性帶出 agency；不用每個語言都用 explicit "for X" 機制
6. **像素／活字 是 v4 標誌性 metaphor**——之後任何 brand copy、文案、PPT、簡報都應該圍繞這個 atomic-unit 對位
7. **v3 用了 10 年的關鍵字（「印刷品般」「漢字網頁排版框架」）整批換掉是必要的**——讓 v4 真正有換代感、不是 v3 升級

---

# 2026-05-22（下午續）⸺ v2 README + 題贈句式重構

## 為什麼回頭再改

寫 `README.v2.md`（仿 vite/react 風格的精簡 README）時，原本只想沿用上一輪定稿的 tagline，但發現：

1. **「漢.css⸺像素間的活字美學。」單獨成立感覺懸空**⸺ vite slogan `Next Generation Frontend Tooling` 是純自我定義，OK；但「美學」這個詞作主語自我宣告會 cringe，需要一個尾巴讓它落地
2. **「活字としての漢字／活字로서의 漢字」其實有邏輯瑕疵**⸺ 上輪沒抓到，這輪重看才意識到

## 最終五語版本（含简中）

| 語 | tagline |
|---|---|
| 繁中 | **漢.css**⸺像素間的活字美學，為螢幕上的每一個漢字 |
| 简中 | **汉.css**⸺像素间的活字美学，为屏幕上的每一个汉字 |
| EN | **Han.css** ⸺ crafting movable type within the pixels, for every Han character. |
| JA | **漢.css**⸺ピクセルの間の活字美学、画面に並ぶ漢字へ。 |
| KO | **漢.css** ⸺ `<ruby>`픽셀`<rt>`pixel`</rt></ruby>` 사이의 `<ruby>`活字`<rt>`활자`</rt></ruby>` `<ruby>`美學`<rt>`미학`</rt></ruby>`, `<ruby>`畫面`<rt>`화면`</rt></ruby>`의 `<ruby>`漢字`<rt>`한자`</rt></ruby>`에게. |

## 新結構：題贈句式（dedication）

上輪結構：[name]⸺[noun phrase]。
本輪結構：**[name]⸺[noun phrase]，[for every X on screen]**。

第二分句不是「描述」、不是「定義」，而是**題贈**⸺ 像書名頁上題的「For X」、「献给X」。

幾個關鍵語感發現：

1. **「為」vs「只為」**：「只為」帶 marketing 排他性（"exclusively for"），tacky；「為」回到中文最古老的題贈助詞，謙卑。一字之差差很多。
2. **避開動詞陷阱**：「閱讀」過窄（暗示坐下來認真讀）、「瀏覽」過輕（且現代「瀏覽器」連想會稀釋）。題贈句式**根本不要動詞**，只標 dedication 對象，就避開了 reading-vs-browsing 的偽選擇。
3. **「螢幕上」vs「螢幕」vs「數位化」**：「數位化」公文體（「數位化轉型」「數位化教學」），太硬；「螢幕」具象但跟「像素」語意重疊（像素＝螢幕）；最後解法是讓「螢幕」只在 dedication 子句出現一次，主句保留純 noun-phrase「像素間的活字美學」。

## JA/KO 舊版的邏輯錯誤（這輪才抓到）

| 舊版 | 直譯 | 問題 |
|---|---|---|
| 活字としての漢字 | 「**作為活字的**漢字」 | 活字是技術、漢字是文字。前者不是後者的子集。等於「**作為人的日本人**」、「**作為學生的中學生**」 |
| 活字로서의 漢字 | 同上 | 同上 |

**根本診斷**：原中文 tagline「像素間的活字美學」裡，**主語是「活字美學」，漢字根本沒進前半句**⸺ 漢字是後半句的受贈者。JA/KO 翻譯者為了「不能讓漢字漏掉」，把漢字硬塞回前半當主語、把活字降格為修飾語，結果**修飾語反向限定主語**，邏輯倒置。

**修正**：把主語位讓回活字（活字美學／活字美学），把漢字推到題贈位（漢字へ／漢字에게）。**結構與中文 1:1 對齊。**

| 角色 | 中 | JA 新 | KO 新 |
|---|---|---|---|
| 場景 | 像素間 | ピクセルの間 | 픽셀 사이 |
| 主語 | 活字美學 | 活字美学 | 活字 美學 |
| 受贈者 | 每一個漢字 | 漢字 | 漢字 |
| 題贈助詞 | 為 | へ | 에게 |

## 跨語動詞策略：英文是唯一妥協

| 語 | 第一分句詞性 | 為何 |
|---|---|---|
| 中／日／韓 | 純名詞片語 | 中日韓 tagline 可無動詞 |
| 英 | 動名詞 `crafting` | **英文不能無動詞**⸺ 純名詞片語在英文 tagline 讀起來像 incomplete fragment |

上一輪原以為動詞要找 craft 動詞跨語對應，這輪推翻：**英文的 `Crafting` 是英文語感的妥協**，**反向逆輸出到日／韓**（如 J2c「ピクセルに刻む活字美学」）反而違背中文原版的 noun-phrase 本位。

### Crafting vs Setting（內行人 vs audience）

| 動詞 | 排版圈意涵 | 一般 web dev 接收 |
|---|---|---|
| Setting | typesetting 的 setting，**聖詞**（涵蓋揀字、字距、版心、層級全工序） | 「setting the table」⸺ 擺東西 |
| Crafting | 偏 marketing buzzword（"crafted with love"） | **「用心做」**⸺ 買單 |

**結論**：`Crafting` 對真正讀者（web dev）更有效。`Setting` 是技術更精準但只有 10% 讀者 get 到。Tagline 不是內行考試，是 2 秒內讓多數人感受到調性。⸺ **內行炫技 vs 大眾傳播，這題選後者。**

## の/의 用量規則

### JA：兩個 の 在「XのYのZ」結構內合法、四個必減

| 版本 | の 數 | 評 |
|---|---|---|
| ピクセル**の**間**の**活字美学、画面**の**ひとつひとつ**の**漢字へ | **4** | 過載 |
| ピクセル**の**間**の**活字美学、画面に並ぶ漢字へ | **2** | OK |

**規則**：兩個 の 在「**XのYのZ**」（Z within Ys）這種日文慣用結構內讀起來有節奏、不臃腫⸺ 因為兩個 の 之間夾**實詞**（間）。問題的是兩個 の 之間只夾**虛化修飾語**（ひとつひとつ）⸺ 沒實詞撐場、口齒不清。

### KO：兩個 의 分屬不同分句可接受

韓文 style guide 警告的是「**3 個以上連用**」或「**同一名詞片語內疊用**」（如 `회사의 사장의 비서`）。本 tagline 兩個 의（사이**의** / 화면**의**）分屬兩個逗號分隔的分句，合法。

## 「ひとつひとつ／하나하나」的取捨

| 詞 | 音節 | 處理 |
|---|---|---|
| ひとつひとつ | 6 | **砍**⸺「並ぶ」已暗示複數、「へ」已負責 dedication，redundant |
| 하나하나 | 4 | **砍**⸺「에게」已負責 dedication；保留會破壞五語呼吸節奏 |

中文「每一個」3 字、英文 `every` 5 字，比例都不算誇張；日韓的「ひとつひとつ／하나하나」6/4 音節對應同一個概念**音節成本過高**，砍掉節奏立刻乾淨。

⸺ 修正了上輪「韓文容許這個強調、跟日文不一樣」的判斷。**那是過度辯護**⸺ 一旦 JA 砍了 ひとつひとつ，KO 留著 하나하나 就破壞五語呼吸節奏。語感閾值不同確實存在，但這個 case 不是它的應用場合。

## 화면 속 vs 화면의 vs 화면 위（KO 空間詞選擇）

| 詞 | 字面 | 對應中文 |
|---|---|---|
| 화면 **속** | 螢幕**裡面** | 「容器」隱喻、3D 內部 |
| 화면 **의** | 螢幕**的** | 純屬性歸屬、無空間 |
| 화면 **위** | 螢幕**上面** | 過度物理 |

**選 화면의 而非 화면 속**：中文「螢幕**上**」在 CJK 早已抽象化為「呈現於…」（如「網上」「報上」），不是真的「上方」。韓文要對應這個抽象，**「의」（純屬性）比「속」（具象空間）更接近**。

副作用：音節更短（3→2.5）、語法更輕（의 是 helper particle、속 是位置名詞）。

## KO ruby 的新原則：ruby 補救 script flatten 掉的 etymological signal

這輪有個重要的觀念躍升，從韓文反推出 **ruby 的底層原理**：

| 語言 | 書寫系統能否分辨詞源 | ruby 做的事 |
|---|---|---|
| 日文 | **能**（kanji ＝漢語、katakana ＝外來語、hiragana ＝固有語） | 只標**讀音**（kanji → hiragana），詞源已由 script 本身 signal |
| 韓文 | **不能**（hangul 吞噬一切） | 必須兼任**詞源還原器**：Hanja + ruby 還原漢字詞、Latin + ruby 還原外來語 |

韓文「Hanja 復興」（混寫漢字+hangul）的動機，正是 **recover hangul 把詞源 flatten 掉的那層資訊**。Han.css KO 版替 Sino-Korean 詞加 `<ruby>漢字` 本來就是這個邏輯延伸；對**外來語**做同樣的事（`<ruby>픽셀<rt>pixel</rt></ruby>`）⸺ 不是新發明，是**同一原則的內部一致應用**。

反過來看 JA：「ピクセル」三個 katakana 就已經在尖叫「**我是外來語、我是 pixel**」⸺ 加 ruby 是冗餘、雜訊、破壞節奏。JA 真正該加 ruby 的場合是**讀音不直觀的 kanji**（罕用字、假借字、人名地名）⸺ 跟詞源 signal 無關。

**判斷規則（新加進詞典）：**

```
ruby 該不該加 = script 本身能否 signal 該詞的 etymology？
  能 signal → 不加（避免冗餘）
  不能 signal → 加（補救資訊缺失）
```

### KO tagline 的 ruby 全清單

| 詞 | 來源 | ruby？ | 補的是什麼 |
|---|---|---|---|
| 픽셀 | 外來語 | ✓ `<rt>pixel</rt>` | hangul 無法 signal 此為外來語 |
| 사이 | 固有語 | ✗ | hangul 本就是固有語的「自然」書寫 |
| 活字 활자 | 漢字詞 | ✓ `<rt>활자</rt>` | hangul 寫法無法 signal 此為 Sino-Korean |
| 美學 미학 | 漢字詞 | ✓ `<rt>미학</rt>` | 同上 |
| 畫面 화면 | 漢字詞 | ✓ `<rt>화면</rt>` | 同上（這個差點漏掉⸺**警示：化用「화면」這種高頻 Sino-Korean 詞要特別小心**） |
| 漢字 한자 | 漢字詞 | ✓ `<rt>한자</rt>` | 同上 |

## 新增 Lesson learned

8. **題贈句式（dedication）是 tagline 的萬用結構**⸺「[noun phrase]，[for every X on screen]」可繞開動詞之爭、避免閱讀／瀏覽偽選擇、提供謙卑而非宣告的調性
9. **跨語翻譯時要時時檢查 grammar role 是否與原版對齊**⸺ JA/KO 舊版的「作為活字的漢字」邏輯錯誤就是翻譯者擅自重新分配主語與修飾語角色造成的
10. **英文是跨 CJK tagline 中唯一被迫加動詞的語言**⸺ 不要把英文的妥協反向逆輸出到中日韓
11. **內行炫技 vs 大眾傳播**⸺ tagline 是 2 秒戰場，technically 精準的內行詞（如 Setting）對 90% 讀者是 noise；買單率高的通用詞（如 Crafting）更務實
12. **ruby 的底層原理是「補救 script 失去的 etymological signal」**⸺ 不只用於漢字注音，凡是 script 本身無法 signal 詞源的場合都可考慮。韓文加 ruby 在外來語上是「**hanja 復興邏輯的內部一致延伸**」，不是新發明
13. **の/의 等屬格助詞的可接受數量取決於「是否在慣用結構內」與「是否被實詞分隔」**⸺ 不是單純數數字
14. **「ひとつひとつ」「하나하나」等強調疊字在已經有並列動詞（並ぶ）或 dedication 助詞（へ／에게）時是 redundant**⸺ 強調情感應由單一 carrier 承擔、不該疊加
15. **跨語對齊不是字字對譯、是「等效訊息傳達」**⸺ 同一概念在不同語言中的詞語飽和度（word saturation）不同。例：英文 "pixel" 已 viscerally saturated（讀者立刻浮現螢幕），所以 EN 版砍掉 `on screen`；中文「像素」較抽象，需要「螢幕」再點一次。tagline 字數差異是**正確的**校準，不是翻譯瑕疵
16. **tagline 句尾的「最後一個字」是讀者記憶最深的位置**⸺ 留給主題詞（如 EN 收在 `character`）比留給介詞片語（`on screen`）強得多
