# Flight Seat Selection & Passenger Management

A single-page flight booking flow: add up to six passengers, pick seats on a 3-2 or 2-3-2 aircraft, choose meals, and watch the price summary update live.

- **Live demo:** LIVE_URL
- **Screenshot:** SCREENSHOT_PLACEHOLDER

All data is mocked and deterministic; there is no backend.

## Features

- [x] **Passenger selection** — 1 to 6 passengers, inline rename, switch the active passenger, remove a seat, confirmation before dropping seated passengers
- [x] **Two cabin layouts** — 3-2 (narrow-body) and 2-3-2 (wide-body), switchable at runtime; the seat map is generated from layout data, so a new layout is configuration only
- [x] **Seat states** — available, occupied, selected by the active passenger, selected by another passenger; distinguishable by shape and glyph as well as colour
- [x] **Seat pricing** — Standard, Premium and Extra legroom categories with INR prices (see [Pricing rules](#pricing-rules))
- [x] **Live totals** — per-passenger lines, seats subtotal, meals subtotal and grand total, all derived from state
- [x] **Meal selection (bonus)** — six veg / non-veg options, free and paid, one per passenger, included in the total
- [x] **Responsive** — works from 320px to wide desktop; phones get passenger chips, a bottom summary bar with a details sheet, and a horizontally scrollable cabin
- [x] **Loading, error and empty states** — skeleton cabin while the seat map loads, an error card with Retry, and an empty summary until something is selected
- [x] **Accessibility** — real buttons with descriptive labels, roving-tabindex keyboard navigation, visible focus rings, native `<dialog>` modals, reduced-motion support
- [x] **Unit tests** — reducer rules, selectors, step model, keyboard navigation, mock API

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript, strict mode, no `any` |
| Styling | Tailwind CSS 4 with CSS-variable design tokens |
| State | React Context + `useReducer` (no external state library) |
| Formatting | `Intl.NumberFormat('en-IN')`, currency INR (₹) |
| Tests | Vitest |

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (Vitest)
npm run build    # production build
npm start        # serve the production build
```

`npm run lint` runs ESLint.

## Project structure

```
src/
  app/          Page, layout, global styles and design tokens
  components/
    layout/     Site header, flight strip, step indicator, main area
    passengers/ Travellers panel, count stepper, rows, chips
    seat-map/   Cabin, seats, legend, layout toggle, hover card
    meals/      Meal picker
    summary/    Price summary, mobile bar, review dialog
    ui/         Button, modal, toast and other primitives
  context/      BookingContext (state + dispatch), ViewContext (open step)
  state/        bookingReducer (all rules) and selectors (derived data)
  data/         Layouts, pricing, meals, flight, mock API
  lib/          Seat map generator (and seat id format), currency, count, name and initials helpers
  hooks/        useSeatMap and small UI hooks
  types/        Shared domain types
```

## State management

**Why Context + `useReducer`.** The state is small, lives on one page and has real business rules. A reducer gives pure, easily tested transitions and keeps every rule in one place, away from components. Context is enough to share it, so no external library is needed. State and dispatch are provided through two separate contexts, so components that only dispatch actions do not re-render when state changes.

**State shape** (`BookingState`):

```ts
{
  layoutId: '3-2' | '2-3-2';
  seats: Seat[];                        // empty until the seat map has loaded
  seatMapStatus: 'loading' | 'ready' | 'error';
  passengers: { id, name, seatId: string | null, mealId: string | null }[];
  activePassengerId: string | null;
}
```

Which step is open (Seats or Meals) and the review dialog are UI-only and live in a small `ViewContext`, not in the reducer.

**Actions:**

| Action | Effect |
|---|---|
| `SET_PASSENGER_COUNT` | Clamp to 1–6; add or drop passengers from the end |
| `SET_ACTIVE_PASSENGER` | Choose who the next seat click is for |
| `RENAME_PASSENGER` | Trim, cap at 30 characters, empty falls back to "Passenger N" |
| `SET_LAYOUT` | Switch layout, clear all seat assignments, reload seats |
| `SEATS_LOADED` / `SEATS_FAILED` | Result of the seat map request (ignored if stale) |
| `RETRY_SEATS` | Try the request again after a failure |
| `SEAT_CLICKED` | Apply the seat assignment rules |
| `REMOVE_SEAT` | Release a passenger's seat (no-op if they have none) |
| `SELECT_MEAL` | Set, replace or clear a passenger's meal |
| `RESET` | Back to one passenger on the default layout ("Start over" confirms first whenever passengers, names, seats or meals would be lost) |

**Derived data via selectors.** Seat status (available / occupied / selected by me / selected by someone else), the owner of a seat, per-passenger lines, seat and meal subtotals and the grand total are all computed by pure functions in `src/state/selectors.ts`. None of them is stored. Because totals are recomputed from `passengers` and `seats` on every render, they cannot drift out of sync with the data, and there is no "update the total" step to forget.

## Seat assignment logic

Every seat click is evaluated by one pure function, `getSeatClickOutcome`. The reducer uses it to decide the state change and the UI uses it to build the toast, so the rules exist in exactly one place. In order:

- **a)** **No active passenger** — blocked; nothing changes.
- **b)** **Seat is occupied** — blocked with a message.
- **c)** **Seat belongs to another passenger** — blocked, naming the owner.
- **d)** **Seat belongs to the active passenger** — clicking it again releases it.
- **e)** **Seat is available** — assigned to the active passenger. If they already had a seat, the old one is released and the seat is changed.
- **f)** **Auto-advance** — after a new assignment the active passenger moves to the next passenger without a seat (in order, wrapping). If everyone is seated, it stays. Releasing a seat never advances.

(A guard before these also blocks clicks while the seat map is not loaded, and unknown seat ids are rejected.) Blocked clicks return the same state object, so React skips the re-render.

**No double-booking.** Ownership is stored in one place only: `Passenger.seatId`. The seat-to-passenger lookup is a map derived from that array, never a second copy. A passenger has a single `seatId`, so they can hold at most one seat by construction, and rule c stops anyone taking a seat that already has an owner. In development a check runs after every reducer call and throws if a seat is shared, occupied or unknown.

**Layout switch.** Seat ids differ between layouts, so all seat assignments are cleared. If any passenger is seated, a confirmation dialog states how many selections will be lost. The map then shows its loading skeleton while the new layout loads. Names, meals and the passenger count are kept. A slow response for a layout the user has already left is ignored.

**Passenger count change.** Growing adds "Passenger N" entries. If the active passenger already has a seat, the first new passenger becomes active so the next click seats them instead of moving the seated one. Shrinking removes passengers from the end, and their seats and meals go with them because ownership lives on the passenger; a confirmation appears first if any of them is seated. If the active passenger is removed, the last remaining one becomes active.

## Pricing rules

| Category | Price | Where |
|---|---|---|
| Standard | Free | Default |
| Premium | ₹250 | Rows 2–5, window and aisle seats |
| Extra legroom | ₹350 | Row 1 and the layout's exit rows (row 10) |

- Middle seats in rows 2–5 are Standard.
- Exit rows are configured once per layout (`exitRows` in `src/data/layouts.ts`) and drive both the EXIT markers and the extra-legroom price.
- The 3-2 layout has explicit overrides to match the supplied design: 1A, 1B, 1D, 2B Standard; 1C and 2A Extra legroom; 1E Premium. Overrides win over the row rules and those seats are never occupied.
- About 20% of the remaining seats are occupied, chosen by a seeded hash so server and client render the same map.
- Grand total = sum of seat prices + sum of meal prices.

| Meal | Price |
|---|---|
| No meal | Free |
| Standard Veg Sandwich | Free |
| Fruit & Yogurt Bowl | ₹200 |
| Jain Meal | ₹250 |
| Paneer Tikka Wrap | ₹300 |
| Chicken Biryani (non-veg) | ₹400 |

## Demo tips

- **Error state:** open `http://localhost:3000/?simulateError=1`. Every seat map request fails and the map shows an error with a Retry button. Retry keeps failing while the parameter is present; remove it and reload to see a successful load.
- **Loading state:** the mock request takes about 600 ms, so the skeleton shows on first load and after every layout switch.
- **Try the rules:** seat Passenger 1, then click the same seat for Passenger 2; click an occupied (✕) seat; switch layout with seats assigned; shrink the passenger count while seated.
- **Keyboard:** Tab into the seat map, then use the arrow keys to move between seats and Enter or Space to select.

## Possible future improvements

- Real API for flights and seat availability, with optimistic updates and a hold timer on selected seats
- Persist the selection (URL or local storage) so a refresh keeps it
- Passenger types (adult / child / infant) with seat restrictions near exits
- Seat-together suggestions for groups
- Per-passenger meal preferences and dietary filters
- Component and end-to-end tests (React Testing Library, Playwright)
- Localisation and additional currencies
