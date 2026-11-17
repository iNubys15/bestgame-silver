// The game itself: screens, nights, scoring, and every rule that makes the light a
// resource. One fixed step advances the whole world; nothing here touches the DOM.
import {
  EMBER, FIELD, KEEPER, LIGHT, NIGHTS, NIGHT_SECONDS, SCORE, WISP,
} from './config.js';
import { mulberry32, range } from './random.js';
import { createEmber, stepEmbers } from './embers.js';
import { endStep, wasPressed } from './input.js';
import { createKeeper, inBeam, stepKeeper, tryFlare } from './lantern.js';
import { createWisp, spawnInterval, stepWisps, maybeDropEmber } from './wisps.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

function loadBest() {
  try {
    return Number(window.localStorage.getItem('emberwatch-best') || 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest(best) {
  try {
    window.localStorage.setItem('emberwatch-best', String(best));
  } catch {
    // A browser that refuses storage still keeps the run's best in memory.
  }
}

export function createWorld(seed) {
  return {
    seed,
    rng: mulberry32(seed),
    screen: SCREEN_TITLE,
    time: 0,
    night: 1,
    nightTime: 0,
    intermission: 0,
    banner: { text: '', timer: 0 },
    keeper: createKeeper(),
    light: LIGHT.start,
    score: 0,
    best: loadBest(),
    combo: 0,
    comboTimer: 0,
    wisps: [],
    embers: [],
    particles: [],
    floaters: [],
    spawnTimer: 1.2,
    emberTimer: 1.0,
    shake: 0,
    flash: 0,
    flareRing: 0,
  };
}

/** Begin a fresh run: night one, full lantern. A seed makes the run deterministic. */
export function startGame(world, seed) {
  const fresh = createWorld(seed === undefined ? (Math.random() * 2147483647) | 0 : seed);
  Object.assign(world, fresh, { best: world.best });
  world.screen = SCREEN_PLAY;
  world.banner = { text: 'Night 1 — keep the light alive', timer: 2.5 };
}

function burst(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.rng() * Math.PI * 2;
    const v = range(world.rng, speed * 0.3, speed);
    world.particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: range(world.rng, 0.35, 0.7),
      maxLife: 0.7,
      size: range(world.rng, 2, 4.5),
      color,
    });
  }
}

function floater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, life: 1.1 });
}

function stepParticles(world, dt) {
  for (let i = world.particles.length - 1; i >= 0; i -= 1) {
    const p = world.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
    if (p.life <= 0) world.particles.splice(i, 1);
  }
  for (let i = world.floaters.length - 1; i >= 0; i -= 1) {
    const f = world.floaters[i];
    f.y -= 26 * dt;
    f.life -= dt;
    if (f.life <= 0) world.floaters.splice(i, 1);
  }
}

function banishWisp(world, index, audio) {
  const wisp = world.wisps[index];
  world.wisps.splice(index, 1);
  world.combo = Math.min(world.combo + 1, SCORE.comboMax);
  world.comboTimer = SCORE.comboWindow;
  const gained = SCORE.wisp * Math.max(1, world.combo);
  world.score += gained;
  burst(world, wisp.x, wisp.y, '#b9a8ff', 14, 130);
  burst(world, wisp.x, wisp.y, '#ffe08a', 6, 80);
  floater(world, wisp.x, wisp.y - 10, `+${gained}`, '#ffe08a');
  if (maybeDropEmber(world.rng)) world.embers.push(createEmber(world.rng, wisp.x, wisp.y));
  if (audio) audio.banish();
}

function endNight(world, audio) {
  for (const wisp of world.wisps) burst(world, wisp.x, wisp.y, '#b9a8ff', 8, 100);
  world.wisps.length = 0;
  world.night += 1;
  if (world.night > NIGHTS) {
    world.screen = SCREEN_WIN;
    if (world.score > world.best) {
      world.best = world.score;
      saveBest(world.best);
    }
    if (audio) audio.dawn();
    return;
  }
  world.light = Math.min(LIGHT.max, world.light + LIGHT.nightBonus);
  world.nightTime = 0;
  world.intermission = 3;
  world.banner = { text: `Night ${world.night} — the dark thickens`, timer: 2.5 };
  world.spawnTimer = 1.0;
}

function loseLight(world, amount, audio) {
  world.light = Math.max(0, world.light - amount);
  world.combo = 0;
  world.comboTimer = 0;
  world.shake = 0.35;
  world.flash = 0.4;
  if (audio) audio.hurt();
  if (world.light <= 0) {
    world.screen = SCREEN_LOSS;
    if (world.score > world.best) {
      world.best = world.score;
      saveBest(world.best);
    }
  }
}

