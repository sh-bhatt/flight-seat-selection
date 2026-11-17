# Flight Seat Selection & Passenger Management — Project Guide

Personal learning doc: written so I can explain this project in an interview. Updated after every task.

## 1. Overview

A single-page app where a user picks an aircraft layout (3-2 or 2-3-2), views a seat map, adds passengers, assigns each passenger a seat (priced by category), optionally picks meals, and sees a running price summary. All data is mock and deterministic; there is no backend.

Status: **foundation, state and seat map UI done** (types, layouts, pricing, seat generation, reducer, selectors, context, seat map with layout toggle, legend, toasts, confirm dialog). `src/app/page.tsx` is a temporary preview page. Passenger panel, summary and meals UI are TBD.

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
    cabin.ts                  EXIT_ROWS (rows beside an emergency exit)
    flight.ts                 Mock route shown in the header (DEL → BOM · 6E 2134 · Fri, 21 Nov)
    seatPricing.ts            Category prices, pricing rules, overrides, deterministic occupancy
    meals.ts                  Meal options (stub, TBD)
    mockApi.ts                Fake async fetch (stub, TBD)
  lib/
    generateSeatMap.ts        Builds Seat[] from a layout
    formatCurrency.ts         INR formatting ("₹1,250", "Free")
    passengerInitial.ts       Seat label from a name ("Rahul" -> "R", "Passenger 2" -> "P2") (+ test)
  state/
    bookingReducer.ts         State, actions, getSeatClickOutcome, reducer, invariant check
    bookingReducer.test.ts    Vitest unit tests for the rules and totals
    selectors.ts              Pure derived data (status, owner, totals, breakdown)
  context/
    BookingContext.tsx        Provider + useBooking / useBookingActions / useSeatClick
    AppProviders.tsx          Composes ToastProvider + BookingProvider
  components/
    seat-map/
      SeatMap.tsx             Cabin shell: nose, column header, grid, EXIT marker, keyboard nav, click + toast
      SeatRow.tsx             One seat row (thin wrapper over CabinRow)
      CabinRow.tsx            Generic row: label, seat groups, aisle gaps, label (also used for the header)
      Seat.tsx                Seat <button> with aria-label, tooltip, roving tabindex
      SeatFace.tsx            Painted seat (state + category styling); shared with the legend
      SeatDetails.tsx         SeatTooltip (desktop hover/focus) and SeatDetailsBar (mobile bottom bar)
      ExitMarker.tsx          Dashed "EXIT" strip above exit rows
      LayoutToggle.tsx        Segmented 3–2 / 2–3–2 control + confirm before clearing seats
      SeatLegend.tsx          Status + category legend with prices
      seatDisplay.ts          Labels, aria-label builder, toast variant mapping
      seatNavigation.ts       Pure arrow-key navigation over the seat grid (+ test)
    layout/
      AppHeader.tsx           Title, route mock, Reset button (confirms if seats are assigned)
    passengers/
      PassengerPanel.tsx      Card shell: count stepper, progress, cards (md+) or chips (mobile)
      PassengerCountSelector.tsx  − / count / + stepper (1–6), helper text, confirm before dropping seated passengers
      PassengerProgress.tsx   "2 of 3 passengers seated" + progress bar
      PassengerList.tsx       Maps passengers to cards, wires actions + "seat removed" toast
      PassengerCard.tsx       One passenger: name, edit, seat badge, category + price, meal, remove seat
      InlineNameEditor.tsx    Input that saves on Enter/blur and cancels on Esc
      PassengerChips.tsx      Mobile horizontally scrollable passenger switcher
      SeatBadge.tsx           Seat id pill or muted "No seat"
    summary/
      PriceSummary.tsx        Line items, totals, empty state, Continue button + tooltip
      PriceBreakdown.tsx      Seat/meal lines + subtotals + grand total (shared with the success dialog)
      BookingSuccessDialog.tsx  Mock confirmation modal
      SummarySidebar.tsx      md+ summary card (sticky on lg) + owns the success dialog
      MobileSummaryBar.tsx    <md sticky bottom bar (total) that expands into a sheet
    meals/                    Meal picker (TBD)
    ui/
      Button.tsx              Button with primary / secondary / danger variants (`aria-disabled` styled like `disabled`)
      IconButton.tsx          36px icon-only button; `label` is required (aria-label + title)
      Icons.tsx               Inline SVG icons (pencil, close, plus, minus, check, chevron, plane, seat)
      Modal.tsx               Native <dialog> base; `dialog` and bottom `sheet` variants
      ConfirmDialog.tsx       Confirm/cancel modal built on Modal
      Tooltip.tsx             CSS-only tooltip on hover and keyboard focus
      Toast.tsx               ToastProvider + useToast (3s auto-dismiss, max 3, aria-live)
  app/                        page.tsx composes the page; layout.tsx holds metadata + fonts
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

