function hashCode(str) {
  return Array.from(str).reduce(
    (s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0,
    0
  );
}

function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    var t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

const shuffle = (secureSeed, array, { prng } = {}) => {
  // TODO - this should be an env variable
  // Pad seed with Phi, Pi and E.
  // https://en.wikipedia.org/wiki/Nothing-up-my-sleeve_number
  const rand =
    prng === "sfc32"
      ? sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, secureSeed)
      : mulberry32(secureSeed);

  const copy = [];
  let n = array.length;
  let i;

  // While there remain elements to shuffle…
  while (n) {
    // Pick a remaining element…
    i = Math.floor(rand() * array.length);

    // If not already shuffled, move it to the new array.
    if (i in array) {
      copy.push(array[i]);
      delete array[i];
      n--;
    }
  }

  return copy;
};

const generateDeck = (seedString, secureSeed = 0xdeadbeef, { prng } = {}) => {
  if (!seedString) throw new Error("Invalid seed string");
  return shuffle(
    hashCode(seedString) ^ 0xdeadbeef,
    ranks
      .map((r) => suits.map((s) => r + s))
      .reduce((prev, curr) => prev.concat(curr)),
      { prng },
  );
};

const suits = ["d", "c", "h", "s"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];

module.exports = { generateDeck };
