// src/app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Trade = {
  id: string;
  clientId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  ts: number; // epoch ms
};

type Task = {
  id: string;
  title: string;
  due: string; // ISO
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  category: 'REGULATORY' | 'RISK' | 'REPORTING' | string;
};

type Flag = {
  tradeId: string;
  type: 'HIGH_VOLUME' | 'PRICE_JUMP' | 'POTENTIAL_CIRCULARITY' | string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
};

type Health = {
  complianceScore: number;
  surveillanceScore: number;
  businessScore: number;
  overall: number;
  heatmap: number[]; // 14 values: 0=low,1=med,2=high
};

export default function Page() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [tRes, cRes, sRes] = await Promise.all([
      fetch('/api/trades', { cache: 'no-store' }),
      fetch('/api/compliance', { cache: 'no-store' }),
      fetch('/api/score', { cache: 'no-store' }),
    ]);
    setTrades(await tRes.json());
    setTasks(await cRes.json());
    const s = await sRes.json();
    setFlags(s.flags);
    setHealth(s.health);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function seed() {
    await fetch('/api/seed', { method: 'POST' });
    await refresh();
  }

  async function toggleTask(id: string, status: Task['status']) {
    const next = status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await fetch('/api/compliance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    await refresh();
  }

  const counts = useMemo(
    () => ({
      pending: tasks.filter((t) => t.status === 'PENDING').length,
      overdue: tasks.filter((t) => t.status === 'OVERDUE').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    }),
    [tasks]
  );

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 24 }}>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn" onClick={seed}>Seed Sample Data</button>
        <button className="btn" onClick={refresh}>Refresh</button>
        <a className="btn" href="/api/report">Download PDF</a>
      </div>

      {/* Scores */}
      <section className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <ScoreCard title="Overall Score" value={health?.overall ?? '--'} big />
        <ScoreCard title="Compliance" value={health?.complianceScore ?? '--'} />
        <ScoreCard title="Surveillance" value={health?.surveillanceScore ?? '--'} />
        <ScoreCard title="Business" value={health?.businessScore ?? '--'} />
      </section>

      {/* Heatmap */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>14-Day Risk Heatmap</h3>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>low / med / high</div>
        </div>
        <div className="heat" style={{ marginTop: 12 }}>
          {(health?.heatmap || []).map((v, i) => {
            const cls = v === 0 ? 'l' : v === 1 ? 'm' : 'h';
            return (
              <div
                key={i}
                className={`cell ${cls}`}
                title={`Day ${i + 1}: ${['Low', 'Medium', 'High'][v]}`}
              />
            );
          })}
        </div>
      </section>

      {/* Tasks */}
      <section className="card">
        <h3 style={{ marginTop: 0 }}>Compliance Tasks</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <span className="badge low">Completed: {counts.completed}</span>
          <span className="badge med">Pending: {counts.pending}</span>
          <span className="badge high">Overdue: {counts.overdue}</span>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.category}</td>
                  <td>{new Date(t.due).toDateString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        t.status === 'OVERDUE' ? 'high' : t.status === 'PENDING' ? 'med' : 'low'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn" onClick={() => toggleTask(t.id, t.status)}>
                      {t.status === 'COMPLETED' ? 'Mark Pending' : 'Mark Done'}
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--muted)', paddingTop: 12 }}>
                    No tasks yet — click “Seed Sample Data”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trades */}
      <section className="card">
        <h3 style={{ marginTop: 0 }}>Client Trades & Flags</h3>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Client</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(-100).map((t) => {
                const myFlags = flags.filter((f) => f.tradeId === t.id);
                const sev = myFlags.some((f) => f.severity === 'HIGH')
                  ? 'high'
                  : myFlags.some((f) => f.severity === 'MEDIUM')
                  ? 'med'
                  : 'low';
                const flagged = myFlags.length > 0;

                return (
                  <tr
                    key={t.id}
                    style={{
                      background: flagged
                        ? sev === 'high'
                          ? '#2a1113'
                          : sev === 'med'
                          ? '#2a2213'
                          : '#10231a'
                        : 'transparent',
                    }}
                  >
                    <td>{new Date(t.ts).toLocaleString()}</td>
                    <td>{t.clientId}</td>
                    <td>{t.symbol}</td>
                    <td>{t.side}</td>
                    <td>{t.qty}</td>
                    <td>{t.price}</td>
                    <td>
                      {myFlags.map((f, i) => (
                        <span key={i} className={`badge ${sev}`} style={{ marginRight: 6 }}>
                          {f.type}
                        </span>
                      ))}
                    </td>
                  </tr>
                );
              })}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: 'var(--muted)', paddingTop: 12 }}>
                    No trades yet — click “Seed Sample Data”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {loading && <div className="card">Loading…</div>}
    </div>
  );
}

function ScoreCard({ title, value, big = false }: { title: string; value: number | string; big?: boolean }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{title}</div>
      <div style={{ fontSize: big ? 36 : 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
