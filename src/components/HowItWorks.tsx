// How the site works, one row per step (plan, find, save and visit): photo on one
// side, a short explanation on the other, swapping sides from row to row. Each photo stops one gutter short of the
// screen edge, in line with the header and the rest of the page.
// To add a photo: put the file in src/assets/home/, import it here, and set `image`.
//
// The curtain: as the category cards scroll up and away, this section stays where
// it is underneath, so the cards lift off it like a curtain rather than both
// scrolling together. (It moves down exactly as far as the page scrolls up, until
// its top reaches the top of the screen.) Reduced motion: an ordinary scroll.
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import stepPlan from "../assets/home/step-plan.jpg";
import stepFind from "../assets/home/step-find.jpg";
import stepVisit from "../assets/home/step-visit.jpg";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const steps: { title: string; body: string; image?: string }[] = [
  {
    title: "Start with one number.",
    body: "Enter your budget, city and guest count. We split it six ways; you fine-tune.",
    image: stepPlan,
  },
  {
    title: "See who fits.",
    body: "Vendors whose prices fit each part of your budget.",
    image: stepFind,
  },
  {
    title: "Save and visit.",
    body: "Bookmark the ones you like, plan your visits, and send them to your partner.",
    image: stepVisit,
  },
];

export default function HowItWorks() {
  const section = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The section is the trigger and stays put; only its content moves, so the
        // trigger's position (what the start and end are measured from) never shifts.
        gsap.fromTo(
          content.current,
          { y: () => -window.innerHeight },
          {
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: section.current,
              start: "top bottom",
              end: "top top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );

        // The curtain's edge: a soft shadow along the bottom of the lifting cards
        // section, over the same stretch of scroll, fading out over the last part so
        // it's gone, and covers nothing, once this section is uncovered.
        const cards = document.getElementById("categories-title")?.closest("section");
        if (cards) {
          const shadow = (alpha: number) => `0 24px 48px -16px rgba(44, 17, 26, ${alpha})`;
          gsap
            .timeline({
              scrollTrigger: {
                trigger: section.current,
                start: "top bottom",
                end: "top top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            })
            .fromTo(cards, { boxShadow: shadow(0.28) }, { boxShadow: shadow(0.28), duration: 0.6 })
            .to(cards, { boxShadow: shadow(0), duration: 0.4, ease: "power1.in" });
        }
      });
    },
    { scope: section },
  );

  return (
    // Same oat as the category cards above; the cards' shadow marks the lifting edge.
    <section ref={section} aria-label="How it works" className="relative bg-oat">
      <div ref={content} className="flex flex-col gap-[clamp(56px,10vh,120px)] pt-[clamp(120px,18vh,200px)] pb-[clamp(80px,12vh,140px)]">
        {steps.map((step, i) => {
          const imageRight = i % 2 === 1;
          return (
            <div
              key={step.title}
              className="grid items-center gap-[clamp(32px,5vw,64px)] px-[max(clamp(16px,3vw,48px),calc((100%-1440px)/2))] md:grid-cols-2 md:gap-0"
            >
              {/* Side padding on the row: the gutter, or the 1440px content edge on wide screens. */}
              <div
                className={`aspect-square bg-rosewood md:aspect-[5/4] ${imageRight ? "md:order-2" : ""}`}
              >
                {step.image && (
                  <img
                    src={step.image}
                    alt=""
                    // The same light grade as the category card photos, so all the
                    // home page photos share one warm tone.
                    className="h-full w-full object-cover saturate-88 sepia-10 brightness-94"
                  />
                )}
              </div>
              <div className="px-[clamp(16px,3vw,48px)] text-center">
                <div className="mx-auto max-w-[30ch]">
                  <h2 className="m-0 font-serif text-title font-light italic">
                    {step.title}
                  </h2>
                  <p className="mt-[clamp(14px,1.6vw,20px)] mb-0 font-sans text-lead text-cocoa text-pretty">
                    {step.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
