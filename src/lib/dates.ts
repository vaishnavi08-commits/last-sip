const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// offsetDays is always >= 1 here; callers handle 0 ("today") themselves,
// since what "today" should say differs by screen.
export function relativeDate(offsetDays: number): string {
  if (offsetDays === 1) return "tomorrow";
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`;
}
