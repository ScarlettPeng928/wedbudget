import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Link, NavLink } from "react-router";
import { loadPlan } from "../lib/savedPlan";
import { useVendorPicks } from "../lib/vendorPicks";
import { budgetCategories } from "../data/budgetCategories";
import { EASE_OUT } from "../animations/ease";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Both buttons share one shape: same padding, same 8px corners (about 20% of their height).
const buttonBase =
  "inline-block cursor-pointer rounded-lg border px-[clamp(10px,1vw,14px)] py-[clamp(5px,0.6vw,9px)] font-sans text-label tracking-[0.05em] whitespace-nowrap uppercase no-underline transition-colors";
// On a light background (the cream bar, or light sections of the home page).
const buttonOnLight = `${buttonBase} border-plum bg-transparent text-plum hover:bg-plum hover:text-cream`;
// On a dark background (the hero video, the story, the categories): all in sand, like the logo.
const buttonOnDark = `${buttonBase} border-sand bg-transparent text-sand hover:bg-sand hover:text-plum`;

type SiteHeaderProps = {
  // Home page only: a see-through bar whose colors follow the section behind it.
  // Shown over the hero; past it, it hides on scroll down and comes back on scroll up.
  autoHide?: boolean;
  // The "Plan my wedding" button on the right; hidden on the plan and results pages.
  showCta?: boolean;
};

// Links in the menu panel. The current page is marked in rosewood.
const menuLinkClass = ({ isActive }: { isActive: boolean }) =>
  `menu-link inline-block font-sans text-lead no-underline underline-offset-[0.15em] decoration-1 hover:underline ${
    isActive ? "text-rosewood" : "text-plum"
  }`;

const reducedMotionQueries = {
  reduceMotion: "(prefers-reduced-motion: reduce)",
  allowMotion: "(prefers-reduced-motion: no-preference)",
};

