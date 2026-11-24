// SMS OTP through Fast2SMS (India).
//  - Default: "Quick SMS" route (route=q): free text, no DLT registration needed.
//  - Upgrade: set FAST2SMS_DLT_SENDER_ID + FAST2SMS_DLT_MESSAGE_ID to use your
//    DLT-approved OTP template instead (faster, no manual review).

export function smsConfigured(): boolean {
  return !!process.env.FAST2SMS_API_KEY;
}

export async function sendSmsOtp(phone: string, code: string) {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key) return { ok: false as const, error: 'SMS is not configured' };

  const number = phone.replace(/^91/, ''); // Fast2SMS wants 10-digit numbers
  const senderId = process.env.FAST2SMS_DLT_SENDER_ID;
  const messageId = process.env.FAST2SMS_DLT_MESSAGE_ID;

  const body = senderId && messageId
    ? { route: 'dlt', sender_id: senderId, message: messageId, variables_values: code, numbers: number }
    : {
        route: 'q',
        message: `Yummy Cakes admin login code: ${code}. Valid for 5 minutes. Do not share it with anyone.`,
        numbers: number,
      };

  try {
    const r = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d: any = await r.json().catch(() => ({}));
    if (d.return !== true) {
      console.error('Fast2SMS error', r.status, d.status_code, JSON.stringify(d.message));
      return { ok: false as const, error: String(d.message?.[0] ?? d.message ?? 'SMS provider error') };
    }
    const held = Array.isArray(d.message) && d.message.join(' ').toLowerCase().includes('approval');
    if (held) console.warn('Fast2SMS is holding this OTP for manual approval (Quick SMS review)');
    return { ok: true as const, held };
  } catch (err) {
    console.error('Fast2SMS request failed', err);
    return { ok: false as const, error: 'Could not reach the SMS provider' };
  }
}
