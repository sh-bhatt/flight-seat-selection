const TAG_CLASSES =
  'absolute top-0 z-10 rounded bg-danger-soft px-2 py-0.5 text-[10px] leading-none font-bold text-danger';

/**
 * Emergency exit marker above an exit row: a row as wide as the fuselage with
 * red tags poking out of both sides. The first exit row also anchors the wings
 * (swept shapes outside the fuselage, hidden below 640px and whenever the cabin box is too narrow for them).
 * Decorative only.
 */
export function ExitRow({ withWings }: { withWings: boolean }) {
  return (
    <div
      aria-hidden="true"
      // Reaches the fuselage's outer edge: its padding (--inset) plus the 1.5px border.
      className="relative mx-[calc((var(--inset)+1.5px)*-1)] h-5"
    >
      <span className={`${TAG_CLASSES} left-0 sm:-left-3`}>◂ EXIT</span>
      <span className={`${TAG_CLASSES} right-0 sm:-right-3`}>EXIT ▸</span>
      {withWings && (
        <>
          <span className="absolute top-[-24px] right-full hidden h-[250px] w-24 bg-wing [clip-path:polygon(100%_0%,100%_62%,6%_100%,0%_88%)] sm:group-data-[wings=on]/cabin:block" />
          <span className="absolute top-[-24px] left-full hidden h-[250px] w-24 bg-wing [clip-path:polygon(0%_0%,0%_62%,94%_100%,100%_88%)] sm:group-data-[wings=on]/cabin:block" />
        </>
      )}
    </div>
  );
}
