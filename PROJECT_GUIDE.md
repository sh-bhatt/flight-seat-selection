# Flight Seat Selection & Passenger Management — Project Guide

Personal learning doc: written so I can explain this project in an interview. Updated after every task.

## 1. Overview

A single-page app where a user picks an aircraft layout (3-2 or 2-3-2), views a seat map, adds passengers, assigns each passenger a seat (priced by category), optionally picks meals, and sees a running price summary. All data is mock and deterministic; there is no backend.

Status: **foundation + state done** (types, layouts, pricing, seat generation, currency formatting, reducer, selectors, context, reducer tests). UI and meals data are TBD.

## 2. Tech stack & why

| Tech | Why |
|---|---|
| Next.js (App Router) | Project scaffold, file-based routing, fast build/dev tooling. Note: this version has breaking changes; docs live in `node_modules/next/dist/docs/`. |
| TypeScript (strict, no `any`) | Types model the domain (Seat, Passenger...) and catch invalid states at compile time. |
| Tailwind CSS | Fast, consistent styling without separate CSS files. |
| React Context + `useReducer` | Enough for this app's state; one predictable place for business rules, no external state lib. |
| `Intl.NumberFormat('en-IN')` | Correct Indian digit grouping (₹1,25,000) with no dependency. |

## 3. Folder structure

```
PROJECT_GUIDE.md              This document
vitest.config.mts             Test config (`@` alias, node env)
src/
  types/index.ts              All shared domain types
  data/
    layouts.ts                Layout definitions (3-2, 2-3-2)
    seatPricing.ts            Category prices, pricing rules, overrides, deterministic occupancy
    meals.ts                  Meal options (stub, TBD)
    mockApi.ts                Fake async fetch (stub, TBD)
  lib/
    generateSeatMap.ts        Builds Seat[] from a layout
    formatCurrency.ts         INR formatting ("₹1,250", "Free")
  state/
    bookingReducer.ts         State, actions, getSeatClickOutcome, reducer, invariant check
    bookingReducer.test.ts    Vitest unit tests for the rules and totals
    selectors.ts              Pure derived data (status, owner, totals, breakdown)
  context/
    BookingContext.tsx        Provider + useBooking / useBookingActions / useSeatClick
  components/
    seat-map/                 Seat grid, seat button, legend (TBD)
    passengers/               Passenger list/form (TBD)
    summary/                  Price summary (TBD)
    meals/                    Meal picker (TBD)
    ui/                       Generic reusable UI (TBD)
  app/                        Next.js routes/layout
```

## 4. Data model

- **LayoutId** — `'3-2' | '2-3-2'`; the supported cabin configurations.
- **SeatCategory** — `'standard' | 'premium' | 'extra-legroom'`; drives price.
- **SeatStatus** — `'available' | 'occupied' | 'selected-current' | 'selected-other'`. *Derived*, never stored: computed from `Seat.isOccupied` plus which passenger holds the seat, so it can't go out of sync.
- **SeatPosition** — `'window' | 'middle' | 'aisle'`; used by pricing rules.
- **Seat** — `{ id: "12C", row, column, category, price, isOccupied, position }`. Static facts about a seat. Who sits there is stored on the passenger, not the seat.
- **LayoutConfig** — `{ id, label, columnGroups: string[][], rows }`. Aisles sit between column groups.
- **Passenger** — `{ id, name, seatId | null, mealId | null }`. Single source of truth for assignments (seat → passenger is derived).
- **MealOption** — `{ id, name, description, price, isVeg }`.

## 5. State management

One `useReducer` in `BookingProvider` (`src/context/BookingContext.tsx`). No external state library. All business rules live in `src/state/`; components only dispatch actions and read selectors.

**State** (`BookingState`): `{ layoutId, seats, passengers, activePassengerId, mealsEnabled }`. Seat ownership is stored **only** on `Passenger.seatId`; everything else (seat status, owner, totals) is derived.

**Actions** (discriminated union `BookingAction`): `SET_PASSENGER_COUNT`, `SET_ACTIVE_PASSENGER`, `RENAME_PASSENGER`, `SET_LAYOUT`, `SEAT_CLICKED`, `REMOVE_SEAT`, `SELECT_MEAL`, `RESET`.

**Context split**: state and dispatch are in two contexts, so components that only dispatch don't re-render on state changes. Hooks:
- `useBooking()` → current state.
- `useBookingActions()` → stable action creators (`setPassengerCount`, `setLayout`, `selectMeal`, ...).
- `useSeatClick()` → `(seatId) => SeatClickOutcome`; dispatches `SEAT_CLICKED` and returns what happened for the toast.

