import type { ReactNode } from 'react';

type CardVendor = {
  name: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  isDemo: boolean;
};

// Photo and name, shared by the results page and the vendors pages. Each page
// passes its own price line as children.
export default function VendorCard({ vendor, children }: { vendor: CardVendor; children?: ReactNode }) {
  const body = (
    <>
      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-surface">
        {vendor.imageUrl && <img src={vendor.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
        {vendor.isDemo && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-canvas/90 px-2 py-0.5 text-[11px] tracking-[0.06em] text-ink-muted uppercase">
            Demo
          </span>
        )}
      </div>
      <p className="mt-3 mb-0 font-serif text-[17px]">{vendor.name}</p>
      {children}
    </>
  );

  // Demo vendors have no website yet, so only real ones are links.
  return vendor.websiteUrl ? (
    <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer" className="block text-inherit no-underline">
      {body}
    </a>
  ) : (
    body
  );
}

// The empty card shown while vendors load, so nothing jumps when they arrive.
export function VendorCardSkeleton() {
  return (
    <>
      <div className="aspect-4/3 rounded-lg bg-surface" />
      <div className="mt-3 h-[17px] w-2/3 rounded bg-surface" />
      <div className="mt-2 h-[14px] w-1/2 rounded bg-surface" />
    </>
  );
}
