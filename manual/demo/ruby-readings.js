const initStripNav = () => {
  document.querySelectorAll('[data-strip-nav]').forEach((nav) => {
    const rail = document.querySelector(`[data-strip="${nav.dataset.stripNav}"]`)
    const previous = nav.querySelector('[data-scroll="prev"]')
    const next = nav.querySelector('[data-scroll="next"]')
    if (!rail || !previous || !next) return

    const sync = () => {
      const way = getComputedStyle(rail).direction === 'rtl' ? -1 : 1
      const position = rail.scrollLeft * way
      const end = rail.scrollWidth - rail.clientWidth - 1
      previous.disabled = position <= 0
      next.disabled = position >= end
      nav.hidden = previous.disabled && next.disabled
    }
    const move = (sign) => {
      const way = getComputedStyle(rail).direction === 'rtl' ? -1 : 1
      rail.scrollBy({ left: sign * way * rail.clientWidth / 3, behavior: 'smooth' })
    }

    previous.addEventListener('click', () => move(-1))
    next.addEventListener('click', () => move(1))
    rail.addEventListener('scroll', sync, { passive: true })
    rail.addEventListener('han-strip-layout', sync)
    new ResizeObserver(sync).observe(rail)
    sync()
  })
}

const synth = window.speechSynthesis
const station = document.querySelector('[data-station="readings"]')
const dispatch = document.querySelector('.Dispatch')
const numbersGroup = document.querySelector('[data-speak-group="numbers"]')
const groupLabel = document.querySelector('[data-speak-group-label]')
const readingKicker = document.querySelector('[data-reading-kicker]')
const storyTitle = document.querySelector('#story-title')
const modeSummary = document.querySelector('[data-mode-summary]')
const storyFoot = document.querySelector('.StoryFoot')
const statusBar = document.querySelector('.SpeechStatus')
const status = document.querySelector('[data-speech-status]')

const annotated = (base, native, roman, emphasis) => ({ base, native, roman, emphasis })
const bare = (text) => ({ text })
const directional = (horizontal, vertical) => ({ directional: { horizontal, vertical } })

