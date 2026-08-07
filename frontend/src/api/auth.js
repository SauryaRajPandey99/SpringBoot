import { apiRequest } from "./http";

export const authApi = {
  async login(credentials) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
  },

  async register(credentials) {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
  },
};

