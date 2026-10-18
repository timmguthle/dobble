import { renderCard, clearCard, flashWrong } from "./card.js";
import { createDeck, sharedSymbol, shuffle } from "./deck.js";
import { dom } from "./dom.js";
import { enterMemoryMode, exitMemoryMode, showMemorySetup } from "./memory.js";
import { renderStatistics } from "./statistics.js";
import {
  appendResult, clearResults, loadResults, loadTimeAttackBest, saveTimeAttackBest,
} from "./storage.js";

const DECK_ROUNDS = 28;
const MAX_MISTAKES = 5;
const COUNTDOWN_SECONDS = 3;
const NEXT_ROUND_DELAY = 500;
const DEFAULT_STATUS = "There is exactly one symbol shared by both cards.";
// Time attack: find as many matches as you can before the clock runs out.
const TIME_ATTACK_SECONDS = 60;
const TIME_BONUS_SECONDS = 1;
const TIME_PENALTY_SECONDS = 3;
const LOW_TIME_SECONDS = 10;

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
  // Time attack clock: the game ends at `deadline`. It stands still while a
  // solved pair is still showing (`clockStoppedAt`).
  deadline: 0,
  clockStoppedAt: null,
  clockFrame: 0,
};

const isDeckMode = () => state.mode === "deck";
const isTimeAttack = () => state.mode === "timeattack";
// One deck and Time attack are single games with a start countdown and
// their own statistics; Training runs on and saves everything.
const isGameMode = () => isDeckMode() || isTimeAttack();

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
  return isGameMode() ? state.sessionResults : loadResults();
}

function showStatistics(results = currentResults()) {
  renderStatistics(results, { includeUnseen: !isGameMode(), showTimeline: isGameMode() });
}

function recordResult(symbol, time) {
  const result = { symbol, time, date: new Date().toISOString() };
  if (isGameMode()) state.sessionResults.push(result);
  appendResult(result);
}

function timeLeft() {
  return state.deadline - (state.clockStoppedAt ?? performance.now());
}

function renderClock(milliseconds) {
  const seconds = Math.max(0, milliseconds) / 1000;
  // Tenths only count near the end; whole seconds also fit on small phones.
  const shown = seconds < LOW_TIME_SECONDS ? seconds.toFixed(1) : Math.ceil(seconds);
  dom.timeLeft.textContent = `${shown} s`;
  dom.timeBarFill.style.transform = `scaleX(${Math.min(1, seconds / TIME_ATTACK_SECONDS)})`;
  dom.timeBar.classList.toggle("is-low", seconds < LOW_TIME_SECONDS);
  dom.timeLeft.classList.toggle("is-low", seconds < LOW_TIME_SECONDS);
}

function tickClock() {
  const left = timeLeft();
  renderClock(left);
  if (left <= 0) {
    finishTimeAttack();
    return;
  }
  state.clockFrame = window.requestAnimationFrame(tickClock);
}

function stopClock() {
  window.cancelAnimationFrame(state.clockFrame);
}

function holdClock() {
  state.clockStoppedAt = performance.now();
}

function releaseClock() {
  if (state.clockStoppedAt === null) return;
  state.deadline += performance.now() - state.clockStoppedAt;
  state.clockStoppedAt = null;
}

function addTime(seconds) {
  state.deadline += seconds * 1000;
  renderClock(timeLeft());
}

function finishTimeAttack() {
  stopClock();
  window.clearTimeout(state.nextRoundTimeout);
  state.roundResolved = true;
  renderClock(0);

  const matches = `${state.score} match${state.score === 1 ? "" : "es"}`;
  const best = loadTimeAttackBest();
  const isNewBest = state.score > best;
  if (isNewBest) saveTimeAttackBest(state.score);
  const result = isNewBest
    ? `New personal best: ${matches}!`
    : `${matches}. Your best is ${best}.`;
  endDeckGame(`Time's up! ${result} Here are your statistics for this game.`, `Time's up! ${matches}`);
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
    if (state.hasStartedTimer) {
      recordResult(symbol, (performance.now() - state.timerStartedAt) / 1000);
    }
    state.hasStartedTimer = true;
    state.score += 1;
    dom.score.textContent = state.score;
    button.classList.add("is-correct");
    if (isTimeAttack()) {
      holdClock();
      addTime(TIME_BONUS_SECONDS);
      setStatus(`Correct! +${TIME_BONUS_SECONDS} s`);
    } else {
      setStatus("Correct! Loading the next pair...");
    }
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

  flashWrong(button);
  if (isTimeAttack()) {
    addTime(-TIME_PENALTY_SECONDS);
    setStatus(`Not that one: −${TIME_PENALTY_SECONDS} s!`);
    return;
  }
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
  if (isTimeAttack()) releaseClock();
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
    hasStartedTimer: isGameMode(),
    deck: shuffle(createDeck()),
    sessionResults: [],
  });
  dom.score.textContent = state.score;
  dom.mistakes.textContent = `0 / ${MAX_MISTAKES}`;
  nextRound();

  dom.cards.hidden = false;
  hideDeckOverlay();
  dom.statistics.hidden = true;
  // Time attack has no pause: the clock is the game.
  dom.pauseButton.hidden = isTimeAttack();
  dom.resumeButton.hidden = false;
  dom.clearStatisticsButton.textContent = isGameMode()
    ? "Clear game statistics"
    : "Clear saved statistics";
  dom.statisticsTitle.textContent = isGameMode() ? "Game statistics" : "Training statistics";
  showStatistics();

  if (isTimeAttack()) {
    state.deadline = performance.now() + TIME_ATTACK_SECONDS * 1000;
    state.clockStoppedAt = null;
    tickClock();
  }
}

