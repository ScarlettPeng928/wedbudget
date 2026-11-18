import { useEffect, useRef, useState } from 'react';
import { downloadIcs, formatVisitTime, googleCalendarUrl, isUpcoming, lineShareUrl, visitTitle } from '../../lib/calendar';
import { KIND_LABELS, type Visit } from '../../lib/visits';

const actionClass =
  'cursor-pointer border-0 bg-transparent p-0 text-body text-plum underline decoration-rosewood decoration-1 underline-offset-[0.2em] hover:decoration-plum';

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </svg>
  );
}

// "Add to calendar": Google Calendar, or an .ics file for Apple Calendar and Outlook.
function AddToCalendar({ visit }: { visit: Visit }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass =
    'block w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left font-sans text-body text-plum no-underline hover:bg-linen';

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={actionClass}>
        Add to calendar
        <span className="sr-only">: {visitTitle(visit)}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-sand bg-cream py-1 shadow-[0_12px_32px_rgb(0_0_0/0.08)]">
          <a href={googleCalendarUrl(visit)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={itemClass}>
            Google Calendar
          </a>
          <button
            type="button"
            onClick={() => {
              downloadIcs(visit);
              setOpen(false);
            }}
            className={itemClass}
          >
            Apple Calendar / Outlook
          </button>
        </div>
      )}
    </div>
  );
}

// What can be done with a visit: add it to a calendar, send it to the partner, change it.
export function VisitActions({ visit, onEdit, className = '' }: { visit: Visit; onEdit?: () => void; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      <AddToCalendar visit={visit} />
      <a href={lineShareUrl(visit)} target="_blank" rel="noopener noreferrer" className={actionClass}>
        Send on LINE
        <span className="sr-only">: {visitTitle(visit)}</span>
      </a>
      {onEdit && (
        <button type="button" onClick={onEdit} className={actionClass}>
          Edit
          <span className="sr-only">: {visitTitle(visit)}</span>
        </button>
      )}
    </div>
  );
}

// A visit under its vendor's row, as one quiet line: that it's arranged, and when.
// Nothing to press here: the Upcoming cards above carry the actions. A visit that
// has passed fades further, so the row still shows it happened.
export default function VisitLine({ visit }: { visit: Visit }) {
  const past = !isUpcoming(visit);
  return (
    // Same styles as the Upcoming card: the kind as an uppercase label, the time in plum.
    <p className={`m-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 ${past ? 'opacity-60' : ''}`}>
      <span className={past ? 'text-sand' : 'text-rosewood'}>
        <CalendarIcon />
      </span>
      <span className="font-sans text-label tracking-[0.05em] text-cocoa uppercase">{KIND_LABELS[visit.kind]}</span>
      <span className="text-small text-plum tabular-nums">{formatVisitTime(visit)}</span>
    </p>
  );
}
