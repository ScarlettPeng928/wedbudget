import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import PlanForm, { type FieldName } from '../components/plan/PlanForm';
import BudgetAllocation from '../components/results/BudgetAllocation';
import VendorCarousel from '../components/results/VendorCarousel';
import { planCategories } from '../data/planCategories';
import { cityName } from '../data/cities';
import { useVendorMatches } from '../hooks/useVendorMatches';
import { formatNT } from '../lib/format';
import { fromResult, isAdjusted, loadPlan, savePlan, type SavedPlan } from '../lib/savedPlan';
import { generateBudgetPlan, type PlanRequest } from '../api/plan';
import { EASE_IN_OUT, EASE_OUT } from '../animations/ease';

gsap.registerPlugin(useGSAP, ScrollToPlugin);

type Allocations = Record<string, number>;

const snapThousand = gsap.utils.snap(1000);

// Fixed header height, used to clear the header at the top of the page.
const HEADER = 'clamp(64px,6vw,88px)';

// One of the three answers inside the headline. Clicking it opens the editor
// with the cursor already in that field.
function EditableValue({
  field,
  open,
  onEdit,
  children,
}: {
  field: FieldName;
  open: boolean;
  onEdit: (field: FieldName) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onEdit(field)}
      aria-expanded={open}
      aria-controls="plan-editor"
      className="cursor-pointer border-0 bg-transparent p-0 text-inherit whitespace-nowrap underline decoration-rosewood decoration-2 underline-offset-[0.14em] transition-colors [font:inherit] hover:decoration-plum focus-visible:decoration-plum"
    >
      {children}
    </button>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState<SavedPlan | null>(loadPlan);
  // Amounts on screen while they glide to new values; null = show the plan as is.
  // Only the display moves: the saved plan already holds the final numbers.
  const [shown, setShown] = useState<Allocations | null>(null);
  const allocationTimeline = useRef<gsap.core.Timeline | null>(null);
  // Which answer the editor opened on; null while the editor is closed.
  const [editing, setEditing] = useState<FieldName | null>(null);
  // Read out by screen readers after an update, then cleared.
  const [status, setStatus] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  // Uses the final amounts (not the gliding ones on screen), so an animation never triggers requests.
  const matches = useVendorMatches(
    plan && { city: plan.request.city, guestCount: plan.request.guestCount, allocations: plan.allocations },
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Your budget plan · WedBudget';
  }, []);

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

  // First arrival from the form: reveal the allocation. The flag is cleared right
  // away, so a reload or coming back later shows the plan without replaying.
  const { contextSafe } = useGSAP(() => {
    const fresh = (location.state as { fresh?: boolean } | null)?.fresh === true;
    if (!fresh || !plan) return;
    navigate(location.pathname, { replace: true, state: null });
    playAllocations({}, plan.allocations, true);
  });

  // No plan yet (or it was cleared): start at the form.
  if (!plan) return <Navigate to="/plan" replace />;

  // Created after useGSAP, so wrapped in contextSafe: the animation is still
  // cleaned up if the visitor leaves the page while it plays.
  const animateAllocations = contextSafe(playAllocations);

  const { totalBudget, city, guestCount } = plan.request;
  const adjusted = isAdjusted(plan);

  const allocations = shown ?? plan.allocations;

  // Touching a slider or amount stops any glide, so the controls never fight the hand.
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

  const closeEditor = () => {
    setEditing(null);
    heading.current?.focus();
  };

  // New answers: a fresh allocation, replacing slider adjustments (the editor says so first).
  // Errors are left to PlanForm, which shows them next to the button.
  const handleUpdate = async (request: PlanRequest) => {
    const result = await generateBudgetPlan(request);
    const previous = allocations;
    setPlan(fromResult(result));
    setStatus('Plan updated.');
    closeEditor();
    animateAllocations(previous, result.allocations, false);
  };

  return (
    <>
      <SiteHeader showCta={false} />
      <main
        className="mx-auto max-w-[1440px] px-[clamp(16px,3vw,48px)] pb-[clamp(64px,8vw,120px)]"
        style={{ paddingTop: `calc(${HEADER} + clamp(32px,4vw,64px))` }}
      >
        <header>
          {/* The visitor's own wedding, in one sentence. Each answer can be changed in place. */}
          <h1
            ref={heading}
            tabIndex={-1}
            className="m-0 max-w-[22ch] font-serif text-[clamp(32px,4vw,64px)] leading-[1.15] font-light outline-none"
          >
            Your{' '}
            <EditableValue field="budget" open={editing !== null} onEdit={setEditing}>
              {formatNT(totalBudget)}
            </EditableValue>{' '}
            wedding in{' '}
            <EditableValue field="city" open={editing !== null} onEdit={setEditing}>
              {cityName(city)}
            </EditableValue>{' '}
            for{' '}
            <EditableValue field="guests" open={editing !== null} onEdit={setEditing}>
              {guestCount.toLocaleString('en-US')} {guestCount === 1 ? 'guest' : 'guests'}
            </EditableValue>
          </h1>

          {editing && (
            <div
              id="plan-editor"
              className="mt-[clamp(24px,3vw,40px)] max-w-[960px] border-t border-sand pt-[clamp(24px,3vw,40px)]"
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeEditor();
              }}
            >
              <PlanForm
                layout="inline"
                initial={plan.request}
                focusField={editing}
                onGenerate={handleUpdate}
                onCancel={closeEditor}
                note={adjusted ? 'Updating replaces your slider adjustments.' : undefined}
              />
            </div>
          )}

          <p role="status" className="sr-only">
            {status}
          </p>
        </header>

        <div className="mt-[clamp(48px,6vw,88px)] grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(340px,5fr)_minmax(0,7fr)] lg:gap-[clamp(40px,5vw,88px)]">
          {/* Left column stays put while the vendor list on the right scrolls. */}
          {/* Desktop only: offset below the fixed header and capped at the screen height. */}
          <aside className="min-w-0 lg:sticky lg:top-[calc(clamp(64px,6vw,88px)_+_24px)] lg:max-h-[calc(100svh_-_clamp(64px,6vw,88px)_-_48px)] lg:overflow-y-auto lg:pb-2">
            <BudgetAllocation
              categories={planCategories}
              allocations={allocations}
              suggested={plan.suggested}
              totalBudget={totalBudget}
              guestCount={guestCount}
              onChange={setAllocation}
              onActivate={showVendorsFor}
            />
          </aside>

          <section aria-labelledby="vendors-heading" className="flex min-w-0 flex-col gap-[clamp(32px,4vw,48px)]">
            <h2 id="vendors-heading" className="m-0 font-serif text-[clamp(26px,2.4vw,36px)] leading-tight font-light">
              Vendors within your estimated budget
            </h2>
            {matches.status === 'error' && (
              <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-terracotta">
                <p className="m-0">Vendors couldn't be loaded. Check your connection and try again.</p>
                <button
                  type="button"
                  onClick={matches.retry}
                  className="cursor-pointer border-0 bg-transparent p-0 text-[14px] text-plum underline decoration-rosewood decoration-2 underline-offset-[0.2em] hover:decoration-plum"
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
              />
            ))}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
