'use client';

import { BookingSteps } from '@/components/layout/BookingSteps';
import { MobileStepSwitch } from '@/components/layout/MobileStepSwitch';
import { PlaneIcon } from '@/components/ui/Icons';
import { useBooking } from '@/context/BookingContext';
import { FLIGHT } from '@/data/flight';
import { formatCount } from '@/lib/formatCount';

function Airport({
  code,
  city,
  time,
}: {
  code: string;
  city: string;
  time: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[22px] leading-none font-extrabold tracking-tight">
        {code}
        <span className="sr-only"> {city}</span>
      </p>
      <p className="text-[13px] leading-none text-ink-muted tabular-nums">{time}</p>
    </div>
  );
}

/** Route, flight facts and the step indicator; collapses to one line on phones. */
export function FlightStrip() {
  const { passengers } = useBooking();

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto hidden max-w-[1360px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-8 py-[18px] md:flex">
        <div
          role="group"
          aria-label={`Flight ${FLIGHT.number} from ${FLIGHT.originCity} to ${FLIGHT.destinationCity}`}
          className="flex flex-wrap items-center gap-x-5 gap-y-3"
        >
          <Airport code={FLIGHT.origin} city={FLIGHT.originCity} time={FLIGHT.departure} />
          <div className="flex w-40 flex-col items-center gap-1.5">
            <p className="text-xs font-semibold text-ink-secondary">
              {FLIGHT.duration} · {FLIGHT.stops}
            </p>
            <div aria-hidden="true" className="relative h-px w-full bg-fuselage-line">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-1.5 text-ink-secondary">
                <PlaneIcon className="size-4 rotate-45" />
              </span>
            </div>
          </div>
          <Airport
            code={FLIGHT.destination}
            city={FLIGHT.destinationCity}
            time={FLIGHT.arrival}
          />
          <span aria-hidden="true" className="mx-2 h-9 w-px bg-line" />
          <p className="text-[13px] text-ink-muted">
            {FLIGHT.date} · {FLIGHT.number} · {formatCount(passengers.length, 'adult')}
          </p>
        </div>
        <BookingSteps />
      </div>

      <div className="flex flex-col gap-3 px-4 py-3 md:hidden">
        <p className="text-[13px] font-semibold">
          {FLIGHT.origin} → {FLIGHT.destination} · {FLIGHT.departure} · {FLIGHT.date}
        </p>
        <MobileStepSwitch />
      </div>
    </div>
  );
}
