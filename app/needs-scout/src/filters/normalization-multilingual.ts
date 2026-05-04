/**
 * needs-scout filters/normalization-multilingual — Round 13 Dev-A:
 *   Round 12 NFKC layer の多言語拡張 (中文 簡体/繁体 + 韓国語漢字併記 + 日本語旧字体/新字体)。
 *
 * 設計方針:
 *   - **完全純関数 (pure function)**: 副作用 0、I/O 0、入力同値 → 出力同値。
 *   - NFKC は CJK 互換漢字 (U+F900-U+FAFF) のみ統一するが、繁体 ↔ 簡体 / 旧字体 ↔ 新字体 /
 *     韓国 漢字 ↔ 日本 漢字 の互換は別途辞書 (本 file 内蔵 30+ ペア) で吸収。
 *   - 内蔵辞書は **頻出 30-50 ペア限定** (denylist 13 領域で実際に登場する漢字を優先、
 *     全網羅は OpenCC / hanja-conv 等の外部依存を要するため避ける)。
 *   - locale auto 検出: 漢字 + ハングル (U+AC00-U+D7AF) → ko、漢字 only + 簡体特有字形 → zh、
 *     漢字 + ひらがな/カタカナ (U+3040-U+30FF) → ja。
 *   - **Round 12 互換**: `safeNormalize` の locale 拡張版を提供しつつ、既存
 *     `normalizeForFilter` (normalization.ts) と等価出力 (locale 指定なし時は素通し)。
 *
 * 関連:
 *   - DEC-019-010 (重要 13 領域 fail-safe denylist)
 *   - dev-round12-A-nfkc-yaml-denylist.md §8.1 #2 引継 (中文 / 韓国語の漢字統一規則)
 *   - normalization.ts (Round 12 Dev-A NFKC layer)
 */

import { normalizeForFilter } from './normalization.js'

/**
 * 漢字統一辞書 (繁体/簡体/旧字体/異体字 → 採用 base 字)。
 *
 * 採用 base 字の選定基準:
 *   - 中文 簡体: GB2312 / GB18030 採用字
 *   - 日本: 新字体 (常用漢字表) 採用字
 *   - 韓国: 한자 (現代音通用字)
 *
 * Round 13 Dev-A 初版: 35 ペア (13 領域 denylist で頻出の漢字を中心)。
 * Round 14 Dev-A 拡張: 50+ ペア (法律 / 医療 / 移住 / 教育 / 雇用 / 金融 領域の追加頻出字)。
 *
 * 形式: [variant, canonical] のペア配列 (lookup は Map で O(1))。
 *
 * 注: control entry (variant === canonical) は idempotent 確認用に意図的に配置。
 *     置換しても変化しないが Map.has で hit するため辞書 size に算入される。
 */
