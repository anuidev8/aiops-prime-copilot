import { SeverityLevel } from "@/shared/types/aiops";

const COLORS: Record<SeverityLevel, string> = {
  critical: "hsl(0 84% 62%)",
  high: "hsl(24 95% 60%)",
  medium: "hsl(38 95% 58%)",
  low: "hsl(var(--primary))",
};

interface Slice {
  severity: SeverityLevel;
  count: number;
}

interface SeverityDistributionChartProps {
  slices: Slice[];
}

export function SeverityDistributionChart({ slices }: SeverityDistributionChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0) || 1;
  let offset = 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const segments = slices
    .filter((slice) => slice.count > 0)
    .map((slice) => {
      const fraction = slice.count / total;
      const dash = fraction * circumference;
      const segment = {
        ...slice,
        dash,
        offset,
        color: COLORS[slice.severity],
      };
      offset += dash;
      return segment;
    });

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-48 w-full flex items-center justify-center">
        <svg viewBox="0 0 88 88" className="h-36 w-36 -rotate-90">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="10"
          />
          {segments.map((segment) => (
            <circle
              key={segment.severity}
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="10"
              strokeDasharray={`${segment.dash} ${circumference}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            <p className="font-display text-2xl font-bold">{total}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Total
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {slices.map((slice) => (
          <div
            key={slice.severity}
            className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS[slice.severity] }}
            />
            {slice.severity} · {slice.count}
          </div>
        ))}
      </div>
    </div>
  );
}
