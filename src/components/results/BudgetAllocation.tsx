import type { CSSProperties } from 'react';
import type { PlanCategory } from '../../data/planCategories';
import { digitsOnly, formatNT, withCommas } from '../../lib/format';

type BudgetAllocationProps = {
  categories: PlanCategory[];
  allocations: Record<string, number>;
  // The allocation as generated, before any adjustments. Sets each slider's range.
  suggested: Record<string, number>;
  totalBudget: number;
  onChange: (slug: string, amount: number) => void;
  // A category's slider was grabbed or focused, before any change.
  onActivate?: (slug: string) => void;
  // Back to the suggested split. Only offered once a slider has been moved.
  onReset?: () => void;
  // The amounts are gliding to new values: totals in between mean nothing yet.
  gliding?: boolean;
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
  suggested,
  onChange,
  onActivate,
}: {
  category: PlanCategory;
  amount: number;
  max: number;
  // The amount the plan suggested, marked on the track.
  suggested: number;
  onChange: (amount: number) => void;
  onActivate?: () => void;
}) {
  const inputId = `amount-${category.slug}`;
  // How much of the slider track is filled, for the CSS gradient.
  const fill = `${Math.min(100, (amount / max) * 100)}%`;
  // Where the suggestion sits. The thumb's centre runs from half a thumb in from
  // each end, so the tick is placed the same way to line up with it.
  const tick = Math.min(1, suggested / max);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={inputId} className="font-sans text-lead">
          {category.name}
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-sand px-3 py-1 transition-colors focus-within:border-plum">
          <span className="text-small text-cocoa">NT$</span>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={withCommas(String(amount))}
            onChange={(e) => onChange(Number(digitsOnly(e.target.value)))}
            className="w-[9ch] border-0 bg-transparent p-0 text-right font-sans text-input text-plum tabular-nums outline-none"
          />
        </div>
      </div>
      {/* The tick sits under the slider: it shows as a notch above and below the
          track, and the thumb covers it when the amount is back on the suggestion. */}
      <div className="relative mt-1">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 h-[14px] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-plum/35"
          style={{ left: `calc(11px + (100% - 22px) * ${tick})` }}
        />
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
          aria-valuetext={amount === suggested ? `${formatNT(amount)}, as suggested` : `${formatNT(amount)}, suggested ${formatNT(suggested)}`}
          className="budget-range relative"
          style={{ '--fill': fill } as CSSProperties}
        />
      </div>
    </div>
  );
}

export default function BudgetAllocation({ categories, allocations, suggested, totalBudget, onChange, onActivate, onReset, gliding = false }: BudgetAllocationProps) {
  const categoriesTotal = categories.reduce((sum, c) => sum + (allocations[c.slug] ?? 0), 0);
  // The plan allocates the whole budget; only slider changes can push it over.
  const overBy = categoriesTotal - totalBudget;
  const over = overBy > 0;
  // Money not given to any category yet (sliders moved down). Not while gliding.
  const unallocated = gliding ? 0 : Math.max(0, totalBudget - categoriesTotal);
  return (
    <section aria-labelledby="allocation-heading" className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="allocation-heading" className="m-0 font-serif text-heading font-light">
          Budget allocation
        </h2>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer border-0 bg-transparent p-0 text-body text-plum underline decoration-rosewood decoration-1 underline-offset-[0.2em] hover:decoration-plum"
          >
            Reset
            <span className="sr-only"> to the suggested allocation</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {categories.map((category) => {
          const amount = allocations[category.slug] ?? 0;
          return (
            <CategoryRow
              key={category.slug}
              category={category}
              amount={amount}
              max={sliderMax(suggested[category.slug] ?? 0, amount, totalBudget)}
              suggested={suggested[category.slug] ?? 0}
              onChange={(value) => onChange(category.slug, value)}
              onActivate={onActivate && (() => onActivate(category.slug))}
            />
          );
        })}
      </div>

      <dl className="m-0 rounded-lg border border-sand px-5 py-4 text-body">
        {/* What the categories add up to, against the whole budget, in one line. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <dt className="text-cocoa">Allocated</dt>
          <dd className="m-0 tabular-nums">
            <span className="text-plum">{formatNT(categoriesTotal)}</span>
            <span className="text-cocoa"> of {formatNT(totalBudget)}</span>
            {/* Only when there's a gap: money left over here, or over budget below. */}
            {unallocated > 0 && (
              <span className="mt-1 block text-right text-small text-cocoa">{formatNT(unallocated)} unallocated</span>
            )}
          </dd>
        </div>
        {over && (
          <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-sand pt-3">
            <dt className="flex items-center gap-1.5 font-medium text-terracotta">
              <WarningIcon />
              Over by
            </dt>
            <dd className="m-0 font-sans text-lead font-medium text-terracotta tabular-nums">{formatNT(overBy)}</dd>
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
          <span className="flex items-center gap-1.5 text-body font-medium text-terracotta">
            <WarningIcon />
            Over by
          </span>
          <span className="font-sans text-lead font-medium text-terracotta tabular-nums">{formatNT(overBy)}</span>
        </div>
      )}
    </section>
  );
}
