# Flight Seat Selection & Passenger Management — Project Guide

Personal learning doc: written so I can explain this project in an interview. Updated after every task.

## 1. Overview

A single-page app where a user picks an aircraft layout (3-2 or 2-3-2), views a seat map, adds passengers, assigns each passenger a seat (priced by category), optionally picks meals, and sees a running price summary. All data is mock and deterministic; there is no backend.

Status: **seat selection, passenger panel, price summary, meal selection, the UX polish pass and the "Product polish" visual redesign done** (types, layouts, pricing, seat generation, reducer, selectors, context, seat map, passenger panel, summary, Seats / Meals steps, meal picker, async seat map with skeleton / error / retry, edge-case handling, accessibility and motion). The redesign is a light, real-airline look (brand bar + flight strip, step indicator, aircraft drawing with wings, seat hover card); it changed no reducer rule or action.

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
README.md                     Evaluator-facing overview: features, setup, state management, seat assignment logic, pricing
vitest.config.mts             Test config (`@` alias, node env)
src/
  types/index.ts              All shared domain types
  data/
    layouts.ts                Layout definitions (3-2, 2-3-2): column groups, row count and exit rows per layout
    flight.ts                 Mock flight: brand "aeroline", DEL → BOM, 06:10 → 08:25, 2h 15m, Non-stop, NA 2134, Fri, 21 Nov
    seatPricing.ts            Category prices, pricing rules (bulkhead + the layout's exit rows = extra legroom), overrides, deterministic occupancy (+ test)
    meals.ts                  MEAL_OPTIONS (6 items, free + paid, veg / non-veg) and NO_MEAL_ID
    mockApi.ts                fetchSeatMap(layoutId): 600 ms fake request; rejects when the URL has ?simulateError=1 (+ test)
  lib/
    generateSeatMap.ts        Builds Seat[] from a layout; toSeatId(row, column) is the one place that defines a seat id
    formatCurrency.ts         INR formatting ("₹1,250", "Free")
    formatCount.ts            "1 seat" / "2 seats" pluralisation shared by every message (+ test)
    passengerName.ts          defaultPassengerName(index) -> "Passenger N" (used by the reducer and selectors)
    passengerInitial.ts       Label from a name ("Aarav Mehta" -> "AM", "Rahul" -> "R", "Passenger 2" -> "P2") (+ test)
  state/
    bookingReducer.ts         State, actions, getSeatClickOutcome, reducer, invariant check
    bookingReducer.test.ts    Vitest unit tests for the rules, totals, async seat map and edge cases
    selectors.ts              Pure derived data (status, owner, totals, per-passenger breakdown, active / first unseated passenger, seat lines, adjacent companion, booking progress)
    selectors.test.ts         Vitest tests for the newer selectors (getAdjacentCompanion, getFirstUnseatedPassenger, hasBookingProgress, ...)
  hooks/
    useSeatMap.ts             Loads the seat map for the current layout via fetchSeatMap; dispatches SEATS_LOADED / SEATS_FAILED
    useAnimatedNumber.ts      Eases a number toward its target (no animation with reduced motion)
    usePrefersReducedMotion.ts  Live `prefers-reduced-motion` flag (useSyncExternalStore)
    useHorizontalOverflow.ts  True while an element scrolls sideways (drives the "swipe sideways" hint)
    useFocusAfterRender.ts    Moves focus to a target after the next render, so focus never drops to <body> when the focused control disappears
  context/
    BookingContext.tsx        Provider + useBooking / useBookingActions / useSeatClick
    ViewContext.tsx           UI-only active step view (`seats` | `meals`): ViewProvider + useMainView
    AppProviders.tsx          Composes ToastProvider + BookingProvider + ViewProvider
  components/
    seat-map/
      SeatMap.tsx             Picks skeleton / error / cabin from the seat map status; cabin = grid, keyboard nav, click + toast, hover/focus card state, sideways-scroll hint
      CabinShell.tsx          Scroll box + fuselage (cockpit windows, front galley/WC, column letters, rear WC/galley/WC) + CabinRows (rows with exit markers); shared by cabin and skeleton
      ExitRow.tsx             Red "◂ EXIT" / "EXIT ▸" row spanning past the fuselage edges; the first exit row also draws the two wings
      SeatMapSkeleton.tsx     Same fuselage with grey seats while loading
      SeatMapError.tsx        Error message + Retry button (role=alert)
      SeatRow.tsx             One seat row (thin wrapper over CabinRow)
      CabinRow.tsx            Generic row: seat groups separated by 30px aisles that carry the row number (also used for the column-letter header)
      Seat.tsx                Seat <button> with aria-label, hover card, roving tabindex; ignores double-clicks and held Enter
      SeatFace.tsx            Painted seat (38×40 / 38×46, state + category styling, 3px hover/focus ring); `swatch` size for the legend
      SeatHoverCard.tsx       Informational card above the hovered / focused seat (md+, role=tooltip, position: fixed so the cabin scroll box never clips it)
      SeatDetailsBar.tsx      Mobile card for the last tapped seat; `sticky` above the bottom bar inside the seat map (never covers content)
      LayoutToggle.tsx        Segmented 3–2 / 2–3–2 control + confirm before clearing seats
      SeatLegend.tsx          One bar: Standard / Premium / Extra legroom with prices, divider, Your group, Taken
      seatDisplay.ts          Labels, aria-label builder, hover-card texts, toast variant mapping
      seatNavigation.ts       Pure arrow-key navigation over the seat grid (+ test)
    layout/
      SiteHeader.tsx          Navy brand bar: logo + wordmark, Manage booking / Help / Start over (confirms whenever anything would be lost) / INR ₹
      FlightStrip.tsx         White strip: route, times, duration, flight facts, step indicator (one-line summary on phones)
      BookingSteps.tsx        Desktop `<nav aria-label="Booking progress"><ol>`: Travellers › Seats › Meals › Review
      MobileStepSwitch.tsx    Phone version: "Step 2 of 4 · Seats" + Seats / Meals buttons
      stepModel.ts            Pure step model: which step is done / current / upcoming for a view (+ test)
      useStepKeyDown.ts       Left/Right arrows on Seats/Meals switch the view and move focus
      MainArea.tsx            Title row (h1 + active passenger) + the open step (legend + seat map, or meal picker)
    passengers/
      PassengerPanel.tsx      Travellers card: title, "2 of 3 seated", count stepper, rows (md+) or chips (mobile)
      PassengerCountSelector.tsx  Compact − / count / + pill (1–6), confirm before dropping seated passengers
      PassengerList.tsx       Maps passengers to rows (md+)
      usePassengerActions.ts  rename / removeSeat with their toasts; shared by the list and the chips
      PassengerRow.tsx        One traveller row: avatar, name, "Adult · category", seat pill or "Now"; rename / remove-seat buttons on hover or focus (always shown on touch screens); focus returns to the row when they close
      PassengerAvatar.tsx     Initials circle (navy when active, soft blue otherwise)
      InlineNameEditor.tsx    Input that saves on Enter/blur and cancels on Esc (tells the caller whether it was a keyboard finish)
      PassengerChips.tsx      Mobile horizontally scrollable passenger switcher + "Edit name of <active>" control
      SeatBadge.tsx           SeatBadge (seat code pill) and NowBadge (navy "Now" pill)
    summary/
      PriceSummary.tsx        Booking summary card: header, seat + meal lines, total, Continue + reason
      useContinueStep.ts      What Continue does for the open step (label, enabled, reason, proceed)
      ContinueButton.tsx      The primary button (aria-disabled + described by the reason text)
      PriceBreakdown.tsx      Per passenger: seat + meal lines and subtotal (getPriceBreakdown), then seat / meal / grand totals (review dialog)
      ReviewDialog.tsx        Final step modal: "Review your selections" (Back / Confirm), then "You're all set" (Done / Start a new selection); rendered once in page.tsx
      SummarySidebar.tsx      md+ summary card (sticky from 1200px)
      MobileSummaryBar.tsx    <md fixed bottom bar: total, Details (sheet), Continue + reason
    meals/
      MealSelector.tsx        Grid of meal cards for the active passenger
      MealCard.tsx            One option: diet mark, name, description, price/"Free", selected state (navy border + check)
      DietIndicator.tsx       Green (veg) / red (non-veg) dot-in-square mark
    ui/
      Button.tsx              Button with primary / secondary / danger variants and md / lg sizes (`aria-disabled` styled like `disabled`)
      IconButton.tsx          Icon-only button (sm / md / lg); `label` is required (aria-label + title)
      Icons.tsx               Inline SVG icons (pencil, close, arrow-left, plus, minus, check, plane, logo)
      Modal.tsx               Native <dialog> base; `dialog` and bottom `sheet` variants
      ConfirmDialog.tsx       Confirm/cancel modal built on Modal
      Toast.tsx               ToastProvider + useToast (white card, colored status dot, 3s auto-dismiss, max 3, repeats replace, slide-in, aria-live)
      AnimatedAmount.tsx      A price that counts to its new value; screen readers get only the final amount
  app/                        page.tsx composes the page; layout.tsx holds metadata + the Plus Jakarta Sans font; globals.css holds the design tokens, focus ring and all motion (reduced-motion aware)
```

## 4. Data model

- **LayoutId** — `'3-2' | '2-3-2'`; the supported cabin configurations.
- **SeatMapStatus** — `'loading' | 'ready' | 'error'`; where the seat map request for the current layout stands.
- **SeatCategory** — `'standard' | 'premium' | 'extra-legroom'`; drives price.
- **SeatStatus** — `'available' | 'occupied' | 'selected-current' | 'selected-other'`. *Derived*, never stored: computed from `Seat.isOccupied` plus which passenger holds the seat, so it can't go out of sync.
- **SeatPosition** — `'window' | 'middle' | 'aisle'`; used by pricing rules.
- **Seat** — `{ id: "12C", row, column, category, price, isOccupied, position }`. Static facts about a seat. Who sits there is stored on the passenger, not the seat.
- **LayoutConfig** — `{ id, label, columnGroups: ColumnGroups, rows, exitRows }`. `ColumnGroups` is `readonly (readonly string[])[]`; aisles sit between column groups. `exitRows` drives both the EXIT markers and extra-legroom pricing, so a layout's exits are configured in one place.
- **Passenger** — `{ id, name, seatId | null, mealId | null }`. Single source of truth for assignments (seat → passenger is derived).
- **MealOption** — `{ id, name, description, price, isVeg }`. The "No meal" card is a real option (`NO_MEAL_ID`, ₹0) but a passenger without a meal stores `mealId: null`.

## 5. State management

One `useReducer` in `BookingProvider` (`src/context/BookingContext.tsx`). No external state library. All business rules live in `src/state/`; components only dispatch actions and read selectors.

**State** (`BookingState`): `{ layoutId, seats, seatMapStatus, passengers, activePassengerId }`. Seat ownership is stored **only** on `Passenger.seatId`; everything else (seat status, owner, totals) is derived. `seats` is empty until `seatMapStatus` is `ready`. The app starts from `createLoadingState()`; `createInitialState()` is a state whose seats have already arrived (used by tests and by RESET on a loaded default layout).

**Actions** (discriminated union `BookingAction`): `SET_PASSENGER_COUNT`, `SET_ACTIVE_PASSENGER`, `RENAME_PASSENGER`, `SET_LAYOUT`, `SEATS_LOADED`, `SEATS_FAILED`, `RETRY_SEATS`, `SEAT_CLICKED`, `REMOVE_SEAT`, `SELECT_MEAL`, `RESET`.

**Context split**: state and dispatch are in two contexts, so components that only dispatch don't re-render on state changes. Hooks:
- `useBooking()` → current state.
- `useBookingActions()` → stable action creators, typed by the `BookingActions` interface (`setPassengerCount`, `setLayout`, `selectMeal`, `seatsLoaded`, `seatsFailed`, `retrySeats`, ...).
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

**Async seat map.** Seats arrive after a fake network call, so the reducer models the request lifecycle instead of the component:

```
 first render / SET_LAYOUT / RETRY_SEATS  -> seatMapStatus = 'loading' (seats = [], seatIds cleared on a layout change)
 useSeatMap effect (status === 'loading') -> fetchSeatMap(layoutId)
     resolves -> SEATS_LOADED { layoutId, seats } -> 'ready'
     rejects  -> SEATS_FAILED { layoutId }        -> 'error'  (Retry -> RETRY_SEATS -> 'loading')
 stale answers are dropped twice:
     the effect cleanup ignores a request that was replaced,
     the reducer ignores SEATS_LOADED / SEATS_FAILED unless status === 'loading' AND layoutId === state.layoutId
```

Seat clicks while the map is not `ready` are blocked (`seats-not-ready`), so no rule needed to change for the async arrival; the existing rules a–f run unchanged once seats exist.

**Invariant:** no seat id appears on two passengers, and each passenger has at most one seat (a single `seatId` field makes the second part structural). `assertBookingInvariants` runs after every reducer call when `NODE_ENV !== 'production'` and throws on violation (also checks the seat exists, is not occupied, and the active passenger exists).

## 6. Components

All under `src/components/`. Business rules never live here: components call selectors / `useSeatClick` and render the result.

**Design tokens ("Product polish").** Light theme only (no dark block). Tokens are CSS variables in `src/app/globals.css`, exposed as Tailwind colors via `@theme inline`. Font: Plus Jakarta Sans via `next/font/google` (400-800, variable `--font-jakarta`).

| Group | Tokens |
|---|---|
| Surfaces | page `#F5F7FA` · surface `#FFFFFF` · border `--line` `#E3E8EF` · subtle fill `--surface-sunken` `#F1F4F8` · footer fill `#F8FAFC` · segmented track `#E9EDF2` · selected row/card `#F4F7FB` |
| Text | brand/text navy `#0A2540` · secondary `#44505F` · muted `#5A6576` (never lighter, AA) |
| Header | nav text `#C9D6E8` · divider `#2B4A70` |
| Status | danger/exit `#B42318` on `#FDECEA` · success `#1A7F44` (veg mark, toast dot) · info `#1D4E89` (toast dot) |
| Seats | standard `#FFF` / `#8792A2` · premium `#DDF3F0` / `#0F766E` · extra legroom `#FFF1D6` / `#B86E00` · taken `#E9EDF2` with ✕ `#7A8494` · your group (another passenger's seat) `#D6E2F3` / `#1D4E89` · active passenger's seat navy with white text |
| Cabin drawing | fuselage border `#D3DAE3` · cockpit windows `#C4CFDD` · wings `#E3E8EF` |

Rules: cards are white with a 1px `#E3E8EF` border and 14px radius (at most a very soft shadow); no glows, no tracked-uppercase eyebrow labels, no card inside a card, no left-border accents. Focus ring is 2px navy everywhere (white on the navy header); a hovered or focused seat gets a 3px navy ring. Seat shape: 38×40 (extra legroom 38×46), radius `10px 10px 6px 6px`, 1.5px border with a 5px top border (the seat back), label 10px/700 = the passenger's initials.

**Seat states are distinguishable without color:** available = outlined with a category tint; taken = grey with ✕ and `cursor-not-allowed`; the active passenger's seat = solid navy with initials; another passenger's seat = soft blue with initials. Extra-legroom seats are also drawn taller.

| Component | File | Responsibility | Props |
|---|---|---|---|
| `SeatMap` | `seat-map/SeatMap.tsx` | Persistent `role=region` wrapper that shows the skeleton, the error or the cabin depending on `status`. The cabin renders any `LayoutConfig`, owns roving focus, hover/focus-card and tapped-seat state, handles clicks (outcome → toast), remounts per layout and shows a "swipe sideways" hint when it overflows. Retry moves focus to the wrapper so keyboard users are not dropped | `status, onRetry` |
| `CabinShell` / `CabinRows` | `seat-map/CabinShell.tsx` | The aircraft drawing: scroll box (`overflow-x: auto`; 96px side room for the wings from 640px, dropped together with the wings when `fuselage + 192px` does not fit the box, measured with `useHorizontalOverflow(ref, reservePx)`), fuselage (`190px 190px 44px 44px / 260px 260px 44px 44px` radius, 54px top padding, cockpit windows, front Galley / WC, column letters, rear WC · Galley · WC) and the row list with an exit row before each of `layout.exitRows`. Shared by the cabin and the skeleton so they stay the same size | `layout, children, scrollRef?` / `layout, renderRow` |
| `SeatMapSkeleton` | `seat-map/SeatMapSkeleton.tsx` | Same fuselage with `#E9EDF2` seats in the real grid while loading; visually hidden "Loading the … seat map" status text | `layout` |
| `SeatMapError` | `seat-map/SeatMapError.tsx` | `role=alert` card (red icon on `#FDECEA`) with message and Retry | `onRetry` |
| `SeatRow` | `seat-map/SeatRow.tsx` | One row, maps columns to seats | `rowNumber, columnGroups, seatsByColumn, renderSeat` |
| `CabinRow` | `seat-map/CabinRow.tsx` | Seat groups separated by 30px aisles; the row number is printed in the aisle(s) (aria-hidden, the row has `aria-label="Row N"`), not on both sides; reused for the column-letter header so columns align | `label, columnGroups, renderCell, decorative?` |
| `Seat` | `seat-map/Seat.tsx` | Accessible `<button>` (`aria-label` "Seat 12C, Premium, ₹250, available"), `aria-disabled` when occupied so it still gives feedback. Ignores the second click of a double-click (`event.detail > 1`) and held-Enter repeats. The focus ring is drawn on the seat face. Renders the hover card while shown | `seat, status, owner?, activeName, companionName?, tabIndex, showCard, onSelect, onHover` |
| `SeatFace` | `seat-map/SeatFace.tsx` | Visual of a seat per status and category (38×40, taller for extra legroom, 5px seat-back top border, 3px navy hover/focus ring). `size="swatch"` is the small chip used by the legend | `status, category, initial?, size?` |
| `SeatHoverCard` / `SeatDetailsBar` | `seat-map/SeatHoverCard.tsx`, `SeatDetailsBar.tsx` | Hover card (md+, shown above the hovered **or keyboard-focused** seat): seat id + price, "Premium · Aisle seat" (+ " · Next to <name>"), and "Click to select for <active>" / "Your seat — click to remove" / "Taken by <name>" / "Unavailable". `role="tooltip"`, linked by `aria-describedby`, no buttons. `position: fixed`, placed from the seat's bounding box (flips below when there is no room above), so the cabin's scroll box never clips it. `SeatDetailsBar` is the mobile card for the last tapped seat: `position: sticky` just above the bottom bar inside the seat map, so it travels with the cabin, takes its own room at the end and never hides the last rows | card: `id, anchorRef, seat, status, activeName, ownerName?, companionName?` |
| `ExitRow` | `seat-map/ExitRow.tsx` | Decorative row as wide as the fuselage with red "◂ EXIT" / "EXIT ▸" tags poking past both edges, drawn above each row listed in the layout's `exitRows`. The first exit row also draws the two wings (`clip-path` polygons, ~96×250px, `#E3E8EF`, hidden below 640px and when the cabin box is too narrow) | `withWings` |
| `LayoutToggle` | `seat-map/LayoutToggle.tsx` | Segmented control on a `#E9EDF2` track (active segment white with a soft shadow); if seats are assigned, asks to confirm before `SET_LAYOUT` | none |
| `SeatLegend` | `seat-map/SeatLegend.tsx` | One white rounded bar, centered and wrapping: swatch + "Standard Free" / "Premium ₹250" / "Extra legroom ₹350" (prices from `CATEGORY_PRICE`), a divider, "Your group", "Taken" | none |
| `SiteHeader` | `layout/SiteHeader.tsx` | Navy brand bar (min-height 56px, 1360px container): logo + wordmark `FLIGHT.brand`, Manage booking / Help (mock `#` links), Start over (asks for confirmation whenever `hasBookingProgress` is true — an extra or renamed passenger, a seat or a meal — listing what will be cleared; then returns to the Seats step), and "INR ₹" behind a 1px divider. Phones keep Help + Start over | none |
| `FlightStrip` | `layout/FlightStrip.tsx` | White strip with DEL 06:10 — "2h 15m · Non-stop" over a line with a plane — BOM 08:25, a divider and "Fri, 21 Nov · NA 2134 · N adults" (N = passenger count); the step indicator sits on the right. Below `md` it is one line ("DEL → BOM · 06:10 · Fri, 21 Nov") plus `MobileStepSwitch` | none |
| `BookingSteps` | `layout/BookingSteps.tsx` | `<nav aria-label="Booking progress"><ol>`: Travellers (done) › Seats › Meals › Review, 22px circles joined by 20px lines. Done = navy circle + check; current = navy circle + number + `aria-current="step"`; upcoming = grey outline. Seats and Meals are buttons that switch the view (Left/Right arrows too); a completed, revisitable step (Seats while on Meals) has `aria-label="Go back to Seats"`, a pointer cursor and an underlined label on hover; Travellers and Review are not clickable. Replaces the old Seats/Meals tabs | none |
| `MobileStepSwitch` | `layout/MobileStepSwitch.tsx` | "Step 2 of 4 · Seats" with the Seats / Meals switch as two buttons (`aria-current="step"`) | none |
| `PassengerPanel` | `passengers/PassengerPanel.tsx` | White Travellers card: "Travellers" (16/700) with "2 of 3 seated" under it, the compact stepper on the right, then rows (md+) or chips (mobile, CSS only). No helper text or progress bar | `className?` |
| `PassengerCountSelector` | `passengers/PassengerCountSelector.tsx` | Pill on `#F1F4F8`: − count + (34px buttons, "+" on white); buttons `disabled` at the limits. If `getSeatedPassengersRemovedBy` > 0 a `ConfirmDialog` asks first | none |
| `PassengerList` / `PassengerRow` / `PassengerAvatar` | `passengers/` | One full-width row per traveller: 36px initials avatar (navy when active), name 14/600, sub-line "Adult · Premium" / "Adult · Selecting seat" / "Adult · No seat yet", and on the right the seat code pill, or a navy "Now" pill for the active passenger without a seat. Active row: 1.5px navy border, `#F4F7FB`, `aria-pressed` on its button and `aria-current` on the item. The pencil (rename inline, live counter near the 30-character limit, toast if the name changed) and ✕ (remove seat) buttons appear on row hover or `focus-within`, so they stay keyboard reachable, and are always visible on touch screens (`pointer-coarse:`), where there is no hover. When the ✕ removes the seat, or Enter / Esc closes the name input, focus returns to the row button (`useFocusAfterRender`) instead of dropping to `<body>`. Rename and remove-seat (with their toasts) come from `usePassengerActions` | row: `passenger, seat, isActive, onSelect, onRename, onRemoveSeat` |
| `MainArea` | `layout/MainArea.tsx` | The center column, with no card around it. Seats step: h1 "Select your seats" + "Choosing a seat for <active name>" (or, once `isBookingComplete`, "All travellers seated · click a traveller to change their seat"), layout toggle, legend, map. Meals step: h1 "Choose meals" + "For <active name>", meal grid. Calls `useSeatMap` so loading continues on the Meals step | `className?` |
| `MealSelector` / `MealCard` / `DietIndicator` | `meals/` | Auto-fill grid of cards for the active passenger (white, 1px border, 12px radius; selected = 1.5px navy border, `#F4F7FB`, check icon; `aria-pressed`). Clicking dispatches `SELECT_MEAL`; the reducer toggles. Veg/non-veg shown as the Indian green/red mark (with an aria-label) and prices "Free"/₹ | card: `meal, isSelected, onSelect` |
| `PassengerChips` | `passengers/PassengerChips.tsx` | Mobile chips (initials avatar + name + seat code), `aria-pressed` on the active one, and under them an "Edit name of <active>" button that opens the same `InlineNameEditor` (phones have no hover actions); renames go through `usePassengerActions` | none |
| `PriceSummary` | `summary/PriceSummary.tsx` | The Booking summary card with no inner padding on its root: header ("Booking summary", "DEL → BOM · Fri, 21 Nov"); middle with a "Seats" list ("Aarav Mehta · 4A … ₹250", "Free", or muted "Kabir Mehta … Not selected") and a "Meals" list ("Aarav Mehta · Paneer Tikka Wrap … ₹300"); footer on `#F8FAFC` with "Total" + 28/800 `AnimatedAmount`, the full-width 48px Continue button and the reason text under it | `onReview, onProceed?` |
| `useContinueStep` / `ContinueButton` | `summary/` | The hook decides what the primary button does for the open step ("Continue to meals" → switches to Meals; on Meals "Review & confirm" → opens the review modal) and when it is blocked (`isBookingComplete`); the reason is "Pick a seat for <first unseated passenger> to continue", shown as text and as the button's `aria-describedby`. The button uses `aria-disabled` so it stays focusable | hook: `{ onProceed? }`; button: `step, size?, label?, className?` |
| `PriceBreakdown` | `summary/PriceBreakdown.tsx` | Per passenger (`getPriceBreakdown`): name + subtotal, then the seat and meal line items; followed by Seats / Meals subtotal + Grand total. Used by the review dialog. All from selectors | none |
| `ReviewDialog` | `summary/ReviewDialog.tsx` | One modal, two stages kept in `ViewContext.reviewStage` (`closed` / `review` / `confirmed`). `review`: title "Review your selections", flight line, `PriceBreakdown`, "Back" (closes) and "Confirm". `confirmed`: green check, "You're all set", "Your seats and meals are saved for DEL → BOM on Fri, 21 Nov.", "Done" (closes) and "Start a new selection" (reset, back to Seats). The copy deliberately avoids "booking" / "booked" / "paid": this is a selection demo, nothing is sent anywhere | none |
| `SummarySidebar` / `MobileSummaryBar` | `summary/` | Sidebar card for `md+` (flex 1 1 280px, max 330px; sticky from 1200px); fixed bottom bar for `<md`: total (+ the reason when blocked), a "Details" button opening a bottom sheet with the summary, and a primary "Continue". It has no back button of its own (the step switch and "Back to seats" above the meals cover that), so the total keeps its room at 320px | sidebar: `className?` |
| `Button` | `ui/Button.tsx` | Variants `primary` (navy) / `secondary` / `danger`, sizes `md` (40px) / `lg` (48px, radius 10). Disabled and `aria-disabled` both render flat `#E3E8EF` with `#44505F` text | native button props + `variant?`, `size?` |
| `IconButton` | `ui/IconButton.tsx` | Icon-only button (`sm` 28px, `md` 36px, `lg` 34px round); mandatory `label` becomes `aria-label` and `title` | `label, size?` + native props |
| `Modal` | `ui/Modal.tsx` | Native `<dialog>.showModal()`: focus trap, inert background, Esc and focus restore. 14px radius, soft large shadow, navy backdrop. `sheet` variant docks to the bottom, has no padding and an `sr-only` title because it hosts the summary card with its own heading | `open, title, children, onClose, variant?` |
| `ConfirmDialog` | `ui/ConfirmDialog.tsx` | Confirm/cancel on top of `Modal`; Cancel is autofocused | `open, title, children, confirmLabel?, cancelLabel?, onConfirm, onCancel` |
| `ToastProvider` / `useToast` | `ui/Toast.tsx` | `showToast(message, variant?)`; white card, 1px border, 12px radius, navy text and a colored status dot (success green, info blue, error red); 3 s auto-dismiss, max 3 stacked, a repeated message replaces the one on screen, slide-in animation, long names wrap, `aria-live="polite"` region | provider takes `children` |
| `AnimatedAmount` | `ui/AnimatedAmount.tsx` | Counts to the new price (`useAnimatedNumber`); the digits are `aria-hidden` and a visually hidden span carries the final amount. Used for the subtotals / grand total and the mobile bar | `amount` |

**Accessibility.** Every focusable element gets a visible 2 px navy ring (a zero-specificity `:where(...):focus-visible` fallback in `globals.css`, plus per-component classes; white on the navy header). Seats draw a 3 px navy ring on the seat face for hover and keyboard focus (the navy active seat gets a white gap so the ring stays visible). Text and key graphics meet WCAG AA: muted text is `#5A6576` and never lighter, seat outlines are at least 3:1, the disabled button is `#44505F` on `#E3E8EF`. The loading skeleton is `aria-busy` with a status message, the error is `role=alert`, the seat map is a labelled region, each seat row has `aria-label="Row N"`, the mobile bar is a labelled region, layout buttons have explicit labels, the step indicator is a `nav` with `aria-current="step"`, the Continue button is `aria-describedby` its visible reason, and the animated total exposes only its final value to screen readers. The old tab roles were dropped with the tabs (a `tablist` cannot live inside the required `<ol>`); the open step is exposed with `aria-current="step"` and the arrow-key switching was kept.

**Motion.** All animation lives in `globals.css` inside `@media (prefers-reduced-motion: no-preference)`: seat select pop (`seat-pop`, on both selected statuses so it plays when a seat becomes selected and not when the active passenger changes), toast slide-in, skeleton pulse. A blanket `reduce` rule also shortens transitions. The total counting animation is JS, so `useAnimatedNumber` checks `usePrefersReducedMotion` and jumps straight to the value.

**Keyboard.** Roving tabindex: one seat is in the Tab order. Arrow keys move through the grid (aisles skipped), Home/End jump to row ends, Enter/Space select. Pure logic in `seatNavigation.ts`. Focusing a seat shows its hover card, so keyboard users get the same information as mouse users. On the Seats / Meals step buttons Left / Right switch to the other step and move focus (`useStepKeyDown`). The rename / remove-seat buttons of a traveller row appear on `focus-within`, and focus returns to the row when they close.

## 7. Flow of execution

State flow: see the diagram in section 5. Seat generation: `generateSeatMap(layoutId)` → looks up `LAYOUTS[layoutId]` → for each row and column derives `position` → `getSeatCategory` (override → bulkhead row 1 or one of `layout.exitRows` = extra legroom → premium rows → standard) → `getCategoryPrice` → `isSeatOccupied` (seeded hash) → `Seat[]`.

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
   (hover or focus on a seat -> SeatHoverCard with getAdjacentCompanion for "Next to <name>")
```

**Seat map loading**

```
 first render (SSR + hydration) -> createLoadingState(): seats [], status 'loading' -> SeatMapSkeleton
 MainArea calls useSeatMap() (always mounted, so switching to the Meals step does not stop the request)
   effect runs while status === 'loading' -> fetchSeatMap(layoutId)   (600 ms; fails if ?simulateError=1)
     ok   -> SEATS_LOADED -> status 'ready' -> SeatMap renders the cabin (key = layoutId)
     fail -> SEATS_FAILED -> status 'error' -> SeatMapError ("Retry")
   Retry -> RETRY_SEATS -> 'loading' -> skeleton -> request again
```

**Layout switch**

```
 click segment in LayoutToggle
   -> same layout? ignore
   -> getAssignedCount(state) > 0 ? open ConfirmDialog ("will clear N seat selections")
                                  : switch immediately
   -> confirm -> setLayout() -> SET_LAYOUT (seats dropped, status 'loading', seatIds cleared)
   -> toast "Switched to 2–3–2 layout · N seat selections cleared"
   -> skeleton for the new layout -> useSeatMap fetches -> SEATS_LOADED -> cabin
   -> switching again before it answers: the old request is ignored (cleanup + layout check in the reducer)
```

**Page layout (`src/app/page.tsx`)**

```
 <AppProviders>            ToastProvider > BookingProvider > ViewProvider
   <SiteHeader/>           navy brand bar
   <FlightStrip/>          route + flight facts + step indicator
   <main>                  max-width 1360, padding 28px 32px 56px, flex row that wraps, gap 28px
     PassengerPanel        Travellers card          flex 1 1 260px, max-width 300px
     MainArea              seat area / meals        flex 999 1 520px, min-width 0, no card
     SummarySidebar        Booking summary card     flex 1 1 280px, max-width 330px (hidden <md)
   <MobileSummaryBar/>     fixed bottom, md:hidden
```

| Breakpoint | Layout |
|---|---|
| `>= 1200px` | The Travellers and Booking summary cards are `position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow-y: auto`, so they stay in view while the seat map scrolls. Below 1200px they are not sticky |
| `md` and up | Brand bar with all links, full flight strip with the step indicator, summary card in the page. When the three flex items no longer fit on one row (about 1180px of viewport) the panels wrap onto their own rows |
| `<md` | Brand bar: wordmark + Help + Start over; flight strip is one line plus "Step 2 of 4 · Seats" with the Seats / Meals buttons; the Travellers card shows chips; the cabin is full width without wings; a fixed bottom bar holds the total, Details and Continue (+ reason) |

The cabin's scroll box (`overflow-x-auto`) has 96px of horizontal room on each side from 640px so the wings fit. When the fuselage plus that room does not fit the box (2–3–2 below about 1360px), the wings and the room are dropped, so the cabin fits without scrolling from about 1280px; only narrower boxes scroll sideways (seats stay 38px). The mobile summary bar pads itself with `env(safe-area-inset-bottom)` (the viewport export sets `viewportFit: "cover"`, and `--summary-bar-height` includes the inset so the page padding and the details card follow). The mobile seat-details card is `sticky` above the summary bar via `--summary-bar-height`; being in the page flow it never covers the end of the seat map, and the page reserves bottom padding for the fixed summary bar.

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
 pencil (row) or "Edit name of X" (mobile) -> InlineNameEditor (Enter or blur = RENAME_PASSENGER, Esc = cancel; reducer trims, 30 chars, empty -> "Passenger N")
   Enter / Esc -> focus back on the row / edit button; blur leaves focus where the user put it
 ✕ on a card -> REMOVE_SEAT + toast "Seat 12C removed from X" -> focus back on the row
 click card or chip -> SET_ACTIVE_PASSENGER -> next seat click goes to that passenger
```

**Meal selection**

```
 Meals step (step indicator / mobile switch, or "Continue to meals")
 passenger rows / chips choose who the meals are for (the title says "For <name>")
 click a MealCard -> SELECT_MEAL { passengerId, mealId }
   -> selectMeal(): unknown passenger/meal                      -> same state
                    same meal again / null / NO_MEAL_ID          -> mealId = null
                    otherwise                                     -> mealId = id
 -> selectors: getMealSummaryLines / getMealsTotal / getGrandTotal -> Booking summary
```

**Back navigation (Meals → Seats)**

```
 four entry points, all just setView('seats') in ViewContext (no reducer action):
   "← Back to seats" text button above the "Choose meals" title (44px hit area)
   "Back to seats" secondary button under "Review & confirm" in the summary footer (also closes the mobile sheet)
   44px left-arrow icon button (aria-label "Back to seats") at the left of the mobile bottom bar
   the completed "Seats" step in the indicator (a button, aria-label "Go back to Seats", label underlined on hover)
 setView('seats') also calls window.scrollTo({ top: 0 }); seats, meals, names and the passenger count are untouched
 the Seats step shows no back button; "Travellers" is a completed step but not revisitable (no view)
 stepModel: each step has isRevisitable = done && has a view (only Seats, and only while on Meals)
```

**Summary and Continue**

```
 every render: PriceSummary -> getPassengerSeatLines / getMealSummaryLines / getGrandTotal
   seats list shows every passenger ("Not selected" while unseated); meals list shows passengers with a meal
 Continue (useContinueStep): isBookingComplete(state)?
   no  -> aria-disabled, text under the button: "Pick a seat for <getFirstUnseatedPassenger> to continue"; click ignored
   yes -> Seats step: "Continue to meals" -> switch to Meals
          Meals step: "Review & confirm" -> reviewStage = 'review' -> ReviewDialog
                      Confirm -> 'confirmed' ("You're all set"); Back / Done / Esc -> 'closed'; Start a new selection -> RESET + Seats step
 step indicator (getBookingSteps(view, reviewStage)): 'review' -> Review is current; 'confirmed' -> all 4 steps done; 'closed' -> by view
 mobile: bar (button label stays "Continue") shows total + reason + Details + Continue -> Details opens a sheet with the same PriceSummary (Continue there closes the sheet first)
```

**Hover vs touch.** Mouse hover and keyboard focus show the seat hover card (`md` and up). On small screens there is no hover, so the last tapped seat's details appear in a sticky card above the bottom bar.

## 8. Walkthrough: what runs, step by step

Scenario: open the page, set 3 passengers, click seat 1C, click 1C again, switch layout. Seat 1C on the 3-2 layout is an override: Extra legroom, ₹350, never occupied, position `aisle` (last seat of the A-B-C block, next to the gap).

### 8.1 Open the page

```
 1. app/page.tsx (server component) renders <AppProviders> and the page shell; no Math.random / Date.now anywhere.
 2. AppProviders ('use client') -> ToastProvider > BookingProvider > ViewProvider.
      BookingProvider: useReducer(bookingReducer, undefined, () => createLoadingState())
        -> { layoutId '3-2', seats [], seatMapStatus 'loading',
             passengers [{ id 'passenger-1', name 'Passenger 1', seatId null, mealId null }],
             activePassengerId 'passenger-1' }
      ViewProvider: view = 'seats', reviewStage = 'closed'.
 3. First render (identical on server and client, so hydration matches):
      SiteHeader, FlightStrip (+ BookingSteps: Travellers done, Seats current),
      PassengerPanel ("0 of 1 seated", row for Passenger 1 with a "Now" pill),
      MainArea -> title "Select your seats" + LayoutToggle + SeatLegend + SeatMap,
      SeatMap sees status 'loading' -> SeatMapSkeleton (aria-busy region),
      SummarySidebar / MobileSummaryBar (total ₹0, Continue blocked: "Pick a seat for Passenger 1 to continue"),
      ReviewDialog (closed).
 4. After hydration MainArea's useSeatMap() effect runs (status === 'loading'):
      fetchSeatMap('3-2') -> setTimeout 600 ms
        -> isErrorSimulated() reads ?simulateError=1 from window.location
           1  -> rejects SeatMapFetchError -> seatsFailed('3-2') -> SEATS_FAILED -> status 'error' -> SeatMapError + Retry
           else -> generateSeatMap('3-2') -> seatsLoaded('3-2', seats) -> SEATS_LOADED
 5. generateSeatMap: for each of 20 rows x columns A-E (100 seats):
      getSeatPosition -> getSeatCategory (override -> row 1 or an exit row of the layout = extra legroom -> premium rows -> standard)
      -> getCategoryPrice -> isSeatOccupied (FNV-1a hash of "3-2:<id>" % 100 < 20; overrides never occupied).
 6. Reducer: seatsLoaded -> isAwaitingSeats (status 'loading' AND layoutId matches) -> { seats, seatMapStatus 'ready' }.
 7. SeatMap renders <SeatMapContent key="3-2">: groupSeatsByRow, buildSeatGrid, and for every seat
      getSeatStatus / getSeatOwner -> <Seat> -> <SeatFace>. The effect in useSeatMap re-runs, sees 'ready', does nothing.
```

### 8.2 Set 3 passengers

The count control is a stepper, so this is two clicks on "+" (1 -> 2 -> 3). Each click:

```
 1. PassengerCountSelector: requestCount(count + 1)
      getSeatedPassengersRemovedBy(state, next) -> 0 (nobody is dropped when growing) -> no confirm dialog
      setPassengerCount(next) -> dispatch { type: 'SET_PASSENGER_COUNT', count: next }
 2. bookingReducer -> reduce -> setPassengerCount(state, rawCount):
      clamp to 1-6; same count -> same state;
      growing: append createPassenger(index) -> { id 'passenger-2', name 'Passenger 2', seatId null, mealId null }
      active passenger (passenger-1) has no seat -> stays active (the "hand over to the first new passenger"
      branch only runs when the active passenger is already seated)
 3. assertBookingInvariants(next) (dev only) passes: no seats assigned yet.
 4. Re-render: PassengerPanel "0 of 3 seated", PassengerList renders 3 PassengerRow, FlightStrip "3 adults",
    PriceSummary "Seats" list shows three "Not selected" lines, the Continue reason still names Passenger 1.
    The "+" button is disabled only at 6.
```

### 8.3 Click seat 1C

```
 1. Seat <button> onClick: event.detail === 1 (a second click of a double-click would be ignored) -> onSelect('1C')
 2. SeatMapContent.selectSeat('1C'):
      handleSeatClick = useSeatClick() ->
        getSeatClickOutcome(state, '1C')   (pure, uses the CURRENT state)
          map ready? yes -> active passenger? passenger-1 -> seat exists? yes -> occupied? no
          owner in getSeatOwnerMap(passengers)? none -> active.seatId is null -> { type 'assigned',
          message "Seat 1C assigned to Passenger 1 — ₹350" }
        dispatch({ type: 'SEAT_CLICKED', seatId: '1C' })
        returns the outcome
      showToast(outcome.message, getOutcomeToastVariant(outcome))   -> 'success' toast
      setTappedSeatId('1C')                                          -> mobile details bar
 3. Reducer: applySeatClick re-runs getSeatClickOutcome (same state, same answer) ->
      updatePassenger(passengers, 'passenger-1', { seatId: '1C' })       (a new array)
      findNextUnseatedId(passengers, 'passenger-1') -> 'passenger-2'      rule f: auto-advance
      -> { ...state, passengers, activePassengerId: 'passenger-2' }
    assertBookingInvariants: 1C is held once, exists, is not occupied -> ok.
 4. Re-render (everything below is derived, nothing else was written):
      getSeatOwnerMap(newPassengers) rebuilds the seat -> owner Map (WeakMap cache keyed by the new array)
      1C: getSeatStatus -> owner passenger-1 is not the active passenger -> 'selected-other'
          (soft blue, initials "P1"); the hover card now reads "Taken by Passenger 1"
      PassengerRow 1: seat pill "1C", sub-line "Adult · Extra legroom"; row 2 is active with the "Now" pill
      MainArea: "Choosing a seat for Passenger 2"
      getSeatsTotal -> 350, getGrandTotal -> 350 -> AnimatedAmount counts up from ₹0
      PriceSummary: "Passenger 1 · 1C ₹350", the other two "Not selected"
      isBookingComplete -> false, Continue reason: "Pick a seat for Passenger 2 to continue"
```

### 8.4 Click 1C again

Because of the auto-advance in 8.3, the active passenger is now Passenger 2, not Passenger 1.

```
 1. Same path to getSeatClickOutcome(state, '1C'):
      occupied? no -> owner passenger-1 !== active passenger-2
      -> { type 'blocked', reason 'taken-by-other', message "Seat 1C is taken by Passenger 1" }   rule c
 2. dispatch SEAT_CLICKED -> applySeatClick sees 'blocked' -> returns the SAME state object ->
    useReducer bails out, no state-driven re-render, assertBookingInvariants still passes.
 3. selectSeat still shows the toast, in the 'error' variant. Nothing else changes; the total stays ₹350.

 To release 1C instead (rule d):
   click the Passenger 1 row (SET_ACTIVE_PASSENGER), then click 1C
     -> owner === active -> { type 'removed', "Seat 1C removed from Passenger 1" }
     -> reducer sets passenger-1.seatId = null; no auto-advance (removing never advances);
        Passenger 1 stays active, the total returns to ₹0.
   or press ✕ on the Passenger 1 row -> REMOVE_SEAT (usePassengerActions toasts "Seat 1C removed from Passenger 1"; focus returns to the row).
```

### 8.5 Switch layout (3-2 -> 2-3-2)

```
 1. LayoutToggle.requestLayout('2-3-2'): same as current? ignore.
      getAssignedCount(state) > 0 ?
        yes (Passenger 1 holds 1C) -> setPendingLayout -> ConfirmDialog
              "Switching layout will clear 1 seat selection." -> Switch layout -> confirmSwitch()
        no  -> applyLayout directly
 2. applyLayout: setLayout('2-3-2') -> dispatch SET_LAYOUT; showToast("Switched to 2–3–2 layout · 1 seat selection cleared", 'info')
 3. Reducer setLayout: { layoutId '2-3-2', seats [], seatMapStatus 'loading',
                         passengers: every seatId -> null }       names, meals, count and the active passenger stay
 4. Re-render: SeatMap status 'loading' -> SeatMapContent unmounts (its focus / hover / tapped-seat state dies with it)
      and SeatMapSkeleton draws LAYOUTS['2-3-2']; totals drop to ₹0 because there are no assigned seats.
 5. useSeatMap effect: layoutId / status changed -> fetchSeatMap('2-3-2') after 600 ms
      -> SEATS_LOADED { layoutId '2-3-2', seats } -> accepted only if status is 'loading' AND layoutId matches
      -> 'ready' -> <SeatMapContent key="2-3-2"> mounts with 140 seats (20 rows x 7); the 3-2 overrides do not apply,
         so row 1 and row 10 are Extra legroom, rows 2-5 window/aisle Premium, everything else Standard.
 6. If the user switches again before the answer arrives: the effect cleanup flips isCurrent, so the old promise is
    ignored, and the reducer would also drop it (layoutId mismatch). If the request fails, status 'error' + Retry.
```

## 9. Key functions

| Name | File | Input → Output | Why it exists |
|---|---|---|---|
| `generateSeatMap` | `src/lib/generateSeatMap.ts` | `LayoutId → Seat[]` | Single place that builds a full cabin from config, so adding a layout is just data. |
| `toSeatId` | `src/lib/generateSeatMap.ts` | `row, column → "12C"` | The one definition of the seat id format; used by the generator, the keyboard grid and `getAdjacentCompanion`. |
| `getSeatPosition` (private) | `src/lib/generateSeatMap.ts` | column groups + indices → `SeatPosition` | Window = cabin edges; aisle = next to a gap; else middle. Works for any layout. |
| `getSeatCategory` | `src/data/seatPricing.ts` | `LayoutConfig`, seat id, row, position → `SeatCategory` | Centralises pricing rules with explicit overrides first; extra legroom comes from `BULKHEAD_ROW` and the layout's own `exitRows`. |
| `getCategoryPrice` | `src/data/seatPricing.ts` | `SeatCategory → number` | Category → INR price lookup. |
| `isSeatOccupied` | `src/data/seatPricing.ts` | layout, seat id → boolean | Deterministic ~20% occupancy via FNV-1a hash (no `Math.random`, so no hydration mismatch). |
| `formatCurrency` | `src/lib/formatCurrency.ts` | `number, {forceZero?} → string` | Consistent ₹ formatting; "Free" for 0 unless `forceZero`. |
| `formatCount` | `src/lib/formatCount.ts` | `count, singular, plural? → string` | "1 seat" / "2 seats": the one pluralisation rule for every dialog, toast and the flight strip. |
| `defaultPassengerName` | `src/lib/passengerName.ts` | `index → "Passenger N"` | Default names for new passengers and empty renames; also lets `hasBookingProgress` spot a renamed passenger. |
| `bookingReducer` | `src/state/bookingReducer.ts` | `(state, action) → state` | Pure transitions; runs the dev-only invariant check on every result. |
| `createInitialState` | `src/state/bookingReducer.ts` | `(layoutId?, count?) → BookingState` | Deterministic start state (3-2 layout, 1 passenger, ids `passenger-N`). |
| `getSeatClickOutcome` | `src/state/bookingReducer.ts` | `(state, seatId) → { type, reason?, message }` | Single source of truth for click rules; used by reducer and UI toast. |
| `assertBookingInvariants` | `src/state/bookingReducer.ts` | `state → void` (throws) | Dev guard: no shared seats, valid seats, valid active passenger. |
| `createLoadingState` | `src/state/bookingReducer.ts` | `(layoutId?, count?) → BookingState` | The app's start state: no seats yet, `seatMapStatus: 'loading'`. |
| `resolvePassengerName` | `src/state/bookingReducer.ts` | `(rawName, index) → { name, notice }` | Single rule for what a typed name becomes (trim, 30 chars, empty → "Passenger N"); the reducer uses `name`, the UI toasts `notice`. |
| `getSeatRemovedMessage` | `src/state/bookingReducer.ts` | `seatId, name → string` | "Seat 12C removed from X", shared by the seat-click outcome and the row's ✕ button. |
| `usePassengerActions` | `src/components/passengers/usePassengerActions.ts` | `() → { rename, removeSeat }` | Rename / remove-seat plus their toasts, shared by the desktop rows and the mobile chips. |
| `useFocusAfterRender` | `src/hooks/useFocusAfterRender.ts` | `() → { targetRef, requestFocus }` | Focuses a target after the next render, so focus does not drop to `<body>` when the focused control unmounts. |
| `fetchSeatMap` | `src/data/mockApi.ts` | `LayoutId → Promise<Seat[]>` | Fake request: 600 ms, resolves with `generateSeatMap`, rejects when the URL has `?simulateError=1`. |
| `useSeatMap` | `src/hooks/useSeatMap.ts` | `() → { status, retry }` | Runs the request while status is `loading` and feeds `SEATS_LOADED` / `SEATS_FAILED` into the reducer. |
| `useAnimatedNumber` | `src/hooks/useAnimatedNumber.ts` | `(target, durationMs?) → number` | requestAnimationFrame easing toward `target`; returns `target` itself on first render and with reduced motion. |
| `usePrefersReducedMotion` | `src/hooks/usePrefersReducedMotion.ts` | `() → boolean` | Live media query via `useSyncExternalStore` (server snapshot `false`, so no hydration mismatch). |
| `useHorizontalOverflow` | `src/hooks/useHorizontalOverflow.ts` | `ref, reservePx? → boolean` | ResizeObserver check that the map scrolls sideways; with `reservePx`, whether the first child plus that room would not fit (drives the wings). |
| `findNextUnseatedId` (private) | `src/state/bookingReducer.ts` | passengers, fromId → id or null | Auto-advance: next passenger in order (wrapping) with no seat. |
| `getSeatOwnerMap` | `src/state/selectors.ts` | `Passenger[] → Map<seatId, passengerId>` | O(1) owner lookups; cached per passengers array in a `WeakMap`. |
| `getSeatStatus` | `src/state/selectors.ts` | state, seat → `SeatStatus` | Derives occupied / available / selected-current / selected-other. |
| `getSeatOwner`, `getPassengerSeat` | `src/state/selectors.ts` | state, id → `Passenger` / `Seat` or undefined | Seat ↔ passenger lookups. |
| `getSeatsTotal`, `getMealsTotal`, `getGrandTotal` | `src/state/selectors.ts` | state (, meals) → number | Price totals in INR; meals list is injectable for tests. |
| `getPriceBreakdown` | `src/state/selectors.ts` | state (, meals) → per-passenger line items | Seat + meal line items and subtotal per passenger; drives the review dialog's `PriceBreakdown`. |
| `getAssignedCount`, `getMealCount` | `src/state/selectors.ts` | state → number | Passengers with a seat / a meal; used by the layout-switch and reset confirmations. |
| `hasBookingProgress` | `src/state/selectors.ts` | state → boolean | True if "Start over" would lose anything: an extra or renamed passenger, a seat or a meal. Decides whether reset asks first. |
| `getUnassignedCount` | `src/state/selectors.ts` | state → number | Passengers still without a seat. |
| `isBookingComplete` | `src/state/selectors.ts` | state → boolean | Gate for Continue (both steps): every passenger has a seat. |
| `getSeatedPassengersRemovedBy` | `src/state/selectors.ts` | state, newCount → number | How many seated passengers shrinking would drop (decides the confirm dialog). |
| `getSelectedMealOptionId` | `src/state/selectors.ts` | state, passengerId → option id | Which meal card is highlighted; "No meal" when `mealId` is null. |
| `selectMeal` (private) | `src/state/bookingReducer.ts` | state, passengerId, mealId → state | Validates passenger/meal, toggles, clears on `null` / No meal. |
| `getPassengerMeal` | `src/state/selectors.ts` | state, passengerId (, meals) → `MealOption` or undefined | A passenger's meal (feeds the summary lines). |
| `getMealSummaryLines` | `src/state/selectors.ts` | state → lines | One display-ready line per passenger with a meal (summary card's Meals list). |
| `getPassengerInitial` | `src/lib/passengerInitial.ts` | name → string | Label on a seat and in avatars: first + last word initials ("Aarav Mehta" → "AM"), one letter for one word, number kept for default names ("Passenger 2" → "P2"), emoji kept whole. |
| `getActivePassenger` | `src/state/selectors.ts` | state → `Passenger` or undefined | The passenger the next seat click is for (page title, hover card). |
| `getFirstUnseatedPassenger` | `src/state/selectors.ts` | state → `Passenger` or undefined | First passenger in order without a seat; names who to pick a seat for in the Continue reason. |
| `getPassengerSeatLines` | `src/state/selectors.ts` | state → `{ passengerId, passengerName, seat? }[]` | One line per passenger (seated or not) for the summary's Seats list. |
| `getAdjacentCompanion` | `src/state/selectors.ts` | state, seat → `Passenger` or undefined | Who sits right beside the seat in the same block (left first, never across an aisle), ignoring the seat's own owner or, when free, the active passenger who would take it. Powers "Next to <name>" in the hover card. |
| `getBookingSteps`, `getCurrentStep`, `getOtherView` | `src/components/layout/stepModel.ts` | view → steps with status | Pure model of the 4-step indicator: Travellers done, the open view current, later steps upcoming. |
| `useContinueStep` | `src/components/summary/useContinueStep.ts` | `{ onReview, onProceed? }` → `{ label, isEnabled, reason, reasonId, proceed }` | What the primary button does on each step and why it may be blocked. |
| `getSeatAriaLabel` | `src/components/seat-map/seatDisplay.ts` | seat, status, owner name → string | "Seat 12C, Premium, ₹250, available". |
| `getSeatDescription`, `getSeatActionText` | `src/components/seat-map/seatDisplay.ts` | seat / status, names → string | "Premium · Aisle seat" and the hover card's last line ("Click to select for …", "Your seat — click to remove", "Taken by …", "Unavailable"). |
| `buildSeatGrid`, `getNextSeatId` | `src/components/seat-map/seatNavigation.ts` | layout → ids per row; (grid, id, key) → next id | Arrow-key movement that works for any layout. |
| `BookingProvider`, `useBooking`, `useBookingActions`, `useSeatClick` | `src/context/BookingContext.tsx` | n/a | Provider and typed hooks (`useBookingActions` returns the `BookingActions` interface). |
| `ViewProvider`, `useMainView` | `src/context/ViewContext.tsx` | n/a | UI-only open step (`seats` / `meals`) and review dialog stage; `setView('seats')` also scrolls to the top. |
| `getSeatById` | `src/state/selectors.ts` | `seats, seatId → Seat` or undefined | O(1) seat lookup through a `WeakMap` index cached per seats array; used by the click rules, the invariant check and the selectors. |
| `getOutcomeToastVariant` | `src/components/seat-map/seatDisplay.ts` | outcome → toast variant | blocked → error, removed → info, assigned / changed → success. |
| `getStatusLabel` | `src/components/seat-map/seatDisplay.ts` | status, owner name → string | Status words inside the seat `aria-label` ("available", "occupied", "selected by <name>"...). |
| `isNavigationKey` | `src/components/seat-map/seatNavigation.ts` | key → type guard | True for arrows / Home / End so other keys are left alone. |
| `PencilIcon`, `CloseIcon`, `PlusIcon`, `MinusIcon`, `CheckIcon`, `ArrowLeftIcon`, `PlaneIcon`, `LogoIcon` | `src/components/ui/Icons.tsx` | `className?` → SVG | Inline decorative icons (`aria-hidden`); meaning comes from the button label. |

**Constants.** `MIN_PASSENGERS` (1), `MAX_PASSENGERS` (6), `MAX_NAME_LENGTH` (30) in `bookingReducer.ts`; `CATEGORY_PRICE`, `BULKHEAD_ROW` (1), `PREMIUM_ROW_RANGE`, `OCCUPANCY_RATE`, `CATEGORY_OVERRIDES` in `seatPricing.ts`; `LAYOUTS` (each with its `exitRows`), `LAYOUT_IDS` in `layouts.ts`; `MEAL_OPTIONS`, `NO_MEAL_ID` in `meals.ts`; `FLIGHT` in `flight.ts`; `SEAT_MAP_DELAY_MS` (600), `SIMULATE_ERROR_PARAM` (`simulateError`) in `mockApi.ts`; `TOAST_DURATION_MS` (3000), `MAX_VISIBLE_TOASTS` (3) in `Toast.tsx`; `TOTAL_STEPS`, `SWITCHABLE_VIEWS` in `stepModel.ts`.

## 10. Business rules & edge cases

- Prices: Standard ₹0, Premium ₹250, Extra Legroom ₹350.
- Row 1 (the bulkhead) and every exit row of the layout (`exitRows`, row 10 in both layouts) are Extra Legroom.
- Rows 2–5: window and aisle seats Premium, middle seats Standard.
- Everything else Standard.
- Explicit override map for the 3-2 layout to match the sample: 1A ₹0, 1B ₹0, 1C ₹350 (XL), 1D ₹0, 1E ₹250 (Premium), 2A ₹350 (XL), 2B ₹0. Overrides beat the row rules (e.g. 1A would otherwise be XL).
- Overridden seats are never marked occupied, so the sample design always shows them available.
- Seat letters are consecutive (A–E, A–G). The source PDF skipped 'C', treated as a typo.
- Occupancy is deterministic (hash of `layoutId:seatId`, ~20%), identical on server and client.
- `formatCurrency(0)` → "Free"; `formatCurrency(0, { forceZero: true })` → "₹0".
- Seat status is derived, not stored.
- Seat clicks (`SEAT_CLICKED`), evaluated in this order:
  - 0) Seat map not `ready` (loading or error) → blocked (`seats-not-ready`). Unreachable from the UI (no seats are rendered) but keeps the reducer safe.
  - a) No active passenger → blocked (`no-passenger`), state unchanged.
  - b) Seat occupied → blocked (`occupied`).
  - c) Seat belongs to another passenger → blocked (`taken-by-other`).
  - d) Seat belongs to the active passenger → unassign (toggle off, `removed`).
  - e) Seat available → assign; if the passenger already had a seat the old one is released (`changed`), otherwise `assigned`.
  - f) After a new assignment (`assigned`/`changed`), the active passenger moves to the next passenger without a seat (in order, wrapping); if everyone is seated, it stays. Removing a seat never auto-advances.
  - Extra: an unknown seat id is blocked (`unknown-seat`), so a stale click can't corrupt state.
