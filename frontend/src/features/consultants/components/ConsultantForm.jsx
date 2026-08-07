import { UserPlus } from "lucide-react";

export function ConsultantForm({
  values,
  errors,
  editingId,
  onSubmit,
  onFieldChange,
  onCancelEdit,
}) {
  return (
    <form className="form-panel" id="consultant-form" onSubmit={onSubmit} noValidate>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{editingId ? "Update" : "Create"}</p>
          <h2>{editingId ? "Update Consultant" : "Add Consultant"}</h2>
        </div>
        {editingId && (
          <button type="button" className="btn btn-light btn-sm" onClick={onCancelEdit}>
            Cancel Edit
          </button>
        )}
      </div>

      <label className="form-label" htmlFor="name">
        Name
      </label>
      <input
        id="name"
        className={`form-control ${errors.name ? "is-invalid" : ""}`}
        value={values.name}
        onChange={(event) => onFieldChange("name", event.target.value)}
        placeholder="Enter name"
      />
      {errors.name && <div className="invalid-feedback">{errors.name}</div>}

      <label className="form-label" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        className={`form-control ${errors.email ? "is-invalid" : ""}`}
        value={values.email}
        onChange={(event) => onFieldChange("email", event.target.value)}
        placeholder="Enter email"
      />
      {errors.email && <div className="invalid-feedback">{errors.email}</div>}

      <label className="form-label" htmlFor="phone">
        Phone
      </label>
      <input
        id="phone"
        className={`form-control ${errors.phone ? "is-invalid" : ""}`}
        value={values.phone}
        onChange={(event) => onFieldChange("phone", event.target.value)}
        placeholder="+1 555 230 1000"
      />
      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}

      <label className="form-label" htmlFor="technology">
        Technology
      </label>
      <input
        id="technology"
        className={`form-control ${errors.technology ? "is-invalid" : ""}`}
        value={values.technology}
        onChange={(event) => onFieldChange("technology", event.target.value)}
        placeholder="Java, Spring Boot"
      />
      {errors.technology && <div className="invalid-feedback">{errors.technology}</div>}

      <div className="field-row">
        <div>
          <label className="form-label" htmlFor="experience">
            Experience
          </label>
          <input
            id="experience"
            type="number"
            min="0"
            max="50"
            className={`form-control ${errors.experience ? "is-invalid" : ""}`}
            value={values.experience}
            onChange={(event) => onFieldChange("experience", event.target.value)}
            placeholder="5"
          />
          {errors.experience && <div className="invalid-feedback">{errors.experience}</div>}
        </div>
        <div>
          <label className="form-label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            className="form-select"
            value={values.status}
            onChange={(event) => onFieldChange("status", event.target.value)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <button type="submit" className="btn btn-success submit-button">
        <UserPlus size={17} aria-hidden="true" />
        {editingId ? "Update Consultant" : "Save Consultant"}
      </button>
    </form>
  );
}

