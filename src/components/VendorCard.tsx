import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { toggleSaved, useVendorPicks, type PickVendor } from '../lib/vendorPicks';

type CardVendor = PickVendor & {
  imageUrl: string | null;
  websiteUrl: string | null;
  isDemo: boolean;
};

// Photo and name, shared by the results page and the vendors pages. Each page
// passes its own price line as children. With `category`, the card also gets a
// Save button that adds this vendor to that category's shortlist.
export default function VendorCard({ vendor, category, children }: { vendor: CardVendor; category?: string; children?: ReactNode }) {
  const body = (
    <>
      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-linen">
        {vendor.imageUrl && <img src={vendor.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
        {vendor.isDemo && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-cream/90 px-2 py-0.5 text-[11px] tracking-[0.06em] text-cocoa uppercase">
            Demo
          </span>
        )}
      </div>
      <p className="mt-3 mb-0 font-serif text-[17px]">{vendor.name}</p>
      {children}
    </>
  );

  return (
    <div>
      {/* Demo vendors have no website yet, so only real ones are links. The button
          sits outside the link: a button inside a link is invalid HTML. */}
      {vendor.websiteUrl ? (
        <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer" className="block text-inherit no-underline">
          {body}
        </a>
      ) : (
        body
      )}
      {category && <SaveButton category={category} vendor={vendor} />}
    </div>
  );
}

function SaveButton({ category, vendor }: { category: string; vendor: PickVendor }) {
  const picks = useVendorPicks()[category];
  const saved = picks?.saved.some((v) => v.id === vendor.id) ?? false;
  const booked = saved && picks?.bookedId === vendor.id;
  const check = (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 8.5l3.2 3L13 4.5" />
    </svg>
  );
  // A booked vendor may carry a quote, so one tap here mustn't drop it: the card
  // links to the shortlist instead, where booking and removing happen.
  if (booked) {
    return (
      <Link
        to={`/shortlist#${category}`}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-plum bg-plum px-3 py-1.5 font-sans text-label tracking-[0.05em] text-cream uppercase no-underline transition-colors hover:bg-plum/85"
      >
        {check}
        Booked
        <span className="sr-only"> {vendor.name}, open shortlist</span>
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => toggleSaved(category, vendor)}
      aria-pressed={saved}
      className={`mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 font-sans text-label tracking-[0.05em] uppercase transition-colors ${
        saved ? 'border-plum bg-plum text-cream hover:bg-plum/85' : 'border-plum bg-transparent text-plum hover:bg-plum hover:text-cream'
      }`}
    >
      {saved && check}
      {saved ? 'Saved' : 'Save'}
      {/* Screen readers hear which vendor each button is for. */}
      <span className="sr-only"> {vendor.name}</span>
    </button>
  );
}

// The empty card shown while vendors load, so nothing jumps when they arrive.
export function VendorCardSkeleton() {
  return (
    <>
      <div className="aspect-4/3 rounded-lg bg-linen" />
      <div className="mt-3 h-[17px] w-2/3 rounded bg-linen" />
      <div className="mt-2 h-[14px] w-1/2 rounded bg-linen" />
    </>
  );
}
