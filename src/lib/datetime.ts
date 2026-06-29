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
  // Force day-before-month order (never US month/day); names follow the locale.
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  return `${weekday} ${d.getDate()} ${month} ${d.getFullYear()}`;
}

/** Local clock time in 24h, e.g. "14:05" — departure-board style, fixed width. */
export function timeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Short relative time, e.g. "just now", "12m ago", "3h ago", "2d ago". */
export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
