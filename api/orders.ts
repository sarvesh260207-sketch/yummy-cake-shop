import { clientIp, getCustomer, normalizePhone, parseBody, rateLimited } from './_lib/auth.js';
import { redis, redisConfigured } from './_lib/redis.js';
import { sendOrderConfirmation, type OrderItem } from './_lib/whatsapp.js';

const ORDER_TTL = 60 * 60 * 24 * 90;
const str = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max);

export default async function handler(req: any, res: any) {
  if (!redisConfigured()) return res.status(503).json({ ok: false, error: 'Order system is not configured' });
  const customer = getCustomer(req);

  if (req.method === 'GET') {
    if (!customer) return res.status(401).json({ ok: false, error: 'Sign in with Google to view your orders' });
    try {
      const id = String(req.query?.id || '').trim();
      if (id) {
        if (!/^YCS-\d{6}$/.test(id)) return res.status(400).json({ ok: false, error: 'Enter a valid order ID' });
        const raw = await redis(['GET', `order:${id}`]);
        if (!raw) return res.status(404).json({ ok: false, error: 'Order not found' });
        const order = JSON.parse(raw);
        if (order.customerId !== customer.sub) return res.status(404).json({ ok: false, error: 'Order not found in this Google account' });
        return res.status(200).json({ ok: true, order });
      }
      const ids: string[] = (await redis(['ZREVRANGE', 'orders:index', 0, 9999])) || [];
      const rows: (string | null)[] = ids.length ? await redis(['MGET', ...ids.map((orderId) => `order:${orderId}`)]) : [];
      const orders = rows.filter((r): r is string => !!r).map((r) => JSON.parse(r)).filter((order) => order.customerId === customer.sub);
      return res.status(200).json({ ok: true, orders });
    } catch (err) {
      console.error('customer order lookup error', err);
      return res.status(500).json({ ok: false, error: 'Could not load your orders right now' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!customer) return res.status(401).json({ ok: false, error: 'Sign in with Google before placing an order' });

  try {
    const b = parseBody(req);
    const phone = normalizePhone(b.customerPhone);
    const name = str(b.customerName || customer.name, 60);
    const mode = b.mode === 'Pickup' ? 'Pickup' : 'Delivery';
    const address = str(b.address, 200);
    const deliveryTime = str(b.deliveryTime, 20);
    if (!phone || !name) return res.status(400).json({ ok: false, error: 'Valid name and phone number required' });
    if (mode === 'Delivery' && !address) return res.status(400).json({ ok: false, error: 'Delivery address is required' });
    if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 30) return res.status(400).json({ ok: false, error: 'Invalid items' });

    const items: OrderItem[] = b.items.map((i: any) => ({
      name: str(i?.name, 80),
      weight: str(i?.weight, 30),
      qty: Math.min(50, Math.max(1, Math.floor(Number(i?.qty) || 1))),
      price: Math.min(100000, Math.max(0, Number(i?.price) || 0)),
    }));
    if (items.some((i) => !i.name)) return res.status(400).json({ ok: false, error: 'Invalid items' });
    const total = Math.min(500000, Math.max(0, Math.round(Number(b.total) || 0)));

    if ((await rateLimited(`order-ip:${clientIp(req)}`, 10, 600)) || (await rateLimited(`order-user:${customer.sub}`, 5, 600))) {
      return res.status(429).json({ ok: false, error: 'Too many orders. Please try again shortly.' });
    }

    const sequence = Number(await redis(['INCR', 'orders:sequence']));
    if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error('Could not allocate order number');
    const id = `YCS-${String(sequence).padStart(6, '0')}`;
    const now = new Date().toISOString();
    const order = {
      id,
      customerId: customer.sub,
      customerEmail: customer.email,
      customerGoogleName: customer.name,
      customerName: name,
      customerPhone: phone,
      mode,
      address,
      deliveryTime,
      items,
      total,
      status: 'Received',
      createdAt: now,
      updatedAt: now,
      history: [{ status: 'Received', at: now }],
      whatsappSent: false,
    };

    const saved = await redis(['SET', `order:${id}`, JSON.stringify(order), 'NX', 'EX', ORDER_TTL]);
    if (saved !== 'OK') return res.status(503).json({ ok: false, error: 'Could not reserve your order number. Please try again.' });
    const indexed = await redis(['ZADD', 'orders:index', Date.now(), id]);
    if (Number(indexed) !== 1) {
      await redis(['DEL', `order:${id}`]).catch(() => {});
      return res.status(503).json({ ok: false, error: 'Order could not be added to the shop order list. Please try again.' });
    }

    const wa = await sendOrderConfirmation(order);
    if (wa.ok) {
      order.whatsappSent = true;
      await redis(['SET', `order:${id}`, JSON.stringify(order), 'XX', 'KEEPTTL']).catch(() => {});
    }
    return res.status(200).json({ ok: true, orderId: id, whatsappSent: wa.ok });
  } catch (err) {
    console.error('orders error', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
