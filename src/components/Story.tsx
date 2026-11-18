import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useBackgroundVideo } from "../hooks/useBackgroundVideo";
import { SCROLL_SCRUB } from "../animations/ease";
import storyVideo from "../assets/home/hero-1080.mp4";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// One sentence per line, like a short letter. Words between *stars* are the key
// words: set upright and bold inside the light italic, like "budget," in the hero.
const lines = [
  "Every love story deserves its *own day.*",
  "The venue. The dress. The light.",
  "A hundred little choices,",
  "and every one should feel like *yours.*",
];

// How long the section holds the screen, in screens of scrolling.
const PIN_LENGTH = 2;
// The words start to light up a little before the hold, when the section's top is
// this far down the screen (0.2 = 20%). Bigger starts earlier, smaller later.
const REVEAL_START = 0.2;

// Each word is its own span so the scroll can light them up one by one, rosewood to sand.
function Words({ text }: { text: string }) {
  let bold = false;
  return text.split(" ").map((raw, i) => {
    // A word starting with * opens a bold run; one ending with * closes it.
    if (raw.startsWith("*")) bold = true;
    const word = raw.replace(/\*/g, "");
    const isBold = bold;
    if (raw.endsWith("*")) bold = false;
    return (
      <span key={i}>
        {i > 0 && " "}
        <span
          className={`story-word text-rosewood motion-reduce:text-sand ${isBold ? "font-semibold not-italic" : ""}`}
        >
          {word}
        </span>
      </span>
    );
  });
}

