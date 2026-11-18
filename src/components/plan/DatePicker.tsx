import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { optionsPanel } from './dropdown';

// Dates are "YYYY-MM-DD" strings in the visitor's own calendar (Taiwan time for
// the couples this is for), built from local year/month/day so no time zone
// shifts a day.
const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const todayIso = () => {
  const t = new Date();
  return toIso(t.getFullYear(), t.getMonth(), t.getDate());
};

// "Sat, Nov 28, 2026"
const formatDate = (iso: string) => fromIso(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// A date field in the plan form's style (underline, chevron), opening a small
// month calendar in the same panel as the drop-down lists. Days before today
// can't be picked: a visit is still to come. Arrow keys move between days.
export default function DatePicker({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  autoFocus = false,
}: {
  id: string;
  value: string; // "YYYY-MM-DD", '' when none
  onChange: (iso: string) => void;
  invalid?: boolean;
  describedBy?: string;
  // Marks the button as the field the visit window puts the cursor in first.
  autoFocus?: boolean;
}) {
  return (
    <Popover className="relative">
      <PopoverButton
        id={id}
        data-autofocus={autoFocus || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`group relative flex w-full cursor-pointer items-center border-0 bg-transparent p-0 pr-6 text-left font-sans text-input tabular-nums outline-none ${
          value ? 'text-plum' : 'text-cocoa/70'
        }`}
      >
        {value ? formatDate(value) : 'Select a date'}
        <svg
          viewBox="0 0 16 16"
          className="absolute top-1/2 right-1 size-3.5 -translate-y-1/2 text-cocoa transition-transform group-data-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </PopoverButton>
      {/* Placed with plain CSS right under the field, inside the visit window. With
          Headless UI's anchor it would be moved to the end of the page, behind the
          native modal <dialog> (which makes everything outside it inert). */}
      <PopoverPanel
        transition
        className={`${optionsPanel} absolute top-full left-0 mt-3 w-[18rem] px-3 py-3`}
      >
        {({ close }) => (
          <MonthGrid
            value={value}
            onPick={(iso) => {
              onChange(iso);
              close();
            }}
          />
        )}
      </PopoverPanel>
    </Popover>
  );
}

function MonthGrid({ value, onPick }: { value: string; onPick: (iso: string) => void }) {
  const today = todayIso();
  const start = fromIso(value || today);
  const [month, setMonth] = useState({ y: start.getFullYear(), m: start.getMonth() });
  // The day keyboard focus is on; moved by the arrow keys.
  const [focusDay, setFocusDay] = useState(value || today);
  const grid = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  // After an arrow key, focus the new day (it may be in a month just rendered).
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [focusDay, month]);

  const first = new Date(month.y, month.m, 1);
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const blanks = first.getDay();
  const title = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const thisMonth = fromIso(today);
  const atThisMonth = month.y === thisMonth.getFullYear() && month.m === thisMonth.getMonth();

  const shiftMonth = (by: number) => {
    const d = new Date(month.y, month.m + by, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const d = fromIso(focusDay);
    d.setDate(d.getDate() + step);
    const next = toIso(d.getFullYear(), d.getMonth(), d.getDate());
    if (next < today) return;
    moved.current = true;
    setFocusDay(next);
    if (d.getMonth() !== month.m || d.getFullYear() !== month.y) setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  const arrow =
    'flex size-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-cocoa hover:bg-linen hover:text-plum disabled:cursor-default disabled:text-sand disabled:hover:bg-transparent';

  return (
    <div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => shiftMonth(-1)} disabled={atThisMonth} aria-label="Previous month" className={arrow}>
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <p className="m-0 font-sans text-body text-plum" aria-live="polite">
          {title}
        </p>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className={arrow}>
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M6 3l5 5-5 5" />
          </svg>
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 text-center" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1 font-sans text-label tracking-[0.05em] text-cocoa uppercase">
            {w}
          </span>
        ))}
      </div>

      <div ref={grid} role="group" aria-label={title} className="grid grid-cols-7 gap-y-1" onKeyDown={onKeyDown}>
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = toIso(month.y, month.m, day);
          const past = iso < today;
          const selected = iso === value;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              data-day={iso}
              disabled={past}
              // One day in the grid is in the tab order; the arrow keys move from there.
              tabIndex={iso === focusDay ? 0 : -1}
              onClick={() => onPick(iso)}
              aria-pressed={selected}
              aria-label={fromIso(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              className={`mx-auto flex size-9 cursor-pointer items-center justify-center rounded-md border-0 p-0 font-sans text-small tabular-nums transition-colors disabled:cursor-default disabled:text-sand ${
                selected
                  ? 'bg-plum text-cream'
                  : `bg-transparent text-plum hover:bg-linen ${isToday ? 'underline decoration-rosewood decoration-2 underline-offset-4' : ''}`
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
