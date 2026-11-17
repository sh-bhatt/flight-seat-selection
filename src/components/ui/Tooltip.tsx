import { useId, type ReactElement, type ReactNode } from 'react';

interface TooltipProps {
  /** Tooltip text; when empty the child renders untouched. */
  content: ReactNode;
  /** Receives the id to wire up `aria-describedby` (undefined without content). */
  children: (describedBy: string | undefined) => ReactElement;
}

/** CSS-only tooltip shown on hover and keyboard focus of the wrapped control. */
export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  if (!content) return children(undefined);
  return (
    <div className="group/tip relative">
      {children(id)}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-max max-w-64 -translate-x-1/2 rounded-lg bg-toast px-3 py-1.5 text-center text-xs font-medium text-toast-ink shadow-lg group-focus-within/tip:block group-hover/tip:block"
      >
        {content}
      </span>
    </div>
  );
}
