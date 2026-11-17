'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { MAX_NAME_LENGTH } from '@/state/bookingReducer';

interface InlineNameEditorProps {
  name: string;
  /**
   * `viaKeyboard` is true for Enter, false when the input lost focus (the
   * user already moved focus elsewhere, so it must not be pulled back).
   */
  onCommit: (name: string, viaKeyboard: boolean) => void;
  /** Esc: always a keyboard action. */
  onCancel: () => void;
}

/** The counter appears this many characters before the limit. */
const COUNTER_THRESHOLD = 6;

function getHint(length: number): string | null {
  if (length === 0) return 'Empty names go back to the default';
  if (length >= MAX_NAME_LENGTH) return `${length}/${MAX_NAME_LENGTH} · limit reached`;
  if (length >= MAX_NAME_LENGTH - COUNTER_THRESHOLD) {
    return `${length}/${MAX_NAME_LENGTH}`;
  }
  return null;
}

/** Enter or blur saves, Esc cancels. The reducer trims and applies the default. */
export function InlineNameEditor({
  name,
  onCommit,
  onCancel,
}: InlineNameEditorProps) {
  const isFinished = useRef(false);
  const hintId = useId();
  const [length, setLength] = useState(name.length);
  const hint = getHint(length);

  function finish(run: () => void) {
    if (isFinished.current) return;
    isFinished.current = true;
    run();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const { value } = event.currentTarget;
    if (event.key === 'Enter') finish(() => onCommit(value, true));
    if (event.key === 'Escape') finish(onCancel);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <input
        autoFocus
        defaultValue={name}
        maxLength={MAX_NAME_LENGTH}
        aria-label="Passenger name"
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => setLength(event.currentTarget.value.length)}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          const { value } = event.currentTarget;
          finish(() => onCommit(value, false));
        }}
        onClick={(event) => event.stopPropagation()}
        className="h-8 min-w-0 rounded-md border-2 border-navy bg-surface px-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-navy/20"
      />
      <p
        id={hintId}
        aria-live="polite"
        className={`min-h-4 text-[11px] leading-4 ${
          length >= MAX_NAME_LENGTH ? 'font-semibold text-danger' : 'text-ink-muted'
        }`}
      >
        {hint}
      </p>
    </div>
  );
}
