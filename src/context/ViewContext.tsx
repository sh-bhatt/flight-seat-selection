'use client';

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type MainView = 'seats' | 'meals';

/** The final review modal: closed, listing the selections, or after Confirm. */
export type ReviewStage = 'closed' | 'review' | 'confirmed';

interface ViewContextValue {
  view: MainView;
  setView: (view: MainView) => void;
  reviewStage: ReviewStage;
  setReviewStage: (stage: ReviewStage) => void;
}

const ViewContext = createContext<ViewContextValue | null>(null);

/**
 * Which step (Seats / Meals) the main area shows. UI-only, so not in the booking
 * reducer. Going to Seats also scrolls the page to the top; selections are untouched.
 */
export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<MainView>('seats');
  const [reviewStage, setReviewStage] = useState<ReviewStage>('closed');
  const setView = useCallback((next: MainView) => {
    setViewState(next);
    if (next === 'seats') window.scrollTo({ top: 0 });
  }, []);
  const value = useMemo(
    () => ({ view, setView, reviewStage, setReviewStage }),
    [view, setView, reviewStage],
  );
  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export function useMainView(): ViewContextValue {
  const value = useContext(ViewContext);
  if (!value) throw new Error('useMainView must be used inside ViewProvider');
  return value;
}
