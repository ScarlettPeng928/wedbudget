import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router';
import { budgetCategories, type BudgetCategory } from '../data/budgetCategories';
import Photo from './SubcategoryPhoto';
import { EASE_IN_OUT } from '../animations/ease';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);

// Timeline units: each layer holds for HOLD, then wipes away over WIPE.
const HOLD = 1;
const WIPE = 0.35;
const SUBS = 4;

const RING_RADIUS = 49.5;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

type LayerProps = {
  category: BudgetCategory;
  index: number;
  active: number;
  // Hover / focus: show that photo (ignored while the scroll drives the photos).
  onPreview: (sub: number) => void;
  // Click: show that photo, or scroll to it while the scroll drives the photos.
  onSelect: (sub: number) => void;
};

function CategoryLayer({ category, index, active, onPreview, onSelect }: LayerProps) {
  return (
    <article
      className="category-layer relative isolate flex flex-col items-center justify-center gap-10 overflow-hidden bg-ink px-4 py-20 text-canvas lg:min-h-screen lg:pb-[clamp(140px,20vh,200px)] motion-safe:lg:absolute motion-safe:lg:inset-0"
      style={{ zIndex: budgetCategories.length - index }}
      aria-labelledby={`category-${category.slug}`}
    >
      {category.subcategories.map((sub, i) => (
        <div
          key={sub.slug}
          className={`absolute inset-0 -z-20 transition-opacity duration-700 ${i === active ? 'opacity-100' : 'opacity-0'}`}
        >
          <Photo sub={sub} index={i} />
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-black/35" aria-hidden="true" />

      <div className="relative size-[min(88vw,420px)] lg:size-[min(62vh,640px)]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90 overflow-visible" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="0.25"
            className="stroke-champagne/30"
          />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="0.25"
            className="ring-arc stroke-champagne"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - category.share / 100)}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-[13%] text-center">
          <p className="m-0 font-serif text-[clamp(18px,min(1.8vw,3vh),26px)]">
            <span className="ring-value" aria-hidden="true">
              {category.share}%
            </span>
            <span className="sr-only">{category.share}% of your budget</span>
          </p>
          <h2
            id={`category-${category.slug}`}
            className="mt-[clamp(8px,1.5vh,16px)] mb-0 font-serif text-[clamp(36px,min(4.4vw,7.5vh),76px)] leading-[1.05] font-light"
          >
            {category.name}
          </h2>
          <p className="mt-[clamp(12px,2.5vh,24px)] mb-0 max-w-[30ch] text-[clamp(13px,min(1.05vw,1.9vh),16px)] leading-relaxed font-light text-canvas/85">
            {category.tagline}
          </p>
          <Link
            to={`/vendors/${category.slug}`}
            className="group mt-[clamp(20px,5vh,48px)] flex w-[min(100%,280px)] items-center justify-between border-b border-canvas/50 pb-2 text-[clamp(13px,1vw,15px)] tracking-[0.04em] text-canvas no-underline transition-colors hover:border-canvas"
          >
            <span>
              Explore<span className="sr-only"> {category.name}</span>
            </span>
            <span
              className="flex h-6 w-12 items-center justify-center rounded-full bg-canvas text-ink transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 lg:absolute lg:bottom-[clamp(16px,3vh,32px)] lg:flex-nowrap lg:gap-4">
        {category.subcategories.map((sub, i) => (
          <button
            key={sub.slug}
            type="button"
            aria-pressed={i === active}
            onMouseEnter={() => onPreview(i)}
            onFocus={() => onPreview(i)}
            onClick={() => onSelect(i)}
            className={`group cursor-pointer rounded-full border px-3 py-1.5 font-sans text-[13px] transition-colors lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:text-canvas ${
              i === active ? 'border-canvas bg-canvas text-ink' : 'border-canvas/50 bg-transparent text-canvas'
            }`}
          >
            <span
              className={`hidden aspect-16/10 w-[clamp(96px,8.5vw,150px)] overflow-hidden border-2 transition-all lg:block ${
                i === active
                  ? 'border-canvas opacity-100'
                  : 'border-transparent opacity-70 group-hover:opacity-100'
              }`}
            >
              <Photo sub={sub} index={i} decorative />
            </span>
            <span className="block lg:mt-1.5 lg:text-[clamp(11px,0.85vw,13px)] lg:tracking-[0.04em]">
              {sub.name}
            </span>
          </button>
        ))}
      </div>
    </article>
  );
}

export default function BudgetCategories() {
  const container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number[]>(() => budgetCategories.map(() => 0));
  // The scroll timeline, while it drives the photos (desktop, motion allowed).
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const showSub = (layer: number, sub: number) =>
    setActive((prev) => prev.map((value, i) => (i === layer ? sub : value)));

  // Hovering can't change the photo while the scroll owns it: the next scroll
  // tick would switch it straight back.
  const previewSub = (layer: number, sub: number) => {
    if (!timeline.current) showSub(layer, sub);
  };

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const layers = gsap.utils.toArray<HTMLElement>('.category-layer');
        const step = HOLD + WIPE;
        let lastKey = '';

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.categories-stage',
            start: 'top top',
            end: `+=${layers.length * 80}%`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.6,
            // Never come to rest halfway through a wipe, with two layers each half visible.
            // Stopping inside a wipe settles on the nearer side: back to the layer being
            // wiped away, or forward to the next layer once its ring has finished drawing.
            // Stopping anywhere else stays put.
            snap: {
              snapTo: (progress: number) => {
                const total = tl.duration();
                const time = progress * total;
                for (let i = 0; i < layers.length - 1; i++) {
                  const wipeStart = i * step + HOLD;
                  const wipeEnd = (i + 1) * step;
                  if (time > wipeStart && time < wipeEnd) {
                    const back = wipeStart;
                    const forward = wipeEnd + HOLD * 0.6;
                    return (time < (wipeStart + wipeEnd) / 2 ? back : forward) / total;
                  }
                }
                return progress;
              },
              duration: { min: 0.3, max: 0.8 },
              delay: 0.15,
              ease: 'power2.inOut',
            },
          },
          onUpdate: () => {
            // Advance each layer's main image as the scroll moves through its hold.
            const time = tl.time();
            const next = layers.map((_, i) => {
              const local = (time - i * step) / HOLD;
              return Math.min(SUBS - 1, Math.max(0, Math.floor(local * SUBS)));
            });
            const key = next.join();
            if (key !== lastKey) {
              lastKey = key;
              setActive(next);
            }
          },
        });

        layers.forEach((layer, i) => {
          const start = i * step;
          const share = budgetCategories[i].share;
          const counter = { value: 0 };
          const label = layer.querySelector('.ring-value');

          tl.fromTo(
            layer.querySelector('.ring-arc'),
            { strokeDashoffset: RING_LENGTH },
            { strokeDashoffset: RING_LENGTH * (1 - share / 100), duration: HOLD * 0.6, ease: 'power1.out' },
            start,
          );
          tl.to(
            counter,
            {
              value: share,
              duration: HOLD * 0.6,
              ease: 'power1.out',
              onUpdate: () => {
                if (label) label.textContent = `${Math.round(counter.value)}%`;
              },
            },
            start,
          );

          if (i < layers.length - 1) {
            tl.fromTo(
              layer,
              { clipPath: 'inset(0 0 0% 0)' },
              { clipPath: 'inset(0 0 100% 0)', duration: WIPE, ease: 'power2.inOut' },
              start + HOLD,
            );
          }
        });

        // Progress rail: each category's line fills while it is on screen.
        // The last one runs a full HOLD, which also gives the last layer a moment to rest.
        gsap.utils.toArray<HTMLElement>('.rail-fill').forEach((fill, i, fills) => {
          tl.fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: i < fills.length - 1 ? step : HOLD, ease: 'none' }, i * step);
        });

        timeline.current = tl;
        return () => {
          timeline.current = null;
        };
      });
    },
    { scope: container },
  );

  // While the scroll owns the photos, a click scrolls to the point where that
  // photo shows, instead of fighting the scroll position. ScrollToPlugin gives the
  // scroll our own speed and curve, and stops if the visitor scrolls themselves
  // (autoKill). contextSafe ties the tween to this component, so leaving the page
  // mid-scroll cancels it.
  const selectSub = contextSafe((layer: number, sub: number) => {
    const tl = timeline.current;
    const trigger = tl?.scrollTrigger;
    if (!tl || !trigger) {
      showSub(layer, sub);
      return;
    }
    const time = layer * (HOLD + WIPE) + ((sub + 0.5) / SUBS) * HOLD;
    const y = trigger.start + (trigger.end - trigger.start) * (time / tl.duration());
    gsap.to(window, { scrollTo: { y, autoKill: true }, duration: 0.9, ease: EASE_IN_OUT, overwrite: true });
  });

  return (
    <div ref={container}>
      <section
        className="categories-stage relative bg-ink motion-safe:lg:h-screen motion-safe:lg:overflow-hidden"
        aria-label="Budget categories"
      >
        {budgetCategories.map((category, i) => (
          <CategoryLayer
            key={category.slug}
            category={category}
            index={i}
            active={active[i]}
            onPreview={(sub) => previewSub(i, sub)}
            onSelect={(sub) => selectSub(i, sub)}
          />
        ))}

        {/* Where you are among the six categories. Desktop scroll sequence only. */}
        <div
          className="pointer-events-none absolute top-1/2 right-[clamp(16px,3vw,48px)] z-10 hidden -translate-y-1/2 flex-col gap-2 motion-safe:lg:flex"
          aria-hidden="true"
        >
          {budgetCategories.map((category) => (
            <span key={category.slug} className="block h-8 w-px overflow-hidden bg-canvas/30">
              <span className="rail-fill block h-full w-full origin-top bg-canvas" />
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-8 px-[clamp(16px,4.5vw,72px)] py-[clamp(80px,10vw,160px)] text-center">
        <p className="m-0 max-w-[24ch] font-serif text-[clamp(28px,3vw,44px)] leading-[1.2] font-light">
          Every dollar of your budget, given a place.
        </p>
        <Link
          to="/plan"
          className="inline-block rounded-lg border border-ink px-[clamp(16px,1.6vw,24px)] py-[clamp(10px,1vw,14px)] font-serif text-[clamp(13px,1.1vw,16px)] tracking-[0.06em] text-ink uppercase no-underline transition-colors hover:bg-ink hover:text-canvas"
        >
          Plan my wedding
        </Link>
      </section>
    </div>
  );
}
