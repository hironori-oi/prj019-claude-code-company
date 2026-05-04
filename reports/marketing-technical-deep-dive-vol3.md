# PRJ-019 Clawbridge — Technical Deep Dive Vol.3 草稿

- **作成日**: 2026-05-04
- **担当**: Marketing 部門
- **対象掲載先**: `/works/clawbridge/technical-deep-dive/vol-03-budget-cap` (A 別枠連載 第 3 弾、Zenn 主軸 + note.com サブ)
- **連載シリーズ名**: `Clawbridge Technical Deep Dive` (全 6 本予定)
- **本記事タイトル**: 「月次予算 $430 cap の二重防御 — DEC-019-050/051 spend cap と subscription 主軸の数学」
- **依拠議決**: DEC-019-052 議決-25 (A 連載) + DEC-019-050 (API spend cap $30) + DEC-019-051 (subscription 主軸転換)
- **公開予定**: Phase 2 W3 (2026-09-XX 想定)
- **想定字数**: 2,500-3,500 字 (本草稿 約 3,250 字)
- **tone**: A hard / 技術深堀り

---

## 1. Zenn / note 用 frontmatter draft

### 1.1 Zenn frontmatter

```yaml
---
title: "月次予算 $430 cap の二重防御 — DEC-019-050/051 spend cap と subscription 主軸の数学"
emoji: "currency-yen"
type: "tech"
topics: ["typescript", "cost", "harness", "budget", "openclaw"]
published: true
published_at: 2026-09-XX 09:00
publication_name: "improver"
---
```

### 1.2 note frontmatter

```text
タイトル: 月次予算 $430 cap の二重防御 — DEC-019-050/051 spend cap と subscription 主軸の数学
ハッシュタグ: #AI #個人開発 #TypeScript #harness #Clawbridge #コスト管理
公開日: 2026-09-XX 09:00 JST
シリーズ: Clawbridge Technical Deep Dive (3/6)
リード文:
  Anthropic Console から $30 spend cap が降ってきた瞬間、設計を全部組み直した。
  本稿では subscription 95% + API 5% の流量比、$24 / $28.5 / $30 の watchdog 3 段階、
  cost-tracker.ts と usage-monitor.ts の冪等性設計を、コード全公開で解説する。
```

### 1.3 OGP / SEO meta

| 項目 | 値 |
| --- | --- |
| canonical | `https://improver.jp/works/clawbridge/technical-deep-dive/vol-03-budget-cap` |
| description | 「subscription 主軸 + API 補助の二重防御で月次予算 $430 を物理保証する設計。watchdog 3 段階閾値の比率追従、tier 順序による冪等性、kill-switch 連鎖の実装を全公開。」 |
| keywords | `Anthropic spend cap`, `subscription`, `subprocess spawn`, `watchdog`, `cost-tracker`, `usage-monitor`, `kill-switch`, `Clawbridge` |

---

## 2. 本文草稿 (2,500-3,500 字)

### 2.1 はじめに — 5/3 夜の Anthropic Console

Phase 0 のリサーチ結論は明快だった。
**「subscription $400 + API key $300 = 月次 $700 で 28 案件並列が現実的」** — これが当初の予算設計である。

しかし 5/3 夜、Owner が Anthropic Console を開いて spend cap を確認した瞬間、設計の前提が崩れた。

> Hard cap = $30 / 月 / Soft notify = $25 / リセット = 6/1 月初

これは Anthropic 側が新規 API key 利用者に対して提示する **デフォルト枠** だった。
増額申請には別途レビューが必要で、Phase 1 開戦には間に合わない。
当初想定の **1/10**、つまり $300 → $30 へ強制的に絞られた。

選択肢は 2 つ。Phase 1 開戦を 1-2 ヶ月遅らせるか、$30 内で動く構造に再設計するか。
Owner は後者を選んだ。**DEC-019-051** (subscription 主軸転換) は 5/4 中に CEO 統合判断として起票され、その日のうちに Dev が実装を始めた。

