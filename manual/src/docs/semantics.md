---
title: 語意樣式標準化
---

# 語意樣式標準化

`han-semantics`模組重新定義語意元素在漢字排版下應有的樣式：`<em>`是著重號不是斜體、`<cite>`是書名號、`<i>`與`<var>`走楷體、`<u>`是專名號、`<q>`的引號隨語言慣例，引文與清單縮二字而非UA的40像素。前提是一條長期被忽略的事實：**漢字字體沒有斜體**。瀏覽器對中日韓文套`font-style: italic`只會合成一道傾斜，是壞排版；本模組先取消這道合成斜體，再為每個語意元素定義漢字排版下應有的表意方式。使用正確的元素，即手可得，繁簡日韓各有所依。

## 開關與作用域

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-semantics` | `on`｜`off` | `on` |

全域預設開啓。關閉某個子樹：

```css
.legacy-content { --han-semantics: off; }
```

> **作用域通則（全站適用）**：漢.css的機能變量以style query（`@container style()`）讀取，而style query查的是**祖先**——變量要設在目標元素的祖先（或`:root`）上，設在目標元素自身不生效。本頁及後續各模組頁的變量皆同此理。

兩處例外不受此開關管轄，因為它們是**正確性修正**而非可選增強：`:root`層級的文件基礎樣式（預設字體、底線偏移基準），以及下述底線偏移的逐元素重解析。

## 偽斜體的取消

漢字字體沒有斜體字面。`<i>`、`<em>`、`<cite>`、`<var>`、`<dfn>`、`<address>`的UA預設都是`font-style: italic`，落到中日韓文上，瀏覽器只能合成一道機械傾斜，這正是漢字排版要避免的。本模組在中日韓語境下一律取消：

```css
:where(*):where(:lang(zh), :lang(ja), :lang(ko)) {
  font-style: inherit;
}
```

兩個設計要點：

- **宣告在`:where(*)`上，不列舉已知標籤**：刻意放寬涵蓋範圍。斜體可以被套在任何元素上，逐一修補已知標籤永遠漏掉下一個。
- **用`inherit`不用`normal`**：`normal`會把祖先刻意設定的斜體也一併抹平；`inherit`只中和每個元素自帶的UA斜體預設，卻讓「作者在祖先上主動設的斜體」順利流下來。合成斜體被中和，作者刻意設定的斜體保留。

取消斜體後，各語意元素改以漢字排版該有的方式表意：著重號、楷體、加粗、書名號，分述於下。西文（`:lang`非中日韓）不受影響，斜體照舊。

## 著重號——`<em>`

漢字的強調不是斜體，是文字旁的著重號。`<em>`在中日韓語境下渲染為著重號（`text-emphasis`）：

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-em-symbol` | `text-emphasis`合法值（`circle`｜`dot`｜`sesame`｜`triangle`⋯） | `circle` |
| `--han-em-dot-position` | `text-emphasis-position`合法值（`under right`｜`over right`⋯） | `under right`（日文`over right`） |

日文的著重號慣例在字上，故`:lang(ja)`預設改為`over right`。兩個變量都是**透明代理**：值原封不動流進原生`text-emphasis`／`text-emphasis-position`，故任何原生合法值都收，不限於上表列舉。

```css
article { --han-em-symbol: sesame; }
```

### 直排

`under right`同時涵蓋橫直排：`over`／`under`只在橫排生效、`right`／`left`只在直排生效，是同一個屬性的兩半。故直排下`under right`＝標在字的**右側**，正是中文直排的慣例，不必另行覆寫（Chromium／Firefox／WebKit皆已量測確認）。日文的`over right`同理，直排下與繁中無異；差別只在橫排。

### 著重號字體

著重號的字面不是正文字體畫的：瀏覽器從`<em>`**字體堆疊裡第一個有該符號的字體**取字。系統字體對這個符號的大小、離字距離各有各的想法，有的乾脆沒有；要一致，就自己指定一個。diantenjeom 0.2.0起附一個專畫著重號的`Diantenjeom Emphasis`：

```css
:where(em) {
  font-family: 'Diantenjeom Emphasis', var(--han-font-default);
  line-height: 2;
}
```

