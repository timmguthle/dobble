import { buzzerMode, hasKeyboard } from "./buzzer.js";
import { dom } from "./dom.js";
import { relayMode } from "./relay.js";

// Multiplayer: games for several players on one device. Kept apart from
// single player; nothing here is saved to the Training statistics.
const modes = { buzzer: buzzerMode, relay: relayMode };
const modeButtons = { buzzer: dom.buzzerModeButton, relay: dom.relayModeButton };

// The buzzer duel needs a keyboard, so touch devices start on the relay.
let mode = hasKeyboard ? "buzzer" : "relay";

function showMode(nextMode) {
  mode = nextMode;
  for (const [name, button] of Object.entries(modeButtons)) {
    button.classList.toggle("is-active", name === mode);
  }
  dom.title.textContent = modes[mode].title;
  modes[mode].enter();
}

function selectMode(nextMode) {
  if (nextMode === mode) return;
  modes[mode].leave();
  showMode(nextMode);
}

export function enterMultiplayer() {
  showMode(mode);
}

export function leaveMultiplayer() {
  modes[mode].leave();
}

dom.buzzerModeButton.addEventListener("click", () => selectMode("buzzer"));
dom.relayModeButton.addEventListener("click", () => selectMode("relay"));
dom.newGameButton.addEventListener("click", () => modes[mode].enter());
dom.playAgainButton.addEventListener("click", () => modes[mode].playAgain());
