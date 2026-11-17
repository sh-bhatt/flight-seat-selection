'use client';

import { PriceBreakdown } from '@/components/summary/PriceBreakdown';
import { Button } from '@/components/ui/Button';
import { CheckIcon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { useBookingActions } from '@/context/BookingContext';
import { useMainView } from '@/context/ViewContext';
import { FLIGHT } from '@/data/flight';

/**
 * The final step, one modal in two stages (`reviewStage` in ViewContext):
 * "review" lists the selections with Back / Confirm, "confirmed" says they are
 * saved. A seat and meal selection demo: nothing is sent anywhere.
 */
export function ReviewDialog() {
  const { reset } = useBookingActions();
  const { reviewStage, setReviewStage, setView } = useMainView();
  const isConfirmed = reviewStage === 'confirmed';
  const close = () => setReviewStage('closed');

  return (
    <Modal
      open={reviewStage !== 'closed'}
      title={isConfirmed ? "You're all set" : 'Review your selections'}
      onClose={close}
    >
      {isConfirmed ? (
        <>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <CheckIcon className="size-5" />
            </span>
            <p className="text-sm text-ink-secondary">
              Your seats and meals are saved for {FLIGHT.origin} →{' '}
              {FLIGHT.destination} on {FLIGHT.date}.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                setView('seats');
                close();
              }}
            >
              Start a new selection
            </Button>
            <Button onClick={close} autoFocus>
              Done
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-secondary">
            {FLIGHT.origin} → {FLIGHT.destination} · {FLIGHT.number} · {FLIGHT.date}
          </p>
          <PriceBreakdown />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Back
            </Button>
            <Button onClick={() => setReviewStage('confirmed')} autoFocus>
              Confirm
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
