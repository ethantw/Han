# lead-forme-pocket 的 cut 斷言——出生即紅，且隨內容改動持續惡化

**日期**：2026-08-06
**狀態**：調查完畢，**未修**——修法是設計取捨（owner's call），見末節。

## 症狀

`tests/e2e/lead-forme-pocket.spec.ts` 的
`expect(laid.cut).toBeGreaterThan(20)` 紅燈，實測 **cut = −41.29**
（1600×1000，Chromium）。cut 量的是「鉛字盤的墨線斜邊切進樣張卡
（`.Faces`）多深」——§ the lift 的視覺哏（活字版壓在校樣上）的量化。

## A/B 溯源（worktree 逐 commit 實測）

方法陷阱先記一筆：playwright `reuseExistingServer` 會撿走主庫殘留在
5273 的 server，worktree 的前三個量測點全打到同一台——**每個 ref 都要
先殺 5273、`node build/library`＋`vite build` 重建再量**。serve.js 服務
的是 `manual/dist`，不是 dev server。

| ref | cut | 備註 |
|---|---|---|
| 94bbc04（斷言誕生，7/30） | **−3.17** | 出生即不足 20，紅燈自帶 |
| 82cca81^／1206810 | −3.16〜−3.17 | viewBox 貼合、字面填滿：無影響 |
| 6c18676（密排） | −3.15 | |
| 5d15b00^（6c18676 之後、護眼版面之前） | **−31.56** | station② i18n／內容期，−28px |
| 5d15b00（護眼開關那排的多語版面） | **−41.28** | 再 −10px |
| d4bb37a（主控台 fixed）〜 現在 | −41.28 | 此後全程不變 |

## 病理

抬升（§ the lift）是**開環**的：負 margin 由幾何常數算出
（`--lf-apex`／`--lf-pad` 由 JS 從活字版足跡發布＋一顆手調的
`--lf-graze`），**不錨定樣張卡的實際位置**。設計註解自己寫明前提——
「the note stays two lines whatever the width」。於是凡是卡片與鉛字盤
之間、或樣張欄上方的內容改高度（i18n 讓護眼那排長高、樣張欄文案改
寫……），卡與盤的相對位置就漂，graze 逐步流失：−3 → −31.6 → −41.3。
單一 commit 都「看起來與鉛字盤無關」，錯位卻是累積的。

出生即 −3 說明斷言寫下時就沒在這台機器上綠過（差 23px）；後續內容
改動把缺口拉大到 61px。

## 修法選項（擇一，owner 定）

1. **閉環**：lead-forme.js 已經發布幾何變數，再量一個「卡片底邊相對
   圖頂的實距」發布成變數，抬升改吃它——內容再怎麼改都咬得住。
   代價：JS 多一次跨元素量測，「lift 是純算術」的敘事破功。
2. **重調 graze**：`--lf-graze` 的 `0.1 * --lf-c`（上限 8rem）改到約
   `0.15 * --lf-c`（上限 ~12rem）可補回 61px。最省事，但同樣的內容
   漂移下次照樣失守——這次就是這樣紅掉的。
3. **降斷言**：承認 cut 是內容敏感值，斷言改為「近失容忍」
   （例如 `> −60`）或刪除，只留 z-index 半邊。哏的存在改由人眼驗收。

視覺現況：斜邊從卡片右下角下方 ~41px 掠過——近失，哏沒了但版面不醜
（scratchpad 截圖 pocket2.png）。
