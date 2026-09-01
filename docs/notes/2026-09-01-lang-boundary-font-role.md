# `[lang]` 邊界的字體角色遺失——調查與設計（2026-09-01）

## 結論

`cae554c` 為了解除文件根節點的 `HanNone` frozen stack，在
`src/css/semantics.css` 對 `:root`、`body` 與每個中日韓 `[lang]` 都宣告：

```css
font-family: var(--han-font-default);
```

`body` 的重新宣告是必要的；`[lang]` 也確實需要用自己的 locale slots 重算。
錯在 `[lang]` 沒有保留祖先選的是 default、alternative 或 accent，總是一律改回
default。修復把「靜態文件 fallback」與「locale font 重算」拆回各自所屬模組，
並新增一個繼承式 provenance 訊號：

```css
.headline {
  --han-font-role: alternative;
  font-family: var(--han-font-alternative);
}
```

`fonts.css` 在每個中日韓 `[lang]` 依 `--han-font-role` 重算同一角色；`custom`
則保留作者的 opaque stack。`han.basic.css` 沒有 locale slots，因此不再對
`[lang]` 宣告 `font-family`。

## 最小重現與修前實測

最小形狀如下；`tests/e2e/fixtures/lang-slots.html` 是可執行版本：

```html
<h2 class="alternative">
  <span lang="nan-Hant-TW">閩</span>
  <span lang="zh-Hant-TW">華</span>
  <span lang="ja">日</span>
  <span lang="ko">韓</span>
</h2>

<style>
.alternative { font-family: var(--han-font-alternative) }
</style>
```

修前以 Playwright 1.59.1 所附 Chromium、WebKit、Firefox Nightly 量得：

| bundle / engine | 容器 | `zh-Hant` | `ja` | `ko` |
|---|---|---|---|---|
| han.css / Chromium | DTJ Serif MOE … Shanggu Serif … serif | DTJ **Sans** MOE … | DTJ **Sans** JIS … | DTJ **Sans** KLR … |
| han.css / WebKit | 同上 | 同上 | 同上 | 同上 |
| han.css / Firefox | HanNone … serif | HanNone … **sans** | HanNone … **sans** | HanNone … **sans** |
| han.basic.css / 三引擎 | serif | system-ui, sans-serif | system-ui, sans-serif | system-ui, sans-serif |

Firefox 的差異不是另一個角色 bug：該版本不執行本專案 mode slots 所依賴的
custom-property style queries，所以 punctuation/CJK slots 本來就停在
`HanNone`；但無條件 `[lang]` 規則仍把 generic tail 從 serif 改成 sans，故同樣
清楚重現角色遺失。

## 根因：computed value 與 inheritance

CSS Custom Properties Level 1 定義 custom property 的 computed value 為
「指定值完成 variable substitution 後的值」，並明言 `var()` 在 computed-value
階段、繼承以前解析。換句話說，custom property 往下傳的是算好的值，不是讓每個
子孫重跑的公式。CSS 一般繼承同樣傳 computed value。

因此 ancestor 上的：

```css
font-family: var(--han-font-alternative);
```

到了 computed style 只剩：

```text
Diantenjeom Serif MOE, … Shanggu Serif …, serif
```

子節點看不到 `--han-font-alternative` 這個來源，也無法判斷它是 alternative
角色。原 `[lang]` 規則以 specified declaration 取代 inherited value；即使兩邊
都是 zero specificity，元素自己的 specified value 仍先於 inherited value，作者
只在祖先寫的 `font-family` 不可能以 selector specificity 擋住它。

規範依據：

- <https://www.w3.org/TR/css-variables-1/#defining-variables>
- <https://www.w3.org/TR/css-variables-1/#cycles>
- <https://www.w3.org/TR/css-contain-3/#container-queries>

## 為何 `nan-Hant-TW` 剛好沒事

CSS `:lang(zh)` 依語言標籤本身及其 prefix matching；它不會把 BCP 47 的
macrolanguage 關係推論成 selector 關係。`nan-Hant-TW` 的首個 subtag 是 `nan`，
不是 `zh`，也不是 `ja` 或 `ko`，所以原規則完全不 match。該 span 沒有自己的
`font-family` specified value，只能繼承 h2 的已解析 serif stack，看來便「正確」。

## 受影響範圍

- `--han-font-default`：表面上通常不變，但每個 `[lang]` 仍是必要的 locale
  重算點；若刪掉規則，日韓會繼承繁中的 punctuation/CJK stack。
- `--han-font-alternative`：所有中日韓 `[lang]` 都被改回 default sans，是本次
  demo 的直接症狀。
- `--han-font-accent`：同樣被改回 default，影響含顯式語言子樹的 `i`、`var`、
  prose blockquote，以及作者自行使用 accent 的容器。
