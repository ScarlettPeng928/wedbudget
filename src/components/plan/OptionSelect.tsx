import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check } from './PresetCombobox';
import { optionRow, optionsPanel } from './dropdown';

// Pick one of a fixed set of options, in the same drop-down as every other list on
// the site (city on the plan form, region and sort on the vendors pages).
export default function OptionSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
  describedBy,
}: {
  id: string;
  value: string; // '' when nothing is chosen yet
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`group relative flex w-full cursor-pointer items-center border-0 bg-transparent p-0 pr-6 text-left font-sans text-input whitespace-nowrap outline-none ${
          selected ? 'text-plum' : 'text-cocoa/70'
        }`}
      >
        {selected?.label ?? placeholder}
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
      <ListboxOptions anchor="bottom start" transition className={`${optionsPanel} w-[max(var(--button-width),14rem)]`}>
        {options.map((o) => (
          <ListboxOption key={o.value} value={o.value} className={optionRow}>
            {o.label}
            <Check />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
