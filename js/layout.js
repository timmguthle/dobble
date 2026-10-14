import { shuffle } from "./deck.js";

// All values are percentages of the card's diameter, so the card is a
// circle of radius 50 centred on (50, 50).
const CARD_RADIUS = 50;
const RIM_PADDING = 3;
const GAP = 0.5;
const MIN_SIZE = 19;
const MAX_SIZE = 34;
const MAX_ROTATION = 180;
// The artwork does not fill the corners of its square box, so collisions
// are checked against a circle slightly smaller than the box.
const HIT_RADIUS = 0.47;
const ATTEMPTS_PER_SYMBOL = 250;
const LAYOUT_ATTEMPTS = 60;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function findSpot(size, placed) {
  const radius = size * HIT_RADIUS;
  const maxDistance = CARD_RADIUS - RIM_PADDING - radius;

  for (let attempt = 0; attempt < ATTEMPTS_PER_SYMBOL; attempt += 1) {
    // sqrt keeps the samples uniform over the disc instead of bunching
    // them in the centre.
    const distance = maxDistance * Math.sqrt(Math.random());
    const angle = Math.random() * Math.PI * 2;
    const x = CARD_RADIUS + distance * Math.cos(angle);
    const y = CARD_RADIUS + distance * Math.sin(angle);
    const fits = placed.every(
      (other) => Math.hypot(other.x - x, other.y - y) >= radius + other.radius + GAP,
    );
    if (fits) return { x, y, size, radius };
  }
  return null;
}

// Fallback that always fits: one symbol in the centre, the rest on a ring.
function ringLayout(count) {
  const ring = count - 1;
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return { x: 50, y: 50, size: 26 };
    const angle = (index / ring) * Math.PI * 2;
    return { x: 50 + 31 * Math.cos(angle), y: 50 + 31 * Math.sin(angle), size: 22 };
  });
}

// Returns `count` non-overlapping placements { x, y, size, rotation } with a
// random position, size and rotation each time it is called.
export function randomLayout(count) {
  for (let attempt = 0; attempt < LAYOUT_ATTEMPTS; attempt += 1) {
    // Shrink the size range a little each time a layout does not fit.
    const scale = 1 - attempt * 0.008;
    // Placing the biggest symbols first makes it much easier to fit them all.
    const sizes = Array.from({ length: count }, () => randomBetween(MIN_SIZE, MAX_SIZE) * scale)
      .sort((a, b) => b - a);
    const placed = [];
    for (const size of sizes) {
      const spot = findSpot(size, placed);
      if (!spot) break;
      placed.push(spot);
    }
    if (placed.length === count) {
      return shuffle(placed).map(({ x, y, size }) => ({
        x, y, size, rotation: randomBetween(-MAX_ROTATION, MAX_ROTATION),
      }));
    }
  }
  return shuffle(ringLayout(count)).map((spot) => ({
    ...spot, rotation: randomBetween(-MAX_ROTATION, MAX_ROTATION),
  }));
}
