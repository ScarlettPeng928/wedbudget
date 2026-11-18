import { useEffect, useId, useState } from 'react';
import { withCommas } from '../lib/format';
import PresetCombobox from '../components/plan/PresetCombobox';
import CitySelect from '../components/plan/CitySelect';
import { Link, useParams, useSearchParams } from 'react-router';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import VendorCard, { VendorCardSkeleton } from '../components/VendorCard';
import NotFoundPage from './NotFoundPage';
import { budgetCategories, type BudgetCategory } from '../data/budgetCategories';
import { cities } from '../data/cities';
import { loadPlan } from '../lib/savedPlan';
import { formatPriceRange } from '../lib/format';
import { useVendorList } from '../hooks/useVendorList';

// Budget amounts offered per category (NT$, for the whole category); any other
// amount can be typed. The plan's own amount for the category is added to these.
const BUDGET_PRESETS: Record<string, number[]> = {
  venues: [200_000, 300_000, 500_000, 800_000, 1_000_000, 1_500_000],
  photography: [30_000, 50_000, 80_000, 100_000, 150_000, 200_000],
  attire: [20_000, 40_000, 60_000, 80_000, 100_000, 150_000],
  'bridal-styling': [10_000, 20_000, 30_000, 50_000, 80_000],
  hosting: [10_000, 20_000, 30_000, 50_000, 80_000],
  favors: [10_000, 20_000, 40_000, 60_000, 100_000],
};

// The region value for no city filter.
const ALL_TAIWAN = 'all';

// /vendors/:category. Unknown categories get the 404 page.
export default function VendorsPage() {
  const { category: slug } = useParams();
  const category = budgetCategories.find((c) => c.slug === slug);
  if (!category) return <NotFoundPage />;
  // key: a different category starts fresh (scroll to top, no old vendors on screen).
  return <CategoryVendors key={category.slug} category={category} />;
}