const readingSystems = {
  minnan: {
    name: '閩南語', lang: 'nan-TW', listLang: 'nan-Hant-TW', nativeLang: 'nan-Bopo-TW', romanLang: 'nan-Latn-TW',
    summary: '方音・臺羅字間注', kicker: '閩南語・雙重ruby', title: ['球際採礦軍團', '喜馬拉雅一六八七師第十艦隻'], groupLabel: '讀全篇捷報',
    paragraphs: [
      [
        annotated('半世紀前', 'ㄅㄨㆩ˫ ㄙㆤ˪ ㄍㄧˋ ㄗㄧㄥˊ', 'puànn sè-kí tsîng'),
        annotated('拄仔出航的', 'ㄉㄨˋ ㄚˋ ㄘㄨㆵ ㄏㄤˊ ㆤˊ', 'tú-á tshut-hâng ê'),
        annotated('球際採礦軍團', 'ㄍㄧㄨˊ ㄗㆤ˪ ㄘㄞˋ ㄎㆲ˪ ㄍㄨㄣ ㄊㄨㄢˊ', 'kiû-tsè tshái-khòng kun-thuân'),
        annotated('喜馬拉雅', 'ㄏㄧˋ ㄇㄚˋ ㄌㄚㆷ̇ ㆣㄚˋ', 'Hí-má-la̍h-ngá'),
        annotated('一六八七', 'ㄧㆵ ㄌㄧㆦㆶ̇ ㄅㆤㆷ ㄑㄧㆵ', 'it-lio̍k-peh-tshit', 'id'),
        annotated('師第', 'ㄙㄨ ㄉㆤ˫', 'su tē'),
        annotated('十', 'ㄒㄧㆴ̇', 'si̍p', 'id'),
        annotated('艦隻', 'ㄌㄚㆬ˫ ㄗㄧㄚㆷ', 'lām-tsiah'), bare('，'),
        annotated('佇巴納德星系傳來捷報', 'ㄉㄧ˫ ㄅㄚ ㄋㄚㆴ̇ ㄉㄧㆶ̇ ㄑㆥ ㄏㆤ˫ ㄊㄨㄢˊ ㄌㄞˊ ㄗㄧㄚㆵ̇ ㄅㄜ˪', 'tī Pa-na̍p-tik tshenn-hē thuân-lâi tsia̍t-pò'), bare('；'),
        annotated('閣過百冬', 'ㄍㆦㆷ ㄍㄨㆤ˪ ㄅㄚㆷ ㄉㄤ', 'koh kuè pah tang'), bare('，'),
        annotated('欲替地球佮太陽系載轉來', 'ㄅㆤㆷ ㄊㆤ˪ ㄉㆤ˫ ㄍㄧㄨˊ ㄍㄚㆷ ㄊㄞ˪ ㄧㆲˊ ㄏㆤ˫ ㄗㄞ˪ ㄉㄫˋ ㄌㄞˊ', 'beh thè tē-kiû kah thài-iông-hē tsài tńg-lâi'),
        annotated('十垓噸', 'ㄗㄚㆴ̇ ㄍㄞ ㄉㆲ˪', 'tsa̍p kai tòng', 'cargo'),
        annotated('的稀有元素', 'ㆤˊ ㄏㄧ ㄧㄨ˫ ㄍㄨㄢˊ ㄙㆦ˪', 'ê hi-iú guân-sòo'), bare('，'),
        directional(
          annotated('如右', 'ㆡㄨˊ ㄧㄨ˫', 'jû-iū'),
          annotated('如左', 'ㆡㄨˊ ㄗㄜˋ', 'jû-tsó'),
        ), bare('：'),
      ],
      [
        annotated('這批材料會予地球佮太陽系有機會', 'ㄐㄧㆵ ㄆㄨㆤ ㄗㄞˊ ㄌㄧㄠ˫ ㆤ˫ ㄏㆦ˫ ㄉㆤ˫ ㄍㄧㄨˊ ㄍㄚㆷ ㄊㄞ˪ ㄧㆲˊ ㄏㆤ˫ ㄨ˫ ㄍㄧ ㄏㄨㆤ˫', 'tsit phue tsâi-liāu ē hōo tē-kiû kah thài-iông-hē ū ki-huē'),
        annotated('共電磁囚籠超導磁喉熱盾佮偵測器', 'ㄍㄚ˫ ㄉㄧㄢ˫ ㄗㄨˊ ㄑㄧㄨˊ ㄌㆲˊ ㄑㄧㄠ ㄉㄜ˫ ㄗㄨˊ ㄠˊ ㄖㄨㄚㆵ̇ ㄉㄨㄣ˫ ㄍㄚㆷ ㄐㄧㄥ ㄑㄧㆶ ㄎㄧ˪', 'kā tiān-tsû tshiû-lông tshiau-tō tsû-âu jua̍t-tūn kah tsing-tshik-khì'), bare('，'),
        annotated('對圖紙搬入深空船塢', 'ㄉㄨㄧ˪ ㄉㆦˊ ㄗㄨㄚˋ ㄅㄨㄢ ㄖㄧㆴ̇ ㄑㄧㆬ ㄎㆲ ㄗㄨㄣˊ ㄜ', 'tuì tôo-tsuá puann-ji̍p tshim-khong tsûn-oo'), bare('。'),
      ],
    ],
    note: '十垓噸約是一個地球質量的六分之一；球際公報的會計部門拒絕對這个數字負責。',
  },
  mandarin: {
    name: '國語', lang: 'zh-TW', listLang: 'zh-Hant-TW', nativeLang: 'zh-Bopo-TW', romanLang: 'zh-Latn-pinyin',
    summary: '注音・拼音字間注', kicker: '國語・雙重ruby', title: ['球際採礦軍團', '喜馬拉雅一六八七師第十艦隻'], groupLabel: '國語讀全篇',
    paragraphs: [
      [
        annotated('半世紀前甫出航的', 'ㄅㄢˋ ㄕˋ ㄐㄧˋ ㄑㄧㄢˊ ㄈㄨˇ ㄔㄨ ㄏㄤˊ ˙ㄉㄜ', 'bàn shìjì qián fǔ chūháng de'),
        annotated('球際採礦軍團', 'ㄑㄧㄡˊ ㄐㄧˋ ㄘㄞˇ ㄎㄨㄤˋ ㄐㄩㄣ ㄊㄨㄢˊ', 'qiújì cǎikuàng jūntuán'),
        annotated('喜馬拉雅', 'ㄒㄧˇ ㄇㄚˇ ㄌㄚ ㄧㄚˇ', 'Xǐmǎlāyǎ'),
        annotated('一六八七', 'ㄧ ㄌㄧㄡˋ ㄅㄚ ㄑㄧ', 'yī-liù-bā-qī', 'id'),
        annotated('師第', 'ㄕ ㄉㄧˋ', 'shī dì'),
        annotated('十', 'ㄕˊ', 'shí', 'id'),
        annotated('艦隻', 'ㄐㄧㄢˋ ㄓ', 'jiànzhī'), bare('，'),
        annotated('從巴納德星系傳來捷報', 'ㄘㄨㄥˊ ㄅㄚ ㄋㄚˋ ㄉㄜˊ ㄒㄧㄥ ㄒㄧˋ ㄔㄨㄢˊ ㄌㄞˊ ㄐㄧㄝˊ ㄅㄠˋ', 'cóng Bānàdé xīngxì chuánlái jiébào'), bare('；'),
        annotated('一百年後', 'ㄧˋ ㄅㄞˇ ㄋㄧㄢˊ ㄏㄡˋ', 'yìbǎi nián hòu'), bare('，'),
        annotated('他們將為地球與太陽系帶回', 'ㄊㄚ ㄇㄣ˙ ㄐㄧㄤ ㄨㄟˋ ㄉㄧˋ ㄑㄧㄡˊ ㄩˇ ㄊㄞˋ ㄧㄤˊ ㄒㄧˋ ㄉㄞˋ ㄏㄨㄟˊ', 'tāmen jiāng wèi Dìqiú yǔ Tàiyángxì dàihuí'),
        annotated('十垓噸', 'ㄕˊ ㄍㄞ ㄉㄨㄣˋ', 'shí gāi dūn', 'cargo'),
        annotated('稀有元素', 'ㄒㄧ ㄧㄡˇ ㄩㄢˊ ㄙㄨˋ', 'xīyǒu yuánsù'), bare('，'),
        directional(
          annotated('如右', 'ㄖㄨˊ ㄧㄡˋ', 'rú yòu'),
          annotated('如左', 'ㄖㄨˊ ㄗㄨㄛˇ', 'rú zuǒ'),
        ), bare('：'),
      ],
      [
        annotated('這批材料將讓電磁阱超導磁噴嘴熱盾與探測器', 'ㄓㄜˋ ㄆㄧ ㄘㄞˊ ㄌㄧㄠˋ ㄐㄧㄤ ㄖㄤˋ ㄉㄧㄢˋ ㄘˊ ㄐㄧㄥˇ ㄔㄠ ㄉㄠˇ ㄘˊ ㄆㄣ ㄗㄨㄟˇ ㄖㄜˋ ㄉㄨㄣˋ ㄩˇ ㄊㄢˋ ㄘㄜˋ ㄑㄧˋ', 'zhè pī cáiliào jiāng ràng diàncíjǐng chāodǎo cípēnzuǐ rèdùn yǔ tàncèqì'),
        annotated('有機會從圖紙走入深空船塢', 'ㄧㄡˇ ㄐㄧ ㄏㄨㄟˋ ㄘㄨㄥˊ ㄊㄨˊ ㄓˇ ㄗㄡˇ ㄖㄨˋ ㄕㄣ ㄎㄨㄥ ㄔㄨㄢˊ ㄨˋ', 'yǒu jīhuì cóng túzhǐ zǒurù shēnkōng chuánwù'), bare('。'),
      ],
    ],
    note: '十垓噸約等於地球質量的六分之一；星際公報的會計部門拒絕為這個數字背書。',
  },
  japanese: {
    name: '日文', lang: 'ja-JP', listLang: 'ja', nativeLang: 'ja-Kana', romanLang: 'ja-Latn',
    summary: '假名・Hepburn字間注', kicker: '日文・雙重ruby', title: ['惑星間採鉱軍団', 'ヒマラヤ一六八七師団第十艦'], groupLabel: '日文讀全篇',
    paragraphs: [
      [
        annotated('半世紀前に', 'はんせいきまえに', 'hanseiki mae ni'),
        annotated('出航したばかりの', 'しゅっこうしたばかりの', 'shukkō shita bakari no'),
        annotated('惑星間採鉱軍団', 'わくせいかんさいこうぐんだん', 'wakuseikan saikō gundan'),
        annotated('ヒマラヤ', 'ひまらや', 'Himaraya'),
        annotated('一六八七', 'イチロクハチシチ', 'ichi-roku-hachi-shichi', 'id'),
        annotated('師団第', 'しだんだい', 'shidan dai'),
        annotated('十', 'ジフ', 'jifu', 'id'),
        annotated('艦', 'かん', 'kan'), bare('から、'),
        annotated('バーナード星系での', 'ばーなーどせいけいでの', 'Bānādo seikei de no'),
        annotated('成功報告が届いた', 'せいこうほうこくがとどいた', 'seikō hōkoku ga todoita'), bare('。'),
        annotated('百年後', 'ひゃくねんご', 'hyakunen go'), bare('、'),
        annotated('地球と太陽系へ', 'ちきゅうとたいようけいへ', 'Chikyū to Taiyōkei e'),
        annotated('十垓トン', 'ジフガイトン', 'jifu-gai ton', 'cargo'),
        annotated('の希少元素を持ち帰る', 'のきしょうげんそをもちかえる', 'no kishō genso o mochikaeru'), bare('。'),
        directional(
          annotated('右のとおり', 'みぎのとおり', 'migi no tōri'),
          annotated('左のとおり', 'ひだりのとおり', 'hidari no tōri'),
        ), bare('：'),
      ],
      [
        annotated('これらの材料は', 'これらのざいりょうは', 'Korera no zairyō wa'),
        annotated('電磁トラップ', 'でんじとらっぷ', 'denji torappu'),
        annotated('超伝導磁気ノズル', 'ちょうでんどうじきのずる', 'chōdendō jiki nozuru'),
        annotated('熱遮蔽と検出器を', 'ねつしゃへいとけんしゅつきを', 'netsu shahei to kenshutsuki o'),
        annotated('設計図から', 'せっけいずから', 'sekkeizu kara'),
        annotated('深宇宙の造船所へ', 'しんうちゅうのぞうせんじょへ', 'shin-uchū no zōsenjo e'),
        annotated('運ぶ', 'はこぶ', 'hakobu'), bare('。'),
      ],
    ],
    note: '十垓トンは地球質量のおよそ六分の一。星間広報の会計部は、この数字への署名を拒否した。',
  },
  korean: {
    name: '韓文', lang: 'ko-KR', listLang: 'ko', nativeLang: 'ko-Hani', romanLang: 'ko-Latn',
    summary: '韓字・修訂式字間注', kicker: '韓文・雙重ruby', title: ['행성간 채광 군단', '히말라야 일육팔칠 사단 제십 함정'], groupLabel: '韓文讀全篇',
    paragraphs: [
      [
        annotated('반세기 전에', '半世紀前', 'bansegi jeone'), bare(' '),
        annotated('막 출항한 행성간 채광 군단', '甫 出航 行星間 採鑛 軍團', 'mak chulhanghan haengseonggan chaegwang gundan'), bare(' '),
        annotated('히말라야', '喜馬拉雅', 'Himallaya'), bare(' '),
        annotated('일육팔칠', '一六八七', 'il-yuk-pal-chil', 'id'), bare(' '),
        annotated('사단 제', '師團 第', 'sadan je'),
        annotated('십', '十', 'sip', 'id'), bare(' '),
        annotated('함정', '艦艇', 'hamjeong'), bare('이 '),
        annotated('바너드 항성계에서', 'Barnard 恒星系', 'Baneodeu hangseonggyeeseo'), bare(' '),
        annotated('승전보를 보내왔다', '勝戰報', 'seungjeonboreul bonaewatda'), bare('. '),
        annotated('백 년 뒤', '百年後', 'baeng nyeon dwi'), bare(', '),
        annotated('지구와 태양계로', '地球 太陽系', 'jiguwa taeyanggye-ro'), bare(' '),
        annotated('십 해 톤', '十垓', 'sip hae ton', 'cargo'),
        annotated('의 희귀 원소를', '稀貴元素', 'ui higwi wonsoreul'), bare(' '),
        annotated('가져올 예정이다', '持歸 豫定', 'gajyeool yejeongida'), bare('. '),
        directional(
          annotated('오른쪽과 같다', '右側同', 'oreunjjokgwa gatda'),
          annotated('왼쪽과 같다', '左側同', 'oenjjokgwa gatda'),
        ), bare(': '),
      ],
      [
        annotated('이 재료들은', '材料', 'i jaeryodeureun'), bare(' '),
        annotated('전자기 트랩', '電磁阱', 'jeonjagi teuraep'), bare(' '),
        annotated('초전도 자기 노즐', '超傳導 磁氣噴口', 'chojeondo jagi nojeul'), bare(' '),
        annotated('열 차폐와 검출기를', '熱遮蔽 檢出器', 'yeol chapyewa geomchulgireul'), bare(' '),
        annotated('설계도에서', '設計圖', 'seolgyedoeseo'), bare(' '),
        annotated('심우주 조선소로', '深宇宙 造船所', 'simuju joseonsoro'), bare(' '),
        annotated('옮길 것이다', '移送', 'omgigil geosida'), bare('.'),
      ],
    ],
    note: '십 해 톤은 지구 질량의 약 6분의 1이다. 성간 홍보부 회계팀은 이 숫자에 서명하기를 거부했다.',
  },
}

