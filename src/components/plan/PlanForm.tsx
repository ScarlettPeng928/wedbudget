import { useEffect, useId, useState, type FormEvent } from 'react';
import { MIN_BUDGET, type PlanRequest } from '../../api/plan';
import { ApiError } from '../../api/client';
import { withCommas } from '../../lib/format';
import PresetCombobox from './PresetCombobox';
import Field, { primaryButton, secondaryButton } from './Field';
import CitySelect from './CitySelect';

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

// Common answers offered in the budget and guests lists; any other number can be typed.
const BUDGET_PRESETS = [100_000, 200_000, 300_000, 500_000, 800_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000];
const GUEST_PRESETS = [10, 20, 30, 50, 80, 100, 120, 150, 200, 250, 300];

type PlanFormProps = {
  initial?: PlanRequest;
  onGenerate: (request: PlanRequest) => Promise<void>;
  // 'stacked': the /plan page. 'inline': three fields in a row, on the results page.
  layout?: 'stacked' | 'inline';
  // Put the cursor in this field when the form opens (and whenever it changes).
  focusField?: FieldName;
  // Shows a Cancel button next to the submit button.
  onCancel?: () => void;
  // Overrides the layout's button text, e.g. "Generate budget plan" for a first plan.
  submitLabel?: string;
  busyLabel?: string;
};

const layouts = {
  stacked: {
    form: 'flex flex-col gap-4',
    row: 'flex flex-col gap-10',
    fields: 'grid gap-8',
    button: 'w-full',
    submitLabel: 'Generate budget plan',
    busyLabel: 'Generating…',
    // Under the full-width button, so it lines up with the button's left edge.
  },
  // The plan page: on wide screens the three fields and the button share one row,
  // spanning the page so both edges line up with the plan below.
  inline: {
    form: 'flex flex-col gap-4',
    row: 'flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-10',
    fields: 'grid gap-6 sm:grid-cols-3 lg:flex-1',
    button: '',
    submitLabel: 'Update plan',
    busyLabel: 'Updating…',
  },
};

const toValues = (request?: PlanRequest): Values =>
  request ? { budget: String(request.totalBudget), city: request.city, guests: String(request.guestCount) } : emptyValues;

export default function PlanForm({ initial, onGenerate, layout = 'stacked', focusField, onCancel, submitLabel, busyLabel }: PlanFormProps) {
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
      <div className={look.row}>
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
            <PresetCombobox
              id={ids.budget}
              value={values.budget}
              onChange={(digits) => update('budget', digits)}
              presets={BUDGET_PRESETS}
              format={withCommas}
              optionLabel={(n) => `NT$${n.toLocaleString('en-US')}`}
              maxDigits={10}
              placeholder="Enter amount"
              // NT$ stays visible while typing, unlike a placeholder.
              prefix={
                <span className="text-input text-cocoa" aria-hidden="true">
                  NT$
                </span>
              }
              invalid={!!errors.budget}
              describedBy={errors.budget ? `${ids.budget}-error` : undefined}
            />
          </Field>

          <Field id={ids.city} label={labels.city} error={errors.city}>
            <CitySelect
              id={ids.city}
              value={values.city}
              onChange={(slug) => update('city', slug)}
              invalid={!!errors.city}
              describedBy={errors.city ? `${ids.city}-error` : undefined}
            />
          </Field>

          <Field id={ids.guests} label={labels.guests} error={errors.guests}>
            <PresetCombobox
              id={ids.guests}
              value={values.guests}
              onChange={(digits) => update('guests', digits)}
              presets={GUEST_PRESETS}
              format={(digits) => digits}
              optionLabel={(n) => `${n} guests`}
              maxDigits={4}
              placeholder="Enter guest count"
              invalid={!!errors.guests}
              describedBy={errors.guests ? `${ids.guests}-error` : undefined}
            />
          </Field>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button type="submit" disabled={submitting} className={`${look.button} ${primaryButton}`}>
            {submitting ? (busyLabel ?? look.busyLabel) : (submitLabel ?? look.submitLabel)}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className={secondaryButton}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Under the row, full width, so the message never squeezes the fields. */}
      {submitError && (
        <p role="alert" className="m-0 flex items-start gap-1.5 text-small text-terracotta">
          <svg viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 4.5v4M8 11v.5" />
          </svg>
          {submitError}
        </p>
      )}
    </form>
  );
}
