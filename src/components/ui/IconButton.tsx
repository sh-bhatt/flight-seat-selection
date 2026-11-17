import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  /** Required: icon-only buttons have no visible text. Also used as the tooltip. */
  label: string;
  children: ReactNode;
  size?: IconButtonSize;
}

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'size-7 rounded-md',
  md: 'size-9 rounded-lg',
  lg: 'size-[34px] rounded-full',
  xl: 'size-11 rounded-[10px]',
};

export function IconButton({
  label,
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40 ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
