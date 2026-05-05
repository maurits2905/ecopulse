export const DEFAULT_SETTINGS = {
  worldWidth: 96,
  worldHeight: 64,

  renderDetail: "balanced",
  showGrid: false,

  initialGrassDensity: 0.7,
  grassRegrowth: 0.42,
  grassMax: 100,
  grassBite: 28,
  grassEnergy: 1.15,

  terrainEnabled: true,
  waterAmount: 0.035,
  forestAmount: 0.11,
  barrenAmount: 0.08,
  fertileAmount: 0.09,
  riverAmount: 0.55,
  biomeScale: 24,

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

export const MAP_SIZES = {
  compact: {
    label: "Compact",
    description: "Smaller world, faster simulation.",
    width: 72,
    height: 48,
    maxPrey: 520,
    maxPredators: 160,
    initialPrey: 75,
    initialPredators: 16,
  },
  standard: {
    label: "Standard",
    description: "Balanced world size for most experiments.",
    width: 96,
    height: 64,
    maxPrey: 900,
    maxPredators: 260,
    initialPrey: 110,
    initialPredators: 24,
  },
  large: {
    label: "Large",
    description: "More space and richer regional dynamics.",
    width: 128,
    height: 80,
    maxPrey: 1400,
    maxPredators: 380,
    initialPrey: 165,
    initialPredators: 36,
  },
  huge: {
    label: "Huge",
    description: "Big ecosystem. Best with balanced or performance rendering.",
    width: 160,
    height: 96,
    maxPrey: 2200,
    maxPredators: 560,
    initialPrey: 230,
    initialPredators: 52,
  },
};

export const RENDER_DETAILS = {
  performance: {
    label: "Performance",
    description: "Faster drawing with fewer terrain details.",
  },
  balanced: {
    label: "Balanced",
    description: "Good visuals and good performance.",
  },
  detailed: {
    label: "Detailed",
    description: "More terrain details. Best for compact or standard maps.",
  },
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
      "A balanced setup with clustered biomes, rivers and population waves.",
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
      forestAmount: 0.07,
      barrenAmount: 0.11,
      biomeScale: 22,
    },
  },

  predatorPressure: {
    label: "Predator Pressure",
    description: "More predators. Forest pockets may help prey survive.",
    settings: {
      initialPrey: 125,
      initialPredators: 42,
      predatorHunger: 0.72,
      predatorReproductionChance: 0.024,
      forestAmount: 0.16,
      biomeScale: 26,
    },
  },

  harshWorld: {
    label: "Harsh World",
    description: "Dry regions and winter pressure make survival difficult.",
    settings: {
      initialGrassDensity: 0.52,
      grassRegrowth: 0.18,
      preyHunger: 0.52,
      predatorHunger: 0.82,
      mutationRate: 0.11,
      barrenAmount: 0.2,
      fertileAmount: 0.04,
      waterAmount: 0.025,
      riverAmount: 0.35,
      biomeScale: 30,
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
      forestAmount: 0.12,
      fertileAmount: 0.1,
      biomeScale: 20,
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
      forestAmount: 0.13,
      barrenAmount: 0.12,
      biomeScale: 28,
    },
  },

  forestRefuge: {
    label: "Forest Refuge",
    description:
      "Large forest regions give prey shelter and create safer zones.",
    settings: {
      forestAmount: 0.24,
      waterAmount: 0.025,
      riverAmount: 0.45,
      barrenAmount: 0.04,
      fertileAmount: 0.12,
      initialPrey: 120,
      initialPredators: 30,
      biomeScale: 30,
    },
  },

  brokenLands: {
    label: "Broken Lands",
    description:
      "Rivers, water and barren regions fragment the map into survival pockets.",
    settings: {
      waterAmount: 0.075,
      riverAmount: 0.9,
      barrenAmount: 0.18,
      fertileAmount: 0.06,
      forestAmount: 0.08,
      grassRegrowth: 0.3,
      initialPrey: 100,
      initialPredators: 20,
      biomeScale: 26,
    },
  },

  wetlands: {
    label: "Wetlands",
    description:
      "More water, fertile edges and forest clusters create rich but fragmented habitats.",
    settings: {
      waterAmount: 0.065,
      riverAmount: 0.85,
      forestAmount: 0.16,
      fertileAmount: 0.16,
      barrenAmount: 0.03,
      grassRegrowth: 0.48,
      initialPrey: 135,
      initialPredators: 24,
      biomeScale: 25,
    },
  },

  plainWorld: {
    label: "Plain World",
    description:
      "A simple open grassland with no water, rivers, forests or blocked terrain.",
    settings: {
      terrainEnabled: false,
      waterAmount: 0,
      riverAmount: 0,
      forestAmount: 0,
      barrenAmount: 0,
      fertileAmount: 0,
      biomeScale: 24,
      initialGrassDensity: 0.72,
      grassRegrowth: 0.42,
      initialPrey: 120,
      initialPredators: 24,
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
      riverAmount: 0.4,
      biomeScale: 22,
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
