import { Link } from 'react-router';

// Quiet closing line on every page. `className` lets a page add room, e.g. for
// the results page's fixed bar on phones.
export default function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`border-t border-line px-[clamp(16px,3vw,48px)] py-[clamp(32px,4vw,56px)] ${className}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="font-display text-[clamp(22px,2vw,28px)] leading-none text-ink uppercase no-underline">
          WedBudget
        </Link>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[14px]">
          <Link to="/plan" className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
            Plan my wedding
          </Link>
          <p className="m-0 text-ink-muted">© 2026 WedBudget</p>
        </div>
      </div>
    </footer>
  );
}
