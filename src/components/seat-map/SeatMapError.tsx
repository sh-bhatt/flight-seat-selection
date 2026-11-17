import { Button } from '@/components/ui/Button';

/** Shown when the seat map request fails; Retry sends it again. */
export function SeatMapError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-danger/50 bg-surface px-6 py-12 text-center"
    >
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-full bg-danger text-lg font-bold text-danger-ink"
      >
        !
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">
          We couldn&apos;t load the seat map
        </h3>
        <p className="text-sm text-ink-muted">
          Check your connection and try again. Your passengers and meals are
          safe.
        </p>
      </div>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}
