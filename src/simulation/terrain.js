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

export function generateTerrainMap(settings, random) {
  const width = settings.worldWidth;
  const height = settings.worldHeight;
  const seed = random.int(1, 999999);

  const elevationScale = settings.biomeScale ?? 22;
  const moistureScale = Math.max(12, elevationScale * 0.8);
  const fertilityScale = Math.max(10, elevationScale * 0.55);

  const elevation = createNoiseMap(
    width,
    height,
    seed + 11,
    elevationScale,
    4,
    0.52,
  );
  const moisture = createNoiseMap(
    width,
    height,
    seed + 29,
    moistureScale,
    4,
    0.56,
  );
  const fertility = createNoiseMap(
    width,
    height,
    seed + 47,
    fertilityScale,
    3,
    0.5,
  );

  const terrain = Array(width * height).fill(TERRAIN_TYPES.GRASSLAND);

  if (!settings.terrainEnabled) {
    return terrain;
  }

  const waterLevel = 0.23 + settings.waterAmount * 1.15;
  const pondLevel = 0.16 + settings.waterAmount * 0.75;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const edgeOcean = getEdgeOceanFactor(
        x,
        y,
        width,
        height,
        settings.waterAmount,
      );
      const localElevation = elevation[index] - edgeOcean;

      if (
        localElevation < waterLevel ||
        (localElevation < pondLevel && moisture[index] > 0.68)
      ) {
        terrain[index] = TERRAIN_TYPES.WATER;
      }
    }
  }

  addRivers(terrain, elevation, moisture, width, height, random, settings);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;

      if (terrain[index] === TERRAIN_TYPES.WATER) continue;

      const nearbyWater = hasNearbyTerrain(
        terrain,
        width,
        height,
        x,
        y,
        TERRAIN_TYPES.WATER,
        3,
      );
      const e = elevation[index];
      const m = moisture[index];
      const f = fertility[index];

      const forestScore = m * 0.72 + f * 0.28;
      const barrenScore = (1 - m) * 0.7 + e * 0.18 + (1 - f) * 0.12;
      const fertileScore = f * 0.55 + m * 0.25 + (nearbyWater ? 0.28 : 0);

      const forestThreshold = 0.62 - settings.forestAmount * 0.72;
      const barrenThreshold = 0.73 - settings.barrenAmount * 0.78;
      const fertileThreshold = 0.72 - settings.fertileAmount * 0.85;

      if (forestScore > forestThreshold && e > 0.22) {
        terrain[index] = TERRAIN_TYPES.FOREST;
      } else if (barrenScore > barrenThreshold && !nearbyWater) {
        terrain[index] = TERRAIN_TYPES.BARREN;
      } else if (fertileScore > fertileThreshold) {
        terrain[index] = TERRAIN_TYPES.FERTILE;
      } else {
        terrain[index] = TERRAIN_TYPES.GRASSLAND;
      }
    }
  }

  smoothSmallTerrainNoise(terrain, width, height);
  softenWaterEdges(terrain, width, height);

  return terrain;
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

function createNoiseMap(width, height, seed, scale, octaves, persistence) {
  const map = new Array(width * height);

  let min = Infinity;
  let max = -Infinity;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let amplitude = 1;
      let frequency = 1;
      let value = 0;
      let amplitudeTotal = 0;

      for (let octave = 0; octave < octaves; octave++) {
        const nx = (x / scale) * frequency;
        const ny = (y / scale) * frequency;

        value += valueNoise(nx, ny, seed + octave * 1013) * amplitude;
        amplitudeTotal += amplitude;

        amplitude *= persistence;
        frequency *= 2;
      }

      value /= amplitudeTotal;

      const index = y * width + x;
      map[index] = value;

      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  const range = Math.max(0.0001, max - min);

  for (let i = 0; i < map.length; i++) {
    map[i] = smoothStep((map[i] - min) / range);
  }

  return map;
}

function valueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const sx = smoothStep(x - x0);
  const sy = smoothStep(y - y0);

  const n00 = hash2D(x0, y0, seed);
  const n10 = hash2D(x1, y0, seed);
  const n01 = hash2D(x0, y1, seed);
  const n11 = hash2D(x1, y1, seed);

  const ix0 = lerp(n00, n10, sx);
  const ix1 = lerp(n01, n11, sx);

  return lerp(ix0, ix1, sy);
}

function hash2D(x, y, seed) {
  let value = x * 374761393 + y * 668265263 + seed * 1442695041;
  value = (value ^ (value >> 13)) * 1274126177;
  value = value ^ (value >> 16);

  return ((value >>> 0) % 10000) / 10000;
}

