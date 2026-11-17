// Keyboard and mouse state. The game reads this once per fixed step, never from events
// mid-step, so a frame's input is one consistent snapshot.
export function createInput(canvas, toField) {
  const input = {
    keys: new Set(),
    pressed: new Set(),
    mouse: { x: 0, y: 0, down: false },
    clicked: false,
  };

  const MOVE_CODES = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  ]);

  window.addEventListener('keydown', (event) => {
    if (MOVE_CODES.has(event.code) || event.code === 'Space') event.preventDefault();
    if (!event.repeat) input.pressed.add(event.code);
    input.keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouse.down = false;
  });

  function trackMouse(event) {
    const rect = canvas.getBoundingClientRect();
    const point = toField(event.clientX - rect.left, event.clientY - rect.top);
    input.mouse.x = point.x;
    input.mouse.y = point.y;
  }
  canvas.addEventListener('mousemove', trackMouse);
  canvas.addEventListener('mousedown', (event) => {
    trackMouse(event);
    input.mouse.down = true;
    input.clicked = true;
  });
  window.addEventListener('mouseup', () => {
    input.mouse.down = false;
  });

  return input;
}

/** Normalised movement direction from the held keys, or {x: 0, y: 0}. */
export function moveAxis(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) {
    const len = Math.hypot(x, y);
    x /= len;
    y /= len;
  }
  return { x, y };
}

/** True once for a key pressed since the last step; call once per step per code. */
export function wasPressed(input, code) {
  return input.pressed.has(code);
}

/** Clear the edge-triggered sets at the end of a step. */
export function endStep(input) {
  input.pressed.clear();
  input.clicked = false;
}
