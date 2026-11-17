'use client';

import { PriceBreakdown } from '@/components/summary/PriceBreakdown';
import { Button } from '@/components/ui/Button';
import { CheckIcon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { useBookingActions } from '@/context/BookingContext';
import { FLIGHT } from '@/data/flight';

interface BookingSuccessDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Mock confirmation: nothing is sent anywhere. */
export function BookingSuccessDialog({
  open,
  onClose,
}: BookingSuccessDialogProps) {
  const { reset } = useBookingActions();

  return (
    <Modal open={open} title="Booking confirmed" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
            <CheckIcon className="size-5" />
          </span>
          <p className="text-sm text-ink-muted">
            {FLIGHT.origin} → {FLIGHT.destination} · {FLIGHT.number} ·{' '}
            {FLIGHT.date}
          </p>
        </div>
        <PriceBreakdown />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            onClose();
          }}
        >
          New booking
        </Button>
        <Button onClick={onClose} autoFocus>
          Done
        </Button>
      </div>
    </Modal>
  );
}
