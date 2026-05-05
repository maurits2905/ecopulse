export function pushWorldEvent(world, type, message, options = {}) {
  const event = {
    tick: world.tick,
    type,
    category: options.category ?? "system",
    message,
  };

  world.events.unshift(event);
  world.events = world.events.slice(0, 12);

  world.timelineEvents = world.timelineEvents ?? [];

  const shouldRecordTimeline = options.timeline !== false;

  if (shouldRecordTimeline) {
    world.timelineEvents.push({
      ...event,
      id: `${world.tick}-${world.timelineEvents.length}-${event.category}`,
    });

    if (world.timelineEvents.length > 260) {
      world.timelineEvents.shift();
    }
  }
}
