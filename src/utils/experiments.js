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

export function createExperimentPayload({ name, presetKey, settings }) {
  return {
    app: "EcoPulse",
    version: 1,
    name,
    presetKey,
    settings,
    exportedAt: new Date().toISOString(),
  };
}

export function encodeExperimentForUrl(payload) {
  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));

  return encoded;
}

export function decodeExperimentFromUrl(value) {
  try {
    const json = decodeURIComponent(escape(atob(value)));
    const parsed = JSON.parse(json);

    return validateExperimentPayload(parsed);
  } catch {
    return null;
  }
}

export function validateExperimentPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.app !== "EcoPulse") return null;
  if (!payload.settings || typeof payload.settings !== "object") return null;

  return {
    app: "EcoPulse",
    version: payload.version ?? 1,
    name: payload.name || "Imported EcoPulse setup",
    presetKey: payload.presetKey || "balanced",
    settings: payload.settings,
    exportedAt: payload.exportedAt || null,
  };
}

export function downloadExperimentJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  const safeName = (payload.name || "ecopulse-experiment")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  anchor.href = url;
  anchor.download = `${safeName || "ecopulse-experiment"}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}