function CategoryVendors({ category }: { category: BudgetCategory }) {
  // The filters live in the address (?city=taipei&type=western), so a filtered
  // page can be shared, and reloading keeps it.
  const [params, setParams] = useSearchParams();
  // With a saved plan, the region starts at the plan's city.
  const [planCity] = useState(() => loadPlan()?.request.city);
  const regionId = useId();
  const [planGuests] = useState(() => loadPlan()?.request.guestCount);
  const [planAmount] = useState(() => loadPlan()?.allocations[category.slug]);
  const presets = [...new Set([...(BUDGET_PRESETS[category.slug] ?? []), ...(planAmount ? [planAmount] : [])])].sort((a, b) => a - b);
  const hasPlan = planCity !== undefined;

  const isCity = (value: string | null | undefined) => cities.some((c) => c.slug === value);
  const cityParam = params.get('city');
  const region = cityParam === ALL_TAIWAN || isCity(cityParam) ? cityParam! : isCity(planCity) ? planCity! : ALL_TAIWAN;
  const city = region === ALL_TAIWAN ? undefined : region;

  const typeParam = params.get('type');
  const subcategory = category.subcategories.some((s) => s.slug === typeParam) ? typeParam! : undefined;

  // Budget: what fits depends on the guest count (per-guest and per-table prices),
  // taken from the address (a link from the plan page) or else the saved plan.
  // Without either, there's no budget filter.
  const digits = (value: string | null) => (value && /^\d{1,10}$/.test(value) ? value : undefined);
  const guests = digits(params.get('guests')) ?? (planGuests ? String(planGuests) : undefined);
  const budget = guests ? digits(params.get('budget')) : undefined;

  const list = useVendorList({ category: category.slug, city, subcategory, budget, guests });
  // New vendors on their way: the old ones stay, faded, until they arrive.
  const updating = list.status === 'loading' && list.vendors !== null;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${category.name} · WedBudget`;
  }, [category.name]);

  // replace: filter changes don't pile up in the Back button's history.
  const setParam = (name: string, value: string | undefined) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === undefined) next.delete(name);
        else next.set(name, value);
        return next;
      },
      { replace: true },
    );

  return (
    <>
      <SiteHeader />
      <main className="pt-[clamp(64px,6vw,88px)]">
        <div className="relative flex h-[clamp(180px,24vw,340px)] items-end overflow-hidden bg-plum">
          {/* The category's photo: the home page's shared grade, dimmed (brightness, not a
              color laid over it, which would turn the shadows grey), with a plum shade
              only at the bottom, where the title sits. */}
          {category.banner && (
            <>
              <img
                src={category.banner}
                alt=""
                className="absolute inset-0 h-full w-full object-cover saturate-88 sepia-10 brightness-75"
              />
              <div className="absolute inset-0 bg-linear-to-t from-plum/70 via-plum/15 to-transparent" aria-hidden="true" />
            </>
          )}
          <h1 className="relative mx-auto mt-0 mb-[clamp(20px,3vw,40px)] w-full max-w-[1440px] px-[clamp(16px,3vw,48px)] font-serif text-display font-light text-cream">
            {category.name}
          </h1>
        </div>

        <div className="mx-auto max-w-[1440px] px-[clamp(16px,3vw,48px)] pt-[clamp(24px,3vw,40px)] pb-[clamp(64px,8vw,120px)]">
          {/* The filters together on the left (region, then budget); with a saved plan,
              the way back to it on the right. */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* The same drop-down as the plan form's city, with All Taiwan first.
                  A ring shows only for keyboard focus, on the button inside. */}
              <div className="relative inline-flex items-center rounded-sm border border-plum">
                <label htmlFor={regionId} className="pl-4 text-small text-cocoa">
                  Region
                </label>
                <span className="min-w-[14ch] py-2 pr-3 pl-2 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-plum">
                  <CitySelect
                    id={regionId}
                    value={region}
                    onChange={(slug) => setParam('city', slug)}
                    extraOption={{ value: ALL_TAIWAN, label: 'All Taiwan' }}
                  />
                </span>
              </div>
              {guests && (
                <BudgetFilter
                  value={budget}
                  presets={presets}
                  // One update for both: two in a row would each start from the same old
                  // address, and the second would undo the first.
                  onChange={(next) =>
                    setParams(
                      (prev) => {
                        const updated = new URLSearchParams(prev);
                        if (next) {
                          updated.set('budget', next);
                          // The guest count the budget was set against goes in the address too.
                          if (!updated.get('guests')) updated.set('guests', guests);
                        } else {
                          updated.delete('budget');
                        }
                        return updated;
                      },
                      { replace: true },
                    )
                  }
                />
              )}
            </div>
            {hasPlan && (
              // The arrow appears on hover or press, outside the text so nothing shifts
              // (mirrors See all on the plan page).
              <Link
                to="/plan"
                className="group relative text-body text-plum underline decoration-rosewood decoration-1 underline-offset-[0.2em] hover:decoration-plum"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="absolute top-1/2 -left-4 size-3 translate-x-1 -translate-y-1/2 opacity-0 transition-[opacity,translate] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 group-active:translate-x-0 group-active:opacity-100 motion-reduce:transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M13 8H3M7 4L3 8l4 4" />
                </svg>
                Back to your plan
              </Link>
            )}
          </div>

          {/* The kind of vendor, one at a time: compact chips in the same frames as the
              filters above. All shows every kind. */}
          <div role="group" aria-label="Type of vendor" className="mt-4 flex flex-wrap gap-2">
            {[{ slug: undefined, name: 'All' }, ...category.subcategories].map((sub) => {
              const selected = sub.slug === subcategory;
              return (
                <button
                  key={sub.slug ?? 'all'}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setParam('type', sub.slug)}
                  className={`cursor-pointer rounded-sm border px-4 py-2 font-sans text-small transition-colors ${
                    selected ? 'border-plum bg-plum text-cream' : 'border-sand bg-transparent text-plum hover:border-plum'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>

          <h2 className="sr-only">Vendors</h2>
          {list.status === 'error' && (
            <div role="alert" className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-terracotta">
              <p className="m-0">Vendors couldn't be loaded. Check your connection and try again.</p>
              <button
                type="button"
                onClick={list.retry}
                className="cursor-pointer border-0 bg-transparent p-0 text-small text-plum underline decoration-rosewood decoration-2 underline-offset-[0.2em] hover:decoration-plum"
              >
                Try again
              </button>
            </div>
          )}

          {list.vendors !== null && list.vendors.length === 0 ? (
            <div
              aria-busy={updating}
              className={`mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-sand px-5 py-10 text-center transition-opacity duration-200 ${updating ? 'opacity-40' : ''}`}
            >
              <p className="m-0 text-body text-cocoa">{budget ? 'No vendors within this budget.' : 'No vendors here yet.'}</p>
              {budget && (
                <button
                  type="button"
                  onClick={() => setParam('budget', undefined)}
                  className="cursor-pointer border-0 bg-transparent p-0 text-body text-plum underline decoration-rosewood decoration-2 underline-offset-[0.2em] hover:decoration-plum"
                >
                  Clear budget
                </button>
              )}
              {!budget && city && (
                <button
                  type="button"
                  onClick={() => setParam('city', ALL_TAIWAN)}
                  className="cursor-pointer border-0 bg-transparent p-0 text-body text-plum underline decoration-rosewood decoration-2 underline-offset-[0.2em] hover:decoration-plum"
                >
                  See all of Taiwan
                </button>
              )}
            </div>
          ) : (
            <ul
              aria-busy={list.vendors === null || updating}
              className={`mt-8 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 transition-opacity duration-200 lg:grid-cols-4 ${updating ? 'opacity-40' : ''}`}
            >
              {list.vendors === null
                ? Array.from({ length: 8 }, (_, i) => (
                    <li key={i} aria-hidden="true">
                      <VendorCardSkeleton />
                    </li>
                  ))
                : list.vendors.map((vendor) => (
                    <li key={vendor.id}>
                      <VendorCard vendor={vendor} category={category.slug}>
                        <p className="mt-1 mb-0 text-small text-plum tabular-nums">
                          {formatPriceRange(vendor.priceMin, vendor.priceMax, vendor.priceUnit)}
                        </p>
                        {/* Only across all of Taiwan; a chosen region is already shown above. */}
                        {!city && <p className="mt-0.5 mb-0 text-small text-cocoa">{vendor.city.name}</p>}
                      </VendorCard>
                    </li>
                  ))}
            </ul>
          )}

          {/* The next page of vendors, in the same shuffled order (no repeats). */}
          {list.hasMore && !updating && (
            <div className="mt-[clamp(32px,4vw,48px)] flex justify-center">
              <button
                type="button"
                onClick={list.loadMore}
                disabled={list.loadingMore}
                className="group inline-flex cursor-pointer flex-col items-center gap-1 border-0 bg-transparent p-2 font-sans text-label tracking-[0.05em] text-plum uppercase transition-colors hover:text-rosewood disabled:cursor-wait disabled:opacity-60"
              >
                {list.loadingMore ? 'Loading…' : 'Show more'}
                <svg
                  viewBox="0 0 16 16"
                  className="size-4 transition-transform duration-200 ease-out group-hover:translate-y-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

// "Budget NT$ ___ ▾": only vendors that fit this amount for the wedding's guest count.
// The same pick-or-type drop-down as the plan form's budget. Typing waits for a
// pause before filtering, so each digit isn't a new search; × clears it, leaving
// the drop-down ready to pick another amount.
function BudgetFilter({ value, presets, onChange }: { value?: string; presets: number[]; onChange: (digits: string | undefined) => void }) {
  const [text, setText] = useState(value ?? '');
  const id = useId();

  // A new value from outside (a link, Clear budget) replaces what's in the field.
  useEffect(() => setText(value ?? ''), [value]);

  useEffect(() => {
    if (text === (value ?? '')) return;
    const timer = window.setTimeout(() => onChange(text || undefined), 500);
    return () => window.clearTimeout(timer);
  }, [text, value, onChange]);

  return (
    // No focus ring on the box: the text cursor shows where typing goes.
    <label className="relative inline-flex items-center rounded-sm border border-plum">
      <span className="pl-4 text-small text-cocoa">Budget</span>
      <span className="w-[15ch] py-2 pr-3 pl-2">
        <PresetCombobox
          id={id}
          value={text}
          onChange={setText}
          presets={presets}
          format={withCommas}
          optionLabel={(n) => `NT$${n.toLocaleString('en-US')}`}
          maxDigits={10}
          placeholder="No limit"
          // Empty reads "No limit" (like Region's All Taiwan); NT$ appears with an amount.
          prefix={
            text ? (
              <span className="text-input text-cocoa" aria-hidden="true">
                NT$
              </span>
            ) : undefined
          }
        />
      </span>
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('');
            onChange(undefined);
          }}
          aria-label="Clear budget"
          className="mr-2 flex size-6 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 text-cocoa hover:bg-linen hover:text-plum"
        >
          <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </label>
  );
}
