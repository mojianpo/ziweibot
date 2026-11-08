/**
 * 额度相关文案（中英）。
 *
 * 只覆盖「额度墙 / 用尽提示 / 流量包入口 / 每天 N 次」这几处 —— 全站 i18n 不在本次范围。
 * 文案与代码分离：加一句话只改这里，不动组件逻辑。
 */

import type { TrafficPack } from './trafficPacks';

export type Lang = 'zh' | 'en';

/** 额度归属口径：未登录按 IP，已登录按账户 */
export type QuotaScope = 'ip' | 'account';

export interface QuotaCopy {
  /** 「本站免费提供 · 每天 N 次」的小注 */
  dailyNote: (limit: number) => string;
  /** AI 状态行（内置免费） */
  statusBuiltin: (model: string, limit: number) => string;
  /** VIP 名单命中时（limit 为 0 = 不限量） */
  statusVip: (model: string, limit: number) => string;
  /** AI 状态行（用户自己的 Key） */
  statusUser: (model: string) => string;
  /** 状态行后面的提示（换个 Key 之类） */
  statusHint: string;
  /** 用自己的 Key 时的状态行提示 */
  statusHintUser: string;
  /** AI 设置面板里的「当前 AI」行 */
  activeBuiltin: (model: string, limit: number) => string;
  activeUser: (model: string) => string;
  /** 额度墙标题 */
  wallTitle: string;
  /** 额度墙正文（口径随 scope：ip = 按 IP，account = 按账户） */
  wallBody: (limit: number, scope: QuotaScope) => string;
  /** 流量包区块标题 */
  packsTitle: string;
  /** 套餐名（n 次追问） */
  packAsks: (n: number) => string;
  /** 购买按钮 */
  buy: string;
  /** 引导去填自己的 Key */
  ownKeyHint: string;
  /** 「换成自己的 Key 就不限量」的小注 */
  ownKeyNote: string;
  /** 还没配 AI 时的提示 */
  noAiHint: string;
  /** 还没配 AI 时状态行里的提示（点开设置填 Key） */
  noAiStatus: string;
  /** 支付未开通（stub）提示 */
  payStub: string;
  /** stub 下单成功：额度已加到账户（收款未真实发生） */
  packAdded: (n: number) => string;
  // ── 真实支付（支付宝当面付扫码）─────────────────────────────────
  /** 二维码弹层标题 */
  payTitle: (priceCny: number, asks: number) => string;
  /** 引导扫码 */
  payScan: string;
  /** 等待支付中 */
  payWaiting: string;
  /** 支付成功 */
  payOk: (n: number) => string;
  /** 支付超时未付 / 关单 */
  payClosed: string;
  /** 下单失败（预下单报错 / 支付宝侧错误） */
  payFailed: (detail: string) => string;
  /** 支付服务未配置（商户凭据缺失） */
  payNotConfigured: string;
  /** 语言切换按钮上的字：切到哪个语言 */
  langToggle: string;
  // ── 账户 / KEY 登录 ──────────────────────────────────────────────
  /** 未登录时购买区上方的提示 */
  loginRequired: string;
  /** 未登录时的「去登录」按钮 */
  loginCta: string;
  /** KEY 输入框 */
  keyLabel: string;
  keyPlaceholder: string;
  verifyLogin: string;
  loginBusy: string;
  /** 登录表单副标题 */
  loginTitle: string;
  /** 登录表单说明 */
  loginHint: string;
  /** KEY 不存在或失效 */
  loginError: string;
  /** 账号页标题 */
  accountTitle: string;
  /** 账号页：当前账号标识 */
  accountKey: string;
  accountExpiryLabel: string;
  accountExpiry: (timestamp: number, now: number) => string;
  /** 退出登录按钮 */
  logout: string;
  /** 导航栏入口 */
  navAccount: string;
}

const ZH: QuotaCopy = {
  dailyNote: (n) => n === -1 ? '（本站免费提供 · 不限次）' : `（本站免费提供 · 每天 ${n} 次）`,
  statusBuiltin: (model, n) =>
    n === -1 || n >= 1000
      ? `当前 AI：${model}（本站免费提供 · 不限次）`
      : `当前 AI：${model}（本站免费提供 · 每天 ${n} 次）`,
  statusVip: (model, n) =>
    n > 0
      ? `当前 AI：${model}（VIP · 每天 ${n} 次）`
      : `当前 AI：${model}（VIP · 不限量）`,
  statusUser: (model) => `当前 AI：${model}（你的 Key · 不限量）`,
  statusHint: '—— 右上角 ⚙ 可换成自己的 Key。',
  statusHintUser: '—— 右上角 ⚙ 可更换或测试。',
  activeBuiltin: (model, n) => n === -1 ? `当前 AI：${model}（本站免费提供 · 不限次）` : `当前 AI：${model}（本站免费提供 · 每天 ${n} 次）`,
  activeUser: (model) => `当前 AI：${model}（你的 Key · 不限量）`,
  wallTitle: '今天的免费追问额度用完了',
  wallBody: (n, scope) =>
    scope === 'account'
      ? `内置 AI 每个账户每天免费 ${n} 次，次日 0 点（UTC）刷新。也可以填自己的 API Key，或买一个流量包继续问。`
      : `内置 AI 每个 IP 每天免费 ${n} 次，次日 0 点（UTC）刷新。也可以填自己的 API Key，或买一个流量包继续问。`,
  packsTitle: '流量包',
  packAsks: (n) => `${n} 次追问`,
  buy: '购买',
  ownKeyHint: '填自己的 API Key 不限量 —— 点右上角 ⚙ AI 设置。',
  ownKeyNote: '换成自己的 Key 就不限量。配置只存在这台设备的浏览器里，不上传。',
  noAiHint: '当前 AI：无 —— 下面填一个 Key 才能追问',
  noAiStatus: 'AI 还没配置 —— 点这里填 Key',
  payStub: '支付尚未开通（第一期 stub），先记下意向。',
  packAdded: (n) => `已记下意向（stub，未真实收款）；${n} 次追问已加到你的账户。`,
  payTitle: (priceCny, asks) => `支付宝扫码 · ¥${priceCny} / ${asks} 次追问`,
  payScan: '请用支付宝扫一扫，付款后自动到账（页面别关，最多等 3 分钟）。',
  payWaiting: '等待支付中…',
  payOk: (n) => `支付成功，${n} 次追问已到账。`,
  payClosed: '订单已关闭或超时未支付，钱不会扣。可重新下单。',
  payFailed: (detail) => `下单失败：${detail}`,
  payNotConfigured: '支付服务还没配置好（缺支付宝商户凭据），暂时买不了。',
  langToggle: 'EN',
  loginRequired: '登录后可以购买流量包，额度记在你的账户里。',
  loginCta: '去登录',
  keyLabel: 'KEY',
  keyPlaceholder: '请输入 KEY',
  verifyLogin: '登录',
  loginBusy: '登录中…',
  loginTitle: 'KEY 登录',
  loginHint: '输入账号 KEY 后登录。',
  loginError: '此 KEY 不存在或者已过期！',
  accountTitle: '我的账号',
  accountKey: '当前账号',
  accountExpiryLabel: '剩余有效期',
  accountExpiry: (timestamp, now) => timestamp === -1
    ? '永不过期'
    : `${Math.max(0, Math.ceil((timestamp + 7 * 86_400_000 - now) / 86_400_000))} 天`,
  logout: '退出登录',
  navAccount: '我的账号',
};

