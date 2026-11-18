// Shared look for the plan form's drop-down lists (PresetCombobox, CitySelect).
// Headless UI handles keyboard, focus and screen readers; these classes are the
// whole appearance. The list is anchored under its field, as wide as the field
// (--input-width / --button-width come from Headless UI), and fades in briefly.

export const optionsPanel =
  'z-50 max-h-72 overflow-y-auto rounded-lg border border-sand bg-cream py-1 shadow-[0_16px_40px_rgb(0_0_0/0.12)] [--anchor-gap:12px] transition duration-100 ease-out outline-none data-closed:opacity-0 empty:invisible';

export const optionRow =
  'group flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 font-sans text-body text-plum select-none tabular-nums data-focus:bg-linen data-selected:font-medium';
