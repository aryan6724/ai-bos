import api from "./api";

export const getDashboardOverview = async () => {
  const response = await api.get("/analytics/overview");

  return response.data;
};

export const getFullAnalytics = async () => {
  const response = await api.get("/analytics/full");

  return response.data;
};

export const getConversationAnalytics = async () => {
  const response = await api.get("/conversations/analytics");

  return response.data;
};