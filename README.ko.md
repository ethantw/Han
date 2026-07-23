# 漢字標準格式 Han.css

[English](./README.md) · [繁體中文](./README.zh-Hant.md) · [日本語](./README.ja.md) · **한국어**

**<ruby>픽셀<rt>pixel</rt></ruby> 사이의 <ruby>活字<rt>활자</rt></ruby> <ruby>美學<rt>미학</rt></ruby>,<br /><ruby>畵面<rt>화면</rt></ruby>의 <ruby>漢字<rt>한자</rt></ruby>에게.**

CJK 웹 페이지를 위해 골라 엮은 CSS <ruby>組版<rt>조판</rt></ruby> 세트다. 줄 끝에서 내어쓰기와 <ruby>壓縮<rt>압축</rt></ruby>을 하는 <ruby>文章<rt>문장</rt></ruby> <ruby>符號<rt>부호</rt></ruby>, 글자에 붙는 <ruby>傍點<rt>방점</rt></ruby>, <ruby>注音<rt>주음</rt></ruby>과 <ruby>倂音<rt>병음</rt></ruby>의 루비, <ruby>文字<rt>문자</rt></ruby> <ruby>種類<rt>종류</rt></ruby> 사이의 머리카락 같은 <ruby>間隙<rt>간극</rt></ruby>, 그리고 <ruby>傳承<rt>전승</rt></ruby> <ruby>字形<rt>자형</rt></ruby>——<ruby>活版<rt>활판</rt></ruby> <ruby>時代<rt>시대</rt></ruby> 組版 <ruby>技法<rt>기법</rt></ruby>를, CSS 커스텀 프로퍼티와 약간의 JavaScript 폴백으로 <ruby>畵面<rt>화면</rt></ruby> 위에 <ruby>再現<rt>재현</rt></ruby>한다.

v4는 네이티브 플랫폼 위로 처음부터 다시 만든 것이다. **CSS 프리프로세서 없이, 필수 JavaScript 없이(있으면 더 좋다).** 라이브러리의 <ruby>實體<rt>실체</rt></ruby>는 서로 <ruby>獨立<rt>독립</rt></ruby>한 네 개의 CSS 모듈과, <ruby>選擇<rt>선택</rt></ruby>할 수 있는 JavaScript <ruby>補助<rt>보조</rt></ruby> 하나다. 모든 <ruby>機能<rt>기능</rt></ruby>은 하나의 `--han-*` 커스텀 프로퍼티로 켜고 끈다.

```
pnpm add @hanzi.pro/han.css
```

```js
import '@hanzi.pro/han.css/styles'   // 네 모듈 전부
import '@hanzi.pro/han.css/auto'     // 선택적 JS 보조(폴백)
```