- Toast messages come straight from `outcome.message`, e.g. "Seat 12C assigned to Rahul — ₹250", "Seat 4A is already occupied", "Seat 3B is taken by Passenger 2", "Select a passenger first".
- Exit rows are marked with an EXIT strip. Both the strip and the extra-legroom price come from the same `LayoutConfig.exitRows`, so they cannot disagree.
- Blocked clicks return the **same state object**, so React skips the re-render.
- Passenger count is clamped to 1–6. Growing adds "Passenger N"; shrinking removes from the end, which frees their seats and meals automatically (ownership is on the passenger). If the active passenger is removed, the last remaining one becomes active. When growing, if the active passenger already has a seat the first newly added passenger becomes active (so the next seat click seats the new person instead of moving the seated one); if the active passenger has no seat they stay active.
- Rename: trimmed, max 30 chars, empty → "Passenger N" (N = position). `resolvePassengerName` decides; when the result differs from what was typed (empty or too long) a toast explains it.
- Switching layout drops the seats, clears every seat assignment (seat ids differ between layouts) and reloads the new layout's seats asynchronously; meals, names and the passenger count are kept.
- Meals (INR): No meal ₹0, Standard Veg Sandwich Free, Paneer Tikka Wrap ₹300, Chicken Biryani ₹400 (non-veg), Fruit & Yogurt Bowl ₹200, Jain Meal ₹250. One meal per passenger; choosing the same meal again, or No meal, clears it. Meals are independent of seats (a passenger can have a meal before a seat). Meals count toward the grand total and are kept when the layout changes; removed passengers take their meal with them.
- Shrinking the passenger count asks for confirmation only if a passenger who would be removed has a seat.
- Continue is enabled only when every passenger has a seat (`isBookingComplete`), on both steps. It uses `aria-disabled` rather than `disabled`, so keyboard users can focus it; the reason ("Pick a seat for <first unseated passenger> to continue") is plain text under the button. On the Seats step it reads "Continue to meals" and switches to the Meals step; on the Meals step it reads "Review & confirm" and opens the review modal (see `ReviewDialog`). The sub-line of a traveller row wraps instead of truncating ("Adult · Extra legroom").
- The step indicator is four steps: Travellers (always done), Seats, Meals, Review. Only Seats and Meals can be clicked; the step before the open one shows as done. Review is a label only.
- Initials: first letter of the first and last word ("Aarav Mehta" → "AM"); a name ending in a number keeps it ("Passenger 1" → "P1"); one word gives one letter; emoji stay whole.
- A seat of a non-active passenger is "your group" (soft blue); the active passenger's seat is navy.
- The booking summary lists every passenger under Seats ("Not selected" while unseated, "Free" for a free seat) and only passengers with a meal under Meals ("None selected" otherwise). The review dialog groups the prices per passenger (seat and meal line items with a subtotal) and then shows the Seats / Meals subtotals and the grand total.
- Reset ("Start over" in the brand bar) asks for confirmation whenever anything would be lost (`hasBookingProgress`: an extra or renamed passenger, a seat or a meal) and lists the counts; it returns to 1 passenger on the default layout and to the Seats step. An untouched booking resets straight away.
- `REMOVE_SEAT` for a passenger without a seat (or an unknown one) returns the same state object.
- Seats are 38px wide; the map scrolls horizontally rather than shrinking.
- Totals are computed by selectors from seats + passengers; never stored.
- Seat map request: `fetchSeatMap` takes 600 ms and fails when the URL has `?simulateError=1` (documented in the README). `SEATS_LOADED` / `SEATS_FAILED` are accepted only while loading and only for the current layout; `RETRY_SEATS` only acts on an error. RESET keeps a loaded default-layout seat map and otherwise reloads it (so it also acts as a retry).

