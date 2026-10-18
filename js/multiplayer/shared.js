import { clearCard } from "../card.js";
import { dom } from "./dom.js";

export function setStatus(message) {
  dom.status.textContent = message;
}

export function setScore(label, value) {
  dom.scoreLabel.textContent = label;
  dom.score.textContent = value;
}

// The score panel's second line; pass no label to hide it.
export function setExtra(label, value) {
  dom.extraLabel.hidden = !label;
  dom.extra.hidden = !label;
  if (!label) return;
  dom.extraLabel.textContent = label;
  dom.extra.textContent = value;
}

export function showOverlay(message) {
  dom.overlayMessage.textContent = message;
  dom.overlay.hidden = false;
}

export function hideOverlay() {
  dom.overlay.hidden = true;
}

// Hides every panel, the cards and the choices, so a mode can show just
// what it needs.
export function hideBoard() {
  for (const element of [
    dom.buzzerSetup, dom.duelBar, dom.relaySetup, dom.relayHandover, dom.results,
  ]) {
    element.hidden = true;
  }
  dom.choices.hidden = true;
  dom.choices.replaceChildren();
  dom.cards.hidden = true;
  dom.cards.classList.remove("is-display-only");
  clearCard(dom.cardOne);
  clearCard(dom.cardTwo);
  hideOverlay();
  dom.round.textContent = "";
}

// Shows `steps`, `steps - 1`, …, 1 on the overlay, `stepMs` apart, then
// calls `onDone`. Returns a function that cancels it.
export function countdown(steps, stepMs, format, onDone) {
  let left = steps;
  showOverlay(format(left));
  const interval = window.setInterval(() => {
    left -= 1;
    if (left > 0) {
      showOverlay(format(left));
      return;
    }
    window.clearInterval(interval);
    onDone();
  }, stepMs);
  return () => window.clearInterval(interval);
}

// Rows of { name, value, detail }, best first; rows with the same `rank`
// share a place.
export function renderRanking(title, rows) {
  dom.resultsTitle.textContent = title;
  dom.ranking.replaceChildren(...rows.map((row) => {
    const place = rows.findIndex((other) => other.rank === row.rank) + 1;
    const item = document.createElement("li");
    item.classList.toggle("is-winner", place === 1);

    const placeLabel = document.createElement("span");
    placeLabel.className = "ranking-place";
    placeLabel.textContent = `${place}.`;
    const name = document.createElement("strong");
    name.className = "ranking-name";
    name.textContent = row.name;
    const value = document.createElement("strong");
    value.className = "ranking-value";
    value.textContent = row.value;
    item.append(placeLabel, name, value);

    if (row.detail) {
      const detail = document.createElement("span");
      detail.className = "ranking-detail";
      detail.textContent = row.detail;
      item.append(detail);
    }
    return item;
  }));
  dom.results.hidden = false;
}
