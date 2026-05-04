/**
 * 軽量 JSON 永続化ヘルパ。
 * W0 段階では SQLite / Supabase は使わず、~/.clawbridge/ 配下に JSON ファイルで保存する。
 *
 * - mkdir -p 相当の親ディレクトリ作成
 * - atomic write (tmp ファイル経由 + rename) でクラッシュ耐性
 * - load 失敗時は default 値を返す (ファイル未作成・破損時のフォールバック)
 *
 * Windows 11 primary 前提のため、path 区切りは node:path で抽象化。
 */
import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'

export async function ensureDir(path: string): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true })
}

export async function ensureDirSelf(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

/**
 * JSON ファイルから読み込む。存在しない / 破損時は default 値を返す。
 */
export async function loadJson<T>(path: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(path, 'utf-8')
    return JSON.parse(content) as T
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return defaultValue
    }
    // JSON parse 失敗等。安全のため default を返す（破損ファイルのフォールバック）。
    return defaultValue
  }
}

/**
 * JSON ファイルへ atomic に書き込む (tmp + rename)。
 */
export async function saveJson<T>(path: string, data: T): Promise<void> {
  await ensureDir(path)
  const tmpPath = `${path}.tmp.${process.pid}.${Date.now()}`
  const content = JSON.stringify(data, null, 2)
  await fs.writeFile(tmpPath, content, 'utf-8')
  await fs.rename(tmpPath, path)
}

/**
 * ファイル存在確認 (true/false のみ返す)。
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}
