import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Blocks,
  CircleDollarSign,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";

import PageHeader from "../../components/admin/PageHeader.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import StatusBadge from "../../components/admin/StatusBadge.jsx";
import SectionCard from "../../components/admin/SectionCard.jsx";
import { adminApi } from "../../api/adminApi.js";

const iconMap = {
  students: GraduationCap,
  staff: Users,
  admissions: UserPlus,
  revenue: CircleDollarSign,
};

function LoadingBlock() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-surface p-5">
      <div className="h-3 w-24 rounded bg-border" />
      <div className="mt-4 h-7 w-32 rounded bg-border" />
      <div className="mt-4 h-3 w-40 rounded bg-border" />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getDashboard();

        if (mounted) {
          setData(response.data || {});
          setError("");
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    {
      key: "students",
      title: "Total Students",
      value: data?.stats?.students || 0,
      description: "Current enrollment",
    },
    {
      key: "staff",
      title: "Total Staff",
      value: data?.stats?.staff || 0,
      description: "Faculty & employees",
    },
    {
      key: "admissions",
      title: "Pending Admissions",
      value: data?.stats?.pendingAdmissions || 0,
      description: "Current applications",
    },
    {
      key: "revenue",
      title: "Monthly Collection",
      value: data?.stats?.monthlyCollection || 0,
      description: "Completed payments this month",
    },
  ];

  const chart = useMemo(
    () =>
      (data?.feeTrend || []).map((item) => ({
        label: item.label,
        value: item.amount,
      })),
    [data]
  );

  const maxChartValue = Math.max(
    ...(chart.map((item) => Number(item.value) || 0)),
    1
  );

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          subtitle="Monitor university operations, users, admissions, finance and blockchain activity."
        />

        <div className="stats-grid">
          {[1, 2, 3, 4].map((item) => (
            <LoadingBlock key={item} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.8fr)]">
          <div className="dashboard-card h-80 animate-pulse" />
          <div className="dashboard-card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          subtitle="Monitor university operations from one place."
        />

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-danger">
            Unable to load dashboard
          </p>

          <p className="mt-1 text-xs text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="primary-button mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A clear overview of your university operations and platform activity."
        action={
          <Link
            to="/admin/admissions"
            className="primary-button"
          >
            <UserPlus size={15} />
            New Admission
          </Link>
        }
      />

      {/* Statistics */}
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = iconMap[stat.key] || Activity;

          return (
            <StatCard
              key={stat.key}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              trend={stat.trend}
              trendType={stat.trendType}
              icon={Icon}
            />
          );
        })}
      </div>

      {data?.systemAlert && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary-subtle px-4 py-3">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0 text-primary"
          />

          <div>
            <p className="text-xs font-bold text-text-main">
              System notice
            </p>

            <p className="mt-1 text-[11px] text-text-muted">
              {data.systemAlert}
            </p>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Enrollment chart */}
        <SectionCard
          title="Student Enrollment"
          subtitle="Enrollment trend across the current academic period."
          action={
            <Link
              to="/admin/analytics"
              className="text-button"
            >
              View analytics
              <ArrowRight size={13} />
            </Link>
          }
        >
          {chart.length > 0 ? (
            <div className="bar-chart">
              {chart.map((item) => {
                const value = Number(item.value) || 0;
                const height =
                  (value / maxChartValue) * 100;

                return (
                  <div
                    key={item.label}
                    className="chart-column"
                  >
                    <span className="chart-value">
                      {value}
                    </span>

                    <div className="chart-track">
                      <div
                        className="chart-bar"
                        style={{
                          height: `${Math.max(
                            height,
                            4
                          )}%`,
                        }}
                      />
                    </div>

                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid h-64 place-items-center text-xs text-text-muted">
              Enrollment data will appear here.
            </div>
          )}
        </SectionCard>

        {/* Quick actions */}
        <SectionCard
          title="Quick Actions"
          subtitle="Frequently used administration tasks."
        >
          <div className="grid gap-2 p-4">
            {[
              {
                title: "Manage admissions",
                description: "Review applications",
                path: "/admin/admissions",
                icon: UserPlus,
              },
              {
                title: "Manage users",
                description: "Students & staff",
                path: "/admin/users",
                icon: Users,
              },
              {
                title: "Academic overview",
                description: "Programs & courses",
                path: "/admin/academics",
                icon: GraduationCap,
              },
              {
                title: "Finance overview",
                description: "Fees & payments",
                path: "/admin/finance",
                icon: CircleDollarSign,
              },
              {
                title: "Blockchain status",
                description: "Ledger verification",
                path: "/admin/blockchain",
                icon: Blocks,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/20 hover:bg-primary-subtle/40"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-subtle text-primary">
                    <Icon size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-main">
                      {item.title}
                    </p>

                    <p className="mt-0.5 text-[10px] text-text-muted">
                      {item.description}
                    </p>
                  </div>

                  <ArrowRight
                    size={14}
                    className="text-text-muted transition group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </Link>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.8fr)]">
        {/* Admissions */}
        <SectionCard
          title="Recent Admissions"
          subtitle="Latest student applications."
          action={
            <Link
              to="/admin/admissions"
              className="text-button"
            >
              View all
              <ArrowRight size={13} />
            </Link>
          }
        >
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Program</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {(data?.admissions || []).length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="empty-table"
                    >
                      No recent admissions.
                    </td>
                  </tr>
                ) : (
                  data.admissions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {[item.first_name, item.last_name]
                            .filter(Boolean)
                            .join(" ") || "Unknown applicant"}
                        </strong>
                        <span>
                          {item.application_no}
                        </span>
                      </td>

                      <td>{item.program || "—"}</td>
                      <td>{item.applied_date}</td>

                      <td>
                        <StatusBadge
                          status={item.status}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Activity */}
        <SectionCard
          title="Recent Activity"
          subtitle="Latest actions across the system."
        >
          <div className="notification-list">
            <div className="p-5 text-xs text-text-muted">
              Dashboard activity will appear here.
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Bottom cards */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Upcoming Events"
          subtitle="Important academic dates."
        >
          <div className="notice-list">
            <div className="p-5 text-xs text-text-muted">
              Upcoming events will appear here.
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="System Health"
          subtitle="Current platform status."
        >
          <div className="health-list">
            {(data?.health || []).map(
              (item) => (
                <div
                  key={item.name}
                  className="health-item"
                >
                  <div>
                    <span className="health-dot" />
                    {item.name}
                  </div>

                  <StatusBadge
                    status={item.status || "Active"}
                  />
                </div>
              )
            )}
          </div>

          <div className="system-info">
            <div>
              <span>API</span>
              <strong>
                {data?.systemInfo?.api || "—"}
              </strong>
            </div>

            <div>
              <span>Database</span>
              <strong>
                {data?.systemInfo?.database || "—"}
              </strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Blockchain"
          subtitle="EduChain360 ledger status."
        >
          <div className="blockchain-status">
            <div className="blockchain-icon h-12 w-12">
              <Blocks size={22} />
            </div>

            <div className="flex-1">
              <h3>
                {data?.blockchain?.network ||
                  "Blockchain Network"}
              </h3>

              <p>
                {data?.blockchain?.description ||
                  "Ledger connectivity and verification status."}
              </p>
            </div>

            <StatusBadge
              status={
                data?.blockchain?.status || "Verified"
              }
            />
          </div>

          <div className="border-t border-border p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">
                Verified records
              </span>

              <strong className="text-text-main">
                {data?.blockchain?.verifiedRecords ?? "—"}
              </strong>
            </div>

            <Link
              to="/admin/blockchain"
              className="primary-button full-button"
            >
              <Blocks size={14} />
              Open Blockchain
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}