import { renderCard, clearCard } from "./card.js";
import { createDeck, sharedSymbol, shuffle } from "./deck.js";
import { dom } from "./dom.js";
import { enterMemoryMode, exitMemoryMode, showMemorySetup } from "./memory.js";
import { renderStatistics } from "./statistics.js";
import { appendResult, clearResults, loadResults } from "./storage.js";

const DECK_ROUNDS = 28;
const MAX_MISTAKES = 5;
const COUNTDOWN_SECONDS = 3;
const NEXT_ROUND_DELAY = 500;
const DEFAULT_STATUS = "There is exactly one symbol shared by both cards.";

const state = {
  mode: "training",
  deck: [],
  sessionResults: [],
  score: 0,
  round: 1,
  mistakes: 0,
  timerStartedAt: 0,
  elapsedBeforePause: 0,
  isPaused: false,
  roundResolved: false,
  // The first Training pair is a warm-up and is not timed.
  hasStartedTimer: false,
  countdownInterval: undefined,
  countdownToken: 0,
  nextRoundTimeout: undefined,
};

const isDeckMode = () => state.mode === "deck";

function setStatus(message) {
  dom.status.textContent = message;
}

function showDeckOverlay(message) {
  dom.deckOverlayMessage.textContent = message;
  dom.deckOverlay.hidden = false;
}

function hideDeckOverlay() {
  dom.deckOverlay.hidden = true;
}

function currentResults() {
  return isDeckMode() ? state.sessionResults : loadResults();
}

function showStatistics(results = currentResults()) {
  renderStatistics(results, { includeUnseen: !isDeckMode(), showTimeline: isDeckMode() });
}

function recordResult(symbol, time) {
  const result = { symbol, time, date: new Date().toISOString() };
  if (isDeckMode()) state.sessionResults.push(result);
  appendResult(result);
}

function endDeckGame(statusMessage, overlayMessage) {
  state.isPaused = true;
  setStatus(statusMessage);
  showDeckOverlay(overlayMessage);
  dom.pauseButton.hidden = true;
  dom.newGameButton.hidden = false;
  dom.statistics.hidden = false;
  dom.resumeButton.hidden = true;
  showStatistics(state.sessionResults);
}

function handlePick(button, symbol, shared) {
  if (state.isPaused || state.roundResolved || dom.cards.hidden) return;

  if (symbol === shared) {
    state.roundResolved = true;
    if (isDeckMode() || state.hasStartedTimer) {
      recordResult(symbol, (performance.now() - state.timerStartedAt) / 1000);
    }
    state.hasStartedTimer = true;
    state.score += 1;
    dom.score.textContent = state.score;
    button.classList.add("is-correct");
    setStatus("Correct! Loading the next pair...");
    state.nextRoundTimeout = window.setTimeout(nextRound, NEXT_ROUND_DELAY);
    return;
  }

  if (isDeckMode()) {
    state.mistakes += 1;
    dom.mistakes.textContent = `${state.mistakes} / ${MAX_MISTAKES}`;
    if (state.mistakes >= MAX_MISTAKES) {
      state.roundResolved = true;
      endDeckGame("You lost this game after five mistakes.", "Du bist noch schlechter als Christoph!");
      return;
    }
  }

  // Restart the shake animation even if it is still running.
  button.classList.remove("is-wrong");
  void button.offsetWidth;
  button.classList.add("is-wrong");
  setStatus("Not that one — keep looking!");
}

function nextRound() {
  if (state.deck.length < 2) {
    if (isDeckMode()) {
      finishDeckGame();
      return;
    }
    state.deck = shuffle(createDeck());
  }

  const first = state.deck.pop();
  const second = state.deck.pop();
  const shared = sharedSymbol(first, second);
  const onPick = (button, symbol) => handlePick(button, symbol, shared);
  renderCard(dom.cardOne, first, onPick);
  renderCard(dom.cardTwo, second, onPick);

  dom.roundCounter.textContent = `Round ${state.round}`;
  state.round += 1;
  state.roundResolved = false;
  state.elapsedBeforePause = 0;
  state.timerStartedAt = performance.now();
  setStatus(DEFAULT_STATUS);
}

function finishDeckGame() {
  const message = state.score >= DECK_ROUNDS ? "Deck complete!" : "You lost this game.";
  endDeckGame(`${message} Here are your statistics for this game.`, message);
}

