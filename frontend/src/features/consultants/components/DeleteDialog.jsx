import { Trash2 } from "lucide-react";

export function DeleteDialog({ target, onCancel, onConfirm }) {
  if (!target) {
    return null;
  }

  return (
    <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
      <div className="delete-dialog">
        <div className="danger-mark">
          <Trash2 size={28} aria-hidden="true" />
        </div>
        <h2>Delete Consultant</h2>
        <p>
          Are you sure you want to delete <strong>{target.name}</strong>? This action cannot be undone.
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Yes, Delete
          </button>
          <button type="button" className="btn btn-light" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

