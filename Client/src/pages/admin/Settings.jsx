import { useEffect, useState } from "react";
import {
  Bell,
  Database,
  LockKeyhole,
  Save,
  ShieldCheck,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import SectionCard from "../../components/admin/SectionCard.jsx";
import { adminApi } from "../../api/adminApi.js";

export default function Settings() {
  const [settings, setSettings] = useState({
    universityName: "EduChain360 University",
    emailNotifications: true,
    admissionNotifications: true,
    financeNotifications: true,
    blockchainNotifications: true,
    maintenanceMode: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminApi
      .getSettings()
      .then((response) => {
        if (response) {
          setSettings((current) => ({
            ...current,
            ...response,
          }));
        }
      })
      .catch(console.error);
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setMessage("");

      await adminApi.updateSettings(settings);

      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure university-wide administrative and notification preferences."
        action={
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="primary-button"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        }
      />

      {message && (
        <div className="mb-5 rounded-xl border border-border bg-primary-subtle px-4 py-3 text-xs font-medium text-primary">
          {message}
        </div>
      )}

      <div className="settings-grid">
        <SectionCard
          title="University Settings"
          subtitle="Basic platform configuration."
        >
          <div className="p-5">
            <div className="form-group">
              <label>University Name</label>

              <input
                value={settings.universityName}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    universityName:
                      event.target.value,
                  })
                }
              />
            </div>

            <div className="settings-row">
              <div className="flex items-center gap-3">
                <Database size={16} />
                <span>Database integration</span>
              </div>

              <strong className="text-success">
                Connected
              </strong>
            </div>

            <div className="settings-row">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} />
                <span>Blockchain service</span>
              </div>

              <strong className="text-success">
                Connected
              </strong>
            </div>

            <div className="settings-row">
              <div className="flex items-center gap-3">
                <LockKeyhole size={16} />
                <span>Authentication</span>
              </div>

              <strong className="text-success">
                Protected
              </strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Notifications"
          subtitle="Choose which administrative events generate alerts."
        >
          <div className="p-5">
            {[
              [
                "emailNotifications",
                "Email notifications",
              ],
              [
                "admissionNotifications",
                "Admission notifications",
              ],
              [
                "financeNotifications",
                "Finance notifications",
              ],
              [
                "blockchainNotifications",
                "Blockchain notifications",
              ],
            ].map(([key, label]) => (
              <label
                key={key}
                className="settings-row cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Bell size={16} />
                  <span>{label}</span>
                </div>

                <span className="toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(settings[key])}
                    onChange={() => toggle(key)}
                  />
                  <span />
                </span>
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="System Mode"
          subtitle="Control system availability."
        >
          <div className="p-5">
            <label className="settings-row cursor-pointer">
              <div>
                <strong className="!text-left">
                  Maintenance mode
                </strong>

                <p className="mt-1 text-[10px] text-text-muted">
                  Restrict normal platform access during maintenance.
                </p>
              </div>

              <span className="toggle">
                <input
                  type="checkbox"
                  checked={Boolean(
                    settings.maintenanceMode
                  )}
                  onChange={() =>
                    toggle("maintenanceMode")
                  }
                />
                <span />
              </span>
            </label>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}