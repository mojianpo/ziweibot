'use client';

/** KEY 登录表单：账号页与额度墙共用。 */
import { useState, type FormEvent } from 'react';
import { QUOTA_COPY } from '@/lib/quotaCopy';
import { useLang } from '@/lib/lang';

export default function LoginPanel({
  onSuccess,
  compact = false,
}: {
  onSuccess?: () => void;
  compact?: boolean;
}) {
  const [lang] = useLang();
  const copy = QUOTA_COPY[lang];
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch('/ziweibot/api/auth/login-key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      onSuccess?.();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={login} className={compact ? '' : 'panel px-5 py-6 sm:px-8 sm:py-8'}>
      <p className="text-lg font-semibold text-ink">{copy.loginTitle}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{copy.loginHint}</p>
      <label className="field-label mt-6" htmlFor="ziwei-login-key">
        {copy.keyLabel}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="ziwei-login-key"
          type="password"
          autoComplete="off"
          value={key}
          onChange={(event) => { setKey(event.target.value); setError(false); }}
          placeholder={copy.keyPlaceholder}
          aria-invalid={error}
          aria-describedby={error ? 'ziwei-login-error' : undefined}
          className="field-input min-w-0 flex-1 bg-surface placeholder:text-ink-2"
        />
        <button
          type="submit"
          disabled={busy || !key}
          className="min-h-11 shrink-0 rounded-lg bg-zhu px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zhu-deep disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zhu"
        >
          {busy ? copy.loginBusy : copy.verifyLogin}
        </button>
      </div>
      {error && <p id="ziwei-login-error" className="mt-3 text-sm text-danger" role="alert">{copy.loginError}</p>}
      {!compact && (
        <p className="mt-6 border-t border-lineSoft pt-5 text-sm leading-relaxed text-ink-2">
          {lang === 'zh' ? (
            <>
              想获取登录账号 KEY？打开拼多多，搜索店铺「星图引擎」，或搜索商品「AI命格-紫微BOT学习交流电子资源包」；也可以直接点击
              <a href="https://mobile.yangkeduo.com/goods.html?ps=YH8tNcm3Rq" className="underline underline-offset-2 hover:text-zhu focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zhu">商品链接</a>
              下单。下单即可获取登录账号 KEY。
            </>
          ) : (
            <>
              Need an account KEY? Open Pinduoduo and search for the store “星图引擎”, or search “AI命格-紫微BOT学习交流电子资源包”. You can also order through the{' '}
              <a href="https://mobile.yangkeduo.com/goods.html?ps=YH8tNcm3Rq" className="underline underline-offset-2 hover:text-zhu focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zhu">product link</a>
              . Place an order to get your account KEY.
            </>
          )}
        </p>
      )}
    </form>
  );
}
