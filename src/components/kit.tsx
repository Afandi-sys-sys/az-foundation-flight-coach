import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6", className)}>
      {children}
    </section>
  );
}

export function ProgressBar({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-track", className)}
    >
      <div className="h-full rounded-full bg-progress transition-[width] duration-500" style={{ width: `${v}%` }} />
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function PageHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {children ? <div className="mt-2 text-muted-foreground">{children}</div> : null}
    </header>
  );
}

export function UnofficialNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      CloudPrep Africa is an independent, unofficial study tool. It is not affiliated with or endorsed by
      Microsoft. Practice questions are original and are not real exam questions.
    </p>
  );
}
