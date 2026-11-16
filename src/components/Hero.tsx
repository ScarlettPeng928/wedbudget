import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router';
import { heroTitleIn } from '../animations/heroTitle';
import heroVideo from '../assets/home/hero-1080.mp4';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SCRIPT_LINE = 'Here comes';
const MAIN_LINE = 'the rest of your life';

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  // Paused by the visitor with the button. Only they can undo it.
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);

  // Save battery: pause while the hero is scrolled out of view, resume when it's
  // back. Only a video this observer paused is resumed, so it never starts the
  // video early during the intro (which holds it on its first frame) or overrides
  // the visitor's own pause.
  useEffect(() => {
    const el = video.current;
    const hero = section.current;
    if (!el || !hero) return;
    let pausedForScroll = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !el.paused) {
        el.pause();
        pausedForScroll = true;
      } else if (entry.isIntersecting && pausedForScroll) {
        pausedForScroll = false;
        if (!userPausedRef.current) void el.play().catch(() => {});
      }
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const togglePlayback = () => {
    const el = video.current;
    if (!el) return;
    const pause = !userPaused;
    userPausedRef.current = pause;
    setUserPaused(pause);
    if (pause) el.pause();
    else void el.play().catch(() => {});
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // The intro reveals the title itself; otherwise play it here.
        if (!document.querySelector('.intro-door')) heroTitleIn().delay(0.3);

        // Parallax: the video drifts at half the scroll speed, so it feels farther
        // away than the page, while the title fades out as it scrolls off.
        const scrollOut = { trigger: section.current, start: 'top top', end: 'bottom top', scrub: true };
        gsap.to('.hero-video', {
          y: () => (section.current?.offsetHeight ?? 0) * 0.5,
          ease: 'none',
          scrollTrigger: { ...scrollOut, invalidateOnRefresh: true },
        });
        // Darken the video as it leaves: 30% shade at rest, about 60% by the end.
        gsap.to('.hero-dim', { opacity: 0.45, ease: 'none', scrollTrigger: scrollOut });
        gsap.to(content.current, { autoAlpha: 0, ease: 'power1.in', scrollTrigger: { ...scrollOut, end: 'bottom 30%' } });

        // A soft light glides across the title twice, like light on gold foil, then rests.
        gsap
          .timeline({ repeat: 1, repeatDelay: 5, delay: 4.5 })
          .fromTo(
            '.hero-shimmer',
            { backgroundPosition: '100% 0' },
            { backgroundPosition: '0% 0', duration: 1.8, stagger: 0.12, ease: 'power2.inOut' },
          );
      });
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      className="hero-media relative isolate flex min-h-[max(560px,100svh)] items-end justify-center overflow-hidden bg-ink"
      aria-labelledby="hero-title"
    >
      <video
        ref={video}
        className="hero-video absolute inset-0 -z-20 h-full w-full object-cover will-change-transform"
        src={heroVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      {/* Shade where the title sits, fading out towards the top: the title stays readable
          over the white-dress shots, while faces and trees above keep their light. */}
      <div
        className="absolute inset-0 -z-10 bg-linear-to-t from-black/55 via-black/20 via-45% to-black/10"
        aria-hidden="true"
      />
      {/* Extra shade that deepens as the hero scrolls away. */}
      <div className="hero-dim absolute inset-0 -z-10 bg-black opacity-0" aria-hidden="true" />

      <div ref={content} className="px-4 pb-[clamp(56px,12vh,140px)] text-center text-canvas">
        {/* Fades out as the hero scrolls away. */}
        <div className="flex flex-col items-center">
          <h1 id="hero-title" aria-label={`${SCRIPT_LINE} ${MAIN_LINE}.`} className="m-0 font-light text-champagne">
            {/* A small handwritten line tucked over a large upright one, like a
                wedding invitation: the script carries the feeling, the roman the statement.
                The script overlaps the main line slightly so the two read as one lockup. */}
            {/* The script size sits on this outer span so the negative margin (in em)
                scales with the script, not with the page's base font size. */}
            <span aria-hidden="true" className="relative z-10 mb-[-0.6em] block font-script text-[clamp(28px,3.8vw,56px)] leading-none">
              <span className="hero-script hero-ink hero-shimmer inline-block px-[0.4em] py-[0.15em]">
                {SCRIPT_LINE}
              </span>
            </span>
            <span aria-hidden="true" className="block">
              <span className="hero-main hero-veil hero-shimmer inline-block px-[0.1em] py-[0.12em] font-serif text-[clamp(32px,9.5vw,112px)] leading-[1.1] whitespace-nowrap">
                {MAIN_LINE}
              </span>
            </span>
          </h1>

          <div className="mt-[clamp(32px,5vh,56px)]">
            <Link
              to="/plan"
              className="hero-cta inline-block rounded-lg border border-canvas/70 px-[clamp(16px,1.6vw,24px)] py-[clamp(8px,0.8vw,11px)] font-serif text-[clamp(12px,0.9vw,14px)] tracking-[0.06em] text-canvas uppercase no-underline transition-[background-color,color,border-color,letter-spacing] duration-700 ease-out hover:border-canvas hover:bg-canvas hover:tracking-[0.14em] hover:text-ink focus-visible:bg-canvas focus-visible:tracking-[0.14em] focus-visible:text-ink motion-reduce:transition-colors"
            >
              Plan my wedding
            </Link>
          </div>
        </div>
      </div>

      {/* Moving video that loops forever must be pausable (WCAG 2.2.2). */}
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={userPaused ? 'Play background video' : 'Pause background video'}
        className="absolute right-[clamp(16px,3vw,48px)] bottom-[clamp(16px,3vh,32px)] flex size-10 cursor-pointer items-center justify-center rounded-lg border border-canvas/50 bg-transparent text-canvas transition-colors hover:border-canvas hover:bg-canvas/10"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
          {userPaused ? <path d="M4.5 2.5v11l9-5.5z" /> : <path d="M4 2.5h2.5v11H4zM9.5 2.5H12v11H9.5z" />}
        </svg>
      </button>
    </section>
  );
}
