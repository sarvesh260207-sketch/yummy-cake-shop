import { createHmac, timingSafeEqual } from 'node:crypto';
import { emailConfigured } from './email.js';
import { redis, redisConfigured } from './redis.js';
import { smsConfigured } from './sms.js';
import { whatsappConfigured } from './whatsapp.js';

export const COOKIE_NAME = 'ycs_admin';
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

// Accepts 10-digit Indian mobiles or 91 + 10 digits; returns "91XXXXXXXXXX"
export function normalizePhone(raw: unknown): string | null {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(d)) return `91${d}`;
  if (/^91[6-9]\d{9}$/.test(d)) return d;
  return null;
}

export function sessionCookie(email: string): string {
  const payload = Buffer.from(JSON.stringify({ e: email, exp: Date.now() + SESSION_HOURS * 3600_000 })).toString('base64url');
  const token = `${payload}.${hmac(payload)}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`;
}

export const clearCookie = () => `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;

export function isAdmin(req: any): boolean {
  try {
    const cookies = String(req.headers?.cookie || '').split(';').map((c) => c.trim());
    const raw = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
    if (!raw) return false;
    const [payload, sig] = raw.split('.');
    if (!payload || !sig || !safeEqual(sig, hmac(payload))) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() && data.e === adminEmail();
  } catch {
    return false;
  }
}

export function clientIp(req: any): string {
  return String(req.headers?.['x-forwarded-for'] || 'unknown').split(',')[0].trim();
}

// Returns true when the caller has exceeded `max` hits within `windowSec`
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

// Names of required settings that are missing (never values)
export function missingConfig(): string[] {
  const m: string[] = [];
  if (!redisConfigured()) m.push('Redis database (Upstash) variables');
  if (!adminEmail()) m.push('ADMIN_EMAIL (valid email address)');
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) m.push('SESSION_SECRET (32+ characters)');
  if (!emailConfigured() && !smsConfigured() && !whatsappConfigured()) {
    const miss = ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'ADMIN_EMAIL'].filter((k) => !process.env[k]);
    m.push(`login-code delivery (${miss.join(', ')})`);
  }
  return m;
}
