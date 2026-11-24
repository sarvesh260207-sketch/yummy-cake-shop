import { randomInt } from 'node:crypto';
import { missingConfig, adminPhone, clientIp, hashOtp, normalizePhone, parseBody, rateLimited } from '../_lib/auth.js';
import { redis, redisConfigured } from '../_lib/redis.js';
import { emailConfigured, sendEmailOtp } from '../_lib/email.js';
import { sendSmsOtp, smsConfigured } from '../_lib/sms.js';
import { sendOtp } from '../_lib/whatsapp.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (missingConfig().length) {
    return res.status(503).json({ ok: false, error: `Admin login is not configured. Missing: ${missingConfig().join(', ')}` });
  }
  try {
    const phone = normalizePhone(parseBody(req).phone);
    if (!phone) return res.status(400).json({ ok: false, error: 'Enter a valid 10-digit mobile number' });

    if ((await rateLimited(`otp-ip:${clientIp(req)}`, 6, 600)) || (await rateLimited(`otp-phone:${phone}`, 3, 600))) {
      return res.status(429).json({ ok: false, error: 'Too many attempts. Try again in 10 minutes.' });
    }

    // Only the admin number gets a code. Every other number receives the same
    // response, so nobody can discover which number is the admin.
    if (phone === adminPhone()) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await redis(['SET', `otp:${phone}`, hashOtp(phone, code), 'EX', 300]);
      // Channel: OTP_CHANNEL (email | sms | whatsapp) or, if unset, the first one configured
      const channel = process.env.OTP_CHANNEL || (emailConfigured() ? 'email' : smsConfigured() ? 'sms' : 'whatsapp');
      const sent =
        channel === 'email' ? await sendEmailOtp(code)
        : channel === 'sms' ? await sendSmsOtp(phone, code)
        : await sendOtp(phone, code);
      if (!sent.ok) {
        console.error('OTP send failed:', sent.error);
        return res.status(502).json({ ok: false, error: 'Could not send the code. Please try again.' });
      }
    }
    return res.status(200).json({ ok: true, message: 'If this number is authorised, a code has been sent.' });
  } catch (err) {
    console.error('otp-request error', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
