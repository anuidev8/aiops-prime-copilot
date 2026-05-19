"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { DashboardHighlightSection } from "@/shared/types/dashboard-highlight";
import { dashboardEaseOut } from "@/features/operations-dashboard/ui/dashboard-motion";

interface DashboardSectionShellProps {
  sectionId: DashboardHighlightSection;
  highlighted: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

export function DashboardSectionShell({
  sectionId,
  highlighted,
  loading = false,
  children,
  className = "",
}: DashboardSectionShellProps) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      data-dashboard-section={sectionId}
      className={[
        "relative rounded-2xl transition-shadow",
        highlighted
          ? "ring-2 ring-indigo-400/70 ring-offset-2 ring-offset-background shadow-[0_0_28px_-6px_rgba(99,102,241,0.55)]"
          : "",
        className,
      ].join(" ")}
      initial={false}
      animate={
        reducedMotion
          ? { opacity: 1 }
          : highlighted
            ? {
                opacity: 1,
                scale: [1, 1.008, 1],
              }
            : { opacity: 1, scale: 1 }
      }
      transition={
        highlighted
          ? { duration: 0.55, ease: dashboardEaseOut }
          : { duration: 0.25 }
      }
    >
      {highlighted && !reducedMotion ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-indigo-500/8"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      ) : null}
      {loading ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-t-2xl bg-indigo-100"
        >
          <motion.span
            className="block h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
            animate={reducedMotion ? undefined : { x: ["-100%", "320%"] }}
            transition={
              reducedMotion
                ? undefined
                : { duration: 1.1, repeat: Infinity, ease: "linear" }
            }
          />
        </span>
      ) : null}
      <motion.div
        layout={!reducedMotion}
        transition={{ duration: 0.35, ease: dashboardEaseOut }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
