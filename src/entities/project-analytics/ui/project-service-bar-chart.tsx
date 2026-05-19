"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PrimeKpiViewModel } from "@/shared/types/aiops";
import { kpiScaleValue } from "@/shared/lib/kpi-display";

const easeOut = [0.22, 1, 0.36, 1] as const;

interface ProjectServiceBarChartProps {
  kpis: PrimeKpiViewModel[];
}

export function ProjectServiceBarChart({ kpis }: ProjectServiceBarChartProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const items = kpis.slice(0, 4);
  const width = 360;
  const height = 166;
  const padding = 20;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const barGap = 10;
  const barWidth =
    items.length > 0
      ? (innerWidth - barGap * Math.max(items.length - 1, 0)) / items.length
      : innerWidth;

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">KPI Bars</p>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">No KPI bars available.</p>
      ) : (
        <div className="mt-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="rgb(51 65 85)"
              strokeWidth="1"
            />
            {items.map((kpi, index) => {
              const scaled = kpiScaleValue(kpi);
              const barHeight = Math.max((scaled / 100) * innerHeight, 5);
              const x = padding + index * (barWidth + barGap);
              const y = height - padding - barHeight;
              return (
                <g key={`${kpi.name}-bar`}>
                  <motion.rect
                    x={x}
                    y={y}
                    width={barWidth}
                    rx={4}
                    fill="url(#serviceBarsGradient)"
                    initial={reducedMotion ? false : { y: height - padding, height: 0 }}
                    animate={{ y, height: barHeight }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.55,
                      ease: easeOut,
                      delay: index * 0.05,
                    }}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={height - 4}
                    textAnchor="middle"
                    className="fill-slate-400 text-[9px]"
                  >
                    {kpi.name.slice(0, 8)}
                  </text>
                </g>
              );
            })}
            <defs>
              <linearGradient id="serviceBarsGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgb(6 182 212)" />
                <stop offset="100%" stopColor="rgb(99 102 241)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="mt-1 space-y-1.5">
            {items.map((kpi) => (
              <div
                key={`${kpi.name}-legend`}
                className="flex items-center justify-between text-[11px] text-slate-300"
              >
                <span>{kpi.name}</span>
                <span className="font-mono">
                  {kpi.value}
                  {kpi.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

