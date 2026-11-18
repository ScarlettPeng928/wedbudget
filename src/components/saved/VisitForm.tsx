import { useId, useState, type FormEvent } from 'react';
import Field, { fieldInput, primaryButton, secondaryButton } from '../plan/Field';
import DatePicker from '../plan/DatePicker';
import TimeSelect from '../plan/TimeSelect';
import { addVisit, deleteVisit, KIND_LABELS, kindsFor, updateVisit, type Visit, type VisitKind } from '../../lib/visits';

// Just what a visit needs to know about its vendor.
export type VisitVendor = { id: number; name: string; cityName?: string };

// Note a visit with one vendor, or change one. The couple arranges the time with
// the vendor; this only records it.
export default function VisitForm({ category, vendor, visit, onDone }: { category: string; vendor: VisitVendor; visit?: Visit; onDone: () => void }) {
  const kinds = kindsFor(category);
  const [kind, setKind] = useState<VisitKind>(visit?.kind ?? kinds[0]);
  const [date, setDate] = useState(visit?.date ?? '');
  const [time, setTime] = useState(visit?.time ?? '');
  const [note, setNote] = useState(visit?.note ?? '');
  const [errors, setErrors] = useState<{ date?: string; time?: string }>({});
  const id = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = { date: date ? undefined : 'Choose a date.', time: time ? undefined : 'Choose a time.' };
    setErrors(found);
    if (found.date || found.time) return;
    const input = {
      category,
      vendorId: vendor.id,
      vendorName: vendor.name,
      cityName: vendor.cityName,
      kind,
      date,
      time,
      note: note.trim() || undefined,
    };
    if (visit) updateVisit(visit.id, input);
    else addVisit(input);
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="mt-6">
      {/* With one kind of visit in this category there's nothing to choose. */}
      {kinds.length > 1 && (
        <fieldset className="m-0 mb-4 border-0 p-0">
          <legend className="text-small tracking-[0.02em] text-cocoa">Type</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {kinds.map((k) => (
              <label
                key={k}
                className="cursor-pointer rounded-lg border border-plum px-3 py-1.5 font-sans text-label tracking-[0.05em] text-plum uppercase transition-colors has-checked:bg-plum has-checked:text-cream has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-plum"
              >
                <input type="radio" name={`${id}-kind`} value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                {KIND_LABELS[k]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* The same fields as the plan form: label above, underline, drop-downs. */}
      <div className="grid grid-cols-2 gap-6">
        <Field id={`${id}-date`} label="Date" error={errors.date}>
          <DatePicker
            id={`${id}-date`}
            value={date}
            onChange={(iso) => {
              setDate(iso);
              setErrors((prev) => ({ ...prev, date: undefined }));
            }}
            invalid={!!errors.date}
            describedBy={errors.date ? `${id}-date-error` : undefined}
            autoFocus
          />
        </Field>
        <Field id={`${id}-time`} label="Time" error={errors.time}>
          <TimeSelect
            id={`${id}-time`}
            value={time}
            onChange={(hhmm) => {
              setTime(hhmm);
              setErrors((prev) => ({ ...prev, time: undefined }));
            }}
            invalid={!!errors.time}
            describedBy={errors.time ? `${id}-time-error` : undefined}
          />
        </Field>
        <div className="col-span-2">
          <Field id={`${id}-note`} label="Note">
            <input id={`${id}-note`} type="text" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} className={fieldInput} />
          </Field>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="submit" className={primaryButton}>
          {visit ? 'Save changes' : 'Save visit'}
        </button>
        <button type="button" onClick={onDone} className={secondaryButton}>
          Cancel
        </button>
        {visit && (
          <button
            type="button"
            onClick={() => {
              deleteVisit(visit.id);
              onDone();
            }}
            className="ml-auto cursor-pointer border-0 bg-transparent p-0 text-body text-terracotta underline underline-offset-[0.2em]"
          >
            Delete visit
          </button>
        )}
      </div>
    </form>
  );
}
