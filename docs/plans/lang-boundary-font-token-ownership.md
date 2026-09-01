# `lang` 字體邊界契約 — implementation plan

**日期**：2026-09-01

**狀態**：已完成

**調查**：[`../notes/2026-09-01-lang-boundary-font-role.md`](../notes/2026-09-01-lang-boundary-font-role.md)

## 設計判斷

保留核心規則：

```css
:where(:root, body, [lang]):where(:lang(zh), :lang(ja), :lang(ko)) {
  font-family: var(--han-font-default);
}
```

顯式 zh／ja／ko `lang` 元素是 locale boundary；若作者沒有在該元素另選字體，
han.css 刻意讓它回到當地的 default stack。規則是零 specificity，因此作者在
**同一元素**上的一般 selector 會勝出，並以當地 slots 重新解析 alternative、
accent 或自訂 stack。

互斥的翻譯標題應各自成為帶 `lang` 的 semantic block：

```html
<h2 class="story-title" lang="zh-Hant">…</h2>
<h2 class="story-title" lang="ja">…</h2>
<h2 class="story-title" lang="ko">…</h2>
```

```css
.story-title { font-family: var(--han-font-alternative); }
```

真正的 nested inline language run 則使用：

```css
.story-title,
.story-title :where([lang]) {
  font-family: var(--han-font-alternative);
}
```

## 實作清單

- [x] 保留 `[lang]` default reset，不改核心 cascade。
- [x] `ruby-readings` 的四個互斥標題改成四個各自帶 `lang` 的 `<h2>`。
- [x] 漢語地方語種使用 han.css 的合法 extlang 約定；閩南語為
  `zh-nan-Hant-TW`，不使用非法的 `zh-min-nan-Hant-TW`。
- [x] API reference 與字體手冊明載 boundary reset、同元素覆寫方式與 nested
  inline recipe。
- [x] 安裝 Skill 加入同一項 audit obligation。
- [x] regression 覆蓋 default／alternative／accent／作者 stack、nested boundary、
  bare body 與 `han.basic.css`。
- [x] Chromium production E2E；Chromium／WebKit／Firefox computed-style smoke。
- [x] 保留 `fonts.if.css` 作不出貨的語法研究，不接進任何 bundle。

## 明確不做

- 不移除 `[lang]` reset；否則完整 bundle 的日韓 run 會繼承祖先 locale 已解析的
  frozen stack。
- 不新增 `--han-font`、role marker、class 或 attribute API。
- 不用 JavaScript 同步字體角色。
- 不把提高 demo selector specificity 當修復；關鍵是 declaration 與 `lang` 位於
  同一元素，普通 cascade 即足夠。
- 不逐一擴張 `:lang(nan)`／`:lang(yue)`／`:lang(hak)` 等 selectors；漢字內容以
  `zh-<extlang>` 統一進入既有 `:lang(zh)` 規則。

## 驗證結果

- Chromium／WebKit：zh-nan-Hant、zh-Hant、ja、ko 的 alternative headings 分別
  取得 MOE／MOE／JIS／KLR serif stacks。
- Firefox：角色仍是 serif，但現行 font mode 的 container-style-query 路徑得到
  `HanNone … serif`；這是既有跨引擎 degradation，另案處理。
- `zh-nan-Hant-TW` 是合法 BCP 47 extlang form，DOM 中匹配 `:lang(zh)`；ECMA-402
  `Intl` 不接受 extlang，因此語音與 locale APIs 使用 `nan-TW`。
- 非法的 `zh-min-nan-Hant` 同樣由 `Intl.getCanonicalLocales()` 拒絕。
- production build、typecheck、Skill validation 與相關 9 個 E2E 通過。
- 全 repo unit 有 2 個與本案無關的既存 punctuation expectation 失敗：`：` 的實際
  token 已含 `dividing`，舊 expectation 仍只接受 `end`。
