import React from "react";

function PageHeader({
  eyebrow,
  title,
  description,
  action
}) {

  return (
    <section className="page-heading">

      <div>

        <span className="eyebrow">
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>

      </div>

      {action && (
        <div>
          {action}
        </div>
      )}

    </section>
  );
}

export default PageHeader;