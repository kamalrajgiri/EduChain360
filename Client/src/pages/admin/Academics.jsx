import React from "react";

import PageHeader from "../../components/admin/PageHeader";

const modules = [
  {
    title: "Programs & Courses",
    description:
      "Manage programs, courses, credits and academic structure."
  },
  {
    title: "Classes & Sections",
    description:
      "Configure academic years, classes and sections."
  },
  {
    title: "Attendance",
    description:
      "Monitor institution-wide attendance records."
  },
  {
    title: "Examinations & Results",
    description:
      "Manage exams, grading and result publication."
  }
];

function Academics() {

  return (
    <>

      <PageHeader
        eyebrow="ACADEMICS"
        title="Academic administration"
        description="Configure academic structures and monitor university-wide academic operations."
      />

      <div className="module-grid">

        {modules.map(
          (module) => (

            <article
              className="module-card"
              key={module.title}
            >

              <div className="module-icon">
                AC
              </div>

              <h3>
                {module.title}
              </h3>

              <p>
                {module.description}
              </p>

              <button className="text-button">
                Open module →
              </button>

            </article>

          )
        )}

      </div>

    </>
  );
}

export default Academics;