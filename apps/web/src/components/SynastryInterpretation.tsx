'use client';

import { useState } from 'react';
import { readUserConfig } from '@/lib/aiConfig';

type Person = { name: string; gender: 'male' | 'female'; year: number; month: number; day: number; hour: number };

export default function SynastryInterpretation({ a, b }: { a: Person; b: Person }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  async function generate() {
    setState('loading');
    setError('');
    const data = new FormData();
    for (const [prefix, person] of [['a', a], ['b', b]] as const) {
      data.set(`${prefix}n`, person.name);
      data.set(`${prefix}g`, person.gender);
      data.set(`${prefix}d`, `${person.year}-${String(person.month).padStart(2, '0')}-${String(person.day).padStart(2, '0')}`);
      data.set(`${prefix}h`, String(person.hour));
    }
    const config = readUserConfig();
    if (config) {
      data.set('ai_kind', config.kind);
      data.set('ai_key', config.apiKey);
      data.set('ai_model', config.model);
      data.set('ai_base_url', config.baseUrl);
      data.set('ai_max_tokens', String(config.maxTokens));
    }
    try {
      const response = await fetch('/ziweibot/api/synastry/interpret', { method: 'POST', body: data });
      const result = await response.json() as { interpretation?: string; error?: string };
      if (!response.ok || !result.interpretation) throw new Error(result.error || '模型解读失败，请重试。');
      setAnswer(result.interpretation);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络异常，请重试。');
      setState('error');
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-line bg-surface p-4 sm:p-6" aria-labelledby="synastry-ai-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="synastry-ai-title" className="text-base font-medium text-ink">合盘通俗解读</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-2">由大模型根据上方盘面事实生成，供文化兴趣参考。</p>
        </div>
        <button type="button" onClick={() => void generate()} disabled={state === 'loading'} className="min-h-11 rounded-lg bg-zhu px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zhu-deep disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zhu">
          {state === 'loading' ? '正在解读…' : state === 'done' ? '重新生成' : '生成通俗解读'}
        </button>
      </div>
      {state === 'idle' && <p className="mt-5 text-sm text-ink-2">点击按钮，了解这份合盘中的相处特点与沟通建议。</p>}
      {state === 'loading' && <p className="mt-5 text-sm text-ink-2" role="status">正在结合两人的盘面信息生成解读，请稍候…</p>}
      {state === 'error' && <p className="mt-5 text-sm text-danger" role="alert">{error}</p>}
      {state === 'done' && <div className="mt-5 whitespace-pre-wrap break-words border-t border-lineSoft pt-5 text-sm leading-7 text-ink">{answer}</div>}
    </section>
  );
}
