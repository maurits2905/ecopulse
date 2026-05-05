export default function EventLog({ events }) {
  return (
    <section className="panel event-panel">
      <div className="panel-heading">
        <p className="eyebrow">System log</p>
        <h2>What the ecosystem noticed</h2>
      </div>

      <div className="event-list">
        {events.map((event, index) => (
          <article className={`event-item ${event.type}`} key={`${event.tick}-${index}`}>
            <span>Tick {event.tick}</span>
            <p>{event.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}