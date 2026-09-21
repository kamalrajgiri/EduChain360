import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import Spinner from '../../components/Spinner.jsx';
import Avatar from '../../components/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import client from '../../api/client.js';
import {
  updateProfile as updateProfileApi,
  changePassword,
  uploadPhoto,
  removePhoto
} from '../../api/auth.js';

/* ─── Change-password modal ─────────────────────────────── */

function ChangePasswordModal({ open, onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      setCurrent(''); setNext(''); setConfirm('');
      setErr(''); setSuccess('');
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(''); setSuccess('');

    if (next.length < 6) return setErr('New password must be at least 6 characters');
    if (next !== confirm) return setErr('New passwords do not match');

    setSubmitting(true);
    try {
      const res = await changePassword({ currentPassword: current, newPassword: next });
      setSuccess(res.message || 'Password updated');
      setTimeout(() => onClose(), 900);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main">Change password</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Use a password you don't use elsewhere.
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-lg leading-none" aria-label="Close">×</button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-3 py-2 text-xs text-status-tampered">
            {err}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-lg border border-status-verified/30 bg-status-verified/5 px-3 py-2 text-xs text-status-verified">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Current password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">New password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                         text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                         hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold px-4 py-2
                         disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Updating…' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */

export default function AccountantProfile() {
  const { user, updateUser } = useAuth();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone_number: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [pwOpen, setPwOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get('/auth/me');
        if (!cancelled) {
          setMe(data.user);
          setForm({ phone_number: data.user.phone_number || '' });
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toast.msg) return;
    const id = setTimeout(() => setToast({ type: '', msg: '' }), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfileApi({ phone_number: form.phone_number });
      setMe((prev) => ({ ...prev, ...res.data }));
      updateUser({ phone_number: res.data.phone_number, full_name: res.data.full_name });
      setEditing(false);
      setToast({ type: 'success', msg: 'Profile saved.' });
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.message || 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', msg: 'Please choose an image file' });
      return;
    }
    if (file.size > 1_500_000) {
      setToast({ type: 'error', msg: 'Image must be under 1.5 MB' });
      return;
    }

    setPhotoBusy(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });

      const resized = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const max = 300;
          const ratio = Math.min(max / img.width, max / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = dataUrl;
      });

      await uploadPhoto(resized);
      updateUser({ avatar_data: resized });
      setMe((prev) => ({ ...prev, avatar_data: resized }));
      setToast({ type: 'success', msg: 'Photo updated' });
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.message || 'Failed to upload photo' });
    } finally {
      setPhotoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemovePhoto() {
    try {
      await removePhoto();
      updateUser({ avatar_data: null });
      setMe((prev) => ({ ...prev, avatar_data: null }));
      setToast({ type: 'success', msg: 'Photo removed' });
    } catch {
      setToast({ type: 'error', msg: 'Failed to remove photo' });
    }
  }

  return (
    <DashboardLayout pageTitle="My Profile" pageSubtitle="Personal details, security & preferences">
      {loading && (
        <div className="py-24 grid place-items-center">
          <Spinner size="lg" label="Loading profile..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-status-tampered/30 bg-status-tampered/5 px-4 py-3 text-sm text-status-tampered">
          {error}
        </div>
      )}

      {!loading && !error && me && (
        <div className="space-y-6">

          {toast.msg && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${
              toast.type === 'success'
                ? 'border-status-verified/30 bg-status-verified/5 text-status-verified'
                : 'border-status-tampered/30 bg-status-tampered/5 text-status-tampered'
            }`}>
              {toast.msg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Photo */}
            <section className="bg-surface border border-border rounded-2xl p-6 text-center">
              <div className="flex justify-center">
                <Avatar user={me} size="xl" />
              </div>
              <p className="text-sm font-bold text-text-main mt-3">{me.full_name}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {me.school_id_number} · {me.role}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold
                               bg-status-verified/10 text-status-verified">
                <span className="h-1.5 w-1.5 rounded-full bg-status-verified" />
                ID verified
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoBusy}
                className="mt-4 w-full rounded-lg border border-border text-text-main text-xs font-medium py-2
                           hover:bg-background disabled:opacity-60 transition-colors"
              >
                {photoBusy ? 'Uploading…' : 'Change photo'}
              </button>

              {me.avatar_data && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="mt-2 w-full text-[11px] text-text-muted hover:text-status-tampered transition-colors"
                >
                  Remove photo
                </button>
              )}
            </section>

            {/* Personal details */}
            <section className="bg-surface border border-border rounded-2xl p-6 lg:col-span-2">
              <header className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-text-main">Personal details</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs font-medium text-primary hover:text-primary-active"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditing(false);
                      setForm({ phone_number: me.phone_number || '' });
                    }}
                    className="text-xs font-medium text-text-muted hover:text-text-main"
                  >
                    Cancel
                  </button>
                )}
              </header>

              <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={me.full_name}
                    disabled
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                               text-text-muted focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">Role</label>
                  <input
                    type="text"
                    value={me.role}
                    disabled
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                               text-text-muted focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">Staff ID</label>
                  <input
                    type="text"
                    value={me.school_id_number}
                    disabled
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                               text-text-muted focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-main mb-1.5">Contact number</label>
                  <input
                    type="text"
                    value={form.phone_number}
                    onChange={(e) => setForm({ phone_number: e.target.value })}
                    disabled={!editing}
                    placeholder="+977-98xxxxxxxx"
                    className={`w-full rounded-lg border border-border px-3.5 py-2.5 text-sm
                               ${editing
                                 ? 'bg-surface text-text-main focus:border-primary focus:ring-2 focus:ring-primary/15'
                                 : 'bg-background text-text-muted'}
                               focus:outline-none`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-main mb-1.5">Email</label>
                  <input
                    type="email"
                    value={me.email}
                    disabled
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                               text-text-muted focus:outline-none"
                  />
                </div>

                {editing && (
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-primary hover:bg-primary-hover text-text-inverse text-xs font-semibold px-5 py-2.5
                                 disabled:opacity-60 transition-colors"
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                )}
              </form>
            </section>
          </div>

          {/* Security + notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Account & security</h2>
              </header>
              <ul className="divide-y divide-border">
                <li className="px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Login method</span>
                  <span className="text-xs font-medium text-text-main">Staff ID + password (JWT)</span>
                </li>
                <li className="px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Two-factor authentication</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-status-pending/10 text-status-pending">
                    Not enabled
                  </span>
                </li>
                <li className="px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Last login</span>
                  <span className="text-xs text-text-main">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </li>
              </ul>
              <div className="px-5 py-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPwOpen(true)}
                  className="rounded-lg border border-border text-text-main text-xs font-medium px-4 py-2
                             hover:bg-background transition-colors"
                >
                  Change password
                </button>
              </div>
            </section>

            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-text-main">Notification preferences</h2>
              </header>
              <ul className="divide-y divide-border">
                <li className="px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Email notifications</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-status-verified/10 text-status-verified">On</span>
                </li>
                <li className="px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-text-muted">SMS alerts</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-status-verified/10 text-status-verified">On</span>
                </li>
                <li className="px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Daily collection summary</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-status-verified/10 text-status-verified">On</span>
                </li>
              </ul>
              <div className="px-5 py-3 border-t border-border">
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Preference toggles ship with the notifications phase. All queries are
                  automatically scoped to your own records — enforced on the server, not just the UI.
                </p>
              </div>
            </section>
          </div>

        </div>
      )}

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </DashboardLayout>
  );
}