import type { ContinueStep } from '@/components/summary/useContinueStep';
import { Button } from '@/components/ui/Button';

interface ContinueButtonProps {
  step: ContinueStep;
  size?: 'md' | 'lg';
  /** Replaces the step's label, e.g. a short "Continue" on phones. */
  label?: string;
  className?: string;
}

/**
 * The primary action. `aria-disabled` (not `disabled`) keeps it focusable, and
 * the visible reason text is its accessible description.
 */
export function ContinueButton({
  step,
  size = 'lg',
  label,
  className = '',
}: ContinueButtonProps) {
  return (
    <Button
      size={size}
      className={className}
      aria-disabled={!step.isEnabled}
      aria-describedby={step.reason ? step.reasonId : undefined}
      onClick={step.proceed}
    >
      {label ?? step.label}
    </Button>
  );
}
