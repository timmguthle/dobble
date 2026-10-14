export const SYMBOLS = [
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

const ASSET_PATH = "assets/symbols/";

export function symbolLabel(symbol) {
  return SYMBOLS[symbol].replaceAll("_", " ");
}

export function symbolUrl(symbol) {
  return `${ASSET_PATH}${SYMBOLS[symbol]}.svg`;
}
