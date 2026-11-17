const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

interface FormatCurrencyOptions {
  /** Show "₹0" instead of "Free" when the amount is zero. */
  forceZero?: boolean;
}

export function formatCurrency(
  amount: number,
  { forceZero = false }: FormatCurrencyOptions = {},
): string {
  if (amount === 0 && !forceZero) return 'Free';
  return inrFormatter.format(amount);
}
