// Digits only, so "1,200,000" and "1200000" both work. Leading zeros are dropped,
// and the result is capped at maxDigits so huge numbers can't overflow the layout
// (or lose precision once they pass JavaScript's safe integer range).
export const digitsOnly = (value: string, maxDigits = 10) =>
  value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, maxDigits);

export const withCommas = (digits: string) => (digits ? Number(digits).toLocaleString('en-US') : '');

export const formatNT = (amount: number) => `NT$${Math.round(amount).toLocaleString('en-US')}`;
