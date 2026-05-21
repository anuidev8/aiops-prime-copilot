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
    <section
      className={[
        "flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <header className="border-b border-slate-100 p-5 pb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
