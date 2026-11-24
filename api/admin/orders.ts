import { isAdmin, parseBody } from '../_lib/auth.js';
import { redis, redisConfigured } from '../_lib/redis.js';

export const STATUSES = ['Received', 'Confirmed', 'Cooking', 'Decorating', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled'];

export default async function handler(req: any, res: any) {
  if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'Not signed in' });
  if (!redisConfigured()) return res.status(503).json({ ok: false, error: 'Database not configured' });

  try {
    if (req.method === 'GET') {
      const ids: string[] = (await redis(['ZREVRANGE', 'orders:index', 0, 199])) || [];
      const rows: (string | null)[] = ids.length ? await redis(['MGET', ...ids.map((id) => `order:${id}`)]) : [];
      const orders = rows.filter((r): r is string => !!r).map((r) => JSON.parse(r));
      return res.status(200).json({ ok: true, orders });
    }

    if (req.method === 'PATCH') {
      const { id, status } = parseBody(req);
      if (!/^YCS-\d{4,8}$/.test(String(id)) || !STATUSES.includes(status)) {
        return res.status(400).json({ ok: false, error: 'Invalid order or status' });
      }
      const raw = await redis(['GET', `order:${id}`]);
      if (!raw) return res.status(404).json({ ok: false, error: 'Order not found' });
      const order = JSON.parse(raw);
      if (order.status !== status) {
        const at = new Date().toISOString();
        order.status = status;
        order.updatedAt = at;
        order.history = [...(order.history || []), { status, at }];
        await redis(['SET', `order:${id}`, JSON.stringify(order), 'XX', 'KEEPTTL']);
      }
      return res.status(200).json({ ok: true, order });
    }

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('admin orders error', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
