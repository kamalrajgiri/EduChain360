import React from "react";

import PageHeader from "../../components/admin/PageHeader";
import StatusBadge from "../../components/admin/StatusBadge";

function Blockchain() {

  const records = [
    {
      id: "BC-009214",
      type: "Certificate",
      owner: "Rajan Thapa",
      date: "Sep 06, 2026"
    },
    {
      id: "BC-009213",
      type: "Fee Receipt",
      owner: "Anisha Joshi",
      date: "Sep 06, 2026"
    },
    {
      id: "BC-009212",
      type: "Transcript",
      owner: "Sujata Bhandari",
      date: "Sep 05, 2026"
    }
  ];

  return (
    <>

      <PageHeader
        eyebrow="BLOCKCHAIN VERIFY"
        title="Trusted records"
        description="Monitor blockchain-anchored university records and verify their integrity."
        action={
          <button className="primary-button">
            Verify record
          </button>
        }
      />

      <div className="insight-grid">

        <div className="insight-card">
          <span>
            Anchored records
          </span>
          <strong>
            9,214
          </strong>
          <small>
            100% integrity verified
          </small>
        </div>

        <div className="insight-card">
          <span>
            Latest block
          </span>
          <strong>
            #8791
          </strong>
          <small>
            Confirmed
          </small>
        </div>

        <div className="insight-card">
          <span>
            Verification requests
          </span>
          <strong>
            1,204
          </strong>
          <small>
            This term
          </small>
        </div>

      </div>

      <section className="card">

        <div className="card-header">

          <div>
            <h3>
              Recent blockchain records
            </h3>

            <p>
              Immutable verification references
            </p>
          </div>

        </div>

        <div className="table-wrapper">

          <table>

            <thead>

              <tr>
                <th>Record ID</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Date</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {records.map(
                (record) => (

                  <tr key={record.id}>

                    <td>
                      <strong>
                        {record.id}
                      </strong>
                    </td>

                    <td>
                      {record.type}
                    </td>

                    <td>
                      {record.owner}
                    </td>

                    <td>
                      {record.date}
                    </td>

                    <td>
                      <StatusBadge>
                        Verified
                      </StatusBadge>
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </section>

    </>
  );
}

export default Blockchain;