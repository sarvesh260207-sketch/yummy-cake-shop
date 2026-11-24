import { clearCookie, isAdmin } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie());
    return res.status(200).json({ ok: true });
  }
  return res.status(200).json({ ok: isAdmin(req) });
}
