'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import {
  getSeatActionText,
  getSeatDescription,
} from '@/components/seat-map/seatDisplay';
import { formatCurrency } from '@/lib/formatCurrency';
import type { Seat, SeatStatus } from '@/types';

const CARD_WIDTH = 210;
const EDGE_MARGIN = 8;

/**
 * Pins the card above its seat (below when there is no room), in viewport
 * coordinates. `position: fixed` lets it escape the cabin's scroll box, which
 * would otherwise clip it on the first rows. Written straight to the style so
 * no state update is needed during layout.
 */
function useAnchoredAbove(
  anchorRef: RefObject<HTMLElement | null>,
  cardRef: RefObject<HTMLElement | null>,
) {
  function place() {
    const anchor = anchorRef.current;
    const card = cardRef.current;
    if (!anchor || !card) return;
    const rect = anchor.getBoundingClientRect();
    const above = rect.top - card.offsetHeight - EDGE_MARGIN;
    const top = above >= EDGE_MARGIN ? above : rect.bottom + EDGE_MARGIN;
    const centered = rect.left + rect.width / 2 - CARD_WIDTH / 2;
    const maxLeft = window.innerWidth - CARD_WIDTH - EDGE_MARGIN;
    card.style.top = `${top}px`;
    card.style.left = `${Math.min(Math.max(centered, EDGE_MARGIN), maxLeft)}px`;
  }

  // The content can change while shown (hover moves, names), so re-place every render.
  useLayoutEffect(place);
  useEffect(() => {
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  });
}

interface SeatHoverCardProps {
  id: string;
  anchorRef: RefObject<HTMLElement | null>;
  seat: Seat;
  status: SeatStatus;
  activeName: string;
  ownerName?: string;
  /** Another passenger seated right beside this seat. */
  companionName?: string;
}

/**
 * Informational card for the hovered or keyboard-focused seat (md and up).
 * No buttons: the seat itself is the control and points here via aria-describedby.
 */
export function SeatHoverCard({
  id,
  anchorRef,
  seat,
  status,
  activeName,
  ownerName,
  companionName,
}: SeatHoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  useAnchoredAbove(anchorRef, cardRef);

  return (
    <div
      ref={cardRef}
      id={id}
      role="tooltip"
      style={{ width: CARD_WIDTH }}
      className="pointer-events-none fixed z-50 hidden rounded-xl border border-line bg-surface p-3.5 text-left shadow-[0_16px_40px_-8px_rgba(10,37,64,0.28)] md:block"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xl leading-none font-extrabold">{seat.id}</span>
        <span className="text-[15px] leading-none font-bold tabular-nums">
          {formatCurrency(seat.price)}
        </span>
      </div>
      <p className="mt-2 text-[13px] text-ink-secondary [overflow-wrap:anywhere]">
        {getSeatDescription(seat)}
        {companionName && ` · Next to ${companionName}`}
      </p>
      <p className="mt-1.5 text-xs text-ink-muted [overflow-wrap:anywhere]">
        {getSeatActionText(status, activeName, ownerName)}
      </p>
    </div>
  );
}
