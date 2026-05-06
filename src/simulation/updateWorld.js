import { clamp } from "../utils/clamp";
import { updateCivilization } from "./civilization";
import {
  applyEnvironmentalEventEffects,
  getEnvironmentalModifiers,
  updateEnvironmentalEvents,
} from "./environmentalEvents";
import { eatGrassAt, getCell } from "./grass";
import {
  countNearbyAgents,
  findBestGrassDirection,
  findBestShelterDirection,
  findNearestAgent,
  findNearestVisiblePrey,
  getGroupVectors,
  keepInBoundsAndTerrain,
  normalize,
  randomDirection,
} from "./movement";
import { growGrass } from "./grass";
import { applyMigration } from "./migration";
import { maybeReproducePredator, maybeReproducePrey } from "./reproduction";
import { getCurrentSeason } from "./seasons";
import { getTerrainInfo } from "./terrain";
import { collectStats, evaluateEvents, pushHistory } from "./stats";

function updatePrey(world) {
  const settings = world.settings;
  const newborns = [];
  const season = getCurrentSeason(world);
  const environmental = getEnvironmentalModifiers(world);

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
    const shelterDirection = findBestShelterDirection(prey, world, vision);
    const groupVectors = getGroupVectors(
      prey,
      world.prey,
      settings.preyHerdingRadius,
    );
    const wander = randomDirection(world.random);

    const isThreatened = Boolean(nearestPredator.agent);
    const isStarving =
      prey.energy <
      prey.traits.reproductionEnergy * settings.preyStarvingEnergyRatio;

    let grassWeight = isStarving ? 2.15 : 1.2;
    let fleeWeight = isStarving ? 1.25 : 1.5 + caution * 1.45;
    let shelterWeight = isThreatened
      ? settings.preyShelterSeekingStrength * caution
      : 0;

    if (isStarving && isThreatened) {
      grassWeight *= 1.2;
      fleeWeight *= 0.7;
      shelterWeight *= 0.75;
    }

    let movement = {
      x:
        grassDirection.x * grassWeight +
        shelterDirection.x * shelterWeight +
        groupVectors.cohesion.x * settings.preyHerdingStrength +
        groupVectors.separation.x * settings.preySeparationStrength +
        wander.x * settings.randomWander,
      y:
        grassDirection.y * grassWeight +
        shelterDirection.y * shelterWeight +
        groupVectors.cohesion.y * settings.preyHerdingStrength +
        groupVectors.separation.y * settings.preySeparationStrength +
        wander.y * settings.randomWander,
    };

    if (nearestPredator.agent) {
      const flee = normalize({
        x: prey.x - nearestPredator.agent.x,
        y: prey.y - nearestPredator.agent.y,
      });

      movement.x += flee.x * fleeWeight;
      movement.y += flee.y * fleeWeight;
    }

    if (localPrey > 2) {
      const disperse =
        groupVectors.nearby > 0
          ? groupVectors.separation
          : randomDirection(world.random);

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
    const herdingCost =
      groupVectors.nearby > 0 ? settings.preyHerdingEnergyCost : 0;

    const grassPercent = world.stats?.grassPercent ?? 1;
    const preyPressure = world.prey.length / Math.max(1, settings.maxPrey);
    const grassScarcity = Math.max(
      0,
      1 -
        grassPercent /
          Math.max(0.01, settings.preyReproductionGrassRequirement),
    );

    const carryingPressureCost =
      preyPressure * settings.preyCarryingPressureStrength +
      grassScarcity * settings.preyGrassScarcityPressure;

    prey.energy -=
      settings.preyHunger *
        metabolism *
        season.hungerModifier *
        environmental.hungerModifier +
      speedCost +
      visionCost +
      crowdingCost +
      herdingCost +
      carryingPressureCost;

    if (
      preyPressure > 0.82 &&
      grassPercent < settings.preyReproductionGrassRequirement &&
      world.random.chance(settings.preyOverpopulationMortality * preyPressure)
    ) {
      prey.dead = true;
    }

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
  const environmental = getEnvironmentalModifiers(world);

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

    const packVectors = getGroupVectors(
      predator,
      world.predators,
      settings.predatorPackRadius,
    );

    predator.localCrowding = localPredators;

    const nearestPrey = findNearestVisiblePrey(
      predator,
      world.prey,
      world,
      vision,
    );
    const wander = randomDirection(world.random);

    const isStarving =
      predator.energy <
      predator.traits.reproductionEnergy * settings.predatorStarvingEnergyRatio;
    const preyVisible = Boolean(nearestPrey.agent);
    const shouldRest =
      isStarving &&
      !preyVisible &&
      world.random.chance(settings.predatorRestChance);

    let movement = {
      x:
        wander.x * settings.randomWander +
        packVectors.cohesion.x * settings.predatorPackCohesionStrength +
        packVectors.separation.x * settings.predatorPackSeparationStrength,
      y:
        wander.y * settings.randomWander +
        packVectors.cohesion.y * settings.predatorPackCohesionStrength +
        packVectors.separation.y * settings.predatorPackSeparationStrength,
    };

    if (nearestPrey.agent && !shouldRest) {
      const chase = normalize({
        x: nearestPrey.agent.x - predator.x,
        y: nearestPrey.agent.y - predator.y,
      });

      const packPressure =
        1 + Math.min(0.45, packVectors.nearby * settings.predatorPackHuntBonus);

      movement.x += chase.x * (1.3 + aggression * 1.15) * packPressure;
      movement.y += chase.y * (1.3 + aggression * 1.15) * packPressure;
    }

    if (localPredators > 1) {
      movement.x +=
        packVectors.separation.x * Math.min(0.9, localPredators * 0.06);
      movement.y +=
        packVectors.separation.y * Math.min(0.9, localPredators * 0.06);
    }

    movement = normalize(movement);

    const currentCell = getCell(world, predator.x, predator.y);
    const currentTerrain = getTerrainInfo(currentCell.terrain);
    const terrainSlowdown = currentTerrain.shelter > 0 ? 0.82 : 1;
    const restMovementFactor = shouldRest ? 0.18 : 1;

    predator.x += movement.x * speed * terrainSlowdown * restMovementFactor;
    predator.y += movement.y * speed * terrainSlowdown * restMovementFactor;

    keepInBoundsAndTerrain(predator, world, previousX, previousY);

    const predatorCell = getCell(world, predator.x, predator.y);
    const shelter = getTerrainInfo(predatorCell.terrain).shelter;
    const packKillBonus = Math.min(
      0.32,
      packVectors.nearby * settings.predatorPackKillRadiusBonus,
    );
    const effectiveKillRadius =
      settings.predatorKillRadius * (1 + packKillBonus) * (1 - shelter * 0.35);

    if (predator.huntCooldown <= 0 && !shouldRest) {
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

    const speedCost = shouldRest ? speed * 0.035 : speed * 0.14;
    const visionCost = vision * 0.008;
    const aggressionCost = shouldRest ? aggression * 0.035 : aggression * 0.12;
    const crowdingCost = localPredators * settings.predatorCrowdingEnergyCost;
    const packCost =
      packVectors.nearby > 0 ? settings.predatorPackEnergyCost : 0;

    const predatorPressure =
      world.predators.length / Math.max(1, settings.maxPredators);
    const preyPerPredator =
      world.prey.length / Math.max(1, world.predators.length);
    const preyScarcityCost =
      preyPerPredator < settings.predatorPreyRatioForReproduction
        ? settings.predatorPreyScarcityPressure *
          (1 -
            preyPerPredator /
              Math.max(1, settings.predatorPreyRatioForReproduction))
        : 0;

    predator.energy -=
      settings.predatorHunger *
        metabolism *
        season.hungerModifier *
        environmental.hungerModifier +
      speedCost +
      visionCost +
      aggressionCost +
      crowdingCost +
      packCost +
      preyScarcityCost;

    if (
      predatorPressure > 0.85 &&
      world.random.chance(
        settings.predatorOverpopulationMortality * predatorPressure,
      )
    ) {
      predator.dead = true;
    }

    if (shouldRest) {
      predator.energy += settings.predatorRestEnergySave;
    }

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
  updateEnvironmentalEvents(world);
  growGrass(world);
  updatePrey(world);
  updatePredators(world);
  applyMigration(world);
  updateCivilization(world);
  applyEnvironmentalEventEffects(world);

  world.tick += 1;
  world.stats = collectStats(world);

  pushHistory(world);
  evaluateEvents(world);

  return world;
}
