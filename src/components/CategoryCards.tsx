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
// and the page scrolls on. Phones and reduced motion: an ordinary row you swipe or
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
        gsap.to(track.current, {
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
      className="flex flex-col justify-center overflow-hidden bg-oat py-[clamp(64px,10vh,120px)] md:min-h-svh"
    >
      {/* Side padding matches the header and hero: the gutter, or the 1440px content
          edge on wide screens. Desktop with motion: the first card starts at the middle
          of the screen, the left half left empty, and the row slides in from there until
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
          className="m-0 flex w-full list-none snap-x snap-mandatory gap-[clamp(16px,2vw,32px)] overflow-x-auto px-[max(clamp(16px,3vw,48px),calc((100vw-1440px)/2))] scroll-px-[max(clamp(16px,3vw,48px),calc((100vw-1440px)/2))] [scrollbar-width:none] motion-safe:md:w-max motion-safe:md:snap-none motion-safe:md:overflow-visible motion-safe:md:pl-[50vw]"
        >
          {budgetCategories.map((category) => (
            <li
              key={category.slug}
              className="w-[min(72vw,360px)] shrink-0 snap-start md:w-[clamp(220px,24vw,360px)]"
            >
              <Link
                to={`/vendors/${category.slug}`}
                className="group block text-center text-plum no-underline"
              >
                <div className="aspect-4/3 overflow-hidden bg-rosewood">
                  {category.cover && (
                    <img
                      src={category.cover}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                    />
                  )}
                </div>
                <p className="mt-[clamp(10px,1.2vw,16px)] mb-0 font-sans text-label tracking-[0.05em] uppercase">
                  {category.name}
                </p>
                <p className="mt-1.5 mb-0 font-sans text-small text-cocoa">
                  {category.share}% of your budget
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
