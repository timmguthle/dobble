import { dom } from "./dom.js";
import { SYMBOLS, symbolLabel } from "./symbols.js";

export function formatTime(time) {
  return `${time.toFixed(2)} s`;
}

function averagesBySymbol(results) {
  const bySymbol = new Map();
  results.forEach(({ symbol, time }) => {
    const entry = bySymbol.get(symbol) || { total: 0, count: 0 };
    entry.total += time;
    entry.count += 1;
    bySymbol.set(symbol, entry);
  });
  return bySymbol;
}

function renderSymbolRanking(results, includeUnseen) {
  const bySymbol = averagesBySymbol(results);
  const symbols = includeUnseen ? SYMBOLS.map((_, symbol) => symbol) : [...bySymbol.keys()];

  const items = symbols
    .map((symbol) => {
      const entry = bySymbol.get(symbol);
      return entry
        ? { symbol, average: entry.total / entry.count, count: entry.count }
        : { symbol, average: null, count: 0 };
    })
    .sort((a, b) => {
      if (a.average === null) return b.average === null ? a.symbol - b.symbol : 1;
      if (b.average === null) return -1;
      return a.average - b.average;
    })
    .map((entry) => {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = symbolLabel(entry.symbol);
      const time = document.createElement("span");
      time.textContent = entry.count === 0
        ? "No data yet"
        : `${formatTime(entry.average)} average · ${entry.count} find${entry.count === 1 ? "" : "s"}`;
      item.append(name, time);
      return item;
    });

  dom.symbolRanking.replaceChildren(...items);
}

function renderTimeline(results) {
  const slowestTime = Math.max(...results.map((result) => result.time));

  dom.timeline.replaceChildren(...results.map((result, index) => {
    const row = document.createElement("div");
    row.className = "timeline-row";

    const label = document.createElement("div");
    label.className = "timeline-label";
    label.textContent = `${index + 1}. ${symbolLabel(result.symbol)}`;

    const track = document.createElement("div");
    track.className = "timeline-track";
    const bar = document.createElement("div");
    bar.className = "timeline-bar";
    bar.style.width = `${Math.max(8, (result.time / slowestTime) * 100)}%`;
    track.append(bar);

    const time = document.createElement("span");
    time.className = "timeline-time";
    time.textContent = formatTime(result.time);

    row.append(label, track, time);
    return row;
  }));
}

// `includeUnseen` lists every symbol (Training); `showTimeline` adds the
// per-round find times (One deck).
export function renderStatistics(results, { includeUnseen, showTimeline }) {
  dom.roundsPlayed.textContent = results.length;
  dom.deckTimeline.hidden = !showTimeline;
  dom.timeline.replaceChildren();

  if (results.length === 0) {
    dom.averageTime.textContent = "—";
    dom.fastestTime.textContent = "—";
    dom.slowestTime.textContent = "—";
    const empty = document.createElement("li");
    empty.textContent = "Find a few symbols to build your ranking.";
    dom.symbolRanking.replaceChildren(empty);
    return;
  }

  const times = results.map((result) => result.time);
  dom.averageTime.textContent = formatTime(times.reduce((sum, time) => sum + time, 0) / times.length);
  dom.fastestTime.textContent = formatTime(Math.min(...times));
  dom.slowestTime.textContent = formatTime(Math.max(...times));

  renderSymbolRanking(results, includeUnseen);
  if (showTimeline) renderTimeline(results);
}
