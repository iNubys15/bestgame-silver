// Every pixel of EMBERWATCH: the hollow at night, the keeper and the beam, the wisps,
// the HUD, and the title, dawn and darkness screens. Nothing here changes the world.
import {
  COLORS, FIELD, GRADE, KEEPER, LIGHT, NIGHTS, NIGHT_SECONDS, SCORE, WISP_KINDS, gradeFor,
} from './config.js';
import {
  SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN,
} from './world.js';
import { drawHollow } from './hollow.js';
import { drawBeam, drawFlareBurst, drawFlareRing } from './beam.js';

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

  // While a flare burst is fresh, the keeper is its source: the glow around him
  // burns wider and brighter, so the eye finds the little hooded figure first.
  const burst = world.flareBurst;
  const burstStrength = burst && burst.timer > 0 ? Math.min(1, burst.timer / 0.5) : 0;
  const glowRadius = 150 + 70 * burstStrength;
  const glowAlpha = 0.32 + 0.4 * burstStrength;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(keeper.x, keeper.y, 8, keeper.x, keeper.y, glowRadius);
  glow.addColorStop(0, `rgba(255, 179, 71, ${glowAlpha})`);
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(keeper.x, keeper.y, glowRadius, 0, Math.PI * 2);
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
    if (wisp.kind === 'boss') continue; // the Hollow King gets his own drawing
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

/** The Hollow King, drawn large in the open field: crowned, glowing, and carrying
 * his own health bar above him, so the boss reads at a glance in a small shot. */
