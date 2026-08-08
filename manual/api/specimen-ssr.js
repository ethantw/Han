/**
 * Vercel Function — `/specimen.ssr.html`，**每個請求**現排一份。
 *
 * 為什麼只有 Vercel 有這一支、Cloudflare 沒有：han 的 SSR 路徑經 hyperly 用
 * happy-dom 解析 HTML，而 happy-dom 要 `vm.Script.runInContext`——workerd 沒有
 * 這個東西（`wrangler pages dev` 實測：`[unenv] Script.runInContext is not
 * implemented yet!`），而且那面牆在相依鏈上不在框架上，換成跑在 workerd 的
 * Next.js 一樣撞。Cloudflare 部署因此只吃建置時那一份靜態 SSR 頁，頁面照實說。
 * 全文見 `docs/notes/2026-08-08-request-time-ssr-on-edge-hosts.md`。
 *
 * Vercel 的路由是 `api/<name>` ⇒ `/api/<name>`，所以那個好看的網址由
 * `manual/vercel.json` 的 rewrite 接過來。runtime 明寫 `nodejs`，不是 Edge——
 * 理由同上。
 *
 * 部署設定（Vercel）：
 *   · Root directory   `manual`
 *   · Build command    `pnpm --filter han-manual build`
 *   · Output directory `dist`
 * 專案是 pnpm workspace、`@hanzi.pro/han.css` 是 `workspace:*`，所以 Vercel 的
 * Root Directory 要開「Include files outside the root directory」，否則裝不到庫。
 *
 * 失敗**不吐 500**，退回建置時寫好的靜態那一份：這是示例頁，讀者要看的是排好
 * 版的樣張，不是我們的堆疊追蹤。`/specimen.ssr.html` 已經被 rewrite 佔給本函式，
 * 所以退路走 `/specimen.ssr.prebuilt.html`——建置時同時寫出的同一份內容
 * （vite.config.js § renderSpecimenPages）。退了看得出來：頁面的時間戳會停住，
 * 而那句文案會從「你請求的那一刻」變成「建置時」。
 */
export const config = { runtime: 'nodejs' }

export default async function handler(request) {
  const origin = new URL(request.url).origin

  try {
    const { ssrSpecimen } = await import('../ssr-specimen.js')
    // 來源就是同一個站上的瀏覽器端樣張——沒有第二份檔案，也就沒有第二份內容。
    const src = await (await fetch(`${origin}/specimen.html`)).text()
    const html = await ssrSpecimen(src, { mode: 'request' })
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // 現排的意義在「這一份是此刻產生的」，快取一存就沒了。
        'cache-control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[specimen.ssr] request-time render failed, serving prebuilt:', err)
    return fetch(`${origin}/specimen.ssr.prebuilt.html`)
  }
}
