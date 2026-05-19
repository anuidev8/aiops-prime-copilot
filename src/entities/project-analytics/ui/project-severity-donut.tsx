import { SeverityMixSliceViewModel } from "@/shared/types/aiops";

const SEVERITY_COLORS: Record<SeverityMixSliceViewModel["severity"], string> = {
  critical: "rgb(244 63 94)",
  high: "rgb(251 146 60)",
  medium: "rgb(250 204 21)",
  low: "rgb(52 211 153)",
};

interface ProjectSeverityDonutProps {
  severityMix: SeverityMixSliceViewModel[];
}

export function ProjectSeverityDonut({ severityMix }: ProjectSeverityDonutProps) {
  const total = severityMix.reduce((sum, slice) => sum + slice.count, 0);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  const segments =
    total > 0
      ? severityMix.filter((slice) => slice.count > 0)
      : severityMix.map((slice) => ({ ...slice, count: 1, percentage: 25 }));

  const denominator = Math.max(total, segments.length);
  const arcs = segments.reduce<
    Array<{ slice: (typeof segments)[number]; dashOffset: number; arc: number }>
  >((accumulated, slice) => {
    const arc = (slice.count / denominator) * circumference;
    const dashOffset = accumulated.reduce((sum, entry) => sum + entry.arc, 0);
    accumulated.push({ slice, dashOffset, arc });
    return accumulated;
  }, []);

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
        Severity Mix
      </p>
      <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <svg viewBox="0 0 84 84" className="h-24 w-24 shrink-0">
          <circle
            cx="42"
            cy="42"
            r={radius}
            fill="none"
            stroke="rgb(30 41 59)"
            strokeWidth="8"
          />
          {arcs.map(({ slice, dashOffset, arc }) => (
            <circle
              key={slice.severity}
              cx="42"
              cy="42"
              r={radius}
              fill="none"
              stroke={SEVERITY_COLORS[slice.severity]}
              strokeWidth="8"
              strokeDasharray={`${arc} ${circumference}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="butt"
              transform="rotate(-90 42 42)"
            />
          ))}
          <text
            x="42"
            y="46"
            textAnchor="middle"
            className="fill-slate-200 text-[11px] font-semibold"
          >
            {total}
          </text>
        </svg>
        <div className="w-full space-y-1.5">
          {severityMix.map((slice) => (
            <div
              key={slice.severity}
              className="flex items-center justify-between text-[11px] text-slate-300"
            >
              <span className="flex items-center gap-2 capitalize">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[slice.severity] }}
                />
                {slice.severity}
              </span>
              <span className="font-mono text-slate-400">
                {slice.count} ({slice.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
