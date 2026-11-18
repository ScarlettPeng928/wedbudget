import { Link } from "react-router";
import { budgetCategories } from "../data/budgetCategories";

const linkClass =
  "text-small text-sand no-underline decoration-1 underline-offset-4 hover:underline";

// Closing block on every page, in plum: the brand, the way into planning, every vendor
// category, and the copyright. `className` lets a page add room, e.g. for the results
// page's fixed bar on phones. Marked dark so the see-through header turns sand over it.
export default function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      data-header-tone="dark"
      className={`border-t border-sand/20 bg-plum px-[max(clamp(16px,3vw,48px),calc((100%-1440px)/2))] pt-[clamp(56px,8vh,96px)] pb-[clamp(24px,4vh,40px)] text-sand ${className}`}
    >
      {/* Phones: stacked. Desktop: the brand on the left, the link columns on the right. */}
      <div className="flex flex-col gap-[clamp(40px,6vh,56px)] md:flex-row md:justify-between">
        <div>
          <Link
            to="/"
            className="font-display text-[clamp(26px,2.4vw,36px)] leading-none tracking-[0.05em] text-sand uppercase no-underline"
          >
            WedBudget
          </Link>
          <p className="mt-4 mb-0 max-w-[28ch] font-sans text-small text-sand/70">
            Your budget, beautifully planned.
          </p>
        </div>

        <nav aria-label="Footer" className="flex gap-[clamp(48px,8vw,128px)]">
          <div>
            <h2 className="mt-0 mb-4 font-sans text-label font-normal tracking-[0.05em] text-sand/75 uppercase">
              Plan
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              <li>
                <Link to="/plan" className={linkClass}>
                  Plan my wedding
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mt-0 mb-4 font-sans text-label font-normal tracking-[0.05em] text-sand/75 uppercase">
              Vendors
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {budgetCategories.map((category) => (
                <li key={category.slug}>
                  <Link to={`/vendors/${category.slug}`} className={linkClass}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <p className="mt-[clamp(48px,8vh,80px)] mb-0 border-t border-sand/20 pt-[clamp(16px,2.5vh,24px)] font-sans text-small text-sand/75">
        © 2026 WedBudget. All rights reserved.
      </p>
    </footer>
  );
}
