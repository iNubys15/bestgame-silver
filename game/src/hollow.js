// The hollow itself: the night sky, the moon, the ridges, the grass and dead trees,
// the fireflies and the fog. Everything here is placed by index and the world clock,
// so the same moment always draws the same hollow.
import { COLORS, FIELD } from './config.js';

/** The near ridge's height at x, so grass and stones sit on the hill, not under it. */
function hillNearY(x) {
  return 452 + Math.sin(x * 0.011 + 4.0) * 18 + Math.sin(x * 0.03 + 1.0) * 7;
}

function drawSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, '#0b0e1c');
  sky.addColorStop(0.6, COLORS.ink);
  sky.addColorStop(1, '#1a2140');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function drawMoon(ctx, world) {
  // A small pale moon low on the right, clear of the score and charms panels.
  const mx = FIELD.width - 80;
  const my = 210;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(mx, my, 6, mx, my, 64);
  halo.addColorStop(0, 'rgba(220, 228, 255, 0.18)');
  halo.addColorStop(1, 'rgba(220, 228, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(mx, my, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#f2f6ff';
  ctx.beginPath();
  ctx.arc(mx, my, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(140, 150, 190, 0.7)';
  ctx.beginPath();
  ctx.arc(mx - 6, my - 4, 4, 0, Math.PI * 2);
  ctx.arc(mx + 5, my + 6, 3, 0, Math.PI * 2);
  ctx.arc(mx + 7, my - 7, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawStars(ctx) {
  // Fixed by index so the sky never shimmers between frames.
  ctx.fillStyle = '#cdd5f5';
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 137.5) % FIELD.width;
    const y = (i * 89.3) % 220;
    ctx.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(i * 1.7));
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
}

function drawHills(ctx) {
  // Two ridges of hollow hills, drawn from sines so the horizon is never a straight line.
  ctx.fillStyle = COLORS.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.height);
  for (let x = 0; x <= FIELD.width; x += 16) {
    ctx.lineTo(x, 400 + Math.sin(x * 0.008 + 1.2) * 26 + Math.sin(x * 0.021) * 10);
  }
  ctx.lineTo(FIELD.width, FIELD.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.height);
  for (let x = 0; x <= FIELD.width; x += 16) {
    ctx.lineTo(x, hillNearY(x));
  }
  ctx.lineTo(FIELD.width, FIELD.height);
  ctx.closePath();
  ctx.fill();
}

function drawGrass(ctx) {
  // Tufts of pale grass on the near ridge, and a few stones at its foot.
  ctx.strokeStyle = 'rgba(154, 163, 199, 0.5)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 46; i += 1) {
    const x = (i * 97.3 + 31) % FIELD.width;
    const y = hillNearY(x) + 4 + (i % 5);
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x - 5, y - 9 - (i % 3) * 2);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 11 - (i % 4) * 2);
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 5, y - 8 - (i % 3) * 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(120, 128, 160, 0.35)';
  for (let i = 0; i < 12; i += 1) {
    const x = (i * 211.7 + 70) % FIELD.width;
    const y = hillNearY(x) + 14 + (i % 4) * 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 9 + (i % 3) * 3, 4 + (i % 2) * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDeadTrees(ctx) {
  // Bare trees on the far ridge: a trunk and a few crooked branches each.
  ctx.strokeStyle = '#0a0d1d';
  ctx.lineWidth = 4;
  const trees = [120, 330, 620, 845];
  for (let t = 0; t < trees.length; t += 1) {
    const x = trees[t];
    const base = 402 + Math.sin(x * 0.008 + 1.2) * 26 + Math.sin(x * 0.021) * 10;
    const lean = (t % 2 === 0 ? -1 : 1) * (8 + t * 3);
    ctx.beginPath();
    ctx.moveTo(x, base + 4);
    ctx.lineTo(x + lean * 0.4, base - 42);
    ctx.moveTo(x + lean * 0.3, base - 26);
    ctx.lineTo(x + lean - 14, base - 52);
    ctx.moveTo(x + lean * 0.3, base - 30);
    ctx.lineTo(x + lean + 16, base - 58);
    ctx.moveTo(x + lean * 0.4, base - 42);
    ctx.lineTo(x + lean * 0.9, base - 62);
    ctx.stroke();
  }
}

function drawFireflies(ctx, world) {
  // Warm dots drifting on slow sines, always in the same place at the same time.
  for (let i = 0; i < 34; i += 1) {
    const x = (i * 173.3 + Math.sin(world.time * 0.23 + i * 2.1) * 26) % FIELD.width;
    const y = 90 + ((i * 61.7) % 300) + Math.sin(world.time * 0.31 + i * 1.3) * 18;
    ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(world.time * 0.9 + i));
    ctx.fillStyle = COLORS.flame;
    ctx.beginPath();
    ctx.arc(x < 0 ? x + FIELD.width : x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGroundGlows(ctx, world) {
  // Warm ember-light pooled on the hollow floor, fixed by index: the lower half
  // of the frame is never empty dark, even where no wisp is burning. Four more
  // pools sit higher up, so the upper field is never empty dark either.
  for (let i = 0; i < 13; i += 1) {
    const upper = i >= 9;
    const x = (i * 197.3 + 60) % FIELD.width;
    const y = upper ? 180 + ((i * 47.9) % 110) : 300 + ((i * 47.9) % 190);
    const pulse = (upper ? 0.12 : 0.16) + 0.08 * Math.sin(world.time * 0.7 + i * 2.3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 44);
    glow.addColorStop(0, `rgba(255, 154, 60, ${pulse})`);
    glow.addColorStop(1, 'rgba(255, 154, 60, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 200, 110, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Three more pools in the lower-left quadrant, the sparsest part of the
  // frame: fixed positions, so the same moment always draws the same hollow.
  for (const [gx, gy] of [[110, 430], [260, 480], [180, 385]]) {
    const pulse = 0.18 + 0.08 * Math.sin(world.time * 0.7 + gx * 0.02);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(gx, gy, 1, gx, gy, 44);
    glow.addColorStop(0, `rgba(255, 154, 60, ${pulse})`);
    glow.addColorStop(1, 'rgba(255, 154, 60, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gx, gy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 200, 110, 0.5)';
    ctx.beginPath();
    ctx.arc(gx, gy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Glowing mushrooms on the near ridge, violet and still.
  for (let i = 0; i < 7; i += 1) {
    const x = (i * 151.7 + 90) % FIELD.width;
    const y = hillNearY(x) - 6 - (i % 3) * 3;
    ctx.fillStyle = '#8b7cff';
    ctx.fillRect(x - 1.5, y - 6, 3, 6);
    ctx.beginPath();
    ctx.arc(x, y - 7, 5 + (i % 2) * 2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 243, 214, 0.7)';
    ctx.beginPath();
    ctx.arc(x - 2, y - 9, 1, 0, Math.PI * 2);
    ctx.arc(x + 2, y - 8, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFog(ctx, world) {
  // Two slow bands of cold fog hugging the hollow floor.
  for (let band = 0; band < 2; band += 1) {
    const y = 430 + band * 48;
    const drift = Math.sin(world.time * 0.12 + band * 2.4) * 30;
    const fog = ctx.createLinearGradient(0, y - 18, 0, y + 18);
    fog.addColorStop(0, 'rgba(154, 163, 199, 0)');
    fog.addColorStop(0.5, 'rgba(154, 163, 199, 0.07)');
    fog.addColorStop(1, 'rgba(154, 163, 199, 0)');
    ctx.fillStyle = fog;
    ctx.save();
    ctx.translate(drift, 0);
    ctx.fillRect(-40, y - 18, FIELD.width + 80, 36);
    ctx.restore();
  }
}

/** The whole hollow behind the game: sky, moon, hills, grass, trees, fireflies, fog. */
export function drawHollow(ctx, world) {
  drawSky(ctx);
  drawMoon(ctx, world);
  drawStars(ctx);
  drawHills(ctx);
  drawGroundGlows(ctx, world);
  drawDeadTrees(ctx);
  drawGrass(ctx);
  drawFireflies(ctx, world);
  drawFog(ctx, world);
}