兩點要注意：

- **必須排在最前面，而且只掛在要標著重號的元素上。** 這個字體刻意不帶`unicode-range`（帶了就永遠輪不到它被查詢），所以它也會接手正文裡真的打出來的`●`、`•`、`△`。掛在`body`上會波及全篇。
- **行高至少`2`。** 著重號畫在離基線`0.5em`處，半行距要能兩側都容下它，門檻正好是`2 × (ascent + |descent|) / upem`。低於此值，有著重號的那一行會比鄰行高，整段參差。這是有間隙的著重號的代價，沒有CSS可以繞過。

han.css不替你接這條線，是因為`font-family`無法「在繼承來的堆疊前面插一項」——它不知道你的`<em>`繼承到的是哪一疊。上例的`var(--han-font-default)`只在正文用預設堆疊時成立；若該處是`--han-font-alternative`（明體）或作者自訂的堆疊，跟着換掉即可。

推導與量測見diantenjeom的[`docs/emphasis-marks.md`](https://github.com/hanzi-pro/diantenjeom/blob/main/docs/emphasis-marks.md)。

## 楷體——`<i>`與`<var>`

`<i>`（另一種聲氣、術語、船名等）與`<var>`（變量）在西文靠斜體區別；漢字既無斜體，改用楷體區別，指向強調字族`--han-font-accent`（預設`cursive`通用字族，fonts模組載入時換上楷體Web字體）：

```css
:where(i, var):is(:lang(zh), :lang(ja), :lang(ko)) {
  font-family: var(--han-font-accent);
}
```

## 加粗——`<dfn>`

`<dfn>`（定義中的術語）在中日韓語境下加粗（`font-weight: bolder`），比周圍文字重一級以示分量。`<strong>`與`<b>`維持UA預設的加粗，本模組不另干預。

## 書名號——`<cite>`

`<cite>`取消斜體後，可選加上書名號：

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-cite-title-marks` | `none`｜`bracket`｜`wavy` | `none` |
| `--han-title-marks` | 書名號字符序列（open/close成對，可巢狀兩層） | `《》〈〉` |

- `bracket`（乙式）：以`《》`包夾書名，透過`quotes`＋`::before`／`::after`的`open-quote`／`close-quote`實現；巢狀深度決定用外層`《》`或內層`〈〉`。日文與韓文（漢字混寫，`ko-Kore`）語境下，`--han-title-marks`自動改指向該語言的`--han-quotes`，即`「」`／`『』`，因為日韓以引號、非`《》`標書名。
- `wavy`（甲式）：字下曲線專名號式（台灣教科書、古籍復刻本用法），抑制引號、改上波浪底線。此式僅限中文，非日韓慣例。
- `none`：兩者皆不加。

```css
article { --han-cite-title-marks: bracket; }
```

> `--han-cite-title-marks`是`@property`註冊的自有列舉（`syntax: "none | bracket | wavy"`），值本身不流進任何原生屬性、只驅動style query分支，故由`@property`把關、非法值直接被解析器擋下。

## 引號——`<q>`

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-quotes` | 引號字符序列（外層open/close、內層open/close） | `“”‘’` |

`<q>`自動補上引號（`quotes`＋`::before`／`::after`），字符按`:lang`切換：

| 語言 | 外層引號 |
|------|---------|
| 預設／`en`／`zh-Hans`／`ko`（非漢字混寫） | `“ ”` |
| `en-GB` | `‘ ’` |
| `zh`／`ja`／`ko-Kore` | `「 」` |

內層引號隨之配對（如中文`「」`內用`『』`）。任一語境都可用`--han-quotes`自訂覆寫。

> `ko`與`ko-Kore`分屬兩途：純韓文（`ko`）不混漢字、走西式引號；漢字混寫的韓文（`ko-Kore`）連書名號都跟日文一樣用`「」`／`『』`。這是引號系統本就畫下的分界。

## 區塊縮排——一條格線

西文字母寬窄錯落，漢字方塊成格。引文、圖表、清單捨UA的40像素預設，改用漢字整數倍的空間——**縮二字**。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-structural-indent` | 單一`<length>` | `2em` |

同一個值，四處共用，起始邊因此對齊：

- **`<blockquote>`**：兩端各縮一個單位。
- **`<figure>`**：同上。
- **`<ol>`／`<ul>`**：行首縮一個單位（`padding-inline-start`）。
- **`.poem-like`**：詩詞類段落，其`<p>`（或本身即`<p>`者）行首縮一個單位。這一條不看語言——類別是作者自己寫上去的，等於已經表態。

`<figure>`沒有自己的慣例，它進來是為了**對齊**：三者在文章裡常連着出現，起始邊若差那8像素，看得出來卻說不出哪裡怪。同理，`<blockquote>`裡的`<figure>`縮排歸零（`initial`，即0而非UA的40像素），免得疊成兩層、掉出格線。

因為以`em`計，縮排隨字級等比縮放，不必為響應式另設斷點。

### 各自微調

四個元素另有各自的旋鈕，值可寫一個或兩個長度（起始／末端）：

| 變量 | 預設形狀 |
|------|----------|
| `--han-structural-indent-blockquote` | 兩端 |
| `--han-structural-indent-figure` | 兩端 |
| `--han-structural-indent-list` | 只縮起始邊 |
| `--han-structural-indent-poem` | 只縮起始邊 |

```css
/* 引文只縮起始邊，其餘照格線 */
:root { --han-structural-indent-blockquote: 2em 0; }
```

這些旋鈕不是糖。自己寫`blockquote { margin-inline: 3em }`當然蓋得掉——但那條規則不分語言，要跟本模組行為一致，作者得自己複述一次容器語言的判定：`:where(:is(:lang(zh), :lang(ja), :lang(ko)) > blockquote)`。用變量則自動騎在那個判定上。

兩個要留意的：

- **覆寫給單一值時是兩端都縮**，即使該元素預設只縮起始邊。`padding-inline: 2em`本來就是兩端的意思。要保持單邊，寫`2em 0`。
- **共用值只能寫一個長度。** 各消費點是把它拼進自己的簡寫（只縮起始邊的那兩個拼成`var(…) 0`），所以`--han-structural-indent: 2em 0`會在那兩處展開成`2em 0 0`而失效——只有那兩處，而且不報錯。

> 這個變量刻意**不註冊**`@property`。註冊過的`<length>`會在宣告處就絕對化，`:root`的`2em`算成px之後往下繼承，縮排從此不隨字級縮放；而`initial-value`又不接受`em`。詳見`docs/notes/2026-08-07-css-silent-failures.md`第五則。

### 格線屬於容器，不屬於項目

判定語言時看的是**父元素**，不是元素自己——`<blockquote>`、`<figure>`、`<ol>`／`<ul>`三者皆然，也是本模組唯一一處讀祖先的規則。理由是格線的性質：同一個容器裡的區塊沒有理由因為各自的`lang`而縮排不同。英文容器裡並排一個`<ol lang="zh">`和一個`<ol lang="de">`，逐元素判定會給出2em對40像素，版面就參差了。

所以容器說了算：英文段落裡的`<ol lang="zh">`維持UA的縮排。

### 兩種關法，結果不同

| 寫法 | 結果 |
|------|------|
| `--han-structural-indent: 0` | 縮排0——規則仍在，只是值是0 |
| `--han-semantics: off` | 規則整個退出，回到UA的40像素 |

後者不需要反向宣告：`margin`與`padding`不繼承，我們的宣告一消失，UA的值自己回來。會繼承的屬性就沒這麼便宜——`text-underline-offset`關掉時得明寫`auto`，否則祖先算出的px照樣傳下來。

## 底線與刪除線——`<u>`／`<ins>`／`<s>`／`<del>`

底線族（`<u>`專名號、`<ins>`）與刪除線族（`<s>`、`<del>`）在漢字下有兩個講究：

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-underline-offset` | `<length>` | `.125em` |
| `--han-text-decoration-inset` | `<length>`｜`auto` | `auto` |
| `--han-adjacent-lines-skip-gap-fallback` | `<length>` | `.125em` |

**一、線與字保持距離**（`--han-underline-offset`）。底線不貼着字底。此值以`em`計，須逐元素重新解析：`text-underline-offset`只以**計算後的值**繼承，若僅在`:root`宣告一次，`.125em`會對着`:root`字級定死成一個px值、被所有後代不分字級地繼承。故在`:where(*)`上重宣告一次，讓`em`對每個元素自己的字級重新解析。此重宣告置於`--han-semantics`開關之外，屬正確性修正、不可關。

**二、相鄰兩行的線不得黏連**（`--han-text-decoration-inset`）。兩個相鄰的同族底線（或刪除線）之間要留一道縫，否則連成一氣、看不出是兩處標記。引擎原生支援`text-decoration-inset: auto`時自動處理；未支援時，回落為在前一個元素上加`margin-inline-end`撐開`--han-adjacent-lines-skip-gap-fallback`的縫。純CSS回落以`:has(+ u, + ins)`偵測相鄰；但CSS的`+`會跳過文字節點、也無法探入相鄰元素的子樹，故完整判定需JS配套（見下）。

## 注音——`<ruby>`

注音符號（zhuyin）ruby以字間注（`ruby-position: inter-character`）渲染，聲調位置由字體GPOS處理，`<rt>`用專用字族`--han-font-zhuyin-serif`（內建`Han Zhuyin Serif`Web字體）並直立（`text-orientation: upright`）：

```html
<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>
```

Safari 18.2+原生支援`inter-character`；Chrome／Firefox走`@supports not`回落（`letter-spacing`預留空間＋絕對定位`<rt>`）。此回落只認**單一base**的注音ruby，故一字一`<ruby>`是硬性規則：多base、`<rb>`／`<rtc>`表格式等舊式標記，須先經[`transpileRuby`](./api-js.html)降級為現代引擎可正確渲染的interop形式（一字一base、附加標注層以巢狀`<ruby>`表達）。

注意泛用選擇器的誤傷：你自己一句`ruby { ruby-position: under }`未分層時贏過漢.css的一切（layer內的規則一律輸給未分層規則），會把注音的標音位置一併翻掉。頁面上另有一般ruby要調整時，排除注音即可——`ruby:not(.zhuyin, .mps)`。

## 字體掛鉤

semantics模組為一組字體堆疊變量定義基礎值，預設指向系統通用字族：

| 變量 | 預設指向 | 用於 |
|------|---------|------|
| `--han-font-default` | `system-ui` | 文件正文 |
| `--han-font-alternative` | `serif` | 明體／襯線替身 |
| `--han-font-accent` | `cursive` | `<i>`／`<var>`楷體 |
| `--han-font-zhuyin-serif` | `cursive` | 注音`<rt>` |

只載semantics時，字體交給系統這組通用字族；[fonts模組](./fonts.html)載入時，以四層composite堆疊**逐元素**覆寫它們，傳承字形與標點字體完整接手。兩個模組因此可獨立使用。

## 與JS的關係

本模組的CSS在引擎能力所及處即完整生效；兩件事需JS補足，皆在原生支援時自動讓位；不引JS，設定仍然有效，僅覆蓋面較小：

- **相鄰裝飾行的縫**：引擎未支援`text-decoration-inset: auto`時，`installFallbacks`會為「其後緊接同族裝飾行」的元素打上`[data-followed-by-adjacent-line]`標記，CSS據此縮進。JS的判定補上純CSS做不到的兩點：探入相鄰元素的子樹頭、以及跨父層向上攀爬找下一個候選（`<u>a</u>`後接`<em><u>b</u></em>`、或`<p><u>a</u></p><u>b</u>`都能正確標記）；`<wbr>`與HTML註解視為透明、逐層跳過。引擎原生支援時，JS完全不動作、也不覆寫串接變量，以cascade的宣告為準。
- **舊式ruby降級**：`transpileRuby`是**選用**的獨立函數（不在`installFallbacks`內），把`<rb>`／`<rtc>`表格式與多`<rt>`ruby改寫為interop形式，可於SSR一次跑完或作瀏覽器端相容墊片。

詳見[JavaScript API](./api-js.html)。
