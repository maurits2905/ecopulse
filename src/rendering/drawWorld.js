import { getSeasonVisualBlend } from "../simulation/seasons";

export function drawWorld(canvas, world) {
  if (!canvas || !world) return;

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  const width = Math.floor(rect.width * dpr);
  const height = Math.floor(rect.height * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const viewWidth = rect.width;
  const viewHeight = rect.height;

  ctx.clearRect(0, 0, viewWidth, viewHeight);
  ctx.fillStyle = "#07100d";
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  const cellWidth = viewWidth / world.width;
  const cellHeight = viewHeight / world.height;
  const seasonVisual = getSeasonVisualBlend(world);

  drawSeasonBackground(ctx, seasonVisual, viewWidth, viewHeight);
  drawSmoothTerrain(ctx, world, seasonVisual, viewWidth, viewHeight);

  if (world.settings.renderDetail !== "performance") {
    drawWaterEdges(ctx, world, cellWidth, cellHeight);
    drawTerrainDetails(ctx, world, cellWidth, cellHeight);
  }

  drawSeasonAtmosphere(ctx, world, seasonVisual, viewWidth, viewHeight);
  drawCivilizationInfluence(ctx, world, cellWidth, cellHeight);
  drawBridges(ctx, world, cellWidth, cellHeight);
  drawSettlement(ctx, world, cellWidth, cellHeight);
  drawAgents(ctx, world, cellWidth, cellHeight);
  drawHumans(ctx, world, cellWidth, cellHeight);

  if (world.settings.showGrid) {
    drawGrid(ctx, world, cellWidth, cellHeight, viewWidth, viewHeight);
  }

  drawVignette(ctx, viewWidth, viewHeight);
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function clampColor(value) {
  return Math.max(0, Math.min(255, Math.floor(value)));
}

function blendedTone(seasonVisual) {
  const { current, next, blend } = seasonVisual;

  return {
    red: lerp(current.tone.red, next.tone.red, blend),
    green: lerp(current.tone.green, next.tone.green, blend),
    blue: lerp(current.tone.blue, next.tone.blue, blend),
  };
}

function drawSeasonBackground(ctx, seasonVisual, width, height) {
  const tone = blendedTone(seasonVisual);

  const gradient = ctx.createRadialGradient(
    width * 0.72,
    height * 0.18,
    0,
    width * 0.72,
    height * 0.18,
    width * 0.9,
  );

  gradient.addColorStop(
    0,
    `rgba(${tone.red}, ${tone.green}, ${tone.blue}, 0.075)`,
  );
  gradient.addColorStop(1, "rgba(7, 16, 13, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawSmoothTerrain(ctx, world, seasonVisual, width, height) {
  const offscreen = document.createElement("canvas");
  offscreen.width = world.width;
  offscreen.height = world.height;

  const offCtx = offscreen.getContext("2d");
  const imageData = offCtx.createImageData(world.width, world.height);
  const pixels = imageData.data;

  const maxGrass = world.settings.grassMax;
  const tone = blendedTone(seasonVisual);

  const seasonalRedShift = (tone.red - 120) * 0.09;
  const seasonalGreenShift = (tone.green - 180) * 0.08;
  const seasonalBlueShift = (tone.blue - 120) * 0.12;

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const index = y * world.width + x;
      const cell = world.cells[index];
      const amount = cell.grass / maxGrass;
      const terrain = cell.terrain ?? "grassland";

      const color = getTerrainColor({
        terrain,
        grassAmount: amount,
        fertility: cell.fertility,
        seasonalRedShift,
        seasonalGreenShift,
        seasonalBlueShift,
      });

      const pixelIndex = index * 4;
      pixels[pixelIndex] = color.red;
      pixels[pixelIndex + 1] = color.green;
      pixels[pixelIndex + 2] = color.blue;
      pixels[pixelIndex + 3] = 255;
    }
  }

  offCtx.putImageData(imageData, 0, 0);

  ctx.save();

  ctx.imageSmoothingEnabled = world.settings.renderDetail !== "performance";
  ctx.imageSmoothingQuality =
    world.settings.renderDetail === "detailed" ? "high" : "medium";

  ctx.drawImage(offscreen, 0, 0, width, height);

  ctx.restore();
}

function getTerrainColor({
  terrain,
  grassAmount,
  fertility,
  seasonalRedShift,
  seasonalGreenShift,
  seasonalBlueShift,
}) {
  let red = 9;
  let green = 42 + grassAmount * 130;
  let blue = 35 + grassAmount * 38;

  if (terrain === "grassland") {
    red += fertility * 2;
    green += fertility * 6;
  }

  if (terrain === "fertile") {
    red += 4;
    green += 46;
    blue += 8;
  }

  if (terrain === "forest") {
    red -= 4;
    green += 20;
    blue -= 10;
  }

  if (terrain === "barren") {
    red += 62;
    green -= 20;
    blue -= 18;
  }

  if (terrain === "water") {
    return {
      red: 12,
      green: 58,
      blue: 92,
    };
  }

  red += seasonalRedShift;
  green += seasonalGreenShift;
  blue += seasonalBlueShift;

  return {
    red: clampColor(red),
    green: clampColor(green),
    blue: clampColor(blue),
  };
}

function drawWaterEdges(ctx, world, cellWidth, cellHeight) {
  ctx.save();

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const cell = world.cells[y * world.width + x];

      if ((cell.terrain ?? "grassland") !== "water") continue;

      const edgeScore = getLandNeighborScore(world, x, y);

      if (edgeScore === 0) continue;

      const px = x * cellWidth;
      const py = y * cellHeight;

      ctx.fillStyle = `rgba(130, 220, 255, ${0.04 + edgeScore * 0.025})`;
      ctx.fillRect(px, py, cellWidth + 1, cellHeight + 1);
    }
  }

  ctx.restore();
}

