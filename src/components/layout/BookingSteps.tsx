'use client';

import {
  getBookingSteps,
  type BookingStep,
} from '@/components/layout/stepModel';
import { useStepKeyDown } from '@/components/layout/useStepKeyDown';
import { CheckIcon } from '@/components/ui/Icons';
import { useMainView } from '@/context/ViewContext';

const CIRCLE_BASE =
  'flex size-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums';

const CIRCLE_CLASSES: Record<BookingStep['status'], string> = {
  done: 'bg-navy text-white',
  current: 'bg-navy text-white',
  upcoming: 'border-[1.5px] border-fuselage-line text-ink-muted',
};

function StepContent({ step }: { step: BookingStep }) {
  const label = (
    <span
      className={`text-[13px] font-semibold ${
        step.status === 'upcoming' ? 'text-ink-muted' : 'text-foreground'
      } ${step.isRevisitable ? 'group-hover/step:underline' : ''}`}
    >
      {step.label}
      {step.status === 'done' && !step.isRevisitable && (
        <span className="sr-only"> (completed)</span>
      )}
    </span>
  );
  return (
    <>
      <span aria-hidden="true" className={`${CIRCLE_BASE} ${CIRCLE_CLASSES[step.status]}`}>
        {step.status === 'done' ? (
          <CheckIcon className="size-3" strokeWidth={3} />
        ) : (
          step.number
        )}
      </span>
      {label}
    </>
  );
}

/**
 * Desktop step indicator: Travellers › Seats › Meals › Review. Seats and Meals
 * are buttons that switch the main view; the others only show progress.
 */
export function BookingSteps() {
  const { view, setView, reviewStage } = useMainView();
  const onKeyDown = useStepKeyDown();
  const steps = getBookingSteps(view, reviewStage);

  return (
    <nav aria-label="Booking progress" data-step-group>
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`h-[1.5px] w-5 ${
                  steps[index - 1].status === 'done' ? 'bg-navy' : 'bg-fuselage-line'
                }`}
              />
            )}
            {step.view ? (
              <button
                type="button"
                data-step-view={step.view}
                aria-current={step.status === 'current' ? 'step' : undefined}
                aria-label={step.isRevisitable ? `Go back to ${step.label}` : undefined}
                onClick={() => setView(step.view ?? 'seats')}
                onKeyDown={onKeyDown}
                className="group/step flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
              >
                <StepContent step={step} />
              </button>
            ) : (
              <span
                aria-current={step.status === 'current' ? 'step' : undefined}
                className="flex items-center gap-2 px-2 py-1"
              >
                <StepContent step={step} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
