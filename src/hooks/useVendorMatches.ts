import { useEffect, useState } from 'react';
import { matchVendors, type Vendor, type VendorMatchRequest } from '../api/vendors';

// Wait this long after the last change before asking the backend, so dragging a
// slider sends one request when it stops, not one per pixel.
const DEBOUNCE_MS = 300;

type State = {
  status: 'loading' | 'ready' | 'error';
  // null until the first answer arrives.
  vendors: Record<string, Vendor[]> | null;
  // The request those vendors answer. Compared with the current one to tell
  // which rows are out of date while a new answer is on its way.
  loadedFor: VendorMatchRequest | null;
};

// Vendors that fit each category's amount, refreshed whenever the city, guest
// count or any amount changes. While a new answer is on its way the previous
// vendors stay on screen, so the rows don't blink empty between requests.
// Pass null when there is no plan: nothing is requested.
export function useVendorMatches(request: VendorMatchRequest | null) {
  const [state, setState] = useState<State>({ status: 'loading', vendors: null, loadedFor: null });
  // Bumped by retry() to run the effect again with the same request.
  const [attempt, setAttempt] = useState(0);

  // Objects are new on every render, so the effect watches this text instead.
  const key = request ? JSON.stringify(request) : null;

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    const current = JSON.parse(key) as VendorMatchRequest;
    setState((prev) => ({ ...prev, status: 'loading' }));

    // The very first load has nothing to debounce.
    const timer = window.setTimeout(
      () => {
        matchVendors(current, controller.signal)
          .then((vendors) => setState({ status: 'ready', vendors, loadedFor: current }))
          .catch((error: unknown) => {
            // Aborted = replaced by a newer request; that one will report back.
            if (error instanceof DOMException && error.name === 'AbortError') return;
            setState((prev) => ({ ...prev, status: 'error' }));
          });
      },
      state.vendors ? DEBOUNCE_MS : 0,
    );

    // Runs when the request changes again (or the page closes): cancel the wait,
    // and the request too if it already went out.
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // state.vendors is only read to pick the delay; it must not re-run the effect.
  }, [key, attempt]);

  // True while this category's row shows vendors for an older amount (or an
  // older city or guest count) and the new answer hasn't arrived yet.
  const isUpdating = (slug: string) => {
    const old = state.loadedFor;
    if (state.status !== 'loading' || !old || !request) return false;
    return (
      old.city !== request.city ||
      old.guestCount !== request.guestCount ||
      (old.allocations[slug] ?? 0) !== (request.allocations[slug] ?? 0)
    );
  };

  return { status: state.status, vendors: state.vendors, isUpdating, retry: () => setAttempt((n) => n + 1) };
}
