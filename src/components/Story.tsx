import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// \u00a0 is a non-breaking space: the words it joins never split across lines.
const lead =
  'Every love story deserves its own day. The place. The dress. The light. A\u00a0hundred little choices —';
const highlight = 'one\u00a0budget\u00a0that\u00a0fits.';

function Words({ text }: { text: string }) {
  return text.split(' ').map((word, i) => (
    <span key={i}>
      {i > 0 && ' '}
      <span className="story-word text-line motion-reduce:text-ink">{word}</span>
    </span>
  ));
}

export default function Story() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Reduced motion: the words are simply ink from the start (motion-reduce classes below).
      // matchMedia also undoes this if the setting changes while the page is open.
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const ink = getComputedStyle(document.documentElement)
          .getPropertyValue('--color-ink')
          .trim();
        const underline = container.current!.querySelector('.story-underline');
        const firstUnderlined = underline?.querySelector('.story-word');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.story-section',
            start: 'top top',
            end: '+=100%',
            pin: true,
            // On a fast scroll, get ready to pin a moment early so the switch doesn't jump.
            anticipatePin: 1,
            scrub: 0.6,
          },
        });

        gsap.utils.toArray<HTMLElement>('.story-word').forEach((word) => {
          tl.to(word, { color: ink, duration: 0.6, ease: 'none' }, '<0.35');
          if (word === firstUnderlined) {
            tl.to(underline, { textDecorationColor: ink, duration: 1.6, ease: 'none' }, '<');
          }
        });
      });
    },
    { scope: container },
  );

  return (
    <div ref={container}>
      <section className="story-section flex min-h-screen items-center justify-center px-[6vw]">
        <p className="m-0 max-w-[17em] text-center font-serif text-[clamp(26px,3.2vw,50px)] leading-[1.2] tracking-[-0.01em]">
          <Words text={lead} />{' '}
          <span className="story-underline underline decoration-line decoration-1 underline-offset-[0.14em] motion-reduce:decoration-ink">
            <Words text={highlight} />
          </span>
        </p>
      </section>
    </div>
  );
}
