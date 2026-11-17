interface DietIndicatorProps {
  isVeg: boolean;
}

/** Indian standard food mark: green dot in a green square (veg), red (non-veg). */
export function DietIndicator({ isVeg }: DietIndicatorProps) {
  const tone = isVeg ? 'border-success' : 'border-danger';
  const dot = isVeg ? 'bg-success' : 'bg-danger';
  return (
    <span
      role="img"
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      className={`flex size-4 shrink-0 items-center justify-center rounded-sm border-2 ${tone}`}
    >
      <span className={`size-2 rounded-full ${dot}`} />
    </span>
  );
}
