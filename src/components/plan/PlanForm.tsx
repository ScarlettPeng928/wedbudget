import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { cities } from '../../data/cities';
import { MIN_BUDGET, type PlanRequest } from '../../api/plan';
import { ApiError } from '../../api/client';
import { digitsOnly, withCommas } from '../../lib/format';

export type FieldName = 'budget' | 'city' | 'guests';
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

const emptyValues: Values = { budget: '', city: '', guests: '' };

// The backend's field names (in its 422 errors) mapped to this form's fields.
const apiFields: Record<string, FieldName> = { totalBudget: 'budget', city: 'city', guestCount: 'guests' };

// Same names on /plan and on the results page, so a field is always called the same thing.
const labels: Record<FieldName, string> = { budget: 'Total budget', city: 'City', guests: 'Guests' };

function validate(values: Values): Errors {
  const errors: Errors = {};
  const budget = Number(values.budget);
  const guests = Number(values.guests);

  if (!values.budget) errors.budget = 'Enter your total budget.';
  else if (budget < MIN_BUDGET) errors.budget = `Enter at least NT$${MIN_BUDGET.toLocaleString('en-US')}.`;

  if (!values.city) errors.city = 'Select a city.';

  if (!values.guests) errors.guests = 'Enter your guest count.';
  else if (guests <= 0) errors.guests = 'Enter at least 1 guest.';

  return errors;
}

type FieldProps = {
  id: string;
  label: ReactNode;
  error?: string;
  children: ReactNode;
};

// Small label above the control on a single underline; the line darkens on focus
// and turns terracotta on error, with the error text below it.
function Field({ id, label, error, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`flex flex-col gap-2 border-b pb-3 transition-colors focus-within:border-ink ${
          error ? 'border-warning' : 'border-line'
        }`}
      >
        <span className="text-[13px] tracking-[0.02em] text-ink-muted">{label}</span>
        {children}
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-2 mb-0 text-[13px] text-warning">
          {error}
        </p>
      )}
    </div>
  );
}

const controlClass =
  'w-full border-0 bg-transparent p-0 font-sans text-[16px] text-ink outline-none placeholder:text-ink-muted/70';

const buttonBase =
  'cursor-pointer rounded-lg border border-ink px-[clamp(20px,2vw,28px)] py-[clamp(10px,1vw,14px)] font-serif text-[clamp(13px,1vw,15px)] tracking-[0.06em] uppercase transition-colors';

type PlanFormProps = {
  initial?: PlanRequest;
  onGenerate: (request: PlanRequest) => Promise<void>;
  // 'stacked': the /plan page. 'inline': three fields in a row, on the results page.
  layout?: 'stacked' | 'inline';
  // Put the cursor in this field when the form opens (and whenever it changes).
  focusField?: FieldName;
  // Shows a Cancel button next to the submit button.
  onCancel?: () => void;
  // A short line next to the buttons, e.g. a heads-up about what submitting replaces.
  note?: string;
};

const layouts = {
  stacked: {
    form: 'flex flex-col gap-10',
    fields: 'grid gap-8',
    button: 'w-full',
    submitLabel: 'Generate budget plan',
    busyLabel: 'Generating…',
    // Under the full-width button, so it lines up with the button's left edge.
    note: '',
  },
  inline: {
    form: 'flex flex-col gap-8',
    fields: 'grid gap-6 sm:grid-cols-3',
    button: '',
    submitLabel: 'Update plan',
    busyLabel: 'Updating…',
    // Beside the buttons on wider screens.
    note: 'sm:ml-2',
  },
};

const toValues = (request?: PlanRequest): Values =>
  request
    ? { budget: String(request.totalBudget), city: request.city, guests: String(request.guestCount) }
    : emptyValues;

export default function PlanForm({ initial, onGenerate, layout = 'stacked', focusField, onCancel, note }: PlanFormProps) {
  const look = layouts[layout];
  const id = useId();
  const ids = { budget: `${id}-budget`, city: `${id}-city`, guests: `${id}-guests` };
  const [values, setValues] = useState<Values>(() => toValues(initial));
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  // Set when the request itself fails (network or server), not when a field is invalid.
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (focusField) document.getElementById(ids[focusField])?.focus();
    // ids never change (useId is stable), so only focusField matters here.
  }, [focusField]);

  const update = (name: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error as soon as it is edited.
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const errorProps = (name: FieldName) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${ids[name]}-error` : undefined,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setSubmitError('');

    const firstInvalid = (Object.keys(ids) as FieldName[]).find((name) => found[name]);
    if (firstInvalid) {
      document.getElementById(ids[firstInvalid])?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onGenerate({
        totalBudget: Number(values.budget),
        city: values.city,
        guestCount: Number(values.guests),
      });
    } catch (error) {
      // The backend rejected one answer: show its message under that field.
      const field = error instanceof ApiError && error.field ? apiFields[error.field] : undefined;
      if (field) {
        setErrors({ [field]: (error as ApiError).message });
        document.getElementById(ids[field])?.focus();
      } else {
        setSubmitError("The plan couldn't be generated. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className={look.form}>
      <div className={look.fields}>
        <Field
          id={ids.budget}
          label={
            <>
              {labels.budget}
              <span className="sr-only"> in NT$</span>
            </>
          }
          error={errors.budget}
        >
          {/* NT$ stays visible while typing, unlike a placeholder. */}
          <span className="flex items-baseline gap-1.5">
            <span className="text-[16px] text-ink-muted" aria-hidden="true">
              NT$
            </span>
            <input
              id={ids.budget}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter amount"
              value={withCommas(values.budget)}
              onChange={(e) => update('budget', digitsOnly(e.target.value))}
              className={controlClass}
              {...errorProps('budget')}
            />
          </span>
        </Field>

        <Field id={ids.city} label={labels.city} error={errors.city}>
          <div className="relative">
            <select
              id={ids.city}
              value={values.city}
              onChange={(e) => update('city', e.target.value)}
              className={`${controlClass} cursor-pointer appearance-none pr-6 ${values.city ? '' : 'text-ink-muted/70'}`}
              {...errorProps('city')}
            >
              <option value="" disabled>
                Select a city
              </option>
              {cities.map((city) => (
                <option key={city.slug} value={city.slug} className="text-ink">
                  {city.name}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 16 16"
              className="pointer-events-none absolute top-1/2 right-0 size-3.5 -translate-y-1/2 text-ink-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </Field>

        <Field id={ids.guests} label={labels.guests} error={errors.guests}>
          <input
            id={ids.guests}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Enter guest count"
            value={values.guests}
            onChange={(e) => update('guests', digitsOnly(e.target.value, 4))}
            className={controlClass}
            {...errorProps('guests')}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-4">
        {submitError && (
          <p role="alert" className="m-0 flex items-start gap-1.5 text-[14px] text-warning">
            <svg viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 4.5v4M8 11v.5" />
            </svg>
            {submitError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <button
            type="submit"
            disabled={submitting}
            className={`${look.button} ${buttonBase} bg-ink text-canvas hover:opacity-85 disabled:cursor-wait disabled:opacity-60`}
          >
            {submitting ? look.busyLabel : look.submitLabel}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className={`${buttonBase} bg-transparent text-ink hover:bg-ink hover:text-canvas`}>
              Cancel
            </button>
          )}
          {note && <p className={`m-0 text-[14px] text-ink-muted ${look.note}`}>{note}</p>}
        </div>
      </div>
    </form>
  );
}
