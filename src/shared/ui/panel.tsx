import { PropsWithChildren } from "react";

interface PanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  className?: string;
}

export function Panel({ title, subtitle, className, children }: PanelProps) {
  return (
    <section className={["rounded-3xl border border-border bg-white p-5", className ?? ""].join(" ")}>
      <header className="mb-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
