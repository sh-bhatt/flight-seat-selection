'use client';

import { MealCard } from '@/components/meals/MealCard';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { MEAL_OPTIONS } from '@/data/meals';
import { getSelectedMealOptionId } from '@/state/selectors';

/** Meal picker for the active passenger. Clicking the chosen meal again clears it. */
export function MealSelector() {
  const state = useBooking();
  const { selectMeal } = useBookingActions();
  const passenger = state.passengers.find(
    (p) => p.id === state.activePassengerId,
  );

  if (!passenger) {
    return <p className="text-sm text-ink-muted">Select a passenger first.</p>;
  }
  const selectedId = getSelectedMealOptionId(state, passenger.id);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold [overflow-wrap:anywhere]">
        Choose a meal for {passenger.name}
      </h2>
      <ul
        aria-label={`Meal options for ${passenger.name}`}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {MEAL_OPTIONS.map((meal) => (
          <li key={meal.id}>
            <MealCard
              meal={meal}
              isSelected={meal.id === selectedId}
              onSelect={(mealId) => selectMeal(passenger.id, mealId)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
