// Where a vendor's name and photo lead, the same everywhere they appear (vendor
// cards, the saved page): the vendor's own website, or until it has one (demo
// vendors don't), a Google Maps search for real vendors of the same kind in the
// same city. Searched in Chinese, which finds Taiwanese businesses far better. No
// business is named or linked as if it were this vendor.

const MAP_SEARCH: Record<string, string> = {
  venues: '婚宴會館',
  photography: '婚禮攝影',
  attire: '婚紗禮服',
  'bridal-styling': '新娘秘書',
  hosting: '婚禮主持',
  favors: '喜餅',
};

function mapSearchUrl(category: string | undefined, cityName: string | undefined) {
  const keyword = category ? MAP_SEARCH[category] : undefined;
  if (!keyword) return null;
  const query = cityName ? `${keyword} ${cityName}` : `${keyword} Taiwan`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function vendorHref(vendor: { websiteUrl?: string | null; cityName?: string }, category?: string) {
  return vendor.websiteUrl ?? mapSearchUrl(category, vendor.cityName);
}

// For screen readers: where the link goes, since it opens another site in a new tab.
export const vendorLinkNote = (vendor: { websiteUrl?: string | null }) =>
  vendor.websiteUrl ? ' (website, opens in a new tab)' : ' (similar vendors on Google Maps, opens in a new tab)';
