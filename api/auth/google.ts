import { customerSessionCookie, parseBody } from '../_lib/auth.js';
import { redis, redisConfigured } from '../_lib/redis.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ ok: false, error: 'Google sign-in is not configured yet' });

  try {
    const credential = String(parseBody(req).credential || '');
    if (!credential || credential.length > 10000) return res.status(400).json({ ok: false, error: 'Missing Google credential' });

    const verify = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verify.ok) return res.status(401).json({ ok: false, error: 'Google sign-in could not be verified' });
    const claims: any = await verify.json();
    const issuerOk = claims.iss === 'accounts.google.com' || claims.iss === 'https://accounts.google.com';
    const expiryOk = Number(claims.exp) * 1000 > Date.now();
    if (claims.aud !== clientId || !issuerOk || !expiryOk || claims.email_verified !== 'true' || !claims.sub || !claims.email) {
      return res.status(401).json({ ok: false, error: 'Google account verification failed' });
    }

    const user = {
      sub: String(claims.sub),
      email: String(claims.email).toLowerCase(),
      name: String(claims.name || claims.given_name || claims.email),
      picture: String(claims.picture || ''),
    };
    if (redisConfigured()) {
      await redis(['SET', `user:${user.sub}`, JSON.stringify({ ...user, lastLoginAt: new Date().toISOString() })]);
      await redis(['ZADD', 'users:index', Date.now(), user.sub]);
    }
    res.setHeader('Set-Cookie', customerSessionCookie(user));
    return res.status(200).json({ ok: true, user });
  } catch (err) {
    console.error('Google sign-in error', err);
    return res.status(500).json({ ok: false, error: 'Could not complete Google sign-in' });
  }
}
