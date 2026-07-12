// Events can go live before their schedule is finalized (start_time/
// end_time are nullable) — these helpers centralize the "TBD" fallback so
// every screen shows the same thing instead of each reinventing it.

export function formatEventDate(iso: string | null): string {
  if (!iso) return 'Date TBD';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatEventDateShort(iso: string | null): string {
  if (!iso) return 'TBD';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatEventTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatEventTimeRange(start: string | null, end: string | null): string {
  if (!start || !end) return 'Time TBD';
  return `${formatEventTime(start)} – ${formatEventTime(end)}`;
}
