import { createPredatorChild, createPreyChild } from "./createWorld";

export function maybeReproducePrey(prey, world, newborns) {
  const settings = world.settings;

  if (world.prey.length + newborns.length >= settings.maxPrey) return;
  if (prey.cooldown > 0) return;
  if (prey.energy < prey.traits.reproductionEnergy) return;
  if (!world.random.chance(settings.preyReproductionChance)) return;

  prey.energy -= settings.preyReproductionCost;
  prey.cooldown = 95;

  newborns.push(createPreyChild(prey, world));
}

export function maybeReproducePredator(predator, world, newborns) {
  const settings = world.settings;

  if (world.predators.length + newborns.length >= settings.maxPredators) return;
  if (predator.cooldown > 0) return;
  if (predator.energy < predator.traits.reproductionEnergy) return;
  if (!world.random.chance(settings.predatorReproductionChance)) return;

  predator.energy -= settings.predatorReproductionCost;
  predator.cooldown = 130;

  newborns.push(createPredatorChild(predator, world));
}
