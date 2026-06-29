const pad = (n: number) => String(n).padStart(2, '0');

/** epoch ms -> value for <input type="datetime-local"> (local time). */
export function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local string -> epoch ms (interpreted as local time). */
export function fromLocalInputValue(s: string): number {
  return new Date(s).getTime();
}

/** Heading for a day group, e.g. "Today", "Yesterday", or "Mon 23 Jun 2026". */
export function dayLabel(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Local clock time, e.g. "14:05". */
export function timeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
