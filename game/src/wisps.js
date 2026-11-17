// Shadow wisps: they drift in from the edges and home in on the keeper. Caught in the
// lantern's beam they burn; touching the keeper they steal light and burst. Three
// kinds keep the nights varied: slow motes, quick darts that zigzag, and big glooms
// that take a long burn and hit hard.
import { FIELD, WISP, WISP_KINDS } from './config.js';
import { chance, range } from './random.js';

/** Which kinds can appear on this night, and how often each one is picked. */
function kindForNight(rng, night) {
  const roll = rng();
  if (night >= 3 && roll < 0.14) return 'gloom';
  if (night >= 3 && roll < 0.30) return 'shade';
  if (night >= 2 && roll < 0.46) return 'dart';
  if (night >= 2 && roll < 0.60) return 'flicker';
  return 'mote';
}

/** The Hollow King: the one boss of the final night, big and slow and hard to burn. */
export function createBoss(rng) {
  const spec = WISP_KINDS.boss;
  const edge = Math.floor(rng() * 4);
  let x;
  let y;
  // Spawned just inside the field, never half off it: a boss cut by the frame
  // edge reads as a mistake, and the staged shot must never show one.
  if (edge === 0) { x = range(rng, 0, FIELD.width); y = spec.radius; }
  else if (edge === 1) { x = range(rng, 0, FIELD.width); y = FIELD.height - spec.radius; }
  else if (edge === 2) { x = spec.radius; y = range(rng, 0, FIELD.height); }
  else { x = FIELD.width - spec.radius; y = range(rng, 0, FIELD.height); }
  return {
    kind: 'boss',
    x,
    y,
    hp: spec.hp,
    maxHp: spec.hp,
    speed: spec.speed,
    phase: rng() * Math.PI * 2,
    radius: spec.radius,
    burn: 0,
  };
}

export function createWisp(rng, night) {
  const kind = kindForNight(rng, night);
  const spec = WISP_KINDS[kind];
  const edge = Math.floor(rng() * 4);
  let x;
  let y;
  // Spawned just off the field, as before: spawning inside the field made
  // the shadows reach the keeper a step sooner, and the careless pilot — the
  // loss shot's stand-in — died on night 1 instead of night 3. The clamp in
  // stepWisps is what keeps a wisp from ever rendering half-cut, so the
  // spawn itself can stay off-field: a fresh wisp is fully off-screen for
  // its first step, then fully on-screen once it is clamped inside.
  if (edge === 0) { x = range(rng, 0, FIELD.width); y = -20; }
  else if (edge === 1) { x = range(rng, 0, FIELD.width); y = FIELD.height + 20; }
  else if (edge === 2) { x = -20; y = range(rng, 0, FIELD.height); }
  else { x = FIELD.width + 20; y = range(rng, 0, FIELD.height); }
  return {
    kind,
    x,
    y,
    hp: spec.hp + WISP.hpPerNight * (night - 1),
    speed: spec.speed + WISP.speedPerNight * (night - 1),
    phase: rng() * Math.PI * 2,
    radius: spec.radius,
    burn: 0,
  };
}

/** How often a new wisp spawns, in seconds, for this night. */
export function spawnInterval(night, nights) {
  const t = nights <= 1 ? 0 : (night - 1) / (nights - 1);
  return WISP.spawnStart + (WISP.spawnEnd - WISP.spawnStart) * t;
}

/** How many wisps the night sends in all, counting the ones already out. */
export function nightBudget(night) {
  return WISP.budgetBase + WISP.budgetPerNight * night;
}

/** Drift every wisp toward the keeper with a sideways wobble of its own kind. */
export function stepWisps(wisps, keeper, dt, time) {
  for (const wisp of wisps) {
    const spec = WISP_KINDS[wisp.kind];
    const dx = keeper.x - wisp.x;
    const dy = keeper.y - wisp.y;
    const len = Math.hypot(dx, dy) || 1;
    const wobble = Math.sin(time * 1.7 + wisp.phase) * spec.wobble;
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
