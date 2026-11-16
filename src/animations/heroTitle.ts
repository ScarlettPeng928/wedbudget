import gsap from 'gsap';

// Hero entrance, in three calm steps:
// 1. "Here comes" is inked in from left to right behind a feathered edge, like a pen line.
// 2. "the rest of your life" is unveiled from the bottom up, as a veil lifts, while
//    its letter-spacing settles from slightly open to normal. Nothing moves or blurs.
// 3. The button fades in.
// Both reveals animate --reveal, which the masks in input.css read (.hero-ink, .hero-veil).
// Shared by the intro (after the doors open) and the hero (when the intro is skipped).
export function heroTitleIn() {
  return gsap
    .timeline()
    .fromTo('.hero-script', { '--reveal': '-15%' }, { '--reveal': '100%', duration: 1.6, ease: 'sine.inOut' })
    .fromTo(
      '.hero-main',
      { '--reveal': '-40%', letterSpacing: '0.06em' },
      { '--reveal': '100%', letterSpacing: '0em', duration: 2, ease: 'power2.out' },
      '-=0.7',
    )
    .fromTo('.hero-cta', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: 'power1.out' }, '-=1.1');
}
