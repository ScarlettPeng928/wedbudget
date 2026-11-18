import gsap from 'gsap';

// "Added to cart": a copy of the vendor's photo flies from the card into the bookmark
// in the header, which gives a small bounce as it lands. The bookmark is found by its
// data-saved-target attribute (SavedPeek).
//
// The arc comes from easing the two directions differently: across at an even
// pace, up with an accelerating curve, so the path bends like a toss rather than
// sliding in a straight line.

const FLIGHT = 0.7;

function bounce(target: HTMLElement) {
  gsap.fromTo(target, { scale: 1 }, { scale: 1.2, duration: 0.14, ease: 'power2.out', yoyo: true, repeat: 1, clearProps: 'scale' });
}

export function flyToSaved(photo: HTMLElement) {
  const target = document.querySelector<HTMLElement>('[data-saved-target]');
  // No motion wanted, or the bookmark isn't on screen: the count still updates.
  if (!target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const from = photo.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (to.width === 0) return;

  // A copy of the photo, pinned over the original so the card itself never moves.
  const ghost = photo.cloneNode(true) as HTMLElement;
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: '0',
    zIndex: '60',
    pointerEvents: 'none',
    boxShadow: '0 12px 32px rgb(0 0 0 / 0.18)',
  });
  document.body.appendChild(ghost);

  // Centre to centre.
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  // Shrinks to about the bookmark's size.
  const endScale = Math.max(to.width / from.width, 0.08);

  gsap
    .timeline({
      onComplete: () => {
        ghost.remove();
        bounce(target);
      },
    })
    .to(ghost, { x: dx, duration: FLIGHT, ease: 'power1.inOut' }, 0)
    .to(ghost, { y: dy, duration: FLIGHT, ease: 'power2.in' }, 0)
    .to(ghost, { scale: endScale, borderRadius: '50%', duration: FLIGHT, ease: 'power2.in' }, 0)
    .to(ghost, { autoAlpha: 0, duration: 0.15 }, FLIGHT - 0.15);
}
