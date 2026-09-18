import api from "./api";

// ======================================================
// COMPLETE ADMIN INTELLIGENCE
// ======================================================

export const getAdminIntelligence = async () => {
  const response = await api.get("/admin/intelligence");
  return response.data;
};

// ======================================================
// ADMIN OVERVIEW
// ======================================================

export const getAdminOverview = async () => {
  const response = await api.get("/admin/overview");
  return response.data;
};

// ======================================================
// ROLE DISTRIBUTION
// ======================================================

export const getAdminRoleDistribution = async () => {
  const response = await api.get("/admin/roles");
  return response.data;
};

// ======================================================
// USERS
// ======================================================

export const getAdminUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

// ======================================================
// DOCUMENTS
// ======================================================

export const getAdminDocuments = async () => {
  const response = await api.get("/admin/documents");
  return response.data;
};

// ======================================================
// AI ACTIVITY
// ======================================================

export const getAdminActivity = async () => {
  const response = await api.get("/admin/activity");
  return response.data;
};

// ======================================================
// AUDIT ACTIVITY
// ======================================================

export const getAdminAuditActivity = async () => {
  const response = await api.get("/admin/audit-activity");
  return response.data;
};

// ======================================================
// USER MANAGEMENT
// ======================================================

export const updateAdminUserStatus = async (
  userId,
  isActive
) => {
  const response = await api.patch(
    `/admin/users/${userId}/status`,
    { isActive }
  );

  return response.data;
};

export const updateAdminUserRole = async (
  userId,
  role
) => {
  const response = await api.patch(
    `/admin/users/${userId}/role`,
    { role }
  );

  return response.data;
};

// ======================================================
// AI TOOL USAGE
// ======================================================

export const getAdminToolUsage = async () => {
  const response = await api.get(
    "/admin/tool-usage"
  );

  return response.data;
};

// ======================================================
// ADMIN INTELLIGENCE ANALYTICS
// ======================================================

export const getAdminAnalytics = async () => {
  const response = await api.get(
    "/admin/analytics"
  );

  return response.data;
};