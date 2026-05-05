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
  drawGrass(ctx, world, seasonVisual, cellWidth, cellHeight);
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

function drawGrass(ctx, world, seasonVisual, cellWidth, cellHeight) {
  const maxGrass = world.settings.grassMax;
  const tone = blendedTone(seasonVisual);

  const seasonalRedShift = (tone.red - 120) * 0.09;
  const seasonalGreenShift = (tone.green - 180) * 0.08;
  const seasonalBlueShift = (tone.blue - 120) * 0.12;

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const cell = world.cells[y * world.width + x];
      const amount = cell.grass / maxGrass;
      const fertilityGlow = Math.min(1, cell.fertility / 1.35);

      const red = Math.max(
        0,
        Math.min(255, Math.floor(8 + fertilityGlow * 16 + seasonalRedShift)),
      );
      const green = Math.max(
        0,
        Math.min(255, Math.floor(35 + amount * 145 + seasonalGreenShift)),
      );
      const blue = Math.max(
        0,
        Math.min(255, Math.floor(34 + amount * 40 + seasonalBlueShift)),
      );

      const alpha = 0.3 + amount * 0.68;

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

    const baseSize = Math.max(4.4, Math.min(cellWidth, cellHeight) * 0.52);
    const radius = baseSize + energyRatio * 1.2;

    ctx.save();

    ctx.shadowColor = "rgba(220, 255, 235, 0.9)";
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.fillStyle = `rgba(235, 255, ${Math.floor(225 + cautionRatio * 30)}, 1)`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
    ctx.lineWidth = 2;
    ctx.arc(x, y, radius + 0.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.62)";
    ctx.lineWidth = 1;
    ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
    ctx.stroke();

    if (prey.generation > 4) {
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

    const baseSize = Math.max(6.2, Math.min(cellWidth, cellHeight) * 0.74);
    const size = baseSize + energyRatio * 2;

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(((predator.id * 37) % 360) * (Math.PI / 180));

    ctx.shadowColor = "rgba(255, 76, 76, 0.95)";
    ctx.shadowBlur = 10;

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
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.5, size * 0.18), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 235, 205, 0.95)";
    ctx.fill();

    if (predator.generation > 4) {
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

  if (winterWeight > 0.01) {
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
