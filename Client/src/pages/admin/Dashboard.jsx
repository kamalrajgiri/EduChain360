import React from "react";

import {
  ArrowRight,
  UserCheck,
  UserX,
  Clock3,
  ShieldCheck
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";

import {
  adminStats,
  admissionData,
  notices
} from "../../data/adminData";

function Dashboard() {

  return (
    <>

      <PageHeader
        eyebrow="ADMINISTRATOR"
        title="University overview"
        description="Monitor and manage every connected EduChain360 module from one centralized workspace."
        action={
          <button className="primary-button">
            + Create record
          </button>
        }
      />

      {/* STATISTICS */}

      <section className="stats-grid">

        {adminStats.map(
          (stat) => (
            <StatCard
              key={stat.title}
              {...stat}
            />
          )
        )}

      </section>

      {/* ANALYTICS */}

      <section className="dashboard-grid">

        <article className="card">

          <div className="card-header">

            <div>
              <h3>
                Fee collection trend
              </h3>

              <p>
                Last 6 months ·
                all departments
              </p>
            </div>

            <select>
              <option>
                2026
              </option>

              <option>
                2025
              </option>
            </select>

          </div>

          <div className="chart">

            <div className="chart-bars">

              {[58, 72, 54, 84, 68, 92]
                .map(
                  (height, index) => (

                    <div
                      key={index}
                      className={`chart-column ${
                        index === 5
                          ? "latest"
                          : ""
                      }`}
                    >

                      <div
                        className="chart-bar"
                        style={{
                          height:
                            `${height}%`
                        }}
                      />

                      <span>
                        {
                          [
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep"
                          ][index]
                        }
                      </span>

                    </div>

                  )
                )}

            </div>

          </div>

        </article>

        {/* ATTENDANCE */}

        <article className="card">

          <div className="card-header">

            <div>
              <h3>
                Attendance today
              </h3>

              <p>
                Across all classes
              </p>
            </div>

            <div className="card-icon">
              <UserCheck size={17} />
            </div>

          </div>

          <div className="attendance">

            <strong>
              94.2%
            </strong>

            <span>
              3,281 of 3,482
              students present
            </span>

          </div>

          <div className="progress">
            <span
              style={{
                width: "94.2%"
              }}
            />
          </div>

          <div className="attendance-list">

            <div>
              <span>
                <UserCheck size={14} />
                Present
              </span>

              <b>
                3,281
              </b>
            </div>

            <div>
              <span>
                <Clock3 size={14} />
                Late
              </span>

              <b>
                94
              </b>
            </div>

            <div>
              <span>
                <UserX size={14} />
                Absent
              </span>

              <b>
                107
              </b>
            </div>

          </div>

        </article>

      </section>

      {/* ADMISSIONS + NOTICES */}

      <section className="dashboard-grid">

        <article className="card">

          <div className="card-header">

            <div>
              <h3>
                Recent admission
                applications
              </h3>

              <p>
                Awaiting document
                verification
              </p>
            </div>

            <button className="text-button">
              View all
              <ArrowRight size={13} />
            </button>

          </div>

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>Applicant</th>
                  <th>Program</th>
                  <th>Applied</th>
                  <th>Documents</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {admissionData.map(
                  (student) => (

                    <tr
                      key={student.id}
                    >

                      <td>
                        <strong>
                          {student.name}
                        </strong>

                        <small>
                          {student.id}
                        </small>
                      </td>

                      <td>
                        {student.program}

                        <small>
                          {student.level}
                        </small>
                      </td>

                      <td>
                        {student.applied}
                      </td>

                      <td>
                        {student.documents}
                      </td>

                      <td>
                        <StatusBadge>
                          {student.status}
                        </StatusBadge>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </article>

        {/* NOTICES */}

        <article className="card">

          <div className="card-header">

            <div>
              <h3>
                Latest notices
              </h3>

              <p>
                Institutional
                communication
              </p>
            </div>

          </div>

          <div className="notice-list">

            {notices.map(
              (notice) => (

                <div
                  className="notice-item"
                  key={notice.title}
                >

                  <div className="notice-dot">
                    •
                  </div>

                  <div>

                    <strong>
                      {notice.title}
                    </strong>

                    <small>
                      {notice.audience}
                      {" · "}
                      {notice.time}
                    </small>

                  </div>

                </div>

              )
            )}

          </div>

        </article>

      </section>

      {/* SYSTEM STATUS */}

      <section className="system-banner">

        <div>

          <span className="eyebrow">
            SYSTEM CONTROL
          </span>

          <h2>
            EduChain360
            administration
          </h2>

          <p>
            Centralized access to
            student, academic,
            finance, HR, library
            and blockchain services.
          </p>

        </div>

        <div className="system-health">

          <ShieldCheck size={17} />

          System healthy

        </div>

      </section>

    </>
  );
}

export default Dashboard;
