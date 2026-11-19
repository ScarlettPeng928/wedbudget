import { getJson, postJson } from './client';

// What every vendor card shows, wherever it appears.
type VendorBase = {
  id: number;
  name: string;
  city: { slug: string; name: string };
  priceMin: number;
  priceMax: number | null;
  priceUnit: 'event' | 'table' | 'guest';
  imageUrl: string | null;
  websiteUrl: string | null;
  // Demo listings are placeholders, not real partners.
  isDemo: boolean;
};

// A vendor matched to a plan (results page).
export type Vendor = VendorBase & {
  // What this vendor would cost for this wedding (price × tables or guests), in NT$.
  estimatedCost: number;
};

// A vendor on the vendors page, where there is no plan to price against.
export type VendorListItem = VendorBase & {
  subcategory: { slug: string; name: string } | null;
};

export type VendorMatchRequest = {
  city: string;
  guestCount: number;
  allocations: Record<string, number>;
};

// Up to 6 vendors per category slug that fit that category's amount
// (backend/SPEC.md 3.5–3.7). One request covers all six categories.
export const matchVendors = (request: VendorMatchRequest, signal?: AbortSignal) =>
  postJson<Record<string, Vendor[]>>('/api/vendors/match', request, signal);

// Leave out `city` for all of Taiwan, `subcategory` for every kind of vendor.
// `budget` (NT$, digits) keeps only vendors whose estimated cost for `guests` fits it.
export type VendorListRequest = {
  category: string;
  city?: string;
  subcategory?: string;
  budget?: string;
  guests?: string;
  // Paging: the same seed keeps one shuffled order; offset and limit pick the slice.
  seed?: string;
  offset?: string;
  limit?: string;
  // 'price-asc' or 'price-desc'; left out for the featured shuffle.
  sort?: string;
};

// Up to 8 random vendors in one category (backend/SPEC.md 5.6).
export const listVendors = (request: VendorListRequest, signal?: AbortSignal) =>
  getJson<VendorListItem[]>('/api/vendors', request, signal);
