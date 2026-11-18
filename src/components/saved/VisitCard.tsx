import { visitDateParts } from '../../lib/calendar';
import { KIND_LABELS, type Visit } from '../../lib/visits';
import { VisitActions } from './VisitLine';

// An upcoming visit as a card, led by a date tile so the day reads at a glance and
// a row of cards reads in time order. `next`: the soonest one, its tile in plum.
export default function VisitCard({ visit, next = false, onEdit }: { visit: Visit; next?: boolean; onEdit?: () => void }) {
  const { day, month, weekday, time } = visitDateParts(visit);
  return (
    <article className="flex h-full flex-col gap-4 rounded-lg border border-sand p-4">
      <div className="flex gap-4">
        <div
          className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-md py-2 text-center ${
            next ? 'bg-plum text-cream' : 'bg-linen text-plum'
          }`}
        >
          <span className="font-sans text-label tracking-[0.05em] uppercase">{month}</span>
          <span className="font-serif text-heading font-light">{day}</span>
          <span className={`font-sans text-label tracking-[0.05em] uppercase ${next ? 'text-cream/80' : 'text-cocoa'}`}>{weekday}</span>
        </div>
        <div className="min-w-0">
          <p className="m-0 font-sans text-label tracking-[0.05em] text-cocoa uppercase">{KIND_LABELS[visit.kind]}</p>
          <p className="m-0 mt-1 truncate font-serif text-body">{visit.vendorName}</p>
          <p className="m-0 mt-0.5 text-small text-plum tabular-nums">
            {time}
            {visit.cityName && <span className="text-cocoa"> · {visit.cityName}</span>}
          </p>
          {visit.note && <p className="m-0 mt-1 text-small text-cocoa">{visit.note}</p>}
        </div>
      </div>
      <VisitActions visit={visit} onEdit={onEdit} className="mt-auto" />
    </article>
  );
}
