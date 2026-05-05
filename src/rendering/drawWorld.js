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

  drawSeasonBackground(ctx, world, viewWidth, viewHeight);
  drawGrass(ctx, world, cellWidth, cellHeight);
  drawSeasonAtmosphere(ctx, world, viewWidth, viewHeight);
  drawAgents(ctx, world, cellWidth, cellHeight);
  drawVignette(ctx, viewWidth, viewHeight);
}

function drawSeasonBackground(ctx, world, width, height) {
  const seasonKey = world.stats?.season?.key;

  const colors = {
    spring: ["rgba(80, 255, 160, 0.08)", "rgba(7, 16, 13, 0)"],
    summer: ["rgba(255, 210, 90, 0.055)", "rgba(7, 16, 13, 0)"],
    autumn: ["rgba(255, 125, 55, 0.07)", "rgba(7, 16, 13, 0)"],
    winter: ["rgba(140, 190, 255, 0.085)", "rgba(7, 16, 13, 0)"],
  };

  const selected = colors[seasonKey] ?? colors.summer;

  const gradient = ctx.createRadialGradient(
    width * 0.72,
    height * 0.18,
    0,
    width * 0.72,
    height * 0.18,
    width * 0.85,
  );

  gradient.addColorStop(0, selected[0]);
  gradient.addColorStop(1, selected[1]);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawGrass(ctx, world, cellWidth, cellHeight) {
  const maxGrass = world.settings.grassMax;
  const seasonKey = world.stats?.season?.key;

  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const cell = world.cells[y * world.width + x];
      const amount = cell.grass / maxGrass;
      const fertilityGlow = Math.min(1, cell.fertility / 1.35);

      let red = Math.floor(8 + fertilityGlow * 16);
      let green = Math.floor(35 + amount * 145);
      let blue = Math.floor(34 + amount * 40);

      if (seasonKey === "autumn") {
        red += 18;
        green -= 8;
        blue -= 10;
      }

      if (seasonKey === "winter") {
        red += 10;
        green -= 22;
        blue += 28;
      }

      if (seasonKey === "spring") {
        green += 18;
        blue += 4;
      }

      const alpha = 0.28 + amount * 0.7;

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
  ctx.shadowBlur = 0;

  for (const prey of world.prey) {
    const energyRatio = Math.min(
      1,
      prey.energy / prey.traits.reproductionEnergy,
    );
    const speedRatio = Math.min(1, prey.traits.speed / 1.25);
    const cautionRatio = Math.min(1, prey.traits.caution / 1.8);

    const x = prey.x * cellWidth;
    const y = prey.y * cellHeight;

    const radius =
      Math.max(3.2, Math.min(cellWidth, cellHeight) * 0.34) + energyRatio * 1.2;

    const red = Math.floor(215 + speedRatio * 30);
    const green = Math.floor(245);
    const blue = Math.floor(220 + cautionRatio * 35);

    ctx.beginPath();
    ctx.shadowColor = "rgba(215, 255, 235, 0.85)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.92})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(4, 10, 8, 0.85)";
    ctx.lineWidth = 1.4;
    ctx.arc(x, y, radius + 0.8, 0, Math.PI * 2);
    ctx.stroke();

    if (prey.generation > 4) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.lineWidth = 1;
      ctx.arc(x, y, radius + 2.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  for (const predator of world.predators) {
    const energyRatio = Math.min(
      1,
      predator.energy / predator.traits.reproductionEnergy,
    );
    const aggressionRatio = Math.min(1, predator.traits.aggression / 2);
    const speedRatio = Math.min(1, predator.traits.speed / 1.45);

    const x = predator.x * cellWidth;
    const y = predator.y * cellHeight;

    const radius =
      Math.max(4.3, Math.min(cellWidth, cellHeight) * 0.46) + energyRatio * 1.8;

    ctx.beginPath();
    ctx.shadowColor = "rgba(255, 80, 80, 0.9)";
    ctx.shadowBlur = 13;
    ctx.fillStyle = `rgba(255, ${Math.floor(82 + speedRatio * 85)}, ${Math.floor(
      78 - aggressionRatio * 28,
    )}, 0.96)`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(20, 2, 2, 0.9)";
    ctx.lineWidth = 1.6;
    ctx.arc(x, y, radius + 0.9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 235, 210, 0.85)";
    ctx.arc(
      x - radius * 0.28,
      y - radius * 0.18,
      Math.max(0.8, radius * 0.13),
      0,
      Math.PI * 2,
    );
    ctx.fill();

    if (predator.generation > 4) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,180,130,0.36)";
      ctx.lineWidth = 1.2;
      ctx.arc(x, y, radius + 2.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
}

function drawSeasonAtmosphere(ctx, world, width, height) {
  const seasonKey = world.stats?.season?.key;

  if (!seasonKey) return;

  const overlays = {
    spring: "rgba(80, 255, 160, 0.025)",
    summer: "rgba(255, 220, 100, 0.018)",
    autumn: "rgba(255, 128, 64, 0.035)",
    winter: "rgba(160, 205, 255, 0.045)",
  };

  ctx.fillStyle = overlays[seasonKey] ?? "rgba(255,255,255,0)";
  ctx.fillRect(0, 0, width, height);

  if (seasonKey === "winter") {
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#dbeeff";

    for (let i = 0; i < 55; i++) {
      const x = (i * 97 + world.tick * 0.12) % width;
      const y = (i * 53 + world.tick * 0.26) % height;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
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
