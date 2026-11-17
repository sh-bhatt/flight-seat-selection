import { DietIndicator } from '@/components/meals/DietIndicator';
import { CheckIcon } from '@/components/ui/Icons';
import { NO_MEAL_ID } from '@/data/meals';
import { formatCurrency } from '@/lib/formatCurrency';
import type { MealOption } from '@/types';

interface MealCardProps {
  meal: MealOption;
  isSelected: boolean;
  onSelect: (mealId: string) => void;
}

export function MealCard({ meal, isSelected, onSelect }: MealCardProps) {
  const isNoMeal = meal.id === NO_MEAL_ID;
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(meal.id)}
      className={`flex h-full w-full flex-col gap-2 rounded-xl border-2 p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        isSelected
          ? 'border-accent bg-accent-soft shadow-sm'
          : 'border-line bg-surface hover:border-seat-standard-line'
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {!isNoMeal && <DietIndicator isVeg={meal.isVeg} />}
          {meal.name}
        </span>
        {isSelected && (
          <CheckIcon className="size-4 shrink-0 text-accent" aria-hidden />
        )}
      </span>
      <span className="text-xs text-ink-muted">{meal.description}</span>
      <span className="mt-auto text-sm font-semibold tabular-nums">
        {formatCurrency(meal.price)}
      </span>
    </button>
  );
}
