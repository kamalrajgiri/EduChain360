import React from "react";

import PageHeader from "../../components/admin/PageHeader";

function Analytics() {

  return (
    <>

      <PageHeader
        eyebrow="ANALYTICS & REPORTING"
        title="Institutional analytics"
        description="View performance, attendance, finance and verification insights."
      />

      <div className="insight-grid">

        <div className="insight-card">
          <span>
            Overall pass rate
          </span>
          <strong>
            84.6%
          </strong>
          <small>
            +2.1% vs last term
          </small>
        </div>

        <div className="insight-card">
          <span>
            At-risk students
          </span>
          <strong>
            27
          </strong>
          <small>
            Attendance below 75%
          </small>
        </div>

        <div className="insight-card">
          <span>
            Fee collection
          </span>
          <strong>
            91.2%
          </strong>
          <small>
            +3.4% vs target
          </small>
        </div>

        <div className="insight-card">
          <span>
            Certificates verified
          </span>
          <strong>
            1,204
          </strong>
          <small>
            This term
          </small>
        </div>

      </div>

    </>
  );
}

export default Analytics;