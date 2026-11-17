import type { SeatCategory, SeatStatus } from '@/types';

type SeatFaceSize = 'seat' | 'swatch';

interface SeatFaceProps {
  status: SeatStatus;
  category: SeatCategory;
  /** Passenger initials, shown on selected seats. */
  initial?: string;
  /** `swatch` is the small legend chip; `seat` is the real 38 × 40 seat. */
  size?: SeatFaceSize;
}

const AVAILABLE_CLASSES: Record<SeatCategory, string> = {
  standard: 'border-seat-standard-line bg-seat-standard',
  premium: 'border-seat-premium-line bg-seat-premium',
  'extra-legroom': 'border-seat-legroom-line bg-seat-legroom',
};

/** The 3px navy hover / focus ring; the navy seat gets a white gap so it stays visible. */
const RING_CLASSES =
  'group-hover/seat:shadow-[0_0_0_3px_var(--navy)] group-focus-visible/seat:shadow-[0_0_0_3px_var(--navy)]';
const RING_ON_NAVY_CLASSES =
  'group-hover/seat:shadow-[0_0_0_2px_#fff,0_0_0_5px_var(--navy)] group-focus-visible/seat:shadow-[0_0_0_2px_#fff,0_0_0_5px_var(--navy)]';

const STATUS_CLASSES: Record<Exclude<SeatStatus, 'available'>, string> = {
  occupied: 'border-seat-occupied bg-seat-occupied text-seat-occupied-ink',
  // Both selected statuses carry the pop class, so it plays once when a seat
  // becomes selected and not again when the active passenger changes.
  'selected-current': 'animate-seat-pop border-navy bg-navy text-white',
  'selected-other':
    'animate-seat-pop border-seat-group-line bg-seat-group text-foreground',
};

/** Extra-legroom seats are drawn taller, a cue that does not rely on color. */
function getSizeClasses(size: SeatFaceSize, category: SeatCategory): string {
  if (size === 'swatch') {
    return 'h-[18px] w-4 rounded-[5px_5px_3px_3px] border border-t-[3px] text-[8px]';
  }
  const height = category === 'extra-legroom' ? 'h-[46px]' : 'h-10';
  return `${height} w-[38px] rounded-[10px_10px_6px_6px] border-[1.5px] border-t-[5px] text-[10px]`;
}

function getGlyph({ status, initial }: SeatFaceProps) {
  if (status === 'occupied') return '✕';
  if (status === 'selected-current' || status === 'selected-other') {
    return initial;
  }
  return null;
}

/** The painted seat. Shared by the interactive Seat button and the legend. */
export function SeatFace(props: SeatFaceProps) {
  const { status, category, size = 'seat' } = props;
  const stateClasses =
    status === 'available' ? AVAILABLE_CLASSES[category] : STATUS_CLASSES[status];
  const ringClasses =
    size === 'swatch'
      ? ''
      : status === 'selected-current'
        ? RING_ON_NAVY_CLASSES
        : RING_CLASSES;
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center font-bold leading-none transition-shadow select-none ${getSizeClasses(size, category)} ${stateClasses} ${ringClasses}`}
    >
      {getGlyph(props)}
    </span>
  );
}
