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
  onChange,
  onActivate,
}: {
  category: PlanCategory;
  amount: number;
  max: number;
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
        <div className="flex items-center gap-1 rounded-lg border border-line px-3 py-1 transition-colors focus-within:border-ink">
          <span className="text-[14px] text-ink-muted">NT$</span>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={withCommas(String(amount))}
            onChange={(e) => onChange(Number(digitsOnly(e.target.value)))}
            className="w-[9ch] border-0 bg-transparent p-0 text-right font-sans text-[15px] text-ink tabular-nums outline-none"
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
    </div>
  );
}

export default function BudgetAllocation({
  categories,
  allocations,
  suggested,
  totalBudget,
  onChange,
  onActivate,
}: BudgetAllocationProps) {
  const categoriesTotal = categories.reduce((sum, c) => sum + (allocations[c.slug] ?? 0), 0);
  // The plan allocates the whole budget; only slider changes can push it over.
  const overBy = categoriesTotal - totalBudget;
  const over = overBy > 0;

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
              onChange={(value) => onChange(category.slug, value)}
              onActivate={onActivate && (() => onActivate(category.slug))}
            />
          );
        })}
      </div>

      <dl className="m-0 rounded-lg border border-line px-5 py-4 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Categories total</dt>
          <dd className="m-0 tabular-nums">{formatNT(categoriesTotal)}</dd>
        </div>
        <div className="mt-2 flex justify-between">
          <dt className="text-ink-muted">Your total budget</dt>
          <dd className="m-0 tabular-nums">{formatNT(totalBudget)}</dd>
        </div>
        {over && (
          <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-line pt-3">
            <dt className="flex items-center gap-1.5 font-medium text-warning">
              <WarningIcon />
              Over by
            </dt>
            <dd className="m-0 font-serif text-[20px] text-warning tabular-nums">{formatNT(overBy)}</dd>
          </div>
        )}
      </dl>

      {/* Phones: the summary sits below six sliders, so if dragging pushes the plan
          over budget, keep the warning in view. Same numbers as the summary above,
          so screen readers skip it. */}
      {over && (
        <div
          aria-hidden="true"
          className="fixed inset-x-0 bottom-0 z-30 flex items-baseline justify-between border-t border-line bg-canvas px-[clamp(16px,3vw,48px)] py-3 lg:hidden"
        >
          <span className="flex items-center gap-1.5 text-[15px] font-medium text-warning">
            <WarningIcon />
            Over by
          </span>
          <span className="font-serif text-[18px] text-warning tabular-nums">{formatNT(overBy)}</span>
        </div>
      )}
    </section>
  );
}
