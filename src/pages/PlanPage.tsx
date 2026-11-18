import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import PlanForm from '../components/plan/PlanForm';
import BudgetAllocation from '../components/results/BudgetAllocation';
import VendorCarousel from '../components/results/VendorCarousel';
import PlanPreview from '../components/results/PlanPreview';
import { BAND, BAND_INNER, HEADER_HEIGHT, STICKY_COLUMN, TOOL_COLUMNS } from '../components/toolLayout';
import { planCategories } from '../data/planCategories';
import { useVendorMatches } from '../hooks/useVendorMatches';
import { fromResult, isAdjusted, loadPlan, savePlan, type SavedPlan } from '../lib/savedPlan';
import { generateBudgetPlan, type PlanRequest } from '../api/plan';
import { EASE_IN_OUT, EASE_OUT } from '../animations/ease';

gsap.registerPlugin(useGSAP, ScrollToPlugin);

type Allocations = Record<string, number>;

const snapThousand = gsap.utils.snap(1000);

const HEADER = HEADER_HEIGHT;

// /plan: the three questions at the top, always there to change. The first answer
// grows the plan out below them; later answers update it in place.
export default function PlanPage() {
  const [plan, setPlan] = useState<SavedPlan | null>(loadPlan);
  // Amounts on screen while they glide to new values; null = show the plan as is.
  // Only the display moves: the saved plan already holds the final numbers.
  const [shown, setShown] = useState<Allocations | null>(null);
  const allocationTimeline = useRef<gsap.core.Timeline | null>(null);
  // The plan area, which slides up from below the form when a first plan arrives.
  const results = useRef<HTMLDivElement>(null);
  const revealNext = useRef(false);
  // Read out by screen readers after an update, then cleared.
  const [status, setStatus] = useState('');
  // Uses the final amounts (not the gliding ones on screen), so an animation never triggers requests.
  const matches = useVendorMatches(plan && { city: plan.request.city, guestCount: plan.request.guestCount, allocations: plan.allocations });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hasPlan = plan !== null;
  useEffect(() => {
    document.title = hasPlan ? 'Your budget plan · WedBudget' : 'Plan your wedding budget · WedBudget';
  }, [hasPlan]);

  // Remember every adjustment, so the plan is still here after a reload.
  useEffect(() => {
    if (plan) savePlan(plan);
  }, [plan]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(''), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  // Glide every amount from `from` to `to`: sliders, amounts, summary and vendor
  // headings all follow, since they read the same numbers.
  // reveal: the first arrival, where the six categories grow from zero one after
  // another, like the rings on the home page. Otherwise all move together, briefly.
  const playAllocations = (from: Allocations, to: Allocations, reveal: boolean) => {
    allocationTimeline.current?.kill();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(null);
      return;
    }
    const values = { ...from };
    const tl = gsap.timeline({
      defaults: { ease: EASE_OUT, duration: reveal ? 0.9 : 0.6 },
      // Counted in whole thousands while moving, so the digits tick over cleanly
      // instead of flickering. The exact amounts return when it finishes.
      onUpdate: () => setShown(Object.fromEntries(planCategories.map((c) => [c.slug, snapThousand(values[c.slug] ?? 0)]))),
      onComplete: () => {
        setShown(null);
        allocationTimeline.current = null;
      },
    });
    planCategories.forEach((c, i) => {
      tl.fromTo(values, { [c.slug]: from[c.slug] ?? 0 }, { [c.slug]: to[c.slug] ?? 0 }, reveal ? 0.2 + i * 0.12 : 0);
    });
    // Show the starting amounts straight away, before the first animation frame.
    setShown({ ...from });
    allocationTimeline.current = tl;
  };

  // contextSafe: animations made later (in handlers) are still cleaned up if the
  // visitor leaves the page while they play.
  const { contextSafe } = useGSAP();
  const animateAllocations = contextSafe(playAllocations);

  // A first plan just rendered below the form: it slides up into place while the
  // page scrolls down to it, then the six categories fill in one by one. Before
  // paint (layout effect), so the plan never flashes up unanimated.
  const revealResults = contextSafe((el: HTMLElement) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) gsap.fromTo(el, { y: 64, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: EASE_OUT });
    gsap.to(window, {
      scrollTo: { y: el, offsetY: parseFloat(getComputedStyle(el).scrollMarginTop) || 0, autoKill: true },
      duration: reduceMotion ? 0 : 0.9,
      ease: EASE_IN_OUT,
    });
  });
  useLayoutEffect(() => {
    if (!hasPlan || !revealNext.current || !results.current) return;
    revealNext.current = false;
    revealResults(results.current);
  }, [hasPlan, revealResults]);

  const allocations = shown ?? plan?.allocations ?? {};

  // Touching a slider or amount stops any glide, so the controls never fight the hand.
  // Every slider back to the suggested split, gliding there like any other update.
  const resetAllocations = () => {
    if (!plan) return;
    const previous = allocations;
    setPlan({ ...plan, allocations: plan.suggested });
    setStatus('Allocation reset.');
    animateAllocations(previous, plan.suggested, false);
  };

  const setAllocation = (slug: string, amount: number) => {
    allocationTimeline.current?.kill();
    allocationTimeline.current = null;
    setShown(null);
    setPlan((prev) => prev && { ...prev, allocations: { ...prev.allocations, [slug]: amount } });
  };

  // Desktop: grabbing a slider brings that category's vendors into view on the
  // right, so the visitor sees them change while dragging. The sliders stay put
  // (the left column is sticky). Phones stack the columns, so scrolling there
  // would carry the slider away: skipped.
  const showVendorsFor = contextSafe((slug: string) => {
    if (!window.matchMedia('(min-width: 1024px)').matches) return;
    const row = document.getElementById(`vendors-${slug}`)?.closest('section');
    if (!row) return;
    // Already fully on screen (below the header): leave the page where it is.
    const box = row.getBoundingClientRect();
    const headerBottom = parseFloat(getComputedStyle(row).scrollMarginTop) || 0;
    if (box.top >= headerBottom && box.bottom <= window.innerHeight) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.to(window, {
      // offsetY keeps the row clear of the fixed header (same gap as its scroll-margin).
      scrollTo: { y: row, offsetY: headerBottom, autoKill: true },
      duration: reduceMotion ? 0 : 0.6,
      ease: EASE_IN_OUT,
    });
  });

  // The form's answers. Errors are left to PlanForm, which shows them by the button.
  // - First plan: it grows out below the form.
  // - Same budget, new city or guest count: the split only depends on the budget,
  //   so the slider changes stay; only the vendors on the right change.
  // - New budget: a fresh split replaces the plan and its slider changes (the form
  //   says so first, only in this case).
  const handleSubmit = async (request: PlanRequest) => {
    // Asked every time: the backend also checks the answers (a real city, in range).
    const result = await generateBudgetPlan(request);
    if (plan && result.request.totalBudget === plan.request.totalBudget) {
      setPlan({ ...plan, request: result.request });
      setStatus('Plan updated.');
      return;
    }
    const first = plan === null;
    const previous = allocations;
    revealNext.current = first;
    setPlan(fromResult(result));
    setStatus(first ? 'Plan ready.' : 'Plan updated.');
    animateAllocations(first ? {} : previous, result.allocations, first);
  };

  return (
    <>
      <SiteHeader showCta={false} />
      <main className="pb-[clamp(64px,8vw,120px)]" style={{ paddingTop: HEADER }}>
        {/* The answers on a linen band, edge to edge, set apart from the plan below.
            Inside, the same width and gutters as the plan, so the edges line up. */}
        {/* The linen band appears with the plan: it sets the answers apart from
            what they produced. Before that the page is plain, with the preview below. */}
        <header className={plan ? BAND : ''}>
          <div className={BAND_INNER}>
            <h1 className="m-0 font-serif text-title font-light">Plan your wedding budget</h1>
            <div className="mt-[clamp(32px,4vw,56px)]">
              <PlanForm
                layout="inline"
                initial={plan?.request}
                onGenerate={handleSubmit}
                submitLabel={plan ? undefined : 'Generate budget plan'}
                busyLabel={plan ? undefined : 'Generating…'}
              />
            </div>

            <p role="status" className="sr-only">
              {status}
            </p>
          </div>
        </header>

        {plan && (
          <div
            ref={results}
            style={{ scrollMarginTop: `calc(${HEADER} + 24px)` }}
            className={TOOL_COLUMNS}
          >
            {/* Left column stays put while the vendor list on the right scrolls. */}
            {/* Desktop only: offset below the fixed header and capped at the screen height. */}
            <aside className={STICKY_COLUMN}>
              <BudgetAllocation
                categories={planCategories}
                allocations={allocations}
                suggested={plan.suggested}
                totalBudget={plan.request.totalBudget}
                onChange={setAllocation}
                onActivate={showVendorsFor}
                onReset={isAdjusted(plan) ? resetAllocations : undefined}
                gliding={shown !== null}
              />
            </aside>

            <section aria-labelledby="vendors-heading" className="flex min-w-0 flex-col gap-[clamp(32px,4vw,48px)]">
              <h2 id="vendors-heading" className="m-0 font-serif text-heading font-light">
                Vendors that fit your budget
              </h2>
              {matches.status === 'error' && (
                <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-terracotta">
                  <p className="m-0">Vendors couldn't be loaded. Check your connection and try again.</p>
                  <button
                    type="button"
                    onClick={matches.retry}
                    className="cursor-pointer border-0 bg-transparent p-0 text-small text-plum underline decoration-rosewood decoration-2 underline-offset-[0.2em] hover:decoration-plum"
                  >
                    Try again
                  </button>
                </div>
              )}
              {planCategories.map((category) => (
                <VendorCarousel
                  key={category.slug}
                  slug={category.slug}
                  title={category.name}
                  amount={allocations[category.slug] ?? 0}
                  vendors={matches.vendors ? (matches.vendors[category.slug] ?? []) : null}
                  updating={matches.isUpdating(category.slug)}
                  seeAllHref={`/vendors/${category.slug}?city=${plan.request.city}&budget=${plan.allocations[category.slug] ?? 0}&guests=${plan.request.guestCount}`}
                />
              ))}
            </section>
          </div>
        )}
        {!plan && <PlanPreview className={TOOL_COLUMNS} />}
      </main>
      <SiteFooter />
    </>
  );
}
