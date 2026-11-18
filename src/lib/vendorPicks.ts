import { useSyncExternalStore } from 'react';

// The visitor's vendor shortlist, kept in this browser (localStorage) next to the
// saved plan. Couples usually save two or three vendors per category, ask each for
// a quote, then book one: so each category holds a list of saved vendors (each with
// an optional quote) and, once decided, the id of the booked one.
// Storage can be blocked, so every access is guarded: the picks then last until the
// page is closed.
const KEY = 'wedbudget-picks';
// The earlier version kept one chosen vendor per category under this key.
const OLD_KEY = 'wedbudget-chosen';

// Enough to show a vendor and price it against the plan, without asking the backend again.
export type PickVendor = {
  id: number;
  name: string;
  priceMin: number;
  priceUnit: 'event' | 'table' | 'guest';
  // For the thumbnail on the shortlist page. Missing on vendors saved before it was kept.
  imageUrl?: string | null;
};

// A saved vendor, plus the price they quoted once the visitor has asked.
export type SavedVendor = PickVendor & { quote?: number };

export type CategoryPicks = { saved: SavedVendor[]; bookedId?: number };

// Category slug → that category's picks.
export type VendorPicks = Record<string, CategoryPicks>;

// What this vendor would cost for this wedding, from the listed price. Same rule as
// the backend's estimated_cost (backend/app/rules.py): 10 guests to a table, rounded up.
export function estimateCost(vendor: PickVendor, guestCount: number) {
  if (vendor.priceUnit === 'table') return vendor.priceMin * Math.ceil(guestCount / 10);
  if (vendor.priceUnit === 'guest') return vendor.priceMin * guestCount;
  return vendor.priceMin;
}

// The price to plan with: the vendor's own quote once there is one, else the estimate.
export function vendorPrice(vendor: SavedVendor, guestCount: number) {
  return vendor.quote ?? estimateCost(vendor, guestCount);
}

export function bookedVendor(picks: CategoryPicks | undefined) {
  return picks?.saved.find((v) => v.id === picks.bookedId);
}

// What one category's vendors come to: a booked vendor at its price; otherwise the
// cheapest and dearest saved one give a range.
export function categoryRange(picks: CategoryPicks, guestCount: number) {
  const booked = bookedVendor(picks);
  const prices = booked ? [vendorPrice(booked, guestCount)] : picks.saved.map((v) => vendorPrice(v, guestCount));
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

// The same, added up over every category with anything saved.
export function picksSummary(picks: VendorPicks, slugs: string[], guestCount: number) {
  let low = 0;
  let high = 0;
  let picked = 0;
  let booked = 0;
  for (const slug of slugs) {
    const p = picks[slug];
    if (!p) continue;
    const range = categoryRange(p, guestCount);
    low += range.low;
    high += range.high;
    picked += 1;
    if (bookedVendor(p)) booked += 1;
  }
  return { low, high, picked, booked };
}

function read(): VendorPicks {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as VendorPicks;
    // One-time move from the old one-vendor format: each chosen vendor becomes a
    // saved and booked one, so nothing the visitor picked is lost.
    const old = localStorage.getItem(OLD_KEY);
    if (!old) return {};
    const chosen = JSON.parse(old) as Record<string, PickVendor>;
    const picks: VendorPicks = Object.fromEntries(
      Object.entries(chosen).map(([slug, v]) => [slug, { saved: [v], bookedId: v.id }]),
    );
    localStorage.setItem(KEY, JSON.stringify(picks));
    localStorage.removeItem(OLD_KEY);
    return picks;
  } catch {
    return {};
  }
}

// One shared copy for every component on the page, so saving on one card updates
// the others and the budget column at once.
let current: VendorPicks = read();
const listeners = new Set<() => void>();

function write(next: VendorPicks) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the picks simply aren't remembered.
  }
  listeners.forEach((listener) => listener());
}

// Replace one category's picks. An empty list removes the category altogether.
function update(category: string, change: (picks: CategoryPicks) => CategoryPicks) {
  const next = { ...current };
  const picks = change(current[category] ?? { saved: [] });
  if (picks.saved.length === 0) delete next[category];
  else next[category] = picks;
  write(next);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Picks changed in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    current = read();
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

// Save a vendor to its category's shortlist, or remove it if it's already there
// (which also un-books it).
export function toggleSaved(category: string, vendor: PickVendor) {
  update(category, (picks) => {
    if (picks.saved.some((v) => v.id === vendor.id)) {
      return {
        saved: picks.saved.filter((v) => v.id !== vendor.id),
        bookedId: picks.bookedId === vendor.id ? undefined : picks.bookedId,
      };
    }
    const { id, name, priceMin, priceUnit, imageUrl } = vendor;
    return { ...picks, saved: [...picks.saved, { id, name, priceMin, priceUnit, imageUrl }] };
  });
}

// Book a saved vendor (replacing any earlier booking in the category), or un-book it.
// Un-booked vendors stay saved, as a fallback if the booking falls through.
export function toggleBooked(category: string, vendorId: number) {
  update(category, (picks) => ({ ...picks, bookedId: picks.bookedId === vendorId ? undefined : vendorId }));
}

// The price a saved vendor quoted; undefined clears it (back to the estimate).
export function setQuote(category: string, vendorId: number, quote: number | undefined) {
  update(category, (picks) => ({
    ...picks,
    saved: picks.saved.map((v) => (v.id === vendorId ? { ...v, quote } : v)),
  }));
}

export function useVendorPicks() {
  return useSyncExternalStore(subscribe, () => current);
}
