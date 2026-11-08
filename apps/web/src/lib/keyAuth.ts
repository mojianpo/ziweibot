import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function activeAccountTimestamp(timestamp: number | null, now = Date.now()): boolean {
  return timestamp === -1 || (timestamp !== null && timestamp + SEVEN_DAYS_MS > now);
}

export function keyUserIdFor(key: string): string {
  return crypto.createHash('sha256').update(`key:${key}`).digest('hex').slice(0, 32);
}

function parseTimestamp(raw: string): number | null {
  const value = raw.trim();
  if (value === '-1') return -1;
  if (!/^\d+$/.test(value)) return null;
  const timestamp = Number(value);
  return Number.isSafeInteger(timestamp) && Number.isFinite(new Date(timestamp).getTime())
    ? timestamp
    : null;
}

/** 根据登录用户 ID 读取对应 KEY 文件，避免在用户数据中保存 KEY 原文。 */
export function accountTimestampForUser(
  userId: string,
  accountsDir = path.join(process.cwd(), 'accounts'),
): number | null {
  const filename = fs.readdirSync(/* turbopackIgnore: true */ accountsDir)
    .find((name) => name.endsWith('.txt') && keyUserIdFor(name.slice(0, -4)) === userId);
  if (!filename) return null;
  return parseTimestamp(fs.readFileSync(path.join(/* turbopackIgnore: true */ accountsDir, filename), 'utf8'));
}

/** KEY 必须与 accounts 目录下的文件名完全一致；时间戳使用毫秒。 */
export function validAccountKey(
  key: string,
  now = Date.now(),
  accountsDir = path.join(process.cwd(), 'accounts'),
): boolean {
  if (!key || key.includes('/') || key.includes('\\')) return false;
  const filename = `${key}.txt`;
  if (!fs.readdirSync(/* turbopackIgnore: true */ accountsDir).includes(filename)) return false;

  const timestamp = parseTimestamp(fs.readFileSync(/* turbopackIgnore: true */ path.join(accountsDir, filename), 'utf8'));
  return activeAccountTimestamp(timestamp, now);
}
