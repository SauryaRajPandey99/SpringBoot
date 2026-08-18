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

export function exportConsultantsCsv(consultants, filename = "consultants.csv") {
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
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportConsultantsPdf(consultants, filename = "consultants.pdf", title = "Consultant Export") {
  const lines = buildPdfLines(consultants, title);
  const pages = chunkLines(lines, 34);
  const objects = [];
  const pageIds = [];
  const fontId = 3;
  let nextObjectId = 4;

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  pages.forEach((pageLines, index) => {
    const pageId = nextObjectId++;
    const contentId = nextObjectId++;
    pageIds.push(pageId);
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    const content = buildPdfPageContent(pageLines, index + 1, pages.length);
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const orderedObjects = objects
    .map((content, id) => ({ id, content }))
    .filter((object) => object.content);
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  orderedObjects.forEach((object) => {
    offsets[object.id] = pdf.length;
    pdf += `${object.id} 0 obj\n${object.content}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  const maxObjectId = Math.max(...orderedObjects.map((object) => object.id));
  pdf += `xref\n0 ${maxObjectId + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let id = 1; id <= maxObjectId; id++) {
    pdf += `${String(offsets[id] || 0).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPdfLines(consultants, title) {
  const timestamp = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
  const rows = consultants.map((consultant) => {
    const importedSource = consultant.onboardingSource && consultant.onboardingSource !== "MANUAL"
      ? ` | ${consultant.onboardingSource}`
      : "";
    return [
      `#${consultant.id}`,
      consultant.name,
      consultant.email,
      consultant.phone,
      consultant.technology,
      `${consultant.experience} yrs`,
      consultant.status,
    ].join("  |  ") + importedSource;
  });

  return [
    title,
    `Generated ${timestamp}`,
    `${consultants.length} record${consultants.length === 1 ? "" : "s"}`,
    "",
    ...rows,
  ];
}

function chunkLines(lines, size) {
  const chunks = [];
  for (let index = 0; index < lines.length; index += size) {
    chunks.push(lines.slice(index, index + size));
  }
  return chunks.length ? chunks : [[]];
}

function buildPdfPageContent(lines, pageNumber, totalPages) {
  const commands = ["BT", "/F1 11 Tf", "50 750 Td"];
  lines.forEach((line, index) => {
    if (index > 0) {
      commands.push("0 -18 Td");
    }
    const fontSize = index === 0 && pageNumber === 1 ? 16 : 10;
    commands.push(`/F1 ${fontSize} Tf`);
    commands.push(`(${escapePdfText(line).slice(0, 112)}) Tj`);
  });
  commands.push("/F1 9 Tf");
  commands.push(`0 -28 Td`);
  commands.push(`(Page ${pageNumber} of ${totalPages}) Tj`);
  commands.push("ET");
  return commands.join("\n");
}

function escapePdfText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}
