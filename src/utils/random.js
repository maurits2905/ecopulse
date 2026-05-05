export function createRandom(seed = Date.now()) {
  let state = seed >>> 0;

  function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  }

  function range(min, max) {
    return min + next() * (max - min);
  }

  function int(min, max) {
    return Math.floor(range(min, max + 1));
  }

  function chance(probability) {
    return next() < probability;
  }

  function pick(items) {
    return items[Math.floor(next() * items.length)];
  }

  return {
    next,
    range,
    int,
    chance,
    pick,
  };
}