function addRivers(
  terrain,
  elevation,
  moisture,
  width,
  height,
  random,
  settings,
) {
  const riverCount = Math.round((settings.riverAmount ?? 0.55) * 3);

  for (let r = 0; r < riverCount; r++) {
    const vertical = random.chance(0.5);
    const riverWidth = random.range(0.8, 1.9 + settings.waterAmount * 8);
    const bendStrength = random.range(5, 15);
    const phaseA = random.range(0, Math.PI * 2);
    const phaseB = random.range(0, Math.PI * 2);

    if (vertical) {
      const startX = random.range(width * 0.18, width * 0.82);

      for (let y = 0; y < height; y++) {
        const progress = y / Math.max(1, height - 1);
        const centerX =
          startX +
          Math.sin(progress * Math.PI * 2 + phaseA) * bendStrength +
          Math.sin(progress * Math.PI * 5 + phaseB) * bendStrength * 0.35;

        carveRiverAt(
          terrain,
          elevation,
          moisture,
          width,
          height,
          centerX,
          y,
          riverWidth,
        );
      }
    } else {
      const startY = random.range(height * 0.18, height * 0.82);

      for (let x = 0; x < width; x++) {
        const progress = x / Math.max(1, width - 1);
        const centerY =
          startY +
          Math.sin(progress * Math.PI * 2 + phaseA) * bendStrength * 0.65 +
          Math.sin(progress * Math.PI * 5 + phaseB) * bendStrength * 0.24;

        carveRiverAt(
          terrain,
          elevation,
          moisture,
          width,
          height,
          x,
          centerY,
          riverWidth,
        );
      }
    }
  }
}

function carveRiverAt(
  terrain,
  elevation,
  moisture,
  width,
  height,
  centerX,
  centerY,
  radius,
) {
  const minX = Math.max(0, Math.floor(centerX - radius - 1));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radius + 1));
  const minY = Math.max(0, Math.floor(centerY - radius - 1));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radius + 1));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const index = y * width + x;

      const lowlandBonus = 1 - elevation[index];
      const wetnessBonus = moisture[index] * 0.35;
      const effectiveRadius = radius + lowlandBonus * 1.2 + wetnessBonus;

      if (distance <= effectiveRadius) {
        terrain[index] = TERRAIN_TYPES.WATER;
      }
    }
  }
}

function getEdgeOceanFactor(x, y, width, height, waterAmount) {
  if (waterAmount < 0.055) return 0;

  const distanceToEdge = Math.min(x, y, width - x - 1, height - y - 1);
  const coastDepth = 4 + waterAmount * 60;

  if (distanceToEdge > coastDepth) return 0;

  const coastStrength = 1 - distanceToEdge / coastDepth;

  return coastStrength * waterAmount * 2.4;
}

function smoothSmallTerrainNoise(terrain, width, height) {
  const copy = [...terrain];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      const current = copy[index];

      if (current === TERRAIN_TYPES.WATER) continue;

      const counts = countNeighborTypes(copy, width, height, x, y);
      const dominant = getDominantTerrain(counts);

      if (
        dominant.type !== current &&
        dominant.count >= 6 &&
        dominant.type !== TERRAIN_TYPES.WATER
      ) {
        terrain[index] = dominant.type;
      }
    }
  }
}

function softenWaterEdges(terrain, width, height) {
  const copy = [...terrain];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;

      if (copy[index] === TERRAIN_TYPES.WATER) continue;

      const nearWater = hasNearbyTerrain(
        copy,
        width,
        height,
        x,
        y,
        TERRAIN_TYPES.WATER,
        1,
      );

      if (nearWater && copy[index] === TERRAIN_TYPES.BARREN) {
        terrain[index] = TERRAIN_TYPES.GRASSLAND;
      }
    }
  }
}

function countNeighborTypes(terrain, width, height, x, y) {
  const counts = {
    grassland: 0,
    fertile: 0,
    barren: 0,
    forest: 0,
    water: 0,
  };

  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      if (ox === 0 && oy === 0) continue;

      const nx = x + ox;
      const ny = y + oy;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

      counts[terrain[ny * width + nx]] += 1;
    }
  }

  return counts;
}

function getDominantTerrain(counts) {
  let type = TERRAIN_TYPES.GRASSLAND;
  let count = 0;

  for (const [key, value] of Object.entries(counts)) {
    if (value > count) {
      type = key;
      count = value;
    }
  }

  return {
    type,
    count,
  };
}

function hasNearbyTerrain(terrain, width, height, x, y, type, radius) {
  for (let oy = -radius; oy <= radius; oy++) {
    for (let ox = -radius; ox <= radius; ox++) {
      const nx = x + ox;
      const ny = y + oy;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

      if (terrain[ny * width + nx] === type) {
        return true;
      }
    }
  }

  return false;
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}
