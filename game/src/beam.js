// The lantern's beam and the flare ring: the light the keeper fights with. The beam
// is three layers — a wide soft cone, a bright inner core, and a hot line down its
// middle — with sparks drifting along it, so the light reads as a weapon, not a wedge.
import { FIELD, KEEPER } from './config.js';

/** The beam's cone: a wide soft wash, a bright core, and a hot centre line. */
export function drawBeam(ctx, keeper, time) {
  const dx = keeper.aimX - keeper.x;
  const dy = keeper.aimY - keeper.y;
  const aim = Math.atan2(dy, dx);
  const len = KEEPER.beamRange;
  const half = KEEPER.beamHalfAngle;
  const tipX = keeper.x + Math.cos(aim) * len;
  const tipY = keeper.y + Math.sin(aim) * len;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // A faint wide halo around the whole cone, so the light dominates the dark.
  const haloHalf = half * 1.5;
  const halo = ctx.createLinearGradient(keeper.x, keeper.y, tipX, tipY);
  halo.addColorStop(0, 'rgba(255, 179, 71, 0.18)');
  halo.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.moveTo(keeper.x, keeper.y);
  ctx.lineTo(keeper.x + Math.cos(aim - haloHalf) * len, keeper.y + Math.sin(aim - haloHalf) * len);
  ctx.lineTo(keeper.x + Math.cos(aim + haloHalf) * len, keeper.y + Math.sin(aim + haloHalf) * len);
  ctx.closePath();
  ctx.fill();

  // Wide soft cone.
  const wash = ctx.createLinearGradient(keeper.x, keeper.y, tipX, tipY);
  wash.addColorStop(0, 'rgba(255, 179, 71, 0.55)');
  wash.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.moveTo(keeper.x, keeper.y);
  ctx.lineTo(keeper.x + Math.cos(aim - half) * len, keeper.y + Math.sin(aim - half) * len);
  ctx.lineTo(keeper.x + Math.cos(aim + half) * len, keeper.y + Math.sin(aim + half) * len);
  ctx.closePath();
  ctx.fill();

  // Bright inner core, half as wide.
  const coreHalf = half * 0.5;
  const core = ctx.createLinearGradient(keeper.x, keeper.y, tipX, tipY);
  core.addColorStop(0, 'rgba(255, 224, 138, 0.75)');
  core.addColorStop(1, 'rgba(255, 224, 138, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(keeper.x, keeper.y);
  ctx.lineTo(keeper.x + Math.cos(aim - coreHalf) * len, keeper.y + Math.sin(aim - coreHalf) * len);
  ctx.lineTo(keeper.x + Math.cos(aim + coreHalf) * len, keeper.y + Math.sin(aim + coreHalf) * len);
  ctx.closePath();
  ctx.fill();

  // Hot centre line.
  ctx.strokeStyle = 'rgba(255, 240, 200, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(keeper.x, keeper.y);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Sparks drifting along the beam, fixed by index and the clock.
  for (let i = 0; i < 10; i += 1) {
    const along = ((i * 0.13 + time * 0.25) % 1) * len;
    const spread = Math.sin(i * 2.7) * half * 0.55 * along;
    const px = keeper.x + Math.cos(aim) * along - Math.sin(aim) * spread;
    const py = keeper.y + Math.sin(aim) * along + Math.cos(aim) * spread;
    ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(time * 3 + i * 1.9));
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** The expanding ring a flare leaves behind, fading as it grows. */
export function drawFlareRing(ctx, world) {
  if (world.flareRing <= 0) return;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 224, 138, ${world.flareRing * 2.4})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(world.keeper.x, world.keeper.y, KEEPER.flareRadius * (1.15 - world.flareRing), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
