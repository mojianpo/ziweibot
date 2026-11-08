import Link from 'next/link';
import { DIMENSION_LABELS, READING_DIMENSIONS } from '@ziwei/core';
import { getService } from '@/lib/service';
import { SHICHEN_NAMES, SHICHEN_RANGES } from '@/lib/birth';

export const dynamic = 'force-dynamic';

const DISCLAIMER =
  '本工具仅供文化兴趣与学习之用，不构成任何医疗、法律、投资或人生决策建议。';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="mb-4 text-base tracking-[0.2em] text-ink">{title}</h2>
      <div className="space-y-3 text-[15px] leading-[1.9] text-ink-2">{children}</div>
    </section>
  );
}

export default async function AboutPage() {
  const coverage = getService().coverage();
  const years = coverage.indexedYears;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="mb-10">
        <p className="mb-2 text-2xs tracking-[0.3em] text-ink-3">ABOUT</p>
        <h1 className="text-3xl font-semibold tracking-[0.12em] text-ink">
          关于与口径
        </h1>
        <p className="mt-4 text-[15px] leading-[1.9] text-ink-2">
          紫微BOT把公历生辰排成十二宫命盘，并检索对应的十三维解读。
          排盘是确定性计算，解读是数据集原文检索——两个环节都不经过大模型推算。
        </p>
         <p className="mt-4 text-[15px] leading-[1.9] text-ink-2">
                  <b>温馨提示：</b> {DISCLAIMER}
         </p>
      </header>

      <div className="space-y-8">
        <Section title="排盘口径">
          <ul className="space-y-2.5">
            <li>
              <span className="text-ink">时辰是序号，不是钟点。</span>
              时辰序号 0–11（子=0、丑=1 …… 亥=11），与解读数据集的键口径完全一致。
              各时辰对应的钟点区间：
              {SHICHEN_NAMES.map((n, i) => (
                <span key={n} className="ml-1 whitespace-nowrap">
                  {n}时 {SHICHEN_RANGES[i]}
                  {i < SHICHEN_NAMES.length - 1 ? '；' : '。'}
                </span>
              ))}
            </li>
            <li>
              <span className="text-ink">日期是公历排盘日。</span>
              直接按输入的公历年月日排盘，不做农历换算输入，也不做真太阳时校正 ——
              因为数据集本身没有做，校正会导致检索键与盘面错位。
            </li>
            <li>
              <span className="text-ink">晚子时按次日排盘。</span>
              23:00–23:59 出生者，排盘日顺延至次日，时辰仍为子时（序号 0）。
              用「按钟点」输入时会自动应用这条规则；用「按时辰」输入时，需要自行选择
              「当日子时」或「晚子时」。
            </li>
            <li>
              <span className="text-ink">出生地不影响排盘。</span>
              本版不采集出生地，也不做真太阳时与夏令时校正。
            </li>
          </ul>
        </Section>

        <Section title="解读是怎么找到的">
          <p>
            检索键格式为
            <code className="mx-1 rounded bg-paper px-1.5 py-0.5 font-mono text-[13px] text-ink">
              YYYY-MM-DD-时辰序号-性别
            </code>
            ，与数据集逐字对齐。键命中即返回该盘十三维 Markdown 原文。
          </p>
          <p>
            当前样本库已建索引年份：
            <span className="tabular-nums text-ink">
              {years.length === 0
                ? '（无）'
                : years.length <= 12
                  ? years.join(' / ')
                  : `${years[0]}–${years[years.length - 1]}（共 ${years.length} 年）`}
            </span>
            ，共{' '}
            <span className="tabular-nums text-ink">
              {coverage.totalRecords.toLocaleString('zh-CN')}
            </span>{' '}
            条记录。未建索引或该键不存在的生辰，页面会如实显示「样本库未覆盖」，
            不会用任何生成内容替代。
          </p>
        </Section>

        <Section title="十三维解读">
          <p className="text-ink-2">
            每盘解读固定包含以下十三个维度，顺序固定：
          </p>
          <ol className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
            {READING_DIMENSIONS.map((d, i) => (
              <li key={d} className="flex gap-2 text-sm">
                <span className="tabular-nums text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-ink">{DIMENSION_LABELS[d]}</span>
              </li>
            ))}
          </ol>
        </Section>




      </div>


    </div>
  );
}
