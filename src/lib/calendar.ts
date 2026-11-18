import { KIND_LABELS, type Visit } from './visits';

// Turning a visit into calendar entries and a message for the partner. Nothing
// here talks to our backend or needs a login: Google Calendar opens its own "new
// event" screen from a link, and the .ics file opens in Apple Calendar or Outlook.

const DURATION_MINUTES = 60;

// Visits are entered in Taiwan time (UTC+8, no daylight saving). Calendars get UTC,
// so the event lands at the right moment whatever time zone the phone is set to.
export function visitStart(v: Pick<Visit, 'date' | 'time'>) {
  return new Date(`${v.date}T${v.time}:00+08:00`);
}

// A visit counts as upcoming until an hour after it starts (it may be under way).
export const isUpcoming = (v: Pick<Visit, 'date' | 'time'>) => visitStart(v).getTime() > Date.now() - 60 * 60_000;

// A saved vendor with an upcoming visit is locked: it can't be removed until the
// visit is deleted (which reminds the couple to cancel with the vendor too) or has
// passed. Removing it quietly would leave the visit behind, or drop it unnoticed.
export const hasUpcomingVisit = (visits: Visit[], category: string, vendorId: number) =>
  visits.some((v) => v.category === category && v.vendorId === vendorId && isUpcoming(v));

const visitEnd = (v: Visit) => new Date(visitStart(v).getTime() + DURATION_MINUTES * 60_000);

// 20261128T060000Z: the compact UTC form both Google Calendar and .ics files use.
const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const visitTitle = (v: Visit) => `${KIND_LABELS[v.kind]} at ${v.vendorName}`;

export const visitPlace = (v: Visit) => (v.cityName ? `${v.vendorName}, ${v.cityName}` : v.vendorName);

// "Sat, Nov 28 · 2:00 PM", always in Taiwan time.
export function formatVisitTime(v: Pick<Visit, 'date' | 'time'>) {
  const start = visitStart(v);
  const day = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Taipei' });
  const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Taipei' });
  return `${day} · ${time}`;
}

// The pieces of a visit's date and time, in Taiwan time: "28", "Nov", "Sat", "2:00 PM".
export function visitDateParts(v: Pick<Visit, 'date' | 'time'>) {
  const start = visitStart(v);
  const part = (options: Intl.DateTimeFormatOptions) => start.toLocaleString('en-US', { ...options, timeZone: 'Asia/Taipei' });
  return {
    day: part({ day: 'numeric' }),
    month: part({ month: 'short' }),
    weekday: part({ weekday: 'short' }),
    time: part({ hour: 'numeric', minute: '2-digit' }),
  };
}

// Google Calendar's "create event" link: opens the event filled in, ready to save.
export function googleCalendarUrl(v: Visit) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: visitTitle(v),
    dates: `${utcStamp(visitStart(v))}/${utcStamp(visitEnd(v))}`,
    location: visitPlace(v),
    details: v.note ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// Text in an .ics file: backslashes, commas, semicolons and line breaks are escaped.
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');

// A one-event calendar file (RFC 5545). Lines end in CRLF, as the format requires.
export function downloadIcs(v: Visit) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WedBudget//Visits//EN',
    'BEGIN:VEVENT',
    `UID:${v.id}@wedbudget`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(visitStart(v))}`,
    `DTEND:${utcStamp(visitEnd(v))}`,
    `SUMMARY:${icsText(visitTitle(v))}`,
    `LOCATION:${icsText(visitPlace(v))}`,
    ...(v.note ? [`DESCRIPTION:${icsText(v.note)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${visitTitle(v).replace(/[^\w-]+/g, '-').toLowerCase()}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

// The message for the partner: what, when, where, and a link that adds it to their
// own Google Calendar. LINE's share link opens LINE with the text ready to send.
export function lineShareUrl(v: Visit) {
  const text = [
    visitTitle(v),
    formatVisitTime(v),
    visitPlace(v),
    ...(v.note ? [v.note] : []),
    '',
    `Add to your calendar: ${googleCalendarUrl(v)}`,
  ].join('\n');
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}
