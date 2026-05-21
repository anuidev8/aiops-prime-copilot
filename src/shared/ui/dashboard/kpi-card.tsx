import { Sparkline } from "@/shared/ui/dashboard/sparkline";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  accent?: boolean;
  sparkline?: number[];
}

export function KpiCard({
  label,
  value,
  trend,
  trendLabel,
  accent,
  sparkline = [3, 5, 4, 7, 6, 8, 7, 9],
}: KpiCardProps) {
  const up = (trend ?? 0) > 0;
  const down = (trend ?? 0) < 0;

  return (
    <article
      className={[
        "relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm",
        accent ? "border-indigo-200" : "border-slate-200",
      ].join(" ")}
    >
      {accent ? (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl bg-[linear-gradient(120deg,transparent_30%,hsl(var(--primary)/0.1)_50%,transparent_70%)] bg-[length:200%_100%] opacity-60 animate-shimmer"
          aria-hidden
        />
      ) : null}
      <div className="relative">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {trend !== undefined ? (
            <div
              className={[
                "flex shrink-0 items-center gap-0.5 text-xs font-semibold",
                up ? "text-warning" : down ? "text-success" : "text-muted-foreground",
              ].join(" ")}
            >
              {up ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
              ) : down ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7 17 17"/><path d="M17 7v10H7"/></svg>
              ) : null}
              {trendLabel ?? `${Math.abs(trend)}%`}
            </div>
          ) : null}
        </div>
        <Sparkline points={sparkline} className="mt-3 h-8 w-full opacity-75" />
      </div>
    </article>
  );
}
