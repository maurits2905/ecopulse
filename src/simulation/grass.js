import { clamp } from "../utils/clamp";
import { getCurrentSeason } from "./seasons";

export function getCell(world, x, y) {
  const cx = clamp(Math.floor(x), 0, world.width - 1);
  const cy = clamp(Math.floor(y), 0, world.height - 1);
  return world.cells[cy * world.width + cx];
}

export function growGrass(world) {
  const { grassRegrowth, grassMax } = world.settings;
  const season = getCurrentSeason(world);

  for (const cell of world.cells) {
    const growth =
      grassRegrowth *
      season.grassModifier *
      cell.fertility *
      (1 - cell.grass / grassMax);

    cell.grass = clamp(cell.grass + growth, 0, grassMax);
  }
}

export function eatGrassAt(world, x, y, amount) {
  const cell = getCell(world, x, y);
  const eaten = Math.min(cell.grass, amount);
  cell.grass -= eaten;
  return eaten;
}
