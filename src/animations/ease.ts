import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

// Shared curves for interface motion (menu, results, page entrances), so every
// response to a click has the same feel. The home page's scroll and intro
// animations keep their own tuned eases.

// Strong ease-out: moves straight away, then settles gently. For things that
// appear, open or answer a click.
export const EASE_OUT = CustomEase.create('wed-out', '0.23, 1, 0.32, 1');

// Strong ease-in-out: for things travelling across the screen, like scrolling to a spot.
export const EASE_IN_OUT = CustomEase.create('wed-in-out', '0.77, 0, 0.175, 1');

// How far scroll-linked animations on the home page trail the scrollbar, in seconds.
// One value everywhere, so every section answers the wheel with the same smooth,
// slightly cushioned feel instead of some snapping and some gliding.
export const SCROLL_SCRUB = 0.6;
