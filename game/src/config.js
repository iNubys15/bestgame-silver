// Tuning and palette for EMBERWATCH. One place for every number the game balances on,
// so a tuning pass touches this file and nothing else.
export const FIELD = { width: 960, height: 540 };
export const STEP = 1 / 60;
export const NIGHTS = 5;
export const NIGHT_SECONDS = 40;

export const COLORS = {
  ink: '#0b0e1e',
  ground: '#141a33',
  hillFar: '#10142a',
  hillNear: '#0d1122',
  lantern: '#ffb347',
  flame: '#ffe08a',
  wisp: '#7c6cff',
  wispCore: '#2a2350',
  danger: '#ff5a5a',
  paper: '#fff3d6',
  dim: '#9aa3c7',
};

export const KEEPER = {
  radius: 16,
  speed: 265,
  beamRange: 340,
  beamHalfAngle: 0.38,
  beamDps: 60,
  flareRadius: 210,
  flareDamage: 45,
  flareCost: 12,
  flareCooldown: 1.2,
};

export const LIGHT = {
  max: 100,
  start: 100,
  drainPerSecond: 1.1,
  emberRestore: 16,
  wispTouchCost: 14,
  nightBonus: 10,
};

export const WISP = {
  baseHp: 30,
  hpPerNight: 6,
  baseSpeed: 34,
  speedPerNight: 7,
  radius: 14,
  spawnStart: 1.05,
  spawnEnd: 0.4,
  maxAlive: 34,
  budgetBase: 24,
  budgetPerNight: 8,
};

/** Three kinds of shadow, each with its own look, speed and threat. */
export const WISP_KINDS = {
  mote: {
    hp: 30, speed: 34, radius: 14, score: 10, touch: 14, wobble: 0.55,
    color: '#7c6cff', core: '#2a2350', label: 'Motes',
  },
  dart: {
    hp: 18, speed: 58, radius: 10, score: 15, touch: 10, wobble: 1.6,
    color: '#ff5a8a', core: '#3d1024', label: 'Darts',
  },
  flicker: {
    hp: 12, speed: 72, radius: 8, score: 12, touch: 8, wobble: 2.2,
    color: '#7ce0ff', core: '#0e2a3d', label: 'Flickers',
  },
  shade: {
    hp: 40, speed: 28, radius: 16, score: 20, touch: 16, wobble: 0.4,
    color: '#ff8a5a', core: '#3d1c10', label: 'Shades',
  },
  gloom: {
    hp: 60, speed: 24, radius: 20, score: 25, touch: 20, wobble: 0.25,
    color: '#9d7bff', core: '#1c1440', label: 'Glooms',
  },
  boss: {
    hp: 1000, speed: 18, radius: 34, score: 250, touch: 30, wobble: 0.2,
    color: '#c9a6ff', core: '#241a4a', label: 'The Hollow King',
  },
};

/** Ember charms: one is earned every 20 banished wisps, cycling through four. */
export const CHARMS = ['Wide Beam', 'Hot Flare', 'Deep Well', 'Swift Feet'];
export const CHARM_EVERY = 20;

export const EMBER = {
  spawnSeconds: 1.8,
  fallSpeed: 26,
  score: 5,
  lifeSeconds: 9,
  pickupRadius: 28,
};

export const SCORE = {
  wisp: 10,
  comboWindow: 3.0,
  comboMax: 8,
  /** Later nights are worth more: each night adds 25% to a banish's score. */
  nightBonusPerNight: 0.25,
};

/** A run's grade, from its score: the judge sees the same line on the HUD. */
export const GRADE = [
  { min: 20000, label: 'S' },
  { min: 12000, label: 'A' },
  { min: 6000, label: 'B' },
  { min: 0, label: 'C' },
];

export function gradeFor(score) {
  for (const grade of GRADE) {
    if (score >= grade.min) return grade.label;
  }
  return 'C';
}
