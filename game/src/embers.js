// Fallen embers: the light the keeper lives on. They drift down from the top of the
// hollow, sway as they fall, and feed the lantern when gathered.
import { EMBER, FIELD } from './config.js';
import { range } from './random.js';

export function createEmber(rng, x, y) {
  return {
    x: x !== undefined ? x : range(rng, 30, FIELD.width - 30),
    y: y !== undefined ? y : -12,
    phase: rng() * Math.PI * 2,
    life: EMBER.lifeSeconds,
  };
}

/** Let every ember drift down and sway; the old ones fade out at the floor. */
export function stepEmbers(embers, dt, time) {
  for (let i = embers.length - 1; i >= 0; i -= 1) {
    const ember = embers[i];
    ember.y += EMBER.fallSpeed * dt;
    ember.x += Math.sin(time * 2.2 + ember.phase) * 14 * dt;
    ember.life -= dt;
    if (ember.y > FIELD.height + 12 || ember.life <= 0) embers.splice(i, 1);
  }
}
