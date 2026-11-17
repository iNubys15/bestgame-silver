// The game itself: screens, nights, scoring, and every rule that makes the light a
// resource. One fixed step advances the whole world; nothing here touches the DOM.
import {
  CHARMS, CHARM_EVERY, EMBER, FIELD, KEEPER, LIGHT, NIGHTS, NIGHT_SECONDS,
  SCORE, WISP, WISP_KINDS,
} from './config.js';
import { mulberry32, range } from './random.js';
import { createEmber, stepEmbers } from './embers.js';
import { endStep, wasPressed } from './input.js';
import { createKeeper, inBeam, stepKeeper, tryFlare } from './lantern.js';
import {
  createBoss, createWisp, nightBudget, spawnInterval, stepWisps, maybeDropEmber,
} from './wisps.js';

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
    spawnLeft: nightBudget(1),
    banished: 0,
    boss: null,
    charms: [],
    drainRate: LIGHT.drainPerSecond,
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

/** Every 20 banished wisps the keeper earns an ember charm, cycling through four. */
function grantCharm(world) {
  if (world.banished === 0 || world.banished % CHARM_EVERY !== 0) return;
  const charm = CHARMS[(world.banished / CHARM_EVERY - 1) % CHARMS.length];
  world.charms.push(charm);
  if (charm === 'Wide Beam') world.keeper.beamHalfAngle += 0.07;
  if (charm === 'Hot Flare') world.keeper.flareDamage += 20;
  if (charm === 'Deep Well') world.drainRate *= 0.9;
  if (charm === 'Swift Feet') world.keeper.speed *= 1.12;
  floater(world, world.keeper.x, world.keeper.y - 34, `Charm: ${charm}`, '#ffe08a');
}

function banishWisp(world, index, audio) {
  const wisp = world.wisps[index];
  world.wisps.splice(index, 1);
  world.banished += 1;
  if (wisp.kind === 'boss') {
    world.boss = null;
    burst(world, wisp.x, wisp.y, '#c9a6ff', 30, 200);
    burst(world, wisp.x, wisp.y, '#ffe08a', 16, 140);
  }
  world.combo = Math.min(world.combo + 1, SCORE.comboMax);
  world.comboTimer = SCORE.comboWindow;
  const gained = WISP_KINDS[wisp.kind].score * Math.max(1, world.combo);
  world.score += gained;
  burst(world, wisp.x, wisp.y, '#b9a8ff', 14, 130);
  burst(world, wisp.x, wisp.y, '#ffe08a', 6, 80);
  floater(world, wisp.x, wisp.y - 10, `+${gained}`, '#ffe08a');
  if (maybeDropEmber(world.rng)) world.embers.push(createEmber(world.rng, wisp.x, wisp.y));
  grantCharm(world);
  if (audio) audio.banish();
}

function endNight(world, audio) {
  for (const wisp of world.wisps) burst(world, wisp.x, wisp.y, '#b9a8ff', 8, 100);
  world.wisps.length = 0;
  world.night += 1;
  if (world.night > NIGHTS) {
    world.screen = SCREEN_WIN;
    world.floaters.length = 0;
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
  world.spawnLeft = nightBudget(world.night);
  if (world.night === NIGHTS) {
    const boss = createBoss(world.rng);
    world.boss = boss;
    world.wisps.push(boss);
    world.banner = { text: 'Night 5 — THE HOLLOW KING wakes', timer: 2.5 };
  }
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
    world.floaters.length = 0;
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
    // A ring of shadow wisps gathers below the keeper on the title screen: the
    // hollow is alive before the first night starts. They drift in the lower arc,
    // clear of the title text, and vanish when a run begins.
    if (world.wisps.length < 5) {
      const i = world.wisps.length;
      world.wisps.push({
        kind: i === 4 ? 'gloom' : 'mote',
        x: world.keeper.x,
        y: world.keeper.y,
        hp: 1,
        speed: 0,
        phase: i * 1.26,
        radius: i === 4 ? 20 : 14,
        burn: 0,
        ambient: true,
        orbit: 150 + i * 26,
        orbitSpeed: 0.22 + i * 0.05,
      });
    }
    for (const wisp of world.wisps) {
      if (!wisp.ambient) continue;
      const angle = Math.PI * (0.2 + (wisp.phase / (Math.PI * 2)) * 0.6) + world.time * wisp.orbitSpeed * 0.25;
      wisp.x = world.keeper.x + Math.cos(angle) * wisp.orbit;
      wisp.y = world.keeper.y + 40 + Math.sin(angle) * wisp.orbit * 0.5;
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
  world.light = Math.max(0, world.light - world.drainRate * dt);
  if (world.light <= 0) {
    world.screen = SCREEN_LOSS;
    world.floaters.length = 0;
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
    if (world.spawnTimer <= 0 && world.wisps.length < WISP.maxAlive && world.spawnLeft > 0) {
      world.spawnTimer = spawnInterval(world.night, NIGHTS);
      world.spawnLeft -= 1;
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
          wisp.hp -= world.keeper.flareDamage;
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
      const cost = WISP_KINDS[wisp.kind].touch;
      world.wisps.splice(i, 1);
      loseLight(world, cost, audio);
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
