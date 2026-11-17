/** "Passenger 1", "Passenger 2", ...: the name a passenger has until renamed. */
export function defaultPassengerName(index: number): string {
  return `Passenger ${index + 1}`;
}
