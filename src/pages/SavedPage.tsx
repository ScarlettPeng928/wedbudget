import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import VisitDialog from '../components/saved/VisitDialog';
import type { VisitVendor } from '../components/saved/VisitForm';
import VisitLine from '../components/saved/VisitLine';
import VisitCard from '../components/saved/VisitCard';
import { planCategories, type PlanCategory } from '../data/planCategories';
import { isUpcoming } from '../lib/calendar';
import { formatNT, formatPriceRange } from '../lib/format';
import { loadPlan } from '../lib/savedPlan';
import { cityName } from '../data/cities';
import { toggleSaved, useVendorPicks, type PickVendor } from '../lib/vendorPicks';
import { useVisits, type Visit } from '../lib/visits';
import { BAND, BAND_INNER, HEADER_HEIGHT, NARROW_WIDTH } from '../components/toolLayout';
import type { SavedPlan } from '../lib/savedPlan';

const HEADER = HEADER_HEIGHT;

const linkClass =
  'inline-flex items-center gap-1 text-body text-plum underline decoration-rosewood decoration-1 underline-offset-[0.2em] hover:decoration-plum';

// The visit window, when open: a new visit with a vendor, or a change to one visit.
type OpenForm = { category: string; vendor: VisitVendor; visit?: Visit } | null;

// A visit's vendor, from what the visit keeps (it may no longer be saved).
const vendorOf = (v: Visit): VisitVendor => ({ id: v.vendorId, name: v.vendorName, cityName: v.cityName });

