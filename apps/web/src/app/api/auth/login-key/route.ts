import { cookies } from 'next/headers';

import { createSession, ensureKeyUser } from '@/lib/account';
import { validAccountKey } from '@/lib/keyAuth';
import { SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let key: unknown;
  try {
    key = ((await request.json()) as { key?: unknown }).key;
  } catch {
    /* 非 JSON 输入按无效 KEY 处理 */
  }

  if (typeof key !== 'string' || !validAccountKey(key)) {
    return Response.json({ ok: false, error: 'INVALID_KEY' }, { status: 401 });
  }

  const user = ensureKeyUser(key);
  const session = createSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(session.expiresAt),
  });

  return Response.json({ ok: true });
}
