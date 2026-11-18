import type { ReactNode } from 'react';

// The look of every form field (the plan form and the visit form): a small label
// above the control on a single underline. The line darkens on focus and turns
// terracotta on error, with the error text below it.
// The <label> holds only the label text, tied to the control by htmlFor. Wrapping
// the control too would pull a drop-down's whole list (a calendar, the time slots)
// into the control's name, read out by screen readers, and pass clicks inside the
// list on to the control.
export default function Field({ id, label, error, children }: { id: string; label: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div>
      <div className={`flex flex-col gap-2 border-b pb-3 transition-colors focus-within:border-plum ${error ? 'border-terracotta' : 'border-sand'}`}>
        <label htmlFor={id} className="text-small tracking-[0.02em] text-cocoa">
          {label}
        </label>
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 mb-0 text-small text-terracotta">
          {error}
        </p>
      )}
    </div>
  );
}

// A plain text box inside a Field.
export const fieldInput = 'w-full border-0 bg-transparent p-0 font-sans text-input text-plum outline-none placeholder:text-cocoa/70';

// The buttons of both forms: the same size and type everywhere.
export const formButton =
  'cursor-pointer rounded-lg border px-[clamp(20px,2vw,28px)] py-[clamp(10px,1vw,14px)] font-sans text-label tracking-[0.05em] uppercase transition-colors';
export const primaryButton = `${formButton} border-rosewood bg-rosewood font-medium text-cream hover:border-plum hover:bg-plum disabled:cursor-wait disabled:opacity-60`;
export const secondaryButton = `${formButton} border-plum bg-transparent text-plum hover:bg-plum hover:text-cream`;