function ArrowRight() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function VendorRow({
  category,
  vendor,
  visits,
  setForm,
}: {
  category: string;
  vendor: PickVendor;
  visits: Visit[];
  setForm: (form: OpenForm) => void;
}) {
  // Once a visit is arranged the vendor is locked: no Schedule a visit (nothing to
  // schedule) and no remove (see hasUpcomingVisit). Both come back when the visit is
  // deleted or has passed, for a next one (a tasting after the viewing).
  const hasUpcoming = visits.some(isUpcoming);
  return (
    <li className="border-t border-sand py-4">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <div className="aspect-4/3 w-16 shrink-0 overflow-hidden rounded-md bg-linen sm:w-20">
          {vendor.imageUrl && <img src={vendor.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="m-0 truncate font-serif text-body">{vendor.name}</p>
            <p className="m-0 mt-0.5 text-small tabular-nums">
              <span className="text-plum">{formatPriceRange(vendor.priceMin, vendor.priceMax, vendor.priceUnit)}</span>
              {vendor.cityName && <span className="text-cocoa"> · {vendor.cityName}</span>}
            </p>
          </div>
          {!hasUpcoming && (
            <button
              type="button"
              onClick={() => setForm({ category, vendor })}
              className="inline-flex shrink-0 cursor-pointer items-center self-start rounded-lg border border-plum bg-transparent px-3 py-1.5 font-sans text-label tracking-[0.05em] text-plum uppercase transition-colors hover:bg-plum hover:text-cream sm:self-auto"
            >
              Schedule a visit
              <span className="sr-only"> with {vendor.name}</span>
            </button>
          )}
        </div>
        {hasUpcoming ? (
          // Keeps the row's right edge where the remove button would be.
          <span className="size-8 shrink-0" aria-hidden="true" />
        ) : (
          <button
            type="button"
            onClick={() => toggleSaved(category, vendor)}
            aria-label={`Remove ${vendor.name}`}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-cocoa hover:bg-linen hover:text-plum"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>

      {/* Visits with this vendor, as quiet lines under its name (actions are on the cards). */}
      {visits.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 pl-[76px] sm:pl-24">
          {visits.map((visit) => (
            <VisitLine key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </li>
  );
}

function CategorySection({
  category,
  budget,
  findHref,
  vendors,
  visits,
  setForm,
}: {
  category: PlanCategory;
  // The couple's own budget for this category, from their plan (not a vendor price).
  budget?: number;
  // Where "Find vendors" goes: the vendors page, filtered to the plan when there is one.
  findHref: string;
  vendors: PickVendor[];
  visits: Visit[];
  setForm: (form: OpenForm) => void;
}) {
  return (
    <section id={category.slug} aria-labelledby={`${category.slug}-heading`} style={{ scrollMarginTop: `calc(${HEADER} + 24px)` }}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-3">
        <h2 id={`${category.slug}-heading`} className="m-0 font-sans text-lead font-normal">
          {category.name}
        </h2>
        {budget !== undefined && <p className="m-0 text-body text-cocoa tabular-nums">{formatNT(budget)} budget</p>}
      </div>
      {/* Saved vendors to compare and visit; an empty category is a gap still to fill,
          with the one thing to do there. */}
      {vendors.length > 0 ? (
        <ul className="m-0 list-none border-b border-sand p-0">
          {vendors.map((vendor) => (
            <VendorRow
              key={vendor.id}
              category={category.slug}
              vendor={vendor}
              visits={visits.filter((v) => v.category === category.slug && v.vendorId === vendor.id)}
              setForm={setForm}
            />
          ))}
        </ul>
      ) : (
        <div className="border-t border-sand pt-4">
          <Link to={findHref} className={linkClass}>
            Find vendors
            <span className="sr-only"> for {category.name}</span>
            <ArrowRight />
          </Link>
        </div>
      )}
    </section>
  );
}

// The vendors page for a category, filtered like See all on the plan page: the
// plan's city, this category's budget and the guest count.
function findHref(slug: string, plan: SavedPlan | null) {
  return plan
    ? `/vendors/${slug}?city=${plan.request.city}&budget=${plan.allocations[slug] ?? 0}&guests=${plan.request.guestCount}`
    : `/vendors/${slug}`;
}

// /saved: the title and the plan on a linen band, as on the plan page; then the
// upcoming visits and the saved vendors, category by category.
export default function SavedPage() {
  const plan = loadPlan();
  const picks = useVendorPicks();
  const visits = useVisits();
  const [form, setForm] = useState<OpenForm>(null);
  const { hash } = useLocation();
  // Visits still ahead (or under way), soonest first; the list is kept in time order.
  const upcoming = visits.filter(isUpcoming);

  useEffect(() => {
    document.title = 'Saved vendors · WedBudget';
    // Coming from a category on the results page: open on that category.
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <>
      <SiteHeader />
      <main className="pb-[clamp(64px,8vw,120px)]" style={{ paddingTop: HEADER }}>
        <header className={BAND}>
          <div className={BAND_INNER}>
            <h1 className="m-0 font-serif text-title font-light">Saved vendors</h1>
            {/* The plan in one line: what vendors ask first when the couple gets in touch. */}
            {plan && (
              <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <p className="m-0 text-body text-cocoa tabular-nums">
                  {formatNT(plan.request.totalBudget)} · {cityName(plan.request.city)} · {plan.request.guestCount.toLocaleString('en-US')}{' '}
                  {plan.request.guestCount === 1 ? 'guest' : 'guests'}
                </p>
                <Link to="/plan" className={linkClass}>
                  Edit plan
                  <ArrowRight />
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* A single column of rows: narrower than the page, centred. */}
        <div className={NARROW_WIDTH}>
          <div>
            {upcoming.length > 0 && (
              <section aria-labelledby="upcoming-heading" className="mt-[clamp(32px,4vw,56px)]">
                <h2 id="upcoming-heading" className="m-0 font-serif text-heading font-light">
                  Upcoming visits
                </h2>
                <ul className="m-0 mt-4 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((visit, i) => (
                    <li key={visit.id}>
                      <VisitCard visit={visit} next={i === 0} onEdit={() => setForm({ category: visit.category, vendor: vendorOf(visit), visit })} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-[clamp(40px,5vw,72px)] flex flex-col gap-[clamp(40px,5vw,64px)]">
              {planCategories.map((category) => (
                <CategorySection
                  key={category.slug}
                  category={category}
                  budget={plan?.allocations[category.slug]}
                  findHref={findHref(category.slug, plan)}
                  vendors={picks[category.slug]?.saved ?? []}
                  visits={visits}
                  setForm={setForm}
                />
              ))}
            </div>
          </div>
        </div>

        {form && (
          <VisitDialog
            key={form.visit?.id ?? `new-${form.category}-${form.vendor.id}`}
            category={form.category}
            vendor={form.vendor}
            visit={form.visit}
            onClose={() => setForm(null)}
          />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