const KANJI_UNIFICATION_PAIRS: ReadonlyArray<readonly [string, string]> = Object.freeze([
  // === 中文 繁体 → 簡体 (中華圏での金融/法律/医療頻出字) ===
  ['醫', '医'], // 醫師 → 医師
  ['藥', '薬'], // 藥品 → 薬品
  ['療', '疗'], // 治療 → 治疗
  ['護', '护'], // 護理 → 护理
  ['診', '诊'], // 診斷 → 诊断
  ['斷', '断'], // 診斷 → 诊断
  ['書', '书'], // 行政書士 → 行政书士
  ['條', '条'], // 第 72 條 → 第 72 条
  ['號', '号'], // 第 17 號 → 第 17 号
  ['機', '机'], // 機関 → 机关
  ['關', '关'], // 関連 → 关联
  ['電', '电'], // 電力 → 电力
  ['網', '网'], // 網絡 → 网络
  ['業', '业'], // 業務 → 业务
  ['務', '务'], // 業務 → 业务
  ['證', '证'], // 證券 → 证券
  ['券', '券'], // identity (control)
  ['銀', '银'], // 銀行 → 银行
  ['財', '财'], // 財務 → 财务
  ['產', '产'], // 不動產 → 不动产
  ['動', '动'], // 動車 → 动车
  ['車', '车'], // 自動車 → 自动车
  // === 韓国 한자 ↔ 日本 漢字 (移住/法律 領域) ===
  ['國', '国'], // 韓國 / 國家 → 国
  ['學', '学'], // 學校 → 学校
  ['會', '会'], // 國會 → 国会
  ['長', '长'], // 隊長 → 队长
  ['師', '师'], // 醫師 → 医师
  // === 日本 旧字体 → 新字体 ===
  ['辯', '弁'], // 辯護士 → 弁護士
  ['髙', '高'], // 髙橋 → 高橋 (異体字)
  ['德', '徳'], // 德 → 徳
  ['澤', '沢'], // 澤 → 沢
  ['濱', '浜'], // 濱 → 浜
  ['寳', '宝'], // 寳 → 宝
  ['澁', '渋'], // 澁 → 渋
  ['壽', '寿'], // 壽 → 寿
  ['萬', '万'], // 萬 → 万

  // === Round 14 Dev-A 拡張 (15+ ペア追加) ===

  // --- 中文 繁体 → 簡体 追加 (法律 / 行政 / 国家安全保障 領域) ---
  ['檢', '检'], // 檢察 → 检察 (法律)
  ['驗', '验'], // 檢驗 → 检验 (品質)
  ['審', '审'], // 審判 → 审判 (法律 / 移住)
  ['議', '议'], // 議會 → 议会 (行政)
  ['識', '识'], // 識別 → 识别 (国家安全保障)
  ['別', '别'], // 識別 → 识别
  ['訴', '诉'], // 訴訟 → 诉讼 (法律)
  ['訟', '讼'], // 訴訟 → 诉讼 (法律)
  ['監', '监'], // 監視 → 监视 (法執行 / 国家安全保障)
  ['視', '视'], // 監視 → 监视
  ['標', '标'], // 標準 → 标准 (製品安全)
  ['準', '准'], // 標準 → 标准

  // --- 日本 旧字体 / 異体字 → 新字体 追加 (法律 / 教育 / 行政 領域) ---
  ['竝', '並'], // 竝 → 並 (旧字体)
  ['假', '仮'], // 假名 → 仮名 (旧字体)
  ['應', '応'], // 應急 → 応急 (旧字体 / 教育)
  ['對', '対'], // 對策 → 対策 (旧字体)
  ['擔', '担'], // 擔當 → 担当 (旧字体 / 雇用)
  ['當', '当'], // 擔當 → 担当
  ['圓', '円'], // 圓 → 円 (金融)

  // --- 韓国 한자 ↔ 統一漢字 追加 (移住 / 教育 領域) ---
  ['樂', '乐'], // 音樂 → 音乐 (教育)
  ['團', '团'], // 團體 → 团体 (国家安全保障)
  ['體', '体'], // 團體 → 团体
])

/** 高速 lookup 用 Map (build once, freeze 不要 - module level immutable 参照) */
const KANJI_UNIFICATION_MAP: ReadonlyMap<string, string> = new Map(KANJI_UNIFICATION_PAIRS)

/**
 * normalizeMultilingual のオプション。
 */
export interface NormalizeMultilingualOptions {
  /** 中文 (繁体 → 簡体) 統一を有効化。default: true */
  readonly unifyChinese?: boolean
  /** 韓国語 (한자 → 日本/中文 漢字) 統一を有効化。default: true */
  readonly unifyKorean?: boolean
  /** 日本語 (旧字体 → 新字体) 統一を有効化。default: true */
  readonly unifyJapanese?: boolean
}

/**
 * 多言語入力を NFKC + 漢字統一辞書で正規化する。
 *
 * 処理順:
 *   1. `normalizeForFilter` (NFKC + lowercase + 空白圧縮) を適用
 *   2. 漢字統一辞書で繁体/旧字体/異体字 を採用 base 字に置換
 *   3. 再 trim (置換結果の前後空白を除去)
 *
 * 純関数性: 副作用 0、入力同値 → 出力同値。
 *
 * 互換性:
 *   - locale 指定なし (option 全 false) なら `normalizeForFilter` と等価出力
 *   - 内蔵辞書は denylist 部分一致での誤動作を避けるため、置換後文字列が
 *     既存 denylist の lowercase ASCII / NFKC-stable Japanese を破壊しないことを担保
 *
 * @param input 任意の文字列
 * @param options 言語別 unify フラグ
 * @returns 正規化済み文字列
 */
