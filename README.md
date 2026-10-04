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

## Play locally

Open `index.html` in a browser, or serve the folder with any static HTTP server:

```bash
python3 -m http.server
```

Then visit <http://localhost:8000>.

## Publish with GitHub Pages

visit <https://timmguthle.github.io/dobble/>