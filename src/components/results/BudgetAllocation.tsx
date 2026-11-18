import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import type { PlanCategory } from '../../data/planCategories';
import { digitsOnly, formatNT, withCommas } from '../../lib/format';
import { bookedVendor, categoryRange, picksSummary, useVendorPicks, vendorPrice, type CategoryPicks } from '../../lib/vendorPicks';
import { LeftOrOver, priceRange, RangeLeftOrOver } from '../PriceStatus';

type BudgetAllocationProps = {
  categories: PlanCategory[];
  allocations: Record<string, number>;
  // The allocation as generated, before any adjustments. Sets each slider's range.
  suggested: Record<string, number>;
  totalBudget: number;
  // Prices the saved vendors (per-table and per-guest prices depend on it).
  guestCount: number;
  onChange: (slug: string, amount: number) => void;
  // A category's slider was grabbed or focused, before any change.
  onActivate?: (slug: string) => void;
};

const SLIDER_STEP = 1000;

// Twice the suggestion gives every category a usable range: a 5% category no longer
// sits pinned at the far left of a track that spans the whole budget. Never below
// the current amount (it may have been typed in higher), never above the budget
// unless the amount itself is.
function sliderMax(suggested: number, amount: number, totalBudget: number) {
  const base = Math.min(suggested > 0 ? suggested * 2 : totalBudget * 0.1, totalBudget);
  return Math.ceil(Math.max(base, amount, SLIDER_STEP) / SLIDER_STEP) * SLIDER_STEP;
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v4M8 11v.5" />
    </svg>
  );
}

// One category: name, typed amount and a slider, both editing the same value.
function CategoryRow({
  category,
  amount,
  max,
  picks,
  guestCount,
  onChange,
  onActivate,
}: {
  category: PlanCategory;
  amount: number;
  max: number;
  picks?: CategoryPicks;
  guestCount: number;
  onChange: (amount: number) => void;
  onActivate?: () => void;
}) {
  const inputId = `amount-${category.slug}`;
  // How much of the slider track is filled, for the CSS gradient.
  const fill = `${Math.min(100, (amount / max) * 100)}%`;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={inputId} className="font-serif text-[clamp(17px,1.3vw,20px)]">
          {category.name}
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-sand px-3 py-1 transition-colors focus-within:border-plum">
          <span className="text-[14px] text-cocoa">NT$</span>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={withCommas(String(amount))}
            onChange={(e) => onChange(Number(digitsOnly(e.target.value)))}
            className="w-[9ch] border-0 bg-transparent p-0 text-right font-sans text-[15px] text-plum tabular-nums outline-none"
          />
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={SLIDER_STEP}
        value={Math.min(amount, max)}
        onChange={(e) => onChange(Number(e.target.value))}
        // Pointer down fires as the drag starts (some browsers don't focus a slider on click);
        // focus covers keyboard users tabbing to it.
        onPointerDown={onActivate}
        onFocus={onActivate}
        aria-label={`${category.name} amount`}
        aria-valuetext={formatNT(amount)}
        className="budget-range mt-1"
        style={{ '--fill': fill } as CSSProperties}
      />
      {picks ? (
        <ShortlistLine category={category} picks={picks} amount={amount} guestCount={guestCount} />
      ) : (
        // Nothing saved yet: the way to go and find some. The vendors page opens on the plan's city.
        <Link
          to={`/vendors/${category.slug}`}
          className="mt-1 inline-flex items-center gap-1 text-[14px] text-plum underline decoration-rosewood decoration-1 underline-offset-[0.2em] hover:decoration-plum"
        >
          Find vendors
          <span className="sr-only"> for {category.name}</span>
          <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>
      )}
    </div>
  );
}

