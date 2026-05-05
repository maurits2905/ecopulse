export const DEFAULT_SETTINGS = {
  worldWidth: 96,
  worldHeight: 64,

  initialGrassDensity: 0.7,
  grassRegrowth: 0.42,
  grassMax: 100,
  grassBite: 28,
  grassEnergy: 1.15,

  initialPrey: 110,
  initialPredators: 24,

  preySpeed: 0.62,
  preyVision: 7,
  preyCaution: 0.9,
  preyMetabolism: 1,
  preyStartEnergy: 55,
  preyReproductionEnergy: 92,
  preyReproductionCost: 38,
  preyReproductionChance: 0.045,
  preyMaxAge: 1400,

  predatorSpeed: 0.78,
  predatorVision: 10,
  predatorAggression: 1,
  predatorMetabolism: 1,
  predatorStartEnergy: 82,
  predatorReproductionEnergy: 135,
  predatorReproductionCost: 55,
  predatorReproductionChance: 0.03,
  predatorKillRadius: 0.85,
  predatorEatEnergy: 68,
  predatorMaxAge: 1800,

  mutationRate: 0.08,
  traitVariance: 0.12,

  maxPrey: 900,
  maxPredators: 260,

  randomWander: 0.32,
  chartEveryTicks: 8,
  historyLimit: 260,
  seed: 2905,
};

export const TRAIT_LIMITS = {
  prey: {
    speed: [0.35, 1.25],
    vision: [3, 16],
    caution: [0.1, 1.8],
    metabolism: [0.65, 1.55],
    reproductionEnergy: [55, 150],
  },
  predator: {
    speed: [0.35, 1.45],
    vision: [4, 22],
    aggression: [0.2, 2],
    metabolism: [0.65, 1.8],
    reproductionEnergy: [85, 220],
  },
};

export const PRESETS = {
  balanced: {
    label: "Balanced Meadow",
    description:
      "A balanced setup that usually creates waves of growth and collapse.",
    settings: {},
  },

  rabbitBoom: {
    label: "Prey Boom",
    description: "Lots of prey and few predators. Watch for overgrazing.",
    settings: {
      initialPrey: 190,
      initialPredators: 8,
      grassRegrowth: 0.34,
      preyReproductionChance: 0.06,
    },
  },

  predatorPressure: {
    label: "Predator Pressure",
    description: "More predators. Prey must recover or collapse.",
    settings: {
      initialPrey: 125,
      initialPredators: 42,
      predatorHunger: 0.72,
      predatorReproductionChance: 0.024,
    },
  },

  harshWorld: {
    label: "Harsh World",
    description: "Grass grows slowly. Energy efficiency matters.",
    settings: {
      initialGrassDensity: 0.52,
      grassRegrowth: 0.18,
      preyHunger: 0.52,
      predatorHunger: 0.82,
      mutationRate: 0.11,
    },
  },

  fastEvolution: {
    label: "Fast Evolution",
    description: "Higher mutation rate makes trait changes visible faster.",
    settings: {
      mutationRate: 0.18,
      preyReproductionChance: 0.06,
      predatorReproductionChance: 0.04,
      initialPrey: 145,
      initialPredators: 28,
    },
  },

  recoveryLab: {
    label: "Recovery Lab",
    description: "Few predators, damaged grass, and a fragile recovery curve.",
    settings: {
      initialGrassDensity: 0.34,
      grassRegrowth: 0.5,
      initialPrey: 70,
      initialPredators: 4,
    },
  },
};

export function getPresetSettings(presetKey) {
  const preset = PRESETS[presetKey] ?? PRESETS.balanced;

  return {
    ...DEFAULT_SETTINGS,
    ...preset.settings,
  };
}
