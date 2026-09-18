import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import AuditLogCard from "../components/dashboard/AuditLogCard";
import { getAuditLogs } from "../services/auditLogService";
import AuditExport from "../components/audit/AuditExport";
import AuditStats from "../components/audit/AuditStats";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [outcome, setOutcome] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    page,
    search,
    action,
    resourceType,
    outcome,
    startDate,
    endDate,
  ]);

  async function fetchLogs() {
    try {
      setLoading(true);

      const data = await getAuditLogs({
        page,
        limit: 10,
        search,
        action,
        resourceType,
        outcome,
        startDate,
        endDate,
      });

      setLogs(data.logs || []);

      if (data.pagination) {
        setPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        Loading audit logs...
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-white"
          />

          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-white"
          >
            <option value="">All Actions</option>
            <option value="TEAM_MEMBER_CREATED">Team Created</option>
            <option value="TEAM_ROLE_UPDATED">Role Updated</option>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="PROFILE_UPDATED">Profile Updated</option>
          </select>

          <select
            value={resourceType}
            onChange={(e) => {
              setResourceType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-white"
          >
            <option value="">All Resources</option>
            <option value="team">Team</option>
            <option value="document">Document</option>
            <option value="profile">Profile</option>
          </select>

          <select
            value={outcome}
            onChange={(e) => {
              setOutcome(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-white"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-white"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-white"
          />
        </div>

        <div className="flex justify-between items-center mt-5">
          <div className="flex gap-3">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 hover:bg-cyan-700 transition disabled:opacity-50"
            >
              <RefreshCcw size={18} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <AuditExport logs={logs} />
          </div>

          <button
            onClick={() => {
              setAction("");
              setOutcome("");
              setResourceType("");
              setSearch("");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
            className="rounded-xl bg-red-600 px-5 py-2 hover:bg-red-700 transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <AuditStats logs={logs} />

        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-slate-400 mt-2">
            Complete history of user activities across your workspace.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-10 text-center text-slate-400">
            No audit logs found.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {logs.map((log) => (
                <AuditLogCard key={log._id} log={log} />
              ))}
            </div>

            <div className="flex items-center justify-between mt-8 border-t border-slate-700 pt-6">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-xl bg-slate-800 px-5 py-2 text-white disabled:opacity-40"
              >
                Previous
              </button>

              <div className="text-center">
                <div className="text-white font-semibold">
                  Page {page} of {pages}
                </div>

                <div className="text-sm text-slate-400">
                  Total Logs : {total}
                </div>
              </div>

              <button
                disabled={page === pages || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-xl bg-cyan-600 px-5 py-2 text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
