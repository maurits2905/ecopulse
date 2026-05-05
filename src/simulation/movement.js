import { clamp } from "../utils/clamp";
import { getCell } from "./grass";
import { getTerrainInfo, isBlockedTerrain } from "./terrain";

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(vector) {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

export function keepInBounds(agent, world) {
  agent.x = clamp(agent.x, 0, world.width - 0.001);
  agent.y = clamp(agent.y, 0, world.height - 0.001);
}

export function keepInBoundsAndTerrain(agent, world, previousX, previousY) {
  keepInBounds(agent, world);

  const cell = getCell(world, agent.x, agent.y);

  if (!isBlockedTerrain(cell.terrain)) {
    return;
  }

  agent.x = previousX;
  agent.y = previousY;

  const escape = randomDirection(world.random);
  agent.x += escape.x * 0.65;
  agent.y += escape.y * 0.65;

  keepInBounds(agent, world);

  const escapeCell = getCell(world, agent.x, agent.y);

  if (isBlockedTerrain(escapeCell.terrain)) {
    agent.x = previousX;
    agent.y = previousY;
    keepInBounds(agent, world);
  }
}

export function findNearestAgent(source, agents, maxDistance) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const target of agents) {
    if (target.dead) continue;

    const d = distance(source, target);

    if (d < nearestDistance && d <= maxDistance) {
      nearest = target;
      nearestDistance = d;
    }
  }

  return {
    agent: nearest,
    distance: nearestDistance,
  };
}

export function findNearestVisiblePrey(predator, preyList, world, maxDistance) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const prey of preyList) {
    if (prey.dead) continue;

    const d = distance(predator, prey);
    if (d > maxDistance || d >= nearestDistance) continue;

    const preyCell = getCell(world, prey.x, prey.y);
    const shelter = getTerrainInfo(preyCell.terrain).shelter;
    const visibilityDistance = maxDistance * (1 - shelter * 0.55);

    if (d <= visibilityDistance) {
      nearest = prey;
      nearestDistance = d;
    }
  }

  return {
    agent: nearest,
    distance: nearestDistance,
  };
}

export function findBestGrassDirection(agent, world, vision) {
  let bestScore = 0;
  let best = null;

  const startX = Math.floor(agent.x - vision);
  const endX = Math.floor(agent.x + vision);
  const startY = Math.floor(agent.y - vision);
  const endY = Math.floor(agent.y + vision);

  for (let y = startY; y <= endY; y++) {
    if (y < 0 || y >= world.height) continue;

    for (let x = startX; x <= endX; x++) {
      if (x < 0 || x >= world.width) continue;

      const dx = x + 0.5 - agent.x;
      const dy = y + 0.5 - agent.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d > vision || d === 0) continue;

      const cell = getCell(world, x, y);
      if (isBlockedTerrain(cell.terrain)) continue;

      const terrainInfo = getTerrainInfo(cell.terrain);
      const shelterBonus = terrainInfo.shelter * 16;
      const score = (cell.grass + shelterBonus) / (d + 1);

      if (score > bestScore) {
        bestScore = score;
        best = { x: dx, y: dy };
      }
    }
  }

  return best ? normalize(best) : { x: 0, y: 0 };
}

export function randomDirection(random) {
  const angle = random.range(0, Math.PI * 2);

  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}
