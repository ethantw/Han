import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { html } from 'hyperly/fp'
import { installFallbacks } from '../fallbacks.ts'
import { transpileRuby } from '../semantics/ruby.ts'

const setup = (html: string) => {
  const win = new Window()
  win.document.body.innerHTML = html
  return win.document.body as unknown as Element
}

// Exact ruby.md first block, checking BOTH commas
test('precise: ruby.md block 1 — both ，s preserved', () => {
  const body = setup(`<div><ruby>
  <rb>我</rb><rb>有</rb><rb>一</rb><rb>个</rb><rb>朋</rb><rb>友</rb>，<rb>伊</rb><rb>真</rb><rb>有</rb><rb>志</rb><rb>氣</rb>，
  <rtc class="reading romanization">
    <rt>guá
    <rt>ū
    <rt rbspan="2">tsi̍t ê
    <rt rbspan="2">pîng-iú
    <rt>i
    <rt rbspan="2">tsin-ū
    <rt rbspan="2">tsì-khì
  </rtc>
  <rtc class="reading zhuyin">
    <rt>ㆣㄨㄚˋ</rt>
    <rt>ㄨ˫</rt>
    <rt>ㄐㄧㆵ̍</rt>
    <rt>ㆤˊ</rt>
    <rt>ㄅㄧㄥˊ</rt>
    <rt>ㄧㄨˋ</rt>
    <rt>ㄧ</rt>
    <rt>ㄐㄧㄣ</rt>
    <rt>ㄨ˫</rt>
    <rt>ㄐㄧ˪</rt>
    <rt>ㄎㄧ˪</rt>
  </rtc>
</ruby></div>`)
  transpileRuby(body)
  const out = body.querySelector('div')!.innerHTML

  const expected =
    '<ruby><ruby class="zhuyin">我<rt>ㆣㄨㄚˋ</rt></ruby><rt>guá</rt></ruby>'
    + '<ruby><ruby class="zhuyin">有<rt>ㄨ˫</rt></ruby><rt>ū</rt></ruby>'
    + '<ruby>'
      + '<ruby class="zhuyin">一<rt>ㄐㄧㆵ̍</rt></ruby>'
      + '<ruby class="zhuyin">个<rt>ㆤˊ</rt></ruby>'
      + '<rt>tsi̍t ê</rt>'
    + '</ruby>'
    + '<ruby>'
      + '<ruby class="zhuyin">朋<rt>ㄅㄧㄥˊ</rt></ruby>'
      + '<ruby class="zhuyin">友<rt>ㄧㄨˋ</rt></ruby>'
      + '<rt>pîng-iú</rt>'
    + '</ruby>'
    + '，'
    + '<ruby><ruby class="zhuyin">伊<rt>ㄧ</rt></ruby><rt>i</rt></ruby>'
    + '<ruby>'
      + '<ruby class="zhuyin">真<rt>ㄐㄧㄣ</rt></ruby>'
      + '<ruby class="zhuyin">有<rt>ㄨ˫</rt></ruby>'
      + '<rt>tsin-ū</rt>'
    + '</ruby>'
    + '<ruby>'
      + '<ruby class="zhuyin">志<rt>ㄐㄧ˪</rt></ruby>'
      + '<ruby class="zhuyin">氣<rt>ㄎㄧ˪</rt></ruby>'
      + '<rt>tsì-khì</rt>'
    + '</ruby>'
    + '，'

  assert.equal(out, expected)
})

// Pipeline test: installFallbacks (wraps ，in <h-char>) then transpileRuby
test('precise: installFallbacks → transpileRuby pipeline — <h-char> commas preserved', () => {
  const raw = `<div><ruby>
  <rb>我</rb><rb>有</rb><rb>一</rb><rb>个</rb><rb>朋</rb><rb>友</rb>，<rb>伊</rb><rb>真</rb><rb>有</rb><rb>志</rb><rb>氣</rb>，
  <rtc class="reading romanization">
    <rt>guá</rt><rt>ū</rt>
    <rt rbspan="2">tsi̍t ê</rt>
    <rt rbspan="2">pîng-iú</rt>
    <rt>i</rt>
    <rt rbspan="2">tsin-ū</rt>
    <rt rbspan="2">tsì-khì</rt>
  </rtc>
  <rtc class="reading zhuyin">
    <rt>ㆣㄨㄚˋ</rt><rt>ㄨ˫</rt><rt>ㄐㄧㆵ̍</rt><rt>ㆤˊ</rt>
    <rt>ㄅㄧㄥˊ</rt><rt>ㄧㄨˋ</rt><rt>ㄧ</rt><rt>ㄐㄧㄣ</rt>
    <rt>ㄨ˫</rt><rt>ㄐㄧ˪</rt><rt>ㄎㄧ˪</rt>
  </rtc>
</ruby></div>`

  // Step 1: installFallbacks wraps ，in <h-char data-punct="end hangable">
  const afterInstall = html(installFallbacks(raw))

  // Step 2: transpileRuby runs on the already-processed DOM
  const win = new Window()
  win.document.body.innerHTML = afterInstall
  const body = win.document.body as unknown as Element
  transpileRuby(body)
  const out = body.querySelector('div')!.innerHTML

  const hChar = '<h-char data-punct="end hangable"><h-layer>，</h-layer></h-char>'
  const expected =
    '<ruby><ruby class="zhuyin">我<rt>ㆣㄨㄚˋ</rt></ruby><rt>guá</rt></ruby>'
    + '<ruby><ruby class="zhuyin">有<rt>ㄨ˫</rt></ruby><rt>ū</rt></ruby>'
    + '<ruby>'
      + '<ruby class="zhuyin">一<rt>ㄐㄧㆵ̍</rt></ruby>'
      + '<ruby class="zhuyin">个<rt>ㆤˊ</rt></ruby>'
      + '<rt>tsi̍t ê</rt>'
    + '</ruby>'
    + '<ruby>'
      + '<ruby class="zhuyin">朋<rt>ㄅㄧㄥˊ</rt></ruby>'
      + '<ruby class="zhuyin">友<rt>ㄧㄨˋ</rt></ruby>'
      + '<rt>pîng-iú</rt>'
    + '</ruby>'
    + hChar
    + '<ruby><ruby class="zhuyin">伊<rt>ㄧ</rt></ruby><rt>i</rt></ruby>'
    + '<ruby>'
      + '<ruby class="zhuyin">真<rt>ㄐㄧㄣ</rt></ruby>'
      + '<ruby class="zhuyin">有<rt>ㄨ˫</rt></ruby>'
      + '<rt>tsin-ū</rt>'
    + '</ruby>'
    + '<ruby>'
      + '<ruby class="zhuyin">志<rt>ㄐㄧ˪</rt></ruby>'
      + '<ruby class="zhuyin">氣<rt>ㄎㄧ˪</rt></ruby>'
      + '<rt>tsì-khì</rt>'
    + '</ruby>'
    + hChar

  assert.equal(out, expected)
})
