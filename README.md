# Dobble

A small, static browser game based on dobble

The game records finding times in the browser's local storage in **Training**
mode. The first Training pair is a warm-up and is not timed. Use **Pause game**
to view the current average, fastest and slowest finds, and the statistics for
all symbols, ordered by average finding time. Symbols that have not been found yet are shown as “No data yet”.
**One deck** mode uses every possible two-card round in one shuffled deck
(28 rounds, 56 cards), starts after a three-second countdown, and allows five
mistakes before the game is lost. It shows statistics for that game when the
deck is complete (or lost), including only symbols encountered in that game.
Its results are also added to the persistent Training statistics.

**Memory** mode tests recall instead of speed. Choose how long the cards are
shown (0.1–5 seconds, in 0.1 s steps), then press **Show cards** to start each round. The
cards disappear after that time and you pick the shared symbol from the 15
distinct symbols that were on them; time taken to choose does not matter. The
score shows correct answers out of rounds played, and **New game** lets you
pick a new viewing time.

**Multiplayer** is a separate part of the game for several players on one
device; choose it on the start screen. Its results are not saved to the
Training statistics.

- **Buzzer duel** (needs a keyboard): Player 1 uses the **A** key, Player 2
  the **L** key. Both press their key, and after a short countdown the cards
  appear. Whoever spots the shared symbol presses their key first; the cards
  are hidden and that player clicks the symbol among the 15 shown. Right
  scores a point for them, wrong scores it for the opponent. Then both press
  their key again for the next cards. A game is one deck (28 rounds).
- **Relay deck**: choose 2–8 players (A, B, C…). Each player in turn plays the
  same 28 card pairs, in the same order and with exactly the same symbol
  positions. There is no mistake limit; each mistake adds 3 seconds to that
  player's time. When everyone has played, the players are ranked by total
  time.

With a keyboard, the symbol to choose in Memory mode and the Buzzer duel can
also be picked by key. The 15 symbols sit in a 5 × 3 grid, and so do the keys
in the middle of the keyboard:

```text
E R T Z U
 D F G H J
X C V B N
```

Each symbol shows its key while you choose. The keys are matched by their
position, so the grid also works on an American keyboard; there the browser
shows Y instead of Z where it can read the layout (Chrome, Edge).

Every card gets a fresh random layout: each symbol's position, size and
rotation is chosen anew whenever a card is drawn. The page adapts to phone
screens (portrait and landscape), so both cards fit on screen at once.

## Project structure

```text
index.html            Page markup
css/styles.css        Styles, including the phone layouts
js/app.js             Entry point: start screen, single player / multiplayer
js/main.js            Single player game flow: modes, rounds, timer, pause, countdown
js/memory.js          Memory mode: timed reveal, symbol choice, score
js/choices.js         Grid of symbols to pick the shared one from, by click or key
js/multiplayer/       Multiplayer: Buzzer duel, Relay deck and their shared helpers
js/deck.js            Deck construction (projective plane of order 7), shuffle
js/layout.js          Random, non-overlapping symbol placement on a card
js/card.js            Renders a card's symbol buttons
js/statistics.js      Statistics panel and one-deck timeline
js/storage.js         Saved Training results in localStorage
js/symbols.js         Symbol names and asset paths
js/dom.js             References to the single player page elements
assets/symbols/       Symbol artwork (SVG)
docs/                 Reference material
```

## Play locally

The scripts are ES modules, which browsers do not load from `file://` URLs,
so serve the folder with any static HTTP server:

```bash
python3 -m http.server
```

Then visit <http://localhost:8000>.

## Publish with GitHub Pages

visit <https://timmguthle.github.io/dobble/>