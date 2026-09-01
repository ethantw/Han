const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector))

const initRailNav = () => {
  const $nav = $('.ReadingStation > nav')
  const $rail = $('.ReadingStation > .Rail')
  const $previous = $('button[value="previous"]', $nav)
  const $next = $('button[value="next"]', $nav)
  if (!$nav || !$rail || !$previous || !$next) return

  const sync = () => {
    const way = getComputedStyle($rail).direction === 'rtl' ? -1 : 1
    const position = $rail.scrollLeft * way
    const end = $rail.scrollWidth - $rail.clientWidth - 1
    $previous.disabled = position <= 0
    $next.disabled = position >= end
    $nav.hidden = $previous.disabled && $next.disabled
  }
  const move = (sign) => {
    const way = getComputedStyle($rail).direction === 'rtl' ? -1 : 1
    $rail.scrollBy({ left: sign * way * $rail.clientWidth / 3, behavior: 'smooth' })
  }

  $previous.addEventListener('click', () => move(-1))
  $next.addEventListener('click', () => move(1))
  $rail.addEventListener('scroll', sync, { passive: true })
  $rail.addEventListener('han-rail-layout', sync)
  new ResizeObserver(sync).observe($rail)
  sync()
}

const synth = window.speechSynthesis
const $station = $('.ReadingStation')
const $dispatch = $('.Dispatch')
const $numbersGroup = $('button[name="speak"][value="story"]')
const $elementsGroup = $('button[name="speak"][value="elements"]')
const $fontSize = $('[name="font-size"]')
const $fontSizeOutput = $('output[for="reading-font-size"]')

const selectedValue = (name) => $(`[name="${name}"]:checked`).value

const annotated = (base, native, roman, emphasis) => ({ base, native, roman, emphasis })
const bare = (text) => ({ text })
const directional = (horizontal, vertical) => ({ directional: { horizontal, vertical } })