All under `src/components/`. Business rules never live here: components call selectors / `useSeatClick` and render the result.

**Color system.** Tokens are CSS variables in `src/app/globals.css`, exposed as Tailwind colors via `@theme inline` (light + dark via `prefers-color-scheme`). Seat tokens: `seat-standard`, `seat-premium`, `seat-legroom` (+ `-line` border colors), `seat-occupied`, `seat-other`, `seat-free`, plus `accent` (the active passenger), `exit`, `danger`, `success`, `toast`.

**Seat states are distinguishable without color:** available = outlined with a category tint (free seats carry a small dot); occupied = grey with ✕ and `cursor-not-allowed`; selected-current = solid accent with the passenger initial and a halo; selected-other = muted solid with that passenger's initial. Extra-legroom seats are also drawn taller.

| Component | File | Responsibility | Props |
|---|---|---|---|
| `SeatMap` | `seat-map/SeatMap.tsx` | Renders the cabin for any `LayoutConfig`: nose, column letters, rows with numbers on both sides, aisles, EXIT marker. Owns roving focus, tooltip and tapped-seat state; handles clicks (outcome → toast). Remounts per layout. | none (reads context) |
| `SeatRow` | `seat-map/SeatRow.tsx` | One row, maps columns to seats | `rowNumber, columnGroups, seatsByColumn, renderSeat` |
| `CabinRow` | `seat-map/CabinRow.tsx` | Label + seat groups + aisle gaps + label; reused for the header row so columns align | `label, columnGroups, renderCell, decorative?` |
| `Seat` | `seat-map/Seat.tsx` | Accessible `<button>` (`aria-label` "Seat 12C, Premium, ₹250, available"), `aria-disabled` when occupied so it still gives feedback | `seat, status, owner?, tabIndex, showTooltip, onSelect, onHover` |
| `SeatFace` | `seat-map/SeatFace.tsx` | Visual of a seat per status and category; also used in the legend (`neutral` drops the category tint and free dot for status swatches) | `status, category, initial?, isFree?, neutral?` |
| `SeatTooltip` / `SeatDetailsBar` | `seat-map/SeatDetails.tsx` | Seat id, category, position, price, owner. Tooltip on desktop hover/focus; fixed bottom bar for the last tapped seat on mobile | `seat, status, ownerName?` (+ `id` for the tooltip) |
| `ExitMarker` | `seat-map/ExitMarker.tsx` | Decorative EXIT strip above rows listed in `EXIT_ROWS` | none |
| `LayoutToggle` | `seat-map/LayoutToggle.tsx` | Segmented control; if seats are assigned, asks to confirm before `SET_LAYOUT` | none |
| `SeatLegend` | `seat-map/SeatLegend.tsx` | Two groups. Seat status: neutral swatches (no tint, no dot) with the hint "Available seats are tinted by seat type" (the → is shown only from `sm` up, where the columns sit side by side). Seat type: tinted swatches with prices from `CATEGORY_PRICE`; the free Standard row reads "Standard · no extra charge" and carries the green dot, which is how the dot is explained | none |
| `AppHeader` | `layout/AppHeader.tsx` | App title, route mock from `FLIGHT`, Reset button. Reset asks for confirmation only when seats are assigned | none |
| `PassengerPanel` | `passengers/PassengerPanel.tsx` | Groups selector, progress and the switcher; shows cards from `md`, chips below (CSS only) | none |
| `PassengerCountSelector` | `passengers/PassengerCountSelector.tsx` | Stepper 1–6; buttons `disabled` at the limits; helper text changes at the limits. If `getSeatedPassengersRemovedBy` > 0 a `ConfirmDialog` asks first | none |
| `PassengerProgress` | `passengers/PassengerProgress.tsx` | "2 of 3 passengers seated" + `role="progressbar"` | none |
| `PassengerList` / `PassengerCard` | `passengers/` | One card per passenger. Active card: accent border + `aria-current`, and its name button has `aria-pressed`. The whole card is clickable. Pencil edits the name inline, ✕ removes the seat | card: `passenger, seat, meal, isActive, onSelect, onRename, onRemoveSeat` |
| `PassengerChips` | `passengers/PassengerChips.tsx` | Mobile chips (name + seat badge), `aria-pressed` on the active one | none |
| `PriceSummary` | `summary/PriceSummary.tsx` | Empty state or `PriceBreakdown`, plus Continue. Continue uses `aria-disabled` (stays focusable) with a tooltip "N passengers still need a seat" | `onContinue` |
| `PriceBreakdown` | `summary/PriceBreakdown.tsx` | Lines "Passenger 1 · 12C (Premium) ₹250" ("Free" at 0), meal lines, Seats / Meals subtotal, Grand total. All from selectors | none |
| `BookingSuccessDialog` | `summary/BookingSuccessDialog.tsx` | Mock confirmation with route + breakdown; "Done" or "New booking" (reset) | `open, onClose` |
| `SummarySidebar` / `MobileSummaryBar` | `summary/` | Sidebar card for `md+`; fixed bottom bar for `<md` (total + "x of y seated") opening a bottom sheet | sidebar: `className?` |
| `Button` | `ui/Button.tsx` | Styled button, variants `primary` / `secondary` / `danger` | native button props + `variant?` |
| `IconButton` | `ui/IconButton.tsx` | Icon-only button; mandatory `label` becomes `aria-label` and `title` | `label` + native props |
| `Modal` | `ui/Modal.tsx` | Native `<dialog>.showModal()`: focus trap, inert background, Esc and focus restore. `sheet` variant docks to the bottom | `open, title, children, onClose, variant?` |
| `ConfirmDialog` | `ui/ConfirmDialog.tsx` | Confirm/cancel on top of `Modal`; Cancel is autofocused | `open, title, children, confirmLabel?, cancelLabel?, onConfirm, onCancel` |
| `Tooltip` | `ui/Tooltip.tsx` | Hover + focus-within tooltip; passes an id for `aria-describedby` | `content, children(describedBy)` |
| `ToastProvider` / `useToast` | `ui/Toast.tsx` | `showToast(message, variant?)`; 3 s auto-dismiss, max 3 stacked, `aria-live="polite"` region | provider takes `children` |

