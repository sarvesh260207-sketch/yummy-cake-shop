import { randomInt } from 'node:crypto';
import { missingConfig, adminEmail, clientIp, hashOtp, normalizeEmail, parseBody, rateLimited } from '../_lib/auth.js';
import { redis } from '../_lib/redis.js';
import { emailConfigured, sendEmailOtp } from '../_lib/email.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (missingConfig().length) {
    return res.status(503).json({ ok: false, error: `Admin login is not configured. Missing: ${missingConfig().join(', ')}` });
  }
  try {
    const email = normalizeEmail(parseBody(req).email);
    if (!email) return res.status(400).json({ ok: false, error: 'Enter a valid email address' });

    if ((await rateLimited(`otp-ip:${clientIp(req)}`, 6, 600)) || (await rateLimited(`otp-email:${email}`, 3, 600))) {
      return res.status(429).json({ ok: false, error: 'Too many attempts. Try again in 10 minutes.' });
    }

    // Only the configured admin email receives a code.
    if (email === adminEmail()) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await redis(['SET', `otp:${email}`, hashOtp(email, code), 'EX', 300]);
      // Channel: OTP_CHANNEL (email | sms | whatsapp) or, if unset, the first one configured
      const sent = await sendEmailOtp(code, email);
      if (!sent.ok) {
        console.error('OTP send failed:', sent.error);
        return res.status(502).json({ ok: false, error: 'Could not send the code. Please try again.' });
      }
    }
    return res.status(200).json({ ok: true, message: 'If this email is authorised, a code has been sent.' });
  } catch (err) {
    console.error('otp-request error', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