const readingSystems = {
  minnan: {
    name: '閩南語', lang: 'nan-TW', listLang: 'nan-Hant-TW', nativeLang: 'nan-Bopo-TW', romanLang: 'nan-Latn-TW',
    groupLabel: '讀全篇捷報',
    headlineSpeech: '巴納德星採礦團告捷。超導磁喉有望成真。',
    paragraphs: [
      [
        annotated('半世紀', 'ㄅㄨㆩ˫ ㄙㆤ˪ ㄍㄧˋ', 'puànn sè-kí'),
        annotated('前', 'ㄗㄧㄥˊ', 'tsîng'),
        annotated('拄仔', 'ㄉㄨˋ ㄚˋ', 'tú-á'),
        annotated('出航', 'ㄘㄨㆵ ㄏㄤˊ', 'tshut-hâng'),
        annotated('的', 'ㆤˊ', 'ê'),
        annotated('喜馬拉雅', 'ㄏㄧˋ ㄇㄚˋ ㄌㄚㆷ̇ ㆣㄚˋ', 'Hí-má-la̍h-ngá'),
        annotated('球際', 'ㄍㄧㄨˊ ㄗㆤ˪', 'kiû-tsè'),
        annotated('採礦', 'ㄘㄞˋ ㄎㆲ˪', 'tshái-khòng'),
        annotated('軍團', 'ㄍㄨㄣ ㄊㄨㄢˊ', 'kun-thuân'),
        annotated('一六八七', 'ㄧㆵ ㄌㄧㆦㆻ̇ ㄅㆤㆷ ㄑㄧㆵ', 'it-lio̍k-peh-tshit', 'id'),
        annotated('師', 'ㄙㄨ', 'su'),
        annotated('第', 'ㄉㆤ˫', 'tē'),
        annotated('十', 'ㄒㄧㆴ̇', 'si̍p', 'id'),
        annotated('艦隻', 'ㄌㄚㆬ˫ ㄗㄧㄚㆷ', 'lām-tsiah'), bare('，'),
        annotated('佇', 'ㄉㄧ˫', 'tī'),
        annotated('巴納德', 'ㄅㄚ ㄋㄚㆴ̇ ㄉㄧㆻ̇', 'Pa-na̍p-tik'),
        annotated('星系', 'ㄑㆥ ㄏㆤ˫', 'tshenn-hē'),
        annotated('傳來', 'ㄊㄨㄢˊ ㄌㄞˊ', 'thuân-lâi'),
        annotated('捷報', 'ㄗㄧㄚㆵ̇ ㄅㄜ˪', 'tsia̍t-pò'), bare('；'),
        annotated('閣過', 'ㄍㆦㆷ ㄍㄨㆤ˪', 'koh kuè'),
        annotated('百冬', 'ㄅㄚㆷ ㄉㄤ', 'pah tang'), bare('，'),
        annotated('欲', 'ㄅㆤㆷ', 'beh'),
        annotated('替', 'ㄊㆤ˪', 'thè'),
        annotated('地球', 'ㄉㆤ˫ ㄍㄧㄨˊ', 'tē-kiû'),
        annotated('佮', 'ㄍㄚㆷ', 'kah'),
        annotated('太陽系', 'ㄊㄞ˪ ㄧㆲˊ ㄏㆤ˫', 'thài-iông-hē'),
        annotated('載轉來', 'ㄗㄞ˪ ㄉㄫˋ ㄌㄞˊ', 'tsài tńg-lâi'),
        annotated('十', 'ㄗㄚㆴ̇', 'tsa̍p', 'cargo'),
        annotated('垓', 'ㄍㄞ', 'kai', 'cargo'),
        annotated('噸', 'ㄉㆲ˪', 'tòng', 'cargo'),
        annotated('的', 'ㆤˊ', 'ê'),
        annotated('稀有', 'ㄏㄧ ㄧㄨ˫', 'hi-iú'),
        annotated('元素', 'ㄍㄨㄢˊ ㄙㆦ˪', 'guân-sòo'), bare('，'),
        directional(
          annotated('如右', 'ㆡㄨˊ ㄧㄨ˫', 'jû-iū'),
          annotated('如左', 'ㆡㄨˊ ㄗㄜˋ', 'jû-tsó'),
        ), bare('：'),
      ],
      [
        annotated('這', 'ㄐㄧㆵ', 'tsit'),
        annotated('批', 'ㄆㄨㆤ', 'phue'),
        annotated('材料', 'ㄗㄞˊ ㄌㄧㄠ˫', 'tsâi-liāu'),
        annotated('會', 'ㆤ˫', 'ē'),
        annotated('予', 'ㄏㆦ˫', 'hōo'),
        annotated('地球', 'ㄉㆤ˫ ㄍㄧㄨˊ', 'tē-kiû'),
        annotated('佮', 'ㄍㄚㆷ', 'kah'),
        annotated('太陽系', 'ㄊㄞ˪ ㄧㆲˊ ㄏㆤ˫', 'thài-iông-hē'),
        annotated('有', 'ㄨ˫', 'ū'),
        annotated('機會', 'ㄍㄧ ㄏㄨㆤ˫', 'ki-huē'),
        annotated('共', 'ㄍㄚ˫', 'kā'),
        annotated('電磁', 'ㄉㄧㄢ˫ ㄗㄨˊ', 'tiān-tsû'),
        annotated('囚籠', 'ㄑㄧㄨˊ ㄌㆲˊ', 'tshiû-lông'),
        annotated('超導', 'ㄑㄧㄠ ㄉㄜ˫', 'tshiau-tō'),
        annotated('磁喉', 'ㄗㄨˊ ㄠˊ', 'tsû-âu'),
        annotated('熱盾', 'ㄖㄨㄚㆵ̇ ㄉㄨㄣ˫', 'jua̍t-tūn'),
        annotated('佮', 'ㄍㄚㆷ', 'kah'),
        annotated('偵測器', 'ㄐㄧㄥ ㄑㄧㆻ ㄎㄧ˪', 'tsing-tshik-khì'), bare('，'),
        annotated('對', 'ㄉㄨㄧ˪', 'tuì'),
        annotated('圖紙', 'ㄉㆦˊ ㄗㄨㄚˋ', 'tôo-tsuá'),
        annotated('搬入', 'ㄅㄨㄢ ㄖㄧㆴ̇', 'puann-ji̍p'),
        annotated('深空', 'ㄑㄧㆬ ㄎㆲ', 'tshim-khong'),
        annotated('船塢', 'ㄗㄨㄣˊ ㄜ', 'tsûn-oo'), bare('。'),
      ],
    ],
    note: '十垓噸約是一個地球質量的六分之一；球際公報的會計部門拒絕對這个數字負責。',
  },
  mandarin: {
    name: '國語', lang: 'zh-TW', listLang: 'zh-Hant-TW', nativeLang: 'zh-Bopo-TW', romanLang: 'zh-Latn-pinyin',
    groupLabel: '國語讀全篇',
    headlineSpeech: '巴納德星採礦團告捷。超導磁喉有望成真。',
    paragraphs: [
      [
        annotated('半世紀', 'ㄅㄢˋ ㄕˋ ㄐㄧˋ', 'bàn shìjì'),
        annotated('前', 'ㄑㄧㄢˊ', 'qián'),
        annotated('甫', 'ㄈㄨˇ', 'fǔ'),
        annotated('出航', 'ㄔㄨ ㄏㄤˊ', 'chūháng'),
        annotated('的', '˙ㄉㄜ', 'de'),
        annotated('喜馬拉雅', 'ㄒㄧˇ ㄇㄚˇ ㄌㄚ ㄧㄚˇ', 'Xǐmǎlāyǎ'),
        annotated('球際', 'ㄑㄧㄡˊ ㄐㄧˋ', 'qiújì'),
        annotated('採礦', 'ㄘㄞˇ ㄎㄨㄤˋ', 'cǎikuàng'),
        annotated('軍團', 'ㄐㄩㄣ ㄊㄨㄢˊ', 'jūntuán'),
        annotated('一六八七', 'ㄧ ㄌㄧㄡˋ ㄅㄚ ㄑㄧ', 'yī-liù-bā-qī', 'id'),
        annotated('師', 'ㄕ', 'shī'),
        annotated('第', 'ㄉㄧˋ', 'dì'),
        annotated('十', 'ㄕˊ', 'shí', 'id'),
        annotated('艦隻', 'ㄐㄧㄢˋ ㄓ', 'jiànzhī'), bare('，'),
        annotated('從', 'ㄘㄨㄥˊ', 'cóng'),
        annotated('巴納德', 'ㄅㄚ ㄋㄚˋ ㄉㄜˊ', 'Bānàdé'),
        annotated('星系', 'ㄒㄧㄥ ㄒㄧˋ', 'xīngxì'),
        annotated('傳來', 'ㄔㄨㄢˊ ㄌㄞˊ', 'chuánlái'),
        annotated('捷報', 'ㄐㄧㄝˊ ㄅㄠˋ', 'jiébào'), bare('；'),
        annotated('一百年', 'ㄧˋ ㄅㄞˇ ㄋㄧㄢˊ', 'yìbǎi nián'),
        annotated('後', 'ㄏㄡˋ', 'hòu'), bare('，'),
        annotated('他們', 'ㄊㄚ ㄇㄣ˙', 'tāmen'),
        annotated('將', 'ㄐㄧㄤ', 'jiāng'),
        annotated('為', 'ㄨㄟˋ', 'wèi'),
        annotated('地球', 'ㄉㄧˋ ㄑㄧㄡˊ', 'Dìqiú'),
        annotated('與', 'ㄩˇ', 'yǔ'),
        annotated('太陽系', 'ㄊㄞˋ ㄧㄤˊ ㄒㄧˋ', 'Tàiyángxì'),
        annotated('帶回', 'ㄉㄞˋ ㄏㄨㄟˊ', 'dàihuí'),
        annotated('十', 'ㄕˊ', 'shí', 'cargo'),
        annotated('垓', 'ㄍㄞ', 'gāi', 'cargo'),
        annotated('噸', 'ㄉㄨㄣˋ', 'dūn', 'cargo'),
        annotated('稀有', 'ㄒㄧ ㄧㄡˇ', 'xīyǒu'),
        annotated('元素', 'ㄩㄢˊ ㄙㄨˋ', 'yuánsù'), bare('，'),
        directional(
          annotated('如右', 'ㄖㄨˊ ㄧㄡˋ', 'rú yòu'),
          annotated('如左', 'ㄖㄨˊ ㄗㄨㄛˇ', 'rú zuǒ'),
        ), bare('：'),
      ],
      [
        annotated('這', 'ㄓㄜˋ', 'zhè'),
        annotated('批', 'ㄆㄧ', 'pī'),
        annotated('材料', 'ㄘㄞˊ ㄌㄧㄠˋ', 'cáiliào'),
        annotated('將', 'ㄐㄧㄤ', 'jiāng'),
        annotated('讓', 'ㄖㄤˋ', 'ràng'),
        annotated('電磁阱', 'ㄉㄧㄢˋ ㄘˊ ㄐㄧㄥˇ', 'diàncíjǐng'),
        annotated('超導', 'ㄔㄠ ㄉㄠˇ', 'chāodǎo'),
        annotated('磁噴嘴', 'ㄘˊ ㄆㄣ ㄗㄨㄟˇ', 'cípēnzuǐ'),
        annotated('熱盾', 'ㄖㄜˋ ㄉㄨㄣˋ', 'rèdùn'),
        annotated('與', 'ㄩˇ', 'yǔ'),
        annotated('探測器', 'ㄊㄢˋ ㄘㄜˋ ㄑㄧˋ', 'tàncèqì'),
        annotated('有', 'ㄧㄡˇ', 'yǒu'),
        annotated('機會', 'ㄐㄧ ㄏㄨㄟˋ', 'jīhuì'),
        annotated('從', 'ㄘㄨㄥˊ', 'cóng'),
        annotated('圖紙', 'ㄊㄨˊ ㄓˇ', 'túzhǐ'),
        annotated('走入', 'ㄗㄡˇ ㄖㄨˋ', 'zǒurù'),
        annotated('深空', 'ㄕㄣ ㄎㄨㄥ', 'shēnkōng'),
        annotated('船塢', 'ㄔㄨㄢˊ ㄨˋ', 'chuánwù'), bare('。'),
      ],
    ],
    note: '十垓噸約等於地球質量的六分之一；星際公報的會計部門拒絕為這個數字背書。',
  },
  japanese: {
    name: '日文', lang: 'ja-JP', listLang: 'ja', nativeLang: 'ja-Kana', romanLang: 'ja-Latn',
    roman: false, groupLabel: '日文讀全篇',
    headlineSpeech: 'バーナード星採鉱団、任務成功。超伝導磁気ノズル実現へ。',
    paragraphs: [
      [
        annotated('半世紀', 'はんせいき', ''),
        annotated('前', 'まえ', ''), bare('に'),
        annotated('出航', 'しゅっこう', ''), bare('したばかりの'),
        bare('ヒマラヤ'),
        annotated('惑星間', 'わくせいかん', ''),
        annotated('採鉱', 'さいこう', ''),
        annotated('軍団', 'ぐんだん', ''),
        annotated('一六八七', 'イチロクハチシチ', 'ichi-roku-hachi-shichi', 'id'),
        annotated('師団', 'しだん', ''),
        annotated('第十', 'だいジフ', '', 'id'),
        annotated('艦', 'かん', ''), bare('から、バーナード'),
        annotated('星系', 'せいけい', ''), bare('での'),
        annotated('成功', 'せいこう', ''),
        annotated('報告', 'ほうこく', ''), bare('が'),
        annotated('届', 'とど', ''), bare('いた。'),
        annotated('百年', 'ひゃくねん', ''),
        annotated('後', 'ご', ''), bare('、'),
        annotated('地球', 'ちきゅう', ''), bare('と'),
        annotated('太陽系', 'たいようけい', ''), bare('へ'),
        annotated('十', 'ジフ', '', 'cargo'),
        annotated('垓', 'ガイ', '', 'cargo'), bare('トンの'),
        annotated('希少', 'きしょう', ''),
        annotated('元素', 'げんそ', ''), bare('を'),
        annotated('持', 'も', ''), bare('ち'),
        annotated('帰', 'かえ', ''), bare('る。'),
        directional(
          annotated('右', 'みぎ', ''),
          annotated('左', 'ひだり', ''),
        ), bare('のとおり：'),
      ],
      [
        bare('これらの'), annotated('材料', 'ざいりょう', ''), bare('は'),
        annotated('電磁', 'でんじ', ''), bare('トラップ、'),
        annotated('超伝導', 'ちょうでんどう', ''),
        annotated('磁気', 'じき', ''), bare('ノズル、'),
        annotated('熱', 'ねつ', ''),
        annotated('遮蔽', 'しゃへい', ''), bare('と'),
        annotated('検出器', 'けんしゅつき', ''), bare('を'),
        annotated('設計図', 'せっけいず', ''), bare('から'),
        annotated('深宇宙', 'しんうちゅう', ''), bare('の'),
        annotated('造船所', 'ぞうせんじょ', ''), bare('へ'),
        annotated('運', 'はこ', ''), bare('ぶ。'),
      ],
    ],
    note: '十垓トンは地球質量のおよそ六分の一。星間広報の会計部は、この数字への署名を拒否した。',
  },
  korean: {
    name: '韓文', lang: 'ko-KR', listLang: 'ko', nativeLang: 'ko-Hani', romanLang: 'ko-Latn',
    groupLabel: '韓文讀全篇',
    headlineSpeech: '바너드성 채광단 임무 성공. 초전도 자기 노즐 실현 눈앞.',
    paragraphs: [
      [
        annotated('반세기', '半世紀', 'bansegi'), bare(' '),
        annotated('전', '前', 'jeon'), bare('에 막 '),
        annotated('출항', '出航', 'chulhang'), bare('한 '),
        annotated('히말라야', '喜馬拉雅', 'Himallaya'), bare(' '),
        annotated('행성간', '行星間', 'haengseonggan'), bare(' '),
        annotated('채광', '採鑛', 'chaegwang'), bare(' '),
        annotated('군단', '軍團', 'gundan'), bare(' '),
        annotated('일육팔칠', '一六八七', 'il-yuk-pal-chil', 'id'), bare(' '),
        annotated('사단', '師團', 'sadan'), bare(' '),
        annotated('제십', '第十', 'jesip', 'id'), bare(' '),
        annotated('함정', '艦艇', 'hamjeong'), bare('이 바너드 '),
        annotated('항성계', '恒星系', 'hangseonggye'), bare('에서 '),
        annotated('승전보', '勝戰報', 'seungjeonbo'), bare('를 보내왔다. '),
        annotated('백년', '百年', 'baengnyeon'), bare(' '),
        annotated('후', '後', 'hu'), bare(', '),
        annotated('지구', '地球', 'jigu'), bare('와 '),
        annotated('태양계', '太陽系', 'taeyanggye'), bare('로 '),
        annotated('십', '十', 'sip', 'cargo'), bare(' '),
        annotated('해', '垓', 'hae', 'cargo'), bare(' 톤의 '),
        annotated('희귀', '稀貴', 'higwi'), bare(' '),
        annotated('원소', '元素', 'wonso'), bare('를 가져올 '),
        annotated('예정', '豫定', 'yejeong'), bare('이다. '),
        directional(
          bare('오른쪽과 같다'),
          bare('왼쪽과 같다'),
        ), bare(': '),
      ],
      [
        bare('이 '), annotated('재료', '材料', 'jaeryo'), bare('들은 '),
        annotated('전자기', '電磁', 'jeonjagi'), bare(' 트랩, '),
        annotated('초전도', '超傳導', 'chojeondo'), bare(' '),
        annotated('자기', '磁氣', 'jagi'), bare(' 노즐, '),
        annotated('열', '熱', 'yeol'), bare(' '),
        annotated('차폐', '遮蔽', 'chapye'), bare('와 '),
        annotated('검출기', '檢出器', 'geomchulgi'), bare('를 '),
        annotated('설계도', '設計圖', 'seolgyedo'), bare('에서 '),
        annotated('심우주', '深宇宙', 'simuju'), bare(' '),
        annotated('조선소', '造船所', 'joseonso'), bare('로 옮길 것이다.'),
      ],
    ],
    note: '십 해 톤은 지구 질량의 약 6분의 1이다. 성간 홍보부 회계팀은 이 숫자에 서명하기를 거부했다.',
  },
}

