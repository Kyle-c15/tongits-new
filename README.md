# Tongits Rush Meld

A portrait, mobile-first Tongits-inspired 30-second layered-card challenge built with static HTML, CSS, and JavaScript.

## Run

Open `index.html` directly, or serve this folder with any static web server.

## Rules

- Only cards that are not covered by a higher layer can be selected.
- Select exactly 3 cards of the same rank and different suits to make a set.
- Select exactly 3 consecutive cards of the same suit to make a run.
- Meld again within 4 seconds to build the combo bonus.
- The fixed level can be shared with a local score-to-beat link without requiring a backend.

## Project files

- `index.html`: start, game, and results screens.
- `styles.css`: stitched table background, responsive layout, cards, and animation.
- `game.js`: dynamic card composition, blocking, Meld validation, scoring, hints, and local results.
- `LEVEL_DESIGN.md`: the fixed 51-card, seven-layer reference-matched level specification.
- `asset/`: the supplied background and card component images.

All card faces are composed at runtime from the blank face, rank, and suit assets. No backend or online leaderboard is used.
