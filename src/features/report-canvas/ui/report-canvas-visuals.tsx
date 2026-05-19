"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { ReportCanvasChartBlock, ReportCanvasSeriesDatum } from "@/shared/types/report-canvas";

const easeOut = [0.22, 1, 0.36, 1] as const;

const CHART_COLORS = [
  "rgb(34 211 238)",
  "rgb(139 92 246)",
  "rgb(59 130 246)",
  "rgb(16 185 129)",
  "rgb(249 115 22)",
  "rgb(244 63 94)",
];

function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function defaultSeries(block: ReportCanvasChartBlock): ReportCanvasSeriesDatum[] {
  return [
    {
      id: `${block.id}-series`,
      label: block.metricName,
      value: block.value,
    },
  ];
}

function maxFromSeries(series: ReportCanvasSeriesDatum[], fallback: number): number {
  return Math.max(fallback, ...series.map((entry) => entry.value), 1);
}

function RingVisual({ block }: { block: ReportCanvasChartBlock }) {
  const reducedMotion = Boolean(useReducedMotion());
  const series = block.visual?.series?.length ? block.visual.series : defaultSeries(block);
  const total = series.reduce((sum, entry) => sum + entry.value, 0);
  const max = Math.max(block.visual?.maxValue ?? total, 1);
  const ratio = Math.min(Math.max(total / max, 0), 1);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-cyan-500/20 bg-slate-950/40 p-3">
      <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgb(30 41 59)"
          strokeWidth="10"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgb(34 211 238)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reducedMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: reducedMotion ? 0 : 0.9, ease: easeOut }}
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="64"
          textAnchor="middle"
          className="fill-slate-100 text-[13px] font-semibold"
        >
          {Math.round(ratio * 100)}%
        </text>
      </svg>
      <div className="space-y-1.5">
        {series.slice(0, 4).map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={reducedMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, delay: index * 0.06 }}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="text-slate-300">{entry.label}</span>
            <span className="font-mono text-cyan-200">{entry.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BarsVisual({ block }: { block: ReportCanvasChartBlock }) {
  const reducedMotion = Boolean(useReducedMotion());
  const series = block.visual?.series?.length ? block.visual.series : defaultSeries(block);
  const max = maxFromSeries(series, block.visual?.maxValue ?? block.value);

  return (
    <div className="space-y-2.5 rounded-xl border border-indigo-500/20 bg-slate-950/40 p-3">
      {series.slice(0, 6).map((entry, index) => {
        const width = Math.min((entry.value / max) * 100, 100);
        return (
          <div key={entry.id} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>{entry.label}</span>
              <span className="font-mono">{entry.value.toFixed(1)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800/90">
              <motion.div
                className="h-2 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${colorAt(index)} 0%, rgb(30 64 175) 100%)`,
                }}
                initial={reducedMotion ? false : { width: "0%" }}
                animate={{ width: `${width}%` }}
                transition={{ duration: reducedMotion ? 0 : 0.65, ease: easeOut, delay: index * 0.04 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendPath({
  series,
  width,
  height,
  padding,
}: {
  series: ReportCanvasSeriesDatum[];
  width: number;
  height: number;
  padding: number;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const points = useMemo(() => {
    if (series.length === 0) return [];
    const values = series.map((entry) => entry.value);
    const min = Math.min(...values);
    const max = Math.max(...values, min + 1);
    const spread = max - min || 1;

    return series.map((entry, index) => {
      const x =
        padding +
        ((width - padding * 2) * (series.length === 1 ? 0 : index / (series.length - 1)));
      const y = height - padding - (((entry.value - min) / spread) * (height - padding * 2));
      return { x, y, entry };
    });
  }, [height, padding, series, width]);

  const path = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }, [points]);

  if (points.length === 0) {
    return (
      <text x={padding} y={height / 2} className="fill-slate-500 text-[11px]">
        No trend points available
      </text>
    );
  }

  return (
    <>
      <motion.path
        d={path}
        fill="none"
        stroke="rgb(34 211 238)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reducedMotion ? false : { pathLength: 0, opacity: 0.65 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.8, ease: easeOut }}
      />
      {points.map((point, index) => (
        <motion.circle
          key={point.entry.id}
          cx={point.x}
          cy={point.y}
          r={3}
          fill="rgb(34 211 238)"
          initial={reducedMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, delay: 0.25 + index * 0.04 }}
        />
      ))}
    </>
  );
}

function TrendVisual({ block }: { block: ReportCanvasChartBlock }) {
  const series = block.visual?.series?.length ? block.visual.series : defaultSeries(block);
  const width = 420;
  const height = 170;
  const padding = 18;

  return (
    <div className="space-y-2 rounded-xl border border-sky-500/20 bg-slate-950/40 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="rgb(51 65 85)"
          strokeWidth="1"
        />
        <TrendPath series={series.slice(-10)} width={width} height={height} padding={padding} />
      </svg>
      <div className="grid gap-1 text-[11px] text-slate-400 sm:grid-cols-2">
        {series.slice(-6).map((entry) => (
          <span key={`legend-${entry.id}`} className="truncate">
            {entry.label}: {entry.value}
            {typeof entry.secondaryValue === "number" ? ` / ${entry.secondaryValue}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function KpiVisual({ block }: { block: ReportCanvasChartBlock }) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-emerald-300/80">{block.metricName}</p>
      <motion.p
        className="mt-2 font-mono text-3xl font-semibold text-emerald-100"
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.45, ease: easeOut }}
      >
        {block.value}
        {block.unit}
      </motion.p>
      <p className="mt-2 text-xs text-slate-300">{block.note}</p>
    </div>
  );
}

export function ReportCanvasChartVisual({ block }: { block: ReportCanvasChartBlock }) {
  const kind = block.visual?.kind ?? "kpi";

  if (kind === "ring") {
    return <RingVisual block={block} />;
  }
  if (kind === "bars") {
    return <BarsVisual block={block} />;
  }
  if (kind === "trend") {
    return <TrendVisual block={block} />;
  }
  return <KpiVisual block={block} />;
}

