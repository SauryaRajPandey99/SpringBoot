import { AlertTriangle, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useState } from "react";

export function ImportPanel({ importing, importResult, onImport }) {
  const [selectedFile, setSelectedFile] = useState(null);

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
          <h2 id="import-title">Excel Upload</h2>
        </div>
        <FileSpreadsheet size={22} aria-hidden="true" />
      </div>

      <form className="import-dropzone" onSubmit={handleSubmit}>
        <UploadCloud size={32} aria-hidden="true" />
        <label htmlFor="excel-file">Upload Excel file</label>
        <input
          id="excel-file"
          type="file"
          accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
            {importResult.rows.slice(0, 5).map((row) => (
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