**Keyboard.** Roving tabindex: one seat is in the Tab order. Arrow keys move through the grid (aisles skipped), Home/End jump to row ends, Enter/Space select. Pure logic in `seatNavigation.ts`.

## 7. Flow of execution

State flow: see the diagram in section 5. Seat generation: `generateSeatMap(layoutId)` → looks up `LAYOUTS[layoutId]` → for each row and column derives `position` → `getSeatCategory` (override → extra-legroom rows → premium rows → standard) → `getCategoryPrice` → `isSeatOccupied` (seeded hash) → `Seat[]`.

**Seat click in the UI**

```
 click / Enter on <Seat>
   -> SeatMap.selectSeat(seatId)
        -> useSeatClick()(seatId)
             -> getSeatClickOutcome(state, seatId)    (rules)
             -> dispatch SEAT_CLICKED                  (reducer applies same rules)
             <- outcome { type, message }
        -> showToast(outcome.message, variant)         (blocked=error, removed=info, else success)
        -> remember seat for the mobile details bar
   -> re-render: getSeatStatus / getSeatOwner per seat -> SeatFace
```

**Layout switch**

```
 click segment in LayoutToggle
   -> same layout? ignore
   -> getAssignedCount(state) > 0 ? open ConfirmDialog ("will clear N seat selections")
                                  : switch immediately
   -> confirm -> setLayout() -> SET_LAYOUT (reducer regenerates seats, clears seatIds) -> toast
   -> SeatMap remounts (key = layoutId), resetting focus/tooltip state
```

