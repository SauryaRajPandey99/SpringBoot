import { apiRequest } from "./http";

export const consultantsApi = {
  async list({ search = "", page = 0, size = 100, sortBy = "name", direction = "asc" } = {}) {
    const params = new URLSearchParams({
      search,
      page: String(page),
      size: String(size),
      sortBy,
      direction,
    });
    return apiRequest(`/consultants?${params.toString()}`);
  },

  async stats() {
    return apiRequest("/consultants/stats");
  },

  async create(consultant) {
    return apiRequest("/consultants", {
      method: "POST",
      body: JSON.stringify(consultant),
    });
  },

  async update(id, consultant) {
    return apiRequest(`/consultants/${id}`, {
      method: "PUT",
      body: JSON.stringify(consultant),
    });
  },

  async remove(id) {
    return apiRequest(`/consultants/${id}`, {
      method: "DELETE",
    });
  },
};

