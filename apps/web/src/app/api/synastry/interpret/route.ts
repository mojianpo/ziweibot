import { resolveProviderFromEnv } from '@ziwei/ask';
import { SI_HUA_TABLE } from '@ziwei/chart-engine';
import type { ChartJSON } from '@ziwei/chart-engine';
import { providerFromUserConfig, readUserProvider } from '@/app/ai-provider';
import { reserveFor } from '@/lib/askAccess';
import { getService } from '@/lib/service';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

function person(data: FormData, prefix: string) {
  const date = String(data.get(`${prefix}d`) ?? '');
  const gender = data.get(`${prefix}g`);
  const hour = Number(data.get(`${prefix}h`));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (gender !== 'male' && gender !== 'female') || !Number.isInteger(hour) || hour < 0 || hour > 11) return null;
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day, hour, gender: gender as 'male' | 'female', name: String(data.get(`${prefix}n`) ?? '').trim().slice(0, 40) };
}

function facts(chart: ChartJSON, name: string) {
  const ming = chart.palaces.find((p) => p.isMingGong);
  const spouse = chart.palaces.find((p) => p.name === '夫妻宫');
  return `${name}：命宫 ${ming?.majorStars.join('、') || '空宫'}（${ming?.branchName ?? ''}）；夫妻宫 ${spouse?.majorStars.join('、') || '空宫'}（${spouse?.branchName ?? ''}）`;
}

function cross(from: ChartJSON, to: ChartJSON, fromName: string, toName: string) {
  const stars = SI_HUA_TABLE[from.lunar.yearStem];
  return (['禄', '权', '科', '忌'] as const).map((label, index) => {
    const star = stars?.[index] ?? '';
    const palace = to.palaces.find((p) => p.stars.some((s) => s.name === star));
    return `${fromName}的化${label}（${star}）落在${toName}的${palace?.name ?? '未知宫位'}`;
  }).join('；');
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: '请先登录。' }, { status: 401 });
  const data = await request.formData();
  const a = person(data, 'a');
  const b = person(data, 'b');
  if (!a || !b) return Response.json({ error: '生辰参数不完整。' }, { status: 400 });

  let chartA: ChartJSON;
  let chartB: ChartJSON;
  try {
    chartA = getService().chart(a);
    chartB = getService().chart(b);
  } catch {
    return Response.json({ error: '生辰无法排盘，请检查日期和时辰。' }, { status: 400 });
  }

  const userProvider = providerFromUserConfig(readUserProvider(data));
  const provider = userProvider ?? resolveProviderFromEnv();
  if (!provider) return Response.json({ error: '尚未配置大模型。请在「问」中设置模型，或联系管理员配置站内模型。' }, { status: 503 });
  const reservation = userProvider ? null : reserveFor({ kind: 'user', userId: user.id });
  if (reservation && !reservation.ok) return Response.json({ error: '今日模型解读额度已用完。' }, { status: 429 });

  const nameA = a.name || '甲方';
  const nameB = b.name || '乙方';
  try {
    const result = await provider.complete({
      system: '你是紫微斗数合盘说明助手。只依据用户提供的盘面事实解读，不能虚构星曜、宫位或更多盘面信息。用普通人能懂的中文，先解释双方相处特点，再解释可能的沟通摩擦，最后给出可执行的沟通建议。语气平和，不下婚恋吉凶、性格定论或命运预测。说明这些只是传统文化视角，不能代替真实相处。控制在 500 字内，不要重复原始数据表。',
      user: `${facts(chartA, nameA)}。${facts(chartB, nameB)}。\n${cross(chartA, chartB, nameA, nameB)}。\n${cross(chartB, chartA, nameB, nameA)}。`,
      maxTokens: 2000,
    });
    if (!result.text.trim()) throw new Error('模型未返回解读，请重试。');
    return Response.json({ interpretation: result.text.trim() });
  } catch (error) {
    reservation?.refund();
    return Response.json({ error: error instanceof Error ? error.message : '模型解读失败，请重试。' }, { status: 502 });
  }
}
