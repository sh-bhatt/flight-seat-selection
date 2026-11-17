import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-white enabled:not-aria-disabled:hover:bg-navy-hover',
  secondary:
    'border border-line bg-surface text-foreground enabled:not-aria-disabled:hover:bg-surface-sunken',
  danger: 'bg-danger text-white enabled:not-aria-disabled:hover:brightness-110',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
};

/** Disabled and `aria-disabled` look the same: flat grey fill, secondary text. */
const DISABLED_CLASSES =
  'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-line disabled:text-ink-secondary aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-line aria-disabled:text-ink-secondary';

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${DISABLED_CLASSES} ${className}`}
      {...rest}
    />
  );
}
