import { missingConfig, adminEmail, clientIp, hashOtp, normalizeEmail, parseBody, rateLimited, safeEqual, sessionCookie } from '../_lib/auth.js';
import { redis } from '../_lib/redis.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (missingConfig().length) {
    return res.status(503).json({ ok: false, error: `Admin login is not configured. Missing: ${missingConfig().join(', ')}` });
  }
  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    const code = String(body.code ?? '').replace(/\D/g, '');
    if (!email || code.length !== 6) return res.status(400).json({ ok: false, error: 'Enter a valid email and the 6-digit code' });

    // At most 5 guesses per 10 minutes per number and per IP
    if ((await rateLimited(`otpv-email:${email}`, 5, 600)) || (await rateLimited(`otpv-ip:${clientIp(req)}`, 10, 600))) {
      return res.status(429).json({ ok: false, error: 'Too many wrong attempts. Try again in 10 minutes.' });
    }

    const stored = email === adminEmail() ? await redis(['GET', `otp:${email}`]) : null;
    if (!stored || !safeEqual(String(stored), hashOtp(email, code))) {
      return res.status(401).json({ ok: false, error: 'Invalid or expired code' });
    }

    await redis(['DEL', `otp:${email}`]); // one-time use
    res.setHeader('Set-Cookie', sessionCookie(email));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('otp-verify error', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
