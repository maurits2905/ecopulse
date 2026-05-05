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
  drawTerrainAndGrass(ctx, world, seasonVisual, cellWidth, cellHeight);

  if (world.settings.renderDetail !== "performance") {
    drawVegetationDetails(ctx, world, cellWidth, cellHeight);
  }

  drawSeasonAtmosphere(ctx, world, seasonVisual, viewWidth, viewHeight);
  drawAgents(ctx, world, cellWidth, cellHeight);
  drawVignette(ctx, viewWidth, viewHeight);
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
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

function drawTerrainAndGrass(ctx, world, seasonVisual, cellWidth, cellHeight) {
  const maxGrass = world.settings.grassMax;
  const tone = blendedTone(seasonVisual);

  const seasonalRedShift = (tone.red - 120) * 0.09;
  const seasonalGreenShift = (tone.green - 180) * 0.08;
  const seasonalBlueShift = (tone.blue - 120) * 0.12;

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const cell = world.cells[y * world.width + x];
      const amount = cell.grass / maxGrass;
      const terrain = cell.terrain ?? "grassland";

      let red = 8;
      let green = 35 + amount * 145;
      let blue = 34 + amount * 40;
      let alpha = 0.3 + amount * 0.68;

      if (terrain === "fertile") {
        red += 5;
        green += 34;
        blue += 7;
      }

      if (terrain === "forest") {
        red -= 2;
        green += 16;
        blue -= 8;
        alpha += 0.04;
      }

      if (terrain === "barren") {
        red += 54;
        green -= 18;
        blue -= 14;
        alpha = 0.48 + amount * 0.36;
      }

      if (terrain === "water") {
        red = 12;
        green = 52;
        blue = 78;
        alpha = 0.92;
      } else {
        red += seasonalRedShift;
        green += seasonalGreenShift;
        blue += seasonalBlueShift;
      }

      red = Math.max(0, Math.min(255, Math.floor(red)));
      green = Math.max(0, Math.min(255, Math.floor(green)));
      blue = Math.max(0, Math.min(255, Math.floor(blue)));

      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

      ctx.fillRect(
        x * cellWidth,
        y * cellHeight,
        Math.ceil(cellWidth) + 0.5,
        Math.ceil(cellHeight) + 0.5,
      );
    }
  }
}

function drawVegetationDetails(ctx, world, cellWidth, cellHeight) {
  if (cellWidth < 5 || cellHeight < 5) return;

  const detail = world.settings.renderDetail;
  const skip = detail === "detailed" ? 1 : 2;

  ctx.save();

  for (let y = 0; y < world.height; y += skip) {
    for (let x = 0; x < world.width; x += skip) {
      const cell = world.cells[y * world.width + x];
      const terrain = cell.terrain ?? "grassland";

      if (terrain !== "forest" && terrain !== "water" && terrain !== "fertile")
        continue;

      const centerX = x * cellWidth + cellWidth * 0.5;
      const centerY = y * cellHeight + cellHeight * 0.5;
      const seed = (x * 17 + y * 31) % 10;

      if (terrain === "forest" && seed < 4) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(20, 78, 42, 0.78)";
        ctx.arc(
          centerX,
          centerY,
          Math.max(1.3, Math.min(cellWidth, cellHeight) * 0.22),
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "rgba(75, 155, 82, 0.52)";
        ctx.arc(
          centerX + cellWidth * 0.12,
          centerY - cellHeight * 0.08,
          Math.max(1, Math.min(cellWidth, cellHeight) * 0.13),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      if (terrain === "fertile" && seed < 2) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(140, 255, 150, 0.35)";
        ctx.arc(
          centerX,
          centerY,
          Math.max(1, Math.min(cellWidth, cellHeight) * 0.12),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      if (terrain === "water" && seed < 3) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(120, 210, 255, 0.18)";
        ctx.lineWidth = 1;
        ctx.moveTo(x * cellWidth + cellWidth * 0.18, centerY);
        ctx.lineTo(
          x * cellWidth + cellWidth * 0.82,
          centerY + Math.sin(seed) * 1.5,
        );
        ctx.stroke();
      }
    }
  }

  ctx.restore();
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
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.36)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
