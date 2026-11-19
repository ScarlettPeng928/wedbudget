import { useRef, type ReactNode, type RefObject } from 'react';
import { flyToSaved } from '../animations/flyToSaved';
import { vendorHref, vendorLinkNote } from '../lib/vendorLinks';
import { isSaved, toggleSaved, useVendorPicks, type PickVendor } from '../lib/vendorPicks';
import { useVisits } from '../lib/visits';
import { hasUpcomingVisit } from '../lib/calendar';

type CardVendor = PickVendor & {
  imageUrl: string | null;
  websiteUrl: string | null;
  isDemo: boolean;
  city?: { name: string };
};

// Photo, then the name with the bookmark on its right, shared by the plan page and
// the vendors pages. Each page passes its own price line as children. Without
// `category` there's no bookmark. Hovering the card slowly zooms the photo.
export default function VendorCard({ vendor, category, children }: { vendor: CardVendor; category?: string; children?: ReactNode }) {
  // The photo, which flies to the header's bookmark when the vendor is saved.
  const photo = useRef<HTMLDivElement>(null);

  // The vendor's own website, or else a map search (lib/vendorLinks). The photo and the name
  // each link there (the bookmark sits between them in the layout, and a button
  // inside a link is invalid HTML); the photo's link is skipped by the keyboard and
  // screen readers so the vendor isn't announced twice.
  const href = vendorHref({ websiteUrl: vendor.websiteUrl, cityName: vendor.city?.name }, category);
  const link = (content: ReactNode, secondary = false) =>
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={secondary ? -1 : undefined}
        aria-hidden={secondary || undefined}
        className="block text-inherit no-underline"
      >
        {content}
      </a>
    ) : (
      content
    );

  return (
    <div className="group/card">
      {link(
        <div ref={photo} className="relative aspect-4/3 overflow-hidden rounded-lg bg-linen">
          {vendor.imageUrl && (
            <img
              src={vendor.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-108 motion-reduce:transition-none motion-reduce:group-hover/card:scale-100"
            />
          )}
          {vendor.isDemo && (
            <span className="absolute top-2.5 left-2.5 rounded-md bg-cream/90 px-2 py-0.5 text-label tracking-[0.06em] text-cocoa uppercase">
              Demo
            </span>
          )}
        </div>,
        true,
      )}
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {link(
            <p className="m-0 font-serif text-body">
              {vendor.name}
              {/* Opens another site in a new tab: screen readers hear where it goes. */}
              {href && (
                <>
                  <span className="sr-only">{vendorLinkNote(vendor)}</span>
                </>
              )}
            </p>,
          )}
        </div>
        {category && <SaveButton category={category} vendor={vendor} photo={photo} />}
      </div>
      {children}
    </div>
  );
}

// The bookmark beside the name: outlined to save, filled once saved. The icon is
// small, but the button around it is 36px so it's easy to hit on a phone; negative
// margins keep it lined up with the name and the card's right edge.
// Saving sends the photo flying to the header; un-saving just empties the bookmark.
function SaveButton({ category, vendor, photo }: { category: string; vendor: CardVendor; photo: RefObject<HTMLDivElement | null> }) {
  const saved = isSaved(useVendorPicks(), category, vendor.id);
  // Saved with a visit arranged: stays saved (see hasUpcomingVisit), so the bookmark
  // shows filled but does nothing.
  // Hooks run on every render, so visits are read before the condition.
  const visits = useVisits();
  const locked = saved && hasUpcomingVisit(visits, category, vendor.id);
  return (
    <button
      type="button"
      onClick={() => {
        if (locked) return;
        if (!saved && photo.current) flyToSaved(photo.current);
        toggleSaved(category, { ...vendor, cityName: vendor.city?.name });
      }}
      aria-pressed={saved}
      aria-disabled={locked || undefined}
      aria-label={`Save ${vendor.name}`}
      className={`-mt-1.5 -mr-2 flex size-9 shrink-0 items-center justify-center border-0 bg-transparent p-0 transition-[color,transform] duration-150 ease-out motion-reduce:transition-none ${
        locked
          ? 'cursor-default text-rosewood'
          : saved
            ? 'cursor-pointer text-rosewood active:scale-90'
            : 'cursor-pointer text-cocoa hover:text-plum active:scale-90'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`size-5 ${saved ? 'fill-rosewood' : 'fill-transparent'}`}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
      </svg>
    </button>
  );
}

// The empty card shown while vendors load, so nothing jumps when they arrive.
export function VendorCardSkeleton() {
  return (
    <>
      <div className="aspect-4/3 rounded-lg bg-linen" />
      <div className="mt-3 h-[17px] w-2/3 rounded-sm bg-linen" />
      <div className="mt-2 h-[14px] w-1/2 rounded-sm bg-linen" />
    </>
  );
}
