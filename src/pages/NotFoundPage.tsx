import { useEffect } from 'react';
import { Link } from 'react-router';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

// Any address without a page, including links to pages that aren't built yet.
export default function NotFoundPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Page not found · WedBudget';
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-[clamp(16px,3vw,48px)] pt-[clamp(64px,6vw,88px)] text-center">
        <h1 className="m-0 max-w-[18ch] font-serif text-display font-light">
          This page doesn’t exist yet
        </h1>
        <Link
          to="/"
          className="inline-block rounded-lg border border-plum px-[clamp(16px,1.6vw,24px)] py-[clamp(10px,1vw,14px)] font-sans text-label tracking-[0.05em] text-plum uppercase no-underline transition-colors hover:bg-plum hover:text-cream"
        >
          Back to home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
