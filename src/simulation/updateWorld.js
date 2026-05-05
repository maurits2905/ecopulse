import { clamp } from "../utils/clamp";
import { eatGrassAt, getCell } from "./grass";
import {
  countNearbyAgents,
  findBestGrassDirection,
  findNearestAgent,
  findNearestVisiblePrey,
  keepInBoundsAndTerrain,
  normalize,
  randomDirection,
} from "./movement";
import { growGrass } from "./grass";
import { maybeReproducePredator, maybeReproducePrey } from "./reproduction";
import { getCurrentSeason } from "./seasons";
import { getTerrainInfo } from "./terrain";
import { collectStats, evaluateEvents, pushHistory } from "./stats";

function updatePrey(world) {
  const settings = world.settings;
  const newborns = [];
  const season = getCurrentSeason(world);

  for (const prey of world.prey) {
    prey.age += 1;
    prey.cooldown = Math.max(0, prey.cooldown - 1);

    const vision = prey.traits.vision;
    const speed = prey.traits.speed;
    const caution = prey.traits.caution;
    const metabolism = prey.traits.metabolism;

    const previousX = prey.x;
    const previousY = prey.y;

    const localPrey = countNearbyAgents(
      prey,
      world.prey,
      settings.preyCrowdingRadius,
    );
    prey.localCrowding = localPrey;

    const nearestPredator = findNearestAgent(
      prey,
      world.predators,
      vision * caution,
    );
    const grassDirection = findBestGrassDirection(prey, world, vision);
    const wander = randomDirection(world.random);

    let movement = {
      x: grassDirection.x * 1.2 + wander.x * settings.randomWander,
      y: grassDirection.y * 1.2 + wander.y * settings.randomWander,
    };

    if (nearestPredator.agent) {
      const flee = normalize({
        x: prey.x - nearestPredator.agent.x,
        y: prey.y - nearestPredator.agent.y,
      });

      movement.x += flee.x * (1.5 + caution * 1.45);
      movement.y += flee.y * (1.5 + caution * 1.45);
    }

    if (localPrey > 2) {
      const disperse = randomDirection(world.random);
      movement.x += disperse.x * Math.min(1.1, localPrey * 0.08);
      movement.y += disperse.y * Math.min(1.1, localPrey * 0.08);
    }

    movement = normalize(movement);

    const currentCell = getCell(world, prey.x, prey.y);
    const currentTerrain = getTerrainInfo(currentCell.terrain);
    const terrainSlowdown = currentTerrain.shelter > 0 ? 0.88 : 1;

    prey.x += movement.x * speed * terrainSlowdown;
    prey.y += movement.y * speed * terrainSlowdown;

    keepInBoundsAndTerrain(prey, world, previousX, previousY);

    const eaten = eatGrassAt(world, prey.x, prey.y, settings.grassBite);
    const cautionFeedingCost = 1 - Math.min(0.22, caution * 0.06);

    prey.recentFood = eaten;

    prey.energy += eaten * settings.grassEnergy * cautionFeedingCost;

    const speedCost = speed * 0.12;
    const visionCost = vision * 0.006;
    const crowdingCost = localPrey * settings.preyCrowdingEnergyCost;

    prey.energy -=
      settings.preyHunger * metabolism * season.hungerModifier +
      speedCost +
      visionCost +
      crowdingCost;

    maybeReproducePrey(prey, world, newborns);

    if (prey.energy <= 0 || prey.age > settings.preyMaxAge) {
      prey.dead = true;
    }

    prey.energy = clamp(prey.energy, 0, 190);
  }

  world.prey = world.prey.filter((prey) => !prey.dead);
  world.prey.push(...newborns);
}

function updatePredators(world) {
  const settings = world.settings;
  const newborns = [];
  const season = getCurrentSeason(world);

  for (const predator of world.predators) {
    predator.age += 1;
    predator.cooldown = Math.max(0, predator.cooldown - 1);
    predator.huntCooldown = Math.max(0, (predator.huntCooldown ?? 0) - 1);

    const vision = predator.traits.vision;
    const speed = predator.traits.speed;
    const aggression = predator.traits.aggression;
    const metabolism = predator.traits.metabolism;

    const previousX = predator.x;
    const previousY = predator.y;

    const localPredators = countNearbyAgents(
      predator,
      world.predators,
      settings.predatorCrowdingRadius,
    );
    predator.localCrowding = localPredators;

    const nearestPrey = findNearestVisiblePrey(
      predator,
      world.prey,
      world,
      vision,
    );
    const wander = randomDirection(world.random);

    let movement = {
      x: wander.x * settings.randomWander,
      y: wander.y * settings.randomWander,
    };

    if (nearestPrey.agent) {
      const chase = normalize({
        x: nearestPrey.agent.x - predator.x,
        y: nearestPrey.agent.y - predator.y,
      });

      movement.x += chase.x * (1.3 + aggression * 1.15);
      movement.y += chase.y * (1.3 + aggression * 1.15);
    }

    if (localPredators > 1) {
      const disperse = randomDirection(world.random);
      movement.x += disperse.x * Math.min(0.9, localPredators * 0.06);
      movement.y += disperse.y * Math.min(0.9, localPredators * 0.06);
    }

    movement = normalize(movement);

    const currentCell = getCell(world, predator.x, predator.y);
    const currentTerrain = getTerrainInfo(currentCell.terrain);
    const terrainSlowdown = currentTerrain.shelter > 0 ? 0.82 : 1;

    predator.x += movement.x * speed * terrainSlowdown;
    predator.y += movement.y * speed * terrainSlowdown;

    keepInBoundsAndTerrain(predator, world, previousX, previousY);

    const predatorCell = getCell(world, predator.x, predator.y);
    const shelter = getTerrainInfo(predatorCell.terrain).shelter;
    const effectiveKillRadius =
      settings.predatorKillRadius * (1 - shelter * 0.35);

    if (predator.huntCooldown <= 0) {
      const preyAfterMove = findNearestAgent(
        predator,
        world.prey,
        effectiveKillRadius,
      );

      if (preyAfterMove.agent) {
        preyAfterMove.agent.dead = true;
        predator.energy += settings.predatorEatEnergy;
        predator.huntCooldown = settings.predatorHandlingTime;
      }
    }

    const speedCost = speed * 0.14;
    const visionCost = vision * 0.008;
    const aggressionCost = aggression * 0.12;
    const crowdingCost = localPredators * settings.predatorCrowdingEnergyCost;

    predator.energy -=
      settings.predatorHunger * metabolism * season.hungerModifier +
      speedCost +
      visionCost +
      aggressionCost +
      crowdingCost;

    maybeReproducePredator(predator, world, newborns);

    if (predator.energy <= 0 || predator.age > settings.predatorMaxAge) {
      predator.dead = true;
    }

    predator.energy = clamp(predator.energy, 0, 240);
  }

  world.prey = world.prey.filter((prey) => !prey.dead);
  world.predators = world.predators.filter((predator) => !predator.dead);
  world.predators.push(...newborns);
}

export function updateWorld(world) {
  growGrass(world);
  updatePrey(world);
  updatePredators(world);

  world.tick += 1;
  world.stats = collectStats(world);

  pushHistory(world);
  evaluateEvents(world);

  return world;
}
