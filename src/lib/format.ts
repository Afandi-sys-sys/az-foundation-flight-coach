import { DAY_MS } from "./progress-logic";

export function formatDue(due: number, now: number): string {
  if (due <= now) return "Due now";
  const days = Math.ceil((due - now) / DAY_MS);
  return days === 1 ? "Due in 1 day" : `Due in ${days} days`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
