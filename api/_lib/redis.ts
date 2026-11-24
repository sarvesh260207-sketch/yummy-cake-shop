// Minimal Upstash Redis REST client (works with Vercel's Upstash/KV integration).
// Accepts either UPSTASH_REDIS_REST_* or KV_REST_API_* variable names.

type Cmd = (string | number)[];

function cfg() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Redis is not configured');
  return { url: url.replace(/\/$/, ''), token };
}

export function redisConfigured(): boolean {
  return !!(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  );
}

export async function redis(cmd: Cmd): Promise<any> {
  const { url, token } = cfg();
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error || `Redis HTTP ${r.status}`);
  return d.result;
}

export async function redisPipeline(cmds: Cmd[]): Promise<any[]> {
  const { url, token } = cfg();
  const r = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  const d: any = await r.json().catch(() => []);
  if (!r.ok || !Array.isArray(d)) throw new Error(`Redis pipeline HTTP ${r.status}`);
  return d.map((x: any) => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}
