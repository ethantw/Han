# `lang` 的 script subtag 會改判漢字該用哪一國的字體

**日期**：2026-08-27（macOS 26.4／Chromium 147，CDP `CSS.getPlatformFontsForNode`）

系統字回退挑的不只是「有沒有這個字符」，還有「這段文字屬於哪個地區」——而
後者是從 `lang` 讀的。標籤裡帶了 script subtag 時，引擎會拿 script 去猜地區，
於是**一個寫錯的 subtag 會把漢字送去別國的字體**，而它旁邊的諺文照樣留在韓文
字體裡：同一行字，兩套字形來源。

## 實測

同一段「한글漢字」，同一條字族串，只換 `lang`；字族串裡沒有任何 CJK 字體，
所以每一格量的都是引擎自己的回退決定：

| `lang` | generic `serif` | generic `sans-serif` |
|---|---|---|
| `ko` | AppleMyungjo ×4 | Apple SD Gothic Neo ×4 |
| **`ko-Kore`** | **AppleMyungjo ×4** | **Apple SD Gothic Neo ×4** |
| `ko-Hang` | AppleMyungjo ×4 | Apple SD Gothic Neo ×4 |
| `ko-Hani` | Hiragino Mincho ProN ×2 ＋ AppleMyungjo ×2 | Hiragino Sans ×2 ＋ … |
| `ko-Hant` | Songti TC ×2 ＋ AppleMyungjo ×2 | PingFang TC ×2 ＋ … |
| `ja` | Hiragino Mincho ProN ×2 ＋ AppleMyungjo ×2 | Hiragino Kaku Gothic ProN ×2 ＋ … |
| `zh-Hant` | Songti TC ×2 ＋ AppleMyungjo ×2 | PingFang TC ×2 ＋ … |

`×n` 是該字體實際畫掉的字符數（四個字符：한글漢字）。

讀法：**指名語言的 subtag（`Kore`／`Hang`，以及不帶 script 的裸 `ko`）整段都
交給韓文字體；指名漢字的 subtag 只說了書寫系統、沒說語言**，引擎就從 script 反
推地區——`Hant` 推成中文（Songti TC／PingFang TC）、`Hani` 推成日文（Hiragino）。
`ko-Hant` 因此排出「中文宋體的漢字 ＋ 韓文明朝的諺文」。

## 為什麼這件事在 han.css 會咬人

`fonts.css` 把 `--han-use-heritage-glyphs-for-*: off` 的行為寫成一句前提：字符
穿過 generic family，落到**該 locale 自己的**系統字。這句話對 `ja`／`zh` 成立，
對 `ko-Hant` 不成立——前提被標籤本身推翻了。

而它只在字族串裡沒有字體蓋得住那個字符時才顯形，所以：**開著 webfont 的語言看
不到這個問題，關掉的才會**。韓文的傳承字形預設是 `off`，於是首當其衝。

## 結論

- 混用韓文標 **`ko-Kore`**：`Kore` 的定義就是 Hangul＋Han，語義正確，而且引擎
  認得它是韓文。
- BCP 47 容許省略（韓文 suppress 掉 `Kore`），但 han.css 拿它當「明確混用」的
  標記，所以刻意寫出來——見 `src/css/semantics.css` 該分支的註解。
- 裸 `ko` 在 han.css 讀作現代（純諺文）韓文。這是活的慣例，不是 BCP 47 的字面
  （字面上裸 `ko` 已隱含混用）。取捨理由同上。
- 通則：**凡是靠 generic family 落到系統字的設計，`lang` 就是它的參數**。想清楚
  標籤說的是「哪種語言」還是「哪種文字」——後者會讓引擎自己去猜前者。
