import { useEffect, useState } from "react";
import {
  Camera,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import SectionCard from "../../components/admin/SectionCard.jsx";
import { adminApi } from "../../api/adminApi.js";

export default function Profile() {
  const [profile, setProfile] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    role: "Administrator",
    employeeId: "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    admissions: true,
    finance: true,
    blockchain: true,
  });

  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    adminApi
      .getProfile()
      .then(({ data }) => {
        if (data) {
          setProfile((current) => ({
            ...current,
            firstName: data.full_name || current.firstName,
            email: data.email || current.email,
            phone: data.phone_number || current.phone,
            role: data.role || current.role,
          }));
        }
      })
      .catch(console.error);
  }, []);

  const fullName =
    [
      profile.firstName,
      profile.middleName,
      profile.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Admin User";

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0])
      .join("")
      .toUpperCase() || "AU";

  const updateProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      await adminApi.updateProfile(profile);

      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();

    if (
      password.newPassword !==
      password.confirmPassword
    ) {
      setMessage("New passwords do not match.");
      return;
    }

    try {
      setPasswordSaving(true);
      setMessage("");

      await adminApi.changePassword(password);

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage("Password changed successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your administrator profile, account security and preferences."
      />

      {message && (
        <div className="mb-5 rounded-xl border border-border bg-primary-subtle px-4 py-3 text-xs font-medium text-primary">
          {message}
        </div>
      )}

      <div className="profile-grid">
        {/* Profile card */}
        <SectionCard
          title="Profile"
          subtitle="Your administrator information."
        >
          <div className="profile-card">
            <div className="profile-large-avatar">
              {initials}
            </div>

            <h2>{fullName}</h2>

            <p className="profile-role">
              {profile.role || "Administrator"}
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-bold text-success">
                Active
              </span>

              <span className="rounded-full bg-primary-subtle px-2.5 py-1 text-[9px] font-bold text-primary">
                Administrator
              </span>
            </div>

            <button
              type="button"
              className="secondary-button profile-photo-button"
            >
              <Camera size={14} />
              Change Photo
            </button>
          </div>
        </SectionCard>

        {/* Personal information */}
        <SectionCard
          title="Personal Information"
          subtitle="Update your basic account information."
        >
          <form
            onSubmit={updateProfile}
            className="p-5"
          >
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>

                <input
                  value={profile.firstName}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      firstName:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Middle Name</label>

                <input
                  value={profile.middleName}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      middleName:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>

                <input
                  value={profile.lastName}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      lastName:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Employee ID</label>

                <input
                  value={profile.employeeId}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      employeeId:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Email</label>

                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />

                  <input
                    className="!pl-9"
                    type="email"
                    value={profile.email}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        email:
                          event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone</label>

                <div className="relative">
                  <Phone
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />

                  <input
                    className="!pl-9"
                    value={profile.phone}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        phone:
                          event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>

              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute left-3 top-3 text-text-muted"
                />

                <input
                  className="!pl-9"
                  value={profile.address}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      address:
                        event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="primary-button"
              >
                <Save size={14} />
                {saving
                  ? "Saving..."
                  : "Save Profile"}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="profile-bottom-grid mt-6">
        {/* Security */}
        <SectionCard
          title="Account & Security"
          subtitle="Protect your administrator account."
        >
          <form
            onSubmit={updatePassword}
            className="p-5"
          >
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-primary-subtle p-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-primary">
                <ShieldCheck size={17} />
              </div>

              <div>
                <p className="text-xs font-bold text-text-main">
                  Account protected
                </p>

                <p className="mt-1 text-[10px] leading-4 text-text-muted">
                  Use a strong password and keep your account credentials private.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>Current Password</label>

              <div className="relative">
                <KeyRound
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />

                <input
                  className="!pl-9"
                  type="password"
                  value={password.currentPassword}
                  onChange={(event) =>
                    setPassword({
                      ...password,
                      currentPassword:
                        event.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>

              <input
                type="password"
                value={password.newPassword}
                onChange={(event) =>
                  setPassword({
                    ...password,
                    newPassword:
                      event.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>

              <input
                type="password"
                value={password.confirmPassword}
                onChange={(event) =>
                  setPassword({
                    ...password,
                    confirmPassword:
                      event.target.value,
                  })
                }
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="secondary-button"
            >
              <KeyRound size={14} />
              {passwordSaving
                ? "Updating..."
                : "Change Password"}
            </button>
          </form>
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          title="Notification Preferences"
          subtitle="Choose which notifications you receive."
        >
          <div className="p-5">
            {[
              ["email", "Email notifications"],
              [
                "admissions",
                "Admission notifications",
              ],
              ["finance", "Finance notifications"],
              [
                "blockchain",
                "Blockchain notifications",
              ],
            ].map(([key, label]) => (
              <label
                key={key}
                className="settings-row cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-subtle text-primary">
                    <UserRound size={14} />
                  </div>

                  <span>{label}</span>
                </div>

                <span className="toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      notifications[key]
                    )}
                    onChange={() =>
                      toggleNotification(key)
                    }
                  />

                  <span />
                </span>
              </label>
            ))}

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className="text-success"
                />

                <p className="text-xs font-bold text-text-main">
                  Two-factor authentication
                </p>
              </div>

              <p className="mt-1 text-[10px] leading-4 text-text-muted">
                Additional authentication can be enabled when supported by your backend.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}