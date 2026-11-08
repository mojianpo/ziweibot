/**
 * 已登录账号的额度状态 —— 给界面显示「每天 N 次 / 今天还剩几次」。
 *
 * 只读，不计数。
 * 按 userId 计，未登录返回 401。
 */

import { snapshotFor } from '@/lib/askAccess';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'NOT_LOGGED_IN' }, { status: 401 });
  const s = snapshotFor({ kind: 'user', userId: user.id });
  return Response.json(
    { ...s, loggedIn: true },
    { headers: { 'cache-control': 'no-store' } },
  );
}
