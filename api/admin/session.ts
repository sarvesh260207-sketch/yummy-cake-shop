export default async function handler(req: any, res: any) {
  if (req.method === 'DELETE') return res.status(200).json({ ok: true });
  return res.status(200).json({ ok: true });
}
