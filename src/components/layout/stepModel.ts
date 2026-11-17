import type { MainView, ReviewStage } from '@/context/ViewContext';

export type StepId = 'travellers' | 'seats' | 'meals' | 'review';
export type StepStatus = 'done' | 'current' | 'upcoming';

export interface BookingStep {
  id: StepId;
  label: string;
  /** 1-based position shown in the circle. */
  number: number;
  status: StepStatus;
  /** The view this step opens; steps without one are not clickable. */
  view: MainView | null;
  /** A finished step the user can go back to (done and has a view). */
  isRevisitable: boolean;
}

const STEP_DEFINITIONS: readonly Omit<BookingStep, 'status' | 'isRevisitable'>[] = [
  { id: 'travellers', label: 'Travellers', number: 1, view: null },
  { id: 'seats', label: 'Seats', number: 2, view: 'seats' },
  { id: 'meals', label: 'Meals', number: 3, view: 'meals' },
  { id: 'review', label: 'Review', number: 4, view: null },
];

/** The two steps the user can switch between. */
export const SWITCHABLE_VIEWS: readonly MainView[] = ['seats', 'meals'];

export const TOTAL_STEPS = STEP_DEFINITIONS.length;

const CURRENT_STEP_ID: Record<MainView, StepId> = {
  seats: 'seats',
  meals: 'meals',
};

/**
 * Every step with its status: earlier = done, later = upcoming. While the review
 * modal is open Review is current; after Confirm every step is done.
 */
export function getBookingSteps(
  view: MainView,
  reviewStage: ReviewStage = 'closed',
): BookingStep[] {
  const currentId: StepId = reviewStage === 'closed' ? CURRENT_STEP_ID[view] : 'review';
  const currentIndex =
    reviewStage === 'confirmed'
      ? STEP_DEFINITIONS.length
      : STEP_DEFINITIONS.findIndex((step) => step.id === currentId);
  return STEP_DEFINITIONS.map((step, index) => {
    const status: StepStatus =
      index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
    return { ...step, status, isRevisitable: status === 'done' && step.view !== null };
  });
}

/** The step being worked on, e.g. { number: 2, label: "Seats" }; the last step once everything is done. */
export function getCurrentStep(
  view: MainView,
  reviewStage: ReviewStage = 'closed',
): BookingStep {
  const steps = getBookingSteps(view, reviewStage);
  const step = steps.find((s) => s.status === 'current') ?? steps[steps.length - 1];
  return step;
}

/** The other switchable view (Seats <-> Meals), used by arrow-key switching. */
export function getOtherView(view: MainView): MainView {
  return view === 'seats' ? 'meals' : 'seats';
}
