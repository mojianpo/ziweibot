import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { accountTimestampForUser, activeAccountTimestamp, keyUserIdFor, validAccountKey } from '../apps/web/src/lib/keyAuth';
import type { Tester } from './harness';

const DAY_MS = 24 * 60 * 60 * 1000;

export const suite = async (t: Tester): Promise<void> => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ziwei-key-auth-'));
  const now = 1_800_000_000_000;
  try {
    await t.test('KEY 必须与文件名大小写完全一致，且不能跳出 accounts 目录', () => {
      fs.writeFileSync(path.join(dir, 'Exact.txt'), '-1');
      assert.equal(validAccountKey('Exact', now, dir), true);
      assert.equal(validAccountKey('exact', now, dir), false);
      assert.equal(validAccountKey('../Exact', now, dir), false);
      assert.equal(validAccountKey('missing', now, dir), false);
    });

    await t.test('文件内容 -1 永久通过；空值和非法时间戳拒绝', () => {
      for (const [key, value] of [
        ['empty', ''], ['text', 'tomorrow'], ['negative', '-2'], ['decimal', '1.5'],
        ['overflow', '99999999999999999999'],
      ]) {
        fs.writeFileSync(path.join(dir, `${key}.txt`), value);
        assert.equal(validAccountKey(key, now, dir), false, key);
      }
    });

    await t.test('普通 KEY 从文件时间戳起七天内有效，到期及之后拒绝登录和已有会话', () => {
      fs.writeFileSync(path.join(dir, 'old.txt'), String(now - 7 * DAY_MS - 1));
      fs.writeFileSync(path.join(dir, 'boundary.txt'), String(now - 7 * DAY_MS));
      fs.writeFileSync(path.join(dir, 'new.txt'), String(now - DAY_MS));
      assert.equal(validAccountKey('old', now, dir), false);
      assert.equal(validAccountKey('boundary', now, dir), false);
      assert.equal(validAccountKey('new', now, dir), true);
      assert.equal(activeAccountTimestamp(now - 7 * DAY_MS + 1, now), true);
      assert.equal(activeAccountTimestamp(now - 7 * DAY_MS, now), false);
      assert.equal(activeAccountTimestamp(-1, now), true);
      assert.equal(activeAccountTimestamp(null, now), false);
    });

    await t.test('账号页按用户 ID 读取 KEY 文件的最新时间戳，不保存 KEY 原文', () => {
      fs.writeFileSync(path.join(dir, 'profile.txt'), '-1');
      const userId = keyUserIdFor('profile');
      assert.equal(accountTimestampForUser(userId, dir), -1);
      fs.writeFileSync(path.join(dir, 'profile.txt'), String(now - 8 * DAY_MS));
      assert.equal(accountTimestampForUser(userId, dir), now - 8 * DAY_MS);
      assert.equal(accountTimestampForUser(keyUserIdFor('missing'), dir), null);
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
