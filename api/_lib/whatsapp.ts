const GRAPH_VERSION = 'v21.0';

export type OrderItem = { name: string; weight?: string; qty: number; price: number };

export function whatsappConfigured(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

// WhatsApp template variables cannot contain newlines/tabs or long runs of spaces
const clean = (v: unknown, max: number) =>
  String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, max);

async function sendTemplate(to: string, name: string, lang: string, components: unknown[]) {
  try {
    const r = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name, language: { code: lang }, components },
      }),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('WhatsApp API error', r.status, JSON.stringify(data));
      return { ok: false as const, error: data?.error?.message || 'WhatsApp API error' };
    }
    return { ok: true as const, messageId: data?.messages?.[0]?.id as string | undefined };
  } catch (err) {
    console.error('WhatsApp request failed', err);
    return { ok: false as const, error: 'Could not reach WhatsApp' };
  }
}

export async function sendOrderConfirmation(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  mode: string;
  address: string;
  deliveryTime: string;
  items: OrderItem[];
  total: number;
}) {
  if (!whatsappConfigured()) return { ok: false as const, error: 'WhatsApp not configured' };
  const itemsText = order.items
    .map((i, n) => `${n + 1}. ${clean(i.name, 60)}${i.weight ? ` (${clean(i.weight, 20)})` : ''} x${i.qty}`)
    .join('; ')
    .slice(0, 600);
  const where =
    order.mode === 'Pickup'
      ? `Pickup from Yummy Cake Shop, GST Road, Chromepet by ${clean(order.deliveryTime, 20)}`
      : `Delivery to ${clean(order.address, 150)} by ${clean(order.deliveryTime, 20)}`;
  const params = [clean(order.customerName, 40), clean(order.id, 20), itemsText, String(Math.round(order.total)), where];
  return sendTemplate(
    order.customerPhone,
    process.env.WHATSAPP_TEMPLATE_NAME || 'order_confirmation',
    process.env.WHATSAPP_TEMPLATE_LANG || 'en',
    [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }]
  );
}

// Meta "Authentication" templates: the code goes in the body AND the copy-code button
export async function sendOtp(to: string, code: string) {
  if (!whatsappConfigured()) return { ok: false as const, error: 'WhatsApp not configured' };
  return sendTemplate(
    to,
    process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'admin_login_otp',
    process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'en',
    [
      { type: 'body', parameters: [{ type: 'text', text: code }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
    ]
  );
}
