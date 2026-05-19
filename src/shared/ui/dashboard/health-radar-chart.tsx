interface HealthMetric {
  metric: string;
  value: number;
}

interface HealthRadarChartProps {
  metrics: HealthMetric[];
}

export function HealthRadarChart({ metrics }: HealthRadarChartProps) {
  const center = 80;
  const maxRadius = 55;
  const angleStep = (Math.PI * 2) / metrics.length;

  const points = metrics.map((metric, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = (metric.value / 100) * maxRadius;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return `${x},${y}`;
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="h-56 flex items-center justify-center">
      <svg viewBox="0 0 160 160" className="h-full max-h-56 w-full max-w-[220px]">
        {gridLevels.map((level) => {
          const gridPoints = metrics
            .map((_, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const radius = maxRadius * level;
              const x = center + Math.cos(angle) * radius;
              const y = center + Math.sin(angle) * radius;
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={level}
              points={gridPoints}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
          );
        })}
        {metrics.map((metric, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = center + Math.cos(angle) * maxRadius;
          const y = center + Math.sin(angle) * maxRadius;
          const labelX = center + Math.cos(angle) * (maxRadius + 14);
          const labelY = center + Math.sin(angle) * (maxRadius + 14);
          return (
            <g key={metric.metric}>
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[8px] uppercase"
              >
                {metric.metric}
              </text>
            </g>
          );
        })}
        <polygon
          points={points.join(" ")}
          fill="hsl(var(--primary) / 0.2)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
