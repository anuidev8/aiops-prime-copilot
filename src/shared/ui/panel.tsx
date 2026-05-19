import { PropsWithChildren } from "react";

interface PanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  className?: string;
}

export function Panel({ title, subtitle, className, children }: PanelProps) {
  return (
    <section
      className={[
        "glass rounded-2xl p-5",
        className ?? "",
      ].join(" ")}
    >
      <header className="mb-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
