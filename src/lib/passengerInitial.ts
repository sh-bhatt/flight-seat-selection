/**
 * Short label for a passenger on a seat: first letter, plus a trailing number
 * so default names stay distinguishable ("Passenger 2" -> "P2", "Rahul" -> "R").
 */
export function getPassengerInitial(name: string): string {
  const trimmed = name.trim();
  // Array.from keeps emoji and other surrogate pairs whole (charAt would split them).
  const letter = (Array.from(trimmed)[0] ?? '?').toUpperCase();
  const trailingNumber = /\d{1,2}$/.exec(trimmed)?.[0] ?? '';
  return `${letter}${trailingNumber}`;
}
