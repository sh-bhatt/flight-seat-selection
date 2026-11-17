import type { SeatCategory, SeatStatus } from '@/types';

interface SeatFaceProps {
  status: SeatStatus;
  category: SeatCategory;
  /** Shown on selected seats. */
  initial?: string;
  /** Free seats get a small dot so "no extra charge" is visible at a glance. */
  isFree?: boolean;
  /** Legend status swatches: available without the category tint or free dot. */
  neutral?: boolean;
}

const AVAILABLE_CLASSES: Record<SeatCategory, string> = {
  standard: 'border-seat-standard-line bg-seat-standard',
  premium: 'border-seat-premium-line bg-seat-premium',
  'extra-legroom': 'border-seat-legroom-line bg-seat-legroom',
};

const STATUS_CLASSES: Record<Exclude<SeatStatus, 'available'>, string> = {
  occupied: 'border-seat-occupied bg-seat-occupied text-seat-occupied-ink',
  // Both selected statuses carry the pop class, so it plays once when a seat
  // becomes selected and not again when the active passenger changes.
  'selected-current':
    'animate-seat-pop border-accent bg-accent text-accent-ink shadow-[0_0_0_3px_var(--accent-soft)]',
  'selected-other':
    'animate-seat-pop border-seat-other bg-seat-other text-seat-other-ink',
};

/** Extra-legroom seats are drawn taller, a cue that does not rely on color. */
function getSizeClasses(category: SeatCategory): string {
  return category === 'extra-legroom'
    ? 'h-11 w-9'
    : 'h-9 w-9';
}

function getGlyph({ status, initial, isFree, neutral }: SeatFaceProps) {
  if (status === 'occupied') return '✕';
  if (status === 'selected-current' || status === 'selected-other') {
    return initial;
  }
  return isFree && !neutral ? (
    <span className="size-1.5 rounded-full bg-seat-free" />
  ) : null;
}

/** The painted seat. Shared by the interactive Seat button and the legend. */
export function SeatFace(props: SeatFaceProps) {
  const { status, category, neutral } = props;
  const availableClasses = neutral
    ? 'border-line bg-surface'
    : AVAILABLE_CLASSES[category];
  const stateClasses =
    status === 'available' ? availableClasses : STATUS_CLASSES[status];
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-t-lg rounded-b-sm border-2 border-b-[5px] text-[11px] font-bold leading-none transition-[transform,box-shadow] select-none group-hover/seat:-translate-y-px ${getSizeClasses(category)} ${stateClasses}`}
    >
      {getGlyph(props)}
    </span>
  );
}
