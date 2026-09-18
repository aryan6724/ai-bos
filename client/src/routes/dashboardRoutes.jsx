import AuditLogsPage from "../pages/AuditLogsPage";
import DashboardPage from "../pages/DashboardPage";
import AiGeneratorPage from "../pages/AiGeneratorPage";
import AiToolsPage from "../pages/AiToolsPage";
import DocumentsPage from "../pages/DocumentsPage";
import UploadsPage from "../pages/UploadsPage";
import TeamPage from "../pages/TeamPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import BillingPage from "../pages/BillingPage";
import ProfilePage from "../pages/ProfilePage";
import AdminPage from "../pages/AdminPage";
import DocumentChatPage from "../pages/DocumentChatPage";
import NotificationsPage from "../pages/NotificationsPage";
import WorkspacePage from "../pages/workspace/WorkspacePage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import TextImproverPage from "../pages/TextImproverPage";
import TextSummarizerPage from "../pages/TextSummarizerPage";
import TextRewriterPage from "../pages/TextRewriterPage";
import TextTranslatorPage from "../pages/TextTranslatorPage";
import DocumentAnalyzerPage from "../pages/DocumentAnalyzerPage";
import ConversationsPage from "../pages/ConversationsPage";

const ALL_ROLES = ["admin", "manager", "user"];

export const dashboardRoutes = [
  {
    path: "/dashboard",
    element: <DashboardPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/ai-generator",
    element: <AiGeneratorPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/workspace",
    element: <WorkspacePage />,
    allowedRoles: ALL_ROLES,
  },

  // Canonical AI Tools route.
  {
    path: "/dashboard/ai-tools",
    element: <AiToolsPage />,
    allowedRoles: ALL_ROLES,
  },

  // Backward-compatible alias so older buttons/bookmarks do not produce 404.
  {
    path: "/ai-tools",
    element: <AiToolsPage />,
    allowedRoles: ALL_ROLES,
  },

  {
    path: "/dashboard/ai-tools/text-improver",
    element: <TextImproverPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/ai-tools/text-summarizer",
    element: <TextSummarizerPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/ai-tools/text-rewriter",
    element: <TextRewriterPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/ai-tools/text-translator",
    element: <TextTranslatorPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/ai-tools/document-analyzer",
    element: <DocumentAnalyzerPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/documents",
    element: <DocumentsPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/document-chat",
    element: <DocumentChatPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/conversations",
    element: <ConversationsPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/uploads",
    element: <UploadsPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/team",
    element: <TeamPage />,
    allowedRoles: ["admin"],
  },
  {
    path: "/dashboard/audit-logs",
    element: <AuditLogsPage />,
    allowedRoles: ["admin"],
  },
  {
    path: "/dashboard/analytics",
    element: <AnalyticsPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/notifications",
    element: <NotificationsPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/billing",
    element: <BillingPage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/profile",
    element: <ProfilePage />,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/dashboard/admin",
    element: <AdminPage />,
    allowedRoles: ["admin"],
  },
  {
    path: "/dashboard/unauthorized",
    element: <UnauthorizedPage />,
    allowedRoles: ALL_ROLES,
  },
];

export default dashboardRoutes;