**One rule engine for clicks.** `getSeatClickOutcome(state, seatId)` is a pure function that decides what a click means. The reducer calls it to decide whether/how to change state; the UI calls the same function to build the toast message. The rules exist in exactly one place.

```
 user clicks seat 12C
        |
        v
 useSeatClick()(seatId)
        |
        |--> getSeatClickOutcome(state, seatId)   (pure: rules a-e)
        |         |
        |         +--> { type, reason?, message } --> returned to UI --> toast
        |
        +--> dispatch({ type: 'SEAT_CLICKED', seatId })
                    |
                    v
             bookingReducer(state, action)
                    |  calls getSeatClickOutcome again (same function)
                    |  blocked   -> return same state object (no re-render)
                    |  removed   -> passenger.seatId = null
                    |  assigned/changed -> passenger.seatId = seatId,
                    |                      then auto-advance (rule f)
                    |  dev only: assertBookingInvariants(newState)
                    v
               new state object
                    |
                    v
   selectors (getSeatStatus, getPriceBreakdown, getGrandTotal, ...)
                    |
                    v
          React re-renders subscribed components
```

**Invariant:** no seat id appears on two passengers, and each passenger has at most one seat (a single `seatId` field makes the second part structural). `assertBookingInvariants` runs after every reducer call when `NODE_ENV !== 'production'` and throws on violation (also checks the seat exists, is not occupied, and the active passenger exists).

## 6. Components

| Component | File | Responsibility | Props |
|---|---|---|---|
| TBD | | | |

## 7. Flow of execution

State flow: see the diagram in section 5. Seat generation (implemented): `generateSeatMap(layoutId)` → looks up `LAYOUTS[layoutId]` → for each row and column derives `position` → `getSeatCategory` (override → extra-legroom rows → premium rows → standard) → `getCategoryPrice` → `isSeatOccupied` (seeded hash) → `Seat[]`.

## 8. Key functions

| Name | File | Input → Output | Why it exists |
|---|---|---|---|
| `generateSeatMap` | `src/lib/generateSeatMap.ts` | `LayoutId → Seat[]` | Single place that builds a full cabin from config, so adding a layout is just data. |
| `getSeatPosition` (private) | `src/lib/generateSeatMap.ts` | column groups + indices → `SeatPosition` | Window = cabin edges; aisle = next to a gap; else middle. Works for any layout. |
| `getSeatCategory` | `src/data/seatPricing.ts` | layout, seat id, row, position → `SeatCategory` | Centralises pricing rules with explicit overrides first. |
| `getCategoryPrice` | `src/data/seatPricing.ts` | `SeatCategory → number` | Category → INR price lookup. |
| `isSeatOccupied` | `src/data/seatPricing.ts` | layout, seat id → boolean | Deterministic ~20% occupancy via FNV-1a hash (no `Math.random`, so no hydration mismatch). |
| `formatCurrency` | `src/lib/formatCurrency.ts` | `number, {forceZero?} → string` | Consistent ₹ formatting; "Free" for 0 unless `forceZero`. |
| `bookingReducer` | `src/state/bookingReducer.ts` | `(state, action) → state` | Pure transitions; runs the dev-only invariant check on every result. |
| `createInitialState` | `src/state/bookingReducer.ts` | `(layoutId?, count?) → BookingState` | Deterministic start state (3-2 layout, 1 passenger, ids `passenger-N`). |
| `getSeatClickOutcome` | `src/state/bookingReducer.ts` | `(state, seatId) → { type, reason?, message }` | Single source of truth for click rules; used by reducer and UI toast. |
| `assertBookingInvariants` | `src/state/bookingReducer.ts` | `state → void` (throws) | Dev guard: no shared seats, valid seats, valid active passenger. |
| `findNextUnseatedId` (private) | `src/state/bookingReducer.ts` | passengers, fromId → id or null | Auto-advance: next passenger in order (wrapping) with no seat. |
| `getSeatOwnerMap` | `src/state/selectors.ts` | `Passenger[] → Map<seatId, passengerId>` | O(1) owner lookups; cached per passengers array in a `WeakMap`. |
| `getSeatStatus` | `src/state/selectors.ts` | state, seat → `SeatStatus` | Derives occupied / available / selected-current / selected-other. |
| `getSeatOwner`, `getPassengerSeat` | `src/state/selectors.ts` | state, id → `Passenger` / `Seat` or undefined | Seat ↔ passenger lookups. |
| `getSeatsTotal`, `getMealsTotal`, `getGrandTotal` | `src/state/selectors.ts` | state (, meals) → number | Price totals in INR; meals list is injectable for tests. |
| `getPriceBreakdown` | `src/state/selectors.ts` | state (, meals) → per-passenger line items | Seat + meal line items and subtotal for the summary. |
| `getUnassignedCount` | `src/state/selectors.ts` | state → number | Passengers still without a seat. |
| `BookingProvider`, `useBooking`, `useBookingActions`, `useSeatClick` | `src/context/BookingContext.tsx` | n/a | Provider and typed hooks. |

