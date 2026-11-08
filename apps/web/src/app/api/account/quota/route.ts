/**
 * 「我的账号」数据 —— GET
 *
 * 账号标识与 KEY 文件时间戳。未登录或 KEY 文件失效返回 401。
 */

import { accountTimestampForUser } from '@/lib/keyAuth';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return Response.json({ ok: false, error: 'NOT_LOGGED_IN' }, { status: 401 });
  }
  const timestamp = accountTimestampForUser(user.id);
  if (timestamp === null) {
    return Response.json({ ok: false, error: 'INVALID_KEY' }, { status: 401 });
  }
  return Response.json(
    {
      ok: true,
      account: user.email,
      timestamp,
      now: Date.now(),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
