"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ProjectIncidentTrendPointViewModel } from "@/shared/types/aiops";

const easeOut = [0.22, 1, 0.36, 1] as const;

interface ProjectIncidentTrendChartProps {
  points: ProjectIncidentTrendPointViewModel[];
}

export function ProjectIncidentTrendChart({ points }: ProjectIncidentTrendChartProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const width = 420;
  const height = 176;
  const padding = 18;
  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;
  const normalizedPoints = points.slice(-10);
  const maxCount = Math.max(...normalizedPoints.map((point) => point.incidentCount), 1);

  const plotted = normalizedPoints.map((point, index) => {
    const x =
      padding +
      (drawableWidth *
        (normalizedPoints.length === 1 ? 0 : index / (normalizedPoints.length - 1)));
    const y = height - padding - ((point.incidentCount / maxCount) * drawableHeight);
    return { x, y, point };
  });

  const linePath = plotted
    .map((entry, index) => `${index === 0 ? "M" : "L"} ${entry.x} ${entry.y}`)
    .join(" ");

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
        Incident Trend
      </p>
      {normalizedPoints.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">No trend points in this window.</p>
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
            <motion.path
              d={linePath}
              fill="none"
              stroke="rgb(56 189 248)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reducedMotion ? false : { pathLength: 0, opacity: 0.7 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.75, ease: easeOut }}
            />
            {plotted.map((entry, index) => (
              <g key={entry.point.timestamp}>
                <motion.circle
                  cx={entry.x}
                  cy={entry.y}
                  r={3}
                  fill="rgb(56 189 248)"
                  initial={reducedMotion ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: reducedMotion ? 0 : 0.25, delay: 0.24 + index * 0.05 }}
                />
                {entry.point.criticalCount > 0 ? (
                  <motion.circle
                    cx={entry.x}
                    cy={entry.y}
                    r={2}
                    fill="rgb(244 63 94)"
                    initial={reducedMotion ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.22,
                      delay: 0.3 + index * 0.05,
                    }}
                  />
                ) : null}
              </g>
            ))}
          </svg>
          <div className="mt-1 grid gap-1 text-[10px] text-slate-500 sm:grid-cols-2">
            {normalizedPoints.slice(-6).map((point) => (
              <span key={`legend-${point.timestamp}`}>
                {point.label}: {point.incidentCount} inc / {point.criticalCount} crit
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

