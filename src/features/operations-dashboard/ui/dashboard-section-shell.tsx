"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type {
  DashboardHighlightKind,
  DashboardHighlightSection,
} from "@/shared/types/dashboard-highlight";
import { dashboardEaseOut } from "@/features/operations-dashboard/ui/dashboard-motion";
import {
  resolveDashboardHighlightTheme,
} from "@/features/operations-dashboard/ui/dashboard-highlight-theme";

interface DashboardSectionShellProps {
  sectionId: DashboardHighlightSection;
  highlighted: boolean;
  highlightKind?: DashboardHighlightKind;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

export function DashboardSectionShell({
  sectionId,
  highlighted,
  highlightKind = "default",
  loading = false,
  children,
  className = "",
}: DashboardSectionShellProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const theme = resolveDashboardHighlightTheme(
    highlightKind,
    sectionId,
    highlighted,
  );
  const isAnalystFocus =
    highlighted &&
    highlightKind === "analyst" &&
    (sectionId === "insights" || sectionId === "generative-ui");

  return (
    <motion.div
      data-dashboard-section={sectionId}
      data-highlight-kind={highlightKind}
      className={[
        "relative overflow-hidden rounded-2xl transition-shadow duration-300",
        highlighted ? `ring-2 ring-offset-2 ${theme.ring} ${theme.ringOffset} ${theme.glow}` : "",
        highlighted ? theme.surface : "",
        className,
      ].join(" ")}
      initial={false}
      animate={
        reducedMotion
          ? { opacity: 1 }
          : highlighted
            ? {
                opacity: 1,
                scale: isAnalystFocus ? [1, 1.012, 1.006, 1] : [1, 1.008, 1],
              }
            : { opacity: 1, scale: 1 }
      }
      transition={
        highlighted
          ? {
              duration: isAnalystFocus ? 0.85 : 0.55,
              ease: dashboardEaseOut,
              times: isAnalystFocus ? [0, 0.35, 0.7, 1] : undefined,
            }
          : { duration: 0.28, ease: dashboardEaseOut }
      }
    >
      {highlighted && !reducedMotion ? (
        <>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.45, 0.25] }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <motion.span
            aria-hidden
            className={[
              "pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl",
              theme.orbA,
            ].join(" ")}
            animate={{ opacity: [0.2, 0.55, 0.25], scale: [0.9, 1.15, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden
            className={[
              "pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full blur-2xl",
              theme.orbB,
            ].join(" ")}
            animate={{ opacity: [0.15, 0.45, 0.2], scale: [1, 1.2, 0.95] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.35,
            }}
          />
          <motion.span
            aria-hidden
            className={[
              "pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r",
              theme.shimmer,
            ].join(" ")}
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{ opacity: [0, 1, 0], scaleX: [0.2, 1, 0.85] }}
            transition={{ duration: 1.1, ease: dashboardEaseOut }}
          />
        </>
      ) : null}

      {highlighted ? (
        <motion.div
          className="pointer-events-none absolute right-3 top-3 z-20"
          initial={reducedMotion ? false : { opacity: 0, y: -6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: dashboardEaseOut }}
        >
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm",
              theme.badge,
            ].join(" ")}
          >
            {!reducedMotion ? (
              <motion.span
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
              </motion.span>
            ) : (
              <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
            )}
            {theme.badgeText}
          </span>
        </motion.div>
      ) : null}

      {loading ? (
        <span
          aria-hidden
          className={[
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden rounded-t-2xl",
            theme.loadingBar,
          ].join(" ")}
        >
          <motion.span
            className={[
              "block h-full w-2/5 bg-gradient-to-r from-transparent to-transparent",
              theme.loadingShimmer,
            ].join(" ")}
            animate={reducedMotion ? undefined : { x: ["-120%", "340%"] }}
            transition={
              reducedMotion
                ? undefined
                : { duration: 1.15, repeat: Infinity, ease: "linear" }
            }
          />
        </span>
      ) : null}

      <motion.div
        layout={!reducedMotion}
        transition={{ duration: 0.35, ease: dashboardEaseOut }}
        className={highlighted ? "relative z-[1] pt-10 sm:pt-9" : undefined}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
