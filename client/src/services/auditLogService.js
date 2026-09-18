import api from "./api";

/**
 * Get audit logs with optional filters.
 *
 * Supported query params:
 * page
 * limit
 * action
 * resourceType
 * outcome
 * search (future)
 */
export const getAuditLogs = async ({
  page = 1,
  limit = 20,
  search = "",
  action = "",
  resourceType = "",
  outcome = "",
  startDate = "",
  endDate = "",
} = {}) => {
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("limit", limit);

  if (search) params.append("search", search);

  if (action) params.append("action", action);

  if (resourceType)
    params.append("resourceType", resourceType);

  if (outcome)
    params.append("outcome", outcome);

  if (startDate)
    params.append("startDate", startDate);

  if (endDate)
    params.append("endDate", endDate);

  const response = await api.get(
    `/audit-logs?${params.toString()}`
  );

  return response.data;
};

export const refreshAuditLogs = async () => {
  const response = await api.get("/audit-logs");

  return response.data;
};

export const getAuditActions = () => [
  "",
  "TEAM_MEMBER_CREATED",
  "TEAM_ROLE_UPDATED",
  "TEAM_STATUS_TOGGLED",
  "TEAM_MEMBER_DELETED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_DELETED",
  "DOCUMENT_QUESTION_ASKED",
  "DOCUMENT_CHAT_CLEARED",
  "PROFILE_UPDATED",
  "PASSWORD_CHANGED",
];

export const getResourceTypes = () => [
  "",
  "team",
  "document",
  "document-chat",
  "profile",
  "security",
];

export const getOutcomes = () => [
  "",
  "success",
  "failure",
];