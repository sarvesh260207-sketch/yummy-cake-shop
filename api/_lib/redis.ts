import { createClient } from 'redis';

// Two ways to reach Redis, whichever the project has:
//  1) REST (Upstash): UPSTASH_REDIS_REST_URL/_TOKEN or KV_REST_API_URL/_TOKEN
//  2) Standard connection string: REDIS_URL (Redis Cloud, Upstash TCP, etc.)
// Vercel's storage setup can add a custom prefix (e.g. STORAGE_REDIS_URL),
// so names are matched by suffix.
function findEnv(suffixes: string[]): string | undefined {
  for (const [k, v] of Object.entries(process.env)) {
    if (v && suffixes.some((s) => k === s || k.endsWith(`_${s}`))) return v;
  }
  return undefined;
}

function restCfg() {
  const url = findEnv(['UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL']);
  const token = findEnv(['UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_TOKEN']);
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

const tcpUrl = () => findEnv(['REDIS_URL']);

export function redisConfigured(): boolean {
  return !!(restCfg() || tcpUrl());
}

// One connection is reused while the serverless instance stays warm
let tcpClient: ReturnType<typeof createClient> | null = null;
async function tcp() {
  if (tcpClient && !tcpClient.isReady) {
    try { tcpClient.destroy(); } catch { /* already closed */ }
    tcpClient = null;
  }
  if (!tcpClient) {
    const c = createClient({ url: tcpUrl(), socket: { connectTimeout: 5000, reconnectStrategy: false } });
    c.on('error', (e) => console.error('Redis connection error:', e.message));
    await c.connect();
    tcpClient = c;
  }
  return tcpClient;
}

type Cmd = (string | number)[];

export async function redis(cmd: Cmd): Promise<any> {
  const rest = restCfg();
  if (rest) {
    const r = await fetch(rest.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rest.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
    const d: any = await r.json().catch(() => ({}));
    if (!r.ok || d.error) throw new Error(d.error || `Redis HTTP ${r.status}`);
    return d.result;
  }
  if (!tcpUrl()) throw new Error('Redis is not configured');
  try {
    const c = await tcp();
    return await c.sendCommand(cmd.map(String));
  } catch (err) {
    tcpClient = null; // reconnect on the next call
    throw err;
  }
}

export async function redisPipeline(cmds: Cmd[]): Promise<any[]> {
  const out: any[] = [];
  for (const c of cmds) out.push(await redis(c));
  return out;
}