const PUNCTUATION = /[\p{P}\p{S}]/u

const createDispatchRuby = (system, { base, native, roman, emphasis }) => {
  if (PUNCTUATION.test(base)) throw new TypeError(`注文基文不可含標點：${base}`)
  const outer = document.createElement('ruby')
  const baseUnits = [...base]
  const nativeUnits = native.trim().split(/\s+/)
  const isBopomofo = system.nativeLang.includes('Bopo')

  if (isBopomofo && selectedValue('annotation-position') === 'over') {
    const inner = document.createElement('ruby')
    inner.className = 'zhuyin'
    const nativeReading = document.createElement('rt')
    nativeReading.lang = system.nativeLang
    nativeReading.textContent = native
    inner.append(base, nativeReading)
    outer.append(inner)
  } else if (isBopomofo && baseUnits.length === nativeUnits.length) {
    baseUnits.forEach((character, index) => {
      const inner = document.createElement('ruby')
      inner.className = 'zhuyin'
      const nativeReading = document.createElement('rt')
      nativeReading.lang = system.nativeLang
      nativeReading.textContent = nativeUnits[index]
      inner.append(character, nativeReading)
      outer.append(inner)
    })
  } else {
    const inner = document.createElement('ruby')
    const nativeReading = document.createElement('rt')
    nativeReading.lang = system.nativeLang
    nativeReading.textContent = native
    inner.append(base, nativeReading)
    outer.append(inner)
  }

  if (system.roman === false) {
    const inner = outer.firstElementChild
    if (!emphasis) return inner
    const wrapper = document.createElement('em')
    wrapper.dataset.emphasis = emphasis
    wrapper.append(inner)
    return wrapper
  }

  if (system.roman !== false) {
    const romanization = document.createElement('rt')
    romanization.lang = system.romanLang
    romanization.textContent = roman
    outer.append(romanization)
  }
  if (!emphasis) return outer
  const wrapper = document.createElement('em')
  wrapper.dataset.emphasis = emphasis
  wrapper.append(outer)
  return wrapper
}