function beginGame() {
  Object.assign(state, {
    isPaused: false,
    score: 0,
    round: 1,
    mistakes: 0,
    hasStartedTimer: isDeckMode(),
    deck: shuffle(createDeck()),
    sessionResults: [],
  });
  dom.score.textContent = state.score;
  dom.mistakes.textContent = `0 / ${MAX_MISTAKES}`;
  nextRound();

  dom.cards.hidden = false;
  hideDeckOverlay();
  dom.statistics.hidden = true;
  dom.pauseButton.hidden = false;
  dom.resumeButton.hidden = false;
  dom.clearStatisticsButton.textContent = isDeckMode()
    ? "Clear game statistics"
    : "Clear saved statistics";
  dom.statisticsTitle.textContent = isDeckMode() ? "Game statistics" : "Training statistics";
  showStatistics();
}

function cancelCountdown() {
  state.countdownToken += 1;
  window.clearInterval(state.countdownInterval);
  window.clearTimeout(state.nextRoundTimeout);
}

function startDeckCountdown() {
  cancelCountdown();
  const token = state.countdownToken;
  dom.startDeckGameButton.disabled = true;
  dom.newGameButton.hidden = true;
  let seconds = COUNTDOWN_SECONDS;
  showDeckOverlay(`Game starts in ${seconds}...`);
  state.countdownInterval = window.setInterval(() => {
    if (token !== state.countdownToken) {
      window.clearInterval(state.countdownInterval);
      return;
    }
    seconds -= 1;
    if (seconds === 0) {
      window.clearInterval(state.countdownInterval);
      dom.startDeckGameButton.hidden = true;
      beginGame();
      return;
    }
    showDeckOverlay(`Game starts in ${seconds}...`);
  }, 1000);
}

function startGame() {
  if (state.mode === "memory") {
    showMemorySetup();
    return;
  }
  if (isDeckMode()) {
    startDeckCountdown();
    return;
  }
  beginGame();
}

function selectMode(nextMode) {
  if (state.mode === nextMode) return;
  cancelCountdown();
  if (state.mode === "memory") {
    exitMemoryMode();
    dom.score.textContent = state.score;
  }
  state.mode = nextMode;
  dom.trainingModeButton.classList.toggle("is-active", nextMode === "training");
  dom.deckModeButton.classList.toggle("is-active", nextMode === "deck");
  dom.memoryModeButton.classList.toggle("is-active", nextMode === "memory");
  dom.mistakesLabel.hidden = !isDeckMode();
  dom.mistakes.hidden = !isDeckMode();

  if (nextMode === "memory") {
    // Memory mode runs its own rounds; keep the timed game from reacting.
    state.isPaused = true;
    hideDeckOverlay();
    dom.startDeckGameButton.hidden = true;
    dom.pauseButton.hidden = true;
    dom.statistics.hidden = true;
    enterMemoryMode();
    return;
  }

  if (isDeckMode()) {
    dom.cards.hidden = false;
    clearCard(dom.cardOne);
    clearCard(dom.cardTwo);
    showDeckOverlay("Press Start game when you are ready.");
    dom.startDeckGameButton.hidden = false;
    dom.startDeckGameButton.disabled = false;
    dom.newGameButton.hidden = true;
    dom.pauseButton.hidden = true;
    dom.statistics.hidden = true;
    setStatus("Press Start game when you are ready.");
    return;
  }

  dom.newGameButton.hidden = false;
  dom.startDeckGameButton.hidden = true;
  dom.pauseButton.hidden = false;
  startGame();
}

function pauseGame() {
  if (state.isPaused || state.roundResolved) return;
  state.elapsedBeforePause = performance.now() - state.timerStartedAt;
  state.isPaused = true;
  setStatus("Game paused. Review your statistics below.");
  dom.pauseButton.hidden = true;
  dom.statistics.hidden = false;
  showStatistics();
  dom.statistics.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resumeGame() {
  if (!state.isPaused || (isDeckMode() && state.deck.length < 2)) return;
  state.timerStartedAt = performance.now() - state.elapsedBeforePause;
  state.isPaused = false;
  setStatus(DEFAULT_STATUS);
  dom.pauseButton.hidden = false;
  dom.statistics.hidden = true;
  dom.resumeButton.hidden = false;
  dom.cards.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearStatistics() {
  if (isDeckMode()) {
    state.sessionResults = [];
  } else {
    clearResults();
  }
  showStatistics();
}

dom.newGameButton.addEventListener("click", startGame);
dom.startDeckGameButton.addEventListener("click", startDeckCountdown);
dom.trainingModeButton.addEventListener("click", () => selectMode("training"));
dom.deckModeButton.addEventListener("click", () => selectMode("deck"));
dom.memoryModeButton.addEventListener("click", () => selectMode("memory"));
dom.pauseButton.addEventListener("click", pauseGame);
dom.resumeButton.addEventListener("click", resumeGame);
dom.clearStatisticsButton.addEventListener("click", clearStatistics);

beginGame();
