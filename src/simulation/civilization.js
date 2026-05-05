import { clamp } from "../utils/clamp";
import { getCell } from "./grass";
import {
  findNearestAgent,
  keepInBoundsAndTerrain,
  normalize,
  randomDirection,
} from "./movement";
import { TERRAIN_TYPES } from "./terrain";
import { pushWorldEvent } from "./eventBus";

export function initializeCivilization(world) {
  const settings = world.settings;

  world.civilization = {
    enabled: Boolean(settings.civilizationEnabled),
    population: settings.initialHumans ?? 0,
    food: settings.initialHumanFood ?? 80,
    wood: settings.initialHumanWood ?? 25,
    huts: settings.initialHuts ?? 1,
    settlementX: world.width / 2,
    settlementY: world.height / 2,
    pressure: 0,
    lastBuildTick: 0,
  };

  world.humans = [];

  if (!settings.civilizationEnabled) return;

  const settlement = findSettlementPosition(world);
  world.civilization.settlementX = settlement.x;
  world.civilization.settlementY = settlement.y;

  for (let i = 0; i < settings.initialHumans; i++) {
    world.humans.push(createHuman(world, settlement.x, settlement.y));
  }

  pushWorldEvent(
    world,
    "info",
    "A small human settlement has been founded. Humans will gather resources, hunt prey and build huts.",
    {
      category: "civilization",
    },
  );
}

export function updateCivilization(world) {
  const settings = world.settings;

  if (!settings.civilizationEnabled) {
    world.humans = [];
    if (world.civilization) {
      world.civilization.enabled = false;
    }
    return;
  }

  if (!world.civilization) {
    initializeCivilization(world);
  }

  world.civilization.enabled = true;

  if (!world.humans) {
    world.humans = [];
  }

  syncHumanPopulation(world);

  const newHumans = [];

  for (const human of world.humans) {
    updateHuman(world, human);
  }

  world.humans = world.humans.filter((human) => !human.dead);

  consumeSettlementFood(world);
  maybeGrowSettlement(world, newHumans);
  maybeBuildHut(world);
  applyHumanPressure(world);

  world.humans.push(...newHumans);

  world.civilization.population = world.humans.length;
}

function createHuman(world, x, y) {
  const random = world.random;

  return {
    id: `human-${world.tick}-${Math.round(random.next() * 1000000)}`,
    type: "human",
    x: x + random.range(-2.5, 2.5),
    y: y + random.range(-2.5, 2.5),
    energy: random.range(70, 120),
    task: "gather",
    age: 0,
    dead: false,
  };
}

function findSettlementPosition(world) {
  const random = world.random;

  let best = {
    x: world.width / 2,
    y: world.height / 2,
    score: -Infinity,
  };

  for (let attempt = 0; attempt < 400; attempt++) {
    const x = random.range(world.width * 0.18, world.width * 0.82);
    const y = random.range(world.height * 0.18, world.height * 0.82);
    const cell = getCell(world, x, y);

    if (cell.terrain === TERRAIN_TYPES.WATER) continue;

    const score = scoreSettlementPosition(world, x, y);

    if (score > best.score) {
      best = { x, y, score };
    }
  }

  return best;
}

function scoreSettlementPosition(world, x, y) {
  let score = 0;
  const radius = 7;

  for (let oy = -radius; oy <= radius; oy++) {
    for (let ox = -radius; ox <= radius; ox++) {
      const cx = Math.floor(x + ox);
      const cy = Math.floor(y + oy);

      if (cx < 0 || cy < 0 || cx >= world.width || cy >= world.height) continue;

      const cell = world.cells[cy * world.width + cx];

      if (cell.terrain === TERRAIN_TYPES.WATER) {
        score += 0.8;
      }

      if (cell.terrain === TERRAIN_TYPES.FOREST) {
        score += 2.2;
      }

      if (cell.terrain === TERRAIN_TYPES.FERTILE) {
        score += 2.4;
      }

      if (cell.terrain === TERRAIN_TYPES.BARREN) {
        score -= 1.2;
      }

      score += cell.grass / world.settings.grassMax;
    }
  }

  return score;
}