const fillParagraph = (element, system, parts) => {
  element.replaceChildren()
  for (const part of parts) {
    const resolved = part.directional?.[selectedValue('writing-mode')] ?? part
    element.append(resolved.text ? document.createTextNode(resolved.text) : createDispatchRuby(system, resolved))
  }
}

const material = (atomic, symbol, hant, hans, category, system, aboard) => ({
  atomic, symbol, hant, hans, category, system, aboard,
})

const missionElements = [
  material(2, 'He', '氦', '氦', 'noble', '低溫', '超流體低溫磁籠'),
  material(4, 'Be', '鈹', '铍', 'alkaline', '囚籠', '正電子離子協同冷卻陣列'),
  material(5, 'B', '硼', '硼', 'metalloid', '屏蔽', '中子吸收複合屏蔽'),
  material(21, 'Sc', '鈧', '钪', 'transition', '骨架', '鋁鈧外骨骼承力桁架'),
  material(23, 'V', '釩', '钒', 'transition', '骨架', '輕質高強艦體合金'),
  material(37, 'Rb', '銣', '铷', 'alkali', '時計', '長航程原子鐘'),
  material(40, 'Zr', '鋯', '锆', 'transition', '骨架', '超高真空耐熱艙壁'),
  material(41, 'Nb', '鈮', '铌', 'transition', '囚籠', '超導磁囚籠主線圈'),
  material(42, 'Mo', '鉬', '钼', 'transition', '熱膽', '抗熱循環噴嘴骨架'),
  material(44, 'Ru', '釕', '钌', 'transition', '電極', '耐磨電極與催化循環'),
  material(49, 'In', '銦', '铟', 'post-transition', '接點', '極低溫真空密封與量子接點'),
  material(51, 'Sb', '銻', '锑', 'metalloid', '感測', '紅外與高能粒子感測層'),
  material(55, 'Cs', '銫', '铯', 'alkali', '時計', '全艦主時間基準'),
  material(72, 'Hf', '鉿', '铪', 'transition', '熱膽', '超高溫陶瓷熱障'),
  material(74, 'W', '鎢', '钨', 'transition', '熱盾', '湮滅熱盾與噴嘴喉襯'),
  material(75, 'Re', '錸', '铼', 'transition', '噴嘴', '超高溫噴嘴合金'),
  material(76, 'Os', '鋨', '锇', 'transition', '機件', '超硬耐磨微機電軸承'),
  material(77, 'Ir', '銥', '铱', 'transition', '接點', '極端高溫耐蝕接點'),
  material(59, 'Pr', '鐠', '镨', 'lanthanide', '姿控', '永久磁致動器'),
  material(60, 'Nd', '釹', '钕', 'lanthanide', '姿控', '高磁能積姿控轉子'),
  material(64, 'Gd', '釓', '钆', 'lanthanide', '感測', '中子俘獲輻射陣列'),
  material(66, 'Dy', '鏑', '镝', 'lanthanide', '姿控', '耐熱永磁穩場摻質'),
  material(70, 'Yb', '鐿', '镱', 'lanthanide', '光鐘', '飛秒光纖診斷與光鐘'),
  material(71, 'Lu', '鎦', '镥', 'lanthanide', '感測', '高能輻射閃爍晶體'),
]

