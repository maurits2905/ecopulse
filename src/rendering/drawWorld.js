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

  drawGrass(ctx, world, cellWidth, cellHeight);
  drawAgents(ctx, world, cellWidth, cellHeight);
  drawVignette(ctx, viewWidth, viewHeight);
}

function drawGrass(ctx, world, cellWidth, cellHeight) {
  const maxGrass = world.settings.grassMax;

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const cell = world.cells[y * world.width + x];
      const amount = cell.grass / maxGrass;
      const fertilityGlow = Math.min(1, cell.fertility / 1.35);

      const green = Math.floor(35 + amount * 145);
      const alpha = 0.26 + amount * 0.72;

      ctx.fillStyle = `rgba(${Math.floor(8 + fertilityGlow * 16)}, ${green}, ${Math.floor(
        34 + amount * 40,
      )}, ${alpha})`;

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
  for (const prey of world.prey) {
    const energyRatio = Math.min(
      1,
      prey.energy / world.settings.preyReproductionEnergy,
    );
    const x = prey.x * cellWidth;
    const y = prey.y * cellHeight;
    const radius = 1.8 + energyRatio * 1.2;

    ctx.beginPath();
    ctx.fillStyle = `rgba(215, 252, 232, ${0.55 + energyRatio * 0.42})`;
    ctx.shadowColor = "rgba(166, 255, 207, 0.45)";
    ctx.shadowBlur = 6;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const predator of world.predators) {
    const energyRatio = Math.min(
      1,
      predator.energy / world.settings.predatorReproductionEnergy,
    );
    const x = predator.x * cellWidth;
    const y = predator.y * cellHeight;
    const radius = 2.8 + energyRatio * 1.8;

    ctx.beginPath();
    ctx.fillStyle = `rgba(255, ${Math.floor(86 + energyRatio * 70)}, 88, ${
      0.62 + energyRatio * 0.35
    })`;
    ctx.shadowColor = "rgba(255, 80, 80, 0.55)";
    ctx.shadowBlur = 9;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
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
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.42)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