## 9. Business rules & edge cases

- Prices: Standard ₹0, Premium ₹250, Extra Legroom ₹350.
- Row 1 and exit row 10 are Extra Legroom.
- Rows 2–5: window and aisle seats Premium, middle seats Standard.
- Everything else Standard.
- Explicit override map for the 3-2 layout to match the sample: 1A ₹0, 1B ₹0, 1C ₹350 (XL), 1D ₹0, 1E ₹250 (Premium), 2A ₹350 (XL), 2B ₹0. Overrides beat the row rules (e.g. 1A would otherwise be XL).
- Overridden seats are never marked occupied, so the sample design always shows them available.
- Seat letters are consecutive (A–E, A–G). The source PDF skipped 'C', treated as a typo.
- Occupancy is deterministic (hash of `layoutId:seatId`, ~20%), identical on server and client.
- `formatCurrency(0)` → "Free"; `formatCurrency(0, { forceZero: true })` → "₹0".
- Seat status is derived, not stored.
- Seat clicks (`SEAT_CLICKED`), evaluated in this order:
  - a) No active passenger → blocked (`no-passenger`), state unchanged.
  - b) Seat occupied → blocked (`occupied`).
  - c) Seat belongs to another passenger → blocked (`taken-by-other`).
  - d) Seat belongs to the active passenger → unassign (toggle off, `removed`).
  - e) Seat available → assign; if the passenger already had a seat the old one is released (`changed`), otherwise `assigned`.
  - f) After a new assignment (`assigned`/`changed`), the active passenger moves to the next passenger without a seat (in order, wrapping); if everyone is seated, it stays. Removing a seat never auto-advances.
  - Extra: an unknown seat id is blocked (`unknown-seat`), so a stale click can't corrupt state.
- Blocked clicks return the **same state object**, so React skips the re-render.
- Passenger count is clamped to 1–6. Growing adds "Passenger N"; shrinking removes from the end, which frees their seats and meals automatically (ownership is on the passenger). If the active passenger is removed, the last remaining one becomes active.
- Rename: trimmed, max 30 chars, empty → "Passenger N" (N = position).
- Switching layout regenerates seats and clears every seat assignment (seat ids differ between layouts); meals are kept.
- `mealsEnabled` is state (default `true`); when false, meal totals are 0. No action toggles it yet.
- Totals are computed by selectors from seats + passengers; never stored.

## 10. Possible interview questions & answers

**Why Context + useReducer instead of Redux/Zustand?**
The state is small and local to one page. A reducer gives predictable, testable transitions and keeps business rules out of components, without a dependency.

**Why is seat status derived rather than stored?**
Storing it duplicates information already in `Seat.isOccupied` and `Passenger.seatId`; two copies can drift. Deriving guarantees consistency.

**How do you avoid hydration mismatches with mock data?**
No `Math.random`/`Date.now` at render. Occupancy uses a seeded FNV-1a hash of the seat id, so server and client generate identical maps.

**How would you add a new layout?**
Add a `LayoutConfig` to `layouts.ts` and extend `LayoutId`. Seat positions and pricing are derived, so `generateSeatMap` needs no changes.

**Why an override map for pricing?**
The sample design contradicts the general rules for a few seats. An explicit, data-only override keeps the rules clean and the exceptions visible.

**Why format with `Intl.NumberFormat('en-IN')`?**
It handles Indian grouping (lakhs/crores) and the ₹ symbol natively, with no library.

**How do you stop the UI and reducer rules from drifting apart?**
`getSeatClickOutcome` is one pure function. The reducer uses it to decide the transition and the UI uses it to build the toast, so there is no second copy of the rules.

**How do you guarantee a seat never belongs to two passengers?**
Ownership is stored only on `Passenger.seatId` (seat → owner is derived), so a passenger can only hold one seat by construction. The reducer rejects clicks on seats owned by others, and a dev-only assertion runs after every reducer call and throws if the invariant is ever broken.

**Why split state and dispatch into two contexts?**
Dispatch is stable. Components that only trigger actions don't re-render when state changes.

**How are lookups kept O(1)?**
`getSeatOwnerMap` builds a seatId → passengerId `Map` per passengers array and caches it in a `WeakMap`. The reducer returns new arrays on change, so the cache never goes stale.

**How is the reducer tested?**
Vitest unit tests (`npm test`) cover click rules a–f, passenger shrinking, layout switching, totals and the invariant check. The reducer is pure, so tests need no React.
