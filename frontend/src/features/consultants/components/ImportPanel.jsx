import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useState } from "react";

export function ImportPanel({ importing, importResult, templateDownloading, onDownloadTemplate, onImport }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const visibleRows = showAllRows ? importResult?.rows || [] : importResult?.rows?.slice(0, 6) || [];

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      return;
    }
    await onImport(selectedFile);
    setSelectedFile(null);
    event.target.reset();
  }

  return (
    <section className="import-panel" id="import" aria-labelledby="import-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Bulk Import</p>
          <h2 id="import-title">File Upload</h2>
        </div>
        <div className="panel-actions">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm icon-button"
            onClick={onDownloadTemplate}
            disabled={templateDownloading}
          >
            <Download size={16} aria-hidden="true" />
            {templateDownloading ? "Preparing" : "Excel Template"}
          </button>
          <FileSpreadsheet size={22} aria-hidden="true" />
        </div>
      </div>

      <form className="import-dropzone" onSubmit={handleSubmit}>
        <UploadCloud size={32} aria-hidden="true" />
        <label htmlFor="import-file">Upload Excel or PDF file</label>
        <input
          id="import-file"
          type="file"
          accept=".xlsx,.xls,.pdf,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        />
        <span>{selectedFile ? selectedFile.name : "No file selected"}</span>
        <button type="submit" className="btn btn-primary submit-button" disabled={!selectedFile || importing}>
          <UploadCloud size={17} aria-hidden="true" />
          {importing ? "Importing" : "Import Records"}
        </button>
      </form>

      {importResult && (
        <div className="import-result" role="status">
          <div className="import-counts">
            <ResultPill tone="info" label="Rows" value={importResult.totalRows} />
            <ResultPill tone="success" label="Added" value={importResult.added} />
            <ResultPill tone="warning" label="Duplicates" value={importResult.skippedDuplicates} />
            <ResultPill tone="danger" label="Failed" value={importResult.failedValidation} />
          </div>

          <div className="import-row-list">
            {visibleRows.map((row) => (
              <div className={`import-row ${row.status.toLowerCase()}`} key={`${row.rowNumber}-${row.email}`}>
                {row.status === "ADDED" ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={16} aria-hidden="true" />
                )}
                <span>Row {row.rowNumber}</span>
                <strong>{row.status}</strong>
                <small>{row.message}</small>
              </div>
            ))}
          </div>

          {importResult.rows.length > 6 && (
            <button type="button" className="show-rows-button" onClick={() => setShowAllRows((current) => !current)}>
              {showAllRows ? "Show fewer rows" : `Show all ${importResult.rows.length} rows`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function ResultPill({ tone, label, value }) {
  return (
    <div className={`result-pill ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
