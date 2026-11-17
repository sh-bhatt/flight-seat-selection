'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { LAYOUT_IDS, LAYOUTS } from '@/data/layouts';
import { formatCount } from '@/lib/formatCount';
import { getAssignedCount } from '@/state/selectors';
import type { LayoutId } from '@/types';

/** "2-3-2" -> "2–3–2" (en dash, as printed on the control). */
function formatLayoutLabel(layoutId: LayoutId): string {
  return layoutId.replaceAll('-', '–');
}

export function LayoutToggle() {
  const state = useBooking();
  const { setLayout } = useBookingActions();
  const { showToast } = useToast();
  const [pendingLayout, setPendingLayout] = useState<LayoutId | null>(null);

  const assignedCount = getAssignedCount(state);
  const selections = formatCount(assignedCount, 'seat selection');

  function applyLayout(layoutId: LayoutId) {
    setLayout(layoutId);
    const cleared = assignedCount > 0 ? ` · ${selections} cleared` : '';
    showToast(
      `Switched to ${formatLayoutLabel(layoutId)} layout${cleared}`,
      'info',
    );
  }

  function requestLayout(layoutId: LayoutId) {
    if (layoutId === state.layoutId) return;
    if (assignedCount > 0) setPendingLayout(layoutId);
    else applyLayout(layoutId);
  }

  function confirmSwitch() {
    if (pendingLayout) applyLayout(pendingLayout);
    setPendingLayout(null);
  }

  return (
    <>
      <div
        role="group"
        aria-label="Cabin layout"
        className="inline-flex rounded-[10px] bg-track p-[3px]"
      >
        {LAYOUT_IDS.map((layoutId) => {
          const isActive = layoutId === state.layoutId;
          return (
            <button
              key={layoutId}
              type="button"
              aria-pressed={isActive}
              aria-label={`Layout ${LAYOUTS[layoutId].label}`}
              onClick={() => requestLayout(layoutId)}
              className={`h-8 min-w-[4.5rem] rounded-lg px-4 text-[13px] font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                isActive
                  ? 'bg-surface text-foreground shadow-[0_1px_3px_rgba(10,37,64,0.18)]'
                  : 'text-ink-secondary hover:text-foreground'
              }`}
            >
              {formatLayoutLabel(layoutId)}
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        open={pendingLayout !== null}
        title="Switch layout?"
        confirmLabel="Switch layout"
        onConfirm={confirmSwitch}
        onCancel={() => setPendingLayout(null)}
      >
        Switching layout will clear {selections}.
      </ConfirmDialog>
    </>
  );
}
