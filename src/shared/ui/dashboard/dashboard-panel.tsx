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
    <section className={["glass rounded-2xl p-4", className ?? ""].join(" ")}>
      <header className="mb-3">
        <h3 className="font-display font-semibold text-sm text-foreground">{title}</h3>
        {subtitle ? (
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
