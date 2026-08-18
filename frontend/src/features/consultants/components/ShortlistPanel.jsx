import { Download, FileText, Mail, Pencil, Phone, Star, Trash2 } from "lucide-react";

export function ShortlistPanel({ shortlist, onEdit, onRemove, onExport, onExportPdf }) {
  const hasItems = shortlist.length > 0;

  return (
    <section className="shortlist-panel" aria-labelledby="shortlist-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Saved Consultants</p>
          <h2 id="shortlist-title">Shortlist</h2>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm icon-button"
            onClick={onExport}
            disabled={!hasItems}
            title="Export shortlist as CSV"
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm icon-button"
            onClick={onExportPdf}
            disabled={!hasItems}
            title="Export shortlist as PDF"
          >
            <FileText size={16} aria-hidden="true" />
            Export PDF
          </button>
        </div>
      </div>

      {!hasItems && (
        <div className="empty-state shortlist-empty">
          <Star size={30} aria-hidden="true" />
          <strong>No consultants shortlisted yet.</strong>
          <span>Use the Save button in the consultant table to build a smaller review list.</span>
        </div>
      )}

      {hasItems && (
        <div className="shortlist-grid">
          {shortlist.map((consultant) => (
            <article className="shortlist-card" key={consultant.id}>
              <div className="shortlist-card-top">
                <div>
                  <span className="id-cell">#{consultant.id}</span>
                  <h3>{consultant.name}</h3>
                </div>
                <span className={`status-badge ${(consultant.status || "ACTIVE").toLowerCase()}`}>
                  {consultant.status === "INACTIVE" ? "Inactive" : "Active"}
                </span>
              </div>

              <p>{consultant.technology}</p>

              <div className="preview-details">
                <span>
                  <Mail size={15} aria-hidden="true" />
                  {consultant.email}
                </span>
                <span>
                  <Phone size={15} aria-hidden="true" />
                  {consultant.phone}
                </span>
                <span>{consultant.experience} years of experience</span>
              </div>

              <div className="shortlist-actions">
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
                  className="btn btn-outline-danger btn-sm action-button"
                  onClick={() => onRemove(consultant.id)}
                  title={`Remove ${consultant.name} from shortlist`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
