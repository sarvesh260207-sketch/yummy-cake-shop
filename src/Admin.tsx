import { useCallback, useEffect, useRef, useState } from 'react';

type OrderItem = { name: string; weight?: string; qty: number; price: number };
type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  mode: string;
  address: string;
  deliveryTime: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  whatsappSent?: boolean;
};

const STATUSES = ['Received', 'Confirmed', 'Cooking', 'Decorating', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled'];
const DONE = ['Completed', 'Cancelled'];

const STATUS_STYLE: Record<string, string> = {
  Received: 'bg-[#FB7185] text-white',
  Confirmed: 'bg-[#38BDF8] text-[#451A03]',
  Cooking: 'bg-[#FB923C] text-[#451A03]',
  Decorating: 'bg-[#C084FC] text-[#451A03]',
  Ready: 'bg-[#4ADE80] text-[#451A03]',
  'Out for Delivery': 'bg-[#FACC15] text-[#451A03]',
  Completed: 'bg-[#451A03] text-[#FFFBEB]',
  Cancelled: 'bg-[#D6D3D1] text-[#451A03]',
};

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* sound is optional */
  }
}

function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    setBusy(true);
    setMsg('');
    const { data } = await api('/api/admin/otp-request', { method: 'POST', body: JSON.stringify({ phone }) });
    setBusy(false);
    if (data.ok) {
      setStep('code');
      setCooldown(30);
      setMsg('If this number is authorised, a code was sent. Check your email (or SMS). It can take up to a minute.');
    } else {
      setMsg(data.error || 'Something went wrong');
    }
  };

  const verify = async () => {
    setBusy(true);
    setMsg('');
    const { data } = await api('/api/admin/otp-verify', { method: 'POST', body: JSON.stringify({ phone, code }) });
    setBusy(false);
    if (data.ok) onLoggedIn();
    else setMsg(data.error || 'Invalid code');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBEB] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-[#451A03] p-6 shadow-lg">
        <div className="text-4xl mb-1">🎂</div>
        <h1 className="text-2xl font-extrabold text-[#451A03]">Yummy Cakes Admin</h1>
        <p className="text-sm text-[#78350F] mb-5">Enter your admin mobile number. We'll send a one-time code.</p>

        {step === 'phone' ? (
          <>
            <label className="text-xs font-bold text-[#78350F]">Mobile number</label>
            <div className="flex gap-2 mt-1">
              <span className="px-3 py-2 rounded-xl bg-[#FEF3C7] border-2 border-[#451A03] font-bold">+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))}
                inputMode="numeric"
                placeholder="98765 43210"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-[#451A03] outline-none"
              />
            </div>
            <button
              onClick={sendCode}
              disabled={busy || phone.replace(/\D/g, '').length < 10}
              className="mt-4 w-full py-3 rounded-2xl bg-[#FACC15] border-2 border-[#451A03] font-extrabold text-[#451A03] disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </>
        ) : (
          <>
            <label className="text-xs font-bold text-[#78350F]">6-digit code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoFocus
              placeholder="••••••"
              className="mt-1 w-full px-3 py-3 rounded-xl border-2 border-[#451A03] outline-none text-center text-2xl tracking-[0.4em] font-bold"
            />
            <button
              onClick={verify}
              disabled={busy || code.length !== 6}
              className="mt-4 w-full py-3 rounded-2xl bg-[#FACC15] border-2 border-[#451A03] font-extrabold text-[#451A03] disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Checking…' : 'Verify & sign in'}
            </button>
            <div className="mt-3 flex justify-between text-sm font-semibold text-[#78350F]">
              <button onClick={() => { setStep('phone'); setCode(''); setMsg(''); }} className="underline cursor-pointer">
                Change number
              </button>
              <button onClick={sendCode} disabled={cooldown > 0 || busy} className="underline disabled:opacity-50 cursor-pointer">
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </>
        )}
        {msg && <p className="mt-4 text-sm font-semibold text-[#92400E]">{msg}</p>}
      </div>
    </div>
  );
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Dashboard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const knownIds = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const { status, data } = await api('/api/admin/orders');
    if (status === 401) return onLoggedOut();
    if (!data.ok) {
      setError(data.error || 'Could not load orders');
      setLoading(false);
      return;
    }
    const list: Order[] = data.orders;
    if (knownIds.current) {
      const fresh = list.filter((o) => !knownIds.current!.has(o.id) && o.status === 'Received');
      if (fresh.length) beep();
    }
    knownIds.current = new Set(list.map((o) => o.id));
    setOrders(list);
    setError('');
    setLoading(false);
    setUpdatedAt(new Date());
  }, [onLoggedOut]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  const active = orders.filter((o) => !DONE.includes(o.status));
  const done = orders.filter((o) => DONE.includes(o.status));
  const newCount = active.filter((o) => o.status === 'Received').length;

  useEffect(() => {
    document.title = newCount ? `(${newCount}) New orders · Admin` : 'Orders · Admin';
  }, [newCount]);

  const setStatus = async (o: Order, status: string) => {
    if (status === o.status) return;
    if (status === 'Cancelled' && !window.confirm(`Cancel order ${o.id}?`)) return;
    setUpdating(o.id);
    const { status: code, data } = await api('/api/admin/orders', { method: 'PATCH', body: JSON.stringify({ id: o.id, status }) });
    setUpdating(null);
    if (code === 401) return onLoggedOut();
    if (data.ok) setOrders((prev) => prev.map((x) => (x.id === o.id ? data.order : x)));
    else setError(data.error || 'Could not update status');
  };

  const logout = async () => {
    await api('/api/admin/session', { method: 'DELETE' });
    onLoggedOut();
  };

  const shown = tab === 'active' ? active : done;

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#451A03]">
      <header className="sticky top-0 z-10 bg-[#451A03] text-[#FFFBEB] px-4 py-3 flex items-center justify-between">
        <div className="font-extrabold text-lg">🎂 Yummy Cakes · Orders</div>
        <div className="flex items-center gap-3 text-xs">
          {updatedAt && <span className="hidden sm:inline opacity-70">Updated {updatedAt.toLocaleTimeString('en-IN')}</span>}
          <button onClick={() => void load()} className="px-3 py-1 rounded-full bg-[#FACC15] text-[#451A03] font-bold cursor-pointer">Refresh</button>
          <button onClick={logout} className="px-3 py-1 rounded-full border border-[#FFFBEB]/50 font-bold cursor-pointer">Sign out</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <div className="flex gap-2 mb-4">
          {(['active', 'done'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full border-2 border-[#451A03] font-bold cursor-pointer ${tab === t ? 'bg-[#FACC15]' : 'bg-white'}`}
            >
              {t === 'active' ? `Active (${active.length})` : `Completed (${done.length})`}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-[#FEE2E2] border border-[#B91C1C] text-sm font-semibold">{error}</div>}
        {loading && <p className="text-center py-10 font-semibold">Loading orders…</p>}
        {!loading && shown.length === 0 && (
          <p className="text-center py-10 font-semibold text-[#78350F]">
            {tab === 'active' ? 'No active orders right now 🎉' : 'No completed orders yet'}
          </p>
        )}

        <div className="space-y-4">
          {shown.map((o) => (
            <article key={o.id} className="bg-white rounded-2xl border-2 border-[#451A03] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold text-lg">#{o.id}</div>
                  <div className="text-xs text-[#78350F]">{fmtTime(o.createdAt)}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border-2 border-[#451A03] ${STATUS_STYLE[o.status] || ''}`}>
                  {o.status}
                </span>
              </div>

              <div className="mt-3 text-sm space-y-1">
                <div className="font-bold">{o.customerName}</div>
                <div className="flex flex-wrap gap-3 font-semibold">
                  <a className="underline" href={`tel:+${o.customerPhone}`}>📞 +{o.customerPhone}</a>
                  <a className="underline" href={`https://wa.me/${o.customerPhone}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
                </div>
                <div>
                  <b>{o.mode}</b> · by {o.deliveryTime}
                  {o.mode === 'Delivery' && <span> · {o.address}</span>}
                </div>
              </div>

              <ul className="mt-3 text-sm bg-[#FFFBEB] rounded-xl p-3 space-y-1">
                {o.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-2">
                    <span>{i.name}{i.weight ? ` (${i.weight})` : ''} × {i.qty}</span>
                    <span className="font-bold">₹{i.price * i.qty}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-[#FDE68A] pt-1 font-extrabold">
                  <span>Total</span>
                  <span>₹{o.total}</span>
                </li>
              </ul>

              <div className="mt-3">
                <div className="text-xs font-bold text-[#78350F] mb-1">Update status</div>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.filter((s) => !(s === 'Out for Delivery' && o.mode === 'Pickup')).map((s) => (
                    <button
                      key={s}
                      disabled={updating === o.id}
                      onClick={() => void setStatus(o, s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 border-[#451A03] disabled:opacity-50 cursor-pointer ${
                        o.status === s ? STATUS_STYLE[s] : 'bg-white hover:bg-[#FEF3C7]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {o.whatsappSent === false && (
                <p className="mt-2 text-[11px] text-[#92400E] font-semibold">⚠ Customer's WhatsApp confirmation was not delivered. Use the WhatsApp link above.</p>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Admin() {
  const [state, setState] = useState<'checking' | 'out' | 'in'>('checking');

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    document.title = 'Admin · Yummy Cakes';
    api('/api/admin/session').then(({ data }) => setState(data.ok ? 'in' : 'out'));
    return () => {
      meta.remove();
    };
  }, []);

  const loggedOut = useCallback(() => setState('out'), []);

  if (state === 'checking') return <div className="min-h-screen flex items-center justify-center bg-[#FFFBEB] font-semibold">Loading…</div>;
  if (state === 'out') return <Login onLoggedIn={() => setState('in')} />;
  return <Dashboard onLoggedOut={loggedOut} />;
}
