import { useEffect, useRef } from "react";
import { drawWorld } from "../rendering/drawWorld";

function getNearestAgent(world, worldX, worldY) {
  const searchRadius = Math.max(1.2, Math.min(world.width, world.height) * 0.018);

  let nearest = null;
  let nearestDistance = Infinity;

  const allAgents = [...world.prey, ...world.predators];

  for (const agent of allAgents) {
    const dx = agent.x - worldX;
    const dy = agent.y - worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < nearestDistance && distance <= searchRadius) {
      nearest = agent;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function countLocalAgents(agents, worldX, worldY, radius = 5) {
  let count = 0;

  for (const agent of agents) {
    const dx = agent.x - worldX;
    const dy = agent.y - worldY;

    if (Math.sqrt(dx * dx + dy * dy) <= radius) {
      count += 1;
    }
  }

  return count;
}

function buildInspection(world, canvas, event) {
  if (!world || !canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const worldX = (x / rect.width) * world.width;
  const worldY = (y / rect.height) * world.height;

  const cellX = Math.max(0, Math.min(world.width - 1, Math.floor(worldX)));
  const cellY = Math.max(0, Math.min(world.height - 1, Math.floor(worldY)));
  const cell = world.cells[cellY * world.width + cellX];

  if (!cell) return null;

  const nearestAgent = getNearestAgent(world, worldX, worldY);

  return {
    cellX,
    cellY,
    worldX,
    worldY,
    terrain: cell.terrain ?? "grassland",
    grassPercent: cell.grass / world.settings.grassMax,
    fertility: cell.fertility,
    localPrey: countLocalAgents(world.prey, worldX, worldY),
    localPredators: countLocalAgents(world.predators, worldX, worldY),
    agent: nearestAgent
      ? {
          id: nearestAgent.id,
          type: nearestAgent.type,
          energy: nearestAgent.energy,
          age: nearestAgent.age,
          generation: nearestAgent.generation,
          traits: nearestAgent.traits
        }
      : null
  };
}

export default function SimulationCanvas({ world, onInspect }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawWorld(canvasRef.current, world);
  }, [world]);

  function handleInspect(event) {
    const inspection = buildInspection(world, canvasRef.current, event);
    onInspect?.(inspection);
  }

  function clearInspect() {
    onInspect?.(null);
  }

  return (
    <div className="canvas-shell">
      <div className="canvas-header">
        <div>
          <p className="eyebrow">Live simulation</p>
          <h2>Biosphere Field</h2>
        </div>

        <div className="legend">
          <span>
            <i className="dot grass" /> Grass
          </span>
          <span>
            <i className="dot prey" /> Prey
          </span>
          <span>
            <i className="dot predator" /> Predators
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="simulation-canvas"
        onPointerMove={handleInspect}
        onPointerDown={handleInspect}
        onPointerLeave={clearInspect}
      />
    </div>
  );
}