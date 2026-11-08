import { accountApiAuth } from '@/lib/accountProvision';
import { validAccountKey } from '@/lib/keyAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const denied = accountApiAuth(request);
  if (denied) return denied;

  let key: unknown;
  try {
    key = ((await request.json()) as { key?: unknown }).key;
  } catch {
    return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  }
  if (typeof key !== 'string' || !key) {
    return Response.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  }

  try {
    return Response.json({ valid: validAccountKey(key) }, {
      headers: { 'cache-control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'VERIFICATION_FAILED' }, { status: 500 });
  }
}
