const SYMBOL_FILES = [
  "anchor", "apple", "baby_bottle", "bird", "bomb", "cactus", "candle",
  "car", "carrot", "cat", "cheese", "clock", "clown", "daisy", "dinosaur_trex",
  "dobble_hand", "dog", "dolphin", "dragon", "exclamation_mark", "eye", "fire",
  "four_leaf_clover", "ghost", "gingerbread_man", "glasses", "hammer", "heart",
  "ice_cube", "igloo", "key", "knight_horse", "ladybird", "light_bulb",
  "lightning", "lock", "maple_leaf", "moon", "mouth_lips", "paint", "pencil",
  "question_mark", "scissors", "skull_crossbones", "snowflake", "snowman",
  "spider", "spiders_web", "stop_sign", "sun", "target", "treble_clef", "tree",
  "turtle", "water_drop", "yin_and_yang", "zebra",
];

const ORDER = 7;
const ASSET_PATH = "dobble_svgs/";
const cardOne = document.querySelector("#card-one");
const cardTwo = document.querySelector("#card-two");
const cardsElement = document.querySelector("#cards");
const deckOverlayElement = document.querySelector("#deck-overlay");
const deckOverlayMessageElement = document.querySelector("#deck-overlay-message");
const scoreElement = document.querySelector("#score");
const mistakesLabelElement = document.querySelector("#mistakes-label");
const mistakesElement = document.querySelector("#mistakes");
const statusElement = document.querySelector("#status");
const roundElement = document.querySelector("#round-counter");
const newGameButton = document.querySelector("#new-game");
const startDeckGameButton = document.querySelector("#start-deck-game");
const trainingModeButton = document.querySelector("#training-mode");
const deckModeButton = document.querySelector("#deck-mode");
const pauseButton = document.querySelector("#pause-game");
const statisticsElement = document.querySelector("#statistics");
const resumeButton = document.querySelector("#resume-game");
const clearStatisticsButton = document.querySelector("#clear-statistics");
const averageTimeElement = document.querySelector("#average-time");
const roundsPlayedElement = document.querySelector("#rounds-played");
const fastestTimeElement = document.querySelector("#fastest-time");
const slowestTimeElement = document.querySelector("#slowest-time");
const symbolRankingElement = document.querySelector("#symbol-ranking");
const statisticsTitleElement = document.querySelector("#statistics-title");
const deckTimelineElement = document.querySelector("#deck-timeline");
const timelineElement = document.querySelector("#timeline");

let deck = [];
let currentCards = [];
let mode = "training";
let sessionResults = [];
let score = 0;
let round = 1;
let timerStartedAt = 0;
let elapsedBeforePause = 0;
let isPaused = false;
let roundResolved = false;
let mistakeCount = 0;
let countdownInterval;
let countdownToken = 0;
let hasStartedTimer = false;
const STORAGE_KEY = "dobble-training-statistics";

function symbolName(index) {
  return SYMBOL_FILES[index];
}

