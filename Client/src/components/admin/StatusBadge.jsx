const statusStyles = {
  Approved: "bg-green-50 text-success",
  Active: "bg-green-50 text-success",
  Verified: "bg-green-50 text-success",
  Completed: "bg-green-50 text-success",
  Paid: "bg-green-50 text-success",

  Pending: "bg-amber-50 text-warning",
  Processing: "bg-amber-50 text-warning",
  "Under Review": "bg-amber-50 text-warning",

  Rejected: "bg-red-50 text-danger",
  Inactive: "bg-red-50 text-danger",
  Failed: "bg-red-50 text-danger",

  Blockchain: "bg-secondary-subtle text-secondary",
  Neutral: "bg-background text-text-muted",
};

export default function StatusBadge({ status }) {
  const style =
    statusStyles[status] || statusStyles.Neutral;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold ${style}`}
    >
      {status}
    </span>
  );
}