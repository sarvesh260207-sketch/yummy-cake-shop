import { safeEqual, clientIp, parseBody, rateLimited, sessionCookie, adminEmail } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12 || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 || !adminEmail()) {
    return res.status(503).json({ ok: false, error: 'Admin password login is not configured. Set ADMIN_PASSWORD (12+ characters), ADMIN_EMAIL, and SESSION_SECRET.' });
  }

  try {
    if (await rateLimited(`admin-login-ip:${clientIp(req)}`, 8, 600)) {
      return res.status(429).json({ ok: false, error: 'Too many attempts. Please wait 10 minutes and try again.' });
    }

    const submitted = String(parseBody(req).password ?? '');
    if (!submitted || !safeEqual(submitted, password)) {
      return res.status(401).json({ ok: false, error: 'Incorrect password.' });
    }

    res.setHeader('Set-Cookie', sessionCookie(adminEmail()!));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('admin password login error', err);
    return res.status(500).json({ ok: false, error: 'Server error. Please try again.' });
  }
}
