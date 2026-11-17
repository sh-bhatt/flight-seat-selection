import { PassengerChips } from '@/components/passengers/PassengerChips';
import { PassengerCountSelector } from '@/components/passengers/PassengerCountSelector';
import { PassengerList } from '@/components/passengers/PassengerList';
import { PassengerProgress } from '@/components/passengers/PassengerProgress';

/** Count stepper, progress and the passenger switcher (cards from md, chips below). */
export function PassengerPanel() {
  return (
    <section
      aria-label="Passengers"
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4"
    >
      <PassengerCountSelector />
      <PassengerProgress />
      <div className="hidden md:block">
        <PassengerList />
      </div>
      <div className="md:hidden">
        <PassengerChips />
      </div>
    </section>
  );
}