- 作者自訂 `font-family`：只要祖先內有中日韓 `[lang]`，opaque author stack
  同樣會被 zero-specificity 規則取代；這與 author selector specificity 無關。
- 巢狀 `[lang]`：每一層都被重設 default；另一方面，若只用 `inherit`，每一層
  又會繼承最外層已解析的 locale stack。兩端都不正確。
- `han.css`：需要 body 解凍與逐邊界 locale 重算，故需要角色 provenance。
- `han.basic.css`：不載入 `fonts.css`，只有 `system-ui`／`serif`／`cursive` 靜態
  fallback，沒有任何 locale slots 可重算；原 `[lang]` 規則只有破壞，沒有收益。

## 考慮過的修法

### 直接刪除 `[lang]`

可保留 inherited role，卻讓 `ja`／`ko` 永遠拿到繁中的已解析 DTJ/CJK stack；
不採用。只在 basic bundle 刪除是正確的，因為 basic 根本沒有可變 slots。

### `font-family: inherit`

與刪除規則等價：保角色但凍結 locale；不採用。

### demo 加高 specificity 或逐一覆寫 `[lang]`

只能遮住一頁症狀，其他 alternative、accent、custom 與巢狀邊界仍壞；不採用。

### JavaScript 從 computed stack 猜角色

有載入時序、DOM mutation、SSR 與任意作者 family 的歧義，且字體架構本來是
CSS 公共 API；不採用。

### 從 `font-family` 自動反推角色

CSS selector／style query 目前不能查一般 descendant 的 inherited
`font-family`，custom property 展開也沒有副作用，無法在使用
`var(--han-font-alternative)` 時順便設定另一個 property。即使未來可 query
一般 properties，opaque stack 仍可能恰好與某角色相同而語意不同。不能假裝
透明可解。

### 明確的繼承式角色訊號（採用）

`@property --han-font-role` 的四個值：

- `default`：在 `[lang]` 使用 `--han-font-default`。
- `alternative`：在 `[lang]` 使用 `--han-font-alternative`。
- `accent`：在 `[lang]` 使用 `--han-font-accent`。
- `custom`：Han.css 不宣告，原樣繼承作者的 computed stack。

Style query 只查 ancestor，所以選角色的元素仍需自己的 `font-family`；role
訊號服務的是其下 language boundaries。Han.css 自己所有 default/accent
角色切換同步寫訊號，作者 API 則刻意維持一行 mirror，與現有 writing-mode
mirror 的限制一致而且可檢查。

## 最終模組邊界

1. `semantics.css`：在 `:root` 提供 basic/full 都安全的靜態 default 與
   `--han-font-role: default`；不再碰 body 或 `[lang]`。自身套 accent 的語意
   元素同步標記 role。
2. `fonts.css`：註冊 role；`body` 無條件重代入 default，保住裸頁 unfreezer；
   `[lang]` 透過 ancestor style query dispatch default／alternative／accent；
   `custom` 無規則。
3. `prose.css`：blockquote 切 accent、其內 dfn/i/var 回 default 時同步 role。
4. `han.basic.css`：沒有 fonts 模組，也就沒有 `[lang]` font declaration；所有
   static role/custom stack 依原生 inheritance 傳遞。

## 驗證矩陣

Regression tests 覆蓋：

- 裸頁 body 仍從 HanNone root stack 解凍；
- default sans 容器的 zh-Hant／ja／ko locale punctuation stacks；
- alternative serif 與 accent cursive 容器的三語 boundaries；
- zh-Hant → ja → ko 巢狀邊界各自的 MOE → JIS → KLR stack；
- `custom` 作者 stack 不被指定值蓋掉；
- TC heritage slots 不洩漏到 ja／ko；
- `han.basic.css` 的 default／alternative／accent／custom 全部只做靜態繼承。

修後最小重現的實際 computed stacks（省略相同的 Latin fallback）：

| engine | body default | alternative `zh-Hant` | nested `ja` | nested `ko` | custom `ja` |
|---|---|---|---|---|---|
| Chromium | DTJ Sans MOE … Shanggu Sans … sans-serif | DTJ Serif MOE … Shanggu Serif … serif | DTJ Serif JIS … HanNone, serif | DTJ Serif KLR … HanNone, serif | Papyrus, fantasy |
| WebKit | 同 Chromium | 同 Chromium | 同 Chromium | 同 Chromium | Papyrus, fantasy |
| Firefox | HanNone … sans-serif | HanNone … serif | HanNone … serif | HanNone … serif | Papyrus, fantasy |

Chromium 與 WebKit 做 role + locale 重算。Firefox 在不支援 style query 時保角色
但沿用祖先 locale stack，沒有再由 Han.css 強制變回 default。三引擎的
`han.basic.css` 都得到 default tail = `system-ui, sans-serif`、alternative
tail = `serif`、accent tail = `cursive, serif`、custom = 作者原字串。
