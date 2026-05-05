export default function ExperimentPanel({
  savedExperiments,
  onSaveExperiment,
  onLoadExperiment,
  onDeleteExperiment
}) {
  return (
    <section className="panel experiment-panel">
      <div className="panel-heading">
        <p className="eyebrow">Experiments</p>
        <h2>Saved setups</h2>
      </div>

      <button className="button save-button" onClick={onSaveExperiment}>
        Save current setup
      </button>

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