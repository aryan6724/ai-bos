import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Loader2,
  Lock,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPageHeader from "../components/dashboard/DashboardPageHeader";
import Card from "../components/ui/Card";

import {
  getAdminIntelligence,
  getAdminAuditActivity,
  getAdminToolUsage,
  getAdminAnalytics,
  updateAdminUserStatus,
  updateAdminUserRole,
} from "../services/adminService";

// ======================================================
// HELPERS
// ======================================================

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getActivityLabel = (type) => {
  if (type === "generation") {
    return "AI Generation";
  }

  if (type === "document-chat") {
    return "Document Chat";
  }

  return "System Activity";
};

const getActivityIcon = (type) => {
  if (type === "generation") {
    return Sparkles;
  }

  if (type === "document-chat") {
    return MessageSquareText;
  }

  return Activity;
};

// ======================================================
// METRIC CARD
// ======================================================

function AdminMetricCard({
  title,
  value,
  description,
  icon: Icon,
  compact = false,
}) {
  return (
    <Card className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.04]">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/[0.05] blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <h3
            className={`mt-3 font-semibold tracking-tight text-white ${
              compact
                ? "text-2xl"
                : "text-3xl"
            }`}
          >
            {value ?? 0}
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400/15">
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

// ======================================================
// SECTION HEADER
// ======================================================

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-300">
          <Icon size={19} />
        </div>
      )}

      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-xl font-semibold text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ======================================================
// ROLE DISTRIBUTION
// ======================================================

