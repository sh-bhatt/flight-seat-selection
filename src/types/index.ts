export type LayoutId = '3-2' | '2-3-2';

export type SeatCategory = 'standard' | 'premium' | 'extra-legroom';

/** Derived at read time from seats + passengers; never stored. */
export type SeatStatus =
  | 'available'
  | 'occupied'
  | 'selected-current'
  | 'selected-other';

export type SeatPosition = 'window' | 'middle' | 'aisle';

export interface Seat {
  /** e.g. "12C" */
  id: string;
  row: number;
  column: string;
  category: SeatCategory;
  /** Extra price in INR */
  price: number;
  isOccupied: boolean;
  position: SeatPosition;
}

export interface LayoutConfig {
  id: LayoutId;
  label: string;
  /** Seat letters grouped by block; aisles sit between groups. */
  columnGroups: string[][];
  rows: number;
}

export interface Passenger {
  id: string;
  name: string;
  seatId: string | null;
  mealId: string | null;
}

export interface MealOption {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
}
