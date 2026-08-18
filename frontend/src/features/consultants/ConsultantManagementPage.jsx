import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";

import { consultantsApi } from "../../api/consultants";
import { AppHeader } from "../../components/AppHeader";
import { Toast } from "../../components/Toast";
import {
  defaultDashboardStats,
  emptyConsultantForm,
  experienceRangeOptions,
  exportConsultantsCsv,
  exportConsultantsPdf,
  normalizePagePayload,
  pageSizeOptions,
} from "../../utils/consultantUtils";
import { sanitizeConsultantPayload, validateConsultantForm } from "../../utils/validation";
import { ConsultantForm } from "./components/ConsultantForm";
import { ConsultantTable } from "./components/ConsultantTable";
import { DashboardSummary } from "./components/DashboardSummary";
import { DeleteDialog } from "./components/DeleteDialog";
import { ImportPanel } from "./components/ImportPanel";
import { OnboardedPanel } from "./components/OnboardedPanel";
import { ShortlistPanel } from "./components/ShortlistPanel";

const SHORTLIST_STORAGE_KEY = "consultant-shortlist";
const EXPORT_PAGE_SIZE = 50;

export function ConsultantManagementPage({ session, onLogout }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [stats, setStats] = useState(defaultDashboardStats);
  const [pageMeta, setPageMeta] = useState({ totalPages: 1, totalElements: 0 });
  const [onboardedConsultants, setOnboardedConsultants] = useState([]);
  const [onboardedMeta, setOnboardedMeta] = useState({ totalPages: 1, totalElements: 0 });
  const [onboardedSourceFilter, setOnboardedSourceFilter] = useState("all");
  const [onboardedSearchTerm, setOnboardedSearchTerm] = useState("");
  const [onboardedPage, setOnboardedPage] = useState(1);
  const [onboardedLoading, setOnboardedLoading] = useState(false);
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
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [exporting, setExporting] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shortlist, setShortlist] = useState(readStoredShortlist);

  const technologyOptions = useMemo(
    () => stats.technologyDistribution.map((item) => item.label),
    [stats.technologyDistribution]
  );

  const shortlistIds = useMemo(() => new Set(shortlist.map((consultant) => consultant.id)), [shortlist]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      statusFilter !== "all" ||
      technologyFilter !== "all" ||
      experienceFilter !== "all"
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

        if (handleUnauthorized(error)) {
          return;
        }

        setNotice({
          type: "warning",
          message: "Backend is not running.",
        });
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(shortlist));
    }
  }, [shortlist]);

  useEffect(() => {
    let ignore = false;

    async function loadOnboarded() {
      if (activeView !== "onboarded") {
        return;
      }

      setOnboardedLoading(true);
      try {
        const payload = await consultantsApi.onboarded({
          source: onboardedSourceFilter,
          search: onboardedSearchTerm,
          page: onboardedPage - 1,
          size: pageSize,
          sortBy: "importedAt",
          direction: "desc",
        });

        if (ignore) {
          return;
        }

        const page = normalizePagePayload(payload);
        setOnboardedConsultants(page.content);
        setOnboardedMeta({ totalPages: page.totalPages, totalElements: page.totalElements });
      } catch (error) {
        if (ignore) {
          return;
        }

        setOnboardedConsultants([]);
        setOnboardedMeta({ totalPages: 1, totalElements: 0 });
        if (handleUnauthorized(error)) {
          return;
        }
        setNotice({ type: "danger", message: error.message });
      } finally {
        if (!ignore) {
          setOnboardedLoading(false);
        }
      }
    }

    loadOnboarded();

    return () => {
      ignore = true;
    };
  }, [activeView, onboardedPage, onboardedSearchTerm, onboardedSourceFilter, pageSize, refreshKey]);

  function refreshData() {
    setRefreshKey((key) => key + 1);
  }

  function handleUnauthorized(error) {
    if (error.status !== 401) {
      return false;
    }

    setNotice({ type: "warning", message: "Your login expired. Please sign in again." });
    onLogout();
    return true;
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
      if (editingId) {
        setShortlist((current) => current.map((consultant) => (consultant.id === saved.id ? saved : consultant)));
        setOnboardedConsultants((current) => current.map((consultant) => (consultant.id === saved.id ? saved : consultant)));
      }
      setCurrentPage(1);
      refreshData();
      setActiveView("dashboard");
      setNotice({
        type: "success",
        message: editingId
          ? `${saved.name} was updated successfully.`
          : `${saved.name} was added successfully.`,
      });
    } catch (error) {
      if (handleUnauthorized(error)) {
        return;
      }
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
      const result = await consultantsApi.importFile(file);
      const uploadedConsultants = result.uploadedConsultants || [];
      setImportResult(result);
      setOnboardedConsultants(uploadedConsultants);
      setOnboardedMeta({
        totalPages: Math.max(Math.ceil(uploadedConsultants.length / pageSize), 1),
        totalElements: uploadedConsultants.length,
      });
      setCurrentPage(1);
      setOnboardedPage(1);
      refreshData();
      setActiveView("onboarded");
      setNotice({
        type: result.failedValidation > 0 ? "warning" : "success",
        message: `Import complete: ${result.added} added, ${result.skippedDuplicates} duplicates skipped, ${result.failedValidation} failed.`,
      });
    } catch (error) {
      if (handleUnauthorized(error)) {
        return;
      }
      setNotice({ type: "danger", message: error.message });
    } finally {
      setImporting(false);
    }
  }

  async function handleDownloadTemplate() {
    if (!apiOnline) {
      setNotice({
        type: "danger",
        message: "Start the Spring Boot backend before downloading the template.",
      });
      return;
    }

    setTemplateDownloading(true);
    try {
      const blob = await consultantsApi.downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "consultant-import-template.xlsx";
      link.click();
      URL.revokeObjectURL(url);
      setNotice({ type: "success", message: "Excel template downloaded." });
    } catch (error) {
      if (handleUnauthorized(error)) {
        return;
      }
      setNotice({ type: "danger", message: error.message });
    } finally {
      setTemplateDownloading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await consultantsApi.remove(deleteTarget.id);
      setShortlist((current) => current.filter((consultant) => consultant.id !== deleteTarget.id));
      setOnboardedConsultants((current) => current.filter((consultant) => consultant.id !== deleteTarget.id));
      setDeleteTarget(null);
      refreshData();
      setNotice({ type: "success", message: "Consultant deleted successfully." });
    } catch (error) {
      if (handleUnauthorized(error)) {
        return;
      }
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
    setActiveView("add");
  }

  function toggleShortlist(consultant) {
    setShortlist((current) => {
      const alreadySaved = current.some((item) => item.id === consultant.id);

      if (alreadySaved) {
        return current.filter((item) => item.id !== consultant.id);
      }

      return [consultant, ...current];
    });
  }

  function removeFromShortlist(id) {
    setShortlist((current) => current.filter((consultant) => consultant.id !== id));
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
    setOnboardedPage(1);
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setTechnologyFilter("all");
    setExperienceFilter("all");
    setSortConfig({ key: "id", direction: "desc" });
    setCurrentPage(1);
  }

  function applyTechnologyFilter(technology) {
    setSearchTerm("");
    setStatusFilter("all");
    setTechnologyFilter(technology);
    setExperienceFilter("all");
    setCurrentPage(1);
    setActiveView("consultants");
  }

  function applyExperienceFilter(label) {
    const option = experienceRangeOptions.find((item) => item.label === label);
    setSearchTerm("");
    setStatusFilter("all");
    setTechnologyFilter("all");
    setExperienceFilter(option?.value || "all");
    setCurrentPage(1);
    setActiveView("consultants");
  }

  function applyStatusFilter(status) {
    setSearchTerm("");
    setStatusFilter(status);
    setTechnologyFilter("all");
    setExperienceFilter("all");
    setCurrentPage(1);
    setActiveView("consultants");
  }

  function navigateToView(view) {
    if (view === "add") {
      setEditingId(null);
      setFormValues(emptyConsultantForm);
      setFormErrors({});
    }
    setActiveView(view);
  }

  function updateOnboardedSearch(value) {
    setOnboardedSearchTerm(value);
    setOnboardedPage(1);
  }

  function updateOnboardedSource(value) {
    setOnboardedSourceFilter(value);
    setOnboardedPage(1);
  }

  async function fetchAllDirectoryConsultants({ useCurrentFilters = true } = {}) {
    const baseFilters = useCurrentFilters
      ? {
          search: searchTerm,
          status: statusFilter === "all" ? "" : statusFilter,
          technology: technologyFilter === "all" ? "" : technologyFilter,
          experienceRange: experienceFilter === "all" ? "" : experienceFilter,
        }
      : {
          search: "",
          status: "",
          technology: "",
          experienceRange: "",
        };

    const firstPage = normalizePagePayload(
      await consultantsApi.list({
        ...baseFilters,
        page: 0,
        size: EXPORT_PAGE_SIZE,
        sortBy: sortConfig.key,
        direction: sortConfig.direction,
      })
    );
    const records = [...firstPage.content];

    for (let pageIndex = 1; pageIndex < firstPage.totalPages; pageIndex++) {
      const nextPage = normalizePagePayload(
        await consultantsApi.list({
          ...baseFilters,
          page: pageIndex,
          size: EXPORT_PAGE_SIZE,
          sortBy: sortConfig.key,
          direction: sortConfig.direction,
        })
      );
      records.push(...nextPage.content);
    }

    return records;
  }

  async function fetchAllOnboardedConsultants() {
    const firstPage = normalizePagePayload(
      await consultantsApi.onboarded({
        source: onboardedSourceFilter,
        search: onboardedSearchTerm,
        page: 0,
        size: EXPORT_PAGE_SIZE,
        sortBy: "importedAt",
        direction: "desc",
      })
    );
    const records = [...firstPage.content];

    for (let pageIndex = 1; pageIndex < firstPage.totalPages; pageIndex++) {
      const nextPage = normalizePagePayload(
        await consultantsApi.onboarded({
          source: onboardedSourceFilter,
          search: onboardedSearchTerm,
          page: pageIndex,
          size: EXPORT_PAGE_SIZE,
          sortBy: "importedAt",
          direction: "desc",
        })
      );
      records.push(...nextPage.content);
    }

    return records;
  }

  async function exportDirectory(format, useCurrentFilters = true) {
    if (!apiOnline) {
      setNotice({ type: "danger", message: "Start the Spring Boot backend before exporting consultants." });
      return;
    }

    setExporting(`directory-${format}`);
    try {
      const records = await fetchAllDirectoryConsultants({ useCurrentFilters });
      if (records.length === 0) {
        setNotice({ type: "warning", message: "No consultants available for export." });
        return;
      }

      if (format === "csv") {
        exportConsultantsCsv(records, "consultants.csv");
      } else {
        exportConsultantsPdf(records, "consultants.pdf", "Consultant Directory");
      }

      setNotice({ type: "success", message: `Exported ${records.length} consultant records.` });
    } catch (error) {
      if (handleUnauthorized(error)) {
        return;
      }
      setNotice({ type: "danger", message: error.message });
    } finally {
      setExporting("");
    }
  }

  async function exportOnboarded(format) {
    if (!apiOnline) {
      setNotice({ type: "danger", message: "Start the Spring Boot backend before exporting onboarded consultants." });
      return;
    }

    setExporting(`onboarded-${format}`);
    try {
      const records = await fetchAllOnboardedConsultants();
      if (records.length === 0) {
        setNotice({ type: "warning", message: "No onboarded consultants available for export." });
        return;
      }

      if (format === "csv") {
        exportConsultantsCsv(records, "onboarded-consultants.csv");
      } else {
        exportConsultantsPdf(records, "onboarded-consultants.pdf", "Onboarded Consultants");
      }

      setNotice({ type: "success", message: `Exported ${records.length} onboarded records.` });
    } catch (error) {
      if (handleUnauthorized(error)) {
        return;
      }
      setNotice({ type: "danger", message: error.message });
    } finally {
      setExporting("");
    }
  }

  const tableView = (
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
      shortlistIds={shortlistIds}
      onSearch={updateSearch}
      onStatusFilter={updateStatusFilter}
      onTechnologyFilter={updateTechnologyFilter}
      onExperienceFilter={updateExperienceFilter}
      onPageSizeChange={updatePageSize}
      onSort={changeSort}
      onEdit={editConsultant}
      onDelete={setDeleteTarget}
      onToggleShortlist={toggleShortlist}
      onPageChange={setCurrentPage}
      onExport={() => exportDirectory("csv")}
      onExportPdf={() => exportDirectory("pdf")}
      onRefresh={refreshData}
      onClearFilters={clearFilters}
      hasActiveFilters={hasActiveFilters}
      exporting={exporting}
    />
  );

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AppHeader
        activeView={activeView}
        userEmail={session.email}
        shortlistCount={shortlist.length}
        collapsed={sidebarCollapsed}
        onLogout={onLogout}
        onNavigate={navigateToView}
      />
      <main className="app-main">
        <WorkspaceTopBar
          activeView={activeView}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />

        <Toast notice={notice} />

        {activeView === "dashboard" && (
          <div className="page-view">
            <DashboardSummary
              stats={stats}
              loading={loading}
              shortlistCount={shortlist.length}
              canExport={stats.totalConsultants > 0}
              onRefresh={refreshData}
              onStatusSelect={applyStatusFilter}
              onTechnologySelect={applyTechnologyFilter}
              onExperienceSelect={applyExperienceFilter}
              onAddConsultant={() => navigateToView("add")}
              onImportConsultants={() => navigateToView("import")}
              onViewConsultants={() => navigateToView("consultants")}
              onViewShortlist={() => navigateToView("shortlist")}
              onExportConsultants={() => exportDirectory("pdf", false)}
            />
            {importResult && <ImportSnapshot result={importResult} />}
            {tableView}
          </div>
        )}

        {activeView === "consultants" && <div className="page-view">{tableView}</div>}

        {activeView === "onboarded" && (
          <div className="page-view">
            <OnboardedPanel
              consultants={onboardedConsultants}
              loading={onboardedLoading}
              sourceFilter={onboardedSourceFilter}
              searchTerm={onboardedSearchTerm}
              currentPage={onboardedPage}
              totalPages={onboardedMeta.totalPages}
              totalElements={onboardedMeta.totalElements}
              pageSize={pageSize}
              lastImportResult={importResult}
              onSourceFilter={updateOnboardedSource}
              onSearch={updateOnboardedSearch}
              onPageChange={setOnboardedPage}
              onRefresh={refreshData}
              onExport={() => exportOnboarded("csv")}
              onExportPdf={() => exportOnboarded("pdf")}
              exporting={exporting}
            />
          </div>
        )}

        {activeView === "shortlist" && (
          <div className="page-view">
            <ShortlistPanel
              shortlist={shortlist}
              onEdit={editConsultant}
              onRemove={removeFromShortlist}
              onExport={() => exportConsultantsCsv(shortlist, "shortlist-consultants.csv")}
              onExportPdf={() => exportConsultantsPdf(shortlist, "shortlist-consultants.pdf", "Shortlisted Consultants")}
            />
          </div>
        )}

        {activeView === "add" && (
          <section className="single-view-panel" aria-label="Add consultant">
            <ConsultantForm
              values={formValues}
              errors={formErrors}
              editingId={editingId}
              onSubmit={handleSubmit}
              onFieldChange={updateField}
              onCancelEdit={cancelEdit}
            />
          </section>
        )}

        {activeView === "import" && (
          <section className="single-view-panel" aria-label="Import consultants">
            <ImportPanel
              importing={importing}
              importResult={importResult}
              templateDownloading={templateDownloading}
              onDownloadTemplate={handleDownloadTemplate}
              onImport={handleImport}
            />
          </section>
        )}
      </main>
      <DeleteDialog target={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );
}

