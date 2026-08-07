import { useEffect, useMemo, useState } from "react";

import { consultantsApi } from "../../api/consultants";
import { AppHeader } from "../../components/AppHeader";
import { Toast } from "../../components/Toast";
import {
  calculateStats,
  emptyConsultantForm,
  exportConsultantsCsv,
  filterConsultants,
  normalizePagePayload,
  pageSize,
  sortConsultants,
} from "../../utils/consultantUtils";
import { sanitizeConsultantPayload, validateConsultantForm } from "../../utils/validation";
import { ConsultantForm } from "./components/ConsultantForm";
import { ConsultantTable } from "./components/ConsultantTable";
import { DashboardSummary } from "./components/DashboardSummary";
import { DeleteDialog } from "./components/DeleteDialog";

export function ConsultantManagementPage({ session, onLogout }) {
  const [consultants, setConsultants] = useState([]);
  const [formValues, setFormValues] = useState(emptyConsultantForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [notice, setNotice] = useState({
    type: "info",
    message: "Loading consultants from MySQL.",
  });
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => calculateStats(consultants), [consultants]);
  const filteredConsultants = useMemo(
    () => filterConsultants(consultants, searchTerm),
    [consultants, searchTerm]
  );
  const sortedConsultants = useMemo(
    () => sortConsultants(filteredConsultants, sortConfig),
    [filteredConsultants, sortConfig]
  );
  const totalPages = Math.max(Math.ceil(sortedConsultants.length / pageSize), 1);
  const visibleConsultants = sortedConsultants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    loadFromApi();
  }, []);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function updateField(field, value) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
  }

  async function loadFromApi() {
    setLoading(true);
    try {
      const payload = await consultantsApi.list({
        size: 100,
        sortBy: sortConfig.key,
        direction: sortConfig.direction,
      });
      setConsultants(normalizePagePayload(payload));
      setApiOnline(true);
      setNotice({ type: "success", message: "Connected to the Spring Boot API." });
    } catch (error) {
      setApiOnline(false);
      setConsultants([]);
      setNotice({
        type: "warning",
        message: error.status === 401 ? "Please log in again." : "Backend is not running.",
      });
      if (error.status === 401) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validateConsultantForm(formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setNotice({ type: "danger", message: "Please correct the highlighted fields." });
      return;
    }

    if (!apiOnline) {
      setNotice({
        type: "danger",
        message: "Start the Spring Boot backend before saving consultants to MySQL.",
      });
      return;
    }

    try {
      const payload = sanitizeConsultantPayload(formValues);
      const saved = editingId
        ? await consultantsApi.update(editingId, payload)
        : await consultantsApi.create(payload);

      setConsultants((current) =>
        editingId
          ? current.map((consultant) => (consultant.id === editingId ? saved : consultant))
          : [saved, ...current]
      );
      setFormValues(emptyConsultantForm);
      setEditingId(null);
      setCurrentPage(1);
      setNotice({
        type: "success",
        message: editingId ? "Consultant updated successfully." : "Consultant added successfully.",
      });
    } catch (error) {
      setFormErrors(error.fieldErrors || {});
      setNotice({ type: "danger", message: error.message });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await consultantsApi.remove(deleteTarget.id);
      setConsultants((current) => current.filter((consultant) => consultant.id !== deleteTarget.id));
      setDeleteTarget(null);
      setNotice({ type: "success", message: "Consultant deleted successfully." });
    } catch (error) {
      setNotice({ type: "danger", message: error.message });
    }
  }

  function editConsultant(consultant) {
    setEditingId(consultant.id);
    setFormValues({
      name: consultant.name,
      email: consultant.email,
      phone: consultant.phone,
      technology: consultant.technology,
      experience: String(consultant.experience),
      status: consultant.status,
    });
    setFormErrors({});
    document.getElementById("consultant-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormValues(emptyConsultantForm);
    setFormErrors({});
  }

  function changeSort(key) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  return (
    <div className="app-shell">
      <AppHeader userEmail={session.email} onLogout={onLogout} />
      <main>
        <DashboardSummary stats={stats} loading={loading} onRefresh={loadFromApi} />
        <Toast notice={notice} />
        <section className="workspace-grid">
          <ConsultantForm
            values={formValues}
            errors={formErrors}
            editingId={editingId}
            onSubmit={handleSubmit}
            onFieldChange={updateField}
            onCancelEdit={cancelEdit}
          />
          <ConsultantTable
            apiOnline={apiOnline}
            consultants={visibleConsultants}
            currentPage={currentPage}
            totalPages={totalPages}
            searchTerm={searchTerm}
            sortConfig={sortConfig}
            onSearch={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            onSort={changeSort}
            onEdit={editConsultant}
            onDelete={setDeleteTarget}
            onPageChange={setCurrentPage}
            onExport={() => exportConsultantsCsv(sortedConsultants)}
          />
        </section>
      </main>
      <DeleteDialog target={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );
}

