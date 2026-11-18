import { useSyncExternalStore } from 'react';

// Visits the couple has arranged with saved vendors: seeing a venue, a tasting, a
// fitting. They arrange the time with the vendor themselves and note it here, to
// put it in a calendar and send it to their partner. Kept in this browser
// (localStorage); storage can be blocked, so every access is guarded.
const KEY = 'wedbudget-visits';

export type VisitKind = 'visit' | 'tasting' | 'consultation' | 'fitting' | 'trial';

export const KIND_LABELS: Record<VisitKind, string> = {
  visit: 'Venue visit',
  tasting: 'Tasting',
  consultation: 'Consultation',
  fitting: 'Fitting',
  trial: 'Trial',
};

// The kinds of visit that make sense in each category, most common first.
export const KINDS_BY_CATEGORY: Record<string, VisitKind[]> = {
  venues: ['visit', 'tasting'],
  photography: ['consultation'],
  attire: ['fitting'],
  'bridal-styling': ['trial'],
  hosting: ['consultation'],
  favors: ['tasting'],
};

export const kindsFor = (category: string) => KINDS_BY_CATEGORY[category] ?? ['visit'];

export type Visit = {
  id: string;
  category: string;
  vendorId: number;
  // Kept with the visit, so it still reads right if the vendor is no longer saved.
  vendorName: string;
  cityName?: string;
  kind: VisitKind;
  date: string; // YYYY-MM-DD, Taiwan time
  time: string; // HH:MM, 24-hour, Taiwan time
  note?: string;
};

export type VisitInput = Omit<Visit, 'id'>;

// Sorts as text in time order, since both parts are zero-padded.
export const visitKey = (v: Pick<Visit, 'date' | 'time'>) => `${v.date}T${v.time}`;

function read(): Visit[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Visit[]) : [];
  } catch {
    return [];
  }
}

let current: Visit[] = read();
const listeners = new Set<() => void>();

function write(next: Visit[]) {
  // Always in time order, so every list can show them as they come.
  current = [...next].sort((a, b) => visitKey(a).localeCompare(visitKey(b)));
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Storage blocked: the visits simply aren't remembered.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
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

function newId() {
  // randomUUID needs a secure page (https or localhost); the fallback is unique enough here.
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function addVisit(input: VisitInput) {
  write([...current, { ...input, id: newId() }]);
}

export function updateVisit(id: string, input: VisitInput) {
  write(current.map((v) => (v.id === id ? { ...input, id } : v)));
}

export function deleteVisit(id: string) {
  write(current.filter((v) => v.id !== id));
}

export function useVisits() {
  return useSyncExternalStore(subscribe, () => current);
}
