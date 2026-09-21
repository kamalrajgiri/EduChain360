import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import StatusBadge from "../../components/admin/StatusBadge.jsx";
import SectionCard from "../../components/admin/SectionCard.jsx";
import { adminApi } from "../../api/adminApi.js";

export default function Finance() {
  const [data, setData] = useState({});

  useEffect(() => {
    adminApi
      .getFinance()
      .then(setData)
      .catch(console.error);
  }, []);

  const stats = data?.stats || {};

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Monitor fee collection, payments, outstanding balances and revenue."
      />

      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={stats.revenue ?? "—"}
          description="Current academic year"
          icon={CircleDollarSign}
          trend={stats.revenueTrend}
        />

        <StatCard
          title="Collected"
          value={stats.collected ?? "—"}
          description="Successful payments"
          icon={CreditCard}
        />

        <StatCard
          title="Outstanding"
          value={stats.outstanding ?? "—"}
          description="Pending student fees"
          icon={ReceiptText}
          trendType="negative"
        />

        <StatCard
          title="Growth"
          value={stats.growth ?? "—"}
          description="Compared with previous period"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]">
        <SectionCard
          title="Monthly Revenue"
          subtitle="Revenue collected during the current period."
        >
          <div className="bar-chart">
            {(data.monthly || []).map((item) => {
              const max = Math.max(
                ...(data.monthly || []).map(
                  (x) => Number(x.value) || 0
                ),
                1
              );

              const height =
                ((Number(item.value) || 0) / max) *
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
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Fee Collection"
          subtitle="Collection status."
        >
          <div className="p-5">
            <div className="mb-6 text-center">
              <p className="text-3xl font-bold text-primary">
                {stats.collectionRate ?? "—"}
              </p>

              <p className="mt-1 text-[10px] text-text-muted">
                Collection rate
              </p>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-primary-light">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width:
                    stats.collectionRatePercent ||
                    "0%",
                }}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Recent Payments"
          subtitle="Latest transactions."
        >
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {(data.payments || []).map(
                  (payment) => (
                    <tr key={payment.id}>
                      <td>
                        <strong>
                          {payment.student}
                        </strong>
                        <span>
                          {payment.student_id}
                        </span>
                      </td>

                      <td>{payment.invoice}</td>
                      <td>{payment.amount}</td>
                      <td>{payment.date}</td>

                      <td>
                        <StatusBadge
                          status={
                            payment.status || "Paid"
                          }
                        />
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}