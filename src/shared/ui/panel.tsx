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
        "rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm",
        "backdrop-blur-sm",
        className ?? "",
      ].join(" ")}
    >
      <header className="mb-3">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-slate-600">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