function WorkspaceTopBar({
  activeView,
  sidebarCollapsed,
  onToggleSidebar,
}) {
  const title = getViewTitle(activeView);

  return (
    <header className="workspace-ribbon">
      <div className="ribbon-title">
        <button
          type="button"
          className="ribbon-menu-button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={21} aria-hidden="true" />
        </button>
        <div>
          <p className="eyebrow">Consultant Management System</p>
          <strong>{title}</strong>
        </div>
      </div>
    </header>
  );
}

function getViewTitle(view) {
  const titles = {
    dashboard: "Dashboard",
    consultants: "Consultants",
    onboarded: "Onboarded",
    shortlist: "Shortlist",
    import: "Import Consultants",
    add: "Add Consultant",
  };

  return titles[view] || "Dashboard";
}

function readStoredShortlist() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = localStorage.getItem(SHORTLIST_STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function ImportSnapshot({ result }) {
  return (
    <section className="import-snapshot" aria-label="Last import summary">
      <div>
        <p className="eyebrow">Last Import</p>
        <h2>File import summary</h2>
      </div>
      <div className="snapshot-counts">
        <span>{result.totalRows} rows checked</span>
        <span>{result.added} added</span>
        <span>{result.skippedDuplicates} duplicates</span>
        <span>{result.failedValidation} failed</span>
      </div>
    </section>
  );
}
