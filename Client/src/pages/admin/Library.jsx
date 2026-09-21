import { useEffect, useState } from "react";
import {
  BookOpen,
  BookMarked,
  Clock3,
  Users,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import StatusBadge from "../../components/admin/StatusBadge.jsx";
import SectionCard from "../../components/admin/SectionCard.jsx";
import { adminApi } from "../../api/adminApi.js";

export default function Library() {
  const [data, setData] = useState({});

  useEffect(() => {
    adminApi
      .getLibrary()
      .then(setData)
      .catch(console.error);
  }, []);

  const stats = data.stats || {};

  return (
    <div>
      <PageHeader
        title="Library"
        subtitle="Monitor books, circulation, members and overdue records."
      />

      <div className="stats-grid">
        <StatCard
          title="Total Books"
          value={stats.books ?? "—"}
          description="Library collection"
          icon={BookOpen}
        />

        <StatCard
          title="Issued"
          value={stats.issued ?? "—"}
          description="Currently borrowed"
          icon={BookMarked}
        />

        <StatCard
          title="Overdue"
          value={stats.overdue ?? "—"}
          description="Require attention"
          icon={Clock3}
          trendType="negative"
        />

        <StatCard
          title="Members"
          value={stats.members ?? "—"}
          description="Active library members"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent Circulation"
          subtitle="Latest book transactions."
        >
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {(data.transactions || []).map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.book}
                        </strong>
                        <span>{item.isbn}</span>
                      </td>

                      <td>{item.member}</td>
                      <td>{item.due_date}</td>

                      <td>
                        <StatusBadge
                          status={
                            item.status || "Active"
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

        <SectionCard
          title="Popular Books"
          subtitle="Most borrowed titles."
        >
          <div className="space-y-3 p-5">
            {(data.popularBooks || []).map(
              (book, index) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-subtle text-xs font-bold text-primary">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-text-main">
                      {book.title}
                    </p>

                    <p className="mt-1 text-[10px] text-text-muted">
                      {book.author}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-primary">
                    {book.issued}
                  </span>
                </div>
              )
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}