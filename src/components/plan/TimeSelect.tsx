import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check } from './PresetCombobox';
import { optionRow, optionsPanel } from './dropdown';

// Visit times on offer: every half hour, 8:00 AM to 9:00 PM.
const SLOTS = Array.from({ length: 27 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

// "14:30" → "2:30 PM".
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// Pick a time from the half-hour slots, in the same drop-down as the plan form's
// city. A time saved earlier that isn't a slot (14:15) is kept in the list.
export default function TimeSelect({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  value: string; // "HH:MM", 24-hour; '' when none
  onChange: (hhmm: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const slots = value && !SLOTS.includes(value) ? [...SLOTS, value].sort() : SLOTS;
  return (
    <Listbox as="div" value={value} onChange={onChange} className="relative">
      <ListboxButton
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`group relative flex w-full cursor-pointer items-center border-0 bg-transparent p-0 pr-6 text-left font-sans text-input tabular-nums outline-none ${
          value ? 'text-plum' : 'text-cocoa/70'
        }`}
      >
        {value ? formatTime(value) : 'Select a time'}
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
      </ListboxButton>
      {/* Right under the field with plain CSS, inside the visit window (see DatePicker). */}
      <ListboxOptions
        transition
        className={`${optionsPanel} absolute top-full left-0 mt-3 w-full min-w-[12rem]`}
      >
        {slots.map((slot) => (
          <ListboxOption key={slot} value={slot} className={optionRow}>
            {formatTime(slot)}
            <Check />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