const EN: QuotaCopy = {
  dailyNote: (n) => n === -1 ? '(free on-site AI · unlimited)' : `(free on-site AI · ${n} per day)`,
  statusBuiltin: (model, n) =>
    n === -1 || n >= 1000
      ? `Current AI: ${model} (free on-site AI · unlimited)`
      : `Current AI: ${model} (free on-site AI · ${n} per day)`,
  statusVip: (model, n) =>
    n > 0 ? `Current AI: ${model} (VIP · ${n} per day)` : `Current AI: ${model} (VIP · unlimited)`,
  statusUser: (model) => `Current AI: ${model} (your key · unlimited)`,
  statusHint: '— switch to your own key via ⚙, top right.',
  statusHintUser: '— replace or test it via ⚙, top right.',
  activeBuiltin: (model, n) => n === -1 ? `Current AI: ${model} (free on-site AI · unlimited)` : `Current AI: ${model} (free on-site AI · ${n} per day)`,
  activeUser: (model) => `Current AI: ${model} (your key · unlimited)`,
  wallTitle: "You've used today's free follow-ups",
  wallBody: (n, scope) =>
    scope === 'account'
      ? `The built-in AI allows ${n} free follow-ups per account per day, resetting at 00:00 UTC. Add your own API key, or buy a traffic pack to keep asking.`
      : `The built-in AI allows ${n} free follow-ups per IP per day, resetting at 00:00 UTC. Add your own API key, or buy a traffic pack to keep asking.`,
  packsTitle: 'Traffic packs',
  packAsks: (n) => `${n} follow-ups`,
  buy: 'Buy',
  ownKeyHint: 'Use your own API key for unlimited asks — ⚙ AI settings, top right.',
  ownKeyNote: 'Switch to your own key and there is no limit. It stays in this browser and is never uploaded.',
  noAiHint: 'Current AI: none — add a key below to start asking',
  noAiStatus: 'AI is not configured — click to add a key',
  payStub: 'Payments are not live yet (phase-1 stub) — we noted your interest.',
  packAdded: (n) => `Noted (stub — no real charge); ${n} follow-ups added to your account.`,
  payTitle: (priceCny, asks) => `Alipay scan · ¥${priceCny} / ${asks} asks`,
  payScan: 'Scan with Alipay; credits land automatically after payment (keep this page open, up to 3 min).',
  payWaiting: 'Waiting for payment…',
  payOk: (n) => `Paid — ${n} asks added to your account.`,
  payClosed: 'Order closed or timed out. No money was taken; you can order again.',
  payFailed: (detail) => `Checkout failed: ${detail}`,
  payNotConfigured: 'Payment is not set up yet (missing Alipay merchant credentials).',
  langToggle: '中文',
  loginRequired: 'Sign in to buy a traffic pack — the credits go to your account.',
  loginCta: 'Sign in',
  keyLabel: 'KEY',
  keyPlaceholder: 'Enter your KEY',
  verifyLogin: 'Sign in',
  loginBusy: 'Signing in…',
  loginTitle: 'Sign in with KEY',
  loginHint: 'Enter your account KEY to sign in.',
  loginError: 'This KEY does not exist or has expired.',
  accountTitle: 'My account',
  accountKey: 'Account',
  accountExpiryLabel: 'Validity remaining',
  accountExpiry: (timestamp, now) => timestamp === -1
    ? 'Never expires'
    : `${Math.max(0, Math.ceil((timestamp + 7 * 86_400_000 - now) / 86_400_000))} days`,
  logout: 'Sign out',
  navAccount: 'My account',
};

export const QUOTA_COPY: Record<Lang, QuotaCopy> = { zh: ZH, en: EN };

/** 套餐展示名（中文界面） */
export function packName(pack: TrafficPack, copy: QuotaCopy): string {
  return copy.packAsks(pack.asks);
}
