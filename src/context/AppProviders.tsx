'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { BookingProvider } from '@/context/BookingContext';
import { ViewProvider } from '@/context/ViewContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <BookingProvider>
        <ViewProvider>{children}</ViewProvider>
      </BookingProvider>
    </ToastProvider>
  );
}
