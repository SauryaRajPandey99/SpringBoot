import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

export function ConsultantTable({
  apiOnline,
  consultants,
  currentPage,
  totalPages,
  searchTerm,
  onSearch,
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
          <h2 id="consultants-title">All Consultants</h2>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm icon-button"
          onClick={onExport}
          title="Export visible consultants as CSV"
        >
          <Download size={16} aria-hidden="true" />
          Export CSV
        </button>
      </div>

      <div className="search-row">
        <div className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search Consultants"
            aria-label="Search Consultants"
          />
        </div>
        <span className={`connection-pill ${apiOnline ? "online" : "offline"}`}>
          {apiOnline ? "API online" : "Backend offline"}
        </span>
      </div>

      <div className="table-responsive">
        <table className="table align-middle consultant-table">
          <thead>
            <tr>
              <th>ID</th>
              <SortableHeader label="Name" onClick={() => onSort("name")} />
              <th>Email</th>
              <SortableHeader label="Technology" onClick={() => onSort("technology")} />
              <SortableHeader label="Exp." onClick={() => onSort("experience")} />
              <SortableHeader label="Status" onClick={() => onSort("status")} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultants.map((consultant) => (
              <tr key={consultant.id}>
                <td>{consultant.id}</td>
                <td className="name-cell">{consultant.name}</td>
                <td>{consultant.email}</td>
                <td>{consultant.technology}</td>
                <td>{consultant.experience}</td>
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
            {consultants.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                  No consultants match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-row" aria-label="Consultant table pagination">
        <button
          type="button"
          className="btn btn-light btn-sm"
          onClick={() => onPageChange((page) => Math.max(page - 1, 1))}
          disabled={currentPage === 1}
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
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function SortableHeader({ label, onClick }) {
  return (
    <th>
      <button type="button" onClick={onClick}>
        {label} <ArrowDownUp size={14} aria-hidden="true" />
      </button>
    </th>
  );
}

