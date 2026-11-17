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
  dialog: 'm-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl',
  sheet:
    'mx-0 mt-auto mb-0 max-h-[85vh] w-full max-w-none rounded-t-2xl rounded-b-none',
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
      className={`border border-line bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/50 ${VARIANT_CLASSES[variant]}`}
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
