# Flight Seat Selection & Passenger Management — Project Guide

Personal learning doc: written so I can explain this project in an interview. Updated after every task.

## 1. Overview

A single-page app where a user picks an aircraft layout (3-2 or 2-3-2), views a seat map, adds passengers, assigns each passenger a seat (priced by category), optionally picks meals, and sees a running price summary. All data is mock and deterministic; there is no backend.

Status: **foundation done** (types, layouts, pricing, seat generation, currency formatting). UI, state and meals are TBD.

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
  state/                      Reducer + selectors (TBD)
  context/                    Provider + hooks (TBD)
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

TBD (Context + `useReducer`; all business rules in reducer/selectors).

## 6. Components

| Component | File | Responsibility | Props |
|---|---|---|---|
| TBD | | | |

## 7. Flow of execution

TBD. Currently implemented part: `generateSeatMap(layoutId)` → looks up `LAYOUTS[layoutId]` → for each row and column derives `position` → `getSeatCategory` (override → extra-legroom rows → premium rows → standard) → `getCategoryPrice` → `isSeatOccupied` (seeded hash) → `Seat[]`.

## 8. Key functions

| Name | File | Input → Output | Why it exists |
|---|---|---|---|
| `generateSeatMap` | `src/lib/generateSeatMap.ts` | `LayoutId → Seat[]` | Single place that builds a full cabin from config, so adding a layout is just data. |
| `getSeatPosition` (private) | `src/lib/generateSeatMap.ts` | column groups + indices → `SeatPosition` | Window = cabin edges; aisle = next to a gap; else middle. Works for any layout. |
| `getSeatCategory` | `src/data/seatPricing.ts` | layout, seat id, row, position → `SeatCategory` | Centralises pricing rules with explicit overrides first. |
| `getCategoryPrice` | `src/data/seatPricing.ts` | `SeatCategory → number` | Category → INR price lookup. |
| `isSeatOccupied` | `src/data/seatPricing.ts` | layout, seat id → boolean | Deterministic ~20% occupancy via FNV-1a hash (no `Math.random`, so no hydration mismatch). |
| `formatCurrency` | `src/lib/formatCurrency.ts` | `number, {forceZero?} → string` | Consistent ₹ formatting; "Free" for 0 unless `forceZero`. |

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
