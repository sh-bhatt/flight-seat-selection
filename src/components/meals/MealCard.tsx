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
      // Padding shrinks by the extra 0.5px of border so the card never changes size.
      className={`flex h-full w-full flex-col gap-2 rounded-xl text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
        isSelected
          ? 'border-[1.5px] border-navy bg-selected p-[13.5px]'
          : 'border border-line bg-surface p-3.5 hover:border-seat-standard-line'
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {!isNoMeal && <DietIndicator isVeg={meal.isVeg} />}
          {meal.name}
        </span>
        {isSelected && <CheckIcon className="size-4 shrink-0 text-navy" aria-hidden />}
      </span>
      <span className="text-xs text-ink-muted">{meal.description}</span>
      <span className="mt-auto text-sm font-bold tabular-nums">
        {formatCurrency(meal.price)}
      </span>
    </button>
  );
}