**Polish pass: edge cases and how each is handled**

| Case | Behavior |
|---|---|
| Click with no active passenger | Blocked by rule (a), error toast "Select a passenger first", state unchanged. The UI always has an active passenger, so this is a safety net (unit tested). |
| Click an occupied seat / another passenger's seat | Blocked by rules (b) / (c); error toast names the seat and the owner; same state object, so no re-render. |
| Rapid double-click on a seat | The second click (`event.detail > 1`) is ignored, so a double-click assigns once instead of assigning then releasing. Holding Enter on a focused seat is ignored too (`event.repeat`). Identical toasts replace each other instead of stacking. Plain single clicks still toggle. |
| Rename to empty | Falls back to "Passenger N" and a toast says so. |
| Rename on a phone | The chips have no hover actions, so an "Edit name of <active>" button under them opens the same inline editor. |
| Touch tablet (md+, no hover) | The row's rename / remove-seat buttons are always visible (`pointer-coarse:`), not hover-only. |
| Focused control disappears | Removing a seat with ✕, or closing the name input with Enter / Esc, returns focus to the row (or the mobile edit button) instead of `<body>`. A blur commit leaves focus where the user put it. |
| Start over with only names / meals / extra passengers | Still asks first (`hasBookingProgress`), listing passengers, seats and meals that will be cleared. |
| Rename to a very long name | The input caps at 30 characters with a live counter (shown from 24, red at the limit); pasted text is cut to 30; long names truncate on rows and chips and wrap in toasts, summary lines and the hover card. Emoji initials stay whole. |
| Shrink passenger count with seated passengers | Confirm dialog states how many seated passengers go; the active passenger falls back to the last remaining one; toast afterwards. |
| Switch layout with assignments | Confirm dialog with the count; after confirming the toast repeats how many selections were cleared; skeleton while the new map loads; a slower answer for a layout the user already left is ignored. |
| Everyone seated | Auto-advance finds no unseated passenger and keeps the current one (no error). Re-seating or toggling off still works and keeps the same active passenger (unit tested). |
| Seat map fails | Error card with Retry; Retry shows the skeleton again; switching layout or RESET also tries again. Passengers and meals are untouched. |
| Meals step open while the map loads | Loading continues (the hook lives in `MainArea`), so the map is ready when the user returns. |
| 320 px screens | No page-level horizontal scroll. The bottom bar has only the total, Details and Continue (no extra back button), so the total keeps its room. The tapped-seat card is sticky inside the map, so it never hides the last rows. 3-2 fits; 2-3-2 is wider than the screen, so the map scrolls inside its own box and a hint appears only while it overflows. Seats stay 38 px. |
| 1920 px screens | The page is capped at 1360px and centered; the cabin stays centered in its column. |
| Hover card on the first rows | The cabin sits in an `overflow-x: auto` box, which would clip a card drawn above row 1. The card is `position: fixed`, placed from the seat's bounding box, and flips below the seat when there is no room above. |

