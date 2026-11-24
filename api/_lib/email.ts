// Email OTP through Brevo's transactional email API (free plan: 300 emails/day).
// Docs: POST https://api.brevo.com/v3/smtp/email with an "api-key" header.

export function emailConfigured(): boolean {
  return !!(process.env.BREVO_API_KEY && process.env.ADMIN_EMAIL && process.env.BREVO_SENDER_EMAIL);
}

export async function sendEmailOtp(code: string) {
  if (!emailConfigured()) return { ok: false as const, error: 'Email is not configured' };
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY as string,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: process.env.BREVO_SENDER_NAME || 'Yummy Cakes', email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email: process.env.ADMIN_EMAIL }],
        subject: 'Your Yummy Cakes admin login code',
        textContent: `Your admin login code is ${code}\n\nIt is valid for 5 minutes. If you did not request it, ignore this email.`,
        htmlContent:
          `<div style="font-family:Arial,sans-serif;max-width:420px">` +
          `<h2 style="margin:0 0 8px">🎂 Yummy Cakes admin</h2>` +
          `<p>Your login code is:</p>` +
          `<p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:8px 0">${code}</p>` +
          `<p style="color:#666">Valid for 5 minutes. If you did not request this, ignore this email.</p></div>`,
      }),
    });
    const d: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('Brevo error', r.status, JSON.stringify(d));
      return { ok: false as const, error: String(d?.message || 'Email provider error') };
    }
    return { ok: true as const, messageId: d?.messageId as string | undefined };
  } catch (err) {
    console.error('Brevo request failed', err);
    return { ok: false as const, error: 'Could not reach the email provider' };
  }
}
