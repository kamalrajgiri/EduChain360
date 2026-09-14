import React from "react";

import PageHeader from "../../components/admin/PageHeader";

function Hr() {

  return (
    <>

      <PageHeader
        eyebrow="HR MANAGEMENT"
        title="Human resources"
        description="Manage employee records, attendance, leave, recruitment and staff information."
      />

      <div className="module-grid">

        <article className="module-card">
          <div className="module-icon">
            EM
          </div>
          <h3>
            Employees
          </h3>
          <p>
            Manage staff profiles and employment records.
          </p>
          <button className="text-button">
            Open →
          </button>
        </article>

        <article className="module-card">
          <div className="module-icon">
            AT
          </div>
          <h3>
            Attendance
          </h3>
          <p>
            Review staff attendance records.
          </p>
          <button className="text-button">
            Open →
          </button>
        </article>

        <article className="module-card">
          <div className="module-icon">
            LV
          </div>
          <h3>
            Leave
          </h3>
          <p>
            Monitor and approve staff leave.
          </p>
          <button className="text-button">
            Open →
          </button>
        </article>

        <article className="module-card">
          <div className="module-icon">
            RC
          </div>
          <h3>
            Recruitment
          </h3>
          <p>
            Track vacancies and applicants.
          </p>
          <button className="text-button">
            Open →
          </button>
        </article>

      </div>

    </>
  );
}

export default Hr;