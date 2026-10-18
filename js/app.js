import { initCardFit, scheduleFit } from "./fit.js";
import { enterSinglePlayer, leaveSinglePlayer } from "./main.js";
import { enterMultiplayer, leaveMultiplayer } from "./multiplayer/index.js";

// The start screen and the two games are separate screens. The address
// (#single, #multi) says which one is showing, so a reload stays put and the
// browser's back button returns to the start screen.
const screens = {
  home: { element: document.querySelector("#home"), enter() {}, leave() {} },
  single: {
    element: document.querySelector("#single"),
    enter: enterSinglePlayer,
    leave: leaveSinglePlayer,
  },
  multi: {
    element: document.querySelector("#multi"),
    enter: enterMultiplayer,
    leave: leaveMultiplayer,
  },
};

let current;

function showScreen() {
  const name = location.hash.slice(1);
  const next = screens[name] ? name : "home";
  if (next === current) return;

  if (current) {
    screens[current].leave();
    screens[current].element.hidden = true;
  }
  current = next;
  screens[next].element.hidden = false;
  window.scrollTo(0, 0);
  screens[next].enter();
  scheduleFit();
}

window.addEventListener("hashchange", showScreen);
showScreen();
initCardFit();