export default function Story() {
  const section = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  // Pauses the video while the story is off screen.
  useBackgroundVideo(section, video);

  useGSAP(
    () => {
      // Reduced motion: no hold, the words are simply lit and the video stays in its
      // small frame (motion-reduce classes below). matchMedia also undoes all of this
      // if the setting changes while the page is open.
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const sand = getComputedStyle(document.documentElement)
          .getPropertyValue("--color-sand")
          .trim();

        // Once the section fills the screen it holds there while the story plays out.
        const pin = ScrollTrigger.create({
          trigger: section.current,
          start: "top top",
          end: `+=${PIN_LENGTH * 100}%`,
          pin: true,
          // On a fast scroll, get ready to pin a moment early so the switch doesn't jump.
          anticipatePin: 1,
        });

        // How the video grows, smoothly even on slower devices: rather than resizing it
        // every frame (which makes the browser redo the page layout), the video box is
        // always full-screen size, and only two cheap properties change:
        // - transform (translate + uniform scale) shrinks it to the small frame's height
        //   and moves it into place, so the picture is never stretched,
        // - clip-path trims the sides (or top and bottom) down to the frame's shape.
        // `slide` moves the small frame up from its corner (in px, negative = higher);
        // `grow` goes from 0 (small frame) to 1 (full screen).
        const state = { slide: 0, grow: 0 };
        let box = { x: 0, y: 0, w: 0, h: 0 }; // the full screen, relative to the slot
        let frame = { w: 0, h: 0 }; // the small frame
        let slideFrom = 0; // where the slide starts: one gutter below the section's top

        const measure = () => {
          const s = section.current!.getBoundingClientRect();
          const f = slot.current!.getBoundingClientRect();
          const gutter = parseFloat(
            getComputedStyle(section.current!).paddingLeft,
          );
          box = {
            x: s.left - f.left,
            y: s.top - f.top,
            w: s.width,
            h: s.height,
          };
          frame = { w: f.width, h: f.height };
          slideFrom = s.top + gutter - f.top;
          gsap.set(media.current, {
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            transformOrigin: "0 0",
          });
        };

        const render = () => {
          const { slide, grow } = state;
          const lerp = (a: number, b: number) => a + (b - a) * grow;
          // Scale that makes the full-screen box just cover the small frame.
          const k0 = Math.max(frame.w / box.w, frame.h / box.h);
          const k = lerp(k0, 1);
          // Size and center of the visible area, small frame -> full screen.
          const visW = lerp(frame.w, box.w);
          const visH = lerp(frame.h, box.h);
          const cx = lerp(frame.w / 2, box.x + box.w / 2);
          const cy = lerp(frame.h / 2 + slide, box.y + box.h / 2);
          const x = cx - (box.w * k) / 2 - box.x;
          const y = cy - (box.h * k) / 2 - box.y;
          // clip-path works in the box's own (unscaled) pixels.
          const insetX = Math.max(0, (box.w - visW / k) / 2);
          const insetY = Math.max(0, (box.h - visH / k) / 2);
          const el = media.current!;
          el.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
          el.style.clipPath = `inset(${insetY}px ${insetX}px)`;
        };

        // The story, scrubbed by the scroll:
        // 1. the small video starts at the top of the section and slides straight down
        //    to its bottom-left corner while the words light up one by one,
        // 2. a short beat once every word is lit,
        // 3. the video grows from the corner to fill the screen, while the words fade
        //    out so none are left half covered,
        // 4. a short rest at full screen before the section lets go.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: render,
          scrollTrigger: {
            trigger: section.current,
            start: `top ${REVEAL_START * 100}%`,
            end: () => `+=${window.innerHeight * (REVEAL_START + PIN_LENGTH)}`,
            scrub: SCROLL_SCRUB,
            invalidateOnRefresh: true,
            // Sizes change with the window: measure again, then redraw where we are.
            onRefresh: () => {
              measure();
              render();
            },
          },
        });
        measure();
        gsap.utils.toArray<HTMLElement>(".story-word").forEach((word) => {
          tl.to(word, { color: sand, duration: 0.6 }, "<0.35");
        });
        const wordsTime = tl.duration();
        tl.fromTo(
          state,
          { slide: () => slideFrom },
          { slide: 0, duration: wordsTime, ease: "power1.inOut" },
          0,
        )
          .addLabel("grow", `+=${wordsTime * 0.25}`)
          .to(
            state,
            { grow: 1, duration: wordsTime * 1.4, ease: "power2.inOut" },
            "grow",
          )
          .to(
            ".story-copy",
            { autoAlpha: 0, duration: wordsTime * 0.5, ease: "power1.in" },
            "grow",
          )
          .to({}, { duration: wordsTime * 0.3 });
        render();

        // As the section lets go and slides up, the video blurs and a dark veil comes
        // over it. The video scales up slightly with the blur so its soft edges stay
        // outside the frame.
        const leaving = {
          trigger: section.current,
          start: () => pin.end,
          end: () => pin.end + window.innerHeight,
          scrub: SCROLL_SCRUB,
          invalidateOnRefresh: true,
        };
        gsap.fromTo(
          video.current,
          { filter: "blur(0px)", scale: 1 },
          {
            filter: "blur(14px)",
            scale: 1.08,
            ease: "none",
            scrollTrigger: leaving,
          },
        );
        gsap.fromTo(
          ".story-veil",
          { opacity: 0 },
          { opacity: 0.55, ease: "none", scrollTrigger: leaving },
        );

        // The transform and clip-path above are set by hand, so undo them by hand too
        // when this setup is torn down (reduced motion switched on, or leaving the page).
        return () => {
          media.current?.style.removeProperty("transform");
          media.current?.style.removeProperty("clip-path");
        };
      });
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      aria-label="Our story"
      data-header-tone="dark"
      className="relative flex min-h-svh items-center overflow-hidden bg-plum px-[clamp(16px,3vw,48px)] py-[clamp(96px,16vh,180px)]"
    >
      {/* Fills the screen with the content centered vertically. Same 1440px cap as the
          header and hero, so the edges line up down the page. */}
      <div className="mx-auto grid w-full max-w-[1440px] gap-[clamp(48px,8vh,80px)] md:grid-cols-[1fr_2fr] md:items-end">
        {/* Text first in the markup, so phones read it before the video. */}
        <div className="md:col-start-2 md:row-start-1">
          <p className="story-copy m-0 font-serif text-statement font-light italic">
            {lines.map((line) => (
              <span key={line} className="block">
                <Words text={line} />
              </span>
            ))}
          </p>
        </div>

        {/* The small frame. Desktop: its place is the section's bottom-left corner, one
            gutter in from both edges (on wide screens, in line with the 1440px content);
            the video starts at the top and slides down into it.
            Phones: below the text, on the right. The video inside is positioned from
            this frame, so it can grow past it over the whole section. */}
        <div
          ref={slot}
          className="relative z-10 aspect-3/4 w-[clamp(140px,14vw,200px)] justify-self-end md:absolute md:bottom-[clamp(16px,3vw,48px)] md:left-[max(clamp(16px,3vw,48px),calc((100%-1440px)/2))]"
        >
          <div
            ref={media}
            className="absolute top-0 left-0 h-full w-full overflow-hidden bg-rosewood will-change-transform"
          >
            <video
              ref={video}
              className="h-full w-full object-cover"
              src={storyVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
            {/* Color grade: plum blended in with soft-light, so the footage's shadows turn
                wine-red and its sky a soft rose, matching the plum page around it. */}
            <div
              className="pointer-events-none absolute inset-0 bg-plum opacity-40 mix-blend-soft-light"
              aria-hidden="true"
            />
            {/* Darkens the video as the section slides away. */}
            <div
              className="story-veil pointer-events-none absolute inset-0 bg-black opacity-0"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