## 11. Possible interview questions & answers

**Why Context + useReducer instead of Redux/Zustand?**
The state is small and local to one page. A reducer gives predictable, testable transitions and keeps business rules out of components, without a dependency.

**Why is seat status derived rather than stored?**
Storing it duplicates information already in `Seat.isOccupied` and `Passenger.seatId`; two copies can drift. Deriving guarantees consistency.

**How do you avoid hydration mismatches with mock data?**
No `Math.random`/`Date.now` at render. Occupancy uses a seeded FNV-1a hash of the seat id, so server and client generate identical maps.

**How would you add a new layout?**
Add a `LayoutConfig` to `layouts.ts` (column groups, rows, exit rows) and extend `LayoutId`. Seat positions, exit markers and pricing are derived from it, so `generateSeatMap` and the components need no changes.

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
Vitest unit tests (`npm test`) cover click rules a–f, passenger shrinking, layout switching, meal selection (select, replace, toggle off, unknown ids, free vs paid totals), totals and the invariant check. The reducer is pure, so tests need no React.

**How is the seat map layout-agnostic?**
`SeatMap` only reads `LayoutConfig.columnGroups`, `rows` and `exitRows`. Aisles are rendered between groups, and the header and rows share one `CabinRow` component so columns always line up. Adding a layout needs no component changes.

