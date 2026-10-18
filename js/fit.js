// On phones the cards should be as big as the screen allows, which CSS can
// only estimate. Here the free space is measured and the cards are sized to
// fill it. Elsewhere the CSS sizing applies.
//
// Upright, the cards are stacked below the header, status and mode switch.
// The New game / Pause row is left just below the fold: reserving room for
// it would shrink both cards by half its height.
// Sideways, everything else sits in a column on the left, so the cards sit
// side by side and use the full screen height.
const PHONE_PORTRAIT = window.matchMedia("(max-width: 700px) and (orientation: portrait)");
const PHONE_LANDSCAPE = window.matchMedia("(max-height: 560px) and (orientation: landscape)");
const MAX_SIZE = 420;
const MIN_SIZE = 150;
// The cards' drop shadow hangs below them.
const SHADOW_SPACE = 10;

const root = document.documentElement;
let frame = 0;

function fitCards() {
  frame = 0;
  const sideBySide = PHONE_LANDSCAPE.matches;
  // Single player and multiplayer each have their own board; fit the one on
  // screen (if the cards are showing).
  const shell = document.querySelector(".game-shell:not([hidden])");
  const cards = shell?.querySelector(".cards:not([hidden])");
  if (!cards || (!sideBySide && !PHONE_PORTRAIT.matches)) {
    root.style.removeProperty("--card-size");
    return;
  }
  const board = shell.querySelector(".board");

  // Measure from the page top so a scrolled page gives the same result.
  const cardsTop = cards.getBoundingClientRect().top + window.scrollY;
  const gap = parseFloat(getComputedStyle(cards).rowGap) || 0;
  // clientHeight is the height with Safari's toolbars showing, so the cards
  // do not jump while the toolbars collapse on scroll or during pinch-zoom.
  const freeHeight = root.clientHeight - cardsTop - SHADOW_SPACE;
  const freeWidth = board.clientWidth;

  const fitsWidth = sideBySide ? (freeWidth - gap) / 2 : freeWidth;
  const fitsHeight = sideBySide ? freeHeight : (freeHeight - gap) / 2;
  const size = Math.min(fitsWidth, MAX_SIZE, Math.max(MIN_SIZE, fitsHeight));
  root.style.setProperty("--card-size", `${Math.floor(size)}px`);
}

export function scheduleFit() {
  if (!frame) frame = window.requestAnimationFrame(fitCards);
}

export function initCardFit() {
  window.addEventListener("resize", scheduleFit);
  PHONE_PORTRAIT.addEventListener("change", scheduleFit);
  PHONE_LANDSCAPE.addEventListener("change", scheduleFit);
  // Refit when anything above the cards changes height, for example when
  // Memory mode shows its timer. The cards themselves are not observed, so
  // resizing them cannot loop; code that shows the cards calls scheduleFit.
  const observer = new ResizeObserver(scheduleFit);
  const aboveCards = ".game-header, .instructions, .mode-switch, .memory, .time-bar, .mp-stage";
  for (const element of document.querySelectorAll(aboveCards)) {
    observer.observe(element);
  }
  fitCards();
}
