export const emptyConsultantForm = {
  name: "",
  email: "",
  phone: "",
  technology: "",
  experience: "",
  status: "ACTIVE",
};

export const defaultDashboardStats = {
  today: "",
  totalConsultants: 0,
  addedToday: 0,
  newThisMonth: 0,
  activeConsultants: 0,
  inactiveConsultants: 0,
  technologyDistribution: [],
  experienceDistribution: [],
  recentAdditions: [],
};

export const pageSizeOptions = [5, 10, 15, 25];

export const experienceRangeOptions = [
  { value: "all", label: "All experience" },
  { value: "0-2", label: "0-2 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "6-8", label: "6-8 years" },
  { value: "9+", label: "9+ years" },
];

export function normalizePagePayload(payload) {
  return {
    content: payload?.content || [],
    totalPages: Math.max(payload?.totalPages || 1, 1),
    totalElements: payload?.totalElements || 0,
    pageNumber: payload?.number || 0,
    pageSize: payload?.size || 10,
  };
}

export function formatDisplayDate(value) {
  if (!value) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatShortDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getMaxCount(items) {
  return Math.max(...items.map((item) => item.count), 1);
}

export function exportConsultantsCsv(consultants) {
  const header = ["ID", "Name", "Email", "Phone", "Technology", "Experience", "Status", "Created At"];
  const rows = consultants.map((consultant) => [
    consultant.id,
    consultant.name,
    consultant.email,
    consultant.phone,
    consultant.technology,
    consultant.experience,
    consultant.status,
    consultant.createdAt,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "consultants.csv";
  link.click();
  URL.revokeObjectURL(url);
}
