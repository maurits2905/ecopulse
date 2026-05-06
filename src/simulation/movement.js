import { clamp } from "../utils/clamp";
import { getCell } from "./grass";
import { getTerrainInfo, isBlockedTerrain } from "./terrain";
import { canMoveThroughCell } from "./infrastructure";

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

  if (
    !isBlockedTerrain(cell.terrain) ||
    canMoveThroughCell(world, agent.x, agent.y, cell)
  ) {
    return;
  }

  agent.x = previousX;
  agent.y = previousY;

  const escape = randomDirection(world.random);
  agent.x += escape.x * 0.65;
  agent.y += escape.y * 0.65;

  keepInBounds(agent, world);

  const escapeCell = getCell(world, agent.x, agent.y);

  if (
    isBlockedTerrain(escapeCell.terrain) &&
    !canMoveThroughCell(world, agent.x, agent.y, escapeCell)
  ) {
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

export function findBestShelterDirection(agent, world, vision) {
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

      const cell = getCell(world, x, y);
      if (isBlockedTerrain(cell.terrain)) continue;

      const terrainInfo = getTerrainInfo(cell.terrain);
      if (terrainInfo.shelter <= 0) continue;

      const dx = x + 0.5 - agent.x;
      const dy = y + 0.5 - agent.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d > vision || d === 0) continue;

      const score = (terrainInfo.shelter * 100 + cell.grass * 0.2) / (d + 1);

      if (score > bestScore) {
        bestScore = score;
        best = { x: dx, y: dy };
      }
    }
  }

  return best ? normalize(best) : { x: 0, y: 0 };
}

export function countNearbyAgents(source, agents, radius) {
  let count = 0;
  const radiusSquared = radius * radius;

  for (const target of agents) {
    if (target.dead || target.id === source.id) continue;

    const dx = source.x - target.x;
    const dy = source.y - target.y;

    if (dx * dx + dy * dy <= radiusSquared) {
      count += 1;
    }
  }

  return count;
}

export function getGroupVectors(source, agents, radius) {
  let nearby = 0;
  let centerX = 0;
  let centerY = 0;
  let separationX = 0;
  let separationY = 0;

  for (const target of agents) {
    if (target.dead || target.id === source.id) continue;

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared > radius * radius || distanceSquared === 0) continue;

    const d = Math.sqrt(distanceSquared);

    nearby += 1;
    centerX += target.x;
    centerY += target.y;

    separationX -= dx / Math.max(0.1, d * d);
    separationY -= dy / Math.max(0.1, d * d);
  }

  if (nearby === 0) {
    return {
      nearby: 0,
      cohesion: { x: 0, y: 0 },
      separation: { x: 0, y: 0 },
    };
  }

  centerX /= nearby;
  centerY /= nearby;

  return {
    nearby,
    cohesion: normalize({
      x: centerX - source.x,
      y: centerY - source.y,
    }),
    separation: normalize({
      x: separationX,
      y: separationY,
    }),
  };
}

export function randomDirection(random) {
  const angle = random.range(0, Math.PI * 2);

  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}
