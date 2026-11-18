// The shared frame of the tool pages (/plan and /saved), so both are built the
// same way: a linen band across the top for the page title and its controls, then
// two columns, a left one that stays in view (sticky) and the main content on the
// right. On phones the columns stack. Change it here and both pages follow.

// The fixed site header's height, to clear it at the top of the page.
export const HEADER_HEIGHT = 'clamp(64px,6vw,88px)';

// The band: edge to edge; inside, the same width and gutters as the columns below.
export const BAND = 'bg-linen';
export const BAND_INNER = 'mx-auto max-w-[1440px] px-[clamp(16px,3vw,48px)] pt-[clamp(32px,4vw,64px)] pb-[clamp(32px,4vw,56px)]';
// The saved page's rows: a single column, narrower than the page and centred.
export const NARROW_WIDTH = 'mx-auto max-w-[1100px] px-[clamp(16px,3vw,48px)]';

// The two columns: about 5 to 7, the left never narrower than 340px.
export const TOOL_COLUMNS =
  'mx-auto mt-[clamp(40px,5vw,72px)] grid max-w-[1440px] grid-cols-1 items-start gap-12 px-[clamp(16px,3vw,48px)] lg:grid-cols-[minmax(340px,5fr)_minmax(0,7fr)] lg:gap-[clamp(40px,5vw,88px)]';

// The left column on desktop: stays below the header while the right one scrolls,
// and scrolls on its own if it's taller than the screen.
export const STICKY_COLUMN =
  'min-w-0 lg:sticky lg:top-[calc(clamp(64px,6vw,88px)_+_24px)] lg:max-h-[calc(100svh_-_clamp(64px,6vw,88px)_-_48px)] lg:overflow-y-auto lg:pb-2';
