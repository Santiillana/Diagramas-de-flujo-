const gcd = (a, b) => {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
};

export function rational(numerator, denominator = 1n) {
  let n = BigInt(numerator), d = BigInt(denominator);
  if (!d) throw new RangeError("El denominador no puede ser cero.");
  if (d < 0n) { n = -n; d = -d; }
  const divisor = gcd(n, d);
  return Object.freeze({ n: n / divisor, d: d / divisor });
}

export const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
export const subtract = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
export const multiply = (a, b) => rational(a.n * b.n, a.d * b.d);
export const divide = (a, b) => {
  if (!b.n) throw new RangeError("No se puede dividir entre cero.");
  return rational(a.n * b.d, a.d * b.n);
};
export const compare = (a, b) => {
  const difference = a.n * b.d - b.n * a.d;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
};
export const formatRational = value => {
  const numerator = value.n < 0n ? `−${formatInteger(-value.n)}` : formatInteger(value.n);
  return value.d === 1n ? numerator : `${numerator}/${formatInteger(value.d)}`;
};
export const formatInteger = value => new Intl.NumberFormat("es-CO").format(value);
export const formatSignedInteger = value => value < 0 ? `−${formatInteger(-value)}` : formatInteger(value);

export function solveDirectRule(a, b, c) {
  return divide(multiply(rational(b), rational(c)), rational(a));
}
export function solveInverseRule(a, b, c) {
  return divide(multiply(rational(a), rational(b)), rational(c));
}
