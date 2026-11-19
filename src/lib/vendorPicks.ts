import { useSyncExternalStore } from 'react';

// The visitor's saved vendors: in each category, kept in this browser
// (localStorage) next to the saved plan. Storage can be blocked, so every access is
// guarded: the saved list then lasts until the page is closed.
const KEY = 'wedbudget-picks';
// The first version kept one chosen vendor per category under this key.
const OLD_KEY = 'wedbudget-chosen';

// What the saved page shows, kept at the moment of saving so the page needs no
// request: the vendor's own listed price, never a total we worked out.
export type PickVendor = {
  id: number;
  name: string;
  priceMin: number;
  priceMax?: number | null;
  priceUnit: 'event' | 'table' | 'guest';
  imageUrl?: string | null;
  // City name, used as the place of a visit in the calendar.
  cityName?: string;
  // The vendor's own site, where its name links (missing on demo vendors and on
  // vendors saved before it was kept: those link to a map search instead).
  websiteUrl?: string | null;
};

export type CategoryPicks = { saved: PickVendor[] };

// Category slug → that category's saved vendors.
export type VendorPicks = Record<string, CategoryPicks>;

function read(): VendorPicks {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as VendorPicks;
    // One-time move from the one-vendor format: each chosen vendor becomes a saved one.
    const old = localStorage.getItem(OLD_KEY);
    if (!old) return {};
    const chosen = JSON.parse(old) as Record<string, PickVendor>;
    const picks: VendorPicks = Object.fromEntries(Object.entries(chosen).map(([slug, v]) => [slug, { saved: [v] }]));
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
    // Storage blocked: the saved list simply isn't remembered.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Saved or removed in another tab.
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

export function isSaved(picks: VendorPicks, category: string, vendorId: number) {
  return picks[category]?.saved.some((v) => v.id === vendorId) ?? false;
}

// Save a vendor to its category's saved list, or remove it if it's already there.
export function toggleSaved(category: string, vendor: PickVendor) {
  const next = { ...current };
  const saved = current[category]?.saved ?? [];
  if (saved.some((v) => v.id === vendor.id)) {
    const rest = saved.filter((v) => v.id !== vendor.id);
    if (rest.length) next[category] = { saved: rest };
    else delete next[category];
  } else {
    const { id, name, priceMin, priceMax, priceUnit, imageUrl, cityName, websiteUrl } = vendor;
    next[category] = { saved: [...saved, { id, name, priceMin, priceMax, priceUnit, imageUrl, cityName, websiteUrl }] };
  }
  write(next);
}

export function useVendorPicks() {
  return useSyncExternalStore(subscribe, () => current);
}
