interface SparklineProps {
  points: number[];
  className?: string;
  strokeClassName?: string;
}

export function Sparkline({
  points,
  className,
  strokeClassName = "stroke-primary",
}: SparklineProps) {
  if (points.length < 2) {
    return <svg viewBox="0 0 100 24" className={className ?? "h-8 w-full"} />;
  }

  const max = Math.max(...points, 1);
  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 22 - (value / max) * 18;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 24" className={className ?? "h-8 w-full"} preserveAspectRatio="none">
      <path
        d={path}
        fill="none"
        className={strokeClassName}
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