const elementMandarinReadings = new Map([
  ['Be', ['ㄆㄧˊ', 'pí']], ['He', ['ㄏㄞˋ', 'hài']], ['Nb', ['ㄋㄧˊ', 'ní']], ['Sc', ['ㄎㄤˋ', 'kàng']], ['In', ['ㄧㄣ', 'yīn']],
  ['Pr', ['ㄆㄨˇ', 'pǔ']], ['Nd', ['ㄋㄩˇ', 'nǚ']], ['Dy', ['ㄉㄧ', 'dī']], ['Rb', ['ㄖㄨˊ', 'rú']], ['Cs', ['ㄙㄜˋ', 'sè']],
  ['W', ['ㄨ', 'wū']], ['Mo', ['ㄇㄨˋ', 'mù']], ['Re', ['ㄌㄞˊ', 'lái']], ['Hf', ['ㄏㄚ', 'hā']],
  ['B', ['ㄆㄥˊ', 'péng']], ['Gd', ['ㄍㄚˊ', 'gá']], ['Sb', ['ㄊㄧˋ', 'tì']], ['Yb', ['ㄧˋ', 'yì']], ['Lu', ['ㄌㄧㄡˊ', 'liú']],
  ['Zr', ['ㄍㄠˋ', 'gào']], ['V', ['ㄈㄢˊ', 'fán']], ['Ir', ['ㄧ', 'yī']], ['Os', ['ㄜˊ', 'é']], ['Ru', ['ㄌㄧㄠˇ', 'liǎo']],
])

