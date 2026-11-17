/** First character of `text`, uppercased; Array.from keeps emoji (surrogate pairs) whole. */
function firstLetter(text: string): string {
  return (Array.from(text)[0] ?? '?').toUpperCase();
}

/**
 * Short label for a passenger: the first letters of the first and last word
 * ("Aarav Mehta" -> "AM"). A name ending in a number keeps that number instead,
 * so default names stay distinguishable ("Passenger 2" -> "P2"). A single word
 * gives one letter ("Rahul" -> "R").
 */
export function getPassengerInitial(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const trailingNumber = /\d{1,2}$/.exec(words[words.length - 1])?.[0] ?? '';
  if (trailingNumber !== '') return `${firstLetter(words[0])}${trailingNumber}`;
  if (words.length === 1) return firstLetter(words[0]);
  return `${firstLetter(words[0])}${firstLetter(words[words.length - 1])}`;
}
