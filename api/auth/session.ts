import { clearCookie, getCustomer } from '../_lib/auth.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie('ycs_customer'));
    return res.status(200).json({ ok: true });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  return res.status(200).json({ ok: true, user: getCustomer(req) });
}
