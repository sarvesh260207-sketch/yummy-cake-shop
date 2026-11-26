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


const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Dashboard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [view, setView] = useState<'orders' | 'products' | 'assistant'>('orders');
  const [search, setSearch] = useState('');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
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
  const filteredShown = (tab === 'active' ? active : done).filter((o) => {
    const q = search.trim().toLowerCase();
    return !q || [o.id, o.customerName, o.customerPhone, o.status, ...o.items.map((i) => i.name)].some((v) => String(v).toLowerCase().includes(q));
  });
  const productRows = orders.flatMap((o) => o.items.map((i) => ({ ...i, orderId: o.id, status: o.status })));
  const productSummary = Array.from(productRows.reduce((map, item) => {
    const key = item.name.trim().toLowerCase();
    const row = map.get(key) || { name: item.name, quantity: 0, orderCount: new Set<string>(), revenue: 0 };
    row.quantity += Number(item.qty) || 0;
    row.orderCount.add(item.orderId);
    row.revenue += (Number(item.price) || 0) * (Number(item.qty) || 0);
    map.set(key, row);
    return map;
  }, new Map<string, { name: string; quantity: number; orderCount: Set<string>; revenue: number }>()).values())
    .map((p) => ({ ...p, orderCount: p.orderCount.size }))
    .sort((a, b) => b.quantity - a.quantity);
  const completedOrders = orders.filter((o) => o.status === 'Completed');
  const paidRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrderValue = orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const money = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const answerQuestion = () => {
    const q = question.trim().toLowerCase();
    if (!q) return;
    let answer = '';
    if (/revenue|sales|earning|income/.test(q)) {
      answer = `From the orders currently stored in the website database: completed-order revenue is ${money(paidRevenue)} across ${completedOrders.length} completed orders. Non-cancelled order value (including orders not yet completed) is ${money(totalOrderValue)}. This is order value, not verified profit.`;
    } else if (/pending|active|open|not completed/.test(q)) {
      answer = `${active.length} active orders are currently stored. ${newCount} are newly received. Status counts: ${STATUSES.filter((s) => active.some((o) => o.status === s)).map((s) => s + ': ' + active.filter((o) => o.status === s).length).join(', ') || 'No active status records'}.`;
    } else if (/best|popular|selling|top cake|cake.*order/.test(q)) {
      answer = productSummary.length ? `Most ordered cake in the stored website orders: ${productSummary[0].name} — ${productSummary[0].quantity} units across ${productSummary[0].orderCount} orders, with recorded item value ${money(productSummary[0].revenue)}.` : 'There are no cake items in the website order records yet.';
    } else if (/customer|repeat|buyer/.test(q)) {
      const customers = new Map<string, number>();
      orders.forEach((o) => { const k = String(o.customerPhone || o.customerName).toLowerCase(); customers.set(k, (customers.get(k) || 0) + 1); });
      const repeat = [...customers.values()].filter((n) => n > 1).length;
      answer = `${customers.size} distinct customer identities and ${repeat} repeat customers appear in the currently stored website orders. Customer matching uses phone number where available.`;
    } else if (/cancel/.test(q)) {
      const cancelled = orders.filter((o) => o.status === 'Cancelled');
      answer = `${cancelled.length} of ${orders.length} stored orders are cancelled. Recorded cancelled order value: ${money(cancelled.reduce((s, o) => s + (Number(o.total) || 0), 0))}.`;
    } else if (/average|aov|order value/.test(q)) {
      const valid = orders.filter((o) => o.status !== 'Cancelled');
      answer = valid.length ? `Average non-cancelled order value: ${money(valid.reduce((s, o) => s + (Number(o.total) || 0), 0) / valid.length)} across ${valid.length} orders.` : 'No non-cancelled website orders are stored yet.';
    } else {
      answer = 'I can answer from real website order records only. Try asking about revenue, active/pending orders, best-selling cake, repeat customers, cancellations, or average order value. I do not invent data or estimate ingredient costs/profit.';
    }
    setAnswers((prev) => [...prev, 'You: ' + question.trim(), 'Assistant: ' + answer]);
    setQuestion('');
  };

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


  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#451A03]">
      <header className="sticky top-0 z-10 bg-[#451A03] text-[#FFFBEB] px-4 py-3 flex items-center justify-between">
        <div className="font-extrabold text-lg">🎂 SV Bakery · Orders</div>
        <div className="flex items-center gap-3 text-xs">
          {updatedAt && <span className="hidden sm:inline opacity-70">Updated {updatedAt.toLocaleTimeString('en-IN')}</span>}
          <button onClick={() => void load()} className="px-3 py-1 rounded-full bg-[#FACC15] text-[#451A03] font-bold cursor-pointer">Refresh</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <div className="flex flex-wrap gap-2 mb-5">
          {([{ id: 'orders', label: 'Orders' }, { id: 'products', label: 'Ordered cakes' }, { id: 'assistant', label: 'AI business assistant' }] as const).map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} className={`px-4 py-2 rounded-full border-2 border-[#451A03] font-bold cursor-pointer ${view === item.id ? 'bg-[#FACC15]' : 'bg-white'}`}>{item.label}</button>
          ))}
        </div>
        {view === 'orders' && <section>
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
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order ID, customer, phone or cake…" className="w-full mb-4 rounded-xl border-2 border-[#451A03] bg-white px-4 py-3 outline-none" />
        {loading && <p className="text-center py-10 font-semibold">Loading orders…</p>}
        {!loading && filteredShown.length === 0 && (
          <p className="text-center py-10 font-semibold text-[#78350F]">
            {tab === 'active' ? 'No active orders right now 🎉' : 'No completed orders yet'}
          </p>
        )}

        <div className="space-y-4">
          {filteredShown.map((o) => (
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
        </section>}
        {view === 'products' && <section className="space-y-4">
          <div className="bg-white border-2 border-[#451A03] rounded-2xl p-4"><h2 className="text-xl font-extrabold">Cakes customers actually ordered</h2><p className="text-sm text-[#78350F] mt-1">Built only from completed and active orders submitted through the website database. No sample products or fake figures.</p><div className="mt-3 text-sm font-bold">Based on {orders.length} stored website orders · all amounts in INR</div></div>
          {productSummary.length === 0 ? <p className="bg-white rounded-2xl p-8 text-center font-semibold">No cake items have been ordered through the website yet.</p> : productSummary.map((p) => <article key={p.name} className="bg-white border-2 border-[#451A03] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-extrabold text-lg">{p.name}</h3><p className="text-sm text-[#78350F]">{p.orderCount} orders · {p.quantity} units ordered</p></div><div className="font-extrabold">Recorded item value: {money(p.revenue)}</div></article>)}
        </section>}
        {view === 'assistant' && <section className="bg-white border-2 border-[#451A03] rounded-2xl p-4"><h2 className="text-xl font-extrabold">AI business assistant</h2><p className="text-sm text-[#78350F] mt-1">Grounded answers calculated from actual website order records. It will not invent data, costs or profit.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-4">{[{label:'Stored orders',value:String(orders.length)},{label:'Active orders',value:String(active.length)},{label:'Completed revenue',value:money(paidRevenue)},{label:'Ordered cake types',value:String(productSummary.length)}].map((x) => <div key={x.label} className="rounded-xl bg-[#FFFBEB] p-3"><div className="text-xs text-[#78350F]">{x.label}</div><div className="font-extrabold break-words">{x.value}</div></div>)}</div><div className="min-h-32 max-h-80 overflow-y-auto space-y-2 rounded-xl bg-[#FFFBEB] p-3 mb-3">{answers.length ? answers.map((a,i) => <p key={i} className="text-sm whitespace-pre-wrap">{a}</p>) : <p className="text-sm text-[#78350F]">Ask about revenue, pending orders, best-selling cake, repeat customers, cancellations or average order value.</p>}</div><form onSubmit={(e) => { e.preventDefault(); answerQuestion(); }} className="flex flex-col sm:flex-row gap-2"><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about your real orders…" className="flex-1 rounded-xl border-2 border-[#451A03] px-3 py-3 outline-none"/><button type="submit" className="rounded-xl border-2 border-[#451A03] bg-[#FACC15] px-5 py-3 font-extrabold">Ask</button></form></section>}
      </main>
    </div>
  );
}

export default function Admin() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    document.title = 'Admin · SV Bakery';
    return () => meta.remove();
  }, []);

  return <Dashboard onLoggedOut={() => {}} />;
}
