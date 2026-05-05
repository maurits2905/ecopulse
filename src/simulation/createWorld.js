import { createRandom } from "../utils/random";
import { collectStats } from "./stats";

let nextAgentId = 1;

function createCell(random, settings) {
  const hasGrass = random.chance(settings.initialGrassDensity);
  const fertility = random.range(0.65, 1.35);

  return {
    grass: hasGrass ? random.range(25, settings.grassMax) : random.range(0, 16),
    fertility,
  };
}

function createPrey(random, settings) {
  return {
    id: nextAgentId++,
    type: "prey",
    x: random.range(0, settings.worldWidth),
    y: random.range(0, settings.worldHeight),
    energy: random.range(
      settings.preyStartEnergy * 0.65,
      settings.preyStartEnergy * 1.25,
    ),
    age: 0,
    generation: 1,
    cooldown: random.int(0, 40),
    dead: false,
  };
}

function createPredator(random, settings) {
  return {
    id: nextAgentId++,
    type: "predator",
    x: random.range(0, settings.worldWidth),
    y: random.range(0, settings.worldHeight),
    energy: random.range(
      settings.predatorStartEnergy * 0.75,
      settings.predatorStartEnergy * 1.3,
    ),
    age: 0,
    generation: 1,
    cooldown: random.int(0, 80),
    dead: false,
  };
}

export function createWorld(settings) {
  nextAgentId = 1;

  const random = createRandom(
    settings.seed + Math.floor(Math.random() * 999999),
  );
  const cells = [];

  for (let y = 0; y < settings.worldHeight; y++) {
    for (let x = 0; x < settings.worldWidth; x++) {
      cells.push(createCell(random, settings));
    }
  }

  const prey = Array.from({ length: settings.initialPrey }, () =>
    createPrey(random, settings),
  );
  const predators = Array.from({ length: settings.initialPredators }, () =>
    createPredator(random, settings),
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
          "EcoPulse started. Grass, prey and predators are now competing for survival.",
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
  };
}
