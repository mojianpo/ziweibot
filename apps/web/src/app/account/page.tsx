'use client';

/**
 * 「我的账号」页 —— /account
 *
 * 未登录：KEY 登录表单。
 * 已登录：账号标识与期限，可退出登录。
 */

import { useCallback, useEffect, useState } from 'react';
import LoginPanel from '@/components/LoginPanel';
import { QUOTA_COPY } from '@/lib/quotaCopy';
import { useLang } from '@/lib/lang';

export default function AccountPage() {
  const [lang] = useLang();
  const copy = QUOTA_COPY[lang];
  const [state, setState] = useState<'loading' | 'out' | 'in' | 'error'>('loading');
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [account, setAccount] = useState('');
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  const DISCLAIMER = '本工具仅供文化兴趣与学习之用，不构成任何医疗、法律、投资或人生决策建议。';


  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/api/account/quota', { cache: 'no-store' });
      if (res.status === 401) {
        setState('out');
        return;
      }
      if (!res.ok) throw new Error('Account request failed');
      const j = (await res.json()) as { account: string; timestamp: number; now: number };
      setAccount(j.account);
      setTimestamp(j.timestamp);
      setNow(j.now);
      setState('in');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      setState('out');
      setTimestamp(null);
      window.dispatchEvent(new Event('ziwei:auth-changed'));
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-10 sm:px-8 sm:pt-16">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[0.06em] text-ink sm:text-4xl">{copy.accountTitle}</h1>
        <div className="mt-4 h-px w-12 bg-zhu" aria-hidden="true" />
        <p className="" > <b>温馨提示：</b> {DISCLAIMER} </p>
      </header>


      {state === 'loading' && (
        <div className="panel w-full max-w-xl px-5 py-7 sm:px-8" role="status">
          <p className="text-sm text-ink-2">{lang === 'zh' ? '正在加载账号…' : 'Loading account…'}</p>
        </div>
      )}

      {state === 'error' && (
        <div className="panel w-full max-w-xl px-5 py-7 sm:px-8" role="alert">
          <p className="text-base font-medium text-ink">{lang === 'zh' ? '暂时无法获取账号信息' : 'Account information is unavailable'}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{lang === 'zh' ? '请检查网络后重试。' : 'Check your connection and try again.'}</p>
          <button type="button" onClick={() => void load()} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-zhu px-5 text-sm font-medium text-white transition-colors hover:bg-zhu-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zhu">
            {lang === 'zh' ? '重新加载' : 'Try again'}
          </button>
        </div>
      )}

      {state === 'out' && (
        <div className="w-full max-w-xl">
          <LoginPanel onSuccess={() => {
            window.dispatchEvent(new Event('ziwei:auth-changed'));
            void load();
          }} />
        </div>
      )}

      {state === 'in' && timestamp !== null && (
        <section className="panel w-full max-w-xl overflow-hidden">
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-sm font-medium text-zhu">{lang === 'zh' ? '已登录' : 'Signed in'}</p>
            <dl className="mt-6 space-y-5 text-sm sm:mt-8">
              <div className="grid gap-1.5 border-b border-lineSoft pb-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
                <dt className="text-ink-2">{copy.accountKey}</dt>
                <dd className="min-w-0 break-all font-medium text-ink">{account}</dd>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
                <dt className="text-ink-2">{copy.accountExpiryLabel}</dt>
                <dd className="font-medium text-ink">{copy.accountExpiry(timestamp, now)}</dd>
              </div>
            </dl>
          </div>
          <div className="border-t border-line bg-surface-2/60 px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => void logout()}
              disabled={loggingOut}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm text-ink-2 transition-colors hover:border-zhu/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zhu sm:w-auto"
            >
              {loggingOut ? (lang === 'zh' ? '退出中…' : 'Signing out…') : copy.logout}
            </button>
            {logoutError && <p className="mt-3 text-sm text-danger" role="alert">{lang === 'zh' ? '退出失败，请重试。' : 'Could not sign out. Please try again.'}</p>}
          </div>
        </section>
      )}



    </div>
  );
}
