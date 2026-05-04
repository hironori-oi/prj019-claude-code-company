/**
 * normalization-multilingual.test — Round 13 Dev-A:
 *   normalization-multilingual.ts (中文 / 韓国語 / 日本語 漢字統一辞書 + locale 検出 + safe coerce)
 *   の機能テスト 24 件。
 *
 * カバー:
 *   1. normalizeMultilingual — 中文 5 / 韓国語 5 / 日本語 5 = 15 cases
 *   2. detectLocale — 4 cases
 *   3. safeNormalize (locale 拡張) — 5 cases
 */
import { describe, it, expect } from 'vitest'

import {
  normalizeMultilingual,
  detectLocale,
  safeNormalize,
  getUnificationDictionary,
} from '../normalization-multilingual.js'

describe('normalization-multilingual (Round 13 Dev-A)', () => {
  // ----------------- normalizeMultilingual: 中文 (繁体 → 簡体) -----------------
  describe('normalizeMultilingual / Chinese (繁体 → 簡体)', () => {
    it('1.1. 醫 → 医', () => {
      expect(normalizeMultilingual('醫療')).toBe('医疗')
    })

    it('1.2. 護理 → 护理', () => {
      expect(normalizeMultilingual('護理')).toBe('护理')
    })

    it('1.3. 銀行 → 银行', () => {
      expect(normalizeMultilingual('銀行')).toBe('银行')
    })

    it('1.4. 業務 → 业务', () => {
      expect(normalizeMultilingual('業務')).toBe('业务')
    })

    it('1.5. 全 unify フラグ false なら NFKC のみで原文維持 (辞書 bypass)', () => {
      const result = normalizeMultilingual('醫療', {
        unifyChinese: false,
        unifyKorean: false,
        unifyJapanese: false,
      })
      // 辞書全 off → NFKC のみ → 醫療 はそのまま
      expect(result).toBe('醫療')
    })
  })

  // ----------------- normalizeMultilingual: 韓国語 (漢字併記) -----------------
  describe('normalizeMultilingual / Korean (한자 → 統一字)', () => {
    it('2.1. 國 → 国 (한국 韓国 → 韩国 / 日本 国)', () => {
      expect(normalizeMultilingual('國家')).toBe('国家')
    })

    it('2.2. 學校 → 学校', () => {
      expect(normalizeMultilingual('學校')).toBe('学校')
    })

    it('2.3. 國會 → 国会', () => {
      expect(normalizeMultilingual('國會')).toBe('国会')
    })

    it('2.4. 醫師 → 医师 (韓国漢字併記想定)', () => {
      expect(normalizeMultilingual('醫師')).toBe('医师')
    })

    it('2.5. ハングル混在は素通し (辞書非対応)', () => {
      expect(normalizeMultilingual('한국 國家')).toBe('한국 国家')
    })
  })

  // ----------------- normalizeMultilingual: 日本語 (旧字体 → 新字体) -----------------
  describe('normalizeMultilingual / Japanese (旧字体 → 新字体)', () => {
    it('3.1. 辯護士 → 弁護士 (旧字体)', () => {
      expect(normalizeMultilingual('辯護士')).toBe('弁护士')
    })

    it('3.2. 萬円 → 万円', () => {
      expect(normalizeMultilingual('萬円')).toBe('万円')
    })

    it('3.3. NFKC + 漢字統一の連動 (全角英数字 + 旧字体)', () => {
      expect(normalizeMultilingual('ＡＢ辯護士')).toBe('ab弁护士')
    })

    it('3.4. 既存 ASCII denylist 文字列は不変 (idempotent)', () => {
      expect(normalizeMultilingual('legal advice')).toBe('legal advice')
    })

    it('3.5. 空文字 → 空文字', () => {
      expect(normalizeMultilingual('')).toBe('')
    })
  })

  // ----------------- detectLocale -----------------
  describe('detectLocale', () => {
    it('4.1. ハングル含む → ko', () => {
      expect(detectLocale('한국어 테스트')).toBe('ko')
    })

    it('4.2. ひらがな/カタカナ含む → ja', () => {
      expect(detectLocale('医師法あい カタカナ 17 条')).toBe('ja')
    })

    it('4.3. 漢字のみ → zh', () => {
      expect(detectLocale('醫療診斷')).toBe('zh')
    })

    it('4.4. ASCII のみ → auto', () => {
      expect(detectLocale('hello world')).toBe('auto')
    })

    it('4.5. 空文字 → auto', () => {
      expect(detectLocale('')).toBe('auto')
    })
  })

  // ----------------- safeNormalize (locale 拡張) -----------------
  describe('safeNormalize (locale 拡張)', () => {
    it('5.1. null → 空文字', () => {
      expect(safeNormalize(null)).toBe('')
    })

    it('5.2. undefined → 空文字', () => {
      expect(safeNormalize(undefined)).toBe('')
    })

    it('5.3. locale 指定なしは Round 12 NFKC のみ (互換)', () => {
      expect(safeNormalize('ＨＥＬＬＯ')).toBe('hello')
    })

    it('5.4. locale=zh で 醫療 → 医疗', () => {
      expect(safeNormalize('醫療', 'zh')).toBe('医疗')
    })

    it('5.5. locale=ja で 辯護士 → 弁护士', () => {
      expect(safeNormalize('辯護士', 'ja')).toBe('弁护士')
    })

    it('5.6. locale=auto + ハングル含む → ko 推定', () => {
      // ハングル + 漢字 → ko 推定 → 韓国 unify (但し辞書 zh / ja 用は別)
      expect(safeNormalize('한국 國家', 'auto')).toBe('한국 国家')
    })

    it('5.7. locale=auto + ひらがな含む → ja 推定 + 統一 (萬 → 万)', () => {
      // 'です' でひらがな含むため ja 推定 → 旧字体 萬 → 万 に統一
      expect(safeNormalize('萬円です', 'auto')).toBe('万円です')
    })

    it('5.8. number 入力でも throw なし', () => {
      expect(safeNormalize(42, 'ja')).toBe('42')
    })
  })

  // ----------------- 辞書サイズ確認 -----------------
  describe('getUnificationDictionary', () => {
    it('6.1. 内蔵辞書は 30 ペア以上', () => {
      const dict = getUnificationDictionary()
      expect(dict.length).toBeGreaterThanOrEqual(30)
    })

    it('6.2. 辞書 entry は [variant, canonical] の 2-tuple', () => {
      const dict = getUnificationDictionary()
      for (const entry of dict) {
        expect(entry).toHaveLength(2)
        expect(typeof entry[0]).toBe('string')
        expect(typeof entry[1]).toBe('string')
      }
    })

    it('6.3. 辞書 variant は 1 文字 (代理ペア除く 1 codepoint)', () => {
      const dict = getUnificationDictionary()
      for (const [variant] of dict) {
        // 代理ペアでも 1 codepoint なので [...variant].length === 1
        expect([...variant].length).toBe(1)
      }
    })
  })

  // ----------------- Round 14 Dev-A 辞書拡張 (35 → 50+) -----------------
  describe('Round 14 dictionary expansion (50+ pairs)', () => {
    it('7.1. 辞書 size は 50 ペア以上', () => {
      const dict = getUnificationDictionary()
      expect(dict.length).toBeGreaterThanOrEqual(50)
    })

    it('7.2. 中文 拡張: 檢察 → 检察 (法律)', () => {
      expect(normalizeMultilingual('檢察')).toBe('检察')
    })

    it('7.3. 中文 拡張: 訴訟 → 诉讼 (法律)', () => {
      expect(normalizeMultilingual('訴訟')).toBe('诉讼')
    })

    it('7.4. 中文 拡張: 監視 → 监视 (法執行 / 国家安全保障)', () => {
      expect(normalizeMultilingual('監視カメラ')).toBe('监视カメラ')
    })

    it('7.5. 中文 拡張: 標準 → 标准 (製品安全)', () => {
      expect(normalizeMultilingual('標準化')).toBe('标准化')
    })

    it('7.6. 中文 拡張: 議會 → 议会 (行政)', () => {
      expect(normalizeMultilingual('議會')).toBe('议会')
    })

    it('7.7. 中文 拡張: 識別 → 识别 (国家安全保障)', () => {
      expect(normalizeMultilingual('識別')).toBe('识别')
    })

    it('7.8. 中文 拡張: 審判 → 审判 (法律)', () => {
      expect(normalizeMultilingual('審判')).toBe('审判')
    })

    it('7.9. 中文 拡張: 驗證 → 验证 (品質)', () => {
      // 驗 → 验 + 證 → 证 の連動 (Round 13 既存 證→证 + Round 14 新 驗→验)
      expect(normalizeMultilingual('驗證')).toBe('验证')
    })

    it('7.10. 日本語 拡張: 應急 → 応急 (旧字体)', () => {
      expect(normalizeMultilingual('應急')).toBe('応急')
    })

    it('7.11. 日本語 拡張: 對策 → 対策 (旧字体)', () => {
      expect(normalizeMultilingual('對策')).toBe('対策')
    })

    it('7.12. 日本語 拡張: 假名 → 仮名 (旧字体)', () => {
      expect(normalizeMultilingual('假名')).toBe('仮名')
    })

    it('7.13. 日本語 拡張: 擔當 → 担当 (旧字体, 雇用)', () => {
      expect(normalizeMultilingual('擔當')).toBe('担当')
    })

    it('7.14. 日本語 拡張: 圓 → 円 (金融)', () => {
      expect(normalizeMultilingual('一萬圓')).toBe('一万円')
    })

    it('7.15. 日本語 拡張: 竝 → 並 (旧字体)', () => {
      expect(normalizeMultilingual('竝行')).toBe('並行')
    })

    it('7.16. 韓国 拡張: 樂 → 乐 (教育)', () => {
      expect(normalizeMultilingual('音樂')).toBe('音乐')
    })

    it('7.17. 韓国 拡張: 團體 → 团体', () => {
      expect(normalizeMultilingual('團體')).toBe('团体')
    })

    it('7.18. 連動: 既存 35 ペアは regression 0 (代表 5 件 sanity)', () => {
      expect(normalizeMultilingual('醫療')).toBe('医疗')
      expect(normalizeMultilingual('辯護士')).toBe('弁护士')
      expect(normalizeMultilingual('銀行')).toBe('银行')
      expect(normalizeMultilingual('業務')).toBe('业务')
      expect(normalizeMultilingual('萬円')).toBe('万円')
    })

    it('7.19. 拡張ペアと既存ペアの連動: 醫療 + 監視 → 医疗 + 监视', () => {
      expect(normalizeMultilingual('醫療監視')).toBe('医疗监视')
    })

    it('7.20. 辞書 variant に重複なし (整合性)', () => {
      const dict = getUnificationDictionary()
      const variants = dict.map(([v]) => v)
      const uniq = new Set(variants)
      expect(uniq.size).toBe(variants.length)
    })

    it('7.21. ASCII 入力は idempotent (拡張ペアの誤動作なし)', () => {
      expect(normalizeMultilingual('legal advice')).toBe('legal advice')
      expect(normalizeMultilingual('credit score')).toBe('credit score')
    })

    it('7.22. NFKC + 拡張ペア連動: ＡＢ對策 → ab対策', () => {
      expect(normalizeMultilingual('ＡＢ對策')).toBe('ab対策')
    })
  })
})
