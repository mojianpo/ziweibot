import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DAY_MS = 86_400_000;

/** 管理接口共用 API_KEY 鉴权；未配置时不开放接口。 */
export function accountApiAuth(request: Request): Response | null {
  const expected = process.env.API_KEY?.trim();
  if (!expected) {
    return Response.json({ error: 'API_KEY_NOT_CONFIGURED' }, {
      status: 503, headers: { 'cache-control': 'no-store' },
    });
  }
  const supplied = request.headers.get('API_KEY') ?? '';
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  const suppliedHash = crypto.createHash('sha256').update(supplied).digest();
  if (!supplied || !crypto.timingSafeEqual(expectedHash, suppliedHash)) {
    return Response.json({ error: 'UNAUTHORIZED' }, {
      status: 401, headers: { 'cache-control': 'no-store' },
    });
  }
  return null;
}

/** 原子创建 KEY 文件；若随机值碰撞，则重新生成。 */
export function createAccountFile(accountsDir: string, now = Date.now()): { key: string; timestamp: number } {
  fs.mkdirSync(accountsDir, { recursive: true });
  const timestamp = now + DAY_MS;
  for (let attempt = 0; attempt < 10; attempt++) {
    const key = Array.from({ length: 20 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
    try {
      fs.writeFileSync(path.join(accountsDir, `${key}.txt`), String(timestamp), { flag: 'wx' });
      return { key, timestamp };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }
  throw new Error('Could not generate a unique account KEY');
}
