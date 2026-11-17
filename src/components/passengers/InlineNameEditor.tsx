'use client';

import { useRef, type KeyboardEvent } from 'react';
import { MAX_NAME_LENGTH } from '@/state/bookingReducer';

interface InlineNameEditorProps {
  name: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}

/** Enter or blur saves, Esc cancels. The reducer trims and applies the default. */
export function InlineNameEditor({
  name,
  onCommit,
  onCancel,
}: InlineNameEditorProps) {
  const isFinished = useRef(false);

  function finish(commit: boolean, value: string) {
    if (isFinished.current) return;
    isFinished.current = true;
    if (commit) onCommit(value);
    else onCancel();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') finish(true, event.currentTarget.value);
    if (event.key === 'Escape') finish(false, name);
  }

  return (
    <input
      autoFocus
      defaultValue={name}
      maxLength={MAX_NAME_LENGTH}
      aria-label="Passenger name"
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={handleKeyDown}
      onBlur={(event) => finish(true, event.currentTarget.value)}
      onClick={(event) => event.stopPropagation()}
      className="h-8 min-w-0 flex-1 rounded-md border border-accent bg-surface px-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-accent-soft"
    />
  );
}
