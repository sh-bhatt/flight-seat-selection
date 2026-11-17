'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { LAYOUT_IDS } from '@/data/layouts';
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

  function applyLayout(layoutId: LayoutId) {
    setLayout(layoutId);
    showToast(`Switched to ${formatLayoutLabel(layoutId)} layout`, 'info');
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
        className="inline-flex rounded-xl border border-line bg-surface-sunken p-1"
      >
        {LAYOUT_IDS.map((layoutId) => {
          const isActive = layoutId === state.layoutId;
          return (
            <button
              key={layoutId}
              type="button"
              aria-pressed={isActive}
              onClick={() => requestLayout(layoutId)}
              className={`h-9 min-w-20 rounded-lg px-4 text-sm font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isActive
                  ? 'bg-accent text-accent-ink shadow-sm'
                  : 'text-ink-muted hover:text-foreground'
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
        Switching layout will clear {assignedCount} seat{' '}
        {assignedCount === 1 ? 'selection' : 'selections'}.
      </ConfirmDialog>
    </>
  );
}
