import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { resolveDailyLimit } from './quota';
import {
  bucketUser,
  bump,
  refund as refundBucket,
  stateDir,
  usedIn,
  utcDay,
} from './quotaStore';
import { keyUserIdFor } from './keyAuth';

/**
 * 账户 / 会话 / 订单的**本地存储**（单机 JSON 文件）。
 *
 * 落盘位置在 `ZIWEI_STATE_DIR`（默认 cwd/.data）：
 *   · users.json    —— 用户（按 userId 索引）
 *   · sessions.json —— 会话 token
 *   · orders.json   —— 流量包订单（stub）
 *
 * 结构刻意保持「一张表一个文件、字段直白」，以后换 SQLite/Postgres 时
 * 只需替换本文件的读写实现，上层 API 契约不变。
 *
 * ponytail: 单机单进程够用（同步 fs，进程内原子）；多实例部署换数据库 + 共享 session store。
 */

/** 用户记录 */
export interface User {
  id: string;
  email: string;
  createdAt: string;
  /** 流量包剩余追问次数 */
  packBalance: number;
}

/** 订单 —— 真实支付（支付宝当面付）：pending → paid / closed；'stub' 是历史遗留 */
export interface Order {
  id: string;
  userId: string;
  packId: string;
  /** 这单买了多少次追问 */
  asks: number;
  priceCny: number;
  priceUsd: number;
  createdAt: string;
  status: 'stub' | 'pending' | 'paid' | 'closed';
  /** 支付宝流水号（支付成功后回填） */
  tradeNo?: string;
  paidAt?: string;
}

/** 会话 */
export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

/** 会话有效期：30 天 */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// ── 文件读写 ────────────────────────────────────────────────────────

function file(name: string): string {
  return path.join(stateDir(), name);
}

