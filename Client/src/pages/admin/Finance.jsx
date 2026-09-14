import React from "react";

import PageHeader from "../../components/admin/PageHeader";

function Finance() {

  return (
    <>

      <PageHeader
        eyebrow="FINANCE"
        title="Finance administration"
        description="Centralized visibility into student fees, payments, receipts and financial records."
      />

      <div className="module-grid">

        <article className="module-card">
          <div className="module-icon">
            FS
          </div>
          <h3>
            Fee Structure
          </h3>
          <p>
            Configure program and semester-wise fees.
          </p>
          <button className="text-button">
            Manage →
          </button>
        </article>

        <article className="module-card">
          <div className="module-icon">
            PY
          </div>
          <h3>
            Payments
          </h3>
          <p>
            Monitor student payment activity.
          </p>
          <button className="text-button">
            Manage →
          </button>
        </article>

        <article className="module-card">
          <div className="module-icon">
            RC
          </div>
          <h3>
            Receipts
          </h3>
          <p>
            View and verify financial receipts.
          </p>
          <button className="text-button">
            Manage →
          </button>
        </article>

        <article className="module-card">
          <div className="module-icon">
            RP
          </div>
          <h3>
            Reports
          </h3>
          <p>
            Generate collection and outstanding reports.
          </p>
          <button className="text-button">
            Manage →
          </button>
        </article>

      </div>

    </>
  );
}

export default Finance;