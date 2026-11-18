// Digits only, so "1,200,000" and "1200000" both work. Leading zeros are dropped,
// and the result is capped at maxDigits so huge numbers can't overflow the layout
// (or lose precision once they pass JavaScript's safe integer range).
export const digitsOnly = (value: string, maxDigits = 10) =>
  value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, maxDigits);

export const withCommas = (digits: string) => (digits ? Number(digits).toLocaleString('en-US') : '');

export const formatNT = (amount: number) => `NT$${Math.round(amount).toLocaleString('en-US')}`;

const UNIT_SUFFIX = { event: '', table: ' / table', guest: ' / guest' } as const;

// A vendor's own listed price, as they state it: "NT$10,000 – 35,000",
// "NT$230 – 280 / guest", or "From NT$230 / guest" without a top price.
// Never a total worked out by us, so what's shown is always the vendor's word.
export function formatPriceRange(min: number, max: number | null | undefined, unit: keyof typeof UNIT_SUFFIX) {
  const range =
    max != null && max > min ? `${formatNT(min)} – ${max.toLocaleString('en-US')}` : `From ${formatNT(min)}`;
  return range + UNIT_SUFFIX[unit];
}