또는 CDN에서 곧바로, 빌드는 전혀 필요 없다.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.min.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.auto.min.js"></script>
```

<ruby>設置<rt>설치</rt></ruby>는 이것이 전부다——이제 <ruby>意味<rt>의미</rt></ruby>가 부여된 HTML이 스스로 組版된다. `<em>`에 붙는 것은 傍點이지 기울임이 아니다. `<cite>`에는 <ruby>書名號<rt>서명호</rt></ruby>가 붙는다. 文章 符號는 壓縮되고 내어쓰기된다. <ruby>漢字<rt>한자</rt></ruby>와 라틴 <ruby>文字<rt>문자</rt></ruby> 사이에는 알맞은 間隙이 들어간다.

## 기본 모델

세 가지만 익히면 라이브러리 전체를 안다.

### 一, 네 모듈, 각기 하나의 역할

| 모듈 | 캐스케이드 레이어 | 하는 일 |
|------|--------------|--------|
| **<ruby>意味<rt>의미</rt></ruby> 스타일** | `han-semantics` | 漢字 組版에서 意味 <ruby>要素<rt>요소</rt></ruby>가 갖춰야 할 모습——傍點(`--han-em-symbol`, `--han-em-dot-position`), `<cite>`의 書名號(`--han-cite-title-marks`), <ruby>固有名詞<rt>고유명사</rt></ruby> <ruby>標示<rt>표시</rt></ruby>, 루비. 그리고 가짜 기울임의 <ruby>廢止<rt>폐지</rt></ruby> |
| **행의 <ruby>調整<rt>조정</rt></ruby>** | `han-lines` | 줄 안의 <ruby>均衡<rt>균형</rt></ruby>——文章 符號의 壓縮과 줄 끝 내어쓰기(`--han-punctuation-refinement`), 文字 種類 사이 間隙(`--han-text-autospace`) |
| **<ruby>段落<rt>단락</rt></ruby> 짜임** | `han-prose` | 블록 축의 리듬——<ruby>題目<rt>제목</rt></ruby>·段落·<ruby>目錄<rt>목록</rt></ruby> 사이 <ruby>餘白<rt>여백</rt></ruby>과, 글자를 단위로 하는 들여쓰기(`--han-prose`, `--han-prose-indent`. 기본은 `<article>`에만 미친다) |
| **<ruby>書體<rt>서체</rt></ruby>** | `han-fonts` | 書體 스택과 웹폰트——傳承 字形(`--han-use-heritage-glyphs-for-hant`), 文章 符號 書體, <ruby>楷書體<rt>해서체</rt></ruby> 계열(`--han-use-cursive`) |

네 모듈은 서로 獨立이라, 전부 넣어도 되고 하나만 골라도 된다. 저마다 자기 캐스케이드 레이어에 살며, 당신의 스타일과 <ruby>干涉<rt>간섭</rt></ruby>하지 않는다. 모듈 단위로 고르려면——

```js
import '@hanzi.pro/han.css/styles/semantics'
import '@hanzi.pro/han.css/styles/lines'
import '@hanzi.pro/han.css/styles/prose'
import '@hanzi.pro/han.css/styles/fonts'
```

### 二, 모든 機能은 CSS 커스텀 프로퍼티

機能 하나마다 `--han-*` 프로퍼티 하나가 <ruby>對應<rt>대응</rt></ruby>한다. 아무 셀렉터에나 그것을 <ruby>設定<rt>설정</rt></ruby>하면, 그 <ruby>範圍<rt>범위</rt></ruby> 안에서 機能이 든다. 이것은 漢.css가 만든 <ruby>裝置<rt>장치</rt></ruby>가 아니라, 네이티브 CSS의 <ruby>相續<rt>상속</rt></ruby>과 스타일 쿼리(`@container style()`)다.

```css
/* 문서 전체의 傍點을 참깨점으로 바꾼다 */
:root { --han-em-symbol: sesame; }

/* 이 구역만 文章 符號 다듬기(壓縮과 내어쓰기)를 끈다 */
.quoted-legacy-text { --han-punctuation-refinement: none; }
```

외울 클래스 이름도, 부를 JavaScript API도 없다. 셀렉터가 곧 範圍이고, 프로퍼티가 곧 스위치다. 스타일 쿼리는 **<ruby>祖上<rt>조상</rt></ruby>**을 읽으므로, 겨냥하는 내용의 祖上(또는 `:root`)에 프로퍼티를 設定하라. 각 모듈의 프로퍼티 전체 목록은 문서를 보라.

### 三, <ruby>明示度<rt>명시도</rt></ruby>는 〇

모든 규칙은 `:where()` 안에 담겨 나가므로 明示度가 零이다. 당신의 규칙은——그저 素의 要素 셀렉터라도——프레임워크를 덮어쓸 수 있다. `@layer`를 쓰면 모듈 <ruby>順序<rt>순서</rt></ruby>도 당신의 것이다.

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

## JavaScript 보조는 선택이다

**JavaScript 없이도 온전히 쓸 수 있다.** 네 모듈의 <ruby>核心<rt>핵심</rt></ruby> 機能은 <ruby>純粹<rt>순수</rt></ruby>한 CSS다. `installFallbacks`가 맡는 것은 엔진이 아직 네이티브로 하지 못하는 부분뿐이다——文章 符號 壓縮·내어쓰기의 DOM 층위 폴백, `text-autospace` 미구현 환경에서의 文字 種類 사이 間隙, 이웃한 줄의 밑줄 간격 <ruby>標示<rt>표시</rt></ruby>. 모두 `CSS.supports`와 런타임 프로브로 하나씩 <ruby>檢査<rt>검사</rt></ruby>하며, 엔진이 <ruby>支援<rt>지원</rt></ruby>하면 저절로 물러난다.

```js
import '@hanzi.pro/han.css/auto'                 // 로드 시 DOMContentLoaded에서 실행

