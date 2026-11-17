/**
 * Short label for a passenger on a seat: first letter, plus a trailing number
 * so default names stay distinguishable ("Passenger 2" -> "P2", "Rahul" -> "R").
 */
export function getPassengerInitial(name: string): string {
  const trimmed = name.trim();
  const letter = trimmed.charAt(0).toUpperCase() || '?';
  const trailingNumber = /\d{1,2}$/.exec(trimmed)?.[0] ?? '';
  return `${letter}${trailingNumber}`;
}