function getLandNeighborScore(world, x, y) {
  let score = 0;

  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      if (ox === 0 && oy === 0) continue;

      const nx = x + ox;
      const ny = y + oy;

      if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;

      const neighbor = world.cells[ny * world.width + nx];

      if ((neighbor.terrain ?? "grassland") !== "water") {
        score += 1;
      }
    }
  }

  return score;
}

function drawTerrainDetails(ctx, world, cellWidth, cellHeight) {
  const detail = world.settings.renderDetail;
  const skip = detail === "detailed" ? 1 : 2;

  if (cellWidth < 3 || cellHeight < 3) return;

  ctx.save();

  for (let y = 0; y < world.height; y += skip) {
    for (let x = 0; x < world.width; x += skip) {
      const cell = world.cells[y * world.width + x];
      const terrain = cell.terrain ?? "grassland";
      const seed = pseudoRandom(x, y);

      if (terrain === "forest") {
        drawForestDetail(ctx, x, y, cellWidth, cellHeight, seed, detail);
      }

      if (terrain === "fertile" && seed > 0.64) {
        drawFertileDetail(ctx, x, y, cellWidth, cellHeight, seed);
      }

      if (terrain === "barren" && seed > 0.68) {
        drawBarrenDetail(ctx, x, y, cellWidth, cellHeight, seed);
      }

      if (terrain === "water" && seed > 0.58) {
        drawWaterRipple(ctx, x, y, cellWidth, cellHeight, seed);
      }
    }
  }

  ctx.restore();
}