**How do you make seat states accessible?**
Each seat is a real `<button>` with an `aria-label` that states id, category, price and status. States differ by shape and glyph (✕, initial, dot, taller legroom seats), not just color. Occupied seats use `aria-disabled` rather than `disabled` so they stay focusable and still explain themselves via a toast.

**How does keyboard navigation work?**
A roving tabindex keeps one seat in the Tab order; arrow keys move focus through a grid built from the layout (`buildSeatGrid`), skipping aisles. The movement logic is a pure function with unit tests.

**Why a native `<dialog>` for the confirm modal?**
`showModal()` already provides focus trapping, an inert background, Esc handling and focus restoration, so there is no custom focus-trap code to get wrong.

**How does the toast system avoid Date.now/Math.random?**
Toast ids come from an incrementing ref counter. Each toast schedules its own 3 s timeout in an effect (cleared on unmount), and the list is capped at the newest 3.

**How does the page stay usable on phones?**
Below `md` the brand bar and flight strip collapse, the passengers become scrollable chips, the wings disappear, the map scrolls sideways when it is too wide (seats stay at 38px) and the summary is a fixed bottom bar with the live total, a Details button and Continue. Details opens a bottom sheet with the same `PriceSummary` the sidebar uses, so there is one implementation, and both use `useContinueStep`.

