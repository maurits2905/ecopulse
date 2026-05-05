import { useEffect, useRef } from "react";
import { drawWorld } from "../rendering/drawWorld";

export default function SimulationCanvas({ world }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawWorld(canvasRef.current, world);
  }, [world]);

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

      <canvas ref={canvasRef} className="simulation-canvas" />
    </div>
  );
}