function cancelCountdown() {
  state.countdownToken += 1;
  window.clearInterval(state.countdownInterval);
  window.clearTimeout(state.nextRoundTimeout);
  stopClock();
}

function startDeckCountdown() {
  cancelCountdown();
  const token = state.countdownToken;
  dom.startDeckGameButton.disabled = true;
  dom.newGameButton.hidden = true;
  renderClock(TIME_ATTACK_SECONDS * 1000);
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
  if (isGameMode()) {
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
  showMode(nextMode);
}

function showMode(nextMode) {
  state.mode = nextMode;
  dom.trainingModeButton.classList.toggle("is-active", nextMode === "training");
  dom.deckModeButton.classList.toggle("is-active", nextMode === "deck");
  dom.memoryModeButton.classList.toggle("is-active", nextMode === "memory");
  dom.timeAttackModeButton.classList.toggle("is-active", nextMode === "timeattack");
  dom.mistakesLabel.hidden = !isDeckMode();
  dom.mistakes.hidden = !isDeckMode();
  dom.timeLeftLabel.hidden = !isTimeAttack();
  dom.timeLeft.hidden = !isTimeAttack();
  dom.timeBar.hidden = !isTimeAttack();
  renderClock(TIME_ATTACK_SECONDS * 1000);

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

  if (isGameMode()) {
    dom.cards.hidden = false;
    clearCard(dom.cardOne);
    clearCard(dom.cardTwo);
    showDeckOverlay("Press Start game when you are ready.");
    dom.startDeckGameButton.hidden = false;
    dom.startDeckGameButton.disabled = false;
    dom.newGameButton.hidden = true;
    dom.pauseButton.hidden = true;
    dom.statistics.hidden = true;
    if (isTimeAttack()) {
      const best = loadTimeAttackBest();
      setStatus(
        `${TIME_ATTACK_SECONDS} seconds: find as many matches as you can. `
        + `Right +${TIME_BONUS_SECONDS} s, wrong −${TIME_PENALTY_SECONDS} s.`
        + (best ? ` Your best: ${best}.` : ""),
      );
    } else {
      setStatus("Press Start game when you are ready.");
    }
    return;
  }

  dom.newGameButton.hidden = false;
  dom.startDeckGameButton.hidden = true;
  dom.pauseButton.hidden = false;
  startGame();
}

function pauseGame() {
  if (state.isPaused || state.roundResolved || isTimeAttack()) return;
  state.elapsedBeforePause = performance.now() - state.timerStartedAt;
  state.isPaused = true;
  setStatus("Game paused. Review your statistics below.");
  dom.pauseButton.hidden = true;
  dom.statistics.hidden = false;
  showStatistics();
  dom.statistics.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resumeGame() {
  if (!state.isPaused || (isDeckMode() && state.deck.length < 2) || isTimeAttack()) return;
  state.timerStartedAt = performance.now() - state.elapsedBeforePause;
  state.isPaused = false;
  setStatus(DEFAULT_STATUS);
  dom.pauseButton.hidden = false;
  dom.statistics.hidden = true;
  dom.resumeButton.hidden = false;
  dom.cards.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearStatistics() {
  if (isGameMode()) {
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
dom.timeAttackModeButton.addEventListener("click", () => selectMode("timeattack"));
dom.pauseButton.addEventListener("click", pauseGame);
dom.resumeButton.addEventListener("click", resumeGame);
dom.clearStatisticsButton.addEventListener("click", clearStatistics);

// Coming to single player starts a fresh game in the last mode used.
export function enterSinglePlayer() {
  showMode(state.mode);
}

export function leaveSinglePlayer() {
  cancelCountdown();
  state.isPaused = true;
  if (state.mode === "memory") exitMemoryMode();
}
