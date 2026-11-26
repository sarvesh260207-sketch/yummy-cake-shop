export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  return res.status(200).json({ ok: true, clientId });
}
