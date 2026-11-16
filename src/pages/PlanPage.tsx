import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import PlanForm from '../components/plan/PlanForm';
import { generateBudgetPlan, type PlanRequest } from '../api/plan';
import { fromResult, isAdjusted, loadPlan, savePlan } from '../lib/savedPlan';
import { EASE_OUT } from '../animations/ease';
import planPhoto from '../assets/plan/pexels-rebornfilmes-37711905.jpg';

gsap.registerPlugin(useGSAP);

export default function PlanPage() {
  const navigate = useNavigate();
  const main = useRef<HTMLElement>(null);
  // Coming back via "Edit": start from the saved answers.
  const saved = loadPlan();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Plan your wedding budget · WedBudget';
  }, []);

  // Entrance, once per visit: the photo opens from the middle outwards, like the
  // doors on the home page, then the heading and form settle in beside it.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline()
          .fromTo('.plan-photo', { clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)', duration: 1.2, ease: 'power3.inOut' })
          .fromTo('.plan-photo img', { scale: 1.15 }, { scale: 1, duration: 1.5, ease: 'power3.out' }, 0)
          .fromTo(
            '.plan-intro > *',
            { y: 16, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12, ease: EASE_OUT },
            0.5,
          );
      });
    },
    { scope: main },
  );

  const handleGenerate = async (request: PlanRequest) => {
    savePlan(fromResult(await generateBudgetPlan(request)));
    // `fresh` tells the results page to play its allocation reveal; a reload won't.
    navigate('/plan/results', { state: { fresh: true } });
  };

  return (
    <>
      <SiteHeader showCta={false} />
      {/* At least full viewport height (taller if the form needs it); top padding clears the fixed header. Photo left, form right. */}
      <main ref={main} className="grid min-h-svh grid-rows-[auto_1fr] pt-[clamp(64px,6vw,88px)] lg:grid-cols-2 lg:grid-rows-1">
        <div className="plan-photo relative h-[26svh] overflow-hidden lg:h-full">
          <img src={planPhoto} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_55%]" />
        </div>

        <div className="flex items-center justify-center px-[clamp(16px,4vw,72px)] py-[clamp(40px,6vh,72px)]">
          <div className="plan-intro w-full max-w-[460px]">
            <h1 className="mt-0 mb-[clamp(24px,4vh,40px)] font-serif text-[clamp(36px,3.4vw,56px)] leading-[1.1] font-light">
              Plan your wedding budget
            </h1>
            <PlanForm
              initial={saved?.request}
              onGenerate={handleGenerate}
              // Coming back to change answers: same heads-up as the results page editor.
              note={saved && isAdjusted(saved) ? 'Generating replaces your slider adjustments.' : undefined}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
