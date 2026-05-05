const STORAGE_KEY = "ecopulse.savedExperiments.v1";

export function loadSavedExperiments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

export function saveExperiment(experiment) {
  const existing = loadSavedExperiments();

  const next = [
    {
      ...experiment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    },
    ...existing,
  ].slice(0, 12);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  return next;
}

export function deleteExperiment(id) {
  const existing = loadSavedExperiments();
  const next = existing.filter((experiment) => experiment.id !== id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  return next;
}
