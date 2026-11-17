'use client';

import { useState } from 'react';
import { InlineNameEditor } from '@/components/passengers/InlineNameEditor';
import { PassengerAvatar } from '@/components/passengers/PassengerAvatar';
import { NowBadge, SeatBadge } from '@/components/passengers/SeatBadge';
import { CATEGORY_LABEL } from '@/components/seat-map/seatDisplay';
import { IconButton } from '@/components/ui/IconButton';
import { CloseIcon, PencilIcon } from '@/components/ui/Icons';
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
import type { Passenger, Seat } from '@/types';

interface PassengerRowProps {
  passenger: Passenger;
  seat: Seat | undefined;
  isActive: boolean;
  onSelect: (passengerId: string) => void;
  onRename: (passengerId: string, name: string) => void;
  onRemoveSeat: (passengerId: string) => void;
}

function getSubline(seat: Seat | undefined, isActive: boolean): string {
  if (seat) return `Adult · ${CATEGORY_LABEL[seat.category]}`;
  return isActive ? 'Adult · Selecting seat' : 'Adult · No seat yet';
}

/**
 * One traveller: avatar, name, seat info and a status pill. The whole row is a
 * button that makes them the active passenger. Rename and remove-seat buttons
 * appear on hover or when anything in the row has keyboard focus, and are
 * always shown on touch screens (no hover there). When one of them closes
 * itself (seat removed, rename finished by keyboard) focus returns to the row.
 */
export function PassengerRow({
  passenger,
  seat,
  isActive,
  onSelect,
  onRename,
  onRemoveSeat,
}: PassengerRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { targetRef: rowButtonRef, requestFocus } =
    useFocusAfterRender<HTMLButtonElement>();

  return (
    <li
      onClick={() => onSelect(passenger.id)}
      aria-current={isActive ? 'true' : undefined}
      className={`group relative flex cursor-pointer items-center gap-1.5 rounded-[10px] border-[1.5px] p-[8.5px] transition-colors ${
        isActive
          ? 'border-navy bg-selected'
          : 'border-transparent hover:bg-surface-sunken'
      }`}
    >
      {isEditing ? (
        <>
          <PassengerAvatar name={passenger.name} isActive={isActive} />
          <InlineNameEditor
            name={passenger.name}
            onCommit={(name, viaKeyboard) => {
              if (viaKeyboard) requestFocus();
              onRename(passenger.id, name);
              setIsEditing(false);
            }}
            onCancel={() => {
              requestFocus();
              setIsEditing(false);
            }}
          />
        </>
      ) : (
        <button
          ref={rowButtonRef}
          type="button"
          aria-pressed={isActive}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(passenger.id);
          }}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <PassengerAvatar name={passenger.name} isActive={isActive} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm leading-tight font-semibold">
              {passenger.name}
            </span>
            <span className="text-xs leading-snug text-ink-muted [overflow-wrap:anywhere]">
              {getSubline(seat, isActive)}
            </span>
          </span>
        </button>
      )}

      <span className="flex shrink-0 justify-end">
        {seat ? <SeatBadge seatId={seat.id} /> : isActive ? <NowBadge /> : null}
      </span>

      {!isEditing && (
        <span className="absolute top-1/2 right-[4.25rem] flex -translate-y-1/2 items-center gap-0.5 rounded-lg bg-surface-sunken p-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:static pointer-coarse:translate-y-0 pointer-coarse:bg-transparent pointer-coarse:opacity-100">
          <IconButton
            size="sm"
            label={`Edit name of ${passenger.name}`}
            onClick={(event) => {
              event.stopPropagation();
              setIsEditing(true);
            }}
          >
            <PencilIcon className="size-3.5" />
          </IconButton>
          {seat && (
            <IconButton
              size="sm"
              label={`Remove seat ${seat.id} from ${passenger.name}`}
              onClick={(event) => {
                event.stopPropagation();
                requestFocus();
                onRemoveSeat(passenger.id);
              }}
            >
              <CloseIcon className="size-3.5" />
            </IconButton>
          )}
        </span>
      )}
    </li>
  );
}
