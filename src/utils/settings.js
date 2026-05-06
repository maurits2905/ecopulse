import { DEFAULT_SETTINGS, PRESETS } from "../simulation/presets";

export function getSafePresetKey(presetKey) {
  return PRESETS[presetKey] ? presetKey : "balanced";
}

export function getSafeSettings(settings = {}) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
  };

  return normalizeNumbers(merged);
}

export function getSafeExperiment(experiment) {
  if (!experiment || typeof experiment !== "object") return null;

  const presetKey = getSafePresetKey(experiment.presetKey ?? "balanced");

  return {
    ...experiment,
    presetKey,
    settings: getSafeSettings(experiment.settings),
  };
}

function normalizeNumbers(settings) {
  const next = { ...settings };

  for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
    if (typeof defaultValue === "number") {
      const value = Number(next[key]);

      next[key] = Number.isFinite(value) ? value : defaultValue;
    }

    if (typeof defaultValue === "boolean") {
      next[key] = Boolean(next[key]);
    }

    if (typeof defaultValue === "string") {
      next[key] = typeof next[key] === "string" ? next[key] : defaultValue;
    }
  }

  return next;
}
