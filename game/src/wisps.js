// Shadow wisps: they drift in from the edges and home in on the keeper. Caught in the
// lantern's beam they burn; touching the keeper they steal light and burst.
import { FIELD, WISP } from './config.js';
import { chance, range } from './random.js';

export function createWisp(rng, night) {
  const edge = Math.floor(rng() * 4);
  let x;
  let y;
  if (edge === 0) { x = range(rng, 0, FIELD.width); y = -20; }
  else if (edge === 1) { x = range(rng, 0, FIELD.width); y = FIELD.height + 20; }
  else if (edge === 2) { x = -20; y = range(rng, 0, FIELD.height); }
  else { x = FIELD.width + 20; y = range(rng, 0, FIELD.height); }
  return {
    x,
    y,
    hp: WISP.baseHp + WISP.hpPerNight * (night - 1),
    speed: WISP.baseSpeed + WISP.speedPerNight * (night - 1),
    phase: rng() * Math.PI * 2,
    radius: WISP.radius,
    burn: 0,
  };
}

/** How often a new wisp spawns, in seconds, for this night. */
export function spawnInterval(night, nights) {
  const t = nights <= 1 ? 0 : (night - 1) / (nights - 1);
  return WISP.spawnStart + (WISP.spawnEnd - WISP.spawnStart) * t;
}

/** Drift every wisp toward the keeper with a slow sideways wobble. */
export function stepWisps(wisps, keeper, dt, time) {
  for (const wisp of wisps) {
    const dx = keeper.x - wisp.x;
    const dy = keeper.y - wisp.y;
    const len = Math.hypot(dx, dy) || 1;
    const wobble = Math.sin(time * 1.7 + wisp.phase) * 0.55;
    const px = -dy / len;
    const py = dx / len;
    wisp.x += (dx / len * wisp.speed + px * wobble * wisp.speed * 0.5) * dt;
    wisp.y += (dy / len * wisp.speed + py * wobble * wisp.speed * 0.5) * dt;
    if (wisp.burn > 0) wisp.burn -= dt;
  }
}

/** Drop an ember where a banished wisp died, sometimes. */
export function maybeDropEmber(rng) {
  return chance(rng, 0.25);
}
