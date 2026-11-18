import type { ReactNode } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { optionRow, optionsPanel } from './dropdown';

// A number field with common answers to pick from, that still takes any number
// typed in. Typing updates the value straight away (so an unlisted amount counts
// without picking anything); picking an option fills it in.
export default function PresetCombobox({
  id,
  value,
  onChange,
  presets,
  format,
  optionLabel,
  maxDigits,
  placeholder,
  prefix,
  invalid,
  describedBy,
}: {
  id: string;
  // Digits only, '' when empty.
  value: string;
  onChange: (digits: string) => void;
  presets: number[];
  // How the value shows in the field while typing, e.g. with thousands commas.
  format: (digits: string) => string;
  // How each preset reads in the list, e.g. "NT$500,000" or "120 guests".
  optionLabel: (n: number) => string;
  maxDigits: number;
  placeholder: string;
  // Shown before the number, outside the text so it never gets typed over.
  prefix?: ReactNode;
  invalid?: boolean;
  describedBy?: string;
}) {
  const toDigits = (text: string) => text.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, maxDigits);

  return (
    <Combobox value={value} onChange={(picked: string | null) => onChange(picked ?? '')} immediate>
      <div className="relative flex items-baseline gap-1.5">
        {prefix}
        <ComboboxInput
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          displayValue={(digits: string) => format(digits)}
          onChange={(e) => onChange(toDigits(e.target.value))}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="w-full border-0 bg-transparent p-0 pr-6 font-sans text-input text-plum outline-none placeholder:text-cocoa/70"
        />
        <ComboboxButton
          aria-label="Show options"
          className="group absolute top-1/2 right-0 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-cocoa"
        >
          <svg viewBox="0 0 16 16" className="size-3.5 transition-transform group-data-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </ComboboxButton>
      </div>
      <ComboboxOptions anchor="bottom start" transition className={`${optionsPanel} w-[max(var(--input-width),14rem)]`}>
        {presets.map((n) => (
          <ComboboxOption key={n} value={String(n)} className={optionRow}>
            {optionLabel(n)}
            <Check />
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}

// Shown beside the option that matches the current value.
export function Check() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="invisible size-4 shrink-0 text-rosewood group-data-selected:visible"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M3 8.5l3.2 3L13 4.5" />
    </svg>
  );
}
