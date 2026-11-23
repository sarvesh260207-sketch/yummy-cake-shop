// Vercel serverless function: sends a WhatsApp order-confirmation message
// through the official WhatsApp Cloud API (Meta). Secrets live in Vercel
// environment variables and are never exposed to the browser.

const GRAPH_VERSION = 'v21.0';

type OrderItem = { name: string; weight?: string; qty: number; price: number };

// Best-effort rate limit (in-memory; resets when the serverless instance recycles)
const hits = new Map<string, number[]>();
function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

function normalizeIndianNumber(raw: string): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits;
  return null;
}

// WhatsApp template variables cannot contain newlines/tabs or long runs of spaces
const clean = (v: unknown, max: number) =>
  String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, max);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'order_confirmation';
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'en';

  if (!token || !phoneNumberId) {
    return res.status(500).json({ ok: false, error: 'WhatsApp is not configured on the server' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { orderId, customerName, customerPhone, mode, address, deliveryTime, items, total } = body;

  const to = normalizeIndianNumber(customerPhone);
  if (!to) return res.status(400).json({ ok: false, error: 'Invalid phone number' });
  if (!orderId || !customerName || !Array.isArray(items) || items.length === 0 || items.length > 30) {
    return res.status(400).json({ ok: false, error: 'Invalid order data' });
  }

  // Abuse protection: limit per visitor IP and per destination number
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  if (rateLimited(`ip:${ip}`, 5, 10 * 60_000) || rateLimited(`to:${to}`, 3, 10 * 60_000)) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  }

  const itemsText = (items as OrderItem[])
    .map((i, n) => `${n + 1}. ${clean(i.name, 60)}${i.weight ? ` (${clean(i.weight, 20)})` : ''} x${Number(i.qty) || 1}`)
    .join('; ')
    .slice(0, 600);

  const whereLine =
    mode === 'Pickup'
      ? `Pickup from Yummy Cake Shop, GST Road, Chromepet by ${clean(deliveryTime, 20)}`
      : `Delivery to ${clean(address, 150)} by ${clean(deliveryTime, 20)}`;

  // Template body variables, in order: {{1}}..{{5}}
  const params = [
    clean(customerName, 40),
    clean(orderId, 20),
    itemsText,
    String(Math.round(Number(total) || 0)),
    whereLine,
  ];

  try {
    const r = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
        },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('WhatsApp API error', r.status, JSON.stringify(data));
      return res.status(502).json({ ok: false, error: data?.error?.message || 'WhatsApp API error' });
    }
    return res.status(200).json({ ok: true, messageId: data?.messages?.[0]?.id });
  } catch (err) {
    console.error('WhatsApp request failed', err);
    return res.status(502).json({ ok: false, error: 'Could not reach WhatsApp' });
  }
}
