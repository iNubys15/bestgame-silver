// Boot and the frame loop: a fixed-step simulation, a canvas letterboxed to the field,
// and the ?shot= scenes the screenshots are taken from.
import { FIELD, STEP } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawWorld } from './render.js';
import { worldForShot } from './shots.js';
import { createWorld, stepWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const audio = createAudio();

let view = { scale: 1, offsetX: 0, offsetY: 0, width: FIELD.width, height: FIELD.height };

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const scale = Math.min(w / FIELD.width, h / FIELD.height);
  view = {
    scale: scale * dpr,
    offsetX: (w - FIELD.width * scale) / 2 * dpr,
    offsetY: (h - FIELD.height * scale) / 2 * dpr,
    width: w,
    height: h,
  };
}

function toField(clientX, clientY) {
  return {
    x: (clientX * (window.devicePixelRatio || 1) - view.offsetX) / view.scale,
    y: (clientY * (window.devicePixelRatio || 1) - view.offsetY) / view.scale,
  };
}

function render(world) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#05060f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  drawWorld(ctx, world);
}

function announce(world) {
  const line = world.screen === 'play'
    ? `Night ${world.night} of 5, light ${Math.ceil(world.light)}, score ${world.score}`
    : world.screen === 'win'
      ? `Dawn breaks. You survived. Score ${world.score}`
      : world.screen === 'loss'
        ? `The light is out. Score ${world.score}`
        : 'Emberwatch. Press Enter to begin.';
  if (status.textContent !== line) status.textContent = line;
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1) || 1;

resize();
window.addEventListener('resize', resize);

if (shot) {
  // A staged screenshot scene: play the real rules forward, draw once, and say so.
  const { world } = worldForShot(shot, seed);
  render(world);
  announce(world);
  window.__shotReady = true;
} else {
  const world = createWorld((Math.random() * 2147483647) | 0);
  const input = createInput(canvas, toField);
  let last = performance.now();
  let acc = 0;

  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    acc += elapsed;
    while (acc >= STEP) {
      stepWorld(world, input, STEP, audio);
      acc -= STEP;
    }
    render(world);
    announce(world);
    requestAnimationFrame(frame);
  }

  window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
  window.addEventListener('keydown', () => audio.unlock(), { once: true });
  requestAnimationFrame(frame);
}
