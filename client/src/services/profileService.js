import api from "./api";

export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};

export const updateProfile = async (payload) => {
  const response = await api.patch("/profile", payload);
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await api.patch("/profile/password", payload);
  return response.data;
};