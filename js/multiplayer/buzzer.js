import { clearCard, renderCard } from "../card.js";
import { renderChoices, revealAnswer } from "../choices.js";
import { createDeck, sharedSymbol, shuffle } from "../deck.js";
import { scheduleFit } from "../fit.js";
import { symbolLabel } from "../symbols.js";
import { dom } from "./dom.js";
import {
  countdown, hideBoard, hideOverlay, renderRanking, setExtra, setScore, setStatus, showOverlay,
} from "./shared.js";

// Buzzer duel: two players at one keyboard. Both press their key to show
// the next cards; whoever spots the shared symbol presses their key first,
// the cards are hidden and that player picks the symbol. Right scores for
// them, wrong scores for the opponent. One deck: 28 rounds.
const ROUNDS = 28;
const KEYS = ["a", "l"];
const NAMES = ["Player 1", "Player 2"];
// A short countdown after both are ready, so the second to press does not
// know exactly when the cards appear.
const COUNTDOWN_STEPS = 3;
const COUNTDOWN_STEP_MS = 400;

export const hasKeyboard = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// phase: "off" (setup or another mode), "ready" (waiting for both keys),
// "countdown", "looking" (cards shown), "choosing" (buzzed), "done".
const duel = {
  phase: "off",
  deck: [],
  pair: [],
  shared: undefined,
  round: 0,
  scores: [0, 0],
  ready: [false, false],
  buzzer: null,
  cancelCountdown: () => {},
};

function stop() {
  duel.cancelCountdown();
  duel.phase = "off";
  duel.buzzer = null;
}

function playerState(player) {
  if (duel.phase === "ready") return duel.ready[player] ? "Ready" : `Press ${KEYS[player].toUpperCase()}`;
  if (duel.phase === "choosing" && duel.buzzer === player) return "Choosing…";
  return "";
}

function updatePlayers() {
  dom.duelPlayers.forEach((element, player) => {
    element.querySelector(".duel-score").textContent = duel.scores[player];
    element.querySelector(".duel-state").textContent = playerState(player);
    element.classList.toggle("is-ready", duel.phase === "ready" && duel.ready[player]);
    element.classList.toggle("is-buzzer", duel.phase === "choosing" && duel.buzzer === player);
  });
}

function showSetup() {
  stop();
  hideBoard();
  dom.buzzerSetup.hidden = false;
  dom.buzzerStartButton.disabled = !hasKeyboard;
  dom.buzzerTouchNote.hidden = hasKeyboard;
  setScore("Round", "—");
  setExtra();
  setStatus(hasKeyboard
    ? "Player 1 uses the A key, Player 2 the L key."
    : "The buzzer duel needs a keyboard.");
}

function startDuel() {
  stop();
  hideBoard();
  Object.assign(duel, { deck: shuffle(createDeck()), round: 0, scores: [0, 0] });
  dom.duelBar.hidden = false;
  waitForReady("Both players: press your key when you are ready.");
}

function waitForReady(message) {
  duel.phase = "ready";
  duel.ready = [false, false];
  if (duel.round === 0) {
    // Nothing to look at yet: show the empty cards with a prompt.
    dom.cards.hidden = false;
    showOverlay("Press A and L to start");
    scheduleFit();
  }
  setScore("Round", `${duel.round + 1} / ${ROUNDS}`);
  dom.round.textContent = `Round ${duel.round + 1} of ${ROUNDS}`;
  setStatus(message);
  updatePlayers();
}

function startCountdown() {
  duel.phase = "countdown";
  dom.choices.hidden = true;
  clearCard(dom.cardOne);
  clearCard(dom.cardTwo);
  dom.cards.hidden = false;
  scheduleFit();
  setStatus("Get ready…");
  updatePlayers();
  duel.cancelCountdown = countdown(COUNTDOWN_STEPS, COUNTDOWN_STEP_MS, String, showCards);
}

function showCards() {
  hideOverlay();
  const first = duel.deck.pop();
  const second = duel.deck.pop();
  duel.pair = [first, second];
  duel.shared = sharedSymbol(first, second);
  const ignorePick = () => {};
  renderCard(dom.cardOne, first, ignorePick);
  renderCard(dom.cardTwo, second, ignorePick);
  dom.cards.classList.add("is-display-only");
  duel.phase = "looking";
  setStatus("Spot the shared symbol, then hit your key!");
  updatePlayers();
}

function buzz(player) {
  duel.phase = "choosing";
  duel.buzzer = player;
  dom.cards.hidden = true;
  clearCard(dom.cardOne);
  clearCard(dom.cardTwo);
  renderChoices(dom.choices, [...new Set(duel.pair.flat())], pick);
  dom.choices.hidden = false;
  setStatus(`${NAMES[player]} was first: pick the shared symbol!`);
  updatePlayers();
}

function pick(button, symbol) {
  if (duel.phase !== "choosing") return;
  const buzzer = duel.buzzer;
  const right = revealAnswer(dom.choices, button, symbol, duel.shared);
  const scorer = right ? buzzer : 1 - buzzer;
  duel.scores[scorer] += 1;
  duel.round += 1;
  duel.buzzer = null;

  const message = right
    ? `Right! Point for ${NAMES[scorer]}.`
    : `Wrong, it was the ${symbolLabel(duel.shared)}. Point for ${NAMES[scorer]}.`;
  if (duel.round >= ROUNDS) {
    finish(message);
    return;
  }
  waitForReady(`${message} Both press your key for the next cards.`);
}

function finish(message) {
  duel.phase = "done";
  updatePlayers();
  dom.choices.hidden = true;
  const [one, two] = duel.scores;
  const title = one === two ? "It's a draw!" : `${NAMES[one > two ? 0 : 1]} wins!`;
  const rows = NAMES.map((name, player) => ({
    name,
    value: `${duel.scores[player]} point${duel.scores[player] === 1 ? "" : "s"}`,
    rank: -duel.scores[player],
  })).sort((a, b) => a.rank - b.rank);
  renderRanking(title, rows);
  setScore("Final", `${one} : ${two}`);
  dom.round.textContent = "";
  setStatus(`${message} That was the whole deck. ${title}`);
}

function handleKey(event) {
  if (duel.phase === "off" || duel.phase === "done") return;
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const player = KEYS.indexOf(event.key.toLowerCase());
  if (player === -1) return;
  event.preventDefault();

  if (duel.phase === "ready") {
    duel.ready[player] = true;
    updatePlayers();
    if (duel.ready.every(Boolean)) startCountdown();
  } else if (duel.phase === "looking") {
    buzz(player);
  }
}

export const buzzerMode = {
  title: "Buzzer duel",
  enter: showSetup,
  leave() {
    stop();
    hideBoard();
  },
  playAgain: startDuel,
};

dom.buzzerStartButton.addEventListener("click", startDuel);
window.addEventListener("keydown", handleKey);
