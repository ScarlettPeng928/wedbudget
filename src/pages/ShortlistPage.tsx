import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { LeftOrOver, priceRange, RangeLeftOrOver } from '../components/PriceStatus';
import { planCategories, type PlanCategory } from '../data/planCategories';
import { digitsOnly, formatNT, withCommas } from '../lib/format';
import { loadPlan } from '../lib/savedPlan';
import {
  estimateCost,
  picksSummary,
  setQuote,
  toggleBooked,
  toggleSaved,
  useVendorPicks,
  vendorPrice,
  type CategoryPicks,
  type SavedVendor,
} from '../lib/vendorPicks';

const HEADER = 'clamp(64px,6vw,88px)';

const UNIT_SUFFIX: Record<SavedVendor['priceUnit'], string> = { event: '', table: ' / table', guest: ' / guest' };

// Vendor | Estimate | Quote | Against plan | Book + remove. Phones stack each row instead.
const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,1fr)_9rem_9rem_10rem_9rem] md:items-center md:gap-6';

const linkClass =
  'inline-flex items-center gap-1 text-[15px] text-plum underline decoration-rosewood decoration-1 underline-offset-[0.2em] hover:decoration-plum';

function ArrowRight() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

// One saved vendor. The quote field shows the estimate faintly until a quote is typed in;
// from then on the quote is the price everything is planned with.
function VendorRow({
  category,
  vendor,
  booked,
  amount,
  guestCount,
}: {
  category: string;
  vendor: SavedVendor;
  booked: boolean;
  amount?: number;
  guestCount?: number;
}) {
  const estimate = guestCount === undefined ? undefined : estimateCost(vendor, guestCount);
  return (
    <li className={`relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-sand py-4 ${ROW_GRID}`}>
      <div className="row-span-3 md:hidden">
        <Thumb vendor={vendor} />
      </div>
      <div className="flex min-w-0 items-center gap-3 pr-10 md:pr-0">
        <div className="hidden md:block">
          <Thumb vendor={vendor} />
        </div>
        <p className="m-0 min-w-0 truncate font-serif text-[17px]">{vendor.name}</p>
      </div>

      <p className="m-0 flex justify-between gap-3 text-[14px] text-cocoa tabular-nums md:block md:text-right md:text-[15px]">
        <span className="md:sr-only">Estimate</span>
        <span>
          {estimate === undefined
            ? `From ${formatNT(vendor.priceMin)}${UNIT_SUFFIX[vendor.priceUnit]}`
            : formatNT(estimate)}
        </span>
      </p>

      <label className="flex items-center justify-between gap-3 text-[14px] md:justify-end">
        <span className="text-cocoa md:sr-only">Quote</span>
        <span className="flex items-center gap-1 rounded-lg border border-sand px-3 py-1.5 transition-colors focus-within:border-plum">
          <span className="text-[13px] text-cocoa">NT$</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={estimate === undefined ? '' : withCommas(String(estimate))}
            value={vendor.quote === undefined ? '' : withCommas(String(vendor.quote))}
            onChange={(e) => {
              const digits = digitsOnly(e.target.value);
              setQuote(category, vendor.id, digits ? Number(digits) : undefined);
            }}
            className="w-[9ch] border-0 bg-transparent p-0 text-right font-sans text-[15px] text-plum tabular-nums outline-none placeholder:text-cocoa/50"
          />
          <span className="sr-only"> from {vendor.name}</span>
        </span>
      </label>

      <p className="col-start-2 m-0 text-[14px] md:col-start-auto md:text-right md:text-[15px]">
        {amount !== undefined && guestCount !== undefined && (
          <LeftOrOver price={vendorPrice(vendor, guestCount)} amount={amount} />
        )}
      </p>

      <div className="col-start-2 flex items-center gap-2 md:col-start-auto">
        <button
          type="button"
          onClick={() => toggleBooked(category, vendor.id)}
          aria-pressed={booked}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-plum px-3 py-1.5 font-sans text-label tracking-[0.05em] uppercase transition-colors ${
            booked ? 'bg-plum text-cream hover:bg-plum/85' : 'bg-transparent text-plum hover:bg-plum hover:text-cream'
          }`}
        >
          {booked && (
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M3 8.5l3.2 3L13 4.5" />
            </svg>
          )}
          {booked ? 'Booked' : 'Book'}
          <span className="sr-only"> {vendor.name}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleSaved(category, vendor)}
          aria-label={`Remove ${vendor.name}`}
          className="absolute top-4 right-0 flex size-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-cocoa hover:bg-linen hover:text-plum md:static"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </li>
  );
}

function Thumb({ vendor }: { vendor: SavedVendor }) {
  return (
    <div className="aspect-4/3 w-14 shrink-0 overflow-hidden rounded-md bg-linen md:w-16">
      {vendor.imageUrl && <img src={vendor.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
    </div>
  );
}

function CategorySection({
  category,
  picks,
  amount,
  guestCount,
}: {
  category: PlanCategory;
  picks?: CategoryPicks;
  amount?: number;
  guestCount?: number;
}) {
  return (
    <section id={category.slug} aria-labelledby={`${category.slug}-heading`} style={{ scrollMarginTop: `calc(${HEADER} + 24px)` }}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-3">
        <h2 id={`${category.slug}-heading`} className="m-0 font-serif text-[clamp(22px,2vw,28px)] leading-tight font-light">
          {category.name}
        </h2>
        {amount !== undefined && <p className="m-0 text-[15px] text-cocoa tabular-nums">{formatNT(amount)} planned</p>}
      </div>

      {picks ? (
        <>
          {/* Column names, desktop only: on phones each value carries its own label. */}
          <div aria-hidden="true" className={`hidden pb-2 text-[13px] tracking-[0.05em] text-cocoa uppercase ${ROW_GRID}`}>
            <span>Vendor</span>
            <span className="text-right">Estimate</span>
            <span className="text-right">Quote</span>
            <span className="text-right">{amount !== undefined ? 'Against plan' : ''}</span>
            <span />
          </div>
          <ul className="m-0 list-none border-b border-sand p-0">
            {picks.saved.map((vendor) => (
              <VendorRow
                key={vendor.id}
                category={category.slug}
                vendor={vendor}
                booked={vendor.id === picks.bookedId}
                amount={amount}
                guestCount={guestCount}
              />
            ))}
          </ul>
          <Link to={`/vendors/${category.slug}`} className={`mt-4 ${linkClass}`}>
            Find more
            <span className="sr-only"> {category.name} vendors</span>
            <ArrowRight />
          </Link>
        </>
      ) : (
        <div className="border-t border-sand pt-4">
          <Link to={`/vendors/${category.slug}`} className={linkClass}>
            Find vendors
            <span className="sr-only"> for {category.name}</span>
            <ArrowRight />
          </Link>
        </div>
      )}
    </section>
  );
}

export default function ShortlistPage() {
  const plan = loadPlan();
  const picks = useVendorPicks();
  const { hash } = useLocation();
  const guestCount = plan?.request.guestCount;
  const totalBudget = plan?.request.totalBudget;
  const summary =
    guestCount === undefined
      ? null
      : picksSummary(
          picks,
          planCategories.map((c) => c.slug),
          guestCount,
        );

  useEffect(() => {
    document.title = 'Your shortlist · WedBudget';
    // Coming from a category on the results page: open on that category.
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <>
      <SiteHeader />
      <main
        className="mx-auto max-w-[1200px] px-[clamp(16px,3vw,48px)] pb-[clamp(64px,8vw,120px)]"
        style={{ paddingTop: `calc(${HEADER} + clamp(32px,4vw,64px))` }}
      >
        {plan && (
          <Link to="/plan/results" className={linkClass}>
            <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M13 8H3M7 4L3 8l4 4" />
            </svg>
            Back to your plan
          </Link>
        )}
        <h1 className="mt-4 mb-0 font-serif text-[clamp(32px,4vw,64px)] leading-[1.1] font-light">Your shortlist</h1>

        {summary && totalBudget !== undefined ? (
          <dl className="m-0 mt-[clamp(24px,3vw,40px)] grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-sand px-5 py-4 text-[15px] sm:grid-cols-3">
            <div>
              <dt className="text-[14px] text-cocoa">Your budget</dt>
              <dd className="m-0 mt-1 font-serif text-[20px] tabular-nums">{formatNT(totalBudget)}</dd>
            </div>
            <div>
              <dt className="text-[14px] text-cocoa">Booked</dt>
              <dd className="m-0 mt-1 font-serif text-[20px] tabular-nums">
                {summary.booked} of {planCategories.length}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-[14px] text-cocoa">Vendors so far</dt>
              <dd className="m-0 mt-1 font-serif text-[20px] tabular-nums">
                {summary.picked > 0 ? priceRange(summary.low, summary.high) : formatNT(0)}
                <span className="block font-sans text-[14px]">
                  <RangeLeftOrOver low={summary.low} high={summary.high} amount={totalBudget} />
                </span>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 mb-0 text-[15px] text-cocoa">
            <Link to="/plan" className={linkClass}>
              Plan your budget
            </Link>{' '}
            to see what each vendor would cost for your wedding.
          </p>
        )}

        <div className="mt-[clamp(40px,5vw,72px)] flex flex-col gap-[clamp(40px,5vw,64px)]">
          {planCategories.map((category) => (
            <CategorySection
              key={category.slug}
              category={category}
              picks={picks[category.slug]}
              amount={plan?.allocations[category.slug]}
              guestCount={guestCount}
            />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