function syncHumanPopulation(world) {
  const civ = world.civilization;
  const settings = world.settings;

  while (
    world.humans.length < civ.population &&
    world.humans.length < settings.maxHumans
  ) {
    world.humans.push(createHuman(world, civ.settlementX, civ.settlementY));
  }

  if (world.humans.length > settings.maxHumans) {
    world.humans = world.humans.slice(0, settings.maxHumans);
  }
}

function updateHuman(world, human) {
  const settings = world.settings;
  const civ = world.civilization;

  human.age += 1;

  const previousX = human.x;
  const previousY = human.y;

  const settlementDirection = normalize({
    x: civ.settlementX - human.x,
    y: civ.settlementY - human.y,
  });

  const forestDirection = findNearestTerrainDirection(
    world,
    human,
    TERRAIN_TYPES.FOREST,
    9,
  );
  const fertileDirection = findNearestTerrainDirection(
    world,
    human,
    TERRAIN_TYPES.FERTILE,
    9,
  );
  const preyTarget = findNearestAgent(
    human,
    world.prey,
    settings.humanHuntRadius,
  );

  let movement = randomDirection(world.random);

  human.task = chooseHumanTask(world, human, preyTarget);

  if (human.task === "wood" && forestDirection.found) {
    movement = forestDirection.direction;
  } else if (human.task === "food" && fertileDirection.found) {
    movement = fertileDirection.direction;
  } else if (human.task === "hunt" && preyTarget.agent) {
    movement = normalize({
      x: preyTarget.agent.x - human.x,
      y: preyTarget.agent.y - human.y,
    });
  } else if (distanceToSettlement(world, human) > settings.humanRoamRadius) {
    movement = settlementDirection;
  }

  human.x += movement.x * settings.humanSpeed;
  human.y += movement.y * settings.humanSpeed;

  keepInBoundsAndTerrain(human, world, previousX, previousY);

  gatherAtHumanPosition(world, human);
  maybeHumanHunt(world, human);

  human.energy -= settings.humanHunger;

  if (
    distanceToSettlement(world, human) < 2.4 &&
    human.energy < 55 &&
    civ.food > 0
  ) {
    const eaten = Math.min(civ.food, 8);
    civ.food -= eaten;
    human.energy += eaten * 1.8;
  }

  if (human.energy <= 0 || human.age > settings.humanMaxAge) {
    human.dead = true;
  }

  human.energy = clamp(human.energy, 0, 160);
}

function chooseHumanTask(world, human, preyTarget) {
  const civ = world.civilization;

  if (preyTarget.agent && world.random.chance(world.settings.humanHuntChance)) {
    return "hunt";
  }

  if (civ.wood < civ.huts * 35 + 40) {
    return "wood";
  }

  if (civ.food < civ.population * 18) {
    return "food";
  }

  if (world.random.chance(0.45)) {
    return "wood";
  }

  return "food";
}

function gatherAtHumanPosition(world, human) {
  const settings = world.settings;
  const civ = world.civilization;
  const cell = getCell(world, human.x, human.y);

  if (cell.terrain === TERRAIN_TYPES.WATER) return;

  if (human.task === "wood" && cell.terrain === TERRAIN_TYPES.FOREST) {
    const wood = settings.humanWoodGatherRate;
    civ.wood += wood;

    cell.fertility = Math.max(
      0.35,
      cell.fertility - settings.humanForestDamage * 0.01,
    );

    if (world.random.chance(settings.humanDeforestationChance)) {
      cell.terrain = TERRAIN_TYPES.GRASSLAND;
      cell.grass *= 0.65;
    }
  }

  if (human.task === "food") {
    const gatheredGrass = Math.min(cell.grass, settings.humanFoodGatherRate);
    cell.grass -= gatheredGrass;
    civ.food += gatheredGrass * 0.18;

    if (cell.terrain === TERRAIN_TYPES.FERTILE) {
      civ.food += settings.humanFoodGatherRate * 0.08;
    }
  }
}

function maybeHumanHunt(world, human) {
  const settings = world.settings;
  const civ = world.civilization;

  if (human.task !== "hunt") return;

  const preyTarget = findNearestAgent(
    human,
    world.prey,
    settings.humanKillRadius,
  );

  if (!preyTarget.agent) return;

  preyTarget.agent.dead = true;

  const foodGain = settings.humanHuntFoodGain;
  civ.food += foodGain;
  human.energy += foodGain * 0.45;
}

