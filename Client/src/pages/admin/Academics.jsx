import { useEffect, useState } from "react";

import {
  BookOpen,
  Building2,
  GraduationCap,
  Users,
  School,
  ClipboardList,
  UserCheck,
  ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";

import PageHeader from "../../components/admin/PageHeader.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import SectionCard from "../../components/admin/SectionCard.jsx";

import { adminApi } from "../../api/adminApi.js";


export default function Academics() {
  const [data, setData] = useState({});
  const [management, setManagement] =
    useState({});

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {
    async function load() {
      try {
        const [
          academicData,
          managementData,
        ] = await Promise.all([
          adminApi.getAcademics(),
          adminApi.getAcademicManagementSummary(),
        ]);

        setData(academicData || {});
        setManagement(
          managementData || {}
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);


  const stats = data?.stats || {};


  return (
    <div>
      <PageHeader
        title="Academics"
        subtitle="Manage classes, subjects, students, teachers and academic assignments."
      />


      {/* EXISTING ACADEMIC STATS */}

      <div className="stats-grid">
        <StatCard
          title="Programs"
          value={stats.programs ?? "—"}
          description="Academic programs"
          icon={GraduationCap}
        />

        <StatCard
          title="Departments"
          value={stats.departments ?? "—"}
          description="Active departments"
          icon={Building2}
        />

        <StatCard
          title="Courses"
          value={stats.courses ?? "—"}
          description="Registered courses"
          icon={BookOpen}
        />

        <StatCard
          title="Faculty"
          value={
            management.teachers ??
            stats.faculty ??
            "—"
          }
          description="Teaching staff"
          icon={Users}
        />
      </div>


      {/* NEW ADMIN MANAGEMENT */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <ManagementCard
          icon={School}
          title="Classes"
          value={
            management.classes ?? 0
          }
          description="Create Grade 11 Science A and other classes."
          href="/admin/academics/classes"
        />

        <ManagementCard
          icon={BookOpen}
          title="Subjects"
          value={
            management.subjects ?? 0
          }
          description="Create Physics, Math, Chemistry and other subjects."
          href="/admin/academics/subjects"
        />

        <ManagementCard
          icon={ClipboardList}
          title="Enrollments"
          value={
            management.enrollments ?? 0
          }
          description="Assign students to classes and roll numbers."
          href="/admin/academics/enrollments"
        />

        <ManagementCard
          icon={UserCheck}
          title="Teacher Assignments"
          value={
            management.assignments ?? 0
          }
          description="Assign teachers to classes and subjects."
          href="/admin/academics/teacher-assignments"
        />
      </div>


      {/* EXISTING PROGRAMS / DEPARTMENTS */}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">

        <SectionCard
          title="Programs"
          subtitle="Current university programs."
        >
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Department</th>
                  <th>Students</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {(data.programs || []).map(
                  (program) => (
                    <tr key={program.id}>
                      <td>
                        <strong>
                          {program.name}
                        </strong>

                        <span>
                          {program.code}
                        </span>
                      </td>

                      <td>
                        {program.department}
                      </td>

                      <td>
                        {program.students}
                      </td>

                      <td>
                        <span className="rounded-full bg-green-50 px-2 py-1 text-[9px] font-bold text-success">
                          Active
                        </span>
                      </td>
                    </tr>
                  )
                )}

                {!loading &&
                  (data.programs || [])
                    .length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="empty-table"
                      >
                        No program data available.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </SectionCard>


        <SectionCard
          title="Departments"
          subtitle="Academic departments and capacity."
        >
          <div className="space-y-3 p-5">
            {(data.departments || []).map(
              (department) => (
                <div
                  key={department.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-text-main">
                        {department.name}
                      </p>

                      <p className="mt-1 text-[10px] text-text-muted">
                        {department.code}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-primary">
                      {department.students}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-light">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(
                          department.capacity ||
                            0,
                          100
                        )}%`,
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


function ManagementCard({
  icon: Icon,
  title,
  value,
  description,
  href,
}) {
  return (
    <Link
      to={href}
      className="dashboard-card group p-5 transition hover:-translate-y-0.5 hover:border-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-light text-primary">
          <Icon size={17} />
        </div>

        <ArrowRight
          size={15}
          className="text-text-muted transition group-hover:translate-x-1 group-hover:text-primary"
        />
      </div>

      <p className="mt-4 text-xs font-bold text-text-main">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold text-primary">
        {value}
      </p>

      <p className="mt-2 text-[10px] leading-4 text-text-muted">
        {description}
      </p>
    </Link>
  );
}