import { useEffect, useRef, useState } from 'react';
import { listVendors, type VendorListItem, type VendorListRequest } from '../api/vendors';

const PAGE_SIZE = 8;

type State = {
  status: 'loading' | 'ready' | 'error';
  // null until the first answer arrives.
  vendors: VendorListItem[] | null;
  // There are more vendors after the ones shown.
  hasMore: boolean;
  // "Show more" is fetching the next page.
  loadingMore: boolean;
};

// Vendors for the vendors page, a page at a time. One random seed per visit fixes
// a shuffled order (backend list_vendors), so "Show more" continues it without
// repeats. Each request asks for one more than a page: if it comes back, there's more.
// A new category, region, type or budget starts again from the first page; the
// previous vendors stay on screen (faded by the page) until the new ones arrive.
export function useVendorList(request: VendorListRequest) {
  const [state, setState] = useState<State>({ status: 'loading', vendors: null, hasMore: false, loadingMore: false });
  // Bumped by retry() to run the first-page request again.
  const [attempt, setAttempt] = useState(0);
  const [seed] = useState(() => String(Math.floor(Math.random() * 2_147_483_647)));
  const moreController = useRef<AbortController | null>(null);

  // Objects are new on every render, so the effects watch this text instead.
  const key = JSON.stringify(request);

  const fetchPage = (offset: number, signal: AbortSignal) =>
    listVendors(
      { ...(JSON.parse(key) as VendorListRequest), seed, offset: String(offset), limit: String(PAGE_SIZE + 1) },
      signal,
    ).then((page) => ({ vendors: page.slice(0, PAGE_SIZE), hasMore: page.length > PAGE_SIZE }));

  useEffect(() => {
    const controller = new AbortController();
    moreController.current?.abort();
    setState((prev) => ({ ...prev, status: 'loading', loadingMore: false }));
    fetchPage(0, controller.signal)
      .then(({ vendors, hasMore }) => setState({ status: 'ready', vendors, hasMore, loadingMore: false }))
      .catch((error: unknown) => {
        // Aborted = replaced by a newer request; that one will report back.
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState((prev) => ({ ...prev, status: 'error' }));
      });
    return () => controller.abort();
    // fetchPage only depends on key and seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const loadMore = () => {
    if (!state.vendors || state.loadingMore) return;
    const controller = new AbortController();
    moreController.current = controller;
    const shown = state.vendors;
    setState((prev) => ({ ...prev, loadingMore: true }));
    fetchPage(shown.length, controller.signal)
      .then(({ vendors, hasMore }) =>
        setState((prev) => ({ ...prev, vendors: [...(prev.vendors ?? []), ...vendors], hasMore, loadingMore: false })),
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState((prev) => ({ ...prev, loadingMore: false }));
      });
  };

  return { ...state, retry: () => setAttempt((n) => n + 1), loadMore };
}
