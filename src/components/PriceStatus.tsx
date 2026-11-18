import { formatNT, withCommas } from '../lib/format';

// "NT$420,000", or "NT$420,000 – 610,000" when the low and high ends differ.
export function priceRange(low: number, high: number) {
  return low === high ? formatNT(low) : `${formatNT(low)} – ${withCommas(String(high))}`;
}

// How a price sits against the amount set aside for it.
export function LeftOrOver({ price, amount, className = '' }: { price: number; amount: number; className?: string }) {
  const over = price > amount;
  return (
    <span className={`tabular-nums ${over ? 'font-medium text-terracotta' : 'text-cocoa'} ${className}`}>
      {over ? `Over by ${formatNT(price - amount)}` : `${formatNT(amount - price)} left`}
    </span>
  );
}

// The same for a range: over only if even the low end is, "up to" if just the high end is.
export function RangeLeftOrOver({ low, high, amount }: { low: number; high: number; amount: number }) {
  if (low > amount) return <LeftOrOver price={low} amount={amount} />;
  if (high > amount) return <span className="text-terracotta tabular-nums">Up to {formatNT(high - amount)} over</span>;
  return <LeftOrOver price={high} amount={amount} />;
}
