import { useEffect, useState } from "react";
import {
  BarChart3,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import SectionCard from "../../components/admin/SectionCard.jsx";
import { adminApi } from "../../api/adminApi.js";

export default function Analytics() {
  const [data, setData] = useState({});

  useEffect(() => {
    adminApi
      .getAnalytics()
      .then(setData)
      .catch(console.error);
  }, []);

  const metrics = data.metrics || {};

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Understand university performance using system-wide operational data."
      />

      <div className="stats-grid">
        <StatCard
          title="Student Growth"
          value={metrics.studentGrowth ?? "—"}
          description="Current period"
          icon={TrendingUp}
        />

        <StatCard
          title="Active Users"
          value={metrics.activeUsers ?? "—"}
          description="Across all roles"
          icon={Users}
        />

        <StatCard
          title="Academic Activity"
          value={metrics.academicActivity ?? "—"}
          description="Current semester"
          icon={GraduationCap}
        />

        <StatCard
          title="System Events"
          value={metrics.systemEvents ?? "—"}
          description="Recent platform activity"
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Student Growth"
          subtitle="Monthly student activity."
        >
          <div className="bar-chart">
            {(data.studentGrowth || []).map(
              (item) => {
                const max = Math.max(
                  ...(data.studentGrowth || []).map(
                    (x) => Number(x.value) || 0
                  ),
                  1
                );

                const height =
                  ((Number(item.value) || 0) /
                    max) *
                  100;

                return (
                  <div
                    key={item.label}
                    className="chart-column"
                  >
                    <span className="chart-value">
                      {item.value}
                    </span>

                    <div className="chart-track">
                      <div
                        className="chart-bar"
                        style={{
                          height: `${Math.max(
                            height,
                            5
                          )}%`,
                        }}
                      />
                    </div>

                    <span>{item.label}</span>
                  </div>
                );
              }
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="User Distribution"
          subtitle="Users grouped by role."
        >
          <div className="analytics-bars">
            {(data.userDistribution || []).map(
              (item) => (
                <div
                  key={item.label}
                  className="analytics-bar-item"
                >
                  <div>
                    <strong>
                      {item.label}
                    </strong>

                    <span>{item.value}%</span>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${item.value}%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}