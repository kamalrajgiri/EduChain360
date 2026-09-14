import React from "react";

import {
  TrendingUp,
  TrendingDown
} from "lucide-react";

function StatCard({
  title,
  value,
  change,
  description,
  type = "blue"
}) {

  const negative =
    change?.startsWith("-");

  return (
    <article className="stat-card">

      <div
        className={`stat-icon ${type}`}
      >
        <div />
      </div>

      <div className="stat-content">

        <span>
          {title}
        </span>

        <h3>
          {value}
        </h3>

        <div
          className={`stat-change ${
            negative ? "negative" : ""
          }`}
        >

          {negative ? (
            <TrendingDown size={12} />
          ) : (
            <TrendingUp size={12} />
          )}

          <b>
            {change}
          </b>

          <small>
            {description}
          </small>

        </div>

      </div>

    </article>
  );
}

export default StatCard;