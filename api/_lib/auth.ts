import { createHmac, timingSafeEqual } from 'node:crypto';
import { emailConfigured } from './email.js';
import { redis, redisConfigured } from './redis.js';
import { smsConfigured } from './sms.js';
import { whatsappConfigured } from './whatsapp.js';

export const COOKIE_NAME = 'ycs_admin';
export const CUSTOMER_COOKIE_NAME = 'ycs_customer';
const SESSION_HOURS = 12;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set (32+ characters)');
  return s;
}

const hmac = (data: string) => createHmac('sha256', secret()).update(data).digest('base64url');

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function hashOtp(email: string, code: string): string {
  return hmac(`otp:${email}:${code}`);
}

export function normalizeEmail(raw: unknown): string | null {
  const email = String(raw ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export const adminEmail = (): string | null => normalizeEmail(process.env.ADMIN_EMAIL);

export function normalizePhone(raw: unknown): string | null {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(d)) return `91${d}`;
  if (/^91[6-9]\d{9}$/.test(d)) return d;
  return null;
}

function cookie(req: any, name: string): string | null {
  const header = String(req.headers?.cookie || '');
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function makeSessionCookie(name: string, payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + SESSION_HOURS * 3600_000 })).toString('base64url');
  const token = `${encoded}.${hmac(encoded)}`;
  return `${name}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_HOURS * 3600}`;
}

function readSession(req: any, name: string): Record<string, any> | null {
  try {
    const token = cookie(req, name);
    if (!token) return null;
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature || !safeEqual(hmac(encoded), signature)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || Number(payload.exp) < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function adminSessionCookie(username: string): string {
  return makeSessionCookie(COOKIE_NAME, { role: 'admin', username });
}

export function customerSessionCookie(user: { sub: string; email: string; name: string; picture?: string }): string {
  return makeSessionCookie(CUSTOMER_COOKIE_NAME, { role: 'customer', ...user });
}

export function clearCookie(name = COOKIE_NAME): string {
  return `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function isAdmin(req: any): boolean {
  const session = readSession(req, COOKIE_NAME);
  return !!session && session.role === 'admin' && session.username === process.env.ADMIN_USERNAME;
}

export function getCustomer(req: any): { sub: string; email: string; name: string; picture?: string } | null {
  const session = readSession(req, CUSTOMER_COOKIE_NAME);
  if (!session || session.role !== 'customer' || typeof session.sub !== 'string' || typeof session.email !== 'string') return null;
  return { sub: session.sub, email: session.email, name: String(session.name || session.email), picture: session.picture };
}

export function clientIp(req: any): string {
  return String(req.headers?.['x-forwarded-for'] || 'unknown').split(',')[0].trim();
}

export async function rateLimited(key: string, max: number, windowSec: number): Promise<boolean> {
  const k = `rl:${key}`;
  const n = Number(await redis(['INCR', k]));
  if (n === 1) await redis(['EXPIRE', k, windowSec]);
  return n > max;
}

export function parseBody(req: any): any {
  try {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return {};
  }
}

export function missingConfig(): string[] {
  const m: string[] = [];
  if (!redisConfigured()) m.push('Redis database (Upstash) variables');
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) m.push('Admin username/password configuration');
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) m.push('SESSION_SECRET (32+ characters)');
  if (!process.env.GOOGLE_CLIENT_ID) m.push('GOOGLE_CLIENT_ID');
  if (!emailConfigured() && !smsConfigured() && !whatsappConfigured()) {
    const miss = ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'ADMIN_EMAIL'].filter((k) => !process.env[k]);
    m.push(`login-code delivery (${miss.join(', ')})`);
  }
  return m;
}
