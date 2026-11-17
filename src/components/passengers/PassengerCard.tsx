'use client';

import { useState } from 'react';
import { InlineNameEditor } from '@/components/passengers/InlineNameEditor';
import { SeatBadge } from '@/components/passengers/SeatBadge';
import { CATEGORY_LABEL } from '@/components/seat-map/seatDisplay';
import { IconButton } from '@/components/ui/IconButton';
import { CloseIcon, PencilIcon } from '@/components/ui/Icons';
import { formatCurrency } from '@/lib/formatCurrency';
import type { MealOption, Passenger, Seat } from '@/types';

interface PassengerCardProps {
  passenger: Passenger;
  seat: Seat | undefined;
  meal: MealOption | undefined;
  isActive: boolean;
  onSelect: (passengerId: string) => void;
  onRename: (passengerId: string, name: string) => void;
  onRemoveSeat: (passengerId: string) => void;
}

export function PassengerCard({
  passenger,
  seat,
  meal,
  isActive,
  onSelect,
  onRename,
  onRemoveSeat,
}: PassengerCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <li
      onClick={() => onSelect(passenger.id)}
      aria-current={isActive ? 'true' : undefined}
      className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition ${
        isActive
          ? 'border-accent bg-accent-soft shadow-sm'
          : 'border-line bg-surface hover:border-seat-standard-line'
      }`}
    >
      <div className="flex items-center gap-1">
        {isEditing ? (
          <InlineNameEditor
            name={passenger.name}
            onCommit={(name) => {
              onRename(passenger.id, name);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <button
              type="button"
              aria-pressed={isActive}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(passenger.id);
              }}
              className="min-w-0 flex-1 truncate rounded-md text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {passenger.name}
            </button>
            <IconButton
              label={`Edit name of ${passenger.name}`}
              onClick={(event) => {
                event.stopPropagation();
                setIsEditing(true);
              }}
            >
              <PencilIcon />
            </IconButton>
          </>
        )}
        {seat && !isEditing && (
          <IconButton
            label={`Remove seat ${seat.id} from ${passenger.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onRemoveSeat(passenger.id);
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <SeatBadge seatId={seat?.id ?? null} />
        {seat && (
          <span className="text-xs text-ink-muted">
            {CATEGORY_LABEL[seat.category]} ·{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(seat.price)}
            </span>
          </span>
        )}
      </div>

      {meal && (
        <p className="text-xs text-ink-muted">
          Meal: {meal.name} ·{' '}
          <span className="tabular-nums">{formatCurrency(meal.price)}</span>
        </p>
      )}
    </li>
  );
}
