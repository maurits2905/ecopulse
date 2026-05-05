import { clamp } from "../utils/clamp";
import { eatGrassAt } from "./grass";
import {
  findBestGrassDirection,
  findNearestAgent,
  keepInBounds,
  normalize,
  randomDirection,
} from "./movement";
import { growGrass } from "./grass";
import { maybeReproducePredator, maybeReproducePrey } from "./reproduction";
import { collectStats, evaluateEvents, pushHistory } from "./stats";

function updatePrey(world) {
  const settings = world.settings;
  const newborns = [];

  for (const prey of world.prey) {
    prey.age += 1;
    prey.cooldown = Math.max(0, prey.cooldown - 1);

    const nearestPredator = findNearestAgent(
      prey,
      world.predators,
      settings.preyVision,
    );
    const grassDirection = findBestGrassDirection(
      prey,
      world,
      settings.preyVision,
    );
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

      movement.x += flee.x * 2.4;
      movement.y += flee.y * 2.4;
    }

    movement = normalize(movement);

    prey.x += movement.x * settings.preySpeed;
    prey.y += movement.y * settings.preySpeed;

    keepInBounds(prey, world);

    const eaten = eatGrassAt(world, prey.x, prey.y, settings.grassBite);
    prey.energy += eaten * settings.grassEnergy;

    prey.energy -= settings.preyHunger + settings.preySpeed * 0.08;

    maybeReproducePrey(prey, world, newborns);

    if (prey.energy <= 0 || prey.age > settings.preyMaxAge) {
      prey.dead = true;
    }

    prey.energy = clamp(prey.energy, 0, 180);
  }

  world.prey = world.prey.filter((prey) => !prey.dead);
  world.prey.push(...newborns);
}

function updatePredators(world) {
  const settings = world.settings;
  const newborns = [];

  for (const predator of world.predators) {
    predator.age += 1;
    predator.cooldown = Math.max(0, predator.cooldown - 1);

    const nearestPrey = findNearestAgent(
      predator,
      world.prey,
      settings.predatorVision,
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

      movement.x += chase.x * 2.1;
      movement.y += chase.y * 2.1;
    }

    movement = normalize(movement);

    predator.x += movement.x * settings.predatorSpeed;
    predator.y += movement.y * settings.predatorSpeed;

    keepInBounds(predator, world);

    const preyAfterMove = findNearestAgent(
      predator,
      world.prey,
      settings.predatorKillRadius,
    );

    if (preyAfterMove.agent) {
      preyAfterMove.agent.dead = true;
      predator.energy += settings.predatorEatEnergy;
    }

    predator.energy -= settings.predatorHunger + settings.predatorSpeed * 0.1;

    maybeReproducePredator(predator, world, newborns);

    if (predator.energy <= 0 || predator.age > settings.predatorMaxAge) {
      predator.dead = true;
    }

    predator.energy = clamp(predator.energy, 0, 230);
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
