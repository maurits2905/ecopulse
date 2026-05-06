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

  if (!settings.terrainEnabled) {
    return Array(width * height).fill(TERRAIN_TYPES.GRASSLAND);
  }

  const seed = random.int(1, 999999);
  const biomeScale = settings.biomeScale ?? 28;

  const elevation = createDomainWarpedNoiseMap({
    width,
    height,
    seed: seed + 11,
    scale: biomeScale * 1.15,
    octaves: 5,
    persistence: 0.52,
    warpStrength: 0.72,
  });

  const moisture = createDomainWarpedNoiseMap({
    width,
    height,
    seed: seed + 29,
    scale: biomeScale * 0.92,
    octaves: 5,
    persistence: 0.56,
    warpStrength: 0.9,
  });

  const fertility = createDomainWarpedNoiseMap({
    width,
    height,
    seed: seed + 47,
    scale: biomeScale * 0.62,
    octaves: 4,
    persistence: 0.5,
    warpStrength: 0.55,
  });

  const terrain = Array(width * height).fill(TERRAIN_TYPES.GRASSLAND);

  applyCoastsAndLowlandWater({
    terrain,
    elevation,
    moisture,
    width,
    height,
    settings,
  });

  addLakes({
    terrain,
    elevation,
    moisture,
    width,
    height,
    random,
    settings,
  });

  addTerrainFollowingRivers({
    terrain,
    elevation,
    moisture,
    width,
    height,
    random,
    settings,
  });

  assignLandBiomes({
    terrain,
    elevation,
    moisture,
    fertility,
    width,
    height,
    settings,
  });

  smoothTerrainRegions(terrain, width, height, 3);
  protectWaterBodies(terrain, elevation, moisture, width, height);
  enrichWaterEdges(terrain, width, height);
  removeTinyIsolatedCells(terrain, width, height);

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

function applyCoastsAndLowlandWater({
  terrain,
  elevation,
  moisture,
  width,
  height,
  settings,
}) {
  const waterAmount = settings.waterAmount ?? 0.035;
  const baseWaterLevel = 0.16 + waterAmount * 1.25;
  const coastStrength = waterAmount < 0.045 ? 0.12 : waterAmount * 2.2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const edgeFactor = getEdgeFactor(x, y, width, height);
      const coastDrop = edgeFactor * coastStrength;
      const lowlandWater = elevation[index] - coastDrop < baseWaterLevel;
      const wetDepression =
        elevation[index] < baseWaterLevel + 0.045 && moisture[index] > 0.68;

      if (lowlandWater || wetDepression) {
        terrain[index] = TERRAIN_TYPES.WATER;
      }
    }
  }
}

function addLakes({
  terrain,
  elevation,
  moisture,
  width,
  height,
  random,
  settings,
}) {
  const lakeAttempts = Math.round(4 + (settings.waterAmount ?? 0.035) * 85);

  for (let i = 0; i < lakeAttempts; i++) {
    const x = random.int(4, width - 5);
    const y = random.int(4, height - 5);
    const index = y * width + x;

    const isGoodLakeSeed = elevation[index] < 0.42 && moisture[index] > 0.56;

    if (!isGoodLakeSeed) continue;

    const radius = random.range(
      2.2,
      6.5 + (settings.waterAmount ?? 0.035) * 22,
    );
    carveBlob(
      terrain,
      width,
      height,
      x,
      y,
      radius,
      TERRAIN_TYPES.WATER,
      random,
      0.55,
    );
  }
}

function addTerrainFollowingRivers({
  terrain,
  elevation,
  moisture,
  width,
  height,
  random,
  settings,
}) {
  const riverAmount = settings.riverAmount ?? 0.55;
  const riverCount = Math.max(0, Math.round(riverAmount * 4));

  for (let r = 0; r < riverCount; r++) {
    const start = findRiverStart(elevation, width, height, random);
    let x = start.x;
    let y = start.y;

    const riverWidth = random.range(0.75, 1.45 + riverAmount * 1.1);
    const maxSteps = width + height;

    for (let step = 0; step < maxSteps; step++) {
      carveRiverCell(
        terrain,
        elevation,
        moisture,
        width,
        height,
        x,
        y,
        riverWidth,
      );

      const next = findDownhillNeighbor(
        elevation,
        moisture,
        width,
        height,
        x,
        y,
        random,
      );

      if (!next) break;

      x = next.x;
      y = next.y;

      const index = y * width + x;
      const edgeDistance = Math.min(x, y, width - x - 1, height - y - 1);

      if (terrain[index] === TERRAIN_TYPES.WATER && step > 12) break;
      if (edgeDistance <= 1) break;
    }
  }
}

