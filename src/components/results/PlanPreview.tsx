import { planCategories } from '../../data/planCategories';
import { VendorCardSkeleton } from '../VendorCard';

// Before there's a plan: a faint outline of what the answers will bring, in the
// same columns as the plan itself. The six categories, bars sized by share, on the
// left, a row of vendor cards on the right. No words needed to say what the form
// is for; generating fills these places with the real plan.
export default function PlanPreview({ className }: { className: string }) {
  const largest = Math.max(...planCategories.map((c) => c.share));
  return (
    <div className={className} aria-hidden="true">
      <div className="flex min-w-0 flex-col gap-5">
        <p className="m-0 font-serif text-heading font-light text-cocoa/50">Budget allocation</p>
        <ul className="m-0 flex list-none flex-col gap-5 p-0">
          {planCategories.map((category) => (
            <li key={category.slug}>
              {/* Names and bars only: the plan itself shows amounts, not shares. */}
              <p className="m-0 text-lead text-cocoa/60">{category.name}</p>
              {/* Bar length follows the share, the largest filling the row. */}
              <div className="mt-2.5 h-1.5 rounded-full bg-sand/40">
                <div className="h-full rounded-full bg-sand" style={{ width: `${(category.share / largest) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden min-w-0 flex-col gap-5 lg:flex">
        <p className="m-0 font-serif text-heading font-light text-cocoa/50">
          Vendors that fit your budget
        </p>
        <div className="grid grid-cols-3 gap-4 opacity-60">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <VendorCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
