import React from "react";

function StatusBadge({
  children
}) {

  const value =
    String(children).toLowerCase();

  let type = "neutral";

  if (
    [
      "active",
      "verified",
      "ready",
      "paid",
      "healthy"
    ].includes(value)
  ) {
    type = "success";
  }

  if (
    [
      "pending",
      "processing",
      "review"
    ].includes(value)
  ) {
    type = "warning";
  }

  if (
    [
      "inactive",
      "failed",
      "tampered",
      "unpaid"
    ].includes(value)
  ) {
    type = "danger";
  }

  return (
    <span
      className={`status-badge ${type}`}
    >
      {children}
    </span>
  );
}

export default StatusBadge;