**Why is the Continue button `aria-disabled` instead of `disabled`?**
A `disabled` button cannot be focused, so keyboard users could never reach it to learn why it is blocked. `aria-disabled` keeps it focusable and `aria-describedby` points at the visible reason text under it; the click handler ignores presses until `isBookingComplete` is true.

**Where does the "can the booking continue" rule live?**
In `isBookingComplete` (selectors). `useContinueStep` only reads it, plus `getFirstUnseatedPassenger` for the reason text.

**How do you keep dialogs consistent?**
`Modal` wraps the native `<dialog>` once (focus trap, Esc, backdrop click). `ConfirmDialog`, the review dialog and the mobile sheet are thin wrappers over it.

**Why are totals never stored?**
They are pure functions of seats and passengers, computed on render, so they cannot disagree with the data and update instantly on any change.

**Why is the open step (Seats / Meals) not in the reducer?**
Which step is open is pure UI state with no business rule, so it lives in a tiny `ViewContext`. It is a context (not local state) because the step indicator, the mobile switch, the Continue button and "Start over" all read or change it from different parts of the page.

**Why did the tabs become a step indicator, and what happened to the tab roles?**
The design needs a `<nav><ol>` progress indicator. A `tablist` must own its tabs, which does not fit inside list items next to non-interactive steps, so Seats and Meals are plain buttons with `aria-current="step"` and the arrow-key switching is kept in `useStepKeyDown`. The model (which step is done / current / upcoming) is a pure function with tests.

