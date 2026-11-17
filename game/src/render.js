// Every pixel of EMBERWATCH: the hollow at night, the keeper and the beam, the wisps,
// the HUD, and the title, dawn and darkness screens. Nothing here changes the world.
import {
  COLORS, FIELD, KEEPER, LIGHT, NIGHTS, NIGHT_SECONDS,
} from './config.js';
import {
  SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN,
} from './world.js';

const TITLE_FONT = '700 68px Georgia, "Times New Roman", serif';
const BIG_FONT = '700 44px Georgia, "Times New Roman", serif';
const HUD_FONT = '600 15px system-ui, -apple-system, sans-serif';
const HUD_BIG = '700 26px system-ui, -apple-system, sans-serif';
const HINT_FONT = '500 14px system-ui, -apple-system, sans-serif';

/** A deterministic flicker in [0.75, 1] from a phase and the world clock. */
function flicker(phase, time, speed) {
  return 0.875 + 0.125 * Math.sin(time * speed + phase);
}

function drawBackground(ctx, world) {
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, '#070912');
  sky.addColorStop(0.6, COLORS.ink);
  sky.addColorStop(1, COLORS.ground);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // Stars, fixed by index so the sky never shimmers between frames.
  ctx.fillStyle = '#cdd5f5';
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 137.5) % FIELD.width;
    const y = (i * 89.3) % 220;
    ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(i * 1.7));
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;

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
    ctx.lineTo(x, 452 + Math.sin(x * 0.011 + 4.0) * 18 + Math.sin(x * 0.03 + 1.0) * 7);
  }
  ctx.lineTo(FIELD.width, FIELD.height);
  ctx.closePath();
  ctx.fill();

  // Fireflies: warm dots drifting on slow sines, always in the same place at the same time.
  for (let i = 0; i < 26; i += 1) {
    const x = (i * 173.3 + Math.sin(world.time * 0.23 + i * 2.1) * 26) % FIELD.width;
    const y = 90 + ((i * 61.7) % 300) + Math.sin(world.time * 0.31 + i * 1.3) * 18;
    ctx.globalAlpha = 0.25 + 0.45 * Math.abs(Math.sin(world.time * 0.9 + i));
    ctx.fillStyle = COLORS.flame;
    ctx.beginPath();
    ctx.arc(x < 0 ? x + FIELD.width : x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBeam(ctx, keeper) {
  const dx = keeper.aimX - keeper.x;
  const dy = keeper.aimY - keeper.y;
  const aim = Math.atan2(dy, dx);
  const len = KEEPER.beamRange;
  const half = KEEPER.beamHalfAngle;
  const x1 = keeper.x + Math.cos(aim - half) * len;
  const y1 = keeper.y + Math.sin(aim - half) * len;
  const x2 = keeper.x + Math.cos(aim + half) * len;
  const y2 = keeper.y + Math.sin(aim + half) * len;
  const grad = ctx.createLinearGradient(keeper.x, keeper.y, keeper.x + Math.cos(aim) * len, keeper.y + Math.sin(aim) * len);
  grad.addColorStop(0, 'rgba(255, 179, 71, 0.40)');
  grad.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(keeper.x, keeper.y);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawKeeper(ctx, world) {
  const keeper = world.keeper;
  const swing = Math.sin(world.time * 3) * 0.08;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(keeper.x, keeper.y, 8, keeper.x, keeper.y, 130);
  glow.addColorStop(0, 'rgba(255, 179, 71, 0.30)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(keeper.x, keeper.y, 130, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cloak: a hooded figure in deep blue, facing the aim.
  const aim = Math.atan2(keeper.aimY - keeper.y, keeper.aimX - keeper.x);
  ctx.save();
  ctx.translate(keeper.x, keeper.y);
  ctx.rotate(aim);
  ctx.fillStyle = '#232c52';
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e3a68';
  ctx.beginPath();
  ctx.arc(2, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  ctx.beginPath();
  ctx.arc(5, -2.5, 1.6, 0, Math.PI * 2);
  ctx.arc(5, 2.5, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The lantern, swinging at the keeper's side.
  const lx = keeper.x + Math.cos(aim + Math.PI / 2 + swing) * 20;
  const ly = keeper.y + Math.sin(aim + Math.PI / 2 + swing) * 20;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const lamp = ctx.createRadialGradient(lx, ly, 2, lx, ly, 26);
  lamp.addColorStop(0, 'rgba(255, 224, 138, 0.9)');
  lamp.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = lamp;
  ctx.beginPath();
  ctx.arc(lx, ly, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3a2f18';
  ctx.fillRect(lx - 4, ly - 6, 8, 12);
  ctx.fillStyle = COLORS.flame;
  ctx.beginPath();
  ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawWisps(ctx, world) {
  for (const wisp of world.wisps) {
    const burn = wisp.burn > 0;
    const breathe = 1 + 0.12 * Math.sin(world.time * 4 + wisp.phase);
    const r = wisp.radius * breathe;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(wisp.x, wisp.y, 2, wisp.x, wisp.y, r * 2.4);
    glow.addColorStop(0, burn ? 'rgba(255, 240, 200, 0.5)' : 'rgba(124, 108, 255, 0.34)');
    glow.addColorStop(1, 'rgba(124, 108, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Smoky body with a dark core, and two pale eyes watching the keeper.
    ctx.fillStyle = burn ? '#a99aff' : COLORS.wisp;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.wispCore;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    const look = Math.atan2(world.keeper.y - wisp.y, world.keeper.x - wisp.x);
    ctx.fillStyle = '#e8e4ff';
    ctx.beginPath();
    ctx.arc(wisp.x + Math.cos(look - 0.35) * r * 0.42, wisp.y + Math.sin(look - 0.35) * r * 0.42, 2, 0, Math.PI * 2);
    ctx.arc(wisp.x + Math.cos(look + 0.35) * r * 0.42, wisp.y + Math.sin(look + 0.35) * r * 0.42, 2, 0, Math.PI * 2);
    ctx.fill();

    // A short tail trailing behind the drift.
    ctx.strokeStyle = 'rgba(124, 108, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wisp.x, wisp.y);
    ctx.quadraticCurveTo(
      wisp.x - Math.cos(look) * 16, wisp.y - Math.sin(look) * 16 + Math.sin(world.time * 5 + wisp.phase) * 6,
      wisp.x - Math.cos(look) * 26, wisp.y - Math.sin(look) * 26,
    );
    ctx.stroke();
  }
}

function drawEmbers(ctx, world) {
  for (const ember of world.embers) {
    const a = flicker(ember.phase, world.time, 6);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(ember.x, ember.y, 1, ember.x, ember.y, 16);
    glow.addColorStop(0, `rgba(255, 224, 138, ${0.7 * a})`);
    glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ember.x, ember.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(ember.x, ember.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.flame;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = HUD_FONT;
  ctx.textAlign = 'center';
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawVignette(ctx, world) {
  // The dark closes in as the light falls: the lit circle around the keeper shrinks.
  const light = world.light / LIGHT.max;
  const radius = 240 + light * 360;
  const grad = ctx.createRadialGradient(world.keeper.x, world.keeper.y, radius * 0.45, world.keeper.x, world.keeper.y, radius);
  grad.addColorStop(0, 'rgba(5, 6, 16, 0)');
  grad.addColorStop(1, 'rgba(5, 6, 16, 0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255, 60, 60, ${world.flash * 0.5})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
}

function drawHud(ctx, world) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Light meter, top left.
  ctx.font = HUD_FONT;
  ctx.fillStyle = COLORS.paper;
  ctx.fillText('LIGHT', 24, 34);
  const lightFrac = world.light / LIGHT.max;
  ctx.fillStyle = 'rgba(255, 243, 214, 0.16)';
  ctx.fillRect(24, 44, 200, 14);
  const lightGrad = ctx.createLinearGradient(24, 0, 224, 0);
  lightGrad.addColorStop(0, lightFrac < 0.25 ? COLORS.danger : COLORS.lantern);
  lightGrad.addColorStop(1, COLORS.flame);
  ctx.fillStyle = lightGrad;
  ctx.fillRect(24, 44, 200 * lightFrac, 14);
  ctx.fillStyle = COLORS.paper;
  ctx.fillText(`${Math.ceil(world.light)}`, 232, 57);

  // Night, top centre, with its progress.
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.paper;
  ctx.font = HUD_BIG;
  ctx.fillText(`NIGHT ${Math.min(world.night, NIGHTS)} / ${NIGHTS}`, FIELD.width / 2, 40);
  ctx.fillStyle = 'rgba(255, 243, 214, 0.16)';
  ctx.fillRect(FIELD.width / 2 - 90, 48, 180, 6);
  ctx.fillStyle = COLORS.lantern;
  const nightFrac = world.intermission > 0 ? 1 : world.nightTime / NIGHT_SECONDS;
  ctx.fillRect(FIELD.width / 2 - 90, 48, 180 * Math.min(1, nightFrac), 6);

  // Score, top right.
  ctx.textAlign = 'right';
  ctx.font = HUD_BIG;
  ctx.fillText(`${world.score}`, FIELD.width - 24, 40);
  ctx.font = HUD_FONT;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`BEST ${world.best}`, FIELD.width - 24, 60);
  if (world.combo >= 2) {
    ctx.fillStyle = COLORS.flame;
    ctx.font = HUD_FONT;
    ctx.fillText(`COMBO x${Math.max(1, world.combo)}`, FIELD.width - 24, 82);
    ctx.fillStyle = 'rgba(255, 224, 138, 0.35)';
    ctx.fillRect(FIELD.width - 104, 88, 80 * (world.comboTimer / 2), 4);
  }

  // Controls hint, fading out a few seconds into the first night.
  if (world.screen === SCREEN_PLAY && world.time < 8) {
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.max(0, 1 - (world.time - 5) / 3);
    ctx.fillStyle = COLORS.dim;
    ctx.font = HINT_FONT;
    ctx.fillText('WASD move  ·  mouse aims the light  ·  Space or click flares', FIELD.width / 2, FIELD.height - 18);
    ctx.globalAlpha = 1;
  }

  // Night banner.
  if (world.banner.timer > 0) {
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, world.banner.timer);
    ctx.fillStyle = COLORS.paper;
    ctx.font = BIG_FONT;
    ctx.fillText(world.banner.text, FIELD.width / 2, FIELD.height / 2 - 60);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(ctx, alpha, color) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.globalAlpha = 1;
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, FIELD.width / 2, y);
}

function drawTitle(ctx, world) {
  drawOverlay(ctx, 0.5, '#05060f');
  centerText(ctx, 'EMBERWATCH', 168, TITLE_FONT, COLORS.flame);
  centerText(ctx, 'Five nights. One lantern. Keep the light alive.', 208, '500 19px Georgia, serif', COLORS.paper);
  centerText(ctx, 'Burn the shadow wisps with your beam. Gather fallen embers to feed the flame.', 240, HINT_FONT, COLORS.dim);
  centerText(ctx, 'WASD or arrows — move      Mouse — aim the light      Space or click — flare', 300, HUD_FONT, COLORS.paper);
  centerText(ctx, 'Survive all five nights until dawn breaks. If the light dies, the dark wins.', 330, HINT_FONT, COLORS.dim);
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  centerText(ctx, 'Click or press Enter to begin', 396, HUD_BIG, COLORS.flame);
  ctx.globalAlpha = 1;
  if (world.best > 0) centerText(ctx, `Best score: ${world.best}`, 436, HINT_FONT, COLORS.dim);
}

function drawEnd(ctx, world, won) {
  if (won) {
    drawOverlay(ctx, 0.42, '#2a1f08');
    centerText(ctx, 'DAWN BREAKS', 190, TITLE_FONT, COLORS.flame);
    centerText(ctx, 'The hollow is quiet again. Five nights survived.', 232, '500 19px Georgia, serif', COLORS.paper);
  } else {
    drawOverlay(ctx, 0.62, '#05060f');
    centerText(ctx, 'THE LIGHT IS OUT', 190, TITLE_FONT, '#c9b8ff');
    centerText(ctx, 'Darkness takes the hollow.', 232, '500 19px Georgia, serif', COLORS.paper);
  }
  centerText(ctx, `Score  ${world.score}`, 300, HUD_BIG, COLORS.paper);
  centerText(ctx, `Best  ${world.best}`, 336, HUD_FONT, COLORS.dim);
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  centerText(ctx, 'Press R to play again', 400, HUD_BIG, COLORS.flame);
  ctx.globalAlpha = 1;
}

/** Draw one frame of the world into the canvas context, letterboxed to the field. */
export function drawWorld(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    const mag = world.shake * 22;
    ctx.translate(Math.sin(world.time * 97) * mag, Math.cos(world.time * 113) * mag);
  }
  drawBackground(ctx, world);
  drawEmbers(ctx, world);
  if (world.screen === SCREEN_PLAY) {
    drawBeam(ctx, world.keeper);
  }
  drawWisps(ctx, world);
  drawKeeper(ctx, world);
  drawParticles(ctx, world);
  if (world.flareRing > 0) {
    ctx.strokeStyle = `rgba(255, 224, 138, ${world.flareRing * 2.4})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(world.keeper.x, world.keeper.y, KEEPER.flareRadius * (1.15 - world.flareRing), 0, Math.PI * 2);
    ctx.stroke();
  }
  drawVignette(ctx, world);
  if (world.screen === SCREEN_PLAY || world.screen === SCREEN_WIN || world.screen === SCREEN_LOSS) {
    drawHud(ctx, world);
  }
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_WIN) drawEnd(ctx, world, true);
  if (world.screen === SCREEN_LOSS) drawEnd(ctx, world, false);
  ctx.restore();
}
