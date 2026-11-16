import { useEffect, useState } from 'react';
import { listVendors, type VendorListItem, type VendorListRequest } from '../api/vendors';

type State = {
  status: 'loading' | 'ready' | 'error';
  // null until the first answer arrives.
  vendors: VendorListItem[] | null;
};

// Random vendors for the vendors page, fetched again whenever the category,
// region or subcategory changes. The previous vendors stay on screen (faded by
// the page) until the new ones arrive, so the grid doesn't blink empty.
export function useVendorList(request: VendorListRequest) {
  const [state, setState] = useState<State>({ status: 'loading', vendors: null });
  // Bumped by retry() to run the effect again with the same request.
  const [attempt, setAttempt] = useState(0);

  // Objects are new on every render, so the effect watches this text instead.
  const key = JSON.stringify(request);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, status: 'loading' }));
    listVendors(JSON.parse(key) as VendorListRequest, controller.signal)
      .then((vendors) => setState({ status: 'ready', vendors }))
      .catch((error: unknown) => {
        // Aborted = replaced by a newer request; that one will report back.
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState((prev) => ({ ...prev, status: 'error' }));
      });
    return () => controller.abort();
  }, [key, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
