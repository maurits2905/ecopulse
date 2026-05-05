import { useRef, useState } from "react";

export default function ExperimentPanel({
  savedExperiments,
  exportText,
  importText,
  setImportText,
  copyStatus,
  importStatus,
  onSaveExperiment,
  onLoadExperiment,
  onDeleteExperiment,
  onCopyJson,
  onCopyShareUrl,
  onDownloadJson,
  onImportExperiment
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef(null);

  function selectExportText() {
    textareaRef.current?.select();
  }

  return (
    <section className="panel experiment-panel">
      <div className="panel-heading">
        <p className="eyebrow">Experiments</p>
        <h2>Saved and shared setups</h2>
      </div>

      <button className="button save-button" onClick={onSaveExperiment}>
        Save current setup
      </button>

      <div className="experiment-action-grid">
        <button className="mini-action" onClick={onCopyJson}>
          Copy JSON
        </button>
        <button className="mini-action" onClick={onCopyShareUrl}>
          Copy share URL
        </button>
        <button className="mini-action" onClick={onDownloadJson}>
          Download JSON
        </button>
      </div>

      {copyStatus ? <p className="experiment-status">{copyStatus}</p> : null}

      <button
        type="button"
        className="advanced-toggle"
        onClick={() => setShowAdvanced((current) => !current)}
      >
        {showAdvanced ? "Hide export/import" : "Show export/import"}
      </button>

      {showAdvanced ? (
        <div className="experiment-advanced">
          <label className="experiment-textarea-label">
            <span>Current setup JSON</span>
            <textarea
              ref={textareaRef}
              value={exportText}
              readOnly
              onFocus={selectExportText}
              rows={7}
            />
          </label>

          <label className="experiment-textarea-label">
            <span>Import setup JSON</span>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Paste an EcoPulse setup JSON here..."
              rows={7}
            />
          </label>

          <button className="button save-button" onClick={onImportExperiment}>
            Import and load setup
          </button>

          {importStatus ? <p className="experiment-status">{importStatus}</p> : null}
        </div>
      ) : null}

      <div className="experiment-list">
        {savedExperiments.length === 0 ? (
          <p className="inspector-empty small">
            No saved experiments yet. Tune the settings, then save the setup.
          </p>
        ) : (
          savedExperiments.map((experiment) => (
            <article className="experiment-item" key={experiment.id}>
              <div>
                <strong>{experiment.name}</strong>
                <span>
                  {experiment.settings.worldWidth}x{experiment.settings.worldHeight} ·{" "}
                  {experiment.settings.renderDetail}
                </span>
              </div>

              <div className="experiment-actions">
                <button onClick={() => onLoadExperiment(experiment)}>Load</button>
                <button className="delete" onClick={() => onDeleteExperiment(experiment.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}