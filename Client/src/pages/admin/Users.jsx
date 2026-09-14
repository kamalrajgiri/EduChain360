import React from "react";

import PageHeader from "../../components/admin/PageHeader";
import StatusBadge from "../../components/admin/StatusBadge";

const users = [
  {
    id: "STU-1024",
    name: "Rajan Thapa",
    role: "Student",
    email: "rajan@educhain360.edu.np",
    status: "Active"
  },
  {
    id: "TCH-0142",
    name: "Sita Bista",
    role: "Teacher",
    email: "sita@educhain360.edu.np",
    status: "Active"
  },
  {
    id: "FIN-0031",
    name: "Nabin Joshi",
    role: "Finance",
    email: "nabin@educhain360.edu.np",
    status: "Active"
  },
  {
    id: "LIB-0024",
    name: "Kiran Shah",
    role: "Librarian",
    email: "kiran@educhain360.edu.np",
    status: "Active"
  }
];

function Users() {

  return (
    <>

      <PageHeader
        eyebrow="USER MANAGEMENT"
        title="Users & roles"
        description="Create accounts, assign portal roles and control access across EduChain360."
        action={
          <button className="primary-button">
            + Add user
          </button>
        }
      />

      <section className="card">

        <div className="table-wrapper">

          <table>

            <thead>

              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {users.map(
                (user) => (

                  <tr key={user.id}>

                    <td>
                      <strong>
                        {user.name}
                      </strong>

                      <small>
                        {user.id}
                      </small>
                    </td>

                    <td>
                      <span className="role-badge">
                        {user.role}
                      </span>
                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      <StatusBadge>
                        {user.status}
                      </StatusBadge>
                    </td>

                    <td>
                      <button className="outline-button">
                        Manage
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

export default Users;