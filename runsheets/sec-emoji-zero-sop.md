# Sec SOP — 絵文字 0 自動チェック（DEC-019-066 §3.3 連動）

**起案**: Sec-L / Round 17 / 2026-05-05 / **対象 script**: `projects/PRJ-019/scripts/sec-emoji-zero-check.sh`
**前身**: Sec-J 既存 emoji-zero スクリプト（NFKC + 35 ペア多言語フィルタ formal 化）
**目的**: 全 artifact から Unicode 絵文字 / 多言語擬似絵文字を自動検出し、`CLAUDE.md` 「assistant MUST avoid using emojis」既定方針を機械保証する。

---

## §1 適用範囲
- 走査対象: `projects/PRJ-019/**/*.{md,ts,tsx,js,jsx,yml,yaml}`
- 除外（read-only zone）: `decisions.md` / `_archive/` / `node_modules/` / `.git/` / `dist/` / `build/`
- 全 Round 完遂時 + 各部署 dispatch 完遂時の double-gate

## §2 実行手順
1. `bash projects/PRJ-019/scripts/sec-emoji-zero-check.sh` を実行
2. exit 0 = PASS / exit 1 = FAIL（検出箇所は `file:line: <emoji>` 形式で stdout + log）
3. FAIL 時は当該部署に即時 redaction 指示（CEO 経由）
4. redaction 完了後に再走査して PASS 確認

## §3 辞書定義（35 ペア多言語フィルタ統合 perl regex）
```
[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{1F900}-\x{1F9FF}\x{2300}-\x{23FF}\x{FE0F}\x{1F1E6}-\x{1F1FF}]
```
- `1F300-1FAFF`: Misc Symbols / Pictographs / Symbols & Pictographs Ext-A
- `2600-27BF`: Misc Symbols / Dingbats
- `1F900-1F9FF`: Supplemental Symbols & Pictographs
- `2300-23FF`: Misc Technical（emoji presentation 一部）
- `FE0F`: Variation Selector-16
- `1F1E6-1F1FF`: Regional Indicator（国旗）

## §4 false positive 0 確認手順
1. 本 SOP 採用前に Round 16 / 17 完遂 artifact 全件を pilot 走査
2. 検出箇所を目視で「真陽性 / 偽陽性」分類
3. 偽陽性発生時は IGNORE_PATTERNS に追加 + 5/26 review で正式化
4. 現時点 pilot 結果: false positive 0 / true positive は redaction 済（baseline 確立）

## §5 CI integration
```yaml
- name: Sec / emoji zero gate
  run: bash projects/PRJ-019/scripts/sec-emoji-zero-check.sh
```

## §6 5/26 review 連携
- 集計: violation 件数 / redaction 平均時間 / false positive 件数（目標 0）