const PUNCTUATION = /[\p{P}\p{S}]/u

const createDispatchRuby = (system, { base, native, roman, emphasis }) => {
  if (PUNCTUATION.test(base)) throw new TypeError(`注文基文不可含標點：${base}`)
  const outer = document.createElement('ruby')
  outer.className = 'DispatchRuby ComplexReading'
  if (emphasis) outer.dataset.emphasis = emphasis
  const baseUnits = [...base]
  const nativeUnits = native.trim().split(/\s+/)
  const isBopomofo = system.nativeLang.includes('Bopo')

  if (isBopomofo && baseUnits.length === nativeUnits.length) {
    baseUnits.forEach((character, index) => {
      const inner = document.createElement('ruby')
      inner.className = 'InterCharacterReading zhuyin'
      const nativeReading = document.createElement('rt')
      nativeReading.lang = system.nativeLang
      nativeReading.textContent = nativeUnits[index]
      inner.append(character, nativeReading)
      outer.append(inner)
    })
  } else {
    const inner = document.createElement('ruby')
    inner.className = 'GroupReading'
    const nativeReading = document.createElement('rt')
    nativeReading.lang = system.nativeLang
    nativeReading.textContent = native
    inner.append(base, nativeReading)
    outer.append(inner)
  }

  const romanization = document.createElement('rt')
  romanization.className = 'Romanization'
  romanization.lang = system.romanLang
  romanization.textContent = roman
  outer.append(romanization)
  return outer
}

