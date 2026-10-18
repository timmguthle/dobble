import { randomLayout } from "./layout.js";
import { symbolLabel, symbolUrl } from "./symbols.js";

// Pass a `layout` from randomLayout to draw the card exactly as before;
// otherwise every call places the symbols anew.
export function renderCard(element, symbols, onPick, layout = randomLayout(symbols.length)) {
  element.replaceChildren(...symbols.map((symbol, index) => {
    const { x, y, size, rotation } = layout[index];
    const button = document.createElement("button");
    button.className = "symbol";
    button.type = "button";
    button.dataset.symbol = symbol;
    button.setAttribute("aria-label", symbolLabel(symbol));
    button.style.left = `${x - size / 2}%`;
    button.style.top = `${y - size / 2}%`;
    button.style.width = `${size}%`;
    button.style.height = `${size}%`;
    button.style.setProperty("--rotation", `${rotation}deg`);

    const image = document.createElement("img");
    image.alt = "";
    image.src = symbolUrl(symbol);
    image.draggable = false;
    button.append(image);
    button.addEventListener("click", () => onPick(button, symbol));
    return button;
  }));
}

export function clearCard(element) {
  element.replaceChildren();
}

// Restart the shake animation even if it is still running.
export function flashWrong(button) {
  button.classList.remove("is-wrong");
  void button.offsetWidth;
  button.classList.add("is-wrong");
}
