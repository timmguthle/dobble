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
const scoreElement = document.querySelector("#score");
const statusElement = document.querySelector("#status");
const roundElement = document.querySelector("#round-counter");
const newGameButton = document.querySelector("#new-game");

let deck = [];
let currentCards = [];
let score = 0;
let round = 1;

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
  if (symbol === shared) {
    score += 1;
    scoreElement.textContent = score;
    button.classList.add("is-correct");
    statusElement.textContent = "Correct! Loading the next pair...";
    window.setTimeout(nextRound, 500);
    return;
  }

  button.classList.remove("is-wrong");
  void button.offsetWidth;
  button.classList.add("is-wrong");
  statusElement.textContent = "Not that one — keep looking!";
}

function nextRound() {
  if (deck.length < 2) {
    deck = createDeck();
  }

  currentCards = [deck.pop(), deck.pop()];
  const shared = sharedSymbol(currentCards[0], currentCards[1]);
  renderCard(cardOne, currentCards[0], shared);
  renderCard(cardTwo, currentCards[1], shared);
  roundElement.textContent = `Round ${round}`;
  round += 1;
  statusElement.textContent = "There is exactly one symbol shared by both cards.";
}

function startGame() {
  score = 0;
  round = 1;
  scoreElement.textContent = score;
  deck = shuffle(createDeck());
  nextRound();
}

newGameButton.addEventListener("click", startGame);
startGame();
