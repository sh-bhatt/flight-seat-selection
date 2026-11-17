'use client';

import { useState } from 'react';
import { InlineNameEditor } from '@/components/passengers/InlineNameEditor';
import { PassengerAvatar } from '@/components/passengers/PassengerAvatar';
import { SeatBadge } from '@/components/passengers/SeatBadge';
import { usePassengerActions } from '@/components/passengers/usePassengerActions';
import { PencilIcon } from '@/components/ui/Icons';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
import { getActivePassenger } from '@/state/selectors';

/**
 * Mobile passenger switcher: a horizontally scrollable row of chips, plus an
 * "Edit name" control for the active passenger (phones have no hover actions).
 */
export function PassengerChips() {
  const state = useBooking();
  const { setActivePassenger } = useBookingActions();
  const { rename } = usePassengerActions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const { targetRef: editButtonRef, requestFocus } =
    useFocusAfterRender<HTMLButtonElement>();
  const active = getActivePassenger(state);

  return (
    <div className="flex flex-col gap-1.5">
      <ul
        aria-label="Passengers"
        className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 py-1"
      >
        {state.passengers.map((passenger) => {
          const isActive = passenger.id === state.activePassengerId;
          return (
            <li key={passenger.id} className="shrink-0 snap-start">
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => setActivePassenger(passenger.id)}
                className={`flex h-11 items-center gap-2 rounded-full border-[1.5px] py-1 pr-3 pl-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                  isActive ? 'border-navy bg-selected' : 'border-line bg-surface'
                }`}
              >
                <PassengerAvatar name={passenger.name} isActive={isActive} size="sm" />
                <span className="max-w-28 truncate">{passenger.name}</span>
                {passenger.seatId !== null && <SeatBadge seatId={passenger.seatId} />}
              </button>
            </li>
          );
        })}
      </ul>

      {active &&
        (editingId === active.id ? (
          <InlineNameEditor
            name={active.name}
            onCommit={(name, viaKeyboard) => {
              if (viaKeyboard) requestFocus();
              rename(active.id, name);
              setEditingId(null);
            }}
            onCancel={() => {
              requestFocus();
              setEditingId(null);
            }}
          />
        ) : (
          <button
            ref={editButtonRef}
            type="button"
            onClick={() => setEditingId(active.id)}
            className="-ml-1 inline-flex h-11 min-w-0 items-center gap-1.5 self-start rounded-lg px-1 text-[13px] font-semibold text-ink-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
          >
            <PencilIcon className="size-3.5 shrink-0" />
            <span className="truncate">Edit name of {active.name}</span>
          </button>
        ))}
    </div>
  );
}