function RoleSummary({ roles = [] }) {
  const maxCount = Math.max(
    ...roles.map((role) => Number(role.count) || 0),
    1
  );

  return (
    <Card className="p-6">
      <SectionHeader
        eyebrow="Access Control"
        title="Role Distribution"
        description="Current workspace account permissions."
        icon={ShieldCheck}
      />

      {roles.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-slate-500">
            No role data available.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {roles.map((role) => {
            const count = Number(role.count) || 0;

            const width = Math.max(
              Math.round(
                (count / maxCount) * 100
              ),
              count > 0 ? 8 : 0
            );

            return (
              <div key={role.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium capitalize text-white">
                    {role.label}
                  </p>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                    {count}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all duration-700"
                    style={{
                      width: `${width}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ======================================================
// STATUS ITEM
// ======================================================

function StatusItem({
  label,
  value,
  description,
  icon: Icon,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-cyan-300">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-white">
            {label}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <span className="shrink-0 text-lg font-semibold text-white">
        {value ?? 0}
      </span>
    </div>
  );
}

// ======================================================
// USER ROW
// ======================================================

function UserRow({
  user,
  onToggleStatus,
  onChangeRole,
  updatingUserId,
}) {
  const initial =
    user?.avatarInitial ||
    user?.fullName?.charAt(0) ||
    "U";

  const isUpdating = updatingUserId === user?._id;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-sm font-semibold text-cyan-300">
            {initial.toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user?.fullName || "Unknown User"}
            </p>

            <p className="truncate text-xs text-slate-500">
              {user?.email || "No email"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${
              user?.role === "admin"
                ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                : user?.role === "manager"
                ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
                : "border-white/10 bg-white/[0.04] text-slate-300"
            }`}
          >
            {user?.role || "user"}
          </span>

          <span
            className={`text-[11px] ${
              user?.isActive
                ? "text-emerald-300"
                : "text-rose-300"
            }`}
          >
            {user?.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span>Last login:</span>
          <span className="text-slate-500">
            {formatDate(user?.lastLogin)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={user?.role || "user"}
            onChange={(event) =>
              onChangeRole(user?._id, event.target.value)
            }
            disabled={isUpdating}
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 outline-none transition hover:border-cyan-400/20 focus:border-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Change role for ${user?.fullName || "user"}`}
          >
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="button"
            onClick={() =>
              onToggleStatus(user?._id, !user?.isActive)
            }
            disabled={isUpdating}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              user?.isActive
                ? "border-rose-400/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/15"
                : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
            }`}
          >
            {isUpdating
              ? "Updating..."
              : user?.isActive
              ? "Deactivate"
              : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// DOCUMENT ROW
// ======================================================

function DocumentRow({ document }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <FileText size={18} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {document?.originalName ||
              "Untitled Document"}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {document?.user?.fullName ||
              document?.user?.email ||
              "Unknown User"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${
            document?.status === "ready"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : document?.status ===
                "processing"
              ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
              : "border-rose-400/20 bg-rose-400/10 text-rose-300"
          }`}
        >
          {document?.status || "unknown"}
        </span>

        <span className="text-[11px] text-slate-600">
          {formatDate(document?.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ======================================================
// ACTIVITY ROW
// ======================================================

function ActivityRow({ activity }) {
  const Icon = getActivityIcon(
    activity?.type
  );

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-white">
            {activity?.user?.fullName ||
              activity?.user?.email ||
              "Unknown User"}
          </p>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">
            {getActivityLabel(
              activity?.type
            )}
          </span>
        </div>

        <p className="mt-1 truncate text-sm text-slate-400">
          {activity?.title ||
            activity?.description ||
            "System activity"}
        </p>

        <p className="mt-1 text-[11px] text-slate-600">
          {formatDate(
            activity?.createdAt
          )}
        </p>
      </div>
    </div>
  );
}

// ======================================================
// SECURITY CARD
// ======================================================

function SecurityCard({
  title,
  description,
  status,
  icon: Icon,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 transition hover:bg-white/[0.04]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <Icon size={20} />
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-300">
          {status}
        </span>
      </div>

      <h3 className="font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

// ======================================================
// ADMIN PAGE
// ======================================================

export default function AdminPage() {

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [toolUsage, setToolUsage] = useState(null);
  const [isLoadingToolUsage, setIsLoadingToolUsage] = useState(false);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [userManagementError, setUserManagementError] = useState("");

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      setUpdatingUserId(userId);
      setUserManagementError("");

      const response = await updateAdminUserStatus(
        userId,
        isActive
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update user status."
        );
      }

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          users: (current.users || []).map((user) =>
            String(user._id) === String(userId)
              ? { ...user, ...response.user }
              : user
          ),
        };
      });
    } catch (err) {
      setUserManagementError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update user status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleChangeUserRole = async (userId, role) => {
    try {
      setUpdatingUserId(userId);
      setUserManagementError("");

      const response = await updateAdminUserRole(
        userId,
        role
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update user role."
        );
      }

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          users: (current.users || []).map((user) =>
            String(user._id) === String(userId)
              ? { ...user, ...response.user }
              : user
          ),
        };
      });
    } catch (err) {
      setUserManagementError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update user role."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const loadAuditActivity = async () => {
    try {
      setIsLoadingAudit(true);
      const response = await getAdminAuditActivity();
      setAuditLogs(
        response?.logs ||
          response?.auditLogs ||
          response?.data ||
          []
      );
    } catch (err) {
      console.error("Failed to load audit activity:", err);
      setAuditLogs([]);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const loadToolUsage = async () => {
    try {
      setIsLoadingToolUsage(true);

      const response = await getAdminToolUsage();

      setToolUsage(
        response?.toolUsage || response?.data || null
      );
    } catch (err) {
      console.error("Failed to load AI tool usage:", err);
      setToolUsage(null);
    } finally {
      setIsLoadingToolUsage(false);
    }
  };

  const loadAdminAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true);

      const response = await getAdminAnalytics();

      setAdminAnalytics(
        response?.analytics ||
          response?.data ||
          null
      );
    } catch (err) {
      console.error(
        "Failed to load admin analytics:",
        err
      );

      setAdminAnalytics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response =
        await getAdminIntelligence();

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to load admin intelligence."
        );
      }

      setData(response);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load admin intelligence."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllAdminData = async () => {
    await Promise.allSettled([
      loadAdminData(),
      loadAuditActivity(),
      loadToolUsage(),
      loadAdminAnalytics(),
    ]);
  };

  useEffect(() => {
    loadAdminData();
    loadAuditActivity();
    loadToolUsage();
    loadAdminAnalytics();
  }, []);

  // ====================================================
  // SAFE DATA
  // ====================================================

  const overview = data?.overview || {};

  const roles = Array.isArray(data?.roles)
    ? data.roles
    : [];

  const users = Array.isArray(data?.users)
    ? data.users
    : [];

  const documents = Array.isArray(
    data?.documents
  )
    ? data.documents
    : [];

  const activity = Array.isArray(
    data?.activity
  )
    ? data.activity
    : [];

  const recentUsers = users.slice(0, 6);

  const recentDocuments =
    documents.slice(0, 6);

  const recentActivity =
    activity.slice(0, 8);

  const toolUsageItems = Array.isArray(
    toolUsage?.usage
  )
    ? toolUsage.usage
    : [];

  const analyticsSummary =
    adminAnalytics?.summary || {};

  const analyticsTrend = Array.isArray(
    adminAnalytics?.trend
  )
    ? adminAnalytics.trend
    : [];

  const mostActiveUsers = Array.isArray(
    adminAnalytics?.mostActiveUsers
  )
    ? adminAnalytics.mostActiveUsers
    : [];

  const analyticsToolUsage = Array.isArray(
    adminAnalytics?.toolUsage
  )
    ? adminAnalytics.toolUsage
    : [];

  const maxTrendActivity = Math.max(
    ...analyticsTrend.map(
      (item) => Number(item?.total) || 0
    ),
    1
  );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <DashboardPageHeader
            badge="Admin Intelligence"
            title="Admin Control Center"
            description="Monitor users, documents, AI usage, access control, and workspace activity from one secured intelligence dashboard."
          />

          <button
            type="button"
            onClick={refreshAllAdminData}
            disabled={
              isLoading ||
              isLoadingAudit ||
              isLoadingToolUsage ||
              isLoadingAnalytics
            }
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                isLoading
                  ? "animate-spin"
                  : ""
              }
            />

            {isLoading ||
            isLoadingAudit ||
            isLoadingToolUsage ||
            isLoadingAnalytics
              ? "Refreshing..."
              : "Refresh Data"}
          </button>
        </div>

        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={19}
                className="mt-0.5 shrink-0 text-rose-300"
              />

              <div>
                <p className="text-sm font-medium text-rose-200">
                  Admin data could not be loaded
                </p>

                <p className="mt-1 text-xs text-rose-300/80">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            LOADING
        ========================================== */}

        {isLoading && !data ? (
          <div className="flex min-h-[560px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
            <div className="flex flex-col items-center gap-4">
              <Loader2
                className="animate-spin text-cyan-300"
                size={42}
              />

              <p className="text-sm text-slate-500">
                Loading admin intelligence...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ========================================
                TOP METRICS
            ======================================== */}

            <section>
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                  Workspace Overview
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  System at a glance
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <AdminMetricCard
                  title="Total Users"
                  value={
                    overview.totalUsers
                  }
                  description={`${overview.activeUsers || 0} active accounts`}
                  icon={Users}
                />

                <AdminMetricCard
                  title="Active Users"
                  value={
                    overview.activeUsers
                  }
                  description={`${overview.inactiveUsers || 0} inactive accounts`}
                  icon={UserCheck}
                />

                <AdminMetricCard
                  title="Total Documents"
                  value={
                    overview.totalDocuments
                  }
                  description={`${overview.readyDocuments || 0} ready in vault`}
                  icon={FileText}
                />

                <AdminMetricCard
                  title="Total AI Requests"
                  value={
                    overview.totalRequests
                  }
                  description={`${overview.totalGenerations || 0} generations + ${overview.totalChats || 0} chats`}
                  icon={Activity}
                />
              </div>
            </section>

            {/* ========================================
                SECONDARY METRICS
            ======================================== */}

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <AdminMetricCard
                title="Administrators"
                value={
                  overview.adminUsers
                }
                description="Accounts with admin access"
                icon={ShieldCheck}
                compact
              />

              <AdminMetricCard
                title="Managers"
                value={
                  overview.managerUsers
                }
                description="Accounts with manager access"
                icon={Users}
                compact
              />

              <AdminMetricCard
                title="Processing"
                value={
                  overview.processingDocuments
                }
                description="Documents currently processing"
                icon={Clock3}
                compact
              />

              <AdminMetricCard
                title="Failed Documents"
                value={
                  overview.failedDocuments
                }
                description="Documents requiring attention"
                icon={AlertTriangle}
                compact
              />
            </section>

            {/* ========================================
                USER + DOCUMENT INTELLIGENCE
            ======================================== */}

            <section className="grid gap-6 xl:grid-cols-2">
              {/* USER INTELLIGENCE */}

              <Card className="p-6">
                <SectionHeader
                  eyebrow="User Intelligence"
                  title="Recent Users"
                  description="Latest workspace accounts and their access status."
                  icon={Users}
                />

                {userManagementError && (
                  <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">
                    {userManagementError}
                  </div>
                )}

                {recentUsers.length === 0 ? (
                  <div className="flex min-h-[250px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
                    <p className="text-sm text-slate-500">
                      No users available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map(
                      (user) => (
                        <UserRow
                          key={
                            user._id ||
                            user.id
                          }
                          user={user}
                          onToggleStatus={
                            handleToggleUserStatus
                          }
                          onChangeRole={
                            handleChangeUserRole
                          }
                          updatingUserId={
                            updatingUserId
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </Card>

              {/* DOCUMENT INTELLIGENCE */}

              <Card className="p-6">
                <SectionHeader
                  eyebrow="Document Intelligence"
                  title="Recent Documents"
                  description="Latest documents entering the workspace."
                  icon={FileText}
                />

                {recentDocuments.length ===
                0 ? (
                  <div className="flex min-h-[250px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
                    <p className="text-sm text-slate-500">
                      No documents available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentDocuments.map(
                      (document) => (
                        <DocumentRow
                          key={
                            document._id
                          }
                          document={
                            document
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </Card>
            </section>

            {/* ========================================
                AI TOOL USAGE ANALYTICS
            ======================================== */}

            <section>
              <Card className="p-6">
                <SectionHeader
                  eyebrow="AI Intelligence"
                  title="Most-Used AI Tools"
                  description="Real usage breakdown across AI generation and document chat."
                  icon={BarChart3}
                />

                {isLoadingToolUsage ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading AI tool usage...
                    </div>
                  </div>
                ) : toolUsageItems.length === 0 ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center">
                    <div>
                      <BarChart3 className="mx-auto h-8 w-8 text-slate-600" />
                      <p className="mt-3 text-sm text-slate-500">
                        No AI tool usage recorded yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                          Total Tool Usage
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                          {toolUsage?.totalUsage || 0}
                        </p>
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                        <Sparkles size={20} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {toolUsageItems.map((item) => {
                        const count = Number(item?.count) || 0;
                        const percentage =
                          Number(item?.percentage) || 0;

                        return (
                          <div key={item?.tool || item?.label}>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-white">
                                {item?.label || "AI Tool"}
                              </p>

                              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-300">
                                {count} · {percentage}%
                              </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                              <div
                                className="h-full rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all duration-700"
                                style={{
                                  width: `${Math.min(
                                    Math.max(percentage, 0),
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            </section>

            {/* ========================================
                ADMIN ANALYTICS
            ======================================== */}

            <section>
              <Card className="p-6">
                <SectionHeader
                  eyebrow="Admin Analytics"
                  title="30-Day Workspace Intelligence"
                  description="Real AI activity trends, most active users, and usage patterns from the last 30 days."
                  icon={BarChart3}
                />

                {isLoadingAnalytics ? (
                  <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading admin analytics...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">

                    {/* SUMMARY */}

                    <div className="grid gap-4 sm:grid-cols-3">
                      <AdminMetricCard
                        title="Total Activity"
                        value={analyticsSummary.totalActivity || 0}
                        description="Generations + document chats"
                        icon={Activity}
                        compact
                      />

                      <AdminMetricCard
                        title="Generations"
                        value={analyticsSummary.totalGenerations || 0}
                        description="AI generation activity"
                        icon={Sparkles}
                        compact
                      />

                      <AdminMetricCard
                        title="Document Chats"
                        value={analyticsSummary.totalChats || 0}
                        description="Document conversation activity"
                        icon={MessageSquareText}
                        compact
                      />
                    </div>

                    {/* TREND */}

                    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Daily AI Activity
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Combined generations and document chats.
                          </p>
                        </div>

                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-medium text-cyan-300">
                          Last 30 Days
                        </span>
                      </div>

                      {analyticsTrend.length === 0 ? (
                        <div className="mt-5 flex min-h-[220px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
                          <p className="text-sm text-slate-500">
                            No activity trend available yet.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-6 overflow-x-auto pb-2">
                          <div className="flex min-w-[760px] items-end gap-2">
                            {analyticsTrend.map((item) => {
                              const total =
                                Number(item?.total) || 0;

                              const generations =
                                Number(item?.generations) || 0;

                              const chats =
                                Number(item?.chats) || 0;

                              const height = Math.max(
                                Math.round(
                                  (total / maxTrendActivity) * 180
                                ),
                                total > 0 ? 8 : 2
                              );

                              return (
                                <div
                                  key={item?.date}
                                  className="group flex min-w-[22px] flex-1 flex-col items-center justify-end"
                                  title={`${item?.date || "Unknown"} · ${total} total · ${generations} generations · ${chats} chats`}
                                >
                                  <span className="mb-2 text-[9px] text-slate-600 opacity-0 transition group-hover:opacity-100">
                                    {total}
                                  </span>

                                  <div
                                    className="w-full max-w-[24px] rounded-t-lg bg-cyan-400/70 shadow-lg shadow-cyan-500/10 transition-all duration-500 group-hover:bg-cyan-300"
                                    style={{
                                      height: `${height}px`,
                                    }}
                                  />

                                  <span className="mt-2 text-[9px] text-slate-600">
                                    {item?.date
                                      ? new Date(
                                          item.date
                                        ).toLocaleDateString([], {
                                          month: "short",
                                          day: "numeric",
                                        })
                                      : "—"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACTIVE USERS + TOOLS */}

                    <div className="grid gap-6 xl:grid-cols-2">

                      {/* MOST ACTIVE USERS */}

                      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
                        <div className="mb-5">
                          <p className="text-sm font-semibold text-white">
                            Most Active Users
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Highest AI activity over the last 30 days.
                          </p>
                        </div>

                        {mostActiveUsers.length === 0 ? (
                          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
                            <p className="text-sm text-slate-500">
                              No active-user analytics available.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {mostActiveUsers
                              .slice(0, 10)
                              .map((user, index) => (
                                <div
                                  key={
                                    user?.userId ||
                                    user?._id ||
                                    index
                                  }
                                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-xs font-semibold text-cyan-300">
                                        {index + 1}
                                      </div>

                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">
                                          {user?.fullName ||
                                            "Unknown User"}
                                        </p>

                                        <p className="truncate text-[11px] text-slate-600">
                                          {user?.email ||
                                            "No email"}
                                        </p>
                                      </div>
                                    </div>

                                    <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                                      {Number(user?.total) || 0} total
                                    </span>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-slate-400">
                                      {Number(user?.generations) || 0} generations
                                    </span>

                                    <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-slate-400">
                                      {Number(user?.chats) || 0} chats
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* ANALYTICS TOOL USAGE */}

                      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
                        <div className="mb-5">
                          <p className="text-sm font-semibold text-white">
                            30-Day Tool Activity
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            AI generation tools used across the workspace.
                          </p>
                        </div>

                        {analyticsToolUsage.length === 0 ? (
                          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
                            <p className="text-sm text-slate-500">
                              No tool analytics available.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {analyticsToolUsage
                              .slice(0, 8)
                              .map((item) => {
                                const count =
                                  Number(item?.count) || 0;

                                const maxCount = Math.max(
                                  ...analyticsToolUsage.map(
                                    (tool) =>
                                      Number(tool?.count) || 0
                                  ),
                                  1
                                );

                                const width = Math.max(
                                  Math.round(
                                    (count / maxCount) * 100
                                  ),
                                  count > 0 ? 8 : 0
                                );

                                return (
                                  <div
                                    key={
                                      item?.tool ||
                                      item?.label
                                    }
                                  >
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                      <span className="truncate text-sm font-medium text-white">
                                        {item?.label ||
                                          item?.tool ||
                                          "AI Tool"}
                                      </span>

                                      <span className="shrink-0 text-xs font-semibold text-cyan-300">
                                        {count}
                                      </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                                      <div
                                        className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                                        style={{
                                          width: `${width}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </Card>
            </section>

            {/* ========================================
                AI + DOCUMENT STATUS
            ======================================== */}

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              {/* AI USAGE */}

              <Card className="p-6">
                <SectionHeader
                  eyebrow="AI Intelligence"
                  title="AI Usage"
                  description="Workspace-wide AI generation and document-chat activity."
                  icon={Sparkles}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <StatusItem
                    label="Generations"
                    value={
                      overview.totalGenerations
                    }
                    description="AI document generations"
                    icon={Sparkles}
                  />

                  <StatusItem
                    label="Document Chats"
                    value={
                      overview.totalChats
                    }
                    description="Saved document conversations"
                    icon={MessageSquareText}
                  />

                  <StatusItem
                    label="Requests"
                    value={
                      overview.totalRequests
                    }
                    description="Combined AI activity"
                    icon={Activity}
                  />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <SecurityCard
                    title="AI Generator"
                    description={`${overview.totalGenerations || 0} generation records are available in the workspace.`}
                    status="Online"
                    icon={Sparkles}
                  />

                  <SecurityCard
                    title="Document Chat"
                    description={`${overview.totalChats || 0} document chat interactions are stored.`}
                    status="Online"
                    icon={MessageSquareText}
                  />
                </div>
              </Card>

              {/* DOCUMENT STATUS */}

              <Card className="p-6">
                <SectionHeader
                  eyebrow="Document Operations"
                  title="Vault Health"
                  description="Current document processing status."
                  icon={FileCheck2}
                />

                <div className="space-y-3">
                  <StatusItem
                    label="Ready"
                    value={
                      overview.readyDocuments
                    }
                    description="Successfully processed"
                    icon={FileCheck2}
                  />

                  <StatusItem
                    label="Processing"
                    value={
                      overview.processingDocuments
                    }
                    description="Currently being processed"
                    icon={Clock3}
                  />

                  <StatusItem
                    label="Failed"
                    value={
                      overview.failedDocuments
                    }
                    description="Processing failed"
                    icon={AlertTriangle}
                  />

                  <StatusItem
                    label="Total"
                    value={
                      overview.totalDocuments
                    }
                    description="All active documents"
                    icon={FileText}
                  />
                </div>
              </Card>
            </section>

            {/* ========================================
                ROLES + SECURITY
            ======================================== */}

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <RoleSummary
                roles={roles}
              />

              <Card className="p-6">
                <SectionHeader
                  eyebrow="Security"
                  title="Workspace Health"
                  description="Core authentication and system modules."
                  icon={ShieldCheck}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <SecurityCard
                    title="Authentication"
                    description="JWT authentication is active for protected API and dashboard routes."
                    status="Active"
                    icon={Lock}
                  />

                  <SecurityCard
                    title="Admin Protection"
                    description="Admin intelligence endpoints verify the authenticated user's admin role."
                    status="Secured"
                    icon={ShieldCheck}
                  />

                  <SecurityCard
                    title="Team Access"
                    description={`${overview.totalUsers || 0} workspace accounts are currently registered.`}
                    status="Connected"
                    icon={Users}
                  />

                  <SecurityCard
                    title="Document Vault"
                    description={`${overview.totalDocuments || 0} active documents are available to the workspace.`}
                    status="Live"
                    icon={FileText}
                  />
                </div>
              </Card>
            </section>

            {/* ========================================
                RECENT ACTIVITY
            ======================================== */}

            <section>
              <Card className="p-6">
                <SectionHeader
                  eyebrow="System Activity"
                  title="Recent AI Activity"
                  description="Latest generation and document-chat events across the workspace."
                  icon={Activity}
                />

                {recentActivity.length ===
                0 ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
                    <p className="text-sm text-slate-500">
                      No recent AI activity available.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {recentActivity.map(
                      (item, index) => (
                        <ActivityRow
                          key={
                            item.id ||
                            item._id ||
                            index
                          }
                          activity={item}
                        />
                      )
                    )}
                  </div>
                )}
              </Card>
            </section>

            {/* ========================================
                AUDIT ACTIVITY
            ======================================== */}

            <section>
              <Card className="overflow-hidden p-6">
                <SectionHeader
                  eyebrow="Security Intelligence"
                  title="Recent Audit Activity"
                  description="Security and workspace actions recorded across the system."
                  icon={ShieldCheck}
                />

                {isLoadingAudit ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading audit activity...
                    </div>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center">
                    <div>
                      <ShieldCheck className="mx-auto h-8 w-8 text-slate-600" />
                      <p className="mt-3 text-sm text-slate-500">
                        No audit activity available yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border border-white/10">
                    <div className="min-w-[900px]">
                      <div className="grid grid-cols-[1.2fr_1fr_1fr_1.5fr_120px] gap-4 border-b border-white/10 bg-white/[0.025] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <div>User</div>
                        <div>Action</div>
                        <div>Resource</div>
                        <div>Description</div>
                        <div>Status</div>
                      </div>

                      <div className="divide-y divide-white/5">
                        {auditLogs.slice(0, 10).map((log, index) => {
                          const isSuccess = log?.outcome === "success";

                          return (
                            <div
                              key={log?._id || log?.id || index}
                              className="grid grid-cols-[1.2fr_1fr_1fr_1.5fr_120px] gap-4 px-4 py-4 transition hover:bg-white/[0.025]"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                  {log?.user?.fullName ||
                                    log?.user?.email ||
                                    "Unknown User"}
                                </p>
                                <p className="mt-1 truncate text-[11px] text-slate-600">
                                  {formatDate(log?.createdAt)}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <span className="inline-flex max-w-full truncate rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
                                  {log?.action || "—"}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm capitalize text-slate-400">
                                  {log?.resourceType || "—"}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <p
                                  className="truncate text-sm text-slate-400"
                                  title={log?.description || ""}
                                >
                                  {log?.description || "No description"}
                                </p>
                              </div>

                              <div>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                    isSuccess
                                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                      : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                                  }`}
                                >
                                  {isSuccess ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                  )}
                                  {isSuccess ? "Success" : "Failure"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </section>

            {/* ========================================
                ADMIN STATUS
            ======================================== */}

            <section>
              <Card className="overflow-hidden p-6">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                        <CheckCircle2
                          size={21}
                        />
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                          Admin System
                        </p>

                        <h2 className="mt-1 text-xl font-semibold text-white">
                          Intelligence Center Online
                        </h2>
                      </div>
                    </div>

                    <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
                      Admin intelligence is connected to
                      real MongoDB workspace data for users,
                      documents, AI generations, document
                      chats, and role distribution.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Live Data
                    </span>

                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300">
                      Admin Only
                    </span>
                  </div>
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}