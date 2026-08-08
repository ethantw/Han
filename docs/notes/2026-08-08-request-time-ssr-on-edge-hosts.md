# 請求時 SSR：Vercel 可以，Cloudflare Pages Functions 不行（`vm` 缺席）

2026-08-08。手冊要上 Cloudflare 或 Vercel，樣張頁想展示「han.js 真的在後端跑」
——不是建置時跑一次的預渲染。兩家都實測過了，結論不一樣。

## 結論

| 執行環境 | 請求時跑 `installFallbacks()` | 依據 |
|---|---|---|
| Node（Vercel Functions、自架、dev server） | **可以** | 實測 200、`data-han-ssr="request"`、3,806 個 `h-char`、時間戳每次不同 |
| workerd（Cloudflare Pages Functions／Workers） | **不行** | `Error: [unenv] Script.runInContext is not implemented yet!` |

Cloudflare 那條不是設定沒調對，也不是「用 Next 就好了」能繞過的：擋住的是
**執行環境沒有 `node:vm`**。任何跑在 workerd 上的框架（含
`@opennextjs/cloudflare` 底下的 Next.js）都一樣撞這一面牆，因為牆在 han 的
相依鏈上，不在框架上：

```
han.css → hyperly → happy-dom → vm.Script.runInContext
```

`nodejs_compat` 補得到 `node:perf_hooks`、`url` 這些（happy-dom 只碰
`node:perf_hooks` 一個 node 內建），也補得到模組解析；補不到的是 `vm` 這種
需要真 V8 context 的東西——unenv 給的是會丟例外的 stub。

要在 Cloudflare 上做到請求時 SSR，得先把 hyperly 的 DOM 後端換成不需要 `vm`
的解析器（或改寫成 `HTMLRewriter` 那種串流式改寫）。那是 hyperly 層級的工程，
不是手冊這一側能決定的。

## 路上踩到的第一顆雷：`browser` 條件把 SSR 分支換成 stub

第一次在 `wrangler pages dev` 跑起來時，錯的不是 `vm`，是這一句：

```
Error: [han.css] happy-dom browser stub constructed
       — the browser bundle must never take the SSR branch.
```

原因：`import '@hanzi.pro/han.css'` 的 exports map 有 `browser` 條件，而**任何
把程式碼當「瀏覽器用」打包的工具都會挑中它**——Cloudflare Pages Functions 的
esbuild 就是其中之一，即使它產出的東西根本不在瀏覽器裡跑。拿到的是把 happy-dom
換成 stub 的那一份，一呼叫就丟。

修法是給庫加一條沒有 `browser` 條件的出口（`package.json`）：

```json
"./ssr": { "types": "./dist/types/han.d.ts", "default": "./dist/han.js" }
```

SSR 呼叫端一律 `import '@hanzi.pro/han.css/ssr'`。這條出口對 Node 沒有差別，
對「條件解析被打包器決定」的環境則是唯一可靠的寫法——**這一顆與
Cloudflare 能不能跑無關，凡是打包 SSR 程式碼的工具都可能踩到。**

## 手冊現在的做法

`manual/ssr-specimen.js` 是唯一那支渲染函式，三個呼叫端共用：

- `vite.config.js` 建置時（`mode: 'build'`）→ 靜態的 `/specimen.ssr.html`，
  **任何託管都吃得到的保底**；
- dev middleware（`mode: 'request'`）→ 每個請求現排；
- `manual/api/specimen-ssr.js`（Vercel Node function，`vercel.json` 把
  `/specimen.ssr.html` rewrite 過去）→ 生產環境每個請求現排。

頁面自己說得出跑的是哪一種：`<html data-han-ssr="build|request">` 選出兩句
不同的文案，旁邊一個真的時間戳。請求時排的話，重新整理就會變；建置時排的話，
整個部署期間都是同一個值。**這是可驗證的，不是文案宣稱。**

部署到 Cloudflare 就只會有 `build` 那一種——那不是壞掉，是那個平台今天的實情，
而頁面照實說。