### 2.2 二重防御 — subscription 主軸 + API 補助

DEC-019-051 の核心は **「コスト構造の主軸そのものを書き換える」** ことだった。

| 項目 | 旧設計 (DEC-019-007) | 新設計 (DEC-019-051) |
| --- | --- | --- |
| 主軸 | API key 経由の Open Claw 呼び出し | subscription plan (Claude Max + Codex Pro) 経由の subprocess spawn |
| API key の役割 | メイン経路 | 補助経路 (HITL 通知 / mock-claude / E2E test / drill / ナレッジ batch のみ) |
| 流量比 | API key 100% | subscription **95%** / API **5%** |
| 月次総額 | $700 想定 | **≤$430 確定** |

> 図 3.A: 月次予算 $430 の二重防御アーキテクチャ (subscription 経路 95% + API 経路 5%) <!-- arch-diagram-3A: budget-doublewall -->

「二重防御」と呼ぶ理由は明確だ。

- **第 1 防壁**: subscription を主軸にして、API key 消費を物理的に減らす (流量比 95% / 5%)
- **第 2 防壁**: 残った 5% の API key 消費を、watchdog で 3 段階監視して `$30` を絶対に超えさせない

第 1 防壁が **「予算が減る速度を遅くする」**、第 2 防壁が **「最後の 1 ドルを物理的に守る」** という役割分担である。

### 2.3 watchdog 3 段階閾値の比率追従設計

第 2 防壁の実装は `app/harness/src/cost-tracker.ts` (308 行) と `usage-monitor.ts` (401 行) に分かれている。
W0-Week2 Round 6 G-04 で確定した watchdog ロジックは、**閾値を絶対値ではなく比率で持つ** という設計判断が肝だ。

```ts
// app/harness/src/cost-tracker.ts (Round 6 G-04 確定)

export type WatchdogTier = 'warn' | 'auto_stop' | 'hard_fail';

export const DEFAULT_WATCHDOG_RATIOS: Record<WatchdogTier, number> = {
  warn: 0.8,        // $24 / $30
  auto_stop: 0.95,  // $28.5 / $30
  hard_fail: 1.0,   // $30 / $30
};

export interface WatchdogThreshold {
  tier: WatchdogTier;
  thresholdUsd: number;
}

export function computeWatchdogThresholds(
  perDayUsd: number,
  ratios: Record<WatchdogTier, number> = DEFAULT_WATCHDOG_RATIOS,
): WatchdogThreshold[] {
  return (Object.keys(ratios) as WatchdogTier[])
    .map((tier) => ({ tier, thresholdUsd: perDayUsd * ratios[tier] }))
    .sort((a, b) => a.thresholdUsd - b.thresholdUsd);
}

export function classifyWatchdogTier(
  spentUsd: number,
  thresholds: WatchdogThreshold[],
): WatchdogTier | null {
  // 高い tier から逆順に評価
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (spentUsd >= thresholds[i].thresholdUsd) return thresholds[i].tier;
  }
  return null;
}
```

`perDayUsd` を $30 (DEC-019-050 hard cap) にすれば自動で `warn=$24 / auto_stop=$28.5 / hard_fail=$30` が算出される。
将来 cap を $30 → $100 に増額する (Phase 2 想定) ときも、`perDayUsd` を 1 行変えれば全閾値が自動追従する。
**「閾値を絶対値で持たない」** という選択が、Phase 2 拡張を 1 行 diff に圧縮する。

### 2.4 冪等性設計 — tier 順序による重複通知抑止

watchdog が秒単位 polling で動くと、`hard_fail` 突破後に毎 polling サイクルで Slack 通知 + kill 動作が発火してしまう。
これを防ぐため、`FileUsageMonitor` (401 行) は内部で tier 順序 (`warn=1 / auto_stop=2 / hard_fail=3`) を管理し、**「既に同 or 高 tier で発火済の場合は skip」** という冪等性を持たせている。