function createDeck() {
  const cards = [];
  const specialSymbol = 56;

  cards.push([...Array(ORDER).keys(), specialSymbol]);

  for (let x = 0; x < ORDER; x += 1) {
    cards.push([
      specialSymbol,
      ...Array.from({ length: ORDER }, (_, y) => 7 + x * ORDER + y),
    ]);
  }

  for (let slope = 0; slope < ORDER; slope += 1) {
    for (let intercept = 0; intercept < ORDER; intercept += 1) {
      const points = Array.from(
        { length: ORDER },
        (_, x) => 7 + x * ORDER + ((slope * x + intercept) % ORDER),
      );
      cards.push([slope, ...points]);
    }
  }

  return cards;
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function sharedSymbol(firstCard, secondCard) {
  return firstCard.find((symbol) => secondCard.includes(symbol));
}

function getSavedResults() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveResult(symbol, time) {
  const result = { symbol, time, date: new Date().toISOString() };
  if (mode === "deck") {
    sessionResults.push(result);
  }
  const results = getSavedResults();
  results.push(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

function formatTime(time) {
  return `${time.toFixed(2)} s`;
}

function renderStatistics(results = mode === "training" ? getSavedResults() : sessionResults) {
  roundsPlayedElement.textContent = results.length;
  symbolRankingElement.replaceChildren();
  deckTimelineElement.hidden = mode !== "deck";
  timelineElement.replaceChildren();

  if (results.length === 0) {
    averageTimeElement.textContent = "—";
    fastestTimeElement.textContent = "—";
    slowestTimeElement.textContent = "—";
    const empty = document.createElement("li");
    empty.textContent = "Find a few symbols to build your ranking.";
    symbolRankingElement.append(empty);
    return;
  }

  const times = results.map((result) => result.time);
  averageTimeElement.textContent = formatTime(times.reduce((sum, time) => sum + time, 0) / times.length);
  fastestTimeElement.textContent = formatTime(Math.min(...times));
  slowestTimeElement.textContent = formatTime(Math.max(...times));

  const bySymbol = new Map();
  results.forEach((result) => {
    const entry = bySymbol.get(result.symbol) || { total: 0, count: 0 };
    entry.total += result.time;
    entry.count += 1;
    bySymbol.set(result.symbol, entry);
  });

  const symbolsToShow = mode === "deck"
    ? [...bySymbol.keys()]
    : SYMBOL_FILES.map((_, symbol) => symbol);

  symbolsToShow
    .map((symbol) => {
      const entry = bySymbol.get(symbol);
      return entry
        ? { symbol, average: entry.total / entry.count, count: entry.count }
        : { symbol, average: null, count: 0 };
    })
    .sort((a, b) => {
      if (a.average === null) return b.average === null ? a.symbol - b.symbol : 1;
      if (b.average === null) return -1;
      return a.average - b.average;
    })
    .forEach((entry) => {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = symbolName(entry.symbol).replaceAll("_", " ");
      const time = document.createElement("span");
      time.textContent = entry.count === 0
        ? "No data yet"
        : `${formatTime(entry.average)} average · ${entry.count} find${entry.count === 1 ? "" : "s"}`;
      item.append(name, time);
      symbolRankingElement.append(item);
    });

  if (mode === "deck") {
    const slowestTime = Math.max(...times);
    results.forEach((result, index) => {
      const row = document.createElement("div");
      row.className = "timeline-row";

      const label = document.createElement("div");
      label.className = "timeline-label";
      label.textContent = `${index + 1}. ${symbolName(result.symbol).replaceAll("_", " ")}`;

      const track = document.createElement("div");
      track.className = "timeline-track";
      const bar = document.createElement("div");
      bar.className = "timeline-bar";
      bar.style.width = `${Math.max(8, (result.time / slowestTime) * 100)}%`;
      track.append(bar);

      const time = document.createElement("span");
      time.className = "timeline-time";
      time.textContent = formatTime(result.time);
      row.append(label, track, time);
      timelineElement.append(row);
    });
  }
}

function renderCard(element, symbols, shared) {
  element.replaceChildren();
  const placements = [
    [50, 50, 22, -8],
    [50, 19, 16, 12],
    [78, 34, 15, -15],
    [84, 66, 17, 20],
    [57, 83, 16, -12],
    [23, 75, 15, 16],
    [16, 43, 17, -18],
    [34, 25, 14, 8],
  ];
  const rotatedPlacements = shuffle(placements);

  symbols.forEach((symbol, index) => {
    const button = document.createElement("button");
    const [left, top, size, rotation] = rotatedPlacements[index];
    const name = symbolName(symbol);
    button.className = "symbol";
    button.dataset.symbol = symbol;
    button.style.left = `${left}%`;
    button.style.top = `${top}%`;
    button.style.height = `${size}%`;
    button.style.width = `${size}%`;
    button.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    button.setAttribute("aria-label", name.replaceAll("_", " "));
    button.type = "button";

    const image = document.createElement("img");
    image.alt = "";
    image.src = `${ASSET_PATH}${name}.svg`;
    button.append(image);
    button.addEventListener("click", () => handleSymbolClick(button, symbol, shared));
    element.append(button);
  });
}

function handleSymbolClick(button, symbol, shared) {
  if (isPaused || roundResolved || cardsElement.hidden) return;

  if (symbol === shared) {
    roundResolved = true;
    if (mode === "deck" || hasStartedTimer) {
      const time = (performance.now() - timerStartedAt) / 1000;
      saveResult(symbol, time);
    }
    hasStartedTimer = true;
    score += 1;
    scoreElement.textContent = score;
    button.classList.add("is-correct");
    statusElement.textContent = "Correct! Loading the next pair...";
    window.setTimeout(nextRound, 500);
    return;
  }

  if (mode === "deck") {
    mistakeCount += 1;
    mistakesElement.textContent = `${mistakeCount} / 5`;
    if (mistakeCount >= 5) {
      roundResolved = true;
      isPaused = true;
      statusElement.textContent = "You lost this game after five mistakes.";
      showDeckOverlay("Du bist noch schlechter als Christoph!");
      pauseButton.hidden = true;
      newGameButton.hidden = false;
      statisticsElement.hidden = false;
      resumeButton.hidden = true;
      renderStatistics(sessionResults);
      return;
    }
  }

  button.classList.remove("is-wrong");
  void button.offsetWidth;
  button.classList.add("is-wrong");
  statusElement.textContent = "Not that one — keep looking!";
}

function nextRound() {
  if (mode === "deck" && deck.length < 2) {
    finishDeckGame();
    return;
  }
  if (deck.length < 2) {
    deck = shuffle(createDeck());
  }

  currentCards = [deck.pop(), deck.pop()];
  const shared = sharedSymbol(currentCards[0], currentCards[1]);
  renderCard(cardOne, currentCards[0], shared);
  renderCard(cardTwo, currentCards[1], shared);
  roundElement.textContent = `Round ${round}`;
  round += 1;
  roundResolved = false;
  elapsedBeforePause = 0;
  timerStartedAt = performance.now();
  statusElement.textContent = "There is exactly one symbol shared by both cards.";
}

function beginGame() {
  isPaused = false;
  score = 0;
  round = 1;
  scoreElement.textContent = score;
  mistakeCount = 0;
  mistakesElement.textContent = "0 / 5";
  hasStartedTimer = mode === "deck";
  deck = shuffle(createDeck());
  sessionResults = [];
  nextRound();
  cardsElement.hidden = false;
  hideDeckOverlay();
  statisticsElement.hidden = true;
  pauseButton.hidden = false;
  resumeButton.hidden = false;
  pauseButton.textContent = "Pause game";
  clearStatisticsButton.textContent = mode === "training"
    ? "Clear saved statistics"
    : "Clear game statistics";
  statisticsTitleElement.textContent = mode === "training"
    ? "Training statistics"
    : "Game statistics";
  renderStatistics();
}

function startDeckCountdown() {
  countdownToken += 1;
  const token = countdownToken;
  window.clearInterval(countdownInterval);
  startDeckGameButton.disabled = true;
  newGameButton.hidden = true;
  let seconds = 3;
  showDeckOverlay(`Game starts in ${seconds}...`);
  countdownInterval = window.setInterval(() => {
    if (token !== countdownToken) {
      window.clearInterval(countdownInterval);
      return;
    }
    seconds -= 1;
    if (seconds === 0) {
      window.clearInterval(countdownInterval);
      startDeckGameButton.hidden = true;
      beginGame();
      return;
    }
    showDeckOverlay(`Game starts in ${seconds}...`);
  }, 1000);
}

function showDeckOverlay(message) {
  deckOverlayMessageElement.textContent = message;
  deckOverlayElement.hidden = false;
}

function hideDeckOverlay() {
  deckOverlayElement.hidden = true;
}

function startGame() {
  if (mode === "deck") {
    startDeckCountdown();
    return;
  }
  beginGame();
}

function finishDeckGame() {
  isPaused = true;
  const message = score >= 28
    ? "Deck complete!"
    : "You lost this game.";
  statusElement.textContent = `${message} Here are your statistics for this game.`;
  showDeckOverlay(message);
  pauseButton.hidden = true;
  newGameButton.hidden = false;
  statisticsElement.hidden = false;
  resumeButton.hidden = true;
  renderStatistics(sessionResults);
}

function selectMode(nextMode) {
  if (mode === nextMode) return;
  countdownToken += 1;
  window.clearInterval(countdownInterval);
  mode = nextMode;
  trainingModeButton.classList.toggle("is-active", mode === "training");
  deckModeButton.classList.toggle("is-active", mode === "deck");
  if (mode === "deck") {
    cardsElement.hidden = false;
    cardOne.replaceChildren();
    cardTwo.replaceChildren();
    showDeckOverlay("Press Start game when you are ready.");
    startDeckGameButton.hidden = false;
    startDeckGameButton.disabled = false;
    newGameButton.hidden = true;
    pauseButton.hidden = true;
    statisticsElement.hidden = true;
    mistakesLabelElement.hidden = false;
    mistakesElement.hidden = false;
    statusElement.textContent = "Press Start game when you are ready.";
    return;
  }
  newGameButton.hidden = false;
  startDeckGameButton.hidden = true;
  pauseButton.hidden = false;
  mistakesLabelElement.hidden = true;
  mistakesElement.hidden = true;
  startGame();
}

function pauseGame() {
  if (isPaused || roundResolved) return;
  elapsedBeforePause = performance.now() - timerStartedAt;
  isPaused = true;
  statusElement.textContent = "Game paused. Review your statistics below.";
  pauseButton.hidden = true;
  statisticsElement.hidden = false;
  renderStatistics();
}

function resumeGame() {
  if (!isPaused || mode === "deck" && deck.length < 2) return;
  timerStartedAt = performance.now() - elapsedBeforePause;
  isPaused = false;
  statusElement.textContent = "There is exactly one symbol shared by both cards.";
  pauseButton.hidden = false;
  statisticsElement.hidden = true;
  resumeButton.hidden = false;
}

newGameButton.addEventListener("click", startGame);
startDeckGameButton.addEventListener("click", startDeckCountdown);
trainingModeButton.addEventListener("click", () => selectMode("training"));
deckModeButton.addEventListener("click", () => selectMode("deck"));
pauseButton.addEventListener("click", pauseGame);
resumeButton.addEventListener("click", resumeGame);
clearStatisticsButton.addEventListener("click", () => {
  if (mode === "training") {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    sessionResults = [];
  }
  renderStatistics(mode === "training" ? getSavedResults() : sessionResults);
});
beginGame();
