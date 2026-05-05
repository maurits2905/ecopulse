import { clamp } from "../utils/clamp";
import { createRandom } from "../utils/random";
import { TRAIT_LIMITS } from "./presets";
import { collectStats } from "./stats";
import { generateTerrainMap, getTerrainInfo, TERRAIN_TYPES } from "./terrain";

let nextAgentId = 1;

function createCell(random, settings, terrain) {
  const terrainInfo = getTerrainInfo(terrain);

  if (terrain === TERRAIN_TYPES.WATER) {
    return {
      terrain,
      grass: 0,
      fertility: 0,
    };
  }

  const hasGrass = random.chance(settings.initialGrassDensity);
  const baseFertility = random.range(0.65, 1.35);
  const fertility = clamp(
    baseFertility * terrainInfo.fertilityModifier,
    0.2,
    2.1,
  );

  return {
    terrain,
    grass: hasGrass ? random.range(25, settings.grassMax) : random.range(0, 16),
    fertility,
  };
}

function varyTrait(random, value, variance, min, max) {
  const varied = value + random.range(-variance, variance) * value;
  return clamp(varied, min, max);
}

function createPreyTraits(random, settings) {
  return {
    speed: varyTrait(
      random,
      settings.preySpeed,
      settings.traitVariance,
      TRAIT_LIMITS.prey.speed[0],
      TRAIT_LIMITS.prey.speed[1],
    ),
    vision: varyTrait(
      random,
      settings.preyVision,
      settings.traitVariance,
      TRAIT_LIMITS.prey.vision[0],
      TRAIT_LIMITS.prey.vision[1],
    ),
    caution: varyTrait(
      random,
      settings.preyCaution,
      settings.traitVariance,
      TRAIT_LIMITS.prey.caution[0],
      TRAIT_LIMITS.prey.caution[1],
    ),
    metabolism: varyTrait(
      random,
      settings.preyMetabolism,
      settings.traitVariance,
      TRAIT_LIMITS.prey.metabolism[0],
      TRAIT_LIMITS.prey.metabolism[1],
    ),
    reproductionEnergy: varyTrait(
      random,
      settings.preyReproductionEnergy,
      settings.traitVariance,
      TRAIT_LIMITS.prey.reproductionEnergy[0],
      TRAIT_LIMITS.prey.reproductionEnergy[1],
    ),
  };
}

function createPredatorTraits(random, settings) {
  return {
    speed: varyTrait(
      random,
      settings.predatorSpeed,
      settings.traitVariance,
      TRAIT_LIMITS.predator.speed[0],
      TRAIT_LIMITS.predator.speed[1],
    ),
    vision: varyTrait(
      random,
      settings.predatorVision,
      settings.traitVariance,
      TRAIT_LIMITS.predator.vision[0],
      TRAIT_LIMITS.predator.vision[1],
    ),
    aggression: varyTrait(
      random,
      settings.predatorAggression,
      settings.traitVariance,
      TRAIT_LIMITS.predator.aggression[0],
      TRAIT_LIMITS.predator.aggression[1],
    ),
    metabolism: varyTrait(
      random,
      settings.predatorMetabolism,
      settings.traitVariance,
      TRAIT_LIMITS.predator.metabolism[0],
      TRAIT_LIMITS.predator.metabolism[1],
    ),
    reproductionEnergy: varyTrait(
      random,
      settings.predatorReproductionEnergy,
      settings.traitVariance,
      TRAIT_LIMITS.predator.reproductionEnergy[0],
      TRAIT_LIMITS.predator.reproductionEnergy[1],
    ),
  };
}

function mutateTrait(random, value, mutationRate, min, max) {
  const mutation = random.range(-mutationRate, mutationRate) * value;
  return clamp(value + mutation, min, max);
}

function mutatePreyTraits(parent, world) {
  const random = world.random;
  const rate = world.settings.mutationRate;

  return {
    speed: mutateTrait(
      random,
      parent.traits.speed,
      rate,
      ...TRAIT_LIMITS.prey.speed,
    ),
    vision: mutateTrait(
      random,
      parent.traits.vision,
      rate,
      ...TRAIT_LIMITS.prey.vision,
    ),
    caution: mutateTrait(
      random,
      parent.traits.caution,
      rate,
      ...TRAIT_LIMITS.prey.caution,
    ),
    metabolism: mutateTrait(
      random,
      parent.traits.metabolism,
      rate,
      ...TRAIT_LIMITS.prey.metabolism,
    ),
    reproductionEnergy: mutateTrait(
      random,
      parent.traits.reproductionEnergy,
      rate,
      ...TRAIT_LIMITS.prey.reproductionEnergy,
    ),
  };
}

