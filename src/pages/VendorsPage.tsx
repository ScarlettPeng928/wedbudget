import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import VendorCard, { VendorCardSkeleton } from '../components/VendorCard';
import SubcategoryPhoto from '../components/SubcategoryPhoto';
import NotFoundPage from './NotFoundPage';
import { budgetCategories, type BudgetCategory } from '../data/budgetCategories';
import { cities } from '../data/cities';
import { loadPlan } from '../lib/savedPlan';
import { formatNT } from '../lib/format';
import { useVendorList } from '../hooks/useVendorList';
import type { VendorListItem } from '../api/vendors';

// The region value for no city filter.
const ALL_TAIWAN = 'all';

const UNIT_SUFFIX: Record<VendorListItem['priceUnit'], string> = {
  event: '',
  table: ' / table',
  guest: ' / guest',
};

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
  const hasPlan = planCity !== undefined;

  const isCity = (value: string | null | undefined) => cities.some((c) => c.slug === value);
  const cityParam = params.get('city');
  const region = cityParam === ALL_TAIWAN || isCity(cityParam) ? cityParam! : isCity(planCity) ? planCity! : ALL_TAIWAN;
  const city = region === ALL_TAIWAN ? undefined : region;

  const typeParam = params.get('type');
  const subcategory = category.subcategories.some((s) => s.slug === typeParam) ? typeParam! : undefined;

  const list = useVendorList({ category: category.slug, city, subcategory });
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

  // Other categories keep the chosen region.
  const regionQuery = cityParam ? `?city=${cityParam}` : '';

  return (
    <>
      <SiteHeader />
      <main className="pt-[clamp(64px,6vw,88px)]">
        <div className="relative flex h-[clamp(180px,24vw,340px)] items-end overflow-hidden bg-plum">
          {/* Banner photo goes here once chosen: an <img> with absolute inset-0 object-cover,
              plus a dark gradient so the white title stays readable. */}
          <h1 className="relative mx-auto mt-0 mb-[clamp(20px,3vw,40px)] w-full max-w-[1440px] px-[clamp(16px,3vw,48px)] font-serif text-[clamp(36px,4.4vw,72px)] leading-[1.05] font-light text-cream">
            {category.name}
          </h1>
        </div>

        <div className="mx-auto max-w-[1440px] px-[clamp(16px,3vw,48px)] pt-[clamp(24px,3vw,40px)] pb-[clamp(64px,8vw,120px)]">
          {/* Region on the left; with a saved plan, the way back to it on the right. */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <label className="relative inline-flex items-center rounded-full border border-plum has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-plum">
              <span className="pl-4 text-[14px] text-cocoa">Region</span>
              <select
                value={region}
                onChange={(e) => setParam('city', e.target.value)}
                className="cursor-pointer appearance-none border-0 bg-transparent py-2 pr-10 pl-2 font-serif text-[15px] text-plum outline-none"
              >
                <option value={ALL_TAIWAN}>All Taiwan</option>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 16 16"
                className="pointer-events-none absolute right-4 size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M3 6l5 5 5-5" />
              </svg>
            </label>
            {hasPlan && (
              <Link
                to="/plan/results"
                className="inline-flex items-center gap-1.5 text-[15px] text-plum underline decoration-rosewood decoration-1 underline-offset-[0.2em] hover:decoration-plum"
              >
                <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M13 8H3M7 4L3 8l4 4" />
                </svg>
                Back to your plan
              </Link>
            )}
          </div>

          {/* One type at a time; clicking the selected one again shows every type. */}
          <div role="group" aria-label="Type of vendor" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {category.subcategories.map((sub, i) => {
              const selected = sub.slug === subcategory;
              return (
                <button
                  key={sub.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setParam('type', selected ? undefined : sub.slug)}
                  className={`cursor-pointer rounded-lg border p-2.5 transition-colors ${
                    selected ? 'border-plum bg-plum text-cream' : 'border-sand bg-transparent text-plum hover:border-plum'
                  }`}
                >
                  {/* Phones: names only, so the four types fit above the vendors. */}
                  <span className="hidden aspect-16/9 overflow-hidden rounded-md sm:block">
                    <SubcategoryPhoto sub={sub} index={i} decorative />
                  </span>
                  <span className="block py-1 font-serif text-[15px] sm:mt-2">{sub.name}</span>
                </button>
              );
            })}
          </div>

          <h2 className="sr-only">Vendors</h2>
          {list.status === 'error' && (
            <div role="alert" className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-terracotta">
              <p className="m-0">Vendors couldn't be loaded. Check your connection and try again.</p>
              <button
                type="button"
                onClick={list.retry}
                className="cursor-pointer border-0 bg-transparent p-0 text-[14px] text-plum underline decoration-rosewood decoration-2 underline-offset-[0.2em] hover:decoration-plum"
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
              <p className="m-0 text-[15px] text-cocoa">No vendors here yet.</p>
              {city && (
                <button
                  type="button"
                  onClick={() => setParam('city', ALL_TAIWAN)}
                  className="cursor-pointer border-0 bg-transparent p-0 text-[15px] text-plum underline decoration-rosewood decoration-2 underline-offset-[0.2em] hover:decoration-plum"
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
                        <p className="mt-1 mb-0 text-[14px] text-cocoa tabular-nums">
                          From {formatNT(vendor.priceMin)}
                          {UNIT_SUFFIX[vendor.priceUnit]}
                        </p>
                        {/* Only across all of Taiwan; a chosen region is already shown above. */}
                        {!city && <p className="mt-0.5 mb-0 text-[14px] text-cocoa">{vendor.city.name}</p>}
                      </VendorCard>
                    </li>
                  ))}
            </ul>
          )}

          <nav aria-labelledby="other-categories" className="mt-[clamp(56px,7vw,96px)] border-t border-sand pt-[clamp(24px,3vw,40px)]">
            <h2 id="other-categories" className="mt-0 mb-4 font-serif text-[clamp(20px,1.7vw,26px)] font-light">
              Explore other categories
            </h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {budgetCategories
                .filter((c) => c.slug !== category.slug)
                .map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={`/vendors/${c.slug}${regionQuery}`}
                      className="inline-block rounded-full border border-sand px-4 py-2 font-serif text-[15px] text-plum no-underline transition-colors hover:border-plum"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
