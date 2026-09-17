import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PREFS_KEY = 'educhain360_prefs';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }
  catch { return {}; }
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative h-5 w-9 rounded-full transition-colors shrink-0 ${
        disabled ? 'bg-border cursor-not-allowed'
                 : checked ? 'bg-primary' : 'bg-border'
      }`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
        checked ? 'left-[18px]' : 'left-0.5'
      }`} />
    </button>
  );
}

function Row({ label, value, hint, right }) {
  return (
    <li className="px-5 py-3.5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-main">{label}</p>
        {hint && <p className="text-[11px] text-text-muted mt-0.5">{hint}</p>}
      </div>
      <div className="text-right shrink-0">
        {right || <p className="text-xs text-text-muted">{value}</p>}
      </div>
    </li>
  );
}

export default function SettingsPlaceholder() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(loadPrefs);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
    setSavedFlash(true);
    const t = setTimeout(() => setSavedFlash(false), 1200);
    return () => clearTimeout(t);
  }, [prefs]);

  function setPref(key, val) {
    setPrefs((p) => ({ ...p, [key]: val }));
  }

  return (
    <DashboardLayout pageTitle="Settings" pageSubtitle="Account, notifications & security">
      <div className="max-w-3xl mx-auto space-y-6">

        {savedFlash && (
          <div className="bg-status-verified/10 border border-status-verified/20 rounded-lg px-4 py-2 text-xs text-status-verified">
            Preferences saved
          </div>
        )}

        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">Account</h2>
          </header>
          <ul className="divide-y divide-border">
            <Row label="Full name" value={user?.full_name || '—'} />
            <Row label="Email"     value={user?.email || '—'} />
            <Row label="Role"      value={user?.role || '—'} />
            <Row label="School ID" value={user?.school_id_number || '—'} hint="Assigned by your institution" />
          </ul>
          <div className="px-5 py-3 border-t border-border">
            <a href="/profile" className="text-xs font-medium text-primary hover:text-primary-active">
              Edit personal details →
            </a>
          </div>
        </section>

        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">Security</h2>
          </header>
          <ul className="divide-y divide-border">
            <Row label="Login method" value="JWT + password" />
            <Row
              label="Two-factor authentication"
              value="Not enabled"
              hint="Coming soon"
              right={<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-pending/10 text-status-pending">Off</span>}
            />
            <Row label="Session timeout" value="7 days" />
            <Row label="Active sessions" value="1 device" />
          </ul>
          <div className="px-5 py-3 border-t border-border">
            <a href="/profile" className="text-xs font-medium text-primary hover:text-primary-active">
              Change password →
            </a>
          </div>
        </section>

        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">Notifications</h2>
          </header>
          <ul className="divide-y divide-border">
            <Row
              label="Email notifications"
              hint="Notices, results, and receipts"
              right={<Toggle checked={prefs.email ?? true} onChange={(v) => setPref('email', v)} />}
            />
            <Row
              label="SMS alerts"
              hint="Fee deadlines and urgent notices"
              right={<Toggle checked={prefs.sms ?? true} onChange={(v) => setPref('sms', v)} />}
            />
            <Row
              label="Attendance reminders"
              hint="Notify me if attendance drops below requirement"
              right={<Toggle checked={prefs.attendance ?? true} onChange={(v) => setPref('attendance', v)} />}
            />
            <Row
              label="Result published alerts"
              hint="Notify when a new exam result is submitted"
              right={<Toggle checked={prefs.results ?? true} onChange={(v) => setPref('results', v)} />}
            />
            <Row
              label="Chatbot data usage"
              hint="Always scoped to your own records — enforced on the server"
              right={
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                 bg-secondary-subtle text-secondary">
                  Own records only
                </span>
              }
            />
          </ul>
        </section>

        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">System</h2>
          </header>
          <ul className="divide-y divide-border">
            <Row label="Platform"          value="EduChain360 v1.0" />
            <Row label="Environment"       value="Development" />
            <Row label="Blockchain status" value="Not yet active" hint="Anchoring ships with the blockchain phase" />
          </ul>
        </section>

      </div>
    </DashboardLayout>
  );
}