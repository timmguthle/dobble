import { shuffle } from "./deck.js";
import { symbolLabel, symbolUrl } from "./symbols.js";

// The grid is 5 × 3, so each symbol also gets a key from the 5 × 3 block in
// the middle of the keyboard, matched by position (event.code) so it works
// on any layout. The labels are the German ones; where the browser can read
// the actual layout (Chrome, Edge), the keys show what is printed on them,
// for example Y instead of Z on an American keyboard.
const KEY_CODES = [
  "KeyE", "KeyR", "KeyT", "KeyY", "KeyU",
  "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ",
  "KeyX", "KeyC", "KeyV", "KeyB", "KeyN",
];
const keyLabels = new Map([
  ["KeyE", "E"], ["KeyR", "R"], ["KeyT", "T"], ["KeyY", "Z"], ["KeyU", "U"],
  ["KeyD", "D"], ["KeyF", "F"], ["KeyG", "G"], ["KeyH", "H"], ["KeyJ", "J"],
  ["KeyX", "X"], ["KeyC", "C"], ["KeyV", "V"], ["KeyB", "B"], ["KeyN", "N"],
]);

navigator.keyboard?.getLayoutMap?.()
  .then((layout) => {
    for (const code of KEY_CODES) {
      const label = layout.get(code);
      if (label) keyLabels.set(code, label.toUpperCase());
    }
  })
  .catch(() => {
    // Not allowed here (for example inside a frame); keep the German labels.
  });

// The grid currently waiting for an answer, if any.
let activeGrid;

// A grid of symbol buttons to pick the shared symbol from, once the cards
// are hidden (Memory mode, Buzzer duel).
export function renderChoices(container, symbols, onPick) {
  container.classList.remove("is-answered");
  container.replaceChildren(...shuffle(symbols).map((symbol, index) => {
    const button = document.createElement("button");
    button.className = "memory-choice";
    button.type = "button";
    button.dataset.symbol = symbol;
    button.setAttribute("aria-label", symbolLabel(symbol));

    const image = document.createElement("img");
    image.alt = "";
    image.src = symbolUrl(symbol);
    image.draggable = false;
    button.append(image);

    const code = KEY_CODES[index];
    if (code) {
      const key = document.createElement("kbd");
      key.className = "choice-key";
      key.textContent = keyLabels.get(code);
      key.setAttribute("aria-hidden", "true");
      button.append(key);
      button.setAttribute("aria-keyshortcuts", keyLabels.get(code));
    }
    button.addEventListener("click", () => onPick(button, symbol));
    return button;
  }));
  activeGrid = container;
}

// Marks the picked button right or wrong (and, if wrong, the right one) and
// locks the grid. Returns whether the pick was right.
export function revealAnswer(container, button, symbol, shared) {
  container.classList.add("is-answered");
  if (symbol === shared) {
    button.classList.add("is-correct");
    return true;
  }
  button.classList.add("is-wrong");
  container.querySelector(`[data-symbol="${shared}"]`).classList.add("is-correct");
  return false;
}

function handleKey(event) {
  // Only while the grid is on screen and not answered yet.
  if (!activeGrid || activeGrid.closest("[hidden]")) return;
  if (activeGrid.classList.contains("is-answered")) return;
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const index = KEY_CODES.indexOf(event.code);
  const button = activeGrid.children[index];
  if (index === -1 || !button) return;
  event.preventDefault();
  button.click();
}

window.addEventListener("keydown", handleKey);
