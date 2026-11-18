import { useEffect, useId, useRef } from 'react';
import VisitForm, { type VisitVendor } from './VisitForm';
import type { Visit } from '../../lib/visits';

// The visit form in a pop-up window. A native <dialog> opened with showModal()
// brings what a modal needs: the page behind can't be clicked or tabbed into,
// Escape closes it, and focus returns to the button that opened it.
export default function VisitDialog({
  category,
  vendor,
  visit,
  onClose,
}: {
  category: string;
  vendor: VisitVendor;
  visit?: Visit;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    // Guarded: React's development mode runs this twice.
    if (!el.open) el.showModal();
    // Straight into the date, the first thing to fill in.
    el.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    // The page behind stays put while the window is open.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      // Fires however it closes (Escape, Cancel, Save, the backdrop), so the page
      // always hears about it.
      onClose={onClose}
      // A click on the dimmed backdrop lands on the <dialog> itself, outside the panel.
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[560px] overflow-visible rounded-xl border-0 bg-cream p-0 text-plum shadow-[0_24px_64px_rgb(0_0_0/0.18)] backdrop:bg-cocoa/30 backdrop:backdrop-blur-sm"
    >
      <div className="p-[clamp(20px,3vw,32px)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="m-0 font-serif text-heading font-light">
              {visit ? 'Change visit' : 'Schedule a visit'}
            </h2>
            {/* Vendor name and city, styled as everywhere else (docs/typography.md §7). */}
            <p className="m-0 mt-1 truncate">
              <span className="font-serif text-body text-plum">{vendor.name}</span>
              {vendor.cityName && <span className="text-small text-cocoa"> · {vendor.cityName}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mt-1 -mr-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-cocoa hover:bg-linen hover:text-plum"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <VisitForm category={category} vendor={vendor} visit={visit} onDone={close} />
      </div>
    </dialog>
  );
}
