export const SEASONS = [
  {
    key: "spring",
    name: "Spring",
    description:
      "Grass regrows quickly and animals recover energy more easily.",
    grassModifier: 1.35,
    hungerModifier: 0.94,
  },
  {
    key: "summer",
    name: "Summer",
    description: "Stable growth and normal survival pressure.",
    grassModifier: 1,
    hungerModifier: 1,
  },
  {
    key: "autumn",
    name: "Autumn",
    description: "Grass growth slows and the ecosystem starts tightening.",
    grassModifier: 0.72,
    hungerModifier: 1.04,
  },
  {
    key: "winter",
    name: "Winter",
    description: "Grass barely grows and animals burn more energy.",
    grassModifier: 0.28,
    hungerModifier: 1.16,
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
