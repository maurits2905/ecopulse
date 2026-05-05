export const SEASONS = [
  {
    key: "spring",
    name: "Spring",
    description:
      "Grass regrows quickly and animals recover energy more easily.",
    grassModifier: 1.35,
    hungerModifier: 0.94,
    tone: {
      red: 80,
      green: 255,
      blue: 160,
    },
  },
  {
    key: "summer",
    name: "Summer",
    description: "Stable growth and normal survival pressure.",
    grassModifier: 1,
    hungerModifier: 1,
    tone: {
      red: 255,
      green: 215,
      blue: 95,
    },
  },
  {
    key: "autumn",
    name: "Autumn",
    description: "Grass growth slows and the ecosystem starts tightening.",
    grassModifier: 0.72,
    hungerModifier: 1.04,
    tone: {
      red: 255,
      green: 125,
      blue: 55,
    },
  },
  {
    key: "winter",
    name: "Winter",
    description: "Grass barely grows and animals burn more energy.",
    grassModifier: 0.28,
    hungerModifier: 1.16,
    tone: {
      red: 145,
      green: 195,
      blue: 255,
    },
  },
];

export function getCurrentSeason(world) {
  const settings = world.settings;

  if (!settings.seasonsEnabled) {
    return {
      ...SEASONS[1],
      index: 1,
      progress: 0,
      tickInSeason: 0,
    };
  }

  const seasonLength = settings.seasonLength;
  const cycleLength = seasonLength * SEASONS.length;
  const tickInCycle = world.tick % cycleLength;
  const index = Math.floor(tickInCycle / seasonLength);
  const tickInSeason = tickInCycle % seasonLength;
  const progress = tickInSeason / seasonLength;

  return {
    ...SEASONS[index],
    index,
    progress,
    tickInSeason,
  };
}

export function getSeasonVisualBlend(world) {
  const current = getCurrentSeason(world);

  if (!world.settings.seasonsEnabled) {
    return {
      current,
      next: current,
      blend: 0,
    };
  }

  const fadeStart = 0.72;
  const fadeRange = 1 - fadeStart;
  const rawBlend = (current.progress - fadeStart) / fadeRange;
  const blend = smoothStep(Math.max(0, Math.min(1, rawBlend)));

  const nextIndex = (current.index + 1) % SEASONS.length;
  const next = SEASONS[nextIndex];

  return {
    current,
    next,
    blend,
  };
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}