```ts
// app/harness/src/usage-monitor.ts (Round 6 G-04 抜粋)

const TIER_ORDER: Record<WatchdogTier, number> = {
  warn: 1, auto_stop: 2, hard_fail: 3,
};

async function checkWatchdog(this: FileUsageMonitor): Promise<void> {
  const spent = await this.costTracker.getMonthlySpentUsd();
  const tier = classifyWatchdogTier(spent, this.thresholds);
  if (!tier) return;

  const lastTier = this.state.lastFiredTier;
  if (lastTier && TIER_ORDER[lastTier] >= TIER_ORDER[tier]) {
    return; // 冪等: 既に同 or 高 tier 発火済
  }

  await this.notifySlackMonitor({ tier, spentUsd: spent });
  this.state.lastFiredTier = tier;

  if (tier === 'auto_stop') {
    this.state.autoStopped = true; // フラグ化のみ、kill しない
  }
  if (tier === 'hard_fail') {
    await this.killSwitch.trigger(
      `budget hard_fail: spent=$${spent.toFixed(2)} cap=$${this.cap}`,
      { source: 'budget' },
    );
  }
}
```

設計の妙は 3 つある。

1. **`auto_stop` は kill しない** — Open Claw が自走停止判断に使うフラグのみ。subscription 経路は継続稼働できる
2. **`hard_fail` は kill-switch trigger** — kill-switch が CB forceOpen + subprocess SIGTERM/SIGKILL の連鎖を起こす (G-05/G-06)
3. **polling interval が injectable** — テスト時 50ms、本番 60s で切替可能

### 2.5 kill-switch 連鎖 — hard_fail から subprocess 停止まで

`hard_fail` 検知後、kill-switch が `trigger()` を呼ぶと、内部で次の順序が厳守される。

```
1. history file 書込 (audit log)
2. CircuitBreaker forceOpen (新規 spawn を即拒否)
3. subprocess SIGTERM (graceful shutdown 試行)
4. gracePeriodMs (default 2s) 経過後も alive() なら SIGKILL
5. onTrigger handlers (Slack #drill 通知 / decisions.md 追記)
6. disarm (kill-switch 自体を二度発火させない)
7. process.exit
```

> 図 3.B: hard_fail → kill-switch 連鎖の 7 段階 <!-- arch-diagram-3B: hardfail-killchain -->

CB を **先に** open するのが重要だ。
新規 spawn を即拒否してから既走 subprocess を順に止めれば、grace 中に新たな API 課金が発生する余地がない。
逆順 (subprocess 先 / CB 後) だと、SIGTERM 中に新規 spawn が CB を通過してしまうリスクがある。

実装は `app/harness/src/kill-switch.ts` (308 行) の `trigger()` 内で順序を文字通り逐次 await している。並行実行しないことが安全保証になる。

### 2.6 「auto_stop は kill しない」の意味

watchdog 3 段階のうち最も誤解されやすいのが `auto_stop` (= $28.5 突破) である。
ここで全停止すると subscription 経路まで止まり、28 案件の自律稼働が一斉停止する。

そこで `auto_stop` は **「API 経路の自律稼働を自動停止、subscription 経路は継続」** と振る舞う。

| 状態 | API 経路 | subscription 経路 |
| --- | --- | --- |
| `warn` ($24-) | 継続 + Slack 予兆通知 | 継続 |
| `auto_stop` ($28.5-) | **自走停止** (Open Claw 判断) | **継続** |
| `hard_fail` ($30-) | **kill-switch 強制停止** | kill-switch 連鎖で全停止 |

`auto_stop` フラグは `state.autoStopped = true` として保存され、Open Claw 側の自律ループが「この月は API 経路を使うな」と判断するためのシグナルになる。
**subscription 主軸の流量比 95% を最後まで活用する** ための設計判断だ。

### 2.7 5 必須施策 — API $19-31 → $11-15 への圧縮

DEC-019-051 が実現するためには、API 消費の絶対値を圧縮する 5 施策が並行して必要だった。