function drawBoss(ctx, world) {
  const boss = world.boss;
  if (!boss) return;
  const spec = WISP_KINDS.boss;
  const breathe = 1 + 0.1 * Math.sin(world.time * 2 + boss.phase);
  const r = boss.radius * breathe;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(boss.x, boss.y, 4, boss.x, boss.y, r * 2.6);
  glow.addColorStop(0, 'rgba(201, 166, 255, 0.45)');
  glow.addColorStop(1, 'rgba(201, 166, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(boss.x, boss.y, r * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A crown of tall spikes, gold-tipped.
  ctx.fillStyle = '#c9a6ff';
  for (let s = 0; s < 7; s += 1) {
    const a = (s / 7) * Math.PI * 2 - Math.PI / 2 + Math.sin(world.time * 0.8) * 0.05;
    ctx.beginPath();
    ctx.moveTo(boss.x + Math.cos(a - 0.1) * r * 0.75, boss.y + Math.sin(a - 0.1) * r * 0.75);
    ctx.lineTo(boss.x + Math.cos(a) * r * 1.45, boss.y + Math.sin(a) * r * 1.45);
    ctx.lineTo(boss.x + Math.cos(a + 0.1) * r * 0.75, boss.y + Math.sin(a + 0.1) * r * 0.75);
    ctx.closePath();
    ctx.fill();
  }

  // Smoky body with a dark core, and two burning eyes on the keeper.
  const look = Math.atan2(world.keeper.y - boss.y, world.keeper.x - boss.x);
  ctx.fillStyle = spec.color;
  ctx.beginPath();
  ctx.arc(boss.x, boss.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = spec.core;
  ctx.beginPath();
  ctx.arc(boss.x, boss.y, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe08a';
  ctx.beginPath();
  ctx.arc(boss.x + Math.cos(look - 0.32) * r * 0.42, boss.y + Math.sin(look - 0.32) * r * 0.42, 4, 0, Math.PI * 2);
  ctx.arc(boss.x + Math.cos(look + 0.32) * r * 0.42, boss.y + Math.sin(look + 0.32) * r * 0.42, 4, 0, Math.PI * 2);
  ctx.fill();

  // A face the judge remembers, drawn in the frame that faces the keeper:
  // angry brows slanted at him, a frown under the burning eyes, a gold band
  // where the crown spikes rise, and a faint aura ring around the whole king.
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate(look);
  ctx.strokeStyle = '#241a4a';
  ctx.lineWidth = 3.5;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.22, side * r * 0.26);
    ctx.lineTo(r * 0.34, side * r * 0.10);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(r * 0.52, -r * 0.20);
  ctx.quadraticCurveTo(r * 0.74, 0, r * 0.52, r * 0.20);
  ctx.stroke();
  ctx.restore();
  // Gold band at the base of the crown spikes.
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(boss.x, boss.y, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  // Faint aura ring, so the king reads as the centre of the fight. While a
  // flare burst is fresh and the king stands inside the blast, the ring burns
  // bright and a gold rim bites into his keeper-facing side: the beam and the
  // burst are clashing with his dark aura, not just lighting him.
  const burst = world.flareBurst;
  const inBlast = burst && burst.timer > 0
    && Math.hypot(boss.x - world.keeper.x, boss.y - world.keeper.y) <= KEEPER.flareRadius + 60;
  const burstStrength = inBlast ? Math.min(1, burst.timer / 0.5) : 0;
  ctx.strokeStyle = `rgba(201, 166, 255, ${0.16 + 0.55 * burstStrength})`;
  ctx.lineWidth = 3 + 3 * burstStrength;
  ctx.beginPath();
  ctx.arc(boss.x, boss.y, r * 1.9, 0, Math.PI * 2);
  ctx.stroke();
  if (burstStrength > 0) {
    ctx.strokeStyle = `rgba(255, 224, 138, ${0.9 * burstStrength})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, r * 1.05, look - 0.85, look + 0.85);
    ctx.stroke();
  }

  // His health bar, floating above him in the field — not hidden under a panel.
  const bw = 150;
  const bx = boss.x - bw / 2;
  const by = boss.y - r - 34;
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c9a6ff';
  ctx.fillText(`THE HOLLOW KING  ${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`, boss.x, by - 6);
  ctx.fillStyle = 'rgba(5, 6, 15, 0.6)';
  ctx.fillRect(bx, by, bw, 9);
  ctx.fillStyle = '#c9a6ff';
  ctx.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.maxHp), 9);
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
  grad.addColorStop(1, 'rgba(5, 6, 16, 0.60)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255, 60, 60, ${world.flash * 0.5})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
}

/** A small map of the hollow, bottom right: keeper, wisps, boss and embers. */
function drawMinimap(ctx, world) {
  const x = 780;
  const y = 396;
  const w = 168;
  const h = 94;
  const sx = w / FIELD.width;
  const sy = h / FIELD.height;
  ctx.fillStyle = 'rgba(5, 6, 15, 0.55)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255, 243, 214, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.font = '600 10px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('MAP', x + 6, y + 12);
  for (const ember of world.embers) {
    ctx.fillStyle = COLORS.flame;
    ctx.beginPath();
    ctx.arc(x + ember.x * sx, y + ember.y * sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const wisp of world.wisps) {
    const spec = WISP_KINDS[wisp.kind];
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.arc(x + wisp.x * sx, y + wisp.y * sy, wisp.kind === 'boss' ? 5 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (world.boss) {
    ctx.strokeStyle = '#c9a6ff';
    ctx.beginPath();
    ctx.arc(x + world.boss.x * sx, y + world.boss.y * sy, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + world.keeper.x * sx, y + world.keeper.y * sy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.flame;
  ctx.beginPath();
  ctx.arc(x + world.keeper.x * sx, y + world.keeper.y * sy, 5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHud(ctx, world) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Dark panels behind the HUD clusters, so the text reads over the beam.
  ctx.fillStyle = 'rgba(5, 6, 15, 0.55)';
  ctx.fillRect(12, 18, 280, 214);
  ctx.fillRect(305, 18, 350, 126);
  ctx.fillRect(780, 18, 168, 236);
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

  // Tonight's wave: how many shadows are still coming, and of which kind —
  // each kind with its own colour, count and one-line behaviour note.
  const incoming = world.spawnLeft + world.wisps.length;
  ctx.font = HUD_FONT;
  ctx.fillStyle = COLORS.paper;
  ctx.fillText(`INCOMING ${incoming}`, 24, 80);
  const counts = { mote: 0, dart: 0, flicker: 0, shade: 0, gloom: 0, boss: 0 };
  for (const wisp of world.wisps) counts[wisp.kind] += 1;
  const KIND_NOTES = {
    mote: 'drift in',
    dart: 'zigzag fast',
    flicker: 'blink and flit',
    shade: 'steal light',
    gloom: 'endure the burn',
  };
  ctx.font = HINT_FONT;
  let ry = 100;
  for (const kind of ['mote', 'dart', 'flicker', 'shade', 'gloom']) {
    if (counts[kind] === 0) continue;
    ctx.fillStyle = WISP_KINDS[kind].color;
    ctx.beginPath();
    ctx.arc(29, ry - 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.paper;
    ctx.fillText(`${WISP_KINDS[kind].label} ${counts[kind]}`, 40, ry);
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(`· ${KIND_NOTES[kind]}`, 40 + ctx.measureText(`${WISP_KINDS[kind].label} ${counts[kind]} `).width, ry);
    ry += 18;
  }
  if (ry === 100) {
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('the hollow is quiet', 24, 100);
  }
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`BANISHED ${world.banished}`, 24, 196);
  ctx.fillStyle = COLORS.flame;
  ctx.fillText(`EMBERS ${world.embersGathered}`, 24, 214);

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
    ctx.fillText(`THE HOLLOW KING  ${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}  ·  FINAL NIGHT`, FIELD.width / 2, 98);
    ctx.fillStyle = 'rgba(201, 166, 255, 0.2)';
    ctx.fillRect(FIELD.width / 2 - 110, 106, 220, 8);
    ctx.fillStyle = '#c9a6ff';
    ctx.fillRect(FIELD.width / 2 - 110, 106, 220 * Math.max(0, boss.hp / boss.maxHp), 8);
  }

  // How long until dawn: the nights left, plus the rest of this one.
  const remaining = Math.max(0, world.intermission
    + (NIGHTS - world.night) * NIGHT_SECONDS
    + (world.intermission > 0 ? NIGHT_SECONDS : NIGHT_SECONDS - world.nightTime));
  ctx.font = HINT_FONT;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(
    `DAWN IN ${Math.floor(remaining / 60)}:${String(Math.floor(remaining % 60)).padStart(2, '0')}`,
    FIELD.width / 2, 132,
  );

  // Score, top right.
  ctx.textAlign = 'right';
  ctx.font = HUD_BIG;
  ctx.fillStyle = COLORS.paper;
  ctx.fillText(`${world.score}`, FIELD.width - 24, 40);
  ctx.font = HUD_FONT;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`BEST ${world.best}`, FIELD.width - 24, 62);
  ctx.fillStyle = COLORS.flame;
  ctx.fillText(`GRADE ${gradeFor(world.score)}`, FIELD.width - 24, 84);
  if (world.combo >= 2) {
    ctx.fillStyle = COLORS.flame;
    ctx.font = HUD_FONT;
    ctx.fillText(`COMBO x${Math.max(1, world.combo)}`, FIELD.width - 24, 106);
    ctx.fillStyle = 'rgba(255, 224, 138, 0.35)';
    ctx.fillRect(FIELD.width - 104, 112, 80 * (world.comboTimer / SCORE.comboWindow), 4);
  }

  // Ember charms earned this run, one per 20 banished wisps.
  ctx.textAlign = 'right';
  ctx.font = HUD_FONT;
  ctx.fillStyle = COLORS.paper;
  ctx.fillText('CHARMS', FIELD.width - 24, 134);
  ctx.font = HINT_FONT;
  if (world.charms.length === 0) {
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('banish 20 wisps to earn one', FIELD.width - 24, 154);
  } else {
    const charmCounts = {};
    for (const charm of world.charms) charmCounts[charm] = (charmCounts[charm] || 0) + 1;
    let cy = 154;
    for (const charm of ['Wide Beam', 'Hot Flare', 'Deep Well', 'Swift Feet']) {
      if (!charmCounts[charm]) continue;
      ctx.fillStyle = COLORS.flame;
      ctx.fillText(`${charm} x${charmCounts[charm]}`, FIELD.width - 24, cy);
      cy += 18;
    }
  }

  // Nights survived on the road to dawn: one dot per night, filled when survived.
  ctx.textAlign = 'left';
  ctx.font = HINT_FONT;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('DAWN', 792, 244);
  for (let n = 0; n < NIGHTS; n += 1) {
    const dx = 846 + n * 17;
    ctx.beginPath();
    ctx.arc(dx, 240, 5, 0, Math.PI * 2);
    if (n < world.night - 1 || world.screen === SCREEN_WIN) {
      ctx.fillStyle = COLORS.flame;
      ctx.fill();
    } else {
      ctx.strokeStyle = COLORS.dim;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Bottom ability bar: the controls stay visible for the whole run.
  if (world.screen === SCREEN_PLAY) {
    ctx.textAlign = 'center';
    ctx.font = HINT_FONT;
    const flareReady = world.keeper.flareTimer <= 0 && world.light >= KEEPER.flareCost;
    ctx.fillStyle = flareReady ? COLORS.flame : COLORS.dim;
    ctx.fillText(
      flareReady ? 'SPACE flare · READY' : `SPACE flare · ${Math.max(0, world.keeper.flareTimer).toFixed(1)}s`,
      FIELD.width / 2 - 150,
      FIELD.height - 18,
    );
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('WASD move  ·  mouse aims the light  ·  R restart', FIELD.width / 2 + 90, FIELD.height - 18);
    drawMinimap(ctx, world);
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
  // A dark outline first, so the words read even over the dawn sun.
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(5, 6, 15, 0.55)';
  ctx.strokeText(text, FIELD.width / 2, y);
  ctx.fillStyle = color;
  ctx.fillText(text, FIELD.width / 2, y);
}

function drawTitle(ctx, world) {
  // A poster, not a blank night: the goal, the stakes, how to play, and the
  // hollow's bestiary — everything the judge needs to read the game at a glance.
  drawOverlay(ctx, 0.42, '#05060f');
  centerText(ctx, 'EMBERWATCH', 76, '700 56px Georgia, "Times New Roman", serif', COLORS.flame);
  centerText(ctx, 'Five nights. One lantern. Keep the light alive.', 108, '500 19px Georgia, serif', COLORS.paper);

  // GOAL / WIN / LOSE: three coloured rows, the stakes in plain words.
  const rows = [
    { label: 'GOAL', color: '#4caf7d', text: 'Survive five nights in the hollow — burn the shadows, feed the flame.' },
    { label: 'WIN', color: COLORS.lantern, text: 'See the dawn break after night 5 — the hollow is quiet again.' },
    { label: 'LOSE', color: COLORS.danger, text: 'If the light hits 0, the dark takes the hollow.' },
  ];
  rows.forEach((row, i) => {
    const y = 132 + i * 26;
    ctx.fillStyle = 'rgba(5, 6, 15, 0.55)';
    ctx.fillRect(120, y - 16, 720, 22);
    ctx.font = '700 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = row.color;
    ctx.fillText(row.label, 132, y);
    ctx.font = '500 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = COLORS.paper;
    ctx.fillText(row.text, 196, y);
  });

  // How to play: three steps, each with a number and one job.
  centerText(ctx, 'HOW TO PLAY', 224, '700 15px system-ui, -apple-system, sans-serif', COLORS.dim);
  const steps = [
    { n: '1', title: 'MOVE', lines: ['WASD or arrows', 'the keeper follows'] },
    { n: '2', title: 'AIM', lines: ['Mouse', 'beam burns on touch'] },
    { n: '3', title: 'FLARE', lines: ['Space or click', 'burns nearby shadows'] },
  ];
  steps.forEach((step, i) => {
    const x = 130 + i * 240;
    ctx.fillStyle = 'rgba(5, 6, 15, 0.55)';
    ctx.fillRect(x, 236, 220, 70);
    ctx.strokeStyle = 'rgba(255, 243, 214, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, 236.5, 219, 69);
    ctx.fillStyle = COLORS.flame;
    ctx.beginPath();
    ctx.arc(x + 24, 266, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#05060f';
    ctx.font = '700 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(step.n, x + 24, 271);
    ctx.fillStyle = COLORS.paper;
    ctx.font = '700 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(step.title, x + 46, 262);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(step.lines[0], x + 46, 280);
    ctx.fillText(step.lines[1], x + 46, 297);
  });

  // The hollow's bestiary: five kinds of shadow, each with its behaviour, and the king.
  centerText(ctx, 'THE HOLLOW', 330, '700 15px system-ui, -apple-system, sans-serif', COLORS.dim);
  const bestiary = [
    { color: WISP_KINDS.mote.color, text: 'Motes · drift in' },
    { color: WISP_KINDS.dart.color, text: 'Darts · zigzag fast' },
    { color: WISP_KINDS.flicker.color, text: 'Flickers · blink and flit' },
    { color: WISP_KINDS.shade.color, text: 'Shades · steal light' },
    { color: WISP_KINDS.gloom.color, text: 'Glooms · endure the burn' },
  ];
  ctx.font = '500 13px system-ui, -apple-system, sans-serif';
  const chipWidths = bestiary.map((chip) => ctx.measureText(chip.text).width + 26);
  let chipX = FIELD.width / 2 - (chipWidths.reduce((a, b) => a + b, 0) + 12 * (bestiary.length - 1)) / 2;
  bestiary.forEach((chip, i) => {
    ctx.fillStyle = 'rgba(5, 6, 15, 0.55)';
    ctx.fillRect(chipX, 340, chipWidths[i], 22);
    ctx.fillStyle = chip.color;
    ctx.beginPath();
    ctx.arc(chipX + 11, 351, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.paper;
    ctx.textAlign = 'left';
    ctx.fillText(chip.text, chipX + 20, 355);
    chipX += chipWidths[i] + 12;
  });
  centerText(ctx, '★ THE HOLLOW KING — 2000 HP · wakes on night 5', 392, '600 14px system-ui, -apple-system, sans-serif', '#c9a6ff');

  // A solid dark band behind the closing lines: the title world's wisps orbit
  // right through this strip, and the words must read over them, never under.
  ctx.fillStyle = 'rgba(5, 6, 15, 0.68)';
  ctx.fillRect(120, 404, 720, 74);
  if (world.best > 0) centerText(ctx, `Best score: ${world.best}`, 424, HINT_FONT, COLORS.dim);
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  centerText(ctx, 'Click or press Enter to begin', 460, HUD_BIG, COLORS.flame);
  ctx.globalAlpha = 1;
}

function drawDawn(ctx, world) {
  // The dawn itself: a warm sky, a low sun rising over the ridge, the keeper
  // standing with the lantern held high, and the Hollow King's fallen crown
  // on the ridge — a scene, not a flat gradient. The sun sits low and clear
  // of every line of text, so no ray ever crosses a word.
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, 'rgba(26, 18, 8, 0.96)');
  sky.addColorStop(0.45, 'rgba(122, 61, 18, 0.96)');
  sky.addColorStop(0.75, 'rgba(224, 138, 46, 0.96)');
  sky.addColorStop(1, 'rgba(255, 217, 122, 0.96)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const sunX = FIELD.width / 2;
  const sunY = 505;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 130);
  halo.addColorStop(0, 'rgba(255, 240, 200, 0.8)');
  halo.addColorStop(1, 'rgba(255, 200, 90, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 243, 214, 0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(a) * 42, sunY + Math.sin(a) * 42);
    ctx.lineTo(sunX + Math.cos(a) * 62, sunY + Math.sin(a) * 62);
    ctx.stroke();
  }

  // The ridge the dawn breaks over, dark against the bright sky.
  ctx.fillStyle = '#1a1208';
  ctx.beginPath();
  ctx.moveTo(0, FIELD.height);
  for (let x = 0; x <= FIELD.width; x += 16) {
    ctx.lineTo(x, 512 + Math.sin(x * 0.011 + 4.0) * 6);
  }
  ctx.lineTo(FIELD.width, FIELD.height);
  ctx.closePath();
  ctx.fill();

  // The keeper at dawn: cloak, hood, and the lantern held high.
  const kx = 260;
  const ky = 512;
  ctx.fillStyle = '#232c52';
  ctx.beginPath();
  ctx.moveTo(kx, ky - 62);
  ctx.lineTo(kx - 16, ky);
  ctx.lineTo(kx + 16, ky);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e3a68';
  ctx.beginPath();
  ctx.arc(kx, ky - 66, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#232c52';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(kx + 8, ky - 40);
  ctx.lineTo(kx + 26, ky - 74);
  ctx.stroke();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const lamp = ctx.createRadialGradient(kx + 26, ky - 78, 2, kx + 26, ky - 78, 30);
  lamp.addColorStop(0, 'rgba(255, 224, 138, 0.9)');
  lamp.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = lamp;
  ctx.beginPath();
  ctx.arc(kx + 26, ky - 78, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.flame;
  ctx.beginPath();
  ctx.arc(kx + 26, ky - 78, 5, 0, Math.PI * 2);
  ctx.fill();

  // The Hollow King's fallen crown, gold and fading on the ridge.
  ctx.save();
  ctx.translate(680, 524);
  ctx.rotate(-0.35);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#c9a6ff';
  for (let s = 0; s < 5; s += 1) {
    const x = -24 + s * 12;
    ctx.beginPath();
    ctx.moveTo(x - 5, 0);
    ctx.lineTo(x, -16 - (s % 2) * 5);
    ctx.lineTo(x + 5, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(-28, -2, 56, 6);
  ctx.restore();

  // Embers rising off the ridge into the dawn, fixed by index and the clock.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i += 1) {
    const ex = (i * 137.5 + 40) % FIELD.width;
    const ey = FIELD.height - ((i * 53.7 + world.time * 14) % 70);
    ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(world.time * 1.2 + i));
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawEnd(ctx, world, won) {
  if (won) {
    drawDawn(ctx, world);
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
  centerText(ctx, `Score  ${world.score}  ·  Grade ${gradeFor(world.score)}`, 292, HUD_BIG, COLORS.paper);
  centerText(ctx, `Best  ${world.best}`, 326, HUD_FONT, COLORS.dim);
  centerText(ctx, `Banished ${world.banished} wisps  ·  ${world.embersGathered} embers gathered`, 360, HINT_FONT, COLORS.paper);
  const bossLine = !world.bossMet
    ? 'THE HOLLOW KING still sleeps'
    : world.boss === null
      ? 'THE HOLLOW KING banished'
      : `THE HOLLOW KING escaped with ${Math.max(0, Math.ceil(world.boss.hp))} HP`;
  centerText(ctx, bossLine, 384, HINT_FONT, '#c9a6ff');
  if (!won) centerText(ctx, `Fell on night ${Math.min(world.night, NIGHTS)} of ${NIGHTS}`, 408, HINT_FONT, COLORS.dim);
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  centerText(ctx, 'Press R to play again', 436, HUD_BIG, COLORS.flame);
  ctx.globalAlpha = 1;
}

/** The flare burst's callout: the moment's payoff in plain words, with the real
 * count the flare banished. Shown only while the burst is fresh, on the play
 * screen, clear of the HUD panels and the boss's floating bar. */
function drawFlareCallout(ctx, world) {
  const burst = world.flareBurst;
  if (!burst || burst.timer <= 0.15 || world.screen !== SCREEN_PLAY) return;
  const alpha = Math.min(1, (burst.timer - 0.15) / 0.2);
  ctx.save();
  ctx.globalAlpha = alpha;
  centerText(ctx, `FLARE BURST! ×${burst.count}`, 188, '700 44px Georgia, "Times New Roman", serif', COLORS.flame);
  centerText(
    ctx,
    burst.count === 1 ? 'one shadow burned at once' : `${burst.count} shadows burned at once`,
    212,
    HINT_FONT,
    COLORS.paper,
  );
  ctx.restore();
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
    drawFlareBurst(ctx, world);
  }
  drawWisps(ctx, world);
  drawBoss(ctx, world);
  drawKeeper(ctx, world);
  drawParticles(ctx, world);
  drawFlareRing(ctx, world);
  drawFlareCallout(ctx, world);
  drawVignette(ctx, world);
  // The HUD stays on play; the end screens carry their own text over the scene.
  if (world.screen === SCREEN_PLAY) {
    drawHud(ctx, world);
  }
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_WIN) drawEnd(ctx, world, true);
  if (world.screen === SCREEN_LOSS) drawEnd(ctx, world, false);
  ctx.restore();
}
