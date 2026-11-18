import gsap from 'gsap';

// Hero entrance, in two calm steps:
// 1. Each title line is unveiled from the bottom up, as a veil lifts, the second
//    line slightly after the first. Nothing moves or blurs.
// 2. The subtitle and the button fade in.
// The reveal animates --reveal, which the .hero-veil mask in input.css reads.
// Shared by the intro (after the doors open) and the hero (when the intro is skipped).
export function heroTitleIn() {
  return gsap
    .timeline()
    .fromTo(
      '.hero-line',
      { '--reveal': '-40%' },
      { '--reveal': '100%', duration: 1.8, stagger: 0.35, ease: 'power2.out' },
    )
    .fromTo(['.hero-sub', '.hero-cta'], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, stagger: 0.25, ease: 'power1.out' }, '-=1');
}
