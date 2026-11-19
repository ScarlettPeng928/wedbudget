import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { planCategories } from '../data/planCategories';
import { formatPriceRange } from '../lib/format';
import { vendorHref, vendorLinkNote } from '../lib/vendorLinks';
import { toggleSaved, useVendorPicks } from '../lib/vendorPicks';
import { useVisits } from '../lib/visits';
import { hasUpcomingVisit } from '../lib/calendar';

function BookmarkIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

// The bookmark in the header: the count of saved vendors, and a small panel to glance
// at them, remove one, or go on to the saved page. Saved photos fly into it
// (see flyToSaved in VendorCard), marked by data-saved-target.
export default function SavedPeek({ onDark }: { onDark: boolean }) {
  const picks = useVendorPicks();
  const visits = useVisits();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const { pathname } = useLocation();
  const groups = planCategories.filter((c) => picks[c.slug]?.saved.length);
  const count = groups.reduce((sum, c) => sum + picks[c.slug].saved.length, 0);

  // A new page closes the panel.
  useEffect(() => setOpen(false), [pathname]);

  // Close on a click outside, or Escape (focus back on the bookmark).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        ref={button}
        type="button"
        data-saved-target
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={count > 0 ? `Saved vendors, ${count}` : 'Saved vendors'}
        className={`relative flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors ${
          onDark ? 'text-sand hover:bg-sand/15' : 'text-plum hover:bg-plum/10'
        }`}
      >
        <BookmarkIcon className="size-[22px]" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rosewood px-1 font-sans text-label leading-none font-medium text-cream tabular-nums"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute top-full right-0 z-50 mt-2 flex max-h-[calc(100svh-clamp(64px,6vw,88px)-24px)] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-xl border border-sand bg-cream text-plum shadow-[0_16px_40px_rgb(0_0_0/0.12)]"
        >
          <p className="m-0 border-b border-sand px-4 py-3 font-sans text-label tracking-[0.05em] text-cocoa uppercase">
            Saved vendors{count > 0 && <span className="tabular-nums"> · {count}</span>}
          </p>

          {count === 0 ? (
            <p className="m-0 px-4 py-6 text-body text-cocoa">Nothing saved yet.</p>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              {groups.map((category) => (
                <section key={category.slug} aria-label={category.name} className="py-2">
                  <h3 className="m-0 mb-1.5 font-sans text-small font-normal text-cocoa">{category.name}</h3>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {picks[category.slug].saved.map((vendor) => (
                      <li key={vendor.id} className="flex items-center gap-3">
                        {/* Photo and name link like the vendor's card (lib/vendorLinks); the
                            photo's link is skipped by the keyboard and screen readers. */}
                        <a
                          href={vendorHref(vendor, category.slug) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={-1}
                          aria-hidden="true"
                          className="aspect-4/3 w-12 shrink-0 overflow-hidden rounded-md bg-linen"
                        >
                          {vendor.imageUrl && <img src={vendor.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                        </a>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 truncate font-serif text-body">
                            <a
                              href={vendorHref(vendor, category.slug) ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-plum no-underline decoration-rosewood decoration-1 underline-offset-[0.2em] hover:underline"
                            >
                              {vendor.name}
                              <span className="sr-only">{vendorLinkNote(vendor)}</span>
                            </a>
                          </p>
                          <p className="m-0 truncate text-small text-plum tabular-nums">
                            {formatPriceRange(vendor.priceMin, vendor.priceMax, vendor.priceUnit)}
                          </p>
                        </div>
                        {/* No remove while a visit is arranged (see hasUpcomingVisit). */}
                        {hasUpcomingVisit(visits, category.slug, vendor.id) ? (
                          <span className="size-8 shrink-0" aria-hidden="true" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleSaved(category.slug, vendor)}
                            aria-label={`Remove ${vendor.name}`}
                            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-cocoa hover:bg-linen hover:text-plum"
                          >
                            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                              <path d="M4 4l8 8M12 4l-8 8" />
                            </svg>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="border-t border-sand p-3">
            <Link
              to="/saved"
              className="flex w-full items-center justify-center rounded-lg bg-rosewood px-4 py-2.5 font-sans text-label font-medium tracking-[0.05em] text-cream uppercase no-underline transition-colors hover:bg-plum"
            >
              View all saved
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
