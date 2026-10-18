import { shuffle } from "./deck.js";
import { symbolLabel, symbolUrl } from "./symbols.js";

// A grid of symbol buttons to pick the shared symbol from, once the cards
// are hidden (Memory mode, Buzzer duel).
export function renderChoices(container, symbols, onPick) {
  container.classList.remove("is-answered");
  container.replaceChildren(...shuffle(symbols).map((symbol) => {
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
    button.addEventListener("click", () => onPick(button, symbol));
    return button;
  }));
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
