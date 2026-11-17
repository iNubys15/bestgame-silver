# EMBERWATCH — Five Nights of the Hollow

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/inubys15/bestgame-silver/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/inubys15/bestgame-silver/reward.svg)](https://make.fun/bounty/best-game-01)

A lantern-keeper arcade game for the [make.fun best-game-01](https://make.fun/bounty/best-game-01) bounty.
You are the keeper of the last lantern in a dark hollow. Light is your weapon and your life:
burn the shadow wisps with your beam, gather fallen embers to feed the flame, and survive
all five nights until dawn breaks. When the light dies, the dark takes the hollow.

## How to play

- **Move** — WASD or arrow keys
- **Aim the beam** — mouse (wisps caught in the light burn away)
- **Flare** — Space or click (a bright burst that burns nearby wisps, costs light)
- **Start / restart** — Enter or R

Survive 5 nights to win. Each night the wisps come faster and thicker. Embers restore
light (+16) and score (+5). Banishing a wisp scores 10 × your combo; a wisp that touches
you steals 14 light and breaks the combo.

## Run it

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

Build the entry (copies `game/` and `screenshots/` to `/output` with the dossier):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Tech

Plain static files, no build step, no network requests: one HTML page, ES modules under
`game/src/`, canvas 2D rendering, procedural WebAudio sounds. Node 22 standard library
only for `main.ts` and `serve.ts`.
