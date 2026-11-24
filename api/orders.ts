// Public endpoint: the website posts a new order here. We store it and
// send the customer their WhatsApp confirmation.
import { clientIp, normalizePhone, parseBody, rateLimited } from './_lib/auth.js';
import { redis, redisConfigured } from './_lib/redis.js';
import { sendOrderConfirmation, type OrderItem } from './_lib/whatsapp.js';

const ORDER_TTL = 60 * 60 * 24 * 90; // keep orders for 90 days

// eslint-disable-next-line no-control-regex
const str = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max);

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const id = String(req.query?.id || '').trim();
      const phone = normalizePhone(req.query?.phone);
      if (!/^YCS-\d{4,8}$/.test(id) || !phone) {
        return res.status(400).json({ ok: false, error: 'Enter a valid order ID and the phone number used at checkout' });
      }
      if ((await rateLimited(`customer-order-ip:${clientIp(req)}`, 30, 600)) ||
          (await rateLimited(`customer-order-phone:${phone}`, 20, 600))) {
        return res.status(429).json({ ok: false, error: 'Too many lookup attempts. Please try again later.' });
      }
      const raw = await redis(['GET', `order:${id}`]);
      if (!raw) return res.status(404).json({ ok: false, error: 'Order not found. Check the order ID and try again.' });
      const order = JSON.parse(raw);
      if (order.customerPhone !== phone) return res.status(404).json({ ok: false, error: 'Order not found. Check the order ID and phone number.' });
      return res.status(200).json({ ok: true, order: {
        id: order.id, customerName: order.customerName, items: order.items, total: order.total,
        mode: order.mode, deliveryTime: order.deliveryTime, status: order.status,
        createdAt: order.createdAt, updatedAt: order.updatedAt, history: order.history || []
      }});
    } catch (err) {
      console.error('customer order lookup error', err);
      return res.status(500).json({ ok: false, error: 'Could not load this order right now. Please try again.' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!redisConfigured()) return res.status(503).json({ ok: false, error: 'Order system is not configured' });

  try {
    const b = parseBody(req);
    const phone = normalizePhone(b.customerPhone);
    const name = str(b.customerName, 60);
    const mode = b.mode === 'Pickup' ? 'Pickup' : 'Delivery';
    if (!phone || !name) return res.status(400).json({ ok: false, error: 'Valid name and phone number required' });

    if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 30) {
      return res.status(400).json({ ok: false, error: 'Invalid items' });
    }
    const items: OrderItem[] = b.items.map((i: any) => ({
      name: str(i?.name, 80),
      weight: str(i?.weight, 30),
      qty: Math.min(50, Math.max(1, Math.floor(Number(i?.qty) || 1))),
      price: Math.min(100000, Math.max(0, Number(i?.price) || 0)),
    }));
    if (items.some((i) => !i.name)) return res.status(400).json({ ok: false, error: 'Invalid items' });
    const total = Math.min(500000, Math.max(0, Math.round(Number(b.total) || 0)));

    if ((await rateLimited(`order-ip:${clientIp(req)}`, 10, 600)) || (await rateLimited(`order-phone:${phone}`, 5, 600))) {
      return res.status(429).json({ ok: false, error: 'Too many orders. Please try again shortly.' });
    }

    // Use the website's order id if it is free, otherwise generate a new one
    let id = /^YCS-\d{4,8}$/.test(String(b.orderId)) ? String(b.orderId) : '';
    const now = new Date().toISOString();
    const base = {
      customerName: name,
      customerPhone: phone,
      mode,
      address: str(b.address, 200),
      deliveryTime: str(b.deliveryTime, 20),
      items,
      total,
      status: 'Received',
      createdAt: now,
      updatedAt: now,
      history: [{ status: 'Received', at: now }],
      whatsappSent: false,
    };

    let saved = false;
    for (let attempt = 0; attempt < 6 && !saved; attempt++) {
      if (!id) id = 'YCS-' + Math.floor(100000 + Math.random() * 900000);
      const ok = await redis(['SET', `order:${id}`, JSON.stringify({ id, ...base }), 'NX', 'EX', ORDER_TTL]);
      if (ok === 'OK') saved = true;
      else id = '';
    }
    if (!saved) return res.status(500).json({ ok: false, error: 'Could not save order' });
    const indexed = await redis(['ZADD', 'orders:index', Date.now(), id]);
    if (Number(indexed) < 1) {
      await redis(['DEL', `order:${id}`]).catch(() => {});
      return res.status(503).json({ ok: false, error: 'Order could not be added to the shop order list. Please try again.' });
    }

    const wa = await sendOrderConfirmation({ id, ...base });
    if (wa.ok) {
      await redis(['SET', `order:${id}`, JSON.stringify({ id, ...base, whatsappSent: true }), 'XX', 'KEEPTTL']).catch(() => {});
    }
    return res.status(200).json({ ok: true, orderId: id, whatsappSent: wa.ok });
  } catch (err) {
    console.error('orders error', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
