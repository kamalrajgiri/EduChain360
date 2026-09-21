import { useEffect, useState } from "react";
import {
  Blocks,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import StatusBadge from "../../components/admin/StatusBadge.jsx";
import SectionCard from "../../components/admin/SectionCard.jsx";
import { adminApi } from "../../api/adminApi.js";

export default function Blockchain() {
  const [data, setData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setRefreshing(true);

      const response =
        await adminApi.getBlockchain();

      setData(response);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = data.stats || {};

  return (
    <div>
      <PageHeader
        title="Blockchain"
        subtitle="Monitor ledger connectivity, verification and immutable university records."
        action={
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="secondary-button"
          >
            <RefreshCw
              size={14}
              className={
                refreshing ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard
          title="Verified Records"
          value={stats.verified ?? "—"}
          description="Immutable records"
          icon={CheckCircle2}
        />

        <StatCard
          title="Ledger Entries"
          value={stats.entries ?? "—"}
          description="Total blockchain entries"
          icon={Blocks}
        />

        <StatCard
          title="Network"
          value={stats.network ?? "—"}
          description="Connected network"
          icon={Database}
        />

        <StatCard
          title="Integrity"
          value={stats.integrity ?? "—"}
          description="Ledger integrity"
          icon={ShieldCheck}
        />
      </div>

      <SectionCard
        title="Blockchain Network"
        subtitle="Current ledger connection and verification status."
      >
        <div className="blockchain-status">
          <div className="blockchain-icon h-14 w-14">
            <Blocks size={25} />
          </div>

          <div className="flex-1">
            <h3>
              {data.network?.name ||
                "EduChain360 Blockchain"}
            </h3>

            <p>
              {data.network?.description ||
                "Blockchain infrastructure status."}
            </p>

            <p className="mt-2 font-mono text-[10px] text-text-muted">
              {data.network?.endpoint ||
                "Endpoint configured on server"}
            </p>
          </div>

          <StatusBadge
            status={
              data.network?.status || "Verified"
            }
          />
        </div>
      </SectionCard>

      <div className="mt-6">
        <SectionCard
          title="Recent Ledger Records"
          subtitle="Recent blockchain-backed university records."
        >
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Type</th>
                  <th>Hash</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {(data.records || []).map(
                  (record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>
                          {record.record_id}
                        </strong>
                      </td>

                      <td>{record.type}</td>

                      <td>
                        <span className="hash-text">
                          {record.hash}
                        </span>
                      </td>

                      <td>{record.created_at}</td>

                      <td>
                        <StatusBadge
                          status={
                            record.status ||
                            "Verified"
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