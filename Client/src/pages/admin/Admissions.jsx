import React from "react";

import PageHeader from "../../components/admin/PageHeader";
import StatusBadge from "../../components/admin/StatusBadge";

import {
  admissionData
} from "../../data/adminData";

function Admissions() {

  return (
    <>

      <PageHeader
        eyebrow="ADMISSIONS"
        title="Admission management"
        description="Review applications, verify documents and manage the admission workflow."
        action={
          <button className="primary-button">
            + New admission
          </button>
        }
      />

      <section className="card">

        <div className="table-wrapper">

          <table>

            <thead>
              <tr>
                <th>Applicant</th>
                <th>Program</th>
                <th>Level</th>
                <th>Applied</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {admissionData.map(
                (student) => (

                  <tr key={student.id}>

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
                    </td>

                    <td>
                      {student.level}
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

                    <td>
                      <button className="outline-button">
                        Review
                      </button>
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

export default Admissions;