const elementMinnanReadings = new Map([
  ['He', ['ㄏㄞ˫', 'hāi']], ['Be', ['ㄆㄧˊ', 'phî']], ['B', ['ㄆㄧㄥˊ', 'phîng']], ['Sc', ['ㄎㆲ˪', 'khòng']],
  ['V', ['ㄏㄨㄢˊ', 'huân']], ['Rb', ['ㆡㄨˊ', 'jû']], ['Zr', ['ㄍㄜ˪', 'kò']], ['Nb', ['ㄋㄧˊ', 'nî']],
  ['Mo', ['ㆠㆦㆻ̇', 'bo̍k']], ['Ru', ['ㄌㄧㄠˋ', 'liáu']], ['In', ['ㄧㄣ', 'in']], ['Sb', ['ㄉㆤ˫', 'tē']],
  ['Cs', ['ㄒㄧㆻ', 'sik']], ['Hf', ['ㄏㄚㆴ', 'hap']], ['W', ['ㄜ', 'oo']], ['Re', ['ㄌㄞˊ', 'lâi']],
  ['Os', ['ㆣㄜˊ', 'gô']], ['Ir', ['ㄧ', 'i']], ['Pr', ['ㄆㄜˋ', 'phóo']], ['Nd', ['ㄌㄨˊ', 'lú']],
  ['Gd', ['ㄍㄚㆵ', 'kat']], ['Dy', ['ㄉㄧㆻ', 'tik']], ['Yb', ['ㄧ˪', 'ì']], ['Lu', ['ㄌㄧㄨˊ', 'liû']],
])

const elementJapaneseReadings = new Map([
  ['He', 'ヘリウム'], ['Be', 'ベリリウム'], ['B', '硼素／ホウ素'], ['Sc', 'スカンジウム'], ['V', 'バナジウム'], ['Rb', 'ルビジウム'],
  ['Zr', 'ジルコニウム'], ['Nb', 'ニオブ'], ['Mo', 'モリブデン'], ['Ru', 'ルテニウム'], ['In', 'インジウム'], ['Sb', 'アンチモン'],
  ['Cs', 'セシウム'], ['Hf', 'ハフニウム'], ['W', 'タングステン'], ['Re', 'レニウム'], ['Os', 'オスミウム'], ['Ir', 'イリジウム'],
  ['Pr', 'プラセオジム'], ['Nd', 'ネオジム'], ['Gd', 'ガドリニウム'], ['Dy', 'ジスプロシウム'], ['Yb', 'イッテルビウム'], ['Lu', 'ルテチウム'],
])