const fillParagraph = (element, system, parts) => {
  element.replaceChildren()
  for (const part of parts) {
    const resolved = part.directional?.[station.dataset.writing] ?? part
    element.append(resolved.text ? document.createTextNode(resolved.text) : createDispatchRuby(system, resolved))
  }
}

const material = (atomic, symbol, hant, hans, category, column, row, system, aboard) => ({
  atomic, symbol, hant, hans, category, column, row, system, aboard,
})

const missionElements = [
  material(2, 'He', '氦', '氦', 'noble', 18, 1, '低溫', '超流體低溫磁籠'),
  material(4, 'Be', '鈹', '铍', 'alkaline', 2, 2, '囚籠', '正電子離子協同冷卻陣列'),
  material(5, 'B', '硼', '硼', 'metalloid', 13, 2, '屏蔽', '中子吸收複合屏蔽'),
  material(21, 'Sc', '鈧', '钪', 'transition', 3, 4, '骨架', '鋁鈧外骨骼承力桁架'),
  material(23, 'V', '釩', '钒', 'transition', 5, 4, '骨架', '輕質高強艦體合金'),
  material(37, 'Rb', '銣', '铷', 'alkali', 1, 5, '時計', '長航程原子鐘'),
  material(40, 'Zr', '鋯', '锆', 'transition', 4, 5, '骨架', '超高真空耐熱艙壁'),
  material(41, 'Nb', '鈮', '铌', 'transition', 5, 5, '囚籠', '超導磁囚籠主線圈'),
  material(42, 'Mo', '鉬', '钼', 'transition', 6, 5, '熱膽', '抗熱循環噴嘴骨架'),
  material(44, 'Ru', '釕', '钌', 'transition', 8, 5, '電極', '耐磨電極與催化循環'),
  material(49, 'In', '銦', '铟', 'post-transition', 13, 5, '接點', '極低溫真空密封與量子接點'),
  material(51, 'Sb', '銻', '锑', 'metalloid', 15, 5, '感測', '紅外與高能粒子感測層'),
  material(55, 'Cs', '銫', '铯', 'alkali', 1, 6, '時計', '全艦主時間基準'),
  material(72, 'Hf', '鉿', '铪', 'transition', 4, 6, '熱膽', '超高溫陶瓷熱障'),
  material(74, 'W', '鎢', '钨', 'transition', 6, 6, '熱盾', '湮滅熱盾與噴嘴喉襯'),
  material(75, 'Re', '錸', '铼', 'transition', 7, 6, '噴嘴', '超高溫噴嘴合金'),
  material(76, 'Os', '鋨', '锇', 'transition', 8, 6, '機件', '超硬耐磨微機電軸承'),
  material(77, 'Ir', '銥', '铱', 'transition', 9, 6, '接點', '極端高溫耐蝕接點'),
  material(59, 'Pr', '鐠', '镨', 'lanthanide', 6, 8, '姿控', '永久磁致動器'),
  material(60, 'Nd', '釹', '钕', 'lanthanide', 7, 8, '姿控', '高磁能積姿控轉子'),
  material(64, 'Gd', '釓', '钆', 'lanthanide', 11, 8, '感測', '中子俘獲輻射陣列'),
  material(66, 'Dy', '鏑', '镝', 'lanthanide', 13, 8, '姿控', '耐熱永磁穩場摻質'),
  material(70, 'Yb', '鐿', '镱', 'lanthanide', 17, 8, '光鐘', '飛秒光纖診斷與光鐘'),
  material(71, 'Lu', '鎦', '镥', 'lanthanide', 18, 8, '感測', '高能輻射閃爍晶體'),
]

