import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Database,
  Download,
  FileText,
  RefreshCw,
  Search,
  UploadCloud,
} from "lucide-react";

import { formatShortDate } from "../../../utils/consultantUtils";

const sourceTabs = [
  { value: "all", label: "All files" },
  { value: "EXCEL", label: "Excel" },
  { value: "PDF", label: "PDF" },
];

export function OnboardedPanel({
  consultants,
  loading,
  sourceFilter,
  searchTerm,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  lastImportResult,
  onSourceFilter,
  onSearch,
  onPageChange,
  onRefresh,
  onExport,
  onExportPdf,
  exporting,
}) {
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalElements);
  const isCsvExporting = exporting === "onboarded-csv";
  const isPdfExporting = exporting === "onboarded-pdf";
  const latestRows = lastImportResult?.rows || [];
  const addedRows = latestRows.filter((row) => row.status === "ADDED").length;
  const duplicateRows = latestRows.filter((row) => row.status === "DUPLICATE").length;
  const failedRows = latestRows.filter((row) => row.status === "FAILED").length;

  return (
    <section className="onboarded-panel" aria-labelledby="onboarded-title">
      <div className="onboarded-hero">
        <div>
          <p className="eyebrow">File Onboarding</p>
          <h2 id="onboarded-title">Onboarded from files</h2>
          <span>{totalElements} consultant records linked to Excel or PDF uploads</span>
        </div>
        <div className="panel-actions">
          <button type="button" className="btn btn-outline-primary btn-sm icon-button" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm icon-button"
            onClick={onExport}
            disabled={totalElements === 0 || Boolean(exporting)}
          >
            <Download size={16} aria-hidden="true" />
            {isCsvExporting ? "Exporting" : "Export CSV"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm icon-button"
            onClick={onExportPdf}
            disabled={totalElements === 0 || Boolean(exporting)}
          >
            <FileText size={16} aria-hidden="true" />
            {isPdfExporting ? "Exporting" : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="onboarded-metrics" aria-label="Onboarding summary">
        <MetricCard icon={<Database size={18} aria-hidden="true" />} label="Tracked records" value={totalElements} />
        <MetricCard icon={<UploadCloud size={18} aria-hidden="true" />} label="Latest rows" value={lastImportResult?.totalRows ?? 0} />
        <MetricCard icon={<CheckCircle2 size={18} aria-hidden="true" />} label="Added" value={lastImportResult?.added ?? addedRows} tone="success" />
        <MetricCard icon={<AlertTriangle size={18} aria-hidden="true" />} label="Duplicates" value={lastImportResult?.skippedDuplicates ?? duplicateRows} tone="warning" />
        <MetricCard icon={<AlertTriangle size={18} aria-hidden="true" />} label="Failed" value={lastImportResult?.failedValidation ?? failedRows} tone="danger" />
      </div>

      <div className="onboarded-toolbar">
        <div className="source-tabs" aria-label="Imported source filter">
          {sourceTabs.map((tab) => (
            <button
              type="button"
              className={sourceFilter === tab.value ? "active" : ""}
              onClick={() => onSourceFilter(tab.value)}
              key={tab.value}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="search-box onboarded-search" htmlFor="onboarded-search">
          <Search size={17} aria-hidden="true" />
          <input
            id="onboarded-search"
            type="search"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search imported name, email, technology, or file"
          />
        </label>
      </div>

      <div className="onboarded-layout">
        <div>
          <div className="table-responsive">
            <table className="table align-middle consultant-table onboarded-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Technology</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>File</th>
                  <th>Imported</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      Loading imported consultants...
                    </td>
                  </tr>
                )}

                {!loading &&
                  consultants.map((consultant) => (
                    <tr key={consultant.id}>
                      <td>
                        <span className={`source-badge ${(consultant.onboardingSource || "manual").toLowerCase()}`}>
                          {consultant.onboardingSource || "MANUAL"}
                        </span>
                      </td>
                      <td className="name-cell">{consultant.name}</td>
                      <td>{consultant.email}</td>
                      <td>{consultant.technology}</td>
                      <td>{consultant.experience} yrs</td>
                      <td>
                        <span className={`status-badge ${consultant.status.toLowerCase()}`}>
                          {consultant.status === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{consultant.importFileName || "Uploaded file"}</td>
                      <td>
                        <span className="date-cell">
                          <CalendarDays size={14} aria-hidden="true" />
                          {formatShortDate(consultant.importedAt || consultant.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}

                {!loading && consultants.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      No Excel or PDF onboarding records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-row" aria-label="Onboarded table pagination">
            <span>
              {rangeStart}-{rangeEnd} of {totalElements} imported records
            </span>
            <div className="pager-controls">
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={() => onPageChange((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1 || loading}
                title="Previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={() => onPageChange((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                title="Next page"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <aside className="upload-ledger" aria-label="Latest upload review">
          <div className="mini-heading">
            <UploadCloud size={18} aria-hidden="true" />
            <h3>Latest upload</h3>
          </div>

          {latestRows.length === 0 && <p className="muted-copy">No recent file upload in this session.</p>}

          {latestRows.length > 0 && (
            <div className="upload-ledger-list">
              {latestRows.slice(0, 10).map((row) => (
                <div className={`upload-ledger-row ${row.status.toLowerCase()}`} key={`${row.rowNumber}-${row.email}`}>
                  <span>{row.status === "ADDED" ? <CheckCircle2 size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}</span>
                  <div>
                    <strong>{row.name || `Row ${row.rowNumber}`}</strong>
                    <small>{row.email || row.message}</small>
                  </div>
                  <b>{row.status}</b>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function MetricCard({ icon, label, value, tone = "neutral" }) {
  return (
    <div className={`onboarded-metric ${tone}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
