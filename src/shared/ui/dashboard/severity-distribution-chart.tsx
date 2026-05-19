import { SeverityLevel } from "@/shared/types/aiops";

const COLORS: Record<SeverityLevel, string> = {
  critical: "hsl(0 82% 58%)",
  high: "hsl(19 92% 55%)",
  medium: "hsl(34 93% 53%)",
  low: "hsl(160 60% 42%)",
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
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const segments = slices
    .filter((slice) => slice.count > 0)
    .reduce<
      {
        severity: SeverityLevel;
        count: number;
        dash: number;
        offset: number;
        color: string;
      }[]
    >((accumulator, slice) => {
      const fraction = slice.count / total;
      const dash = fraction * circumference;
      const offset = accumulator.reduce((sum, segment) => sum + segment.dash, 0);
      return [
        ...accumulator,
        {
          ...slice,
          dash,
          offset,
          color: COLORS[slice.severity],
        },
      ];
    }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-48 w-full items-center justify-center">
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
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-2xl font-semibold text-foreground">{total}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Total
            </p>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {slices.map((slice) => (
          <div
            key={slice.severity}
            className="flex items-center gap-1.5 text-xs capitalize text-muted-foreground"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[slice.severity] }} />
            {slice.severity} · {slice.count}
          </div>
        ))}
      </div>
    </div>
  );
}
