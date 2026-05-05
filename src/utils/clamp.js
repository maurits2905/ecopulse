export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function wrap(value, max) {
  if (value < 0) return max + value;
  if (value >= max) return value - max;
  return value;
}
