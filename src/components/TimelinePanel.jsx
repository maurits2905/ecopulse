function labelForCategory(category) {
  if (category === "disturbance") return "Disturbance";
  if (category === "migration") return "Migration";
  if (category === "extinction") return "Extinction";
  if (category === "season") return "Season";
  if (category === "evolution") return "Evolution";
  return "System";
}

export default function TimelinePanel({ timelineEvents = [] }) {
  const recent = [...timelineEvents].slice(-10).reverse();

  return (
    <section className="panel timeline-panel">
      <div className="panel-heading">
        <p className="eyebrow">Timeline</p>
        <h2>Major events</h2>
      </div>

      {recent.length === 0 ? (
        <p className="inspector-empty small">No timeline events have been recorded yet.</p>
      ) : (
        <div className="timeline-list">
          {recent.map((event) => (
            <article className={`timeline-item ${event.category}`} key={event.id}>
              <div className="timeline-dot" />
              <div>
                <div className="timeline-meta">
                  <span>{labelForCategory(event.category)}</span>
                  <strong>Tick {event.tick}</strong>
                </div>
                <p>{event.message}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}