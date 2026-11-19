import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Link } from "react-router";
import { budgetCategories } from "../data/budgetCategories";
import { SCROLL_SCRUB } from "../animations/ease";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Desktop with motion allowed: the section holds the screen while the vertical
// scroll slides the row of cards sideways; once the last card is in view it lets go
// and the page scrolls on. Phones: a plain grid, two cards a row, scrolled down
// with the page (the max-md: classes below). Desktop with reduced motion: an ordinary row you swipe or
// scroll sideways.
const PINNED = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

export default function CategoryCards() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PINNED, () => {
        // How far the row has to travel so its last card ends at the right gutter.
        const distance = () =>
          Math.max(
            0,
            track.current!.scrollWidth - section.current!.clientWidth,
          );

        // Hold the screen for the sideways travel only; after that the section
        // scrolls up and away normally.
        ScrollTrigger.create({
          trigger: section.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        });
        // The row slides left exactly as far as the page scrolls.
        const slide = gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: SCROLL_SCRUB,
            invalidateOnRefresh: true,
          },
        });

        // Everything below rides on that same sideways slide (containerAnimation),
        // so it moves in step with the cards, scrubbed by the scroll.

        gsap.utils.toArray<HTMLElement>(".cat-card").forEach((card) => {
          const photo = card.querySelector(".cat-photo");

          // Focus: once past the middle, heading off to the left, it steps back:
          // fainter and a little smaller. The cards still to come stay clear, the
          // last one included (it stops at the right edge, never reaching the middle).
          gsap.fromTo(
            card,
            { scale: 1, opacity: 1 },
            {
              scale: 0.94,
              opacity: 0.45,
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: card,
                containerAnimation: slide,
                start: "center center",
                end: "right left",
                scrub: true,
              },
            },
          );

          // Parallax: the photo, a little larger than its frame, drifts the other
          // way as the card crosses the screen, like a view through a window.
          if (photo) {
            gsap.fromTo(
              photo,
              { scale: 1.18, xPercent: -6 },
              {
                xPercent: 6,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: slide,
                  start: "left right",
                  end: "right left",
                  scrub: true,
                },
              },
            );
          }
        });
      });

    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      aria-labelledby="categories-title"
      // Oat: the same color as sand at 50%, but solid. HowItWorks below uses it too,
      // so the two read as one sheet.
      className="relative z-10 flex flex-col justify-center overflow-hidden bg-oat py-[clamp(64px,10vh,120px)] md:min-h-svh"
    >
      {/* Side padding matches the header and hero: the gutter, or the 1440px content
          edge on wide screens. Desktop with motion: the first card starts centred on the
          screen, the space to its left empty, and the row slides in from there until
          the last card reaches the right edge. Phones and reduced motion scroll this row
          sideways, snapping each card to the left edge (scroll-padding). */}
      {/* The title stays put, centered, while the cards slide underneath it. */}
      <div className="mb-[clamp(32px,6vh,64px)] px-[max(clamp(16px,3vw,48px),calc((100vw-1440px)/2))] text-center">
        <h2
          id="categories-title"
          className="m-0 font-serif text-title font-light"
        >
          Where your budget goes.
        </h2>
        <p className="mx-auto mt-[clamp(10px,1.4vw,18px)] mb-0 max-w-[46ch] font-sans text-lead text-cocoa text-pretty">
          Six parts, each with its share of your budget.
        </p>
      </div>
      <div className="w-full">
        <ul
          ref={track}
          className="m-0 flex w-full list-none snap-x snap-mandatory gap-[clamp(16px,2vw,32px)] overflow-x-auto px-[max(clamp(16px,3vw,48px),calc((100vw-1440px)/2))] scroll-px-[max(clamp(16px,3vw,48px),calc((100vw-1440px)/2))] [scrollbar-width:none] motion-safe:md:w-max motion-safe:md:snap-none motion-safe:md:overflow-visible motion-safe:md:pl-[calc(50vw-clamp(220px,24vw,360px)/2)] max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-8 max-md:snap-none max-md:overflow-visible"
        >
          {budgetCategories.map((category) => (
            <li
              key={category.slug}
              className="cat-card w-[min(72vw,360px)] shrink-0 snap-start max-md:w-auto md:w-[clamp(220px,24vw,360px)]"
            >
              <Link
                to={`/vendors/${category.slug}`}
                className="group block text-center text-plum no-underline"
              >
                {/* Two layers, two motions: this wrapper zooms on hover, the photo
                    inside drifts with the scroll (parallax). GSAP sets the CSS scale
                    of what it animates to none, so one element can't do both. */}
                <div className="aspect-4/3 overflow-hidden bg-rosewood">
                  {category.cover && (
                    <div className="h-full w-full transition-[scale] duration-500 ease-out group-hover:scale-110 motion-reduce:transition-none">
                      <img
                        src={category.cover}
                        alt=""
                        // A light shared grade (a touch less saturated, a touch warmer, a little dimmer so whites don't outshine the oat) so
                        // photos from different shoots sit together on the oat background.
                        className="cat-photo h-full w-full object-cover saturate-88 sepia-10 brightness-94"
                      />
                    </div>
                  )}
                </div>
                {/* A showcase card: the name as a serif heading and a line about what
                    the category is for (docs/typography.md §7, home category cards). */}
                <div>
                  <p className="mt-[clamp(12px,1.4vw,18px)] mb-0 font-serif text-lead font-light">{category.name}</p>
                  <p className="mx-auto mt-1.5 mb-0 max-w-[30ch] font-sans text-small text-pretty text-cocoa">{category.tagline}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
