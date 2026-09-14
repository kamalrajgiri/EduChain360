import React from "react";

import PageHeader from "../../components/admin/PageHeader";

function Library() {

  return (
    <>

      <PageHeader
        eyebrow="LIBRARY"
        title="Library administration"
        description="Monitor books, circulation, members, reservations and library activity."
      />

      <div className="module-grid">

        <article className="module-card">
          <div className="module-icon">
            BK
          </div>
          <h3>
            Books
          </h3>
          <p>
            Manage catalog, copies and categories.
          </p>
          <button className="text-button">
            Open →
          </button>
        </article>

        <article className="module-card">
          <div className="module-icon">
            CR
          </div>
          <h3>
            Circulation
          </h3>
          <p>
            Monitor issue, return and renewal activity.
          </p>
          <button className="text-button">
            Open →
          </button>
        </article>

        <article className="module-card">
          <div className="module-icon">
            MB
          </div>
          <h3>
            Members
          </h3>
          <p>
            View student and staff library memberships.
          </p>
          <button className="text-button">
            Open →
          </button>
        </article>

        <article className="module-card">
          <div className="module-icon">
            FN
          </div>
          <h3>
            Fines & Reports
          </h3>
          <p>
            Manage overdue records and library reports.
          </p>
          <button className="text-button">
            Open →
          </button>
        </article>

      </div>

    </>
  );
}

export default Library;