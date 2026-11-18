import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import { Link } from "react-router";
import { EASE_IN_OUT, SCROLL_SCRUB } from "../animations/ease";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);

// Wedding photos shown full screen behind the closing call to action, one after
// another. To add one: put the file in src/assets/home/, import it at the top of this
// file, and put it in this list in place of `undefined`. Until then each slot shows
// a tone from the palette.
const photos: (string | undefined)[] = [
  undefined,
  undefined,
  undefined,
  undefined,
];
const placeholderTones = [
  "linear-gradient(160deg, var(--color-mauve), var(--color-plum))",
  "linear-gradient(200deg, var(--color-sage), var(--color-plum))",
  "linear-gradient(180deg, var(--color-rosewood), var(--color-plum))",
  "linear-gradient(140deg, var(--color-sand), var(--color-rosewood))",
];

// How long the section holds the screen while the photos change, in screens of
// scrolling.
const PIN_LENGTH = 1.6;

const RING_RADIUS = 49.5;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// Each photo fades in over this much timeline time (one photo = 1).
const FADE = 0.35;

// Desktop with motion allowed. Phones and reduced motion: nothing moves on scroll;
// the ring is already drawn and the thumbnails switch the photo.
const PINNED = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

// Shared by the full-screen photos and their thumbnails.
function PhotoFill({ index }: { index: number }) {
  const photo = photos[index];
  return photo ? (
    <img src={photo} alt="" className="h-full w-full object-cover" />
  ) : (
    <div
      className="h-full w-full"
      style={{ background: placeholderTones[index] }}
    />
  );
}

export default function ClosingGallery() {
  const section = useRef<HTMLElement>(null);
  // The photo on show, which the thumbnails highlight.
  const [active, setActive] = useState(0);
  // The scroll timeline, while it drives the photos (desktop, motion allowed).
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PINNED, () => {
        // The section holds the screen while the scroll walks through the photos:
        // each new photo fades in over the last, settling from a slight zoom, and the
        // thin ring draws itself once around as the whole sequence plays.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: `+=${PIN_LENGTH * 100}%`,
            pin: true,
            anticipatePin: 1,
            scrub: SCROLL_SCRUB,
          },
          // Highlight the thumbnail of the photo that is (more than half) faded in.
          onUpdate: () => {
            const next = Math.min(
              photos.length - 1,
              Math.floor(tl.time() + FADE / 2),
            );
            setActive((prev) => (prev === next ? prev : next));
          },
        });
        const layers = gsap.utils.toArray<HTMLElement>(".gallery-photo");
        // The scroll owns the photos now: every layer gets inline opacity (the first
        // one simply stays shown), and the CSS fade used for thumbnail clicks is
        // switched off so it doesn't lag behind the scroll. Both undo on teardown.
        gsap.set(layers, { transition: "none" });
        gsap.set(layers[0], { autoAlpha: 1 });
        layers.forEach((layer, i) => {
          if (i > 0)
            tl.fromTo(
              layer,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: FADE, ease: "power1.inOut" },
              i - FADE,
            );
          tl.fromTo(
            layer,
            { scale: 1.08 },
            { scale: 1, duration: 1 + FADE },
            Math.max(0, i - FADE),
          );
        });
        tl.fromTo(
          ".gallery-ring",
          { strokeDashoffset: RING_LENGTH },
          { strokeDashoffset: 0, duration: layers.length },
          0,
        );

        timeline.current = tl;
        return () => {
          timeline.current = null;
        };
      });
    },
    { scope: section },
  );

  // A thumbnail click. While the scroll drives the photos, it scrolls to the point
  // where that photo is on show (stopping if the visitor scrolls themselves);
  // otherwise it just switches the photo. contextSafe ties the scroll tween to this
  // component, so leaving the page mid-scroll cancels it.
  const show = contextSafe((index: number) => {
    const tl = timeline.current;
    const trigger = tl?.scrollTrigger;
    if (!tl || !trigger) {
      setActive(index);
      return;
    }
    const time = index === 0 ? 0 : index + 0.2;
    const y =
      trigger.start + (trigger.end - trigger.start) * (time / tl.duration());
    gsap.to(window, {
      scrollTo: { y, autoKill: true },
      duration: 0.9,
      ease: EASE_IN_OUT,
      overwrite: true,
    });
  });

  return (
    <section
      ref={section}
      aria-label="Start planning"
      data-header-tone="dark"
      className="relative isolate flex h-svh min-h-[560px] items-center justify-center overflow-hidden bg-plum px-[clamp(16px,3vw,48px)]"
    >
      {/* The photos, stacked. On scroll, GSAP fades later ones in over earlier ones
          (its inline styles win over these classes); without the scroll sequence, the
          classes show only the active photo. */}
      {photos.map((_, i) => (
        <div
          key={i}
          className={`gallery-photo absolute inset-0 -z-20 transition-opacity duration-700 will-change-transform ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          <PhotoFill index={i} />
        </div>
      ))}
      {/* Plum veil over every photo, so the text reads on light and dark shots alike. */}
      <div className="absolute inset-0 -z-10 bg-plum/40" aria-hidden="true" />

      <div className="relative size-[min(88vw,440px)] md:size-[min(70vh,600px)]">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full -rotate-90 overflow-visible"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="0.25"
            className="stroke-sand/30"
          />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="0.25"
            className="gallery-ring stroke-sand"
            strokeDasharray={RING_LENGTH}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[clamp(24px,4vh,40px)] px-[10%] text-center">
          <p className="m-0 font-serif text-title font-light text-balance text-sand">
            Every dollar of your budget, given a place.
          </p>
          <Link
            to="/plan"
            className="inline-block rounded-lg border border-sand px-[clamp(16px,1.6vw,24px)] py-[clamp(10px,1vw,14px)] font-sans text-label tracking-[0.05em] text-sand uppercase no-underline transition-colors hover:bg-sand hover:text-plum"
          >
            Plan my wedding
          </Link>
        </div>
      </div>

      {/* Thumbnails of the four photos, bottom center. The current one is outlined. */}
      <div className="absolute bottom-[clamp(16px,4vh,40px)] left-1/2 flex -translate-x-1/2 gap-[clamp(8px,1vw,16px)]">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => show(i)}
            aria-label={`Show photo ${i + 1}`}
            aria-pressed={i === active}
            className={`aspect-16/10 w-[clamp(64px,7vw,120px)] cursor-pointer overflow-hidden border-2 bg-transparent p-0 transition-[opacity,border-color] duration-300 ${
              i === active
                ? "border-sand opacity-100"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <PhotoFill index={i} />
          </button>
        ))}
      </div>
    </section>
  );
}
