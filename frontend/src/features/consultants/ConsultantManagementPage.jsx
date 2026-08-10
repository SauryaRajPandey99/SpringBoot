import { useEffect, useMemo, useState } from "react";
import { DatabaseZap } from "lucide-react";

import { consultantsApi } from "../../api/consultants";
import { AppHeader } from "../../components/AppHeader";
import { Toast } from "../../components/Toast";
import {
  defaultDashboardStats,
  emptyConsultantForm,
  experienceRangeOptions,
  exportConsultantsCsv,
  normalizePagePayload,
  pageSizeOptions,
} from "../../utils/consultantUtils";
import { sanitizeConsultantPayload, validateConsultantForm } from "../../utils/validation";
import { ConsultantForm } from "./components/ConsultantForm";
import { ConsultantTable } from "./components/ConsultantTable";
import { DashboardSummary } from "./components/DashboardSummary";
import { DeleteDialog } from "./components/DeleteDialog";
import { ImportPanel } from "./components/ImportPanel";

export function ConsultantManagementPage({ session, onLogout }) {
  const [consultants, setConsultants] = useState([]);
  const [stats, setStats] = useState(defaultDashboardStats);
  const [pageMeta, setPageMeta] = useState({ totalPages: 1, totalElements: 0 });
  const [formValues, setFormValues] = useState(emptyConsultantForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [technologyFilter, setTechnologyFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [notice, setNotice] = useState({
    type: "info",
    message: "Loading consultants from MySQL.",
  });
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const technologyOptions = useMemo(
    () => stats.technologyDistribution.map((item) => item.label),
    [stats.technologyDistribution]
  );

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      try {
        const [listPayload, statsPayload] = await Promise.all([
          consultantsApi.list({
            search: searchTerm,
            page: currentPage - 1,
            size: pageSize,
            sortBy: sortConfig.key,
            direction: sortConfig.direction,
            status: statusFilter === "all" ? "" : statusFilter,
            technology: technologyFilter === "all" ? "" : technologyFilter,
            experienceRange: experienceFilter === "all" ? "" : experienceFilter,
          }),
          consultantsApi.stats(),
        ]);

        if (ignore) {
          return;
        }

        const page = normalizePagePayload(listPayload);
        setConsultants(page.content);
        setPageMeta({ totalPages: page.totalPages, totalElements: page.totalElements });
        setStats({ ...defaultDashboardStats, ...statsPayload });
        setApiOnline(true);
        setNotice({ type: "success", message: "Connected to the Spring Boot API." });
      } catch (error) {
        if (ignore) {
          return;
        }

        setApiOnline(false);
        setConsultants([]);
        setPageMeta({ totalPages: 1, totalElements: 0 });
        setNotice({
          type: "warning",
          message: error.status === 401 ? "Please log in again." : "Backend is not running.",
        });
        if (error.status === 401) {
          onLogout();
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [
    currentPage,
    experienceFilter,
    onLogout,
    pageSize,
    refreshKey,
    searchTerm,
    sortConfig.direction,
    sortConfig.key,
    statusFilter,
    technologyFilter,
  ]);

  function refreshData() {
    setRefreshKey((key) => key + 1);
  }

  function updateField(field, value) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
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

      setFormValues(emptyConsultantForm);
      setEditingId(null);
      setCurrentPage(1);
      refreshData();
      setNotice({
        type: "success",
        message: editingId
          ? `${saved.name} was updated successfully.`
          : `${saved.name} was added successfully.`,
      });
    } catch (error) {
      setFormErrors(error.fieldErrors || {});
      setNotice({ type: "danger", message: error.message });
    }
  }

  async function handleImport(file) {
    if (!apiOnline) {
      setNotice({
        type: "danger",
        message: "Start the Spring Boot backend before importing consultants.",
      });
      return;
    }

    setImporting(true);
    try {
      const result = await consultantsApi.importExcel(file);
      setImportResult(result);
      setCurrentPage(1);
      refreshData();
      setNotice({
        type: result.failedValidation > 0 ? "warning" : "success",
        message: `Import complete: ${result.added} added, ${result.skippedDuplicates} duplicates skipped, ${result.failedValidation} failed.`,
      });
    } catch (error) {
      setNotice({ type: "danger", message: error.message });
    } finally {
      setImporting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await consultantsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      refreshData();
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
    setCurrentPage(1);
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function updateSearch(value) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  function updateStatusFilter(value) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function updateTechnologyFilter(value) {
    setTechnologyFilter(value);
    setCurrentPage(1);
  }

  function updateExperienceFilter(value) {
    setExperienceFilter(value);
    setCurrentPage(1);
  }

  function updatePageSize(value) {
    setPageSize(value);
    setCurrentPage(1);
  }

  return (
    <div className="app-shell">
      <AppHeader userEmail={session.email} onLogout={onLogout} />
      <main className="app-main">
        <section className="hero-strip" aria-label="Application summary">
          <div>
            <p className="eyebrow">Consultant Operations</p>
            <h2>Consultant Management Command Center</h2>
            <span>Track consultant records, skill coverage, availability, and recent hiring activity.</span>
          </div>
          <DatabaseZap size={38} aria-hidden="true" />
        </section>

        <DashboardSummary stats={stats} loading={loading} onRefresh={refreshData} />
        <Toast notice={notice} />

        <section className="operations-grid" aria-label="Consultant operations">
          <ConsultantForm
            values={formValues}
            errors={formErrors}
            editingId={editingId}
            onSubmit={handleSubmit}
            onFieldChange={updateField}
            onCancelEdit={cancelEdit}
          />
          <ImportPanel importing={importing} importResult={importResult} onImport={handleImport} />
        </section>

        <ConsultantTable
          apiOnline={apiOnline}
          consultants={consultants}
          currentPage={currentPage}
          totalPages={pageMeta.totalPages}
          totalElements={pageMeta.totalElements}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          technologyFilter={technologyFilter}
          technologyOptions={technologyOptions}
          experienceFilter={experienceFilter}
          experienceOptions={experienceRangeOptions}
          sortConfig={sortConfig}
          loading={loading}
          onSearch={updateSearch}
          onStatusFilter={updateStatusFilter}
          onTechnologyFilter={updateTechnologyFilter}
          onExperienceFilter={updateExperienceFilter}
          onPageSizeChange={updatePageSize}
          onSort={changeSort}
          onEdit={editConsultant}
          onDelete={setDeleteTarget}
          onPageChange={setCurrentPage}
          onExport={() => exportConsultantsCsv(consultants)}
        />
      </main>
      <DeleteDialog target={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );
}
