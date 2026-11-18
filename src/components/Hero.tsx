import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router';
import { heroTitleIn } from '../animations/heroTitle';
import { SCROLL_SCRUB } from '../animations/ease';
import { useBackgroundVideo } from '../hooks/useBackgroundVideo';
import heroVideo from '../assets/home/grass_walk_1x_zoom_centered.mp4';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { userPaused, toggle: togglePlayback } = useBackgroundVideo(section, video);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // The intro reveals the title itself; otherwise play it here.
        if (!document.querySelector('.intro-door')) heroTitleIn().delay(0.3);

        // The section is taller than the screen and the frame inside it is sticky,
        // so the video holds still for the extra height. Over that stretch the title
        // and button sink from the middle of the screen down to the bottom edge;
        // once there, the frame lets go and scrolls away with them.
        gsap.to(content.current, {
          y: () => {
            const frameHeight = frame.current?.clientHeight ?? 0;
            const contentHeight = content.current?.offsetHeight ?? 0;
            const bottomGap = Math.min(Math.max(96, frameHeight * 0.14), 140);
            return (frameHeight - contentHeight) / 2 - bottomGap;
          },
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: SCROLL_SCRUB,
            invalidateOnRefresh: true,
          },
        });

        // Meanwhile the video eases back from a slight zoom, so the screen visibly
        // answers the first scrolls. It scales a wrapper, not the video itself,
        // because the intro animates the video's own scale when the doors open.
        gsap.fromTo(
          '.hero-zoom',
          { scale: 1.08 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom bottom', scrub: SCROLL_SCRUB },
          },
        );
      });
    },
    { scope: section },
  );

  return (
    // Reduced motion: no sinking title, so no extra scroll height either.
    <section ref={section} data-header-tone="dark" className="hero-media relative h-[200svh] bg-plum motion-reduce:h-auto" aria-labelledby="hero-title">
      <div ref={frame} className="sticky top-0 isolate h-svh min-h-[560px] overflow-hidden">
        <div className="hero-zoom absolute inset-0 -z-20 will-change-transform">
          <video
            ref={video}
            // Color grade: a little less saturation and a touch of warmth, so the green
            // field leans toward the page's warm palette without losing its life.
            className="hero-video h-full w-full object-cover [filter:saturate(0.85)_sepia(0.15)]"
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
            preload="auto"
            aria-hidden="true"
          />
        </div>
        {/* Shade: clear at the top, deepening to plum at the bottom, at 50% strength.
            Plum rather than black, so the video's shadows lean toward the page's color. */}
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-transparent to-plum opacity-50" aria-hidden="true" />
        {/* A light shade behind the header, so its small text reads over bright frames. */}
        <div
          className="absolute inset-x-0 top-0 -z-10 h-[clamp(120px,18vh,200px)] bg-linear-to-b from-black/30 to-transparent"
          aria-hidden="true"
        />
        {/* The bottom edge always fades into solid plum, the story's background, so the
            two sections never meet at a hard line. It sits below the sunk title. */}
        <div
          className="absolute inset-x-0 bottom-0 -z-10 h-[clamp(72px,12vh,120px)] bg-linear-to-b from-transparent to-plum"
          aria-hidden="true"
        />

        {/* Same side gutter and 1440px cap as the header, so the title lines up with
            the menu button and the button with "Plan my wedding" on any screen. */}
        <div className="flex h-full items-center px-[clamp(16px,3vw,48px)]">
          <div
            ref={content}
            className="mx-auto flex w-full max-w-[1440px] flex-col gap-[clamp(32px,6vh,56px)] text-sand md:flex-row md:items-end md:justify-between"
          >
            <div>
              <h1 id="hero-title" className="m-0 font-serif text-display font-light">
                <span className="hero-line hero-veil block">
                  <em>Your</em> <strong className="font-semibold">budget,</strong>
                </span>
                <span className="hero-line hero-veil block">
                  <em>beautifully planned.</em>
                </span>
              </h1>
              <p className="hero-sub mt-[clamp(16px,2.4vh,24px)] mb-0 font-sans text-lead font-light tracking-[0.05em] text-pretty">
                Start with your budget. Find the vendors that fit it.
              </p>
            </div>

            <Link
              to="/plan"
              className="hero-cta group inline-flex items-center gap-[0.4em] self-start border-b border-sand pb-[0.15em] font-serif text-title leading-none font-light text-sand italic no-underline md:self-auto"
            >
              Begin my plan
              {/* Thin line arrow pointing down-right. Sized in em so it scales with the text;
                  stroke follows the text color (currentColor). */}
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-[0.85em] shrink-0 transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:translate-y-1 motion-reduce:transition-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 5 19 19M19 8v11H8" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Moving video that loops forever must be pausable (WCAG 2.2.2).
            Its right edge follows the content's: the gutter, or the 1440px cap on wide screens. */}
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={userPaused ? 'Play background video' : 'Pause background video'}
          className="absolute right-[max(clamp(16px,3vw,48px),calc((100%-1440px)/2))] bottom-[clamp(16px,3vh,32px)] flex size-10 cursor-pointer items-center justify-center rounded-lg border border-sand/50 bg-transparent text-sand transition-colors hover:border-sand hover:bg-sand/10"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
            {userPaused ? <path d="M4.5 2.5v11l9-5.5z" /> : <path d="M4 2.5h2.5v11H4zM9.5 2.5H12v11H9.5z" />}
          </svg>
        </button>
      </div>
    </section>
  );
}
