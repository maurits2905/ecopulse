export const TERRAIN_TYPES = {
  GRASSLAND: "grassland",
  FERTILE: "fertile",
  BARREN: "barren",
  FOREST: "forest",
  WATER: "water",
};

export const TERRAIN_INFO = {
  grassland: {
    label: "Grassland",
    description: "Normal ecosystem ground with average grass growth.",
    grassModifier: 1,
    fertilityModifier: 1,
    blocksMovement: false,
    shelter: 0,
  },
  fertile: {
    label: "Fertile land",
    description: "Rich soil where grass recovers quickly.",
    grassModifier: 1.65,
    fertilityModifier: 1.35,
    blocksMovement: false,
    shelter: 0,
  },
  barren: {
    label: "Barren land",
    description: "Poor ground where grass grows slowly.",
    grassModifier: 0.35,
    fertilityModifier: 0.55,
    blocksMovement: false,
    shelter: 0,
  },
  forest: {
    label: "Forest and bushes",
    description:
      "Vegetation that gives prey shelter and slows predator pressure.",
    grassModifier: 0.82,
    fertilityModifier: 1.08,
    blocksMovement: false,
    shelter: 0.38,
  },
  water: {
    label: "Water",
    description: "Blocks movement and prevents grass growth.",
    grassModifier: 0,
    fertilityModifier: 0,
    blocksMovement: true,
    shelter: 0,
  },
};

export function getTerrainInfo(type) {
  return TERRAIN_INFO[type] ?? TERRAIN_INFO.grassland;
}

export function isBlockedTerrain(type) {
  return getTerrainInfo(type).blocksMovement;
}

export function chooseTerrain(random, settings, x, y) {
  if (!settings.terrainEnabled) {
    return TERRAIN_TYPES.GRASSLAND;
  }

  const width = settings.worldWidth;
  const height = settings.worldHeight;

  const edgeDistance = Math.min(x, y, width - x - 1, height - y - 1);
  const edgeFactor = edgeDistance < 3 ? 0.35 : 1;

  const roll = random.next();

  const waterAmount = settings.waterAmount * edgeFactor;
  const forestAmount = settings.forestAmount;
  const barrenAmount = settings.barrenAmount;
  const fertileAmount = settings.fertileAmount;

  if (roll < waterAmount) return TERRAIN_TYPES.WATER;
  if (roll < waterAmount + forestAmount) return TERRAIN_TYPES.FOREST;
  if (roll < waterAmount + forestAmount + barrenAmount)
    return TERRAIN_TYPES.BARREN;
  if (roll < waterAmount + forestAmount + barrenAmount + fertileAmount) {
    return TERRAIN_TYPES.FERTILE;
  }

  return TERRAIN_TYPES.GRASSLAND;
}

export function getTerrainCounts(world) {
  const counts = {
    grassland: 0,
    fertile: 0,
    barren: 0,
    forest: 0,
    water: 0,
  };

  for (const cell of world.cells) {
    counts[cell.terrain ?? TERRAIN_TYPES.GRASSLAND] += 1;
  }

  return counts;
}
