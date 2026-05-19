export function OperationalMap() {
  return (
    <div className="relative h-48 rounded-xl border border-border/40 bg-background/40 overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.25),transparent_55%),radial-gradient(circle_at_70%_60%,hsl(var(--primary-glow)/0.2),transparent_50%)]" />
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="mapGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary-glow))" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {[80, 160, 240, 320].map((x, i) =>
          [60, 100, 140].map((y, j) => (
            <g key={`${i}-${j}`}>
              <circle cx={x} cy={y} r="6" fill="url(#mapGlow)" opacity={0.5 + (i + j) * 0.08} />
              <circle cx={x} cy={y} r="2" fill="hsl(var(--primary))" />
            </g>
          )),
        )}
        <path
          d="M 60 100 L 160 60 L 240 140 L 320 100"
          stroke="hsl(var(--primary) / 0.35)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="4 4"
        />
      </svg>
      <div className="absolute top-3 left-3 glass rounded-lg px-2 py-1 text-[10px] text-primary font-mono">
        NODE-07 · 98% load
      </div>
      <div className="absolute bottom-3 right-3 glass rounded-lg px-2 py-1 text-[10px] text-muted-foreground font-mono">
        us-east-1
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 px-4 pb-2">
        <Gauge label="Production" value={72} color="hsl(var(--warning))" />
        <Gauge label="Consumption" value={58} color="hsl(var(--success))" />
      </div>
    </div>
  );
}

function Gauge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <svg viewBox="0 0 60 32" className="w-16 h-8">
        <path
          d="M 6 28 A 24 24 0 0 1 54 28"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="4"
        />
        <path
          d="M 6 28 A 24 24 0 0 1 54 28"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${(value / 100) * 75} 75`}
          strokeLinecap="round"
        />
      </svg>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
