import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Link, NavLink } from "react-router";
import { loadPlan } from "../lib/savedPlan";
import { budgetCategories } from "../data/budgetCategories";
import { EASE_OUT } from "../animations/ease";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const buttonBase =
  "inline-block cursor-pointer rounded-lg border px-[clamp(10px,1.2vw,18px)] py-[clamp(6px,0.8vw,12px)] font-serif text-[clamp(11px,1vw,15px)] tracking-[0.06em] whitespace-nowrap uppercase no-underline transition-colors";
const buttonClass = `${buttonBase} border-ink bg-transparent text-ink hover:bg-ink hover:text-canvas`;

type SiteHeaderProps = {
  // Home page only: hide over the hero, then show on scroll up / hide on scroll down.
  autoHide?: boolean;
  // The "Plan my wedding" button on the right; hidden on the plan and results pages.
  showCta?: boolean;
};

const menuLinkClass = ({ isActive }: { isActive: boolean }) =>
  `menu-link inline-block font-serif text-[clamp(40px,6vw,88px)] leading-[1.1] font-light no-underline underline-offset-[0.12em] decoration-1 hover:underline ${
    isActive ? "text-accent" : "text-ink"
  }`;

// Category links: smaller than the main links, so all six fit beside them.
const categoryLinkClass = ({ isActive }: { isActive: boolean }) =>
  `menu-link inline-block font-serif text-[clamp(22px,2.4vw,36px)] leading-[1.2] font-light no-underline underline-offset-[0.15em] decoration-1 hover:underline ${
    isActive ? "text-accent" : "text-ink"
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
  const firstMenuLink = useRef<HTMLAnchorElement>(null);
  // The menu's open animation, played forward to open and backward to close.
  const menuTimeline = useRef<gsap.core.Timeline | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // "Your plan" only appears once there is one to go back to.
  const hasPlan = loadPlan() !== null;

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
          onStart: () => firstMenuLink.current?.focus(),
        });
        tl.fromTo(
          menu.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: reduceMotion ? 0.2 : 0.01 },
          0,
        );
        if (!reduceMotion) {
          // The panel unrolls down from the header bar, then the links drop in one by one.
          tl.fromTo(
            menu.current,
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)", duration: 0.5 },
            0,
          );
          tl.fromTo(
            ".menu-link",
            { yPercent: 30, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06 },
            0.12,
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

      // Hidden over the hero (it has its own call to action). Past the hero it
      // tucks away while scrolling down and slides back in when scrolling up.
      const mm = gsap.matchMedia();
      mm.add(reducedMotionQueries, (context) => {
        const { reduceMotion } = context.conditions ?? {};
        gsap.set(header.current, { yPercent: -100, autoAlpha: 0 });
        const show = gsap.to(header.current, {
          yPercent: 0,
          autoAlpha: 1,
          duration: reduceMotion ? 0 : 0.5,
          ease: "power3.out",
          paused: true,
        });

        // Look the hero up on the whole document; a selector string here would be
        // limited to inside the header by useGSAP's scope.
        const hero = document.querySelector(".hero-media");
        if (!hero) {
          show.progress(1);
          return;
        }
        ScrollTrigger.create({
          trigger: hero,
          start: "bottom top",
          end: "max",
          onUpdate: (self) =>
            self.direction === -1 ? show.play() : show.reverse(),
          onLeaveBack: () => show.reverse(),
        });
      });
    },
    { scope: header },
  );

  return (
    <>
      <header
        ref={header}
        className="fixed inset-x-0 top-0 z-40 border-b border-line bg-canvas"
      >
        <nav
          className="grid min-h-[clamp(64px,6vw,88px)] grid-cols-[1fr_auto_1fr] items-center gap-4 px-[clamp(16px,3vw,48px)]"
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
            className="font-display text-[clamp(26px,2.6vw,40px)] leading-none text-ink uppercase no-underline"
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

      {/* Full-screen menu below the header bar. It sits outside <header> because GSAP
          moves the header with a transform, which would pin a fixed child to the header.
          Always rendered so it can animate closed; hidden (and inert) until opened. */}
      <nav
        ref={menu}
        id="site-menu"
        aria-label="Menu"
        inert={!menuOpen}
        className="invisible fixed inset-x-0 top-[clamp(64px,6vw,88px)] bottom-0 z-[35] overflow-y-auto bg-surface px-[clamp(16px,3vw,48px)] py-[clamp(40px,8vh,96px)]"
      >
        {/* Phones: the main links, then the categories below. Desktop: side by side. */}
        <div className="mx-auto grid max-w-[1440px] gap-[clamp(40px,6vh,64px)] lg:grid-cols-[auto_1fr] lg:gap-[clamp(64px,8vw,160px)]">
          <ul className="m-0 flex list-none flex-col gap-[clamp(8px,2vh,20px)] p-0">
            <li>
              <NavLink
                ref={firstMenuLink}
                to="/"
                end
                onClick={() => closeMenu()}
                className={menuLinkClass}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/plan"
                end
                onClick={() => closeMenu()}
                className={menuLinkClass}
              >
                Plan my wedding
              </NavLink>
            </li>
            {hasPlan && (
              <li>
                <NavLink
                  to="/plan/results"
                  end
                  onClick={() => closeMenu()}
                  className={menuLinkClass}
                >
                  Your plan
                </NavLink>
              </li>
            )}
          </ul>

          <div>
            <h2 className="menu-link mt-0 mb-[clamp(12px,2vh,20px)] text-[13px] font-normal tracking-[0.12em] text-ink-muted uppercase">
              Vendors
            </h2>
            <ul className="m-0 flex list-none flex-col gap-[clamp(4px,1vh,10px)] p-0">
              {budgetCategories.map((category) => (
                <li key={category.slug}>
                  <NavLink
                    to={`/vendors/${category.slug}`}
                    onClick={() => closeMenu()}
                    className={categoryLinkClass}
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
