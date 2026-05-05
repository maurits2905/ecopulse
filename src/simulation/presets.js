export const DEFAULT_SETTINGS = {
  worldWidth: 96,
  worldHeight: 64,

  initialGrassDensity: 0.7,
  grassRegrowth: 0.42,
  grassMax: 100,
  grassBite: 28,
  grassEnergy: 1.15,

  terrainEnabled: true,
  waterAmount: 0.035,
  forestAmount: 0.09,
  barrenAmount: 0.08,
  fertileAmount: 0.08,

  seasonsEnabled: true,
  seasonLength: 650,

  initialPrey: 110,
  initialPredators: 24,

  preySpeed: 0.62,
  preyVision: 7,
  preyCaution: 0.9,
  preyMetabolism: 1,
  preyHunger: 0.42,
  preyStartEnergy: 55,
  preyReproductionEnergy: 92,
  preyReproductionCost: 38,
  preyReproductionChance: 0.045,
  preyMaxAge: 1400,

  predatorSpeed: 0.78,
  predatorVision: 10,
  predatorAggression: 1,
  predatorMetabolism: 1,
  predatorHunger: 0.68,
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
      forestAmount: 0.06,
      barrenAmount: 0.1,
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
      forestAmount: 0.13,
    },
  },

  harshWorld: {
    label: "Harsh World",
    description: "Grass grows slowly. Winter can become dangerous.",
    settings: {
      initialGrassDensity: 0.52,
      grassRegrowth: 0.18,
      preyHunger: 0.52,
      predatorHunger: 0.82,
      mutationRate: 0.11,
      barrenAmount: 0.18,
      fertileAmount: 0.04,
      waterAmount: 0.025,
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
      forestAmount: 0.11,
      fertileAmount: 0.1,
    },
  },

  longWinter: {
    label: "Long Winter",
    description:
      "Longer seasons and harsh winter pressure test survival traits.",
    settings: {
      seasonLength: 950,
      grassRegrowth: 0.35,
      initialGrassDensity: 0.62,
      preyHunger: 0.48,
      predatorHunger: 0.78,
      mutationRate: 0.12,
      forestAmount: 0.12,
      barrenAmount: 0.12,
    },
  },

  forestRefuge: {
    label: "Forest Refuge",
    description:
      "More forest cover gives prey shelter and creates safer zones.",
    settings: {
      forestAmount: 0.22,
      waterAmount: 0.025,
      barrenAmount: 0.04,
      fertileAmount: 0.12,
      initialPrey: 120,
      initialPredators: 30,
    },
  },

  brokenLands: {
    label: "Broken Lands",
    description:
      "More water and barren ground create fragmented survival pockets.",
    settings: {
      waterAmount: 0.075,
      barrenAmount: 0.18,
      fertileAmount: 0.06,
      forestAmount: 0.08,
      grassRegrowth: 0.3,
      initialPrey: 100,
      initialPredators: 20,
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
      fertileAmount: 0.12,
      barrenAmount: 0.14,
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