import { installFallbacks } from '@hanzi.pro/han.css'
installFallbacks(document.body)                  // 또는 타이밍과 範圍를 직접 <ruby>制御<rt>제어</rt></ruby>
```

줄 안 組版의 <ruby>細部<rt>세부</rt></ruby>가 중요하면 `auto`를, 意味 스타일과 段落 리듬만 필요하면 純粹한 CSS로 <ruby>充分<rt>충분</rt></ruby>하다.

## 웹폰트(傳承 字形)

書體 모듈은 書體 스택과 <ruby>家族<rt>가족</rt></ruby> 이름을 <ruby>定義<rt>정의</rt></ruby>한다. 傳承 字形(<ruby>尙古<rt>상고</rt></ruby> <ruby>黑體<rt>흑체</rt></ruby>·<ruby>明體<rt>명체</rt></ruby> 등)의 woff2 <ruby>配布<rt>배포</rt></ruby>는 당신의 選擇이다. 가장 간단한 길은 조각낸 ziano CDN 서브셋을 거는 것이다.

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans@latest/swap.css">
```

아예 넣지 않을 수도 있다——`--han-use-heritage-glyphs-for-hant: system`으로 시스템 폰트로 물러난다.

## <ruby>結果物<rt>결과물</rt></ruby> 한눈에

| 파일 | 내용 |
|------|------|
| `han.css` | 전체 묶음——네 모듈＋JS 보조용 스타일＋<ruby>內藏<rt>내장</rt></ruby> 書體 <ruby>資産<rt>자산</rt></ruby>(<ruby>全角<rt>전각</rt></ruby> <ruby>空白<rt>공백</rt></ruby> <ruby>校正<rt>교정</rt></ruby> 書體, 注音 書體) |
| `han.{semantics,lines,prose,fonts}.css` | 모듈별 묶음. 저마다 캐스케이드 레이어에 살며, 넷의 <ruby>總和<rt>총화</rt></ruby>＝전체 묶음 |
| `han.basic.css` | <ruby>簡潔<rt>간결</rt></ruby>판——semantics＋lines＋prose 세 모듈의 純粹 CSS 부분만. fonts 모듈·JS 보조용 스타일·書體 資産은 없다 |
| `han.js` | JS 진입점(ESM). 이름 붙은 익스포트만이며, <ruby>自動<rt>자동</rt></ruby>으로 <ruby>實行<rt>실행</rt></ruby>하지 않는다 |
| `han.auto.js` | 자동 설치 진입점. 로드하면 폴백을 넣고 전체 API를 다시 익스포트한다 |

각 파일에 `.min`판과 소스 맵이 붙는다.

## 브라우저 支援

최신 에버그린 브라우저를 支援한다. 核心 <ruby>裝置<rt>장치</rt></ruby>(스타일 쿼리, `:where()`, `@layer`, `@property`)는 근래 Baseline을 따른다. 줄 안 組版에서의 엔진 <ruby>差異<rt>차이</rt></ruby>(`text-autospace`, `text-spacing-trim`)는 JavaScript 보조가 <ruby>必要<rt>필요</rt></ruby>에 따라 채운다.

## 문서

완전한 문서와 <ruby>對話型<rt>대화형</rt></ruby> 플레이그라운드——글을 붙이고, 패널을 바꾸고, <ruby>生成<rt>생성</rt></ruby>된 設定 코드를 복사한다——는 **[hanzi.pro](https://hanzi.pro)**에 있다. <ruby>參考<rt>참고</rt></ruby> 매뉴얼은 지금 <ruby>繁體<rt>번체</rt></ruby> <ruby>中國語<rt>중국어</rt></ruby>를 <ruby>基準<rt>기준</rt></ruby>으로 하고, 영어가 <ruby>紹介<rt>소개</rt></ruby>와 設置를 다루며, 일본어·한국어는 차례로 <ruby>準備<rt>준비</rt></ruby> 중이다.

## 라이선스

[MIT](./LICENSE) © 2012–2026 Chen Yijun. 內藏 및 傳承 웹폰트는 저마다 <ruby>上流<rt>상류</rt></ruby> 라이선스(OFL 1.1)를 따른다. 各 폰트 패키지를 보라.
