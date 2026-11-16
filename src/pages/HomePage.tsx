import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Intro from '../components/Intro';
import SiteHeader from '../components/SiteHeader';
import Hero from '../components/Hero';
import Story from '../components/Story';
import BudgetCategories from '../components/BudgetCategories';
import SiteFooter from '../components/SiteFooter';

export default function HomePage() {
  // The web fonts swap in after the scroll animations have measured the page, and
  // Gambetta wraps the Story text differently from the fallback font. Measure again
  // once every font has loaded, so the pinned sections start and end where they should.
  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => {
      if (active) ScrollTrigger.refresh();
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Intro />
      <SiteHeader autoHide />
      <main>
        <Hero />
        <Story />
        <BudgetCategories />
      </main>
      <SiteFooter />
    </>
  );
}
