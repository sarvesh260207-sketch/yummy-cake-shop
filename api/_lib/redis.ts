// Minimal Upstash Redis REST client (works with Vercel's Upstash/KV integration).
// Accepts either UPSTASH_REDIS_REST_* or KV_REST_API_* variable names.

type Cmd = (string | number)[];

// Vercel's storage setup can add a custom prefix (e.g. STORAGE_KV_REST_API_URL),
// so match by suffix instead of requiring one exact name.
function findEnv(suffixes: string[]): string | undefined {
  for (const [k, v] of Object.entries(process.env)) {
    if (v && suffixes.some((s) => k === s || k.endsWith(`_${s}`))) return v;
  }
  return undefined;
}

function cfg() {
  const url = findEnv(['UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL']);
  const token = findEnv(['UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_TOKEN']);
  if (!url || !token) throw new Error('Redis is not configured');
  return { url: url.replace(/\/$/, ''), token };
}

export function redisConfigured(): boolean {
  return !!(findEnv(['UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL']) && findEnv(['UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_TOKEN']));
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
