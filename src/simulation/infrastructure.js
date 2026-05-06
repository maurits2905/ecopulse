import { TERRAIN_TYPES } from "./terrain";
import { pushWorldEvent } from "./eventBus";

export function initializeInfrastructure(world) {
  world.infrastructure = world.infrastructure ?? {
    bridges: [],
    roads: [],
  };
}

export function isBridgeAt(world, x, y) {
  const bridges = world.infrastructure?.bridges ?? [];
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);

  return bridges.some((bridge) =>
    bridge.cells.some((cell) => cell.x === cellX && cell.y === cellY),
  );
}

export function canMoveThroughCell(world, x, y, cell) {
  if (!cell) return false;
  if (cell.terrain !== TERRAIN_TYPES.WATER) return true;
  return isBridgeAt(world, x, y);
}

export function maybeBuildBridge(world) {
  const settings = world.settings;
  const civ = world.civilization;

  if (!settings.civilizationEnabled || !settings.bridgeBuildingEnabled) return;
  if (!civ?.enabled) return;

  initializeInfrastructure(world);

  if (world.tick < settings.bridgeBuildStartTick) return;
  if (
    world.tick - (civ.lastBridgeBuildTick ?? -99999) <
    settings.bridgeBuildCooldown
  )
    return;
  if (civ.wood < settings.bridgeWoodCost) return;
  if (civ.food < settings.bridgeFoodCost) return;
  if (!world.random.chance(settings.bridgeBuildChance)) return;

  const site = findBridgeSite(world);

  if (!site) return;

  civ.wood -= settings.bridgeWoodCost;
  civ.food -= settings.bridgeFoodCost;
  civ.lastBridgeBuildTick = world.tick;

  world.infrastructure.bridges.push({
    id: `bridge-${world.tick}-${Math.round(world.random.next() * 100000)}`,
    x: site.x,
    y: site.y,
    orientation: site.orientation,
    cells: site.cells,
    builtAt: world.tick,
  });

  pushWorldEvent(
    world,
    "info",
    "Humans built a bridge across a narrow water crossing. Animals can use it too.",
    {
      category: "civilization",
    },
  );
}

function findBridgeSite(world) {
  const settings = world.settings;
  const civ = world.civilization;

  const radius = settings.bridgeSearchRadius;
  let best = null;

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
      if (x < 2 || y < 2 || x >= world.width - 2 || y >= world.height - 2)
        continue;

      const cell = world.cells[y * world.width + x];
      if (cell?.terrain !== TERRAIN_TYPES.WATER) continue;

      if (
        isTooCloseToExistingBridge(world, x, y, settings.bridgeMinimumSpacing)
      )
        continue;

      const horizontal = evaluateCrossing(world, x, y, "horizontal");
      const vertical = evaluateCrossing(world, x, y, "vertical");

      const candidate =
        horizontal.score > vertical.score ? horizontal : vertical;

      if (!candidate.valid) continue;

      const distanceToSettlement = Math.sqrt(
        (x - civ.settlementX) ** 2 + (y - civ.settlementY) ** 2,
      );

      const usefulDistanceScore = Math.max(
        0,
        1 - distanceToSettlement / radius,
      );
      const finalScore = candidate.score + usefulDistanceScore * 2;

      if (!best || finalScore > best.score) {
        best = {
          ...candidate,
          x,
          y,
          score: finalScore,
        };
      }
    }
  }

  return best;
}

function evaluateCrossing(world, x, y, orientation) {
  const cells = [{ x, y }];

  if (orientation === "horizontal") {
    let leftLand = false;
    let rightLand = false;

    for (let dx = 1; dx <= 3; dx++) {
      const left = getTerrain(world, x - dx, y);
      const right = getTerrain(world, x + dx, y);

      if (left === TERRAIN_TYPES.WATER) cells.push({ x: x - dx, y });
      if (right === TERRAIN_TYPES.WATER) cells.push({ x: x + dx, y });

      if (left && left !== TERRAIN_TYPES.WATER) leftLand = true;
      if (right && right !== TERRAIN_TYPES.WATER) rightLand = true;

      if (leftLand && rightLand) break;
    }

    const waterWidth = countBridgeWaterCells(world, cells);

    return {
      valid: leftLand && rightLand && waterWidth >= 1 && waterWidth <= 4,
      orientation,
      cells: normalizeBridgeCells(cells),
      score: 8 - waterWidth,
    };
  }

  let topLand = false;
  let bottomLand = false;

  for (let dy = 1; dy <= 3; dy++) {
    const top = getTerrain(world, x, y - dy);
    const bottom = getTerrain(world, x, y + dy);

    if (top === TERRAIN_TYPES.WATER) cells.push({ x, y: y - dy });
    if (bottom === TERRAIN_TYPES.WATER) cells.push({ x, y: y + dy });

    if (top && top !== TERRAIN_TYPES.WATER) topLand = true;
    if (bottom && bottom !== TERRAIN_TYPES.WATER) bottomLand = true;

    if (topLand && bottomLand) break;
  }

  const waterWidth = countBridgeWaterCells(world, cells);

  return {
    valid: topLand && bottomLand && waterWidth >= 1 && waterWidth <= 4,
    orientation,
    cells: normalizeBridgeCells(cells),
    score: 8 - waterWidth,
  };
}

function normalizeBridgeCells(cells) {
  const seen = new Set();
  const result = [];

  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(cell);
  }

  return result;
}

function countBridgeWaterCells(world, cells) {
  return cells.filter(
    (cell) => getTerrain(world, cell.x, cell.y) === TERRAIN_TYPES.WATER,
  ).length;
}

function getTerrain(world, x, y) {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return null;
  return world.cells[y * world.width + x]?.terrain ?? null;
}

function isTooCloseToExistingBridge(world, x, y, spacing) {
  const bridges = world.infrastructure?.bridges ?? [];

  for (const bridge of bridges) {
    const dx = bridge.x - x;
    const dy = bridge.y - y;

    if (dx * dx + dy * dy < spacing * spacing) {
      return true;
    }
  }

  return false;
}
