// A Dobble deck is a finite projective plane of prime order n: n² + n + 1
// cards and symbols, n + 1 symbols per card, and every two cards share
// exactly one symbol. Order 7 gives the classic 57 cards with 8 symbols.
export const ORDER = 7;

export function createDeck(order = ORDER) {
  const cards = [];
  const specialSymbol = order * order + order;
  const point = (x, y) => order + x * order + y;

  cards.push([...Array(order).keys(), specialSymbol]);

  for (let x = 0; x < order; x += 1) {
    cards.push([
      specialSymbol,
      ...Array.from({ length: order }, (_, y) => point(x, y)),
    ]);
  }

  for (let slope = 0; slope < order; slope += 1) {
    for (let intercept = 0; intercept < order; intercept += 1) {
      cards.push([
        slope,
        ...Array.from({ length: order }, (_, x) => point(x, (slope * x + intercept) % order)),
      ]);
    }
  }

  return cards;
}

export function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function sharedSymbol(firstCard, secondCard) {
  return firstCard.find((symbol) => secondCard.includes(symbol));
}
