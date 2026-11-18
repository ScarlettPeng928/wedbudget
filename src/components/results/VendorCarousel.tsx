import { useEffect, useRef, useState } from 'react';
import type { Vendor } from '../../api/vendors';
import { formatNT } from '../../lib/format';
import VendorCard, { VendorCardSkeleton } from '../VendorCard';

// Card width: most of the screen on phones (the next card peeks in), three per row from sm up.
const CARD = 'w-[min(70vw,260px)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)]';

function ArrowButton({ label, direction, disabled, onClick }: { label: string; direction: -1 | 1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-plum text-plum transition-colors hover:bg-plum hover:text-cream disabled:cursor-default disabled:border-sand disabled:bg-transparent disabled:text-sand"
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d={direction === -1 ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} />
      </svg>
    </button>
  );
}

// One category's vendors as a horizontal row, with arrows to page through it.
// `amount` is the category's current allocation; it updates as the sliders move.
// `vendors` is null until the first answer arrives from the backend.
// `updating`: the amount changed and the new vendors are on their way.
export default function VendorCarousel({
  slug,
  title,
  amount,
  vendors,
  updating = false,
}: {
  slug: string;
  title: string;
  amount: number;
  vendors: Vendor[] | null;
  updating?: boolean;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Keep the arrows' disabled state in sync with the scroll position. Re-checked
  // when the vendors change, since a different number of cards changes the width.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 1);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [vendors]);

  const scroll = (direction: -1 | 1) => {
    const el = track.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const headingId = `vendors-${slug}`;
  const empty = vendors !== null && vendors.length === 0;

  return (
    // scroll-mt: when the page scrolls to this row, stop below the fixed header.
    <section aria-labelledby={headingId} className="scroll-mt-[calc(clamp(64px,6vw,88px)+24px)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 id={headingId} className="m-0 font-serif text-[clamp(20px,1.7vw,26px)] font-light">
            {title}
          </h3>
          <p className="m-0 text-[15px] text-cocoa tabular-nums">{formatNT(amount)}</p>
        </div>
        {/* Phones swipe the row instead. No arrows when there is nothing to page through. */}
        {!empty && (
          <div className="hidden shrink-0 gap-2 sm:flex">
            <ArrowButton label={`Previous ${title} vendors`} direction={-1} disabled={atStart} onClick={() => scroll(-1)} />
            <ArrowButton label={`Next ${title} vendors`} direction={1} disabled={atEnd} onClick={() => scroll(1)} />
          </div>
        )}
      </div>

      {/* Fades while updating, so even an unchanged row shows it was checked again. */}
      {/* relative: the cards' sr-only text is absolutely positioned; without a positioned
          scroll container it escapes the row and widens the whole page on phones. */}
      {empty ? (
        <p
          aria-busy={updating}
          className={`m-0 rounded-lg border border-dashed border-sand px-5 py-8 text-center text-[15px] text-cocoa transition-opacity duration-200 ${updating ? 'opacity-40' : ''}`}
        >
          No vendors in this budget yet.
        </p>
      ) : (
        <ul
          ref={track}
          aria-busy={vendors === null || updating}
          className={`relative m-0 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto p-0 transition-opacity duration-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${updating ? 'opacity-40' : ''}`}
        >
          {vendors === null
            ? // First load: empty cards hold the space, so nothing jumps when vendors arrive.
              [0, 1, 2].map((i) => (
                <li key={i} className={CARD} aria-hidden="true">
                  <VendorCardSkeleton />
                </li>
              ))
            : vendors.map((vendor) => (
                <li key={vendor.id} className={CARD}>
                  <VendorCard vendor={vendor} category={slug}>
                    {/* No city here: every vendor on the page is in the plan's city, named in the headline. */}
                    <p className="mt-1 mb-0 text-[14px] text-cocoa tabular-nums">
                      <span className="sr-only">Estimated total </span>
                      {formatNT(vendor.estimatedCost)}
                    </p>
                  </VendorCard>
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}
