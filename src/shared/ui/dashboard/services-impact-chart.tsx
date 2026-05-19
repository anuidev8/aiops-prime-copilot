interface ServiceImpact {
  name: string;
  impact: number;
}

interface ServicesImpactChartProps {
  services: ServiceImpact[];
}

export function ServicesImpactChart({ services }: ServicesImpactChartProps) {
  const max = Math.max(...services.map((service) => service.impact), 1);

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <div key={service.name} className="grid grid-cols-[110px_1fr_40px] items-center gap-3">
          <span className="text-xs text-muted-foreground truncate">{service.name}</span>
          <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
              style={{ width: `${(service.impact / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-foreground text-right">
            {service.impact}%
          </span>
        </div>
      ))}
    </div>
  );
}
