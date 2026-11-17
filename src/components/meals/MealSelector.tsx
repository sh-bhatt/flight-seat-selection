'use client';

import { MealCard } from '@/components/meals/MealCard';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { MEAL_OPTIONS } from '@/data/meals';
import { getActivePassenger, getSelectedMealOptionId } from '@/state/selectors';

/** Meal picker for the active passenger. Clicking the chosen meal again clears it. */
export function MealSelector() {
  const state = useBooking();
  const { selectMeal } = useBookingActions();
  const passenger = getActivePassenger(state);

  if (!passenger) {
    return <p className="text-sm text-ink-muted">Select a passenger first.</p>;
  }
  const selectedId = getSelectedMealOptionId(state, passenger.id);

  return (
    <ul
      aria-label={`Meal options for ${passenger.name}`}
      className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3"
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
  );
}