function mutatePredatorTraits(parent, world) {
  const random = world.random;
  const rate = world.settings.mutationRate;

  return {
    speed: mutateTrait(
      random,
      parent.traits.speed,
      rate,
      ...TRAIT_LIMITS.predator.speed,
    ),
    vision: mutateTrait(
      random,
      parent.traits.vision,
      rate,
      ...TRAIT_LIMITS.predator.vision,
    ),
    aggression: mutateTrait(
      random,
      parent.traits.aggression,
      rate,
      ...TRAIT_LIMITS.predator.aggression,
    ),
    metabolism: mutateTrait(
      random,
      parent.traits.metabolism,
      rate,
      ...TRAIT_LIMITS.predator.metabolism,
    ),
    reproductionEnergy: mutateTrait(
      random,
      parent.traits.reproductionEnergy,
      rate,
      ...TRAIT_LIMITS.predator.reproductionEnergy,
    ),
  };
}

function getRandomLandPosition(random, cells, settings) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const x = random.range(0, settings.worldWidth);
    const y = random.range(0, settings.worldHeight);
    const cell = cells[Math.floor(y) * settings.worldWidth + Math.floor(x)];

    if (cell?.terrain !== TERRAIN_TYPES.WATER) {
      return { x, y };
    }
  }

  return {
    x: settings.worldWidth / 2,
    y: settings.worldHeight / 2,
  };
}

function createPrey(random, settings, cells) {
  const position = getRandomLandPosition(random, cells, settings);

  return {
    id: nextAgentId++,
    type: "prey",
    x: position.x,
    y: position.y,
    energy: random.range(
      settings.preyStartEnergy * 0.65,
      settings.preyStartEnergy * 1.25,
    ),
    age: 0,
    generation: 1,
    cooldown: random.int(0, 40),
    dead: false,
    traits: createPreyTraits(random, settings),
  };
}

function createPredator(random, settings, cells) {
  const position = getRandomLandPosition(random, cells, settings);

  return {
    id: nextAgentId++,
    type: "predator",
    x: position.x,
    y: position.y,
    energy: random.range(
      settings.predatorStartEnergy * 0.75,
      settings.predatorStartEnergy * 1.3,
    ),
    age: 0,
    generation: 1,
    cooldown: random.int(0, 80),
    dead: false,
    traits: createPredatorTraits(random, settings),
  };
}

export function createWorld(settings) {
  nextAgentId = 1;

  const random = createRandom(
    settings.seed + Math.floor(Math.random() * 999999),
  );
  const terrainMap = generateTerrainMap(settings, random);
  const cells = [];

  for (let y = 0; y < settings.worldHeight; y++) {
    for (let x = 0; x < settings.worldWidth; x++) {
      const index = y * settings.worldWidth + x;
      cells.push(createCell(random, settings, terrainMap[index]));
    }
  }

  const prey = Array.from({ length: settings.initialPrey }, () =>
    createPrey(random, settings, cells),
  );

  const predators = Array.from({ length: settings.initialPredators }, () =>
    createPredator(random, settings, cells),
  );

  const world = {
    width: settings.worldWidth,
    height: settings.worldHeight,
    cells,
    prey,
    predators,
    tick: 0,
    random,
    settings,
    history: [],
    events: [
      {
        tick: 0,
        type: "info",
        message:
          "EcoPulse started. Biome-based terrain now creates larger regions, rivers, water and survival zones.",
      },
    ],
    lastEventFlags: {},
  };

  world.stats = collectStats(world);
  world.history.push(world.stats);

  return world;
}

export function createPreyChild(parent, world) {
  const random = world.random;
  const settings = world.settings;

  return {
    id: nextAgentId++,
    type: "prey",
    x: parent.x + random.range(-1.2, 1.2),
    y: parent.y + random.range(-1.2, 1.2),
    energy: settings.preyReproductionCost * 0.7,
    age: 0,
    generation: parent.generation + 1,
    cooldown: 70,
    dead: false,
    traits: mutatePreyTraits(parent, world),
  };
}

export function createPredatorChild(parent, world) {
  const random = world.random;
  const settings = world.settings;

  return {
    id: nextAgentId++,
    type: "predator",
    x: parent.x + random.range(-1.2, 1.2),
    y: parent.y + random.range(-1.2, 1.2),
    energy: settings.predatorReproductionCost * 0.75,
    age: 0,
    generation: parent.generation + 1,
    cooldown: 110,
    dead: false,
    traits: mutatePredatorTraits(parent, world),
  };
}
