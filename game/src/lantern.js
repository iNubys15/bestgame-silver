// The keeper and the lantern: movement, the beam that burns wisps, and the flare.
// Light is the one resource: the beam is free, the flare spends it. The keeper's
// effective numbers live on the keeper itself, so ember charms can raise them.
import { FIELD, KEEPER } from './config.js';
import { moveAxis } from './input.js';

export function createKeeper() {
  return {
    x: FIELD.width / 2,
    y: FIELD.height / 2 + 60,
    aimX: FIELD.width / 2,
    aimY: FIELD.height / 2 - 120,
    flareTimer: 0,
    flareFlash: 0,
    beamHalfAngle: KEEPER.beamHalfAngle,
    speed: KEEPER.speed,
    flareDamage: KEEPER.flareDamage,
  };
}

/** Move the keeper with the held keys and aim the lantern at the mouse. */
export function stepKeeper(keeper, input, dt) {
  const axis = moveAxis(input);
  keeper.x = Math.min(FIELD.width - KEEPER.radius, Math.max(KEEPER.radius, keeper.x + axis.x * keeper.speed * dt));
  keeper.y = Math.min(FIELD.height - KEEPER.radius, Math.max(KEEPER.radius, keeper.y + axis.y * keeper.speed * dt));
  keeper.aimX = input.mouse.x;
  keeper.aimY = input.mouse.y;
  if (keeper.flareTimer > 0) keeper.flareTimer -= dt;
  if (keeper.flareFlash > 0) keeper.flareFlash -= dt;
}

/** True when a point sits inside the lantern's cone of light. */
export function inBeam(keeper, x, y) {
  const dx = x - keeper.x;
  const dy = y - keeper.y;
  const dist = Math.hypot(dx, dy);
  if (dist > KEEPER.beamRange || dist < 1) return false;
  const aimDx = keeper.aimX - keeper.x;
  const aimDy = keeper.aimY - keeper.y;
  const aimLen = Math.hypot(aimDx, aimDy);
  if (aimLen < 1) return dist <= KEEPER.beamRange;
  const cos = (dx * aimDx + dy * aimDy) / (dist * aimLen);
  return cos >= Math.cos(keeper.beamHalfAngle);
}

/** Fire a flare if it is off cooldown and the keeper can pay for it. */
export function tryFlare(keeper, light) {
  if (keeper.flareTimer > 0 || light < KEEPER.flareCost) return false;
  keeper.flareTimer = KEEPER.flareCooldown;
  keeper.flareFlash = 0.25;
  return true;
}
