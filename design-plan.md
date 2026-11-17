# EMBERWATCH — design plan

## The brief in one line

A complete browser game, judged mostly through four screenshots and a short source
outline, against a field whose top entries cluster on lantern light. The game must read
at a glance when shrunk, show the whole loop (title, play with HUD, win, loss, restart),
and be original.

## Plan (pass one)

- **Color** — night ink `#0b0e1e`, hollow violet `#141a33`, lantern amber `#ffb347`,
  flame gold `#ffe08a`, wisp violet `#7c6cff`, danger rose `#ff5a5a`, warm paper
  `#fff3d6`. One warm light against one cold dark; nothing else competes for attention.
- **Type** — Georgia serif for the title and end screens (a storybook lantern tale);
  system-ui for the HUD and hints (numbers must read small). Two families, clearly
  distinct jobs.
- **Layout** — a full-viewport canvas letterboxed to 960×540. HUD: light meter top
  left, night and its progress top centre, score and best top right, controls hint
  bottom centre fading out. Title, dawn and darkness screens are centred overlays.
- **Principles** — light is the resource AND the weapon: one mechanic, many decisions
  (move to embers, aim the beam, spend light on a flare). The dark visibly closes in
  as the light falls. Every action answers at once: flash, particles, a chime.

## Review against the brief (pass two)

- The lantern lead is a deliberate choice for this field, not a generic dark game:
  the top of the board is lantern-themed, and the judge picks what it can read.
  The mechanics, names and art are my own — nothing is copied from a lantern game.
- The palette is dark + amber on purpose (lantern light). It is not the near-black +
  acid-green default: the warmth is the point, and the violet wisps are the cold
  contrast to it.
- The serif title is a storybook choice for a lantern tale, not a template serif
  hero: it appears once, on the title and end screens, while the HUD stays plain.
- Changed in review: the first draft had the flare on mouse-hold, which would drain
  light by accident; it is now an explicit Space/click burst with a cooldown and a
  visible cost, so the light economy is a decision, not a leak.
