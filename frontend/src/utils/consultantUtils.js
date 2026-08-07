export const emptyConsultantForm = {
  name: "",
  email: "",
  phone: "",
  technology: "",
  experience: "",
  status: "ACTIVE",
};

export const pageSize = 5;

export function calculateStats(records) {
  const now = new Date();
  return {
    totalConsultants: records.length,
    newThisMonth: records.filter((consultant) => {
      const createdAt = new Date(consultant.createdAt);
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth()
      );
    }).length,
    activeConsultants: records.filter((consultant) => consultant.status === "ACTIVE").length,
    inactiveConsultants: records.filter((consultant) => consultant.status === "INACTIVE").length,
  };
}

export function normalizePagePayload(payload) {
  return Array.isArray(payload) ? payload : payload.content || [];
}

export function filterConsultants(consultants, searchTerm) {
  const term = searchTerm.trim().toLowerCase();
  if (!term) {
    return consultants;
  }

  return consultants.filter(
    (consultant) =>
      consultant.name.toLowerCase().includes(term) ||
      consultant.technology.toLowerCase().includes(term) ||
      consultant.experience.toString().includes(term)
  );
}

export function sortConsultants(consultants, sortConfig) {
  return [...consultants].sort((left, right) => {
    const leftValue = left[sortConfig.key];
    const rightValue = right[sortConfig.key];

    if (sortConfig.key === "experience" || sortConfig.key === "id") {
      return sortConfig.direction === "asc"
        ? Number(leftValue) - Number(rightValue)
        : Number(rightValue) - Number(leftValue);
    }

    return sortConfig.direction === "asc"
      ? String(leftValue).localeCompare(String(rightValue))
      : String(rightValue).localeCompare(String(leftValue));
  });
}

export function exportConsultantsCsv(consultants) {
  const header = ["Name", "Email", "Phone", "Technology", "Experience", "Status"];
  const rows = consultants.map((consultant) => [
    consultant.name,
    consultant.email,
    consultant.phone,
    consultant.technology,
    consultant.experience,
    consultant.status,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "consultants.csv";
  link.click();
  URL.revokeObjectURL(url);
}

