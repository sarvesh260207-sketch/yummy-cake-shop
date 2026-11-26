import { scryptSync, timingSafeEqual } from 'node:crypto';
import { adminSessionCookie, clientIp, parseBody, rateLimited } from '../_lib/auth.js';

function verifyPassword(password: string, encoded: string): boolean {
  const [scheme, salt, expectedHex] = encoded.split('$');
  if (scheme !== 'scrypt' || !salt || !expectedHex) return false;
  try {
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const username = String(process.env.ADMIN_USERNAME || '');
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '');
  if (!username || !passwordHash || !process.env.SESSION_SECRET) {
    return res.status(503).json({ ok: false, error: 'Admin login is not configured on the server' });
  }
  try {
    if (await rateLimited(`admin-login:${clientIp(req)}`, 8, 600)) {
      return res.status(429).json({ ok: false, error: 'Too many login attempts. Try again in 10 minutes.' });
    }
  } catch {
    return res.status(503).json({ ok: false, error: 'Login protection is temporarily unavailable' });
  }
  const body = parseBody(req);
  const suppliedUser = String(body.username || '');
  const suppliedPassword = String(body.password || '');
  if (suppliedUser !== username || !verifyPassword(suppliedPassword, passwordHash)) {
    return res.status(401).json({ ok: false, error: 'Incorrect username or password' });
  }
  res.setHeader('Set-Cookie', adminSessionCookie(username));
  return res.status(200).json({ ok: true, username });
}