function findRiverStart(elevation, width, height, random) {
  let best = {
    x: random.int(2, width - 3),
    y: random.int(2, height - 3),
    value: 0,
  };

  for (let i = 0; i < 80; i++) {
    const x = random.int(2, width - 3);
    const y = random.int(2, height - 3);
    const value = elevation[y * width + x];

    if (value > best.value) {
      best = { x, y, value };
    }
  }

  return best;
}

function findDownhillNeighbor(
  elevation,
  moisture,
  width,
  height,
  x,
  y,
  random,
) {
  let best = null;
  let bestScore = Infinity;

  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      if (ox === 0 && oy === 0) continue;

      const nx = x + ox;
      const ny = y + oy;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

      const index = ny * width + nx;
      const edgePull = getEdgeFactor(nx, ny, width, height) * 0.18;
      const wetPull = moisture[index] * 0.055;
      const randomBend = random.range(0, 0.035);

      const score = elevation[index] - edgePull - wetPull + randomBend;

      if (score < bestScore) {
        bestScore = score;
        best = { x: nx, y: ny };
      }
    }
  }

  return best;
}

function carveRiverCell(
  terrain,
  elevation,
  moisture,
  width,
  height,
  x,
  y,
  radius,
) {
  const lowlandBonus = (1 - elevation[y * width + x]) * 0.85;
  const wetBonus = moisture[y * width + x] * 0.45;
  const effectiveRadius = radius + lowlandBonus + wetBonus;

  const minX = Math.max(0, Math.floor(x - effectiveRadius));
  const maxX = Math.min(width - 1, Math.ceil(x + effectiveRadius));
  const minY = Math.max(0, Math.floor(y - effectiveRadius));
  const maxY = Math.min(height - 1, Math.ceil(y + effectiveRadius));

  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      const dx = cx - x;
      const dy = cy - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= effectiveRadius) {
        terrain[cy * width + cx] = TERRAIN_TYPES.WATER;
      }
    }
  }
}

function assignLandBiomes({
  terrain,
  elevation,
  moisture,
  fertility,
  width,
  height,
  settings,
}) {
  const forestAmount = settings.forestAmount ?? 0.11;
  const barrenAmount = settings.barrenAmount ?? 0.08;
  const fertileAmount = settings.fertileAmount ?? 0.09;

  const forestThreshold = 0.68 - forestAmount * 0.9;
  const barrenThreshold = 0.76 - barrenAmount * 0.95;
  const fertileThreshold = 0.72 - fertileAmount * 0.95;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;

      if (terrain[index] === TERRAIN_TYPES.WATER) continue;

      const nearWater = hasNearbyTerrain(
        terrain,
        width,
        height,
        x,
        y,
        TERRAIN_TYPES.WATER,
        3,
      );
      const veryNearWater = hasNearbyTerrain(
        terrain,
        width,
        height,
        x,
        y,
        TERRAIN_TYPES.WATER,
        1,
      );

      const e = elevation[index];
      const m = moisture[index];
      const f = fertility[index];

      const forestScore = m * 0.68 + f * 0.22 + (e > 0.28 ? 0.08 : 0);
      const fertileScore = f * 0.52 + m * 0.25 + (nearWater ? 0.26 : 0);
      const barrenScore =
        (1 - m) * 0.72 + (1 - f) * 0.18 + (e > 0.72 ? 0.06 : 0);

      if (veryNearWater && fertileScore > fertileThreshold - 0.12) {
        terrain[index] = TERRAIN_TYPES.FERTILE;
      } else if (forestScore > forestThreshold && !veryNearWater) {
        terrain[index] = TERRAIN_TYPES.FOREST;
      } else if (barrenScore > barrenThreshold && !nearWater) {
        terrain[index] = TERRAIN_TYPES.BARREN;
      } else if (fertileScore > fertileThreshold) {
        terrain[index] = TERRAIN_TYPES.FERTILE;
      } else {
        terrain[index] = TERRAIN_TYPES.GRASSLAND;
      }
    }
  }
}

function smoothTerrainRegions(terrain, width, height, passes = 2) {
  for (let pass = 0; pass < passes; pass++) {
    const copy = [...terrain];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const current = copy[index];
        const counts = countNeighborTypes(copy, width, height, x, y);
        const dominant = getDominantTerrain(counts);

        if (current === TERRAIN_TYPES.WATER) {
          if (counts.water <= 2 && dominant.type !== TERRAIN_TYPES.WATER) {
            terrain[index] = dominant.type;
          }
          continue;
        }

        if (dominant.type !== current && dominant.count >= 5) {
          terrain[index] = dominant.type;
        }
      }
    }
  }
}