// The category's saved vendors in one line, linking to the shortlist page where
// they're compared, quoted and booked: the booked one, or how many and their range.
function ShortlistLine({ category, picks, amount, guestCount }: { category: PlanCategory; picks: CategoryPicks; amount: number; guestCount: number }) {
  const booked = bookedVendor(picks);
  const { low, high } = categoryRange(picks, guestCount);
  return (
    <div className="mt-1 flex items-center justify-between gap-3 text-[14px]">
      <Link
        to={`/shortlist#${category.slug}`}
        className="flex min-w-0 items-center gap-1.5 text-plum no-underline hover:underline hover:decoration-rosewood hover:underline-offset-[0.2em]"
      >
        {booked ? (
          <>
            <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M3 8.5l3.2 3L13 4.5" />
            </svg>
            <span className="truncate">{booked.name}</span>
            <span className="shrink-0 text-cocoa tabular-nums">{formatNT(vendorPrice(booked, guestCount))}</span>
          </>
        ) : (
          <>
            <span className="shrink-0">{picks.saved.length} saved</span>
            <span className="truncate text-cocoa tabular-nums">{priceRange(low, high)}</span>
          </>
        )}
        <span className="sr-only"> {category.name}, open shortlist</span>
        <svg viewBox="0 0 16 16" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </Link>
      {booked ? (
        <LeftOrOver price={vendorPrice(booked, guestCount)} amount={amount} className="shrink-0" />
      ) : (
        <span className="shrink-0 text-[14px]">
          <RangeLeftOrOver low={low} high={high} amount={amount} />
        </span>
      )}
    </div>
  );
}

export default function BudgetAllocation({
  categories,
  allocations,
  suggested,
  totalBudget,
  guestCount,
  onChange,
  onActivate,
}: BudgetAllocationProps) {
  const picks = useVendorPicks();
  const categoriesTotal = categories.reduce((sum, c) => sum + (allocations[c.slug] ?? 0), 0);
  // The plan allocates the whole budget; only slider changes can push it over.
  const overBy = categoriesTotal - totalBudget;
  const over = overBy > 0;
  // What the saved and booked vendors add up to so far.
  const vendors = picksSummary(
    picks,
    categories.map((c) => c.slug),
    guestCount,
  );

  return (
    <section aria-labelledby="allocation-heading" className="flex flex-col gap-5">
      <h2 id="allocation-heading" className="m-0 font-serif text-[clamp(26px,2.4vw,36px)] leading-tight font-light">
        Budget allocation
      </h2>

      <div className="flex flex-col gap-3">
        {categories.map((category) => {
          const amount = allocations[category.slug] ?? 0;
          return (
            <CategoryRow
              key={category.slug}
              category={category}
              amount={amount}
              max={sliderMax(suggested[category.slug] ?? 0, amount, totalBudget)}
              picks={picks[category.slug]}
              guestCount={guestCount}
              onChange={(value) => onChange(category.slug, value)}
              onActivate={onActivate && (() => onActivate(category.slug))}
            />
          );
        })}
      </div>

      <dl className="m-0 rounded-lg border border-sand px-5 py-4 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-cocoa">Categories total</dt>
          <dd className="m-0 tabular-nums">{formatNT(categoriesTotal)}</dd>
        </div>
        <div className="mt-2 flex justify-between">
          <dt className="text-cocoa">Your total budget</dt>
          <dd className="m-0 tabular-nums">{formatNT(totalBudget)}</dd>
        </div>
        {vendors.picked > 0 && (
          <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-dashed border-sand pt-3">
            <dt>
              <Link
                to="/shortlist"
                className="text-cocoa underline decoration-rosewood decoration-1 underline-offset-[0.2em] hover:text-plum hover:decoration-plum"
              >
                Vendors so far
              </Link>
              <span className="block text-[14px] text-cocoa tabular-nums">
                {vendors.booked} of {categories.length} booked
              </span>
            </dt>
            <dd className="m-0 text-right tabular-nums">
              {priceRange(vendors.low, vendors.high)}
              <span className="block text-[14px]">
                <RangeLeftOrOver low={vendors.low} high={vendors.high} amount={totalBudget} />
              </span>
            </dd>
          </div>
        )}
        {over && (
          <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-sand pt-3">
            <dt className="flex items-center gap-1.5 font-medium text-terracotta">
              <WarningIcon />
              Over by
            </dt>
            <dd className="m-0 font-serif text-[20px] text-terracotta tabular-nums">{formatNT(overBy)}</dd>
          </div>
        )}
      </dl>

      {/* Phones: the summary sits below six sliders, so if dragging pushes the plan
          over budget, keep the warning in view. Same numbers as the summary above,
          so screen readers skip it. */}
      {over && (
        <div
          aria-hidden="true"
          className="fixed inset-x-0 bottom-0 z-30 flex items-baseline justify-between border-t border-sand bg-cream px-[clamp(16px,3vw,48px)] py-3 lg:hidden"
        >
          <span className="flex items-center gap-1.5 text-[15px] font-medium text-terracotta">
            <WarningIcon />
            Over by
          </span>
          <span className="font-serif text-[18px] text-terracotta tabular-nums">{formatNT(overBy)}</span>
        </div>
      )}
    </section>
  );
}
