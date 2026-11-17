// Every pixel of EMBERWATCH: the hollow at night, the keeper and the beam, the wisps,
// the HUD, and the title, dawn and darkness screens. Nothing here changes the world.
import {
  COLORS, FIELD, KEEPER, LIGHT, NIGHTS, NIGHT_SECONDS, WISP_KINDS,
} from './config.js';
import {
  SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN,
} from './world.js';
import { drawHollow } from './hollow.js';
import { drawBeam, drawFlareRing } from './beam.js';

const TITLE_FONT = '700 68px Georgia, "Times New Roman", serif';
const BIG_FONT = '700 44px Georgia, "Times New Roman", serif';
const HUD_FONT = '600 15px system-ui, -apple-system, sans-serif';
const HUD_BIG = '700 26px system-ui, -apple-system, sans-serif';
const HINT_FONT = '500 14px system-ui, -apple-system, sans-serif';

/** A deterministic flicker in [0.75, 1] from a phase and the world clock. */
function flicker(phase, time, speed) {
  return 0.875 + 0.125 * Math.sin(time * speed + phase);
}

function drawKeeper(ctx, world) {
  const keeper = world.keeper;
  const swing = Math.sin(world.time * 3) * 0.08;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(keeper.x, keeper.y, 8, keeper.x, keeper.y, 150);
  glow.addColorStop(0, 'rgba(255, 179, 71, 0.32)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(keeper.x, keeper.y, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cloak: a hooded figure in deep blue, facing the aim, drawn larger than the
  // collision circle so the keeper reads at a glance in a small screenshot.
  const aim = Math.atan2(keeper.aimY - keeper.y, keeper.aimX - keeper.x);
  ctx.save();
  ctx.translate(keeper.x, keeper.y);
  ctx.rotate(aim);
  ctx.fillStyle = '#232c52';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-13, -14);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-13, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e3a68';
  ctx.beginPath();
  ctx.arc(3, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  ctx.beginPath();
  ctx.arc(6.5, -3.2, 2, 0, Math.PI * 2);
  ctx.arc(6.5, 3.2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The lantern, swinging at the keeper's side.
  const lx = keeper.x + Math.cos(aim + Math.PI / 2 + swing) * 26;
  const ly = keeper.y + Math.sin(aim + Math.PI / 2 + swing) * 26;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const lamp = ctx.createRadialGradient(lx, ly, 2, lx, ly, 32);
  lamp.addColorStop(0, 'rgba(255, 224, 138, 0.9)');
  lamp.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = lamp;
  ctx.beginPath();
  ctx.arc(lx, ly, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3a2f18';
  ctx.fillRect(lx - 5, ly - 7.5, 10, 15);
  ctx.fillStyle = COLORS.flame;
  ctx.beginPath();
  ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawWisps(ctx, world) {
  for (const wisp of world.wisps) {
    const spec = WISP_KINDS[wisp.kind];
    const burn = wisp.burn > 0;
    const breathe = 1 + 0.12 * Math.sin(world.time * 4 + wisp.phase);
    const r = wisp.radius * breathe;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(wisp.x, wisp.y, 2, wisp.x, wisp.y, r * 2.4);
    glow.addColorStop(0, burn ? 'rgba(255, 240, 200, 0.5)' : `${spec.color}56`);
    glow.addColorStop(1, `${spec.color}00`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const look = Math.atan2(world.keeper.y - wisp.y, world.keeper.x - wisp.x);

    // Glooms wear a crown of spikes; darts trail a long bright streak.
    if (wisp.kind === 'gloom') {
      ctx.fillStyle = spec.color;
      for (let s = 0; s < 6; s += 1) {
        const a = (s / 6) * Math.PI * 2 + world.time * 0.4;
        ctx.beginPath();
        ctx.moveTo(wisp.x + Math.cos(a - 0.18) * r * 0.8, wisp.y + Math.sin(a - 0.18) * r * 0.8);
        ctx.lineTo(wisp.x + Math.cos(a) * r * 1.5, wisp.y + Math.sin(a) * r * 1.5);
        ctx.lineTo(wisp.x + Math.cos(a + 0.18) * r * 0.8, wisp.y + Math.sin(a + 0.18) * r * 0.8);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (wisp.kind === 'dart') {
      ctx.strokeStyle = `${spec.color}aa`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wisp.x, wisp.y);
      ctx.quadraticCurveTo(
        wisp.x - Math.cos(look) * 26, wisp.y - Math.sin(look) * 26,
        wisp.x - Math.cos(look) * 44, wisp.y - Math.sin(look) * 44,
      );
      ctx.stroke();
    }

    // Smoky body with a dark core, and two pale eyes watching the keeper.
    // Flickers blink fast, so they are hard to track at a glance.
    const blink = wisp.kind === 'flicker'
      ? 0.55 + 0.45 * Math.abs(Math.sin(world.time * 14 + wisp.phase))
      : 1;
    ctx.globalAlpha = blink;
    ctx.fillStyle = burn ? '#a99aff' : spec.color;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spec.core;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e4ff';
    ctx.beginPath();
    ctx.arc(wisp.x + Math.cos(look - 0.35) * r * 0.42, wisp.y + Math.sin(look - 0.35) * r * 0.42, 2, 0, Math.PI * 2);
    ctx.arc(wisp.x + Math.cos(look + 0.35) * r * 0.42, wisp.y + Math.sin(look + 0.35) * r * 0.42, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // A short tail trailing behind the drift.
    ctx.strokeStyle = `${spec.color}80`;
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

  // Dark panels behind the HUD clusters, so the text reads over the beam.
  ctx.fillStyle = 'rgba(5, 6, 15, 0.55)';
  ctx.fillRect(12, 18, 280, 164);
  ctx.fillRect(305, 18, 350, 108);
  ctx.fillRect(780, 18, 168, 186);
  if (world.screen === SCREEN_PLAY) ctx.fillRect(300, 506, 420, 28);

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

  // Tonight's wave: how many shadows are still coming, and of which kind.
  const incoming = world.spawnLeft + world.wisps.length;
  ctx.font = HUD_FONT;
  ctx.fillStyle = COLORS.paper;
  ctx.fillText(`INCOMING ${incoming}`, 24, 80);
  const counts = { mote: 0, dart: 0, flicker: 0, shade: 0, gloom: 0, boss: 0 };
  for (const wisp of world.wisps) counts[wisp.kind] += 1;
  const rosterParts = ['mote', 'dart', 'flicker', 'shade', 'gloom']
    .filter((kind) => counts[kind] > 0)
    .map((kind) => `${WISP_KINDS[kind].label} ${counts[kind]}`);
  ctx.font = HINT_FONT;
  ctx.fillStyle = COLORS.dim;
  if (rosterParts.length === 0) {
    ctx.fillText('the hollow is quiet', 24, 100);
  } else {
    ctx.fillText(rosterParts.slice(0, 3).join('  ·  '), 24, 100);
    if (rosterParts.length > 3) ctx.fillText(rosterParts.slice(3).join('  ·  '), 24, 118);
  }
  ctx.fillText('Darts zigzag · Flickers flit', 24, 138);
  ctx.fillText('Shades steal light · Glooms endure', 24, 156);
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`BANISHED ${world.banished}`, 24, 176);

  // Night, top centre, with its progress and the stakes.
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.paper;
  ctx.font = HUD_BIG;
  ctx.fillText(`NIGHT ${Math.min(world.night, NIGHTS)} / ${NIGHTS}`, FIELD.width / 2, 40);
  ctx.fillStyle = 'rgba(255, 243, 214, 0.16)';
  ctx.fillRect(FIELD.width / 2 - 90, 48, 180, 6);
  ctx.fillStyle = COLORS.lantern;
  const nightFrac = world.intermission > 0 ? 1 : world.nightTime / NIGHT_SECONDS;
  ctx.fillRect(FIELD.width / 2 - 90, 48, 180 * Math.min(1, nightFrac), 6);
  ctx.font = HINT_FONT;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('WIN survive all 5 nights  ·  LOSE light hits 0', FIELD.width / 2, 76);

  // The boss bar, while the Hollow King lives.
  if (world.boss) {
    const boss = world.boss;
    ctx.font = HUD_FONT;
    ctx.fillStyle = '#c9a6ff';
    ctx.fillText('THE HOLLOW KING  ·  FINAL NIGHT', FIELD.width / 2, 98);
    ctx.fillStyle = 'rgba(201, 166, 255, 0.2)';
    ctx.fillRect(FIELD.width / 2 - 110, 106, 220, 8);
    ctx.fillStyle = '#c9a6ff';
    ctx.fillRect(FIELD.width / 2 - 110, 106, 220 * Math.max(0, boss.hp / boss.maxHp), 8);
  }

  // Score, top right.
  ctx.textAlign = 'right';
  ctx.font = HUD_BIG;
  ctx.fillStyle = COLORS.paper;
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

  // Ember charms earned this run, one per 20 banished wisps.
  ctx.textAlign = 'right';
  ctx.font = HUD_FONT;
  ctx.fillStyle = COLORS.paper;
  ctx.fillText('CHARMS', FIELD.width - 24, 118);
  ctx.font = HINT_FONT;
  if (world.charms.length === 0) {
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('banish 20 wisps to earn one', FIELD.width - 24, 138);
  } else {
    const charmCounts = {};
    for (const charm of world.charms) charmCounts[charm] = (charmCounts[charm] || 0) + 1;
    let cy = 138;
    for (const charm of ['Wide Beam', 'Hot Flare', 'Deep Well', 'Swift Feet']) {
      if (!charmCounts[charm]) continue;
      ctx.fillStyle = COLORS.flame;
      ctx.fillText(`${charm} x${charmCounts[charm]}`, FIELD.width - 24, cy);
      cy += 18;
    }
  }

  // Bottom ability bar: the controls stay visible for the whole run.
  if (world.screen === SCREEN_PLAY) {
    ctx.textAlign = 'center';
    ctx.font = HINT_FONT;
    const flareReady = world.keeper.flareTimer <= 0 && world.light >= KEEPER.flareCost;
    ctx.fillStyle = flareReady ? COLORS.flame : COLORS.dim;
    ctx.fillText('SPACE flare', FIELD.width / 2 - 150, FIELD.height - 18);
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('WASD move  ·  mouse aims the light  ·  R restart', FIELD.width / 2 + 90, FIELD.height - 18);
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
  // A lighter veil than before, so the keeper and the circling wisps show through.
  drawOverlay(ctx, 0.42, '#05060f');
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

function drawDawn(ctx) {
  // The dawn itself: a warm sky, a rising sun and its rays over the hollow.
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, 'rgba(26, 18, 8, 0.96)');
  sky.addColorStop(0.45, 'rgba(122, 61, 18, 0.96)');
  sky.addColorStop(0.75, 'rgba(224, 138, 46, 0.96)');
  sky.addColorStop(1, 'rgba(255, 217, 122, 0.96)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const sunX = FIELD.width / 2;
  const sunY = 468;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 150);
  halo.addColorStop(0, 'rgba(255, 240, 200, 0.8)');
  halo.addColorStop(1, 'rgba(255, 200, 90, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 243, 214, 0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(a) * 50, sunY + Math.sin(a) * 50);
    ctx.lineTo(sunX + Math.cos(a) * 74, sunY + Math.sin(a) * 74);
    ctx.stroke();
  }
}

function drawEnd(ctx, world, won) {
  if (won) {
    drawDawn(ctx);
    centerText(ctx, 'DAWN BREAKS', 190, TITLE_FONT, COLORS.flame);
    centerText(ctx, 'The hollow is quiet again. Five nights survived.', 232, '500 19px Georgia, serif', COLORS.paper);
  } else {
    drawOverlay(ctx, 0.62, '#05060f');
    // The keeper's last ember, still glowing where the light went out.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const last = ctx.createRadialGradient(world.keeper.x, world.keeper.y, 1, world.keeper.x, world.keeper.y, 26);
    last.addColorStop(0, 'rgba(255, 179, 71, 0.55)');
    last.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = last;
    ctx.beginPath();
    ctx.arc(world.keeper.x, world.keeper.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
  drawHollow(ctx, world);
  drawEmbers(ctx, world);
  if (world.screen === SCREEN_PLAY) {
    drawBeam(ctx, world.keeper, world.time);
  }
  drawWisps(ctx, world);
  drawKeeper(ctx, world);
  drawParticles(ctx, world);
  drawFlareRing(ctx, world);
  drawVignette(ctx, world);
  // The HUD stays on play and loss; the dawn carries the win screen alone.
  if (world.screen === SCREEN_PLAY || world.screen === SCREEN_LOSS) {
    drawHud(ctx, world);
  }
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_WIN) drawEnd(ctx, world, true);
  if (world.screen === SCREEN_LOSS) drawEnd(ctx, world, false);
  ctx.restore();
}