function drawForestDetail(ctx, x, y, cellWidth, cellHeight, seed, detail) {
  if (seed < 0.42 && detail !== "detailed") return;

  const px = x * cellWidth + cellWidth * (0.28 + seed * 0.42);
  const py = y * cellHeight + cellHeight * (0.24 + (1 - seed) * 0.46);
  const size = Math.max(
    1.4,
    Math.min(cellWidth, cellHeight) * (0.18 + seed * 0.08),
  );

  ctx.beginPath();
  ctx.fillStyle = "rgba(15, 70, 34, 0.72)";
  ctx.arc(px, py, size * 1.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(72, 155, 78, 0.5)";
  ctx.arc(px + size * 0.55, py - size * 0.35, size * 0.78, 0, Math.PI * 2);
  ctx.fill();

  if (detail === "detailed") {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(8, 30, 16, 0.55)";
    ctx.lineWidth = 1;
    ctx.moveTo(px, py + size * 1.2);
    ctx.lineTo(px, py + size * 2.2);
    ctx.stroke();
  }
}

function drawFertileDetail(ctx, x, y, cellWidth, cellHeight, seed) {
  const px = x * cellWidth + cellWidth * seed;
  const py = y * cellHeight + cellHeight * (1 - seed);
  const size = Math.max(1, Math.min(cellWidth, cellHeight) * 0.14);

  ctx.beginPath();
  ctx.fillStyle = "rgba(155, 255, 145, 0.28)";
  ctx.arc(px, py, size, 0, Math.PI * 2);
  ctx.fill();
}

function drawBarrenDetail(ctx, x, y, cellWidth, cellHeight, seed) {
  const px = x * cellWidth + cellWidth * seed;
  const py = y * cellHeight + cellHeight * (0.3 + seed * 0.4);
  const size = Math.max(0.8, Math.min(cellWidth, cellHeight) * 0.12);

  ctx.beginPath();
  ctx.fillStyle = "rgba(130, 96, 58, 0.38)";
  ctx.arc(px, py, size, 0, Math.PI * 2);
  ctx.fill();
}

function drawWaterRipple(ctx, x, y, cellWidth, cellHeight, seed) {
  const px = x * cellWidth;
  const py = y * cellHeight + cellHeight * (0.35 + seed * 0.3);

  ctx.beginPath();
  ctx.strokeStyle = "rgba(140, 220, 255, 0.16)";
  ctx.lineWidth = 1;
  ctx.moveTo(px + cellWidth * 0.16, py);
  ctx.quadraticCurveTo(
    px + cellWidth * 0.5,
    py - cellHeight * 0.12,
    px + cellWidth * 0.84,
    py,
  );
  ctx.stroke();
}

function drawAgents(ctx, world, cellWidth, cellHeight) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  drawPrey(ctx, world, cellWidth, cellHeight);
  drawPredators(ctx, world, cellWidth, cellHeight);

  ctx.restore();
}

