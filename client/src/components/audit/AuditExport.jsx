import { Download } from "lucide-react";

export default function AuditExport({ logs }) {
  const exportCSV = () => {
    if (!logs || logs.length === 0) {
      alert("No audit logs to export.");
      return;
    }

    const headers = [
      "Action",
      "User",
      "Resource",
      "Method",
      "Status",
      "Description",
      "Date",
    ];

    const rows = logs.map((log) => [
      log.action || "",
      log.user?.fullName || "Unknown",
      log.resourceType || "",
      log.method || "",
      log.outcome || "",
      log.description || "",
      new Date(log.createdAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `audit_logs_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportCSV}
      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
    >
      <Download size={18} />
      Export CSV
    </button>
  );
}