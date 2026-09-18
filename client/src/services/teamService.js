import api from "./api";

export const getTeamMembers = async () => {
  const response = await api.get("/team");
  return response.data;
};

export const createTeamMember = async (payload) => {
  const response = await api.post("/team", payload);
  return response.data;
};

export const updateTeamMemberRole = async ({ userId, role }) => {
  const response = await api.patch(`/team/${userId}/role`, {
    role,
  });

  return response.data;
};

export const toggleTeamMemberStatus = async (userId) => {
  const response = await api.patch(`/team/${userId}/status`);
  return response.data;
};

export const deleteTeamMember = async (userId) => {
  const response = await api.delete(`/team/${userId}`);
  return response.data;
};