function drawPrey(ctx, world, cellWidth, cellHeight) {
  for (const prey of world.prey) {
    const energyRatio = Math.min(
      1,
      prey.energy / prey.traits.reproductionEnergy,
    );
    const cautionRatio = Math.min(1, prey.traits.caution / 1.8);

    const x = prey.x * cellWidth;
    const y = prey.y * cellHeight;

    const baseSize = Math.max(3.4, Math.min(cellWidth, cellHeight) * 0.48);
    const radius = baseSize + energyRatio * 1.1;

    ctx.save();

    ctx.shadowColor = "rgba(220, 255, 235, 0.85)";
    ctx.shadowBlur = world.settings.renderDetail === "performance" ? 0 : 7;

    ctx.beginPath();
    ctx.fillStyle = `rgba(235, 255, ${Math.floor(225 + cautionRatio * 30)}, 1)`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
    ctx.lineWidth = 1.8;
    ctx.arc(x, y, radius + 0.8, 0, Math.PI * 2);
    ctx.stroke();

    if (world.settings.renderDetail === "detailed") {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.62)";
      ctx.lineWidth = 1;
      ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (prey.generation > 4 && world.settings.renderDetail !== "performance") {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.42)";
      ctx.lineWidth = 1;
      ctx.arc(x, y, radius + 3.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawPredators(ctx, world, cellWidth, cellHeight) {
  for (const predator of world.predators) {
    const energyRatio = Math.min(
      1,
      predator.energy / predator.traits.reproductionEnergy,
    );
    const aggressionRatio = Math.min(1, predator.traits.aggression / 2);

    const x = predator.x * cellWidth;
    const y = predator.y * cellHeight;

    const baseSize = Math.max(5.2, Math.min(cellWidth, cellHeight) * 0.68);
    const size = baseSize + energyRatio * 1.8;

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(((predator.id * 37) % 360) * (Math.PI / 180));

    ctx.shadowColor = "rgba(255, 76, 76, 0.9)";
    ctx.shadowBlur = world.settings.renderDetail === "performance" ? 0 : 9;

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.86, size * 0.72);
    ctx.lineTo(-size * 0.86, size * 0.72);
    ctx.closePath();

    ctx.fillStyle = `rgba(255, ${Math.floor(98 - aggressionRatio * 28)}, ${Math.floor(
      70 - aggressionRatio * 20,
    )}, 1)`;
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(0, 0, 0, 0.96)";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (world.settings.renderDetail === "detailed") {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.5, size * 0.18), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 235, 205, 0.95)";
      ctx.fill();
    }

    if (
      predator.generation > 4 &&
      world.settings.renderDetail !== "performance"
    ) {
      ctx.beginPath();
      ctx.arc(0, 0, size + 3.4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,180,130,0.42)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawSeasonAtmosphere(ctx, world, seasonVisual, width, height) {
  const tone = blendedTone(seasonVisual);

  ctx.save();

  ctx.fillStyle = `rgba(${tone.red}, ${tone.green}, ${tone.blue}, 0.028)`;
  ctx.fillRect(0, 0, width, height);

  const currentWinterWeight =
    seasonVisual.current.key === "winter" ? 1 - seasonVisual.blend : 0;
  const nextWinterWeight =
    seasonVisual.next.key === "winter" ? seasonVisual.blend : 0;
  const winterWeight = Math.max(currentWinterWeight, nextWinterWeight);

  if (winterWeight > 0.01 && world.settings.renderDetail !== "performance") {
    ctx.globalAlpha = 0.1 * winterWeight;
    ctx.fillStyle = "#dbeeff";

    for (let i = 0; i < 55; i++) {
      const x = (i * 97 + world.tick * 0.12) % width;
      const y = (i * 53 + world.tick * 0.26) % height;

      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawGrid(ctx, world, cellWidth, cellHeight, width, height) {
  if (world.width > 130 || world.height > 90) return;

  ctx.save();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= world.width; x++) {
    const px = x * cellWidth;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  }

  for (let y = 0; y <= world.height; y++) {
    const py = y * cellHeight;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
  }

  ctx.restore();
}

function drawVignette(ctx, width, height) {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.1,
    width / 2,
    height / 2,
    width * 0.72,
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.34)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function pseudoRandom(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function drawSettlement(ctx, world, cellWidth, cellHeight) {
  const civ = world.civilization;

  if (!civ?.enabled) return;

  const x = civ.settlementX * cellWidth;
  const y = civ.settlementY * cellHeight;
  const size = Math.max(
    7,
    Math.min(cellWidth, cellHeight) * 1.6 + civ.huts * 0.45,
  );

  ctx.save();

  ctx.shadowColor = "rgba(255, 210, 130, 0.7)";
  ctx.shadowBlur = world.settings.renderDetail === "performance" ? 0 : 12;

  for (let i = 0; i < civ.huts; i++) {
    const angle = (i / Math.max(1, civ.huts)) * Math.PI * 2 + i * 0.22;
    const hx = x + Math.cos(angle) * size * 0.95;
    const hy = y + Math.sin(angle) * size * 0.7;
    const hutSize = Math.max(4, size * 0.38);

    ctx.beginPath();
    ctx.moveTo(hx, hy - hutSize);
    ctx.lineTo(hx + hutSize, hy);
    ctx.lineTo(hx + hutSize * 0.72, hy + hutSize);
    ctx.lineTo(hx - hutSize * 0.72, hy + hutSize);
    ctx.lineTo(hx - hutSize, hy);
    ctx.closePath();

    ctx.fillStyle = "rgba(168, 112, 62, 0.96)";
    ctx.strokeStyle = "rgba(20, 10, 4, 0.95)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hx - hutSize, hy);
    ctx.lineTo(hx, hy - hutSize * 1.08);
    ctx.lineTo(hx + hutSize, hy);
    ctx.closePath();
    ctx.fillStyle = "rgba(118, 72, 38, 0.96)";
    ctx.fill();
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(x, y, Math.max(3.5, size * 0.25), 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 226, 150, 0.95)";
  ctx.strokeStyle = "rgba(20, 10, 4, 0.95)";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawHumans(ctx, world, cellWidth, cellHeight) {
  if (!world.civilization?.enabled || !world.humans?.length) return;

  ctx.save();

  for (const human of world.humans) {
    const x = human.x * cellWidth;
    const y = human.y * cellHeight;
    const radius = Math.max(3.2, Math.min(cellWidth, cellHeight) * 0.36);

    ctx.beginPath();
    ctx.shadowColor = "rgba(255, 220, 150, 0.75)";
    ctx.shadowBlur = world.settings.renderDetail === "performance" ? 0 : 7;
    ctx.fillStyle = "rgba(255, 210, 135, 0.98)";
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(35, 18, 5, 0.95)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    if (world.settings.renderDetail === "detailed") {
      ctx.beginPath();
      ctx.fillStyle = "rgba(70, 38, 12, 0.85)";
      ctx.arc(x, y - radius * 0.25, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawCivilizationInfluence(ctx, world, cellWidth, cellHeight) {
  const civ = world.civilization;

  if (!civ?.enabled) return;

  const x = civ.settlementX * cellWidth;
  const y = civ.settlementY * cellHeight;
  const radius =
    (world.settings.humanSettlementImpactRadius + civ.huts * 0.28) *
    Math.max(cellWidth, cellHeight);

  ctx.save();

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

  gradient.addColorStop(0, `rgba(255, 205, 120, ${0.12 + civ.stress * 0.08})`);
  gradient.addColorStop(0.45, "rgba(255, 205, 120, 0.045)");
  gradient.addColorStop(1, "rgba(255, 205, 120, 0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (world.settings.renderDetail !== "performance") {
    drawSettlementPaths(ctx, world, cellWidth, cellHeight);
  }

  ctx.restore();
}

function drawSettlementPaths(ctx, world, cellWidth, cellHeight) {
  const civ = world.civilization;
  const x = civ.settlementX * cellWidth;
  const y = civ.settlementY * cellHeight;

  ctx.save();

  ctx.strokeStyle = "rgba(190, 140, 78, 0.22)";
  ctx.lineWidth = Math.max(1.2, Math.min(cellWidth, cellHeight) * 0.18);
  ctx.lineCap = "round";

  const pathCount = Math.min(8, Math.max(3, civ.huts + 2));

  for (let i = 0; i < pathCount; i++) {
    const angle = (i / pathCount) * Math.PI * 2 + Math.sin(i * 91.7) * 0.25;
    const length =
      (world.settings.humanSettlementImpactRadius + civ.huts * 0.55) *
      Math.max(cellWidth, cellHeight) *
      (0.55 + (i % 3) * 0.18);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle + 0.35) * length * 0.45,
      y + Math.sin(angle + 0.35) * length * 0.45,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length,
    );
    ctx.stroke();
  }

  ctx.restore();
}

function drawBridges(ctx, world, cellWidth, cellHeight) {
  const bridges = world.infrastructure?.bridges ?? [];

  if (!bridges.length) return;

  ctx.save();

  for (const bridge of bridges) {
    for (const cell of bridge.cells) {
      const x = cell.x * cellWidth;
      const y = cell.y * cellHeight;

      ctx.fillStyle = "rgba(154, 103, 55, 0.96)";
      ctx.strokeStyle = "rgba(42, 24, 10, 0.95)";
      ctx.lineWidth = Math.max(1, Math.min(cellWidth, cellHeight) * 0.13);

      if (bridge.orientation === "horizontal") {
        ctx.fillRect(
          x - 1,
          y + cellHeight * 0.25,
          cellWidth + 2,
          cellHeight * 0.5,
        );
        ctx.strokeRect(
          x - 1,
          y + cellHeight * 0.25,
          cellWidth + 2,
          cellHeight * 0.5,
        );

        if (world.settings.renderDetail !== "performance") {
          ctx.strokeStyle = "rgba(245, 190, 120, 0.42)";
          ctx.beginPath();
          ctx.moveTo(x, y + cellHeight * 0.42);
          ctx.lineTo(x + cellWidth, y + cellHeight * 0.42);
          ctx.moveTo(x, y + cellHeight * 0.62);
          ctx.lineTo(x + cellWidth, y + cellHeight * 0.62);
          ctx.stroke();
        }
      } else {
        ctx.fillRect(
          x + cellWidth * 0.25,
          y - 1,
          cellWidth * 0.5,
          cellHeight + 2,
        );
        ctx.strokeRect(
          x + cellWidth * 0.25,
          y - 1,
          cellWidth * 0.5,
          cellHeight + 2,
        );

        if (world.settings.renderDetail !== "performance") {
          ctx.strokeStyle = "rgba(245, 190, 120, 0.42)";
          ctx.beginPath();
          ctx.moveTo(x + cellWidth * 0.42, y);
          ctx.lineTo(x + cellWidth * 0.42, y + cellHeight);
          ctx.moveTo(x + cellWidth * 0.62, y);
          ctx.lineTo(x + cellWidth * 0.62, y + cellHeight);
          ctx.stroke();
        }
      }
    }
  }

  ctx.restore();
}