function protectWaterBodies(terrain, elevation, moisture, width, height) {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;

      if (terrain[index] !== TERRAIN_TYPES.WATER) continue;

      const counts = countNeighborTypes(terrain, width, height, x, y);
      const wetLowland = elevation[index] < 0.32 || moisture[index] > 0.72;

      if (counts.water <= 1 && !wetLowland) {
        terrain[index] = TERRAIN_TYPES.FERTILE;
      }
    }
  }
}

function enrichWaterEdges(terrain, width, height) {
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

      if (!nearWater) continue;

      if (copy[index] === TERRAIN_TYPES.BARREN) {
        terrain[index] = TERRAIN_TYPES.GRASSLAND;
      }

      if (copy[index] === TERRAIN_TYPES.GRASSLAND) {
        terrain[index] = TERRAIN_TYPES.FERTILE;
      }
    }
  }
}

function removeTinyIsolatedCells(terrain, width, height) {
  const copy = [...terrain];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      const current = copy[index];
      const counts = countNeighborTypes(copy, width, height, x, y);

      if ((counts[current] ?? 0) <= 1) {
        const dominant = getDominantTerrain(counts);
        terrain[index] = dominant.type;
      }
    }
  }
}

function carveBlob(
  terrain,
  width,
  height,
  centerX,
  centerY,
  radius,
  type,
  random,
  roughness = 0.5,
) {
  const minX = Math.max(0, Math.floor(centerX - radius - 2));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radius + 2));
  const minY = Math.max(0, Math.floor(centerY - radius - 2));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radius + 2));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const edgeNoise = random.range(-roughness, roughness);

      if (distance <= radius + edgeNoise) {
        terrain[y * width + x] = type;
      }
    }
  }
}

function createDomainWarpedNoiseMap({
  width,
  height,
  seed,
  scale,
  octaves,
  persistence,
  warpStrength,
}) {
  const warpX = createNoiseMap(
    width,
    height,
    seed + 501,
    scale * 1.8,
    3,
    0.55,
    false,
  );
  const warpY = createNoiseMap(
    width,
    height,
    seed + 907,
    scale * 1.8,
    3,
    0.55,
    false,
  );

  const map = new Array(width * height);
  let min = Infinity;
  let max = -Infinity;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;

      const wx = (warpX[index] - 0.5) * warpStrength * scale;
      const wy = (warpY[index] - 0.5) * warpStrength * scale;

      const value = fractalNoise(
        (x + wx) / scale,
        (y + wy) / scale,
        seed,
        octaves,
        persistence,
      );

      map[index] = value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  normalizeMap(map, min, max, true);

  return map;
}

function createNoiseMap(
  width,
  height,
  seed,
  scale,
  octaves,
  persistence,
  smooth = true,
) {
  const map = new Array(width * height);
  let min = Infinity;
  let max = -Infinity;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = fractalNoise(
        x / scale,
        y / scale,
        seed,
        octaves,
        persistence,
      );
      const index = y * width + x;

      map[index] = value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  normalizeMap(map, min, max, smooth);

  return map;
}

function fractalNoise(x, y, seed, octaves, persistence) {
  let amplitude = 1;
  let frequency = 1;
  let value = 0;
  let amplitudeTotal = 0;

  for (let octave = 0; octave < octaves; octave++) {
    value +=
      valueNoise(x * frequency, y * frequency, seed + octave * 1013) *
      amplitude;
    amplitudeTotal += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return value / amplitudeTotal;
}

function normalizeMap(map, min, max, smooth) {
  const range = Math.max(0.0001, max - min);

  for (let i = 0; i < map.length; i++) {
    const normalized = (map[i] - min) / range;
    map[i] = smooth ? smoothStep(normalized) : normalized;
  }
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

  return { type, count };
}

function hasNearbyTerrain(terrain, width, height, x, y, type, radius) {
  for (let oy = -radius; oy <= radius; oy++) {
    for (let ox = -radius; ox <= radius; ox++) {
      const nx = x + ox;
      const ny = y + oy;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

      if (terrain[ny * width + nx] === type) return true;
    }
  }

  return false;
}

function getEdgeFactor(x, y, width, height) {
  const distanceToEdge = Math.min(x, y, width - x - 1, height - y - 1);
  const coastDepth = Math.min(width, height) * 0.16;

  if (distanceToEdge > coastDepth) return 0;

  const value = 1 - distanceToEdge / coastDepth;
  return value * value;
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}
