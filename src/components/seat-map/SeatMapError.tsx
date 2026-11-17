import { Button } from '@/components/ui/Button';

/** Shown when the seat map request fails; Retry sends it again. */
export function SeatMapError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-[14px] border border-line bg-surface px-6 py-12 text-center"
    >
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-full bg-danger-soft text-lg font-extrabold text-danger"
      >
        !
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold">We couldn&apos;t load the seat map</h2>
        <p className="text-sm text-ink-secondary">
          Check your connection and try again. Your passengers and meals are
          safe.
        </p>
      </div>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}
