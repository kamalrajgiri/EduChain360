import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarOff,
  UserCheck,
  Users,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import StatusBadge from "../../components/admin/StatusBadge.jsx";
import SectionCard from "../../components/admin/SectionCard.jsx";
import { adminApi } from "../../api/adminApi.js";

export default function Hr() {
  const [data, setData] = useState({});

  useEffect(() => {
    adminApi
      .getHr()
      .then((response) =>
        setData(response?.data || response || {})
      )
      .catch(console.error);
  }, []);

  const stats = data.stats || {};

  return (
    <div>
      <PageHeader
        title="Human Resources"
        subtitle="Manage staff information, attendance, leave and workforce activity."
      />

      <div className="stats-grid">
        <StatCard
          title="Total Staff"
          value={stats.staff ?? "—"}
          description="University employees"
          icon={Users}
        />

        <StatCard
          title="Present Today"
          value={stats.present ?? "—"}
          description="Staff attendance"
          icon={UserCheck}
        />

        <StatCard
          title="On Leave"
          value={stats.leave ?? "—"}
          description="Approved leave"
          icon={CalendarOff}
        />

        <StatCard
          title="Departments"
          value={stats.departments ?? "—"}
          description="HR departments"
          icon={BriefcaseBusiness}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]">
        <SectionCard
          title="Staff Directory"
          subtitle="Current university employees."
        >
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {(data.employees || []).map(
                  (employee) => (
                    <tr key={employee.id}>
                      <td>
                        <strong>
                          {employee.name}
                        </strong>
                        <span>
                          {employee.employee_id}
                        </span>
                      </td>

                      <td>{employee.department}</td>
                      <td>{employee.position}</td>

                      <td>
                        <StatusBadge
                          status={
                            employee.status ||
                            "Active"
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
          title="Leave Requests"
          subtitle="Recent leave activity."
        >
          <div className="notification-list">
            {(data.leaveRequests || []).map(
              (item) => (
                <div
                  key={item.id}
                  className="notification-item"
                >
                  <div className="notification-icon">
                    <CalendarOff size={16} />
                  </div>

                  <div className="notification-content">
                    <strong>{item.employee}</strong>
                    <p>{item.reason}</p>
                    <span>{item.date}</span>
                  </div>

                  <StatusBadge
                    status={item.status}
                  />
                </div>
              )
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}