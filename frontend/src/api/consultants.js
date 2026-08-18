import { apiRequest } from "./http";

export const consultantsApi = {
  async list({
    search = "",
    page = 0,
    size = 10,
    sortBy = "name",
    direction = "asc",
    status = "",
    technology = "",
    experienceRange = "",
  } = {}) {
    const params = new URLSearchParams({
      search,
      page: String(page),
      size: String(size),
      sortBy,
      direction,
      status,
      technology,
      experienceRange,
    });
    return apiRequest(`/consultants?${params.toString()}`);
  },

  async stats() {
    return apiRequest("/consultants/stats");
  },

  async onboarded({
    source = "all",
    search = "",
    page = 0,
    size = 10,
    sortBy = "importedAt",
    direction = "desc",
  } = {}) {
    const params = new URLSearchParams({
      source,
      search,
      page: String(page),
      size: String(size),
      sortBy,
      direction,
    });
    return apiRequest(`/consultants/onboarded?${params.toString()}`);
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

  async importFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest("/consultants/import", {
      method: "POST",
      body: formData,
    });
  },

  async downloadImportTemplate() {
    return apiRequest("/consultants/import-template", {
      responseType: "blob",
    });
  },
};