function consumeSettlementFood(world) {
  const civ = world.civilization;
  const settings = world.settings;

  const consumption = civ.population * settings.humanFoodConsumptionRate;

  civ.food -= consumption;

  if (civ.food < 0) {
    const starvationPressure = Math.abs(civ.food);
    civ.food = 0;

    for (const human of world.humans) {
      human.energy -= starvationPressure * 0.02;
    }
  }
}

function maybeGrowSettlement(world, newHumans) {
  const civ = world.civilization;
  const settings = world.settings;

  if (world.humans.length >= settings.maxHumans) return;
  if (civ.food < settings.humanGrowthFoodThreshold) return;
  if (civ.huts * settings.humansPerHut <= world.humans.length) return;
  if (!world.random.chance(settings.humanGrowthChance)) return;

  civ.food -= settings.humanGrowthFoodCost;

  newHumans.push(createHuman(world, civ.settlementX, civ.settlementY));

  pushWorldEvent(world, "info", "The human settlement grew by one person.", {
    category: "civilization",
  });
}

function maybeBuildHut(world) {
  const civ = world.civilization;
  const settings = world.settings;

  if (world.tick - civ.lastBuildTick < settings.hutBuildCooldown) return;
  if (civ.wood < settings.hutWoodCost) return;
  if (civ.food < settings.hutFoodCost) return;
  if (!world.random.chance(settings.hutBuildChance)) return;

  civ.wood -= settings.hutWoodCost;
  civ.food -= settings.hutFoodCost;
  civ.huts += 1;
  civ.lastBuildTick = world.tick;

  pushWorldEvent(
    world,
    "info",
    "Humans built a new hut, increasing settlement capacity.",
    {
      category: "civilization",
    },
  );
}

function applyHumanPressure(world) {
  const civ = world.civilization;
  const settings = world.settings;

  const pressure = civ.population * 0.015 + civ.huts * 0.035;
  civ.pressure = pressure;

  const radius = settings.humanSettlementImpactRadius + civ.huts * 0.35;
  const radiusSquared = radius * radius;

  for (
    let y = Math.floor(civ.settlementY - radius);
    y <= Math.ceil(civ.settlementY + radius);
    y++
  ) {
    for (
      let x = Math.floor(civ.settlementX - radius);
      x <= Math.ceil(civ.settlementX + radius);
      x++
    ) {
      if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;

      const dx = x - civ.settlementX;
      const dy = y - civ.settlementY;

      if (dx * dx + dy * dy > radiusSquared) continue;

      const cell = world.cells[y * world.width + x];

      if (cell.terrain === TERRAIN_TYPES.WATER) continue;

      cell.grass *= 1 - settings.humanLandPressure * 0.001;

      if (
        cell.terrain === TERRAIN_TYPES.FOREST &&
        world.random.chance(settings.humanPassiveDeforestationChance)
      ) {
        cell.terrain = TERRAIN_TYPES.GRASSLAND;
      }
    }
  }
}

function findNearestTerrainDirection(world, source, terrainType, radius) {
  let best = null;
  let bestDistance = Infinity;

  for (
    let y = Math.floor(source.y - radius);
    y <= Math.ceil(source.y + radius);
    y++
  ) {
    if (y < 0 || y >= world.height) continue;

    for (
      let x = Math.floor(source.x - radius);
      x <= Math.ceil(source.x + radius);
      x++
    ) {
      if (x < 0 || x >= world.width) continue;

      const cell = world.cells[y * world.width + x];

      if (cell.terrain !== terrainType) continue;

      const dx = x + 0.5 - source.x;
      const dy = y + 0.5 - source.y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < bestDistance) {
        bestDistance = distanceSquared;
        best = { x: dx, y: dy };
      }
    }
  }

  return {
    found: Boolean(best),
    direction: best ? normalize(best) : { x: 0, y: 0 },
  };
}

function distanceToSettlement(world, human) {
  const civ = world.civilization;
  const dx = human.x - civ.settlementX;
  const dy = human.y - civ.settlementY;

  return Math.sqrt(dx * dx + dy * dy);
}
