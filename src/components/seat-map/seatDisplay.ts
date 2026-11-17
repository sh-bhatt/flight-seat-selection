import { formatCurrency } from '@/lib/formatCurrency';
import type { SeatClickOutcome } from '@/state/bookingReducer';
import type { ToastVariant } from '@/components/ui/Toast';
import type { Seat, SeatCategory, SeatPosition, SeatStatus } from '@/types';

export const CATEGORY_LABEL: Record<SeatCategory, string> = {
  standard: 'Standard',
  premium: 'Premium',
  'extra-legroom': 'Extra legroom',
};

export const POSITION_LABEL: Record<SeatPosition, string> = {
  window: 'Window',
  middle: 'Middle',
  aisle: 'Aisle',
};

export function getStatusLabel(status: SeatStatus, ownerName?: string): string {
  switch (status) {
    case 'available':
      return 'available';
    case 'occupied':
      return 'occupied';
    case 'selected-current':
    case 'selected-other':
      return ownerName ? `selected by ${ownerName}` : 'selected';
  }
}

/** e.g. "Seat 12C, Premium, ₹250, available" */
export function getSeatAriaLabel(
  seat: Seat,
  status: SeatStatus,
  ownerName?: string,
): string {
  return [
    `Seat ${seat.id}`,
    CATEGORY_LABEL[seat.category],
    formatCurrency(seat.price),
    getStatusLabel(status, ownerName),
  ].join(', ');
}

export function getOutcomeToastVariant(outcome: SeatClickOutcome): ToastVariant {
  if (outcome.type === 'blocked') return 'error';
  return outcome.type === 'removed' ? 'info' : 'success';
}
