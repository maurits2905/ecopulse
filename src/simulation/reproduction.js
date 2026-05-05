import { createPredatorChild, createPreyChild } from "./createWorld";

export function maybeReproducePrey(prey, world, newborns) {
  const settings = world.settings;

  if (world.prey.length + newborns.length >= settings.maxPrey) return;
  if (prey.cooldown > 0) return;
  if (prey.energy < prey.traits.reproductionEnergy) return;

  const recentFood = prey.recentFood ?? 0;
  const localCrowding = prey.localCrowding ?? 0;

  const foodFactor = recentFood > settings.preyRecentFoodNeeded ? 1 : 0.35;
  const crowdingFactor =
    1 / (1 + localCrowding * settings.preyCrowdingReproductionPenalty);
  const populationPressure =
    1 - Math.min(0.72, world.prey.length / settings.maxPrey);

  const chance =
    settings.preyReproductionChance *
    foodFactor *
    crowdingFactor *
    Math.max(0.08, populationPressure);

  if (!world.random.chance(chance)) return;

  prey.energy -= settings.preyReproductionCost;
  prey.cooldown = 105;

  newborns.push(createPreyChild(prey, world));
}

export function maybeReproducePredator(predator, world, newborns) {
  const settings = world.settings;

  if (world.predators.length + newborns.length >= settings.maxPredators) return;
  if (predator.cooldown > 0) return;
  if (predator.energy < predator.traits.reproductionEnergy) return;

  const localCrowding = predator.localCrowding ?? 0;
  const preyAvailable = world.prey.length / Math.max(1, world.predators.length);
  const preyAvailabilityFactor = Math.min(
    1,
    preyAvailable / settings.predatorPreyRatioForReproduction,
  );
  const crowdingFactor =
    1 / (1 + localCrowding * settings.predatorCrowdingReproductionPenalty);
  const populationPressure =
    1 - Math.min(0.75, world.predators.length / settings.maxPredators);

  const chance =
    settings.predatorReproductionChance *
    preyAvailabilityFactor *
    crowdingFactor *
    Math.max(0.08, populationPressure);

  if (!world.random.chance(chance)) return;

  predator.energy -= settings.predatorReproductionCost;
  predator.cooldown = 155;

  newborns.push(createPredatorChild(predator, world));
}
