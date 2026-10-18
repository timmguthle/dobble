import { dom } from "./dom.js";

// On phones held upright the two cards are stacked, so their size is set by
// how much height is left below the header, status and mode switch. CSS can
// only guess that height; here it is measured and the cards are sized to fill
// the rest of the screen. The New game / Pause row is left just below the
// fold: reserving room for it would shrink both cards by half its height.
// Elsewhere the CSS sizing applies.
const PHONE_PORTRAIT = window.matchMedia("(max-width: 700px) and (orientation: portrait)");
const SIDE_MARGIN = 32;
const MAX_SIZE = 420;
const MIN_SIZE = 200;
// The cards' drop shadow hangs below the second card.
const SHADOW_SPACE = 10;

const root = document.documentElement;
let frame = 0;

function fitCards() {
  frame = 0;
  if (!PHONE_PORTRAIT.matches) {
    root.style.removeProperty("--card-size");
    return;
  }

  // Measure from the page top so a scrolled page gives the same result.
  const cardsTop = dom.cards.getBoundingClientRect().top + window.scrollY;
  const gap = parseFloat(getComputedStyle(dom.cards).rowGap) || 0;
  // clientHeight is the height with Safari's toolbars showing, so the cards
  // do not jump while the toolbars collapse on scroll or during pinch-zoom.
  const freeHeight = root.clientHeight - cardsTop - SHADOW_SPACE;

  const size = Math.min(
    root.clientWidth - SIDE_MARGIN,
    MAX_SIZE,
    Math.max(MIN_SIZE, (freeHeight - gap) / 2),
  );
  root.style.setProperty("--card-size", `${Math.floor(size)}px`);
}

function scheduleFit() {
  if (!frame) frame = window.requestAnimationFrame(fitCards);
}

export function initCardFit() {
  window.addEventListener("resize", scheduleFit);
  PHONE_PORTRAIT.addEventListener("change", scheduleFit);
  // Refit when anything above the cards changes height, for example when
  // Memory mode shows its timer. The cards themselves are not observed, so
  // resizing them cannot loop.
  const observer = new ResizeObserver(scheduleFit);
  for (const element of [dom.header, dom.instructions, dom.modeSwitch, dom.memory]) {
    observer.observe(element);
  }
  fitCards();
}
