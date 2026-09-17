import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';

const FAQS = [
  {
    q: 'How do I verify a certificate or receipt?',
    a: 'Every certificate, mark-sheet, and fee receipt issued through EduChain360 carries a QR code. Scan it with any smartphone — no login required — and it will show whether the document matches the immutable ledger entry. If the hash matches, it is authentic; if not, it has been tampered with since issuance.'
  },
  {
    q: 'Who can see my records?',
    a: 'Only you and the staff roles your institution explicitly authorises. Every request is scoped on the server to your own user ID — even if someone crafts a request with a different ID, the backend refuses it. Parents see only their own children. Teachers see only their assigned classes.'
  },
  {
    q: 'Why is my attendance percentage calculated this way?',
    a: 'Attendance is computed as (days marked present ÷ total school days this month) × 100. Late entries count toward present days. The requirement threshold is set by your institution (default 90%).'
  },
  {
    q: 'What happens if a fee receipt fails to anchor?',
    a: 'Anchoring runs immediately after payment confirmation. If the ledger service is briefly unavailable, the receipt is queued and anchored within seconds. Until then, the receipt shows a "Pending anchor" badge instead of "Verified". No action is required from you.'
  },
  {
    q: 'Can I change my email address?',
    a: 'Not currently. Email changes must go through the administration office so that institutional records stay consistent. Your phone number, however, is editable from My Profile.'
  },
  {
    q: 'Is my data exported or shared?',
    a: "No. EduChain360 stores only the cryptographic hash of academic credentials on the ledger — never the underlying personal data. All operational data stays within your institution's own database."
  }
];

const SHORTCUTS = [
  { keys: ['Esc'],       action: 'Close any open dropdown or drawer' },
  { keys: ['↑', '↓'],    action: 'Navigate notices in the bell menu' },
  { keys: ['Enter'],     action: 'Open focused notice' },
  { keys: ['Tab'],       action: 'Move through focusable elements' },
  { keys: ['Shift+Tab'], action: 'Move backward' }
];

function FaqItem({ q, a, open, onToggle }) {
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-primary-subtle/30 transition-colors"
      >
        <span className={`mt-0.5 h-5 w-5 rounded-full grid place-items-center shrink-0 text-[11px] font-bold transition-transform ${
          open ? 'bg-primary text-text-inverse rotate-90' : 'bg-primary-subtle text-primary'
        }`}>
          ›
        </span>
        <span className="flex-1 text-xs font-semibold text-text-main">{q}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 pl-13">
          <p className="text-[11px] text-text-muted leading-relaxed whitespace-pre-line">
            {a}
          </p>
        </div>
      )}
    </li>
  );
}

export default function HelpPlaceholder() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <DashboardLayout
      pageTitle="Help & support"
      pageSubtitle="FAQs, contact & keyboard shortcuts"
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Hero */}
        <div className="bg-primary-dark text-text-inverse rounded-2xl px-6 py-6">
          <p className="text-[11px] uppercase tracking-widest text-primary-light">Support centre</p>
          <h1 className="text-lg font-bold mt-1">How can we help?</h1>
          <p className="text-xs text-primary-light mt-1.5 leading-relaxed max-w-md">
            Answers to the most common questions about records, verification, and your account.
            Still stuck? Reach the admin office below.
          </p>
        </div>

        {/* FAQ */}
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">Frequently asked questions</h2>
          </header>
          <ul>
            {FAQS.map((f, i) => (
              <FaqItem
                key={i}
                q={f.q}
                a={f.a}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
              />
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">Contact the administration office</h2>
          </header>
          <ul className="divide-y divide-border">
            <li className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-8 w-8 rounded-lg bg-primary-subtle text-primary grid place-items-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-main">Email</p>
                  <p className="text-[11px] text-text-muted truncate">admin@fwu.edu.np</p>
                </div>
              </div>
              <a href="mailto:admin@fwu.edu.np" className="text-xs font-medium text-primary hover:text-primary-active">
                Send →
              </a>
            </li>
            <li className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-8 w-8 rounded-lg bg-primary-subtle text-primary grid place-items-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-main">Phone</p>
                  <p className="text-[11px] text-text-muted">+977-99-5xxxxx</p>
                </div>
              </div>
              <a href="tel:+977995xxxxx" className="text-xs font-medium text-primary hover:text-primary-active">
                Call →
              </a>
            </li>
            <li className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-8 w-8 rounded-lg bg-primary-subtle text-primary grid place-items-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-main">Office</p>
                  <p className="text-[11px] text-text-muted">Mahendranagar, Kanchanpur — Sun–Fri, 10 AM–4 PM</p>
                </div>
              </div>
            </li>
          </ul>
        </section>

        {/* Keyboard shortcuts */}
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-main">Keyboard shortcuts</h2>
          </header>
          <ul className="divide-y divide-border">
            {SHORTCUTS.map((s, i) => (
              <li key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-2 py-1 rounded-md bg-background border border-border
                                 text-[10px] font-mono text-text-main"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
                <p className="text-[11px] text-text-muted text-right">{s.action}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <p className="text-center text-[10px] text-text-muted">
          EduChain360 v1.0 · Built at Far Western University · © {new Date().getFullYear()}
        </p>

      </div>
    </DashboardLayout>
  );
}