const elementReadings = new Map([
  ['Be', ['ㄆㄧˊ', 'pí']], ['He', ['ㄏㄞˋ', 'hài']], ['Nb', ['ㄋㄧˊ', 'ní']], ['Sc', ['ㄎㄤˋ', 'kàng']], ['In', ['ㄧㄣ', 'yīn']],
  ['Pr', ['ㄆㄨˇ', 'pǔ']], ['Nd', ['ㄋㄩˇ', 'nǚ']], ['Dy', ['ㄉㄧ', 'dī']], ['Rb', ['ㄖㄨˊ', 'rú']], ['Cs', ['ㄙㄜˋ', 'sè']],
  ['W', ['ㄨ', 'wū']], ['Mo', ['ㄇㄨˋ', 'mù']], ['Re', ['ㄌㄞˊ', 'lái']], ['Hf', ['ㄏㄚ', 'hā']],
  ['B', ['ㄆㄥˊ', 'péng']], ['Gd', ['ㄍㄚˊ', 'gá']], ['Sb', ['ㄊㄧˋ', 'tì']], ['Yb', ['ㄧˋ', 'yì']], ['Lu', ['ㄌㄧㄡˊ', 'liú']],
  ['Zr', ['ㄍㄠˋ', 'gào']], ['V', ['ㄈㄢˊ', 'fán']], ['Ir', ['ㄧ', 'yī']], ['Os', ['ㄜˊ', 'é']], ['Ru', ['ㄌㄧㄠˇ', 'liǎo']],
])

