"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { dashboardEaseOut } from "@/features/operations-dashboard/ui/dashboard-motion";

export function MetricRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <motion.div
      className="mt-1 space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center justify-between py-1">
          <span className="h-3 w-24 animate-pulse rounded-md bg-secondary" />
          <div className="flex items-center gap-4">
            <span className="h-3 w-14 animate-pulse rounded-md bg-secondary/80" />
            <span className="h-3 w-10 animate-pulse rounded-md bg-secondary/60" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export function CostPanelSkeleton() {
  return (
    <div className="mt-2 flex flex-col items-center">
      <motion.div
        className="h-40 w-40 animate-pulse rounded-full bg-secondary/80"
        animate={{ opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="mt-4 w-full space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex justify-between gap-3">
            <span className="h-3 w-20 animate-pulse rounded-md bg-secondary" />
            <span className="h-3 w-16 animate-pulse rounded-md bg-secondary/70" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function AnimatedHealthBar({
  percent,
  status,
  animateKey,
}: {
  percent: number;
  status: string;
  animateKey: string | number;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const bar =
    status === "Healthy"
      ? "bg-emerald-500"
      : status === "Degraded"
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <motion.div
      key={animateKey}
      className="flex items-center gap-2"
      initial={reducedMotion ? false : { opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary"
        layout={!reducedMotion}
      >
        <motion.div
          className={`h-full rounded-full ${bar}`}
          initial={reducedMotion ? false : { width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          transition={{ duration: 0.65, ease: dashboardEaseOut }}
        />
      </motion.div>
      <motion.span
        key={`${animateKey}-label`}
        className="text-xs text-muted-foreground tabular-nums"
        initial={reducedMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease: dashboardEaseOut }}
      >
        {percent}%
      </motion.span>
    </motion.div>
  );
}

export function AnimatedMetricItem({
  label,
  value,
  trend,
  isPositiveTrend,
  animateKey,
}: {
  label: string;
  value: string;
  trend: number;
  isPositiveTrend: boolean;
  animateKey: string | number;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const isUp = trend > 0;
  const hasValue = value !== "—";

  return (
    <motion.div
      key={animateKey}
      className="flex items-center justify-between py-1"
      initial={reducedMotion ? false : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.38, ease: dashboardEaseOut }}
    >
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <motion.span
          className="w-16 text-right text-[13px] font-medium text-foreground tabular-nums"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.32 }}
        >
          {value}
        </motion.span>
        {hasValue && trend > 0 ? (
          <span
            className={[
              "flex w-12 items-center justify-end gap-0.5 text-[11px] font-medium",
              isPositiveTrend ? "text-emerald-600" : "text-rose-500",
            ].join(" ")}
          >
            {isUp ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

export function AnimatedStatusDistributionItem({
  label,
  count,
  percent,
  colorClass,
  textClass,
  dotClass,
  animateKey,
}: {
  label: string;
  count: number;
  percent: string;
  colorClass: string;
  textClass: string;
  dotClass: string;
  animateKey: string | number;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const width = percent.endsWith("%") ? percent : `${percent}%`;

  return (
    <motion.div
      key={animateKey}
      className="flex items-center gap-3"
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: dashboardEaseOut }}
    >
      <div className="flex w-24 items-center gap-2">
        <motion.div
          className={`h-2 w-2 rounded-full ${dotClass}`}
          animate={reducedMotion ? undefined : { scale: [1, 1.25, 1] }}
          transition={{ duration: 0.5, ease: dashboardEaseOut }}
        />
        <span className="text-[13px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className={`h-full rounded-full ${colorClass}`}
            initial={reducedMotion ? false : { width: 0 }}
            animate={{ width }}
            transition={{ duration: 0.7, ease: dashboardEaseOut }}
          />
        </div>
      </div>
      <div className="w-16 text-right">
        <span className={`text-[13px] font-medium tabular-nums ${textClass}`}>{count}</span>
        <span className="ml-1 text-[11px] text-muted-foreground">({percent})</span>
      </div>
    </motion.div>
  );
}

export function AnimatedCostRing({
  totalLabel,
  breakdown,
  animateKey,
}: {
  totalLabel: string;
  breakdown: Array<{ label: string; percent: number; color: string }>;
  animateKey: string | number;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const circumference = 2 * Math.PI * 40;
  let offset = 0;

  return (
    <motion.div
      key={animateKey}
      className="relative flex h-40 w-40 items-center justify-center"
      initial={reducedMotion ? false : { opacity: 0, rotate: -8 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.45, ease: dashboardEaseOut }}
    >
      <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
        {breakdown.map((slice, index) => {
          const dash = (slice.percent / 100) * circumference;
          const circle = (
            <motion.circle
              key={`${slice.label}-${animateKey}`}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={slice.color}
              strokeWidth="14"
              strokeLinecap="round"
              initial={reducedMotion ? false : { strokeDasharray: `0 ${circumference}` }}
              animate={{
                strokeDasharray: `${dash} ${circumference - dash}`,
                strokeDashoffset: -offset,
              }}
              transition={{ duration: 0.65, delay: index * 0.06, ease: dashboardEaseOut }}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-foreground">{totalLabel}</span>
      </div>
    </motion.div>
  );
}
