import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import {
  getDashboard,
  getAlerts,
  getActivity,
  getWeeklyChart
} from '../../api/accountant.js';
import { SkeletonDashboard } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';

function fmt(n) {
  return `NPR ${Number(n).toLocaleString('en-IN')}`;
}

function fmtShort(n) {
  const num = Number(n);
  if (num >= 10000000) return `NPR ${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000)   return `NPR ${(num / 100000).toFixed(2)} L`;
  return `NPR ${num.toLocaleString('en-IN')}`;
}

function timeAgo(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Kpi({ label, value, hint, tone = 'primary', icon }) {
  const toneMap = {
    primary:   'bg-primary-subtle text-primary',
    success:   'bg-status-verified/10 text-status-verified',
    warning:   'bg-status-pending/10 text-status-pending',
    danger:    'bg-status-tampered/10 text-status-tampered',
    secondary: 'bg-secondary-subtle text-secondary'
  };
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className={`h-9 w-9 rounded-lg grid place-items-center mb-3 ${toneMap[tone]}`}>
        <span className="text-xs font-bold">{icon}</span>
      </div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-main mt-1">{value}</p>
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

/* ─── 7-day mini bar chart ─────────────────────────────── */

function BarChart7d({ data }) {
  if (!data || data.length === 0) return null;
  const W = 320, H = 90, PAD_B = 20, PAD_T = 6;
  const max = Math.max(...data.map((d) => d.amount), 1);
  const bw = (W - 20) / data.length;
  const gap = 4;
  const innerW = bw - gap;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = ((d.amount / max) * (H - PAD_B - PAD_T)) || 0;
          const x = 10 + i * bw + gap / 2;
          const y = H - PAD_B - h;
          const dayLabel = new Date(d.day).toLocaleDateString('en-GB', { weekday: 'short' });
          return (
            <g key={d.day}>
              {/* Background track */}
              <rect x={x} y={PAD_T} width={innerW} height={H - PAD_B - PAD_T}
                    rx="3" fill="#F0F4FE" />
              {/* Bar */}
              {h > 0 && (
                <rect x={x} y={y} width={innerW} height={h} rx="3" fill="#072C82" />
              )}
              {/* Day label */}
              <text x={x + innerW / 2} y={H - 6} textAnchor="middle"
                    fontSize="9" fill="#8C8989" fontWeight="500">
                {dayLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between mt-2 text-[11px] text-text-muted">
        <span>Total last 7 days</span>
        <span className="font-semibold text-text-main">
          {fmtShort(data.reduce((s, d) => s + Number(d.amount), 0))}
        </span>
      </div>
    </div>
  );
}

/* ─── Aging chips ──────────────────────────────────────── */

function AgingChips({ aging }) {
  const chips = [
    { label: '0–30 days',  value: aging.days0_30,   tone: 'text-status-verified' },
    { label: '31–60 days', value: aging.days31_60,  tone: 'text-status-pending'  },
    { label: '61–90 days', value: aging.days61_90,  tone: 'text-status-pending'  },
    { label: '90+ days',   value: aging.days90Plus, tone: 'text-status-tampered' }
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {chips.map((c) => (
        <div key={c.label} className="bg-background border border-border rounded-lg px-3 py-2 text-center">
          <p className={`text-lg font-bold ${c.tone}`}>{c.value}</p>
          <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────── */

export default function AccountantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dashboardFetch = useFetch(() => getDashboard(), []);
  const alertsFetch    = useFetch(() => getAlerts(), []);
  const activityFetch  = useFetch(() => getActivity(), []);
  const weeklyFetch    = useFetch(() => getWeeklyChart(), []);

  const data     = dashboardFetch.data;
  const alerts   = alertsFetch.data;
  const activity = activityFetch.data;
  const weekly   = weeklyFetch.data;

  const loading = dashboardFetch.loading || alertsFetch.loading || activityFetch.loading || weeklyFetch.loading;
  const error   = dashboardFetch.error || alertsFetch.error;

  const firstName = user?.full_name?.split(' ')[0] || 'Accountant';

  return (
    <DashboardLayout
      pageTitle={`Good morning, ${firstName}`}
      pageSubtitle={data?.term ? `Fee collection · ${data.term}` : 'Fee collection & reports'}
    >
      {loading && <SkeletonDashboard />}

      {!loading && error && (
        <ErrorState
          title="Couldn't load dashboard"
          message={error}
          onRetry={() => { dashboardFetch.retry(); alertsFetch.retry(); activityFetch.retry(); weeklyFetch.retry(); }}
        />
      )}

      {!loading && !error && data && (
        <div className="space-y-6">

          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi
              label="Collected (term)"
              value={fmtShort(data.kpis.collected)}
              hint={`${data.kpis.receiptCount} receipts`}
              tone="success"
              icon="₹"
            />
            <Kpi
              label="Outstanding dues"
              value={fmtShort(data.kpis.outstanding)}
              hint={`${data.kpis.outstandingStudents} students`}
              tone="warning"
              icon="!"
            />
            <Kpi
              label="Transactions today"
              value={data.kpis.transactionsToday}
              hint={data.kpis.transactionsToday > 0 ? fmt(data.kpis.amountToday) : 'No activity yet'}
              tone="primary"
              icon="↔"
            />
            <Kpi
              label="Overdue amount"
              value={alerts ? fmtShort(alerts.overdue.amount) : '—'}
              hint={alerts ? `${alerts.overdue.count} invoice${alerts.overdue.count === 1 ? '' : 's'}` : ''}
              tone={alerts?.overdue.amount > 0 ? 'danger' : 'success'}
              icon="⏰"
            />
          </div>

          {/* Chart + Alerts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 7-day chart */}
            <section className="bg-surface border border-border rounded-2xl p-5 lg:col-span-2">
              <header className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-text-main">Collection — last 7 days</h2>
                  <p className="text-xs text-text-muted">Daily receipts processed</p>
                </div>
                <Link
                  to="/accountant/reports"
                  className="text-xs font-medium text-primary hover:text-primary-active"
                >
                  Full reports →
                </Link>
              </header>
              {weekly && <BarChart7d data={weekly} />}
            </section>

            {/* Overdue alert card */}
            <section className="bg-surface border border-border rounded-2xl p-5">
              <header className="mb-3">
                <h2 className="text-sm font-bold text-text-main">Overdue alerts</h2>
                <p className="text-xs text-text-muted">Invoice aging breakdown</p>
              </header>
              {alerts && (
                <>
                  <AgingChips aging={alerts.aging} />
                  <Link
                    to="/accountant/invoices?status=UNPAID"
                    className="mt-4 block text-center text-xs font-medium text-primary hover:text-primary-active"
                  >
                    View overdue invoices →
                  </Link>
                </>
              )}
            </section>
          </div>

          {/* Top debtors + Activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top debtors */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Top outstanding students</h2>
                <p className="text-xs text-text-muted">Highest dues first</p>
              </header>
              {!alerts || alerts.topDebtors.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">
                  No outstanding dues. All clear.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {alerts.topDebtors.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => navigate(`/accountant/students/${d.id}`)}
                        className="w-full text-left px-5 py-3 flex items-center justify-between gap-3
                                   hover:bg-primary-subtle/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-main truncate">{d.full_name}</p>
                          <p className="text-[11px] text-text-muted">
                            {d.school_id_number} · {d.class_name || 'No class'}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-status-pending tabular-nums shrink-0">
                          {fmtShort(d.dues)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent activity */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-text-main">Recent activity</h2>
                  <p className="text-xs text-text-muted">Latest transactions</p>
                </div>
                <Link
                  to="/accountant/transactions"
                  className="text-xs font-medium text-primary hover:text-primary-active"
                >
                  View all →
                </Link>
              </header>
              {!activity || activity.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">
                  No activity yet.
                </div>
              ) : (
                <ul className="divide-y divide-border max-h-[360px] overflow-y-auto">
                  {activity.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => navigate(`/accountant/receipts/${a.id}`)}
                        className="w-full text-left px-5 py-3 flex items-center gap-3
                                   hover:bg-primary-subtle/40 transition-colors"
                      >
                        <span className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                          a.is_anchored
                            ? 'bg-secondary-subtle text-secondary'
                            : 'bg-primary-subtle text-primary'
                        }`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-text-main truncate">
                            {a.student_name}
                          </p>
                          <p className="text-[10px] text-text-muted truncate">
                            {a.payment_method} · {a.receipt_number}
                            {a.recorded_by_name ? ` · by ${a.recorded_by_name}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-text-main tabular-nums">
                            {fmt(a.amount)}
                          </p>
                          <p className="text-[10px] text-text-muted">{timeAgo(a.created_at)}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Collection breakdown (kept from before) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Collection by payment method</h2>
              </header>
              {data.collectionByMethod.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">No data yet.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {data.collectionByMethod.map((m) => {
                    const total = data.collectionByMethod.reduce((s, x) => s + Number(x.amount), 0) || 1;
                    const pct = Math.round((Number(m.amount) / total) * 100);
                    return (
                      <li key={m.payment_method} className="px-5 py-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-text-main">
                            {m.payment_method || 'Unknown'}
                          </span>
                          <span className="text-xs text-text-muted tabular-nums">
                            {fmtShort(m.amount)} · {m.count}
                          </span>
                        </div>
                        <div className="h-1.5 bg-primary-light rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Collection by class</h2>
              </header>
              {data.collectionByClass.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">No data yet.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {data.collectionByClass.map((c) => (
                    <li key={c.class_name} className="px-5 py-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text-main truncate">{c.class_name}</p>
                        <p className="text-[10px] text-text-muted">{c.receipt_count} receipts</p>
                      </div>
                      <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
                        {fmtShort(c.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Quick actions */}
          <section className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-text-main mb-3">Quick actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/accountant/transactions"
                className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold px-4 py-2.5 transition-colors">
                Fee collection
              </Link>
              <Link to="/accountant/invoices"
                className="rounded-lg bg-secondary hover:bg-secondary-hover text-text-inverse text-xs font-semibold px-4 py-2.5 transition-colors">
                Invoice management
              </Link>
              <Link to="/accountant/fee-structure"
                className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2.5 hover:bg-background transition-colors">
                Fee structure
              </Link>
              <Link to="/accountant/reports"
                className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2.5 hover:bg-background transition-colors">
                Reports
              </Link>
            </div>
          </section>

        </div>
      )}
    </DashboardLayout>
  );
}