**Where is "one meal per passenger" enforced?**
Structurally, `Passenger.mealId` is a single nullable field. The reducer's `selectMeal` also validates ids and implements the toggle, so components just dispatch the clicked id.

**Why is "No meal" a card but stored as `null`?**
It gives users an explicit option in the grid, while `null` keeps "no meal" out of the summary and totals without special cases.

**How does the async seat map work without breaking the reducer rules?**
The request lifecycle is state (`seatMapStatus`, `seats`), and three actions move it: `SEATS_LOADED`, `SEATS_FAILED`, `RETRY_SEATS`. Seat click rules are untouched; they simply cannot run until seats exist (a `seats-not-ready` guard covers the gap). The hook only performs the side effect and dispatches the result.

**What stops a slow response from overwriting a newer layout?**
Two guards. The effect cleanup ignores the result of a request that was replaced, and the reducer only accepts `SEATS_LOADED` / `SEATS_FAILED` while the status is `loading` and the action's `layoutId` equals the current one. Both are unit tested, so even without the cleanup the state stays correct.

**Why is `useSeatMap` called from `MainArea` rather than `SeatMap`?**
`SeatMap` unmounts when the Meals step is open. Calling the hook in a component that is always mounted lets the request finish in the background.

**How is the loading skeleton kept from causing layout jumps?**
`CabinShell` (fuselage, windows, galleys, column header) and `CabinRows` (rows and exit rows) are shared by the real cabin and the skeleton, and the skeleton seats use the same 38×40 size, so the footprint matches. Only the taller extra-legroom rows shift by a few pixels when the real seats arrive.