const spokenElementSymbols = new Set(['Mo', 'Sb', 'V', 'Be', 'Rb', 'Cs', 'Zr', 'Hf', 'Re', 'Ir', 'Os', 'Pr', 'Nd', 'Dy', 'Yb', 'Lu'])

const verticalVolumes = [
  { row: 1, column: 1, label: '第一週期' },
  { row: 2, column: 2, label: '第二週期' },
  { row: 4, column: 3, label: '第四週期' },
  { row: 5, column: 4, label: '第五週期' },
  { row: 6, column: 5, label: '第六週期' },
  { row: 8, column: 6, label: '鑭系別卷' },
]

const createElementRuby = (element, reading) => {
  const atomicRuby = document.createElement('ruby')
  atomicRuby.className = 'AtomicRuby'
  const elementRuby = document.createElement('ruby')
  elementRuby.className = 'ElementRuby'

  if (reading) {
    const zhuyin = document.createElement('ruby')
    zhuyin.className = 'zhuyin'
    const phonetic = document.createElement('rt')
    phonetic.textContent = reading[0]
    zhuyin.append(element.hant, phonetic)
    elementRuby.append(zhuyin)
  } else {
    elementRuby.append(element.hant)
  }

  const symbol = document.createElement('rt')
  symbol.className = 'Symbol'
  symbol.lang = 'en'
  symbol.textContent = element.symbol
  elementRuby.append(symbol)

  const atomicNumber = document.createElement('rt')
  atomicNumber.className = 'AtomicNumber'
  atomicNumber.textContent = element.atomic
  atomicRuby.append(elementRuby, atomicNumber)
  return atomicRuby
}