/** Advance the world one fixed step. `audio` may be null (silent, for screenshots). */
export function stepWorld(world, input, dt, audio) {
  world.time += dt;
  if (world.banner.timer > 0) world.banner.timer -= dt;
  if (world.shake > 0) world.shake -= dt;
  if (world.flash > 0) world.flash -= dt;
  if (world.flareRing > 0) world.flareRing -= dt;
  stepParticles(world, dt);

  if (world.screen === SCREEN_TITLE) {
    stepEmbers(world.embers, dt, world.time);
    if (world.emberTimer > 0) world.emberTimer -= dt;
    else {
      world.emberTimer = 1.4;
      world.embers.push(createEmber(world.rng));
    }
    if (wasPressed(input, 'Enter') || wasPressed(input, 'Space') || input.clicked) {
      if (audio) audio.click();
      startGame(world);
    }
    endStep(input);
    return;
  }

  if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSS) {
    if (wasPressed(input, 'KeyR') || wasPressed(input, 'Enter') || input.clicked) {
      if (audio) audio.click();
      startGame(world);
    }
    endStep(input);
    return;
  }

  // SCREEN_PLAY
  world.light = Math.max(0, world.light - LIGHT.drainPerSecond * dt);
  if (world.light <= 0) {
    world.screen = SCREEN_LOSS;
    if (world.score > world.best) {
      world.best = world.score;
      saveBest(world.best);
    }
    endStep(input);
    return;
  }

  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  stepKeeper(world.keeper, input, dt);
  stepWisps(world.wisps, world.keeper, dt, world.time);
  stepEmbers(world.embers, dt, world.time);

  if (world.intermission > 0) {
    world.intermission -= dt;
  } else {
    world.nightTime += dt;
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0 && world.wisps.length < WISP.maxAlive) {
      world.spawnTimer = spawnInterval(world.night, NIGHTS);
      world.wisps.push(createWisp(world.rng, world.night));
    }
    if (world.nightTime >= NIGHT_SECONDS) endNight(world, audio);
  }

  world.emberTimer -= dt;
  if (world.emberTimer <= 0) {
    world.emberTimer = EMBER.spawnSeconds;
    world.embers.push(createEmber(world.rng));
  }

  // The beam burns every wisp it catches.
  for (let i = world.wisps.length - 1; i >= 0; i -= 1) {
    const wisp = world.wisps[i];
    if (inBeam(world.keeper, wisp.x, wisp.y)) {
      wisp.hp -= KEEPER.beamDps * dt;
      wisp.burn = 0.12;
      if (wisp.hp <= 0) banishWisp(world, i, audio);
    }
  }

  // A flare burns everything close, for light.
  if (wasPressed(input, 'Space') || input.clicked) {
    if (tryFlare(world.keeper, world.light)) {
      world.light -= KEEPER.flareCost;
      world.flareRing = 0.35;
      if (audio) audio.flare();
      for (let i = world.wisps.length - 1; i >= 0; i -= 1) {
        const wisp = world.wisps[i];
        if (Math.hypot(wisp.x - world.keeper.x, wisp.y - world.keeper.y) <= KEEPER.flareRadius) {
          wisp.hp -= KEEPER.flareDamage;
          if (wisp.hp <= 0) banishWisp(world, i, audio);
        }
      }
    }
  }

  // A wisp that reaches the keeper steals light and bursts.
  for (let i = world.wisps.length - 1; i >= 0; i -= 1) {
    const wisp = world.wisps[i];
    const dist = Math.hypot(wisp.x - world.keeper.x, wisp.y - world.keeper.y);
    if (dist < wisp.radius + KEEPER.radius - 2) {
      burst(world, wisp.x, wisp.y, '#7c6cff', 12, 110);
      world.wisps.splice(i, 1);
      loseLight(world, LIGHT.wispTouchCost, audio);
      if (world.screen !== SCREEN_PLAY) {
        endStep(input);
        return;
      }
    }
  }

  // Embers feed the lantern.
  for (let i = world.embers.length - 1; i >= 0; i -= 1) {
    const ember = world.embers[i];
    const dist = Math.hypot(ember.x - world.keeper.x, ember.y - world.keeper.y);
    if (dist < EMBER.pickupRadius) {
      world.embers.splice(i, 1);
      world.light = Math.min(LIGHT.max, world.light + LIGHT.emberRestore);
      world.score += EMBER.score;
      burst(world, ember.x, ember.y, '#ffe08a', 10, 90);
      floater(world, ember.x, ember.y - 8, `+${EMBER.score}`, '#ffe08a');
      if (audio) audio.chime();
    }
  }

  endStep(input);
}