function readJson<T>(name: string, fallback: T): T {
  try {
    const v = JSON.parse(fs.readFileSync(file(name), 'utf8')) as T;
    return v && typeof v === 'object' ? v : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(name: string, value: unknown): void {
  const f = file(name);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(value, null, 2));
}

// ── 用户 ────────────────────────────────────────────────────────────

/** 邮箱归一化：去空格 + 小写 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * userId = 邮箱的 sha256 前 32 位。
 * 派生而非随机：同邮箱永远同 id，省掉一张 email → id 的索引表。
 */
export function userIdFor(email: string): string {
  return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex').slice(0, 32);
}

type UserTable = Record<string, User>;

function users(): UserTable {
  return readJson<UserTable>('users.json', {});
}

/** 按邮箱取用户（不存在返回 null） */
export function getUser(email: string): User | null {
  const u = users()[userIdFor(email)];
  return u ?? null;
}

/** 取用户，不存在就用该邮箱建一个（余额 0） */
export function ensureUser(email: string): User {
  const id = userIdFor(email);
  const table = users();
  const found = table[id];
  if (found) return found;
  const user: User = {
    id,
    email: normalizeEmail(email),
    createdAt: new Date().toISOString(),
    packBalance: 0,
  };
  table[id] = user;
  writeJson('users.json', table);
  return user;
}

/** KEY 登录沿用账户余额和会话；id 按 KEY 原样派生，保留大小写区分。 */
export function ensureKeyUser(key: string): User {
  const id = keyUserIdFor(key);
  const table = users();
  if (table[id]) return table[id];
  const user: User = {
    id,
    email: `KEY-${id.slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    packBalance: 0,
  };
  table[id] = user;
  writeJson('users.json', table);
  return user;
}

/** 给账户加追问次数（stub 下单成功后调用） */
export function addPackBalance(userId: string, asks: number): User {
  const table = users();
  const u = table[userId];
  if (!u) throw new Error(`用户不存在：${userId}`);
  u.packBalance = Math.max(0, u.packBalance + asks);
  table[userId] = u;
  writeJson('users.json', table);
  return u;
}

/** 取账户（按 id） */
export function getUserById(userId: string): User | null {
  return users()[userId] ?? null;
}

// ── 会话 ────────────────────────────────────────────────────────────

type SessionTable = Record<string, Session>;

function sessions(): SessionTable {
  return readJson<SessionTable>('sessions.json', {});
}

/** 为用户开一个会话，返回 token */
export function createSession(userId: string): Session {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const session: Session = {
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
  const table = sessions();
  table[token] = session;
  writeJson('sessions.json', table);
  return session;
}

/** 按 token 取会话对应用户；过期即删 */
export function getSessionUser(token: string | undefined | null): User | null {
  if (!token) return null;
  const table = sessions();
  const s = table[token];
  if (!s) return null;
  if (new Date(s.expiresAt).getTime() <= Date.now()) {
    delete table[token];
    writeJson('sessions.json', table);
    return null;
  }
  return getUserById(s.userId);
}

/** 注销：删会话 */
export function destroySession(token: string | undefined | null): void {
  if (!token) return;
  const table = sessions();
  if (!table[token]) return;
  delete table[token];
  writeJson('sessions.json', table);
}

// ── 订单 ────────────────────────────────────────────────────────────

type OrderTable = Record<string, Order>;

function orders(): OrderTable {
  return readJson<OrderTable>('orders.json', {});
}

/** 记一笔待支付订单（真实支付：付成功了才加额度，见 markOrderPaid） */
export function createOrder(
  userId: string,
  pack: { id: string; asks: number; priceCny: number; priceUsd: number },
): Order {
  const table = orders();
  const order: Order = {
    id: `ord_${crypto.randomBytes(8).toString('hex')}`,
    userId,
    packId: pack.id,
    asks: pack.asks,
    priceCny: pack.priceCny,
    priceUsd: pack.priceUsd,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  table[order.id] = order;
  writeJson('orders.json', table);
  return order;
}

/** 按 id 取订单 */
export function getOrder(orderId: string): Order | undefined {
  return orders()[orderId];
}

/**
 * 支付成功 → 标记已支付并把额度入账。**幂等**：已是 paid 直接返回现状，
 * 轮询重复触发也只入账一次（收款路径的红线）。
 */
export function markOrderPaid(orderId: string, tradeNo: string): Order | undefined {
  const table = orders();
  const order = table[orderId];
  if (!order) return undefined;
  if (order.status === 'paid') return order;
  order.status = 'paid';
  order.tradeNo = tradeNo;
  order.paidAt = new Date().toISOString();
  table[order.id] = order;
  writeJson('orders.json', table);
  addPackBalance(order.userId, order.asks);
  return order;
}

/** 关单（超时未付 / 支付宝侧关闭） */
export function markOrderClosed(orderId: string): Order | undefined {
  const table = orders();
  const order = table[orderId];
  if (!order || order.status === 'paid') return order;
  order.status = 'closed';
  table[order.id] = order;
  writeJson('orders.json', table);
  return order;
}

/** 某用户的订单（最近在前） */
export function listOrders(userId: string, limit = 10): Order[] {
  return Object.values(orders())
    .filter((o) => o.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

// ── 账户额度 ────────────────────────────────────────────────────────

/** 已登录用户的免费额度：按 userId 每天 N 次（UTC 日），与 IP 计数分开 */
export function dailyLimit(): number {
  return resolveDailyLimit(process.env.ZIWEI_ASK_DAILY_LIMIT);
}

/** 扣次来源 —— 退款时按来源还回去 */
export type ChargeKind = 'free' | 'pack' | 'unlimited';

export interface ChargeResult {
  ok: true;
  kind: ChargeKind;
  /** 免费额度今天还剩几次 */
  freeRemaining: number;
  /** 流量包余额 */
  packRemaining: number;
}

export interface ChargeDenied {
  ok: false;
  /** 每日免费上限（用于出墙文案） */
  limit: number;
}

/**
 * 扣一次追问次数：**先免费日额 → 再流量包余额**。
 * 先占后还：失败时调 refundUserAsk 把同一次还回去。
 */
export function chargeUserAsk(userId: string): ChargeResult | ChargeDenied {
  const limit = dailyLimit();
  if (limit === -1) {
    return {
      ok: true,
      kind: 'unlimited',
      freeRemaining: -1,
      packRemaining: getUserById(userId)?.packBalance ?? 0,
    };
  }
  const bucket = bucketUser(userId);

  // 先免费日额（bump 内部判定到限即返回 null）
  const free = bump(bucket, utcDay(), limit);
  if (free) {
    return {
      ok: true,
      kind: 'free',
      freeRemaining: free.remaining,
      packRemaining: getUserById(userId)?.packBalance ?? 0,
    };
  }

  // 免费用尽 → 扣流量包余额
  const user = getUserById(userId);
  if (user && user.packBalance > 0) {
    addPackBalance(userId, -1);
    return {
      ok: true,
      kind: 'pack',
      freeRemaining: 0,
      packRemaining: user.packBalance - 1,
    };
  }

  return { ok: false, limit };
}

/** 退还一次扣次（按来源还） */
export function refundUserAsk(userId: string, kind: ChargeKind): void {
  if (kind === 'unlimited') return;
  if (kind === 'free') {
    refundBucket(bucketUser(userId));
    return;
  }
  addPackBalance(userId, 1);
}

/** 账户额度快照（给「我的额度」页） */
export function accountQuota(userId: string): {
  limit: number;
  used: number;
  remaining: number;
  packBalance: number;
} {
  const limit = dailyLimit();
  const used = usedIn(bucketUser(userId));
  return {
    limit,
    used,
    remaining: limit === -1 ? -1 : Math.max(0, limit - used),
    packBalance: getUserById(userId)?.packBalance ?? 0,
  };
}
