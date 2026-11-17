'use client';

import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { formatCurrency } from '@/lib/formatCurrency';

/**
 * A price that counts up or down to its new value. Screen readers get only the
 * final amount (the moving digits are hidden from them).
 */
export function AnimatedAmount({ amount }: { amount: number }) {
  const displayed = useAnimatedNumber(amount);
  return (
    <>
      <span aria-hidden="true">
        {formatCurrency(displayed, { forceZero: true })}
      </span>
      <span className="sr-only">{formatCurrency(amount, { forceZero: true })}</span>
    </>
  );
}
