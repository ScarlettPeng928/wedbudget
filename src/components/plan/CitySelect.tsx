import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { cities } from '../../data/cities';
import { Check } from './PresetCombobox';
import { optionRow, optionsPanel } from './dropdown';

// Pick one city from the list (no typing: it must be a city we have vendors for).
// Same look as the budget and guests lists. `extraOption` adds a first choice that
// isn't a city, like All Taiwan on the vendors page.
export default function CitySelect({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  extraOption,
}: {
  id: string;
  value: string; // city slug, '' when none
  onChange: (slug: string) => void;
  invalid?: boolean;
  describedBy?: string;
  extraOption?: { value: string; label: string };
}) {
  const options = extraOption ? [{ slug: extraOption.value, name: extraOption.label }, ...cities] : cities;
  const selected = options.find((c) => c.slug === value);
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
        {selected?.name ?? 'Select a city'}
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
        {options.map((city) => (
          <ListboxOption key={city.slug} value={city.slug} className={optionRow}>
            {city.name}
            <Check />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
