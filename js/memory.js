import { renderCard, clearCard } from "./card.js";
import { createDeck, sharedSymbol, shuffle } from "./deck.js";
import { dom } from "./dom.js";
import { loadMemoryTime, saveMemoryTime } from "./storage.js";
import { symbolLabel, symbolUrl } from "./symbols.js";

// Memory mode: the two cards are shown for a chosen time, then hidden. The
// player picks the shared symbol from the cards' 15 distinct symbols.
const DEFAULT_TITLE = dom.instructionsTitle.textContent;

const memory = {
  viewSeconds: 2,
  deck: [],
  round: 1,
  correct: 0,
  played: 0,
  shared: undefined,
  answered: true,
  // Bumped whenever the game is left or restarted, so a pending hide timer
  // from an old round does nothing.
  token: 0,
  hideTimeout: undefined,
};

const formatSeconds = (seconds) => `${seconds.toFixed(1)} s`;

function setStatus(message) {
  dom.status.textContent = message;
}

function updateScore() {
  dom.score.textContent = `${memory.correct} / ${memory.played}`;
}

function cancelRound() {
  memory.token += 1;
  window.clearTimeout(memory.hideTimeout);
  dom.memoryTimerBar.classList.remove("is-running");
}

function hideBoard() {
  dom.cards.hidden = true;
  dom.cards.classList.remove("is-memorizing");
  clearCard(dom.cardOne);
  clearCard(dom.cardTwo);
  dom.memoryTimer.hidden = true;
  dom.memoryChoices.hidden = true;
  dom.memoryReveal.hidden = true;
}

function showTimeValue() {
  dom.memoryTimeValue.textContent = formatSeconds(Number(dom.memoryTime.value));
}

export function showMemorySetup() {
  cancelRound();
  hideBoard();
  dom.memorySetup.hidden = false;
  dom.newGameButton.hidden = true;
  dom.roundCounter.hidden = true;
  memory.correct = 0;
  memory.played = 0;
  updateScore();
  setStatus("Choose how long you want to see the cards, then start.");
}

function startMemoryGame(event) {
  event.preventDefault();
  memory.viewSeconds = Number(dom.memoryTime.value);
  saveMemoryTime(memory.viewSeconds);
  Object.assign(memory, { deck: shuffle(createDeck()), round: 1, correct: 0, played: 0 });
  updateScore();

  dom.memorySetup.hidden = true;
  dom.newGameButton.hidden = false;
  dom.roundCounter.hidden = false;
  dom.memoryReveal.textContent = "Show cards";
  dom.memoryReveal.hidden = false;
  dom.memoryReveal.focus({ preventScroll: true });
  dom.roundCounter.textContent = `Round 1 · ${formatSeconds(memory.viewSeconds)} viewing time`;
  setStatus(`Press Show cards. You will see them for ${formatSeconds(memory.viewSeconds)}.`);
}

function revealCards() {
  if (memory.deck.length < 2) memory.deck = shuffle(createDeck());
  const first = memory.deck.pop();
  const second = memory.deck.pop();
  memory.shared = sharedSymbol(first, second);
  memory.answered = false;

  cancelRound();
  const token = memory.token;
  const ignorePick = () => {};
  renderCard(dom.cardOne, first, ignorePick);
  renderCard(dom.cardTwo, second, ignorePick);
  dom.memoryChoices.hidden = true;
  dom.memoryReveal.hidden = true;
  dom.cards.classList.add("is-memorizing");
  dom.cards.hidden = false;

  // Restart the countdown bar's animation for this round.
  dom.memoryTimer.hidden = false;
  dom.memoryTimerBar.style.setProperty("--duration", `${memory.viewSeconds}s`);
  void dom.memoryTimerBar.offsetWidth;
  dom.memoryTimerBar.classList.add("is-running");

  dom.roundCounter.textContent = `Round ${memory.round} · ${formatSeconds(memory.viewSeconds)} viewing time`;
  setStatus("Remember the symbol both cards share!");
  memory.hideTimeout = window.setTimeout(() => {
    if (token === memory.token) showChoices([...new Set([...first, ...second])]);
  }, memory.viewSeconds * 1000);
}

function showChoices(symbols) {
  hideBoard();
  dom.memoryChoices.classList.remove("is-answered");
  dom.memoryChoices.replaceChildren(...shuffle(symbols).map((symbol) => {
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
    button.addEventListener("click", () => pickChoice(button, symbol));
    return button;
  }));
  dom.memoryChoices.hidden = false;
  setStatus("Which symbol was on both cards?");
}

function pickChoice(button, symbol) {
  if (memory.answered) return;
  memory.answered = true;
  memory.played += 1;
  memory.round += 1;
  dom.memoryChoices.classList.add("is-answered");

  if (symbol === memory.shared) {
    memory.correct += 1;
    button.classList.add("is-correct");
    setStatus("Correct!");
  } else {
    button.classList.add("is-wrong");
    dom.memoryChoices
      .querySelector(`[data-symbol="${memory.shared}"]`)
      .classList.add("is-correct");
    setStatus(`Not quite — it was the ${symbolLabel(memory.shared).toLowerCase()}.`);
  }
  updateScore();

  dom.memoryReveal.textContent = "Show next cards";
  dom.memoryReveal.hidden = false;
  dom.memoryReveal.focus({ preventScroll: true });
}

export function enterMemoryMode() {
  dom.memory.hidden = false;
  dom.instructionsTitle.textContent = "Remember the matching symbol";
  dom.scoreLabel.textContent = "Correct";
  showMemorySetup();
}

export function exitMemoryMode() {
  cancelRound();
  hideBoard();
  dom.memory.hidden = true;
  dom.memoryChoices.replaceChildren();
  dom.instructionsTitle.textContent = DEFAULT_TITLE;
  dom.scoreLabel.textContent = "Score";
  dom.roundCounter.hidden = false;
}

const savedTime = loadMemoryTime();
if (savedTime) dom.memoryTime.value = savedTime;
showTimeValue();

dom.memoryTime.addEventListener("input", showTimeValue);
dom.memorySetup.addEventListener("submit", startMemoryGame);
dom.memoryReveal.addEventListener("click", revealCards);
