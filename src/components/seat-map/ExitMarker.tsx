/** Emergency exit door indicator, drawn across the cabin above an exit row. */
export function ExitMarker() {
  return (
    <div
      aria-hidden="true"
      className="my-1 flex items-center gap-2 text-[10px] font-bold tracking-widest text-exit"
    >
      <span>EXIT</span>
      <span className="h-px flex-1 border-t border-dashed border-exit/60" />
      <span>EXIT</span>
    </div>
  );
}