export default function SiteHeader({
  autoHide = false,
  showCta = true,
}: SiteHeaderProps) {
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  // The menu's open animation, played forward to open and backward to close.
  const menuTimeline = useRef<gsap.core.Timeline | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Home page: true while a dark section (marked data-header-tone="dark") sits
  // behind the bar. The page opens on the hero, which is dark.
  const [onDark, setOnDark] = useState(true);
  // No background on the home page, and on every page while the menu is open: the
  // cream menu panel unrolls behind the bar, so it sits straight on it. Elsewhere it
  // is a solid cream bar. Sand over dark home sections; plum over the menu panel.
  const seeThrough = autoHide || menuOpen;
  const darkTone = autoHide && !menuOpen && onDark;
  const buttonClass = darkTone ? buttonOnDark : buttonOnLight;
  // "Your plan" only appears once there is one to go back to.
  const hasPlan = loadPlan() !== null;
  // "Your shortlist" likewise, once a vendor is saved.
  const hasPicks = Object.keys(useVendorPicks()).length > 0;

  const openMenu = () => {
    setMenuOpen(true);
    menuTimeline.current?.timeScale(1).play();
  };

  // A click plays the opening backwards, a little faster. Escape is a keyboard
  // shortcut, so the menu just disappears: animation would only slow it down.
  const closeMenu = (instant = false) => {
    setMenuOpen(false);
    const tl = menuTimeline.current;
    if (!tl) return;
    if (instant) tl.progress(0).pause();
    else tl.timeScale(1.5).reverse();
  };

  // While the menu is open: no page scrolling, the page behind can't be tabbed
  // into (inert), Escape closes it, and focus goes back to the button afterwards.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const behind = document.querySelectorAll<HTMLElement>("main, footer");
    root.style.overflow = "hidden";
    behind.forEach((el) => (el.inert = true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu(true);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      behind.forEach((el) => (el.inert = false));
      window.removeEventListener("keydown", onKey);
      menuButton.current?.focus();
    };
    // closeMenu only touches refs and state setters, so it is safe to leave out.
  }, [menuOpen]);

  // The menu's timeline. The first tween flips the panel from hidden to visible,
  // so playing backwards to the start hides it again.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(reducedMotionQueries, (context) => {
        const { reduceMotion } = context.conditions ?? {};
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: EASE_OUT },
          // Focus can only move into the menu once it is visible.
          onStart: () => menu.current?.querySelector<HTMLAnchorElement>("a")?.focus(),
        });
        tl.fromTo(
          [menu.current, backdrop.current],
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: reduceMotion ? 0.2 : 0.25 },
          0,
        );
        if (!reduceMotion) {
          // A quick, light drop-down: the panel unrolls from the top edge, then the
          // links fade up one after another. About 0.3s until you can click; played
          // backwards (a bit faster) it rolls back up.
          tl.fromTo(
            menu.current,
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)", duration: 0.35 },
            0,
          );
          tl.fromTo(
            ".menu-link",
            { yPercent: 25, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.3, stagger: 0.03 },
            0.1,
          );
        }
        menuTimeline.current = tl;
      });
    },
    { scope: menu },
  );

  useGSAP(
    () => {
      if (!autoHide) return;

      // Over the hero the bar is always shown. Once the hero starts scrolling away it
      // tucks up with it; past the hero it tucks away while scrolling down and slides
      // back in when scrolling up. Its colors follow the section behind it.
      const mm = gsap.matchMedia();
      mm.add(reducedMotionQueries, (context) => {
        const { reduceMotion } = context.conditions ?? {};
        const show = gsap.fromTo(
          header.current,
          { yPercent: -100, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: reduceMotion ? 0 : 0.5,
            ease: "power3.out",
            paused: true,
          },
        );
        show.progress(1);

        // Sand while a dark section (data-header-tone="dark") is behind the middle of
        // the bar, plum otherwise. It looks at what is actually under the bar rather
        // than precomputed scroll positions, so pinned sections need no special care.
        let frame = 0;
        const checkTone = () => {
          frame = 0;
          const bar = header.current;
          if (!bar) return;
          const under = document
            .elementsFromPoint(window.innerWidth / 2, bar.offsetHeight / 2)
            .find((el) => !bar.contains(el));
          setOnDark(under?.closest('[data-header-tone="dark"]') != null);
        };
        // At most once per frame, however fast the scroll events come.
        const onScroll = () => {
          if (!frame) frame = requestAnimationFrame(checkTone);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        // Layout changes without a scroll too, e.g. when the intro lifts off the hero.
        ScrollTrigger.addEventListener("refresh", onScroll);
        checkTone();
        const stopWatching = () => {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
          ScrollTrigger.removeEventListener("refresh", onScroll);
          cancelAnimationFrame(frame);
        };

        const hero = document.querySelector(".hero-media");
        if (!hero) return stopWatching;
        // From where the hero lets go of the screen: hide on the way down, show on the way up.
        ScrollTrigger.create({
          trigger: hero,
          start: "bottom bottom",
          end: "max",
          onUpdate: (self) =>
            self.direction === -1 ? show.play() : show.reverse(),
          onLeaveBack: () => show.play(),
        });

        return stopWatching;
      });
    },
    { scope: header },
  );

  return (
    <>
      {/* The padding sits on <header> and the line on <nav>, so on the home page the
          line stops at the side gutters, in line with the buttons and the hero title. */}
      <header
        ref={header}
        className={`fixed inset-x-0 top-0 z-40 border-b px-[clamp(16px,3vw,48px)] transition-colors duration-300 ${
          seeThrough ? "border-transparent bg-transparent" : "border-sand bg-cream"
        }`}
      >
        <nav
          className={`mx-auto grid min-h-[clamp(64px,6vw,88px)] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 border-b transition-colors duration-300 ${
            !seeThrough ? "border-transparent" : darkTone ? "border-sand/70" : "border-plum/30"
          }`}
          aria-label="Main navigation"
        >
          <div className="justify-self-start">
            <button
              ref={menuButton}
              type="button"
              className={buttonClass}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => (menuOpen ? closeMenu() : openMenu())}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>

          <Link
            to="/"
            className={`font-display text-[clamp(22px,2.1vw,32px)] leading-none tracking-[0.05em] uppercase no-underline transition-colors duration-300 ${
              darkTone ? "text-sand" : "text-plum"
            }`}
          >
            WedBudget
          </Link>

          {/* The empty cell keeps the logo centred when the button is hidden. */}
          <div className="justify-self-end">
            {showCta && (
              <Link to="/plan" className={buttonClass}>
                Plan my wedding
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Dims the page below the open menu; clicking it closes the menu. */}
      <div
        ref={backdrop}
        className="invisible fixed inset-0 z-[34] bg-plum/25"
        onClick={() => closeMenu()}
        aria-hidden="true"
      />

      {/* Drop-down menu panel. It starts at the very top, behind the see-through
          header bar, so bar and panel read as one cream sheet, and ends where its
          links end. It sits outside <header> because GSAP moves the header with a
          transform, which would pin a fixed child to the header. Always rendered so it
          can animate closed; hidden (and inert) until opened. Home and "Plan my
          wedding" aren't repeated here: the logo and the header button already do that. */}
      <nav
        ref={menu}
        id="site-menu"
        aria-label="Menu"
        inert={!menuOpen}
        className="invisible fixed inset-x-0 top-0 z-[35] max-h-svh overflow-y-auto bg-cream px-[max(clamp(16px,3vw,48px),calc((100%-1440px)/2))] pt-[calc(clamp(64px,6vw,88px)+clamp(32px,5vh,56px))] pb-[clamp(40px,6vh,64px)] shadow-[0_24px_48px_-24px_rgb(44_17_26/0.3)]"
      >
        <div className="flex flex-col gap-[clamp(28px,4vh,40px)]">
          {hasPlan && (
            <NavLink to="/plan/results" end onClick={() => closeMenu()} className={menuLinkClass}>
              Your plan
            </NavLink>
          )}
          {hasPicks && (
            <NavLink to="/shortlist" onClick={() => closeMenu()} className={menuLinkClass}>
              Your shortlist
            </NavLink>
          )}
          <div>
            <h2 className="menu-link mt-0 mb-[clamp(12px,2vh,20px)] font-sans text-label font-normal tracking-[0.05em] text-cocoa uppercase">
              Vendors
            </h2>
            {/* Phones: one column. Wider: three columns, two rows. */}
            <ul className="m-0 grid list-none gap-x-[clamp(24px,4vw,64px)] gap-y-[clamp(8px,1.4vh,14px)] p-0 sm:grid-cols-2 lg:grid-cols-3">
              {budgetCategories.map((category) => (
                <li key={category.slug}>
                  <NavLink
                    to={`/vendors/${category.slug}`}
                    onClick={() => closeMenu()}
                    className={menuLinkClass}
                  >
                    {category.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
