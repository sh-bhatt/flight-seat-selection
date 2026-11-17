'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { BookingProvider } from '@/context/BookingContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <BookingProvider>{children}</BookingProvider>
    </ToastProvider>
  );
}
