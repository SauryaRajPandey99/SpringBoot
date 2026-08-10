import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

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
  onSearch,
  onStatusFilter,
  onTechnologyFilter,
  onExperienceFilter,
  onPageSizeChange,
  onSort,
  onEdit,
  onDelete,
  onPageChange,
  onExport,
}) {
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
            className="btn btn-outline-secondary btn-sm icon-button"
            onClick={onExport}
            disabled={consultants.length === 0}
            title="Export current page as CSV"
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
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

      <div className="table-responsive">
        <table className="table align-middle consultant-table">
          <thead>
            <tr>
              <SortableHeader label="ID" active={sortConfig.key === "id"} onClick={() => onSort("id")} />
              <SortableHeader label="Name" active={sortConfig.key === "name"} onClick={() => onSort("name")} />
              <th>Email</th>
              <SortableHeader label="Technology" active={sortConfig.key === "technology"} onClick={() => onSort("technology")} />
              <SortableHeader label="Exp." active={sortConfig.key === "experience"} onClick={() => onSort("experience")} />
              <SortableHeader label="Status" active={sortConfig.key === "status"} onClick={() => onSort("status")} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" className="empty-state">
                  Loading consultants...
                </td>
              </tr>
            )}
            {!loading &&
              consultants.map((consultant) => (
                <tr key={consultant.id}>
                  <td className="id-cell">#{consultant.id}</td>
                  <td className="name-cell">{consultant.name}</td>
                  <td>{consultant.email}</td>
                  <td>{consultant.technology}</td>
                  <td>{consultant.experience} yrs</td>
                  <td>
                    <span className={`status-badge ${consultant.status.toLowerCase()}`}>
                      {consultant.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
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
              ))}
            {!loading && consultants.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                  No consultants found for the current view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-row" aria-label="Consultant table pagination">
        <div className="page-size-control">
          <span>{totalElements} records</span>
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
