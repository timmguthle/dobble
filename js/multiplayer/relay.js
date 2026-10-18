import { flashWrong, renderCard } from "../card.js";
import { createDeck, sharedSymbol, shuffle } from "../deck.js";
import { scheduleFit } from "../fit.js";
import { randomLayout } from "../layout.js";
import { formatTime } from "../statistics.js";
import { dom } from "./dom.js";
import {
  countdown, hideBoard, hideOverlay, renderRanking, setExtra, setScore, setStatus,
} from "./shared.js";

// Relay deck: players A, B, C… take turns playing the same one-deck game:
// the same 28 card pairs in the same order, drawn exactly the same way.
// Each mistake adds a time penalty; the fastest total time wins.
const ROUNDS = 28;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const PENALTY_SECONDS = 3;
const COUNTDOWN_SECONDS = 3;
const NEXT_ROUND_DELAY = 500;

const relay = {
  playerCount: MIN_PLAYERS,
  // { first, second, shared, layouts }, made once per game.
  rounds: [],
  // { name, findTime, mistakes }
  players: [],
  current: 0,
  roundIndex: 0,
  roundStartedAt: 0,
  roundResolved: true,
  cancelCountdown: () => {},
  nextRoundTimeout: undefined,
};

const letter = (index) => String.fromCharCode(65 + index);
const totalTime = (player) => player.findTime + player.mistakes * PENALTY_SECONDS;
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

function stop() {
  relay.cancelCountdown();
  window.clearTimeout(relay.nextRoundTimeout);
  relay.roundResolved = true;
}

function createRounds() {
  const deck = shuffle(createDeck());
  return Array.from({ length: ROUNDS }, () => {
    const first = deck.pop();
    const second = deck.pop();
    return {
      first,
      second,
      shared: sharedSymbol(first, second),
      layouts: [randomLayout(first.length), randomLayout(second.length)],
    };
  });
}

function renderPlayerCount() {
  dom.relayCount.textContent = relay.playerCount;
  dom.relayFewerButton.disabled = relay.playerCount <= MIN_PLAYERS;
  dom.relayMoreButton.disabled = relay.playerCount >= MAX_PLAYERS;
  dom.relayChips.replaceChildren(...Array.from({ length: relay.playerCount }, (_, index) => {
    const chip = document.createElement("li");
    chip.textContent = letter(index);
    return chip;
  }));
  setScore("Players", relay.playerCount);
}

function changePlayerCount(change) {
  relay.playerCount = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, relay.playerCount + change));
  renderPlayerCount();
}

function showSetup() {
  stop();
  hideBoard();
  dom.relaySetup.hidden = false;
  renderPlayerCount();
  setExtra();
  setStatus("Choose how many players take turns on this device.");
}

function startRelay() {
  stop();
  relay.rounds = createRounds();
  relay.players = Array.from({ length: relay.playerCount }, (_, index) => ({
    name: letter(index),
    findTime: 0,
    mistakes: 0,
  }));
  relay.current = 0;
  showHandover();
}

function showHandover() {
  hideBoard();
  const player = relay.players[relay.current];
  const previous = relay.players[relay.current - 1];
  dom.relayPrevious.hidden = !previous;
  if (previous) dom.relayPrevious.textContent = `Player ${previous.name} finished in ${formatTime(totalTime(previous))}.`;
  dom.relayPlayer.textContent = `Player ${player.name}`;
  dom.relayHandover.hidden = false;
  dom.relayGoButton.focus({ preventScroll: true });
  setScore("Player", player.name);
  setExtra("Mistakes", 0);
  dom.round.textContent = `Turn ${relay.current + 1} of ${relay.players.length}`;
  setStatus(`Pass the device to Player ${player.name}.`);
}

function startTurn() {
  const player = relay.players[relay.current];
  dom.relayHandover.hidden = true;
  dom.cards.hidden = false;
  scheduleFit();
  setStatus(`Player ${player.name}, get ready!`);
  relay.cancelCountdown = countdown(
    COUNTDOWN_SECONDS,
    1000,
    (seconds) => `Player ${player.name} starts in ${seconds}…`,
    () => {
      hideOverlay();
      relay.roundIndex = 0;
      nextRound();
    },
  );
}

function nextRound() {
  if (relay.roundIndex >= ROUNDS) {
    endTurn();
    return;
  }
  const { first, second, shared, layouts } = relay.rounds[relay.roundIndex];
  const onPick = (button, symbol) => handlePick(button, symbol, shared);
  renderCard(dom.cardOne, first, onPick, layouts[0]);
  renderCard(dom.cardTwo, second, onPick, layouts[1]);
  dom.round.textContent = `Round ${relay.roundIndex + 1} of ${ROUNDS}`;
  relay.roundResolved = false;
  relay.roundStartedAt = performance.now();
  setStatus("There is exactly one symbol shared by both cards.");
}

function handlePick(button, symbol, shared) {
  if (relay.roundResolved) return;
  const player = relay.players[relay.current];

  if (symbol === shared) {
    relay.roundResolved = true;
    player.findTime += (performance.now() - relay.roundStartedAt) / 1000;
    button.classList.add("is-correct");
    relay.roundIndex += 1;
    setStatus("Correct!");
    relay.nextRoundTimeout = window.setTimeout(nextRound, NEXT_ROUND_DELAY);
    return;
  }

  player.mistakes += 1;
  setExtra("Mistakes", player.mistakes);
  flashWrong(button);
  setStatus(`Not that one: +${PENALTY_SECONDS} s. Keep looking!`);
}

function endTurn() {
  relay.current += 1;
  if (relay.current < relay.players.length) {
    showHandover();
    return;
  }
  showResults();
}

function showResults() {
  hideBoard();
  const ranked = [...relay.players].sort((a, b) => totalTime(a) - totalTime(b));
  const winner = ranked[0];
  renderRanking(`Player ${winner.name} wins!`, ranked.map((player) => ({
    name: `Player ${player.name}`,
    value: formatTime(totalTime(player)),
    rank: totalTime(player),
    detail: `${formatTime(player.findTime)} finding · ${plural(player.mistakes, "mistake")}`
      + (player.mistakes ? ` (+${player.mistakes * PENALTY_SECONDS} s)` : ""),
  })));
  setScore("Winner", winner.name);
  setExtra();
  setStatus("Everyone has played. Here is the ranking by total time.");
}

export const relayMode = {
  title: "Relay deck",
  enter: showSetup,
  leave() {
    stop();
    hideBoard();
  },
  playAgain: startRelay,
};

dom.relayFewerButton.addEventListener("click", () => changePlayerCount(-1));
dom.relayMoreButton.addEventListener("click", () => changePlayerCount(1));
dom.relaySetup.addEventListener("submit", (event) => {
  event.preventDefault();
  startRelay();
});
dom.relayGoButton.addEventListener("click", startTurn);