**Page layout (`src/app/page.tsx`)**

```
 <AppProviders>            ToastProvider > BookingProvider
   <AppHeader/>            title, DEL → BOM · 6E 2134 · Fri, 21 Nov, Reset
   grid
     PassengerPanel        selector + progress + (cards md+ | chips <md)
     seat map section      "Choose your seats", LayoutToggle, SeatLegend, SeatMap
     SummarySidebar        hidden <md
   MobileSummaryBar        fixed bottom, md:hidden
```

| Breakpoint | Layout |
|---|---|
| `lg+` | 3 columns `17rem / 1fr / 19rem`: passengers, map, summary (`sticky top-4`, scrolls internally if tall) |
| `md` | 2 columns: passengers and summary stacked on the left, map spanning both rows on the right |
| `<md` | One column: header, passenger count + chips, map, then a fixed bottom bar with the total |

The map wrapper is `overflow-x-auto` at every size and seats are never smaller than 36px (`h-9 w-9`), so narrow screens scroll the cabin sideways instead of squashing it. The mobile seat-details bar sits above the summary bar via `--summary-bar-height`, and the page reserves bottom padding for the bar.

**Passenger count change**

```
 click − / +  (PassengerCountSelector)
   -> getSeatedPassengersRemovedBy(state, next) > 0 ?
        yes -> ConfirmDialog "will remove N seated passengers" -> confirm -> SET_PASSENGER_COUNT + toast
        no  -> SET_PASSENGER_COUNT
   -> reducer clamps 1–6; dropped passengers take their seats with them
```

**Rename / remove seat / select passenger**

```
 pencil -> InlineNameEditor (Enter or blur = RENAME_PASSENGER, Esc = cancel; reducer trims, 30 chars, empty -> "Passenger N")
 ✕ on a card -> REMOVE_SEAT + toast "Seat 12C removed from X"
 click card or chip -> SET_ACTIVE_PASSENGER -> next seat click goes to that passenger
```

**Summary and Continue**

```
 every render: PriceBreakdown -> getSeatSummaryLines / getMealSummaryLines / getSeatsTotal / getMealsTotal / getGrandTotal
 no seated passenger -> empty state ("No seats selected yet")
 Continue: isBookingComplete(state)?
   no  -> aria-disabled, tooltip "N passengers still need a seat", click ignored
   yes -> onContinue -> BookingSuccessDialog (mock: breakdown + Done / New booking)
 mobile: bar shows total -> "Summary" opens a sheet (Modal variant) -> Continue closes the sheet, then opens the success dialog
```