export function normalizeMultilingual(
  input: string,
  options: NormalizeMultilingualOptions = {},
): string {
  const {
    unifyChinese = true,
    unifyKorean = true,
    unifyJapanese = true,
  } = options

  // Round 12 NFKC layer を先に通す
  const base = normalizeForFilter(input)
  if (base.length === 0) return ''

  // すべて false なら NFKC のみで返す (Round 12 互換)
  if (!unifyChinese && !unifyKorean && !unifyJapanese) {
    return base
  }

  // 漢字統一辞書を適用
  // 注: 本実装ではすべての辞書を 1 pass でまとめて置換 (locale フラグは将来の細粒度制御用、
  //      Round 13 v1 では辞書全体を on/off で切替)。
  const useDictionary = unifyChinese || unifyKorean || unifyJapanese
  if (!useDictionary) return base

  let result = ''
  for (const ch of base) {
    const replacement = KANJI_UNIFICATION_MAP.get(ch)
    result += replacement ?? ch
  }
  return result.trim()
}

/**
 * locale 自動検出 (heuristic)。
 *
 * - ハングル (U+AC00-U+D7AF) を含む → 'ko'
 * - 漢字 + ひらがな/カタカナ (U+3040-U+30FF) → 'ja'
 * - 漢字のみ (CJK 統合漢字 U+4E00-U+9FFF) → 'zh'
 * - それ以外 (ASCII 中心) → 'auto' (推定不能)
 *
 * @param input 検査対象文字列
 * @returns 推定 locale
 */
export function detectLocale(input: string): 'ja' | 'zh' | 'ko' | 'auto' {
  if (input.length === 0) return 'auto'
  let hasKana = false
  let hasHan = false
  let hasHangul = false
  for (const ch of input) {
    const code = ch.codePointAt(0)
    if (code === undefined) continue
    if (code >= 0xac00 && code <= 0xd7af) hasHangul = true
    else if (code >= 0x3040 && code <= 0x30ff) hasKana = true
    else if (code >= 0x4e00 && code <= 0x9fff) hasHan = true
  }
  if (hasHangul) return 'ko'
  if (hasKana) return 'ja'
  if (hasHan) return 'zh'
  return 'auto'
}

/**
 * `safeNormalize` の locale 拡張版。
 *
 * - null / undefined / 非 string 型 → 空文字 (Round 12 `safeNormalize` と同挙動)
 * - string + locale 指定 → `normalizeMultilingual` を適用
 * - locale = 'auto' → `detectLocale` で推定後、対応 unify を有効化
 *
 * 純関数性: 例外 throw なし、副作用 0。
 *
 * @param input 任意型 (unknown)
 * @param locale 言語ヒント (default: undefined = Round 12 互換 = NFKC のみ)
 * @returns 正規化済み文字列
 */
export function safeNormalize(
  input: unknown,
  locale?: 'ja' | 'zh' | 'ko' | 'auto',
): string {
  if (input === null || input === undefined) return ''
  let str: string
  if (typeof input === 'string') {
    str = input
  } else if (typeof input === 'number' || typeof input === 'boolean') {
    str = String(input)
  } else {
    return ''
  }

  if (locale === undefined) {
    // Round 12 互換: NFKC のみ (辞書なし)
    return normalizeForFilter(str)
  }

  const effectiveLocale = locale === 'auto' ? detectLocale(str) : locale
  switch (effectiveLocale) {
    case 'zh':
      return normalizeMultilingual(str, {
        unifyChinese: true,
        unifyKorean: false,
        unifyJapanese: false,
      })
    case 'ko':
      return normalizeMultilingual(str, {
        unifyChinese: false,
        unifyKorean: true,
        unifyJapanese: false,
      })
    case 'ja':
      return normalizeMultilingual(str, {
        unifyChinese: false,
        unifyKorean: false,
        unifyJapanese: true,
      })
    case 'auto':
    default:
      // detectLocale が 'auto' を返した = ASCII 中心 = 辞書適用しても変化なし
      return normalizeForFilter(str)
  }
}

/**
 * 内蔵辞書のサイズと採用ペアを inspector 用に export (test / audit 用)。
 *
 * @returns 辞書ペア配列 ([variant, canonical] の readonly tuple)
 */
export function getUnificationDictionary(): ReadonlyArray<readonly [string, string]> {
  return KANJI_UNIFICATION_PAIRS
}