const elementKoreanReadings = new Map([
  ['He', '헬륨'], ['Be', '베릴륨'], ['B', '硼素／붕소'], ['Sc', '스칸듐'], ['V', '바나듐'], ['Rb', '루비듐'],
  ['Zr', '지르코늄'], ['Nb', '나이오븀'], ['Mo', '몰리브데넘'], ['Ru', '루테늄'], ['In', '인듐'], ['Sb', '안티모니'],
  ['Cs', '세슘'], ['Hf', '하프늄'], ['W', '重石／텅스텐'], ['Re', '레늄'], ['Os', '오스뮴'], ['Ir', '이리듐'],
  ['Pr', '프라세오디뮴'], ['Nd', '네오디뮴'], ['Gd', '가돌리늄'], ['Dy', '디스프로슘'], ['Yb', '이터븀'], ['Lu', '루테튬'],
])

const phoneticBases = new WeakMap()

const renderLocalizedChrome = (mode) => {
  $$('[data-language]', $station).forEach((element) => {
    element.hidden = element.dataset.language !== mode
  })
}

const renderPhoneticLabels = () => {
  $$('ruby[data-zhuyin]', $station).forEach((label) => {
    const base = phoneticBases.get(label) ?? label.textContent
    phoneticBases.set(label, base)
    const characters = [...base]
    const readings = label.dataset.zhuyin.split(' ')
    const annotationLang = label.closest('[lang]')?.lang.startsWith('nan')
      ? 'nan-Bopo-TW'
      : 'zh-Bopo-TW'

    if (selectedValue('annotation-position') === 'over') {
      const rt = document.createElement('rt')
      rt.lang = annotationLang
      rt.textContent = label.dataset.zhuyin
      label.className = 'zhuyin'
      label.replaceChildren(base, rt)
      return
    }

    label.removeAttribute('class')
    label.replaceChildren(...characters.map((character, index) => {
      const ruby = document.createElement('ruby')
      ruby.className = 'zhuyin'
      const rt = document.createElement('rt')
      rt.lang = annotationLang
      rt.textContent = readings[index]
      ruby.append(character, rt)
      return ruby
    }))
  })
}

const createElementAnnotation = (lang, text, child) => {
  const annotation = document.createElement('rt')
  annotation.lang = lang
  annotation.append(child ?? text)
  return annotation
}

const createElementRuby = (element) => {
  const ruby = document.createElement('ruby')
  const phonetic = document.createElement('ruby')
  const minnan = elementMinnanReadings.get(element.symbol)
  const mandarin = elementMandarinReadings.get(element.symbol)
  const symbol = document.createElement('abbr')
  const atomic = document.createElement('data')
  symbol.setAttribute('aria-label', `元素符號${element.symbol}`)
  symbol.textContent = element.symbol
  atomic.value = element.atomic
  atomic.textContent = element.atomic

  phonetic.className = 'zhuyin'
  phonetic.append(
    element.hant,
    createElementAnnotation('nan-Bopo-TW', minnan[0]),
    createElementAnnotation('zh-Bopo-TW', mandarin[0]),
  )

  ruby.append(
    phonetic,
    createElementAnnotation('ja', elementJapaneseReadings.get(element.symbol)),
    createElementAnnotation('ko', elementKoreanReadings.get(element.symbol)),
    createElementAnnotation('en', '', symbol),
    createElementAnnotation('en', '', atomic),
  )
  return ruby
}

const elementSpeech = (element, mode) => {
  if (mode === 'minnan') {
    const reading = elementMinnanReadings.get(element.symbol)
    return { lang: 'nan-TW', speech: element.hant, reading: reading[1], language: '閩南語' }
  }
  if (mode === 'japanese') {
    const speech = elementJapaneseReadings.get(element.symbol).split('／')[0]
    return { lang: 'ja-JP', speech, reading: speech, language: '日文' }
  }
  if (mode === 'korean') {
    const speech = elementKoreanReadings.get(element.symbol).split('／')[0]
    return { lang: 'ko-KR', speech, reading: speech, language: '韓文' }
  }
  const reading = elementMandarinReadings.get(element.symbol)
  return { lang: 'zh-TW', speech: element.hant, reading: reading[1], language: '國語' }
}

const renderElementSpeechMode = (mode) => {
  const speeches = []
  $$('button[name="speak-element"]', $station).forEach((tile) => {
    const element = missionElements.find(({ symbol }) => symbol === tile.value)
    const localized = elementSpeech(element, mode)
    tile.dataset.lang = localized.lang
    tile.dataset.speech = localized.speech
    tile.dataset.reading = localized.reading
    tile.setAttribute('aria-label', `播放${element.atomic}號元素${element.hant}的${localized.language}讀音：${localized.reading}；${element.system}用途：${element.aboard}`)
    speeches.push(localized.speech)
  })
  $elementsGroup.dataset.lang = readingSystems[mode].lang
  $elementsGroup.dataset.speech = speeches.join('、')
}