**Hover vs touch.** Mouse hover and keyboard focus show the tooltip (`md` and up). On small screens there is no hover, so the last tapped seat's details appear in a bottom bar.

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
| `getAssignedCount` | `src/state/selectors.ts` | state → number | Passengers with a seat; used by the layout-switch confirmation. |
| `getUnassignedCount` | `src/state/selectors.ts` | state → number | Passengers still without a seat. |
| `isBookingComplete` | `src/state/selectors.ts` | state → boolean | Gate for Continue: every passenger has a seat. |
| `getSeatedPassengersRemovedBy` | `src/state/selectors.ts` | state, newCount → number | How many seated passengers shrinking would drop (decides the confirm dialog). |
| `getPassengerMeal` | `src/state/selectors.ts` | state, passengerId (, meals) → `MealOption` or undefined | Meal shown on a card; undefined while meals are disabled. |
| `getSeatSummaryLines`, `getMealSummaryLines` | `src/state/selectors.ts` | state → lines | Display-ready rows for the summary and success dialog (seated passengers only). |
| `getPassengerInitial` | `src/lib/passengerInitial.ts` | name → string | Label shown on a selected seat ("R", "P2"). |
| `getSeatAriaLabel` | `src/components/seat-map/seatDisplay.ts` | seat, status, owner name → string | "Seat 12C, Premium, ₹250, available". |
| `buildSeatGrid`, `getNextSeatId` | `src/components/seat-map/seatNavigation.ts` | layout → ids per row; (grid, id, key) → next id | Arrow-key movement that works for any layout. |
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
- Toast messages come straight from `outcome.message`, e.g. "Seat 12C assigned to Rahul — ₹250", "Seat 4A is already occupied", "Seat 3B is taken by Passenger 2", "Select a passenger first".
- Exit row 10 is marked with an EXIT strip (`EXIT_ROWS` in `src/data/cabin.ts`).
- Blocked clicks return the **same state object**, so React skips the re-render.
- Passenger count is clamped to 1–6. Growing adds "Passenger N"; shrinking removes from the end, which frees their seats and meals automatically (ownership is on the passenger). If the active passenger is removed, the last remaining one becomes active.
- Rename: trimmed, max 30 chars, empty → "Passenger N" (N = position).
- Switching layout regenerates seats and clears every seat assignment (seat ids differ between layouts); meals are kept.
- `mealsEnabled` is state (default `true`); when false, meal totals are 0. No action toggles it yet.
- Shrinking the passenger count asks for confirmation only if a passenger who would be removed has a seat.
- Continue is enabled only when every passenger has a seat (`isBookingComplete`). It uses `aria-disabled` rather than `disabled`, so keyboard users can focus it and read the tooltip.
- Summary lines list seated passengers only; free seats show "Free". Meal lines and the Meals subtotal (₹0) are in place and fill once meals exist.
- Reset asks for confirmation only when seats are assigned, and returns to 1 passenger on the default layout.
- Seats are at least 36px wide; the map scrolls horizontally rather than shrinking.
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

**How is the seat map layout-agnostic?**
`SeatMap` only reads `LayoutConfig.columnGroups` and `rows`. Aisles are rendered between groups, and the header and rows share one `CabinRow` component so columns always line up. Adding a layout needs no component changes.

**How do you make seat states accessible?**
Each seat is a real `<button>` with an `aria-label` that states id, category, price and status. States differ by shape and glyph (✕, initial, dot, taller legroom seats), not just color. Occupied seats use `aria-disabled` rather than `disabled` so they stay focusable and still explain themselves via a toast.

**How does keyboard navigation work?**
A roving tabindex keeps one seat in the Tab order; arrow keys move focus through a grid built from the layout (`buildSeatGrid`), skipping aisles. The movement logic is a pure function with unit tests.

**Why a native `<dialog>` for the confirm modal?**
`showModal()` already provides focus trapping, an inert background, Esc handling and focus restoration, so there is no custom focus-trap code to get wrong.

**How does the toast system avoid Date.now/Math.random?**
Toast ids come from an incrementing ref counter. Each toast schedules its own 3 s timeout in an effect (cleared on unmount), and the list is capped at the newest 3.

**How does the page stay usable on phones?**
Below `md` the passengers become scrollable chips, the map scrolls sideways (seats stay at 36px) and the summary is a fixed bottom bar with the live total that opens a bottom sheet. The same `PriceSummary` renders in the sidebar and in the sheet, so there is one implementation.

**Why is the Continue button `aria-disabled` instead of `disabled`?**
A `disabled` button cannot be focused, so keyboard and touch users could never see why it is blocked. `aria-disabled` keeps it focusable for the tooltip, and the click handler ignores presses until `isBookingComplete` is true.

**Where does the "can the booking continue" rule live?**
In `isBookingComplete` (selectors). The component only reads it and the unassigned count for the tooltip text.

**How do you keep dialogs consistent?**
`Modal` wraps the native `<dialog>` once (focus trap, Esc, backdrop click). `ConfirmDialog`, the success dialog and the mobile sheet are thin wrappers over it.

**Why are totals never stored?**
They are pure functions of seats and passengers, computed on render, so they cannot disagree with the data and update instantly on any change.
