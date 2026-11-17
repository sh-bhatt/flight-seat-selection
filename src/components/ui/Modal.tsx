'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

type ModalVariant = 'dialog' | 'sheet';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** `sheet` docks to the bottom edge (mobile summary). */
  variant?: ModalVariant;
}

const VARIANT_CLASSES: Record<ModalVariant, string> = {
  dialog: 'm-auto w-[min(26rem,calc(100vw-2rem))] rounded-[14px]',
  sheet:
    'mx-0 mt-auto mb-0 max-h-[85vh] w-full max-w-none rounded-t-[14px] rounded-b-none',
};

/**
 * Built on the native modal <dialog>: the browser traps focus inside it, makes
 * the rest of the page inert, closes on Esc and restores focus to the trigger.
 */
export function Modal({
  open,
  title,
  children,
  onClose,
  variant = 'dialog',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // The sheet hosts a self-contained card (its own heading), so it skips the
  // padding and keeps the title for assistive tech only.
  const isSheet = variant === 'sheet';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Esc: let React state own the open flag instead of the browser.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`border border-line bg-surface p-0 text-foreground shadow-[0_24px_48px_-12px_rgba(10,37,64,0.25)] backdrop:bg-navy/50 ${VARIANT_CLASSES[variant]}`}
    >
      <div className={isSheet ? 'flex flex-col' : 'flex flex-col gap-4 p-6'}>
        <h2
          id={titleId}
          className={isSheet ? 'sr-only' : 'text-lg font-bold tracking-tight'}
        >
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