const renderMaterialGrid = () => {
  const grid = document.querySelector('[data-material-grid]')
  const callout = document.createElement('li')
  callout.className = 'MaterialCallout'
  callout.setAttribute('aria-hidden', 'true')
  const count = document.createElement('strong')
  count.textContent = '24 / 118'
  const joke = document.createElement('span')
  joke.textContent = '其餘九十四種未獲軍團登艦許可'
  callout.append(count, joke)

  const lanthanideLabel = document.createElement('li')
  lanthanideLabel.className = 'LanthanideLabel'
  lanthanideLabel.setAttribute('aria-hidden', 'true')
  lanthanideLabel.textContent = '姿控與感測／鑭系'

  const periodLabels = verticalVolumes.map((volume) => {
    const label = document.createElement('li')
    label.className = 'PeriodLabel'
    label.setAttribute('aria-hidden', 'true')
    label.style.setProperty('--vertical-column', volume.column)
    label.textContent = volume.label
    return label
  })
  grid.replaceChildren(callout, lanthanideLabel, ...periodLabels)

  const verticalIndexes = new Map()

  for (const element of missionElements) {
    const reading = elementReadings.get(element.symbol)
    const speakable = spokenElementSymbols.has(element.symbol)
    const item = document.createElement('li')
    item.className = 'ElementCell'
    item.dataset.category = element.category
    item.dataset.hans = element.hans
    item.dataset.hintBlock = element.row >= 6 ? 'before' : 'after'
    item.dataset.hintInline = element.column >= 15 ? 'end' : 'start'
    item.dataset.group = element.row === 8 ? '鑭' : `${element.column}族`
    item.style.setProperty('--element-column', element.column)
    item.style.setProperty('--element-row', element.row)
    const volume = verticalVolumes.find((candidate) => candidate.row === element.row)
    const verticalIndex = (verticalIndexes.get(element.row) ?? 0) + 1
    verticalIndexes.set(element.row, verticalIndex)
    item.style.setProperty('--vertical-column', volume.column)
    item.style.setProperty('--vertical-grid-row', verticalIndex + 1)
    if (speakable) item.dataset.featured = ''

    const tile = document.createElement(speakable ? 'button' : 'span')
    tile.className = 'ElementTile'
    tile.append(createElementRuby(element, reading))
    tile.title = `${element.atomic}號元素・${element.hant}／${element.hans}・${element.system}：${element.aboard}`

    if (speakable) {
      tile.type = 'button'
      tile.dataset.speak = ''
      tile.dataset.lang = 'zh-TW'
      tile.dataset.speech = element.hant
      tile.dataset.reading = reading[1]
      tile.setAttribute('aria-label', `播放${element.atomic}號元素${element.hant}，${reading[1]}，的國語讀音；${element.system}用途：${element.aboard}`)
      const icon = document.createElement('span')
      icon.dataset.icon = 'volume'
      icon.setAttribute('aria-hidden', 'true')
      tile.append(icon)
    } else {
      tile.tabIndex = 0
      tile.setAttribute('aria-label', `${element.atomic}號元素${element.hant}；${element.system}用途：${element.aboard}`)
    }

    const hint = document.createElement('small')
    hint.className = 'MaterialHint'
    const system = document.createElement('b')
    system.textContent = element.system
    hint.append(system, element.aboard)
    const groupMark = document.createElement('span')
    groupMark.className = 'GroupMark'
    groupMark.setAttribute('aria-hidden', 'true')
    groupMark.textContent = item.dataset.group
    tile.append(groupMark, hint)
    item.append(tile)
    grid.append(item)
  }
}

let voices = []
let activeButton = null
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

const setStatus = (message, state = 'ready', floating = false) => {
  status.textContent = message
  statusBar.toggleAttribute('data-ready', state === 'ready')
  statusBar.toggleAttribute('data-error', state === 'error')
  statusBar.toggleAttribute('data-floating', floating)
}

