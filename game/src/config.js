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
  radius: 14,
  speed: 265,
  beamRange: 340,
  beamHalfAngle: 0.34,
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
  spawnStart: 1.6,
  spawnEnd: 0.55,
  maxAlive: 26,
};

export const EMBER = {
  spawnSeconds: 2.2,
  fallSpeed: 26,
  score: 5,
  lifeSeconds: 9,
  pickupRadius: 28,
};

export const SCORE = {
  wisp: 10,
  comboWindow: 2.0,
  comboMax: 8,
};
