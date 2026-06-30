# Plan — `convertLegacyRuby` → `transpileRuby` 改名與重構

Status: **done（2026-07-18，commits 3174867 + c8371a4，尚未推送）**。

## Why（背景與定名理由）

1. **標準面已翻盤。** W3C《HTML Ruby Markup Extensions》已於 2026-06-04
   進入 Candidate Recommendation Snapshot，明文 "revokes this obsolete
   status, and deems these two elements fully conforming"——`<rb>`／`<rtc>`
   不再是 obsolete 語法。https://www.w3.org/TR/html-ruby-extensions/
   spec repo（hanzipro/ruby-markups）的 Rule 6 正同步改寫：不用 rb/rtc 的
   理由從「非標準」改為「**引擎支援未到位**」（tabular model／rtc 渲染
   不 interop）。
2. **「Legacy」定性因此站不住。** rb/rtc、multi-`<rt>` 是（未來的）標準
   語法；本函數做的事是把**較新標準的語法降階**成當前引擎能正確渲染的
   interop 形（一字一 ruby、多層巢狀）——這正是 transpiler 的語義
   （Babel 把 ES2020 轉 ES5，沒人因此說 ES2020 是 legacy）。引擎跟上後
   「不再需要 transpile」，敘事自然收尾。
3. **對使用者零辨形負擔。** transpiler 的抽象就是「整包丟入、認得什麼轉
   什麼」——使用者不需要先確認手上是 A／B／C／E 哪一形。

**否決過的替代案**（避免日後重議）：

- `canonicalizeRuby` — 暗示 rb/rtc「不正宗」，與新敘事矛盾。
- 拆成 `convertTabularRuby` ＋ `splitMultiRtRuby` — 名實相符（pass 2 的
  form C 本非 tabular），但要求使用者先辨形，抽象度不足。
- `downlevelRuby` — 語義最準但詞冷；`normalizeRuby` — 沒說出動機。

## 改名清單（code；grep 實測 2026-07-18）

1. `src/ts/semantics/ruby.ts`
   - L303 `export const convertLegacyRuby` → `transpileRuby`
   - L82 `parseLegacyRuby` → `parseTabularRuby`（它只 parse rb+rtc tabular，
     即 pass 1；名字順帶更準確）
   - L128／L136／L262 console 警語前綴 `[han.css] convertLegacyRuby:` →
     `[han.css] transpileRuby:`
2. `src/han.ts` L21 re-export 同步。
3. 測試：`src/ts/__tests__/ruby.test.ts`（~17 個 call sites＋註解）、
   `ruby-precise.test.ts`（import、2 個 call sites、pipeline 測試名與註解）。
   量大，用一次性 sed 而非逐一 Edit：
   ```sh
   git grep -l 'convertLegacyRuby\|parseLegacyRuby' | xargs sed -i '' \
     -e 's/convertLegacyRuby/transpileRuby/g' \
     -e 's/parseLegacyRuby/parseTabularRuby/g'
   ```
4. **勿動**（"legacy" 指別的東西）：`line-adjustments/iss.ts`、
   `__tests__/iss.test.ts`、`__tests__/punctuation.test.ts` 裡的 legacy
   字樣；`docs/plans/comment-audit.md` 的 `transformZhuyinRuby`-retired 註記。

## 重構（doc comment，`ruby.ts` 檔頭＋ L294-302 JSDoc）

- 首行定性改為：`transpileRuby` — 把 rb/rtc tabular、multi-`<rt>` 等
  結構化 ruby **降階**成 interop 形（一字一注音 ruby、多層巢狀）。
  刪除「v3-legacy → v4-canonical」框架。
- 「Supported legacy input forms」→「Supported input forms」，並**補列
  form C**（anonymous-base multi-`<rt>`，pass 2 處理）——現行檔頭只列
  A／B／E，漏了 pass 2 實際在做的 C；四形＝A tabular 注音、B tabular
  雙注文（rbspan）、C anonymous-base multi-rt、E 3+ 層。
- 加一段 Why：rb/rtc 為 conforming（引 W3C CR 連結），引擎未支援故降階；
  與 spec repo Rule 6 措詞同調。
- 「v4-canonical form」措詞統一改「interop form」（或「one-base-per-ruby
  nested form」）——canonical 一詞留給標準語法，避免定性混淆。
- 註明 pass 2 拆 C 形的理由是 CSS inter-character fallback 幾何
  （spec Rule 1），與 rb/rtc 支援與否無關——兩個 pass、兩個動機，檔頭
  講清楚。

## Docs／skill 同步

- `.claude/skills/zhuyin-ruby-markup/SKILL.md`（vendored 副本，L145 現引
  `convertLegacyZhuyinRuby` ——這名字從未存在，實際 export 是
  `convertLegacyRuby`）：上游 spec repo（`ruby-markups`，repo 名不變）將
  **統包並攤平**——SKILL.md 移至 repo 根、skill `name` 改 `ruby-markup`
  （見該 repo `docs/plans/issue1-unify-skill.md` 與
  `rule6-rbrtc-rewording.md`）。上游定稿後整份同步，並把本地資料夾改名
  `.claude/skills/zhuyin-ruby-markup/` → `.claude/skills/ruby-markup/`；
  屆時引用即為 `transpileRuby(src)`。
- `manual/`、README 無提及（grep 無 hit），不用動。
- CHANGELOG 由 release-please 生成：commit 用
  `refactor(ts): rename convertLegacyRuby to transpileRuby`——未發布，
  不標 breaking。

## 驗證

1. `pnpm test` — ruby.test.ts／ruby-precise.test.ts 全綠。
2. `git grep -n 'convertLegacyRuby\|parseLegacyRuby'` → 0 hits。
3. `grep -in legacy src/ts/semantics/ruby.ts` → 0 hits。

## 順序依賴

1. 先做本 repo 的 code 改名（獨立可行）。
2. ruby-markups 的 SKILL.md 改寫（含函數名引用）在其三份 plan 定案後進行。
3. 最後把上游 SKILL.md 同步回本 repo 的 `.claude/skills/` 副本。
