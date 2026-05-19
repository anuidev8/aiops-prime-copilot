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
        "glass rounded-2xl p-4 relative overflow-hidden",
        accent ? "neon-ring" : "",
      ].join(" ")}
    >
      {accent ? (
        <div className="absolute -inset-px rounded-2xl pointer-events-none opacity-40 bg-[linear-gradient(120deg,transparent_30%,hsl(var(--primary)/0.15)_50%,transparent_70%)] bg-[length:200%_100%] animate-shimmer" aria-hidden />
      ) : null}
      <div className="relative">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          {label}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="font-display text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {trend !== undefined ? (
            <div
              className={[
                "flex items-center gap-0.5 text-xs font-medium shrink-0",
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
        <Sparkline points={sparkline} className="mt-3 h-8 w-full opacity-80" />
      </div>
    </article>
  );
}
