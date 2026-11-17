// The screenshot scenes behind ?shot=start|play|win|loss. Each one plays the real rules
// forward from a fresh world with a fixed seed, steered by an autopilot, so the frame is
// what a short game really looks like and the same seed always gives the same frame.
import { FIELD, STEP } from './config.js';
import {
  SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, createWorld, startGame, stepWorld,
} from './world.js';

const START_SECONDS = 5;
// The play shot stages the flare burst: the skilled run fires a flare at 191.18s
// that banishes five shadows at once and catches the Hollow King deep inside the
// blast — with 24 wisps still alive, the densest burst moment of night 5, so the
// frame shows the fight's peak moment at its busiest, not just a busy mid-fight.
const PLAY_SECONDS = 191.28;
const LIMIT_SECONDS = 600;

function blankInput() {
  return {
    keys: new Set(),
    pressed: new Set(),
    mouse: { x: FIELD.width / 2, y: FIELD.height / 2 - 120, down: false },
    clicked: false,
  };
}

function nearest(list, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const item of list) {
    const d = Math.hypot(item.x - x, item.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = item;
    }
  }
  return { item: best, dist: bestDist };
}

/**
 * A skilled pilot: aim the beam at the nearest wisp — the Hollow King first, when
 * he is close enough to burn — chase embers when the light runs low, back away from
 * a wisp that gets too close, flare when crowded, and drift back to the middle of
 * the hollow when nothing is near, so the fight stays where the eye is.
 */
export function skilledInput(world) {
  const input = blankInput();
  const keeper = world.keeper;
  const wisp = nearest(world.wisps, keeper.x, keeper.y);
  const ember = nearest(world.embers, keeper.x, keeper.y);
  let tx = keeper.x;
  let ty = keeper.y;

  // The boss is the prize target on the final night: burn him when he closes in.
  let target = wisp.item;
  if (world.boss && Math.hypot(world.boss.x - keeper.x, world.boss.y - keeper.y) < 260) {
    target = world.boss;
  }
  const targetDist = target ? Math.hypot(target.x - keeper.x, target.y - keeper.y) : Infinity;

  if (target) {
    input.mouse.x = target.x;
    input.mouse.y = target.y;
    if (targetDist < 90) {
      tx = keeper.x + (keeper.x - target.x);
      ty = keeper.y + (keeper.y - target.y);
    }
  }
  let fleeing = targetDist < 90;
  if (!fleeing && world.light < 65 && ember.item) {
    tx = ember.item.x;
    ty = ember.item.y;
  } else if (!fleeing && (!target || targetDist >= 130)) {
    tx = FIELD.width / 2;
    ty = FIELD.height / 2;
  }
  const dx = tx - keeper.x;
  const dy = ty - keeper.y;
  if (Math.abs(dx) > 12) input.keys.add(dx > 0 ? 'KeyD' : 'KeyA');
  if (Math.abs(dy) > 12) input.keys.add(dy > 0 ? 'KeyS' : 'KeyW');

  let near = 0;
  for (const other of world.wisps) {
    if (Math.hypot(other.x - keeper.x, other.y - keeper.y) < 180) near += 1;
  }
  if (near >= 3 || (target && targetDist < 55)) input.pressed.add('Space');
  return input;
}

/** A careless pilot: it never flares, aims the beam at a far corner where no wisp
 * wanders, and only shuffles after embers, so the dark wins. */
function carelessInput(world) {
  const input = blankInput();
  // The beam points at the top-left corner and stays there: the shadows walk
  // straight past it to the keeper.
  input.mouse.x = 40;
  input.mouse.y = 40;
  const keeper = world.keeper;
  const ember = nearest(world.embers, keeper.x, keeper.y);
  if (world.light < 50 && ember.item) {
    const dx = ember.item.x - keeper.x;
    const dy = ember.item.y - keeper.y;
    if (Math.abs(dx) > 12) input.keys.add(dx > 0 ? 'KeyD' : 'KeyA');
    if (Math.abs(dy) > 12) input.keys.add(dy > 0 ? 'KeyS' : 'KeyW');
  }
  return input;
}

/**
 * A real prior best: play one full run with the skilled pilot, from the same seed,
 * and take its final score. The staged shots show that score as BEST — the score a
 * returning keeper actually earned in an earlier run under the same rules, never a
 * hand-set number. The reference run is a prefix of nothing: it is a whole game.
 */
export function referenceBest() {
  const ref = createWorld(1);
  startGame(ref, 1);
  for (let i = 0; i < LIMIT_SECONDS / STEP; i += 1) {
    stepWorld(ref, skilledInput(ref), STEP, null);
    if (ref.screen !== SCREEN_PLAY) break;
  }
  return ref.score;
}

/**
 * Set `world` to the named scene (start, play, win or loss; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  if (name !== 'play' && name !== 'win' && name !== 'loss') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) {
      stepWorld(world, blankInput(), STEP, null);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }

  startGame(world, 1);
  const pilot = name === 'loss' ? carelessInput : skilledInput;
  const limit = name === 'play' ? PLAY_SECONDS : LIMIT_SECONDS;
  for (let i = 0; i < limit / STEP; i += 1) {
    stepWorld(world, pilot(world), STEP, null);
    if (world.screen !== SCREEN_PLAY) break;
  }
  if (world.screen === SCREEN_WIN) return { screen: SCREEN_WIN, best: world.score };
  if (world.screen === SCREEN_LOSS) return { screen: SCREEN_LOSS, best: world.score };
  return { screen: SCREEN_PLAY, best: world.score };
}

/** A fresh world staged for one screenshot scene, from the given seed. */
export function worldForShot(name, seed) {
  const world = createWorld(seed === undefined ? 1 : seed);
  // Every shot carries the prior run's best, so BEST is a real earned score on
  // every screen — the title, the play HUD, and the end screens alike.
  world.best = referenceBest();
  const staged = stageShot(name, world);
  return { world, screen: staged.screen, best: staged.best };
}