const renderMaterialGrid = () => {
  const $grid = $('.Rail > figure > ol', $station)
  $grid.replaceChildren(...missionElements.map((element) => {
    const reading = elementMandarinReadings.get(element.symbol)
    const item = document.createElement('li')
    item.dataset.category = element.category
    item.dataset.hans = element.hans
    const tile = document.createElement('button')
    tile.append(createElementRuby(element))
    tile.title = `${element.atomic}號元素・${element.hant}／${element.hans}・${element.system}：${element.aboard}`

    tile.type = 'button'
    tile.name = 'speak-element'
    tile.value = element.symbol
    tile.dataset.lang = 'zh-TW'
    tile.dataset.speech = element.hant
    tile.dataset.reading = reading[1]
    tile.setAttribute('aria-label', `播放${element.atomic}號元素${element.hant}，${reading[1]}，的國語讀音；${element.system}用途：${element.aboard}`)

    const hint = document.createElement('small')
    const system = document.createElement('b')
    system.textContent = element.system
    hint.append(system, element.aboard)
    tile.append(hint)
    item.append(tile)
    return item
  }))
}

let voices = []
let $activeButton = null
let activeUtterance = null
let currentMode = 'minnan'

const voiceLanguage = (voice) => voice.lang.toLowerCase().replaceAll('_', '-')

const matchingVoice = (lang) => {
  const target = lang.toLowerCase()
  if (target.startsWith('nan')) {
    const namePattern = /hokkien|min[ -]?nan|閩南/i
    return voices.find((voice) => voiceLanguage(voice).startsWith('nan'))
      ?? voices.find((voice) => namePattern.test(voice.name))
      ?? null
  }

  const direct = voices.find((voice) => voiceLanguage(voice) === target)
    ?? voices.find((voice) => voiceLanguage(voice).startsWith(target.split('-')[0]))
  if (direct || !target.startsWith('zh')) return direct ?? null
  return voices.find((voice) => voiceLanguage(voice).startsWith('zh-tw'))
    ?? voices.find((voice) => voiceLanguage(voice).startsWith('zh'))
    ?? null
}

const refreshVoices = () => {
  voices = synth?.getVoices() ?? []
  if (!synth) {
    $$('button:is([name="speak"], [name="speak-element"])').forEach((button) => { button.disabled = true })
  }
}

const renderReadingSystem = (mode) => {
  const system = readingSystems[mode]
  if (!system) return
  currentMode = mode
  renderLocalizedChrome(mode)
  $dispatch.lang = system.listLang
  $numbersGroup.textContent = system.groupLabel
  $numbersGroup.dataset.lang = system.lang
  renderElementSpeechMode(mode)
  fillParagraph($('p:first-of-type', $dispatch), system, system.paragraphs[0])
  fillParagraph($('p:nth-of-type(2)', $dispatch), system, system.paragraphs[1])
  $('small', $dispatch).textContent = system.note
  const dispatchSpeech = system.paragraphs
    .flat()
    .map((part) => {
      const resolved = part.directional?.[selectedValue('writing-mode')] ?? part
      return resolved.base ?? resolved.text
    })
    .join('')
  $numbersGroup.dataset.speech = `${system.headlineSpeech}${dispatchSpeech}`
  refreshVoices()
}

const setWritingMode = () => {
  const $rail = $('.Rail', $station)
  $rail.scrollLeft = 0
  $rail.scrollTop = 0
  renderReadingSystem(currentMode)
  requestAnimationFrame(() => $rail.dispatchEvent(new Event('han-rail-layout')))
}

const setAnnotationPosition = () => {
  renderPhoneticLabels()
  renderReadingSystem(currentMode)
}

const setFontSize = () => {
  const value = Number($fontSize.value)
  $station.style.setProperty('--font-size-handle', `${value}px`)
  $fontSizeOutput.value = `${value}px`
}

const clearActive = () => {
  $activeButton?.removeAttribute('aria-busy')
  $activeButton = null
  activeUtterance = null
}

const speak = (button) => {
  if (!synth) return
  refreshVoices()
  const lang = button.dataset.lang
  const voice = matchingVoice(lang)
  synth.cancel()
  clearActive()
  const utterance = new SpeechSynthesisUtterance(button.dataset.speech)
  utterance.lang = lang
  utterance.rate = lang.startsWith('nan') ? .78 : .82
  if (voice) utterance.voice = voice
  $activeButton = button
  activeUtterance = utterance
  button.setAttribute('aria-busy', 'true')

  utterance.addEventListener('end', () => {
    if (activeUtterance !== utterance) return
    clearActive()
    refreshVoices()
  })
  utterance.addEventListener('error', (event) => {
    if (activeUtterance !== utterance || ['canceled', 'interrupted'].includes(event.error)) return
    clearActive()
  })
  synth.speak(utterance)
}

renderPhoneticLabels()
renderMaterialGrid()
renderReadingSystem(currentMode)

$$('button:is([name="speak"], [name="speak-element"])').forEach((button) => {
  button.addEventListener('click', () => speak(button))
})

$$('[name="reading-mode"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked) renderReadingSystem(input.value)
  })
})

$$('[name="writing-mode"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked) setWritingMode()
  })
})

$$('[name="annotation-position"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked) setAnnotationPosition()
  })
})

$fontSize.addEventListener('input', setFontSize)
setFontSize()

initRailNav()
if (synth) synth.addEventListener('voiceschanged', refreshVoices)
refreshVoices()
window.addEventListener('pagehide', () => synth?.cancel())
