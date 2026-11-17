'use client';

import type { KeyboardEvent } from 'react';
import { useMainView, type MainView } from '@/context/ViewContext';

const TABS: readonly { id: MainView; label: string }[] = [
  { id: 'seats', label: 'Seats' },
  { id: 'meals', label: 'Meals' },
];

export const tabId = (view: MainView) => `main-tab-${view}`;
export const panelId = (view: MainView) => `main-panel-${view}`;

/** Seats | Meals switcher. Arrow keys move between tabs. */
export function MainTabs() {
  const { view, setView } = useMainView();

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = TABS.find((tab) => tab.id !== view);
    if (!next) return;
    setView(next.id);
    document.getElementById(tabId(next.id))?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Booking steps"
      className="inline-flex self-start rounded-xl border border-line bg-surface-sunken p-1"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === view;
        return (
          <button
            key={tab.id}
            id={tabId(tab.id)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId(tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setView(tab.id)}
            onKeyDown={onKeyDown}
            className={`h-9 min-w-24 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isActive
                ? 'bg-accent text-accent-ink shadow-sm'
                : 'text-ink-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