**How do you handle double-clicks without putting UI rules in the reducer?**
The reducer's toggle rule stays pure (clicking your own seat releases it). Filtering out the *second click of a double-click* is an input concern, so `Seat` ignores clicks with `event.detail > 1` and repeated Enter key presses. Deliberate toggling with two separate clicks still works.

**How did you make the animations safe for reduced motion and hydration?**
CSS animations are declared only inside `prefers-reduced-motion: no-preference`, with a blanket `reduce` rule for transitions. The animated total is JS: `usePrefersReducedMotion` (a `useSyncExternalStore` with a `false` server snapshot) disables it, and the first render returns the real value, so server and client HTML match and no `Date.now` / `Math.random` is involved.

**How did you check color contrast?**
By computing WCAG contrast ratios for the token pairs. The rule in the design tokens is that muted text is `#5A6576` and never lighter (about 6:1 on white), the disabled button is `#44505F` on `#E3E8EF`, red text is `#B42318` on `#FDECEA`, and seat outlines are at least 3:1 against the white cabin.

**Why does the seat hover card use `position: fixed`?**
The cabin lives in an `overflow-x: auto` box (so wide layouts scroll instead of squashing). Any `overflow` other than `visible` clips children on both axes, so a card absolutely positioned above a row-1 seat would be cut off. A fixed card placed from `getBoundingClientRect()` (and flipped below when there is no room) is never clipped; its position is written to the element style in a layout effect, so no state update happens during layout.

**How does "Next to <name>" work without UI rules?**
`getAdjacentCompanion(state, seat)` is a pure selector: it finds the seat's column group in the layout config, looks at the left and right neighbours in that block only (never across an aisle) and returns the first one owned by someone other than the seat's owner (or, for a free seat, the active passenger who would take it). It is unit tested; the card only renders the name.

**How are the wings and the exit row drawn?**
Decoratively and without measuring: the exit row is as wide as the fuselage (negative horizontal margin equal to the fuselage padding plus its border, via a CSS variable) with absolutely positioned red tags, and the first exit row anchors two absolutely positioned `clip-path` polygons just outside the fuselage. Everything is `aria-hidden`, and the wings are hidden below 640px.

**How do you keep the design consistent?**
One set of CSS variables in `globals.css` exposed as Tailwind colors (navy for brand, text and the active passenger; greys for surfaces; one color per seat category), so components use names like `bg-seat-group` or `text-ink-muted` and never raw hex values.

**Why does clicking 1C a second time fail instead of releasing the seat?**
Rule f auto-advances the active passenger after an assignment, so the second click is made by Passenger 2, and the seat belongs to Passenger 1 (rule c, "taken by Passenger 1"). The toggle-off rule d only applies when the active passenger owns the seat. The walkthrough in section 8.4 shows both paths: select Passenger 1 first, or use the ✕ on their row.

**Why does `useSeatClick` compute the outcome before dispatching, and the reducer compute it again?**
The reducer is the authority, and it must stay pure, so it cannot hand a message back to the caller. The hook calls the same pure function on the current state to get the message for the toast. Both calls see the same state, so they agree. The trade-off is that two clicks inside one render would both read the older state for their toast text; the state itself stays correct because the reducer always works on the latest state.

**What happens to seats when the layout changes, and why?**
`SET_LAYOUT` clears every `seatId`, drops the seats and goes back to `loading`. Seat ids are not portable (the 3-2 layout has no column F, and categories differ), so keeping old assignments could point at seats that do not exist or have another price. Names, meals, the passenger count and the active passenger are kept. The UI asks for confirmation first if anything is seated.

**What does a blocked click do to React rendering?**
The reducer returns the same state object, so `useReducer` bails out and nothing re-renders from state. Only the toast changes, because that lives in a separate provider.

**Why is `page.tsx` a server component when almost everything else is client-side?**
It only composes the page, so it needs no state. The client boundary starts at `AppProviders`, which keeps the server-rendered shell small. The initial state is deterministic (`createLoadingState`, a seeded hash for occupancy), so the server HTML and the first client render match.

**How would you connect this to a real backend?**
Replace `fetchSeatMap` with a real request; the reducer already models `loading` / `ready` / `error` and ignores stale answers, so the rest stays as it is. Seat assignment would also need a server-side hold or conflict check, because two users could pick the same seat, and the reducer's no-double-booking guarantee only covers one browser session.

**What would you test next?**
Component tests for the dialogs and the seat map interactions (React Testing Library) and an end-to-end run of the happy path (Playwright). The business rules already sit in pure functions, so they are covered by plain unit tests with no DOM.

**Why does "Start over" ask even when no seat is chosen?**
Resetting also drops extra passengers, their names and their meals. `hasBookingProgress` (a selector) reports whether anything differs from a fresh booking, so the confirmation appears exactly when work would be lost, and an untouched booking resets without a pointless dialog.

**Why are the exit rows part of `LayoutConfig`?**
They used to be listed twice: once for drawing the EXIT strip and once (as a hard-coded row number) for extra-legroom pricing. A layout that moved its exit would have shown the strip on one row and charged the legroom price on another. With `exitRows` on the layout, both read the same data, and each layout can have its own exits.

**How do you avoid losing keyboard focus when a control removes itself?**
`useFocusAfterRender` returns a ref and `requestFocus()`. The handler (✕ remove seat, Enter / Esc in the name input) calls `requestFocus()` before dispatching; after the re-render an effect focuses the row button. A blur commit does not request focus, because the user already moved it somewhere on purpose.