| 施策 | 内容 | 期待削減 |
| --- | --- | --- |
| 施策-1 | mock-claude フル活用 (drill #3 mock 70% 化) | -40% |
| 施策-2 | HITL 通知テンプレ化 (Vol.2 で詳述) | -15% |
| 施策-3 | E2E staging 限定 (週次 1 回 / drill 時のみ) | -20% |
| 施策-4 | ナレッジ batch caching | -10% |
| 施策-5 | drill #3 簡易化 (E ベクトル canned response 50 種) | -10% |

5 施策がすべて成功すると、API 消費見積は **月 $19-31 → $11-15** に圧縮される。
$30 cap に対して **buffer 50% 以上** を確保する設計である。

watchdog 3 段階は、この 5 施策が想定通り効かなかった場合の最後のセーフティネットである。
**「設計で減らし、実装で減らし、それでも超えたら強制停止する」** という三段構えだ。

### 2.8 月次総額 ≤$430 の数字根拠

DEC-019-051 採択後の月次コスト構造は次の通り。

| カテゴリ | 内訳 | 月額 |
| --- | --- | --- |
| (A) 既契約 subscription | Claude Max $200 + Codex Pro $200 | **$400** (追加発生なし) |
| (B) 新規 API | DEC-019-050 Hard cap | **≤$30** |
| (C) インフラ | Vercel / Supabase / 1Password (既契約継続) | **$0** (追加発生なし) |
| **合計** | | **≤$430 / 月** |

旧設計 $700 想定からむしろ **$270 の節約** になった。
裏切られた予算が、結果として「予算を節約する設計」を強制してくれた、という逆説である。

### 2.9 まとめと次回予告

本記事では月次予算 $430 cap を物理保証する二重防御を 8 つの観点から解説した。

1. **第 1 防壁**: subscription 主軸 95% + API 補助 5% で消費速度を物理的に遅らせる
2. **第 2 防壁**: watchdog 3 段階 ($24 / $28.5 / $30) で残り 5% の API を監視
3. **比率追従設計**: 閾値を絶対値ではなく比率で保持、Phase 2 増額を 1 行 diff に圧縮
4. **冪等性**: tier 順序による重複通知抑止、polling interval injectable
5. **`auto_stop` は kill しない**: subscription 経路を最後まで活用する設計判断
6. **`hard_fail` の連鎖**: history → CB forceOpen → SIGTERM → SIGKILL → handlers の 7 段階
7. **5 必須施策**: mock 70% 化 / template 化 / E2E 限定 / batch caching / drill 簡易化
8. **月次総額 ≤$430**: 旧 $700 想定からむしろ $270 節約

次回 Vol.4 では、本記事で軽く触れた **BAN drill #1/#2/#3 のシナリオ設計** を取り上げ、Anthropic ToS / OpenAI Usage Policies の一次資料 8 件から導いた 3 つの検証ドリルを解説する。

> Vol.4 公開予定: 2026-10-XX (Phase 2 W4 想定)

---

## 3. アーキ図 placeholder 一覧

| 図 ID | 内容 | 形式案 |
| --- | --- | --- |
| 図 3.A | 月次予算 $430 二重防御 (subscription 95% + API 5%) <!-- arch-diagram-3A: budget-doublewall --> | Mermaid flowchart |
| 図 3.B | hard_fail → kill-switch 連鎖 7 段階 <!-- arch-diagram-3B: hardfail-killchain --> | Mermaid sequenceDiagram |
| 図 3.C | watchdog 3 段階の比率追従 (cap=$30 / $100) <!-- arch-diagram-3C: watchdog-ratio --> | shadcn/ui Bar chart |
| 図 3.D | 5 必須施策の API 削減効果スタック <!-- arch-diagram-3D: 5-policies-reduction --> | shadcn/ui Stacked bar |
| 図 3.E | tier 順序による冪等性タイムライン <!-- arch-diagram-3E: tier-idempotency --> | Mermaid timeline |

---

## 4. 字数 / tone 自己検証

### 4.1 字数チェック

- 本文 (§1〜§2.9) 推定: 約 3,250 字
- 目標: 2,500-3,500 字 ✓

### 4.2 A tone 自己検証

| 観点 | 状態 |
| --- | --- |
| 専門用語そのまま (watchdog / kill-switch / CB forceOpen / SIGTERM / SIGKILL / 冪等性) | ✓ |
| コード断片あり (cost-tracker.ts / usage-monitor.ts) | ✓ 2 箇所 |
| 図表 placeholder | ✓ 5 箇所 |
| 数値根拠 ($30 cap / $24-$28.5-$30 / 95% vs 5% / $11-15 / ≤$430 / -270 節約) | ✓ |
| 物語要素抑制 | ✓ §2.1 のみ短く |
| AI 感のある煽り語 | ✓ 0 件 |
| 絵文字 | ✓ 0 件 |

→ **A hard tone 貫徹 ✓**

### 4.3 portfolio + Vol.1/Vol.2 との一貫性

| 接続観点 | 接続先 | 本記事 |
| --- | --- | --- |
| Section 5「最大の敵」§5.4 月次予算 cap | 連載 #3 へ送客 | §2.2-§2.6 で 2 重防御を全公開 ✓ |
| Section 7「裏切られた予算」§7.3 subscription 主軸転換 | 連載 #3 数値根拠 | §2.8 で月次 ≤$430 を再掲 ✓ |
| Vol.1 §2.10 subprocess spawn vs API 経由 4 軸比較 | コスト軸の深掘り | §2.2 でコスト軸を再展開 ✓ |
| Vol.2 §2.3 純関数化で API 消費 90% 削減 | 施策-2 と接続 | §2.7 で 5 施策に統合 ✓ |

→ **Section 5/7 + Vol.1/Vol.2 との連動 OK ✓**

---

## 5. 残タスク (公開前)

| # | タスク | 担当 | 期日 |
| --- | --- | --- | --- |
| T-01 | 図 3.A〜3.E の Mermaid/SVG 化 | Web-Ops | Phase 2 W3 着手前 |
| T-02 | コード断片の最終 lint チェック (Phase 1 W1 確定 `cost-tracker.ts` 実体と照合) | Dev + Marketing | Phase 2 W3 |
| T-03 | watchdog テスト数の最終 count (Round 6 段階 13 → Phase 1 完了時) | Marketing | 6/26 段階 3 |
| T-04 | Zenn / note クロス投稿 OGP 整合 | Web-Ops + Marketing | Phase 2 W3 |
| T-05 | Vol.4 連載予告詳細化 (BAN drill 一次資料引用範囲確定) | Marketing + Research | Phase 2 W3 |

---

## 6. 提出メタ情報

| 項目 | 値 |
| --- | --- |
| 行数 | 約 380 行 |
| 字数 (本文 §1-§2.9) | 約 3,250 字 |
| tone 検証 | A hard / 技術深堀り 貫徹 |
| frontmatter | Zenn / note 両対応 ✓ |
| コード断片 | 2 箇所 (cost-tracker.ts watchdog tier / usage-monitor.ts checkWatchdog) |
| アーキ図 placeholder | 5 箇所 |
| portfolio との連動 | Section 5 / 7 + Vol.1/Vol.2 への裏付け 4 箇所 |
| commit / push | **実行しない** (CEO が一括 push) |
| 関連報告 | `dev-w0-week2-round6-w1-hardguards.md` (G-04 watchdog 実装) / `dev-budget-guard-30usd-v1.md` (cost-tracker 初期設計) / `marketing-portfolio-narrative-section-4-10.md` (Section 5 / 7) |
| 連載併走 | Vol.1 (subprocess spawn) / Vol.2 (HITL 11 種) / Vol.4 (BAN drill) / Vol.5 (Plan A/B) / Vol.6 (28x28) |

---

**作成: Marketing 部門 / 2026-05-04 / Round 7 案 7-D Marketing 担当 vol 3 草稿**
