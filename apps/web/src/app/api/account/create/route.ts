import fs from 'node:fs';
import path from 'node:path';
import { accountApiAuth, createAccountFile } from '@/lib/accountProvision';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const denied = accountApiAuth(request);
  if (denied) return denied;

  try {
    const template = fs.readFileSync(path.join(process.cwd(), 'account_template.txt'), 'utf8');
    const { key } = createAccountFile(path.join(process.cwd(), 'accounts'));
    const url = new URL('/ziweibot/account', request.url).toString();
    const content = template.replaceAll('{KEY}', key).replaceAll('{URL}', url);
    return new Response(content, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'ACCOUNT_CREATION_FAILED' }, { status: 500 });
  }
}
