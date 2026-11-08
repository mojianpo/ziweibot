/**
 * 额度文案回归 —— 额度墙口径与账号期限。
 *
 * 关注两件事：
 *  1. 额度墙文案按登录态区分：已登录「按账户」、未登录「按 IP」（中英都要对）
 *  2. /account 显示 KEY 文件期限，不显示额度和订单
 */

import assert from 'node:assert/strict';

import { QUOTA_COPY } from '../apps/web/src/lib/quotaCopy';
import type { Tester } from './harness';

export async function suite(t: Tester): Promise<void> {
  for (const lang of ['zh', 'en'] as const) {
    const copy = QUOTA_COPY[lang];

    t.test(`${lang} 额度墙文案按 scope 区分账户 / IP`, () => {
      const ip = copy.wallBody(3, 'ip');
      const account = copy.wallBody(3, 'account');
      assert.notEqual(ip, account, '两种口径的文案必须不同');
      if (lang === 'zh') {
        assert.match(ip, /每个 IP 每天免费 3 次/);
        assert.match(account, /每个账户每天免费 3 次/);
      } else {
        assert.match(ip, /per IP per day/);
        assert.match(account, /per account per day/);
      }
    });

    t.test(`${lang} 额度墙文案不串口径`, () => {
      assert.doesNotMatch(copy.wallBody(3, 'account'), /IP/);
      assert.doesNotMatch(copy.wallBody(3, 'ip'), /账户|account/);
    });

    t.test(`${lang} /account 有独立期限标签`, () => {
      assert.ok(copy.accountExpiryLabel.length > 0);
    });

    t.test(`${lang} 永久 KEY 显示永不过期`, () => {
      assert.match(copy.accountExpiry(-1, Date.now()), lang === 'zh' ? /永不过期/ : /Never expires/);
    });

    t.test(`${lang} 普通 KEY 显示七天有效期内的剩余天数`, () => {
      const now = 1_800_000_000_000;
      assert.match(copy.accountExpiry(now - 1.5 * 86_400_000, now), /6/);
    });

    t.test(`${lang} 日额 -1 显示不限次`, () => {
      const text = `${copy.statusBuiltin('AI', -1)} ${copy.activeBuiltin('AI', -1)}`;
      assert.doesNotMatch(text, /每天 -1|per day.*-1|剩余 -1/);
      assert.match(text, lang === 'zh' ? /不限次/ : /unlimited/i);
    });
  }
}
