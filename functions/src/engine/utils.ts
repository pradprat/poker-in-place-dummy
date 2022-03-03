const hasCents = (val: number) => val !== Math.round(val);

export function toCurrency(amount: number) {
  return hasCents(amount) ? amount.toFixed(2) : amount.toLocaleString();
}

export function hashCode(str: string) {
  return Array.from(str).reduce(
    (s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0,
    0
  );
}