import { PropsWithChildren } from "react";

interface DashboardPanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  className?: string;
}

export function DashboardPanel({
  title,
  subtitle,
  className,
  children,
}: DashboardPanelProps) {
  return (
    <section className={["rounded-3xl border border-border bg-white p-4 sm:p-5", className ?? ""].join(" ")}>
      <header className="mb-3">
        <h3 className="font-display text-sm font-semibold text-foreground sm:text-base">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
