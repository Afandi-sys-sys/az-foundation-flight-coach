import { Link } from "@tanstack/react-router";
import { useHydrated } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BarChart3, BookOpenCheck, ClipboardCheck, Home, Layers, LineChart } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import { dueCards } from "@/lib/progress-logic";
import { UnofficialNote } from "./kit";

/** `short` is used in the mobile tab bar, where each tab is only ~60px wide. */
const NAV = [
  { to: "/", label: "Home", short: "Home", icon: Home },
  { to: "/practice", label: "Practice", short: "Practice", icon: BookOpenCheck },
  { to: "/review", label: "Revision Flashcards", short: "Revision", icon: Layers },
  { to: "/tests", label: "Tests", short: "Tests", icon: ClipboardCheck },
  { to: "/results", label: "Results", short: "Results", icon: BarChart3 },
  { to: "/progress", label: "Progress", short: "Progress", icon: LineChart },
] as const;

function useDueCount() {
  const state = useProgress();
  const hydrated = useHydrated();
  return hydrated ? dueCards(state, Date.now()).length : 0;
}

function DueBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} cards due`}
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-5 text-accent-foreground"
    >
      {count}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const due = useDueCount();
  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-30 border-b border-border bg-nav backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 md:h-16">
          <Link to="/" className="font-display text-xl font-bold">
            CloudPrep <span className="text-primary">Africa</span>
          </Link>
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground md:hidden">
            Unofficial
          </span>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                {item.label}
                {item.to === "/review" ? <DueBadge count={due} /> : null}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-8 md:pt-10 md:pb-12">{children}</main>

      <footer className="mx-auto max-w-3xl px-4 pb-safe-nav md:pb-10">
        <div className="border-t border-border pt-6">
          <UnofficialNote />
          <a
            href="https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Official AZ-900 study guide on Microsoft Learn
          </a>
        </div>
      </footer>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-nav pb-safe backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-6">
          {NAV.map(({ to, label, short, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                activeOptions={{ exact: to === "/" }}
                className="group relative flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground data-[status=active]:text-primary"
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  {to === "/review" && due > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5">
                      <DueBadge count={due} />
                    </span>
                  ) : null}
                </span>
                {short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
