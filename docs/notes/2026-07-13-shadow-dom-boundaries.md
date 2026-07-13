# Shadow DOM 邊界調査 — 外部 label／`:has()` 能不能碰 `<han-rail>` 內部

> 調査結論存檔（2026-07-13）。起因：想知道 `<han-rail>` 外面的
> `<label for="XX">` 能否控制 shadow 裡的表單元件、外部 CSS 能否寫
> `han-rail:has(XX:checked) ~ label`。**兩者都不行**，且 open／closed
> mode 不影響此結論。

## 結論速查

| 想做的事 | 可行？ | 原因 |
|---|---|---|
| 外部 `<label for="id">` 控 shadow 內控件 | ✗ | `for` 只在 label 所在樹的 ID 空間解析；shadow root 是另一棵樹 |
| 外部 `<label>` 包住 `<han-rail>` 控內部控件 | ✗ | labeled-control 演算法只找同樹後代，不下降進 shadow root |
| 外部 CSS `han-rail:has(input:checked)` | ✗ | 選擇器匹配不跨 shadow 邊界，`:has()` 看不見 shadow 內容 |
| `mode: 'open'` 能否豁免以上 | ✗ | open 只管 JS（`element.shadowRoot` 拿不拿得到）；宣告式機制一律以樹為界 |

## 機制說明

**樹邊界是宣告式機制的硬邊界。** CSS 選擇器匹配、`label[for]` 的 ID
解析、`getElementById`、form 關聯、`#fragment` 錨點跳轉——全部以
node tree 為作用域。Shadow tree 對這些機制而言就是另一個文檔空間。

**open vs closed 只是 JS 門禁。** `open` = `element.shadowRoot` 回傳
那棵樹（我們的 Playwright e2e 就靠這個穿透 `querySelector`）；
`closed` = 連這都回 `null`。「門沒鎖，JS 可以自己開門進來」≠「這面牆
對 CSS／HTML 宣告式機制透明」。

**`::part()`／`exportparts` 幫不上忙。** 它們只開放「對指定節點下樣式
宣告」，不開放選擇器條件判斷（不能 `::part(x):checked ~ …` 影響
part 以外的東西），更不開放 label 關聯。

**現況為何能動：** Grip label（`for="rail-sheet"`）與 SheetToggle
checkbox 都在 shadow 內——同一棵樹，合法。`components/rail.css` 的
`~` 兄弟選擇器也都是 shadow 內部選擇器。

## 三條可行路

### a) 狀態反射到 host attribute（現行模式，`form` 屬性同款）

元件內部在狀態變化時 `this.toggleAttribute('sheet-open', on)`。
Host 元素本身在 light DOM，外部隨便寫：

```css
han-rail[sheet-open] ~ label { … }
```

控制方向走元件公開方法（外部按鈕呼叫 API），不是 label。
成本最低，跟既有 `form` 屬性同一慣例。

### b) Custom state ＋ `:state()`（平台正規解法，Baseline 2024）

```js
// 元件內
this.#internals.states.add('sheet-open')
```
```css
/* 外部 */
han-rail:state(sheet-open) ~ label { … }
```

語意上是「元件對外公開的狀態」，不污染 attribute 空間；但只解決
樣式端，label 控制端仍需 API。`ElementInternals.states`：
Chrome 125／Safari 17.4／Firefox 126。

### c) 把控件 `<slot>` 到 light DOM（唯一讓外部 label 直接生效的路）

Slotted 節點**留在 light 樹**（slot 只是渲染投影），所以：

- 外部 `<label for="rail-sheet">` 直接生效（同一棵 document 樹）；
- `han-rail:has(input:checked) ~ label` 直接生效（input 是 han-rail
  的 light-DOM 子節點，`:has()` 看得見）；
- shadow 內部改用 `::slotted(input)` 定位；**內部的 `~` 兄弟選擇器
  會失效**（slot 投影不改變 shadow 內部樹結構），要改寫成
  `:host(:has(input:checked)) .Controls`——host 的 `:has()` 查自己的
  light 子樹，在 shadow 樣式表裡合法且看得到 slotted 節點。

代價：這顆 checkbox 變成元件公開合約的一部分（npm 版要文檔化）。

## 對 `<han-rail>` 的建議

- 只要「外部顯示狀態」（如 sheet 開著時外部某元素變樣式）→ **a**，
  一行 `toggleAttribute`。
- 要「外部 label 真的當開關」（如把 sheet 觸發鈕移出元件）→ **c**，
  連帶改寫內部 `~` 選擇器；順手把它寫進未來 b 階段的公開 API 文檔。
- b（`:state()`）適合未來 npm 版：狀態多起來時比 attribute 反射整潔。
