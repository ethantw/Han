# `sideEffects` 白名單漏了 `src/`，產物靜默變成 0 bytes

**日期**：2026-08-07（從已完成的計畫裡打撈出來）

## 症狀

`han.install.min.js` 打包出來是 **0 bytes**。**build 不報錯**，沒有警告，
只是產出一個空檔。

## 原因

`package.json` 補 `"sideEffects"` 白名單時只寫了 `./dist/…` 路徑。但
esbuild 讀 `src/` 時用的是**同一個** root `package.json`——於是
`src/han.auto.ts` 被判定為無副作用，整棵搖光。

白名單必須同時涵蓋**兩棵樹**。現行寫法用 glob 而非路徑前綴，這正是為了
一併涵蓋 `src/` 與 `dist/`：

```json
"sideEffects": ["*.css", "**/han.auto.*"]
```

## 教訓

`sideEffects` 是**整包一份**的宣告，但一個 repo 可能有多個進入點在不同
的樹底下被打包（`src/` 給自家 build，`dist/` 給消費者的 bundler）。用
路徑前綴寫白名單就會漏掉其中一棵。

而 tree-shaking 的失敗模式是**空檔案，不是錯誤**——所以打包設定改動之後
要檢查產物大小，不能只看 build 有沒有綠。
