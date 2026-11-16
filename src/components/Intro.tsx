import { useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { heroTitleIn } from '../animations/heroTitle';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Rendered twice, once per door; each door's clipping panel shows one half.
// Placeholder until the real logo is designed.
function Wordmark({ className }: { className: string }) {
  return (
    <div className={`absolute top-1/2 -translate-y-1/2 ${className}`}>
      <span className="intro-wordmark block px-[0.15em] py-[0.25em] font-display text-[clamp(44px,5vw,80px)] leading-none whitespace-nowrap text-ink uppercase">
        WedBudget
      </span>
    </div>
  );
}

const MEDIA_TIMEOUT = 6000;

// Plays on every full page load (a reload resets this module), but not again when
// navigating back to the home page inside the app. Skipped for reduced motion.
let playedThisLoad = false;

function shouldSkipIntro() {
  return playedThisLoad || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Intro() {
  const [done, setDone] = useState(shouldSkipIntro);

  useGSAP(() => {
    if (done) return;

    const root = document.documentElement;
    const video = document.querySelector<HTMLVideoElement>('.hero-video');
    root.style.overflow = 'hidden';
    // Always start from the top. Browsers restore the old scroll position on
    // reload, sometimes after this runs, so snap back whenever the page moves
    // while the intro is up (the visitor can't scroll it themselves meanwhile).
    history.scrollRestoration = 'manual';
    const toTop = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    toTop();
    window.addEventListener('scroll', toTop);
    // Hold the video on its first frame until the doors open.
    video?.pause();

    // Wait for the hero video before opening, but never longer than MEDIA_TIMEOUT.
    let mediaReady = !video || video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
    let waiting = false;
    const onMediaReady = () => {
      if (mediaReady) return;
      mediaReady = true;
      if (waiting) tl.play();
    };
    video?.addEventListener('canplay', onMediaReady);
    const timeout = window.setTimeout(onMediaReady, MEDIA_TIMEOUT);

    // Any click, key or scroll attempt jumps straight to the doors opening.
    const skipEvents = ['pointerdown', 'keydown', 'wheel'] as const;
    const removeSkip = () => skipEvents.forEach((e) => window.removeEventListener(e, skip));
    const skip = () => {
      removeSkip();
      mediaReady = true;
      if (waiting) tl.play();
      else if (tl.time() < tl.labels.open) tl.seek('open').play();
    };
    skipEvents.forEach((e) => window.addEventListener(e, skip, { passive: true }));

    const finish = () => {
      playedThisLoad = true;
      window.removeEventListener('scroll', toTop);
      toTop();
      root.style.overflow = '';
      removeSkip();
      setDone(true);
      ScrollTrigger.refresh();
    };

    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: finish });

    tl.fromTo(
      '.intro-wordmark',
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut' },
      0.3,
    )
      .call(
        () => {
          if (!mediaReady) {
            waiting = true;
            tl.pause();
          }
        },
        undefined,
        '+=0.25',
      )
      .addLabel('open')
      .call(() => {
        if (video) {
          video.currentTime = 0;
          void video.play().catch(() => {});
        }
      })
      .to('.intro-door', { xPercent: (i) => (i === 0 ? -100 : 100), duration: 1.2 }, 'open')
      // Each door's shadow deepens as it swings away. A gradient strip fading in is
      // cheap to draw; animating box-shadow repaints both full-height doors every frame.
      .fromTo('.intro-shadow', { opacity: 0 }, { opacity: 1, duration: 1.2 }, 'open')
      .from('.hero-video', { scale: 1.2, duration: 1.5 }, 'open')
      .add(heroTitleIn(), 'open+=0.5');

    return () => {
      window.removeEventListener('scroll', toTop);
      root.style.overflow = '';
      removeSkip();
      window.clearTimeout(timeout);
      video?.removeEventListener('canplay', onMediaReady);
    };
  });

  if (done) return null;

  return (
    <div className="fixed inset-0 z-50 cursor-pointer" aria-hidden="true">
      {/* Each door: the panel clips its half of the wordmark; the shadow strip sits
          just past the inner edge, outside the clipping, falling onto the hero. */}
      <div className="intro-door absolute inset-y-0 left-0 w-1/2">
        <div className="absolute inset-0 overflow-hidden bg-canvas">
          <Wordmark className="right-0 translate-x-1/2" />
        </div>
        <div className="intro-shadow absolute inset-y-0 left-full w-16 bg-linear-to-r from-black/30 to-transparent opacity-0" />
      </div>
      <div className="intro-door absolute inset-y-0 right-0 w-1/2">
        <div className="absolute inset-0 overflow-hidden bg-canvas">
          <Wordmark className="left-0 -translate-x-1/2" />
        </div>
        <div className="intro-shadow absolute inset-y-0 right-full w-16 bg-linear-to-l from-black/30 to-transparent opacity-0" />
      </div>
    </div>
  );
}
