'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type MainView = 'seats' | 'meals';

interface ViewContextValue {
  view: MainView;
  setView: (view: MainView) => void;
}

const ViewContext = createContext<ViewContextValue | null>(null);

/** Which tab (Seats / Meals) the main area shows. UI-only, so not in the booking reducer. */
export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<MainView>('seats');
  const value = useMemo(() => ({ view, setView }), [view]);
  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export function useMainView(): ViewContextValue {
  const value = useContext(ViewContext);
  if (!value) throw new Error('useMainView must be used inside ViewProvider');
  return value;
}