const refreshVoices = () => {
  voices = synth?.getVoices() ?? []
  if (!synth) {
    document.querySelectorAll('[data-speak], [data-speak-group]').forEach((button) => { button.disabled = true })
    setStatus('這個瀏覽器不支援 SpeechSynthesis。', 'error')
    return
  }

  const system = readingSystems[currentMode]
  const voice = matchingVoice(system.lang)
  setStatus(voice
    ? `${system.name}：${voice.name}`
    : system.lang === 'nan-TW'
      ? '閩南語：未安裝相符語音；注文切換仍可使用'
      : `${system.name}：使用系統預設語音`)
}

const renderReadingSystem = (mode) => {
  const system = readingSystems[mode]
  if (!system) return
  currentMode = mode
  station.dataset.readingMode = mode
  dispatch.lang = system.listLang
  modeSummary.textContent = system.summary
  readingKicker.textContent = system.kicker
  storyTitle.replaceChildren(system.title[0], document.createElement('br'), system.title[1])
  groupLabel.textContent = system.groupLabel
  numbersGroup.dataset.lang = system.lang
  fillParagraph(document.querySelector('[data-dispatch-copy]'), system, system.paragraphs[0])
  fillParagraph(document.querySelector('.DispatchPromise'), system, system.paragraphs[1])
  document.querySelector('.Dispatch > small').textContent = system.note
  numbersGroup.dataset.speech = system.paragraphs
    .flat()
    .map((part) => {
      const resolved = part.directional?.[station.dataset.writing] ?? part
      return resolved.base ?? resolved.text
    })
    .join('')
  storyFoot.hidden = mode !== 'minnan'
  refreshVoices()
}

const setWritingMode = (mode) => {
  const vertical = mode === 'vertical'
  station.dataset.writing = vertical ? 'vertical' : 'horizontal'
  station.style.setProperty('--han-writing-mode', vertical ? 'vertical-rl' : 'horizontal-tb')
  const rail = document.querySelector('[data-strip="readings"]')
  rail.scrollLeft = 0
  rail.scrollTop = 0
  renderReadingSystem(currentMode)
  requestAnimationFrame(() => rail.dispatchEvent(new Event('han-strip-layout')))
}

const clearActive = () => {
  activeButton?.removeAttribute('data-speaking')
  activeButton = null
  activeUtterance = null
}

const speak = (button) => {
  if (!synth) return
  refreshVoices()
  const lang = button.dataset.lang
  const voice = matchingVoice(lang)
  synth.cancel()
  if (lang.startsWith('nan') && !voice) {
    clearActive()
    setStatus('找不到閩南語語音；請先在作業系統安裝閩南語語音。', 'error', true)
    return
  }

  clearActive()
  const utterance = new SpeechSynthesisUtterance(button.dataset.speech)
  utterance.lang = lang
  utterance.rate = lang.startsWith('nan') ? .78 : .82
  if (voice) utterance.voice = voice
  activeButton = button
  activeUtterance = utterance
  button.setAttribute('data-speaking', '')

  utterance.addEventListener('start', () => {
    if (activeUtterance !== utterance) return
    const reading = button.dataset.reading ? `・${button.dataset.reading}` : ''
    setStatus(`正在播放：${button.dataset.speech}${reading}・${voice?.name ?? '系統預設語音'}`, 'ready', true)
  })
  utterance.addEventListener('end', () => {
    if (activeUtterance !== utterance) return
    clearActive()
    refreshVoices()
  })
  utterance.addEventListener('error', (event) => {
    if (activeUtterance !== utterance || ['canceled', 'interrupted'].includes(event.error)) return
    clearActive()
    setStatus(`語音播放失敗：${event.error}`, 'error', true)
  })
  synth.speak(utterance)
}

renderMaterialGrid()
renderReadingSystem(currentMode)

document.querySelectorAll('[data-speak], [data-speak-group]').forEach((button) => {
  button.addEventListener('click', () => speak(button))
})

document.querySelectorAll('[name="reading-mode"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked) renderReadingSystem(input.value)
  })
})

document.querySelectorAll('[name="writing-mode"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked) setWritingMode(input.value)
  })
})

initStripNav()
if (synth) synth.addEventListener('voiceschanged', refreshVoices)
refreshVoices()
window.addEventListener('pagehide', () => synth?.cancel())
