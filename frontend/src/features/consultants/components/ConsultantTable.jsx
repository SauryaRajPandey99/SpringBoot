import {
  ArrowDownUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { formatShortDate } from "../../../utils/consultantUtils";

export function ConsultantTable({
  apiOnline,
  consultants,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  pageSizeOptions,
  searchTerm,
  statusFilter,
  technologyFilter,
  technologyOptions,
  experienceFilter,
  experienceOptions,
  sortConfig,
  loading,
  shortlistIds,
  onSearch,
  onStatusFilter,
  onTechnologyFilter,
  onExperienceFilter,
  onPageSizeChange,
  onSort,
  onEdit,
  onDelete,
  onToggleShortlist,
  onPageChange,
  onExport,
  onExportPdf,
  onRefresh,
  onClearFilters,
  hasActiveFilters,
  exporting,
}) {
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalElements);
  const isCsvExporting = exporting === "directory-csv";
  const isPdfExporting = exporting === "directory-pdf";

  return (
    <section className="table-panel" id="consultants" aria-labelledby="consultants-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Directory</p>
          <h2 id="consultants-title">Consultants</h2>
        </div>
        <div className="table-actions">
          <span className={`connection-pill ${apiOnline ? "online" : "offline"}`}>
            {apiOnline ? "API online" : "Backend offline"}
          </span>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm icon-button"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh consultant table"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm icon-button"
            onClick={onExport}
            disabled={totalElements === 0 || Boolean(exporting)}
            title="Export all matching consultants as CSV"
          >
            <Download size={16} aria-hidden="true" />
            {isCsvExporting ? "Exporting" : "Export CSV"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm icon-button"
            onClick={onExportPdf}
            disabled={totalElements === 0 || Boolean(exporting)}
            title="Export all matching consultants as PDF"
          >
            <FileText size={16} aria-hidden="true" />
            {isPdfExporting ? "Exporting" : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <label className="search-box" htmlFor="consultant-search">
          <Search size={17} aria-hidden="true" />
          <input
            id="consultant-search"
            type="search"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search by ID, name, email, phone, or technology"
          />
        </label>

        <div className="filter-control">
          <Filter size={15} aria-hidden="true" />
          <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)}>
            <option value="all">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="filter-control">
          <select value={technologyFilter} onChange={(event) => onTechnologyFilter(event.target.value)}>
            <option value="all">All technology</option>
            {technologyOptions.map((technology) => (
              <option value={technology} key={technology}>
                {technology}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <select value={experienceFilter} onChange={(event) => onExperienceFilter(event.target.value)}>
            {experienceOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="filter-summary" aria-label="Active table filters">
          {searchTerm.trim() && <FilterChip label={`Search: ${searchTerm.trim()}`} />}
          {statusFilter !== "all" && <FilterChip label={statusFilter === "ACTIVE" ? "Active" : "Inactive"} />}
          {technologyFilter !== "all" && <FilterChip label={technologyFilter} />}
          {experienceFilter !== "all" && (
            <FilterChip label={experienceOptions.find((option) => option.value === experienceFilter)?.label || experienceFilter} />
          )}
          <button type="button" className="clear-filter-button" onClick={onClearFilters}>
            <X size={14} aria-hidden="true" />
            Reset
          </button>
        </div>
      )}

      <div className="table-responsive">
        <table className="table align-middle consultant-table">
          <thead>
            <tr>
              <SortableHeader label="ID" active={sortConfig.key === "id"} onClick={() => onSort("id")} />
              <SortableHeader label="Name" active={sortConfig.key === "name"} onClick={() => onSort("name")} />
              <th>Contact</th>
              <SortableHeader label="Technology" active={sortConfig.key === "technology"} onClick={() => onSort("technology")} />
              <SortableHeader label="Exp." active={sortConfig.key === "experience"} onClick={() => onSort("experience")} />
              <SortableHeader label="Status" active={sortConfig.key === "status"} onClick={() => onSort("status")} />
              <SortableHeader label="Added" active={sortConfig.key === "createdAt"} onClick={() => onSort("createdAt")} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="8" className="empty-state">
                  Loading consultants...
                </td>
              </tr>
            )}
            {!loading &&
              consultants.map((consultant) => {
                const isShortlisted = shortlistIds?.has(consultant.id);

                return (
                  <tr key={consultant.id}>
                    <td className="id-cell">#{consultant.id}</td>
                    <td className="name-cell">{consultant.name}</td>
                    <td>
                      <div className="contact-stack">
                        <span>
                          <Mail size={14} aria-hidden="true" />
                          {consultant.email}
                        </span>
                        <span>
                          <Phone size={14} aria-hidden="true" />
                          {consultant.phone}
                        </span>
                      </div>
                    </td>
                    <td>{consultant.technology}</td>
                    <td>{consultant.experience} yrs</td>
                    <td>
                      <span className={`status-badge ${consultant.status.toLowerCase()}`}>
                        {consultant.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <span className="date-cell">
                        <CalendarDays size={14} aria-hidden="true" />
                        {formatShortDate(consultant.createdAt)}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className={`btn btn-sm action-button shortlist-button ${isShortlisted ? "active" : ""}`}
                          onClick={() => onToggleShortlist?.(consultant)}
                          title={`${isShortlisted ? "Remove" : "Save"} ${consultant.name} in shortlist`}
                        >
                          <Star size={14} aria-hidden="true" />
                          {isShortlisted ? "Saved" : "Save"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm action-button"
                          onClick={() => onEdit(consultant)}
                          title={`Edit ${consultant.name}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm action-button"
                          onClick={() => onDelete(consultant)}
                          title={`Delete ${consultant.name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {!loading && consultants.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-state">
                  {hasActiveFilters ? "No consultants match the current filters." : "No consultants have been added yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-row" aria-label="Consultant table pagination">
        <div className="page-size-control">
          <span>
            {rangeStart}-{rangeEnd} of {totalElements} records
          </span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {pageSizeOptions.map((option) => (
              <option value={option} key={option}>
                {option} / page
              </option>
            ))}
          </select>
        </div>
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
    </section>
  );
}

function SortableHeader({ label, active, onClick }) {
  return (
    <th>
      <button type="button" className={active ? "active-sort" : ""} onClick={onClick}>
        {label} <ArrowDownUp size={14} aria-hidden="true" />
      </button>
    </th>
  );
}

function FilterChip({ label }) {
  return <span className="filter-chip">{label}</span>;
}
