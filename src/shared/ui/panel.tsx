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
        "glass-panel p-5",
        className ?? "",
      ].join(" ")}
    >
      <header className="mb-4">
        <h2 className="text-lg font-medium tracking-wide text-white">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
