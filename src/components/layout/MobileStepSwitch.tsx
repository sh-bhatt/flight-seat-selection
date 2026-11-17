'use client';

import {
  SWITCHABLE_VIEWS,
  TOTAL_STEPS,
  getCurrentStep,
} from '@/components/layout/stepModel';
import { useStepKeyDown } from '@/components/layout/useStepKeyDown';
import { useMainView, type MainView } from '@/context/ViewContext';

const VIEW_LABEL: Record<MainView, string> = {
  seats: 'Seats',
  meals: 'Meals',
};

/** Phone step indicator: "Step 2 of 4 · Seats" plus the Seats / Meals switch. */
export function MobileStepSwitch() {
  const { view, setView, reviewStage } = useMainView();
  const onKeyDown = useStepKeyDown();
  const current = getCurrentStep(view, reviewStage);

  return (
    <nav
      aria-label="Booking progress"
      data-step-group
      className="flex items-center justify-between gap-3"
    >
      <p className="text-[13px] font-semibold text-foreground">
        Step {current.number} of {TOTAL_STEPS} · {current.label}
      </p>
      <div className="flex rounded-[10px] bg-track p-0.5">
        {SWITCHABLE_VIEWS.map((id) => {
          const isCurrent = reviewStage === 'closed' && id === view;
          return (
            <button
              key={id}
              type="button"
              data-step-view={id}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => setView(id)}
              onKeyDown={onKeyDown}
              className={`h-8 min-w-[4.5rem] rounded-lg px-3 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy ${
                isCurrent
                  ? 'bg-surface text-foreground shadow-[0_1px_3px_rgba(10,37,64,0.15)]'
                  : 'text-ink-secondary'
              }`}
            >
              {VIEW_LABEL[id]}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
