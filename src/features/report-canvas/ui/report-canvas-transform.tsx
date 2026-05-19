"use client";

import { motion, useReducedMotion } from "framer-motion";

const easeOut = [0.32, 0.72, 0, 1] as const;

interface ReportCanvasTransformProps {
  projectName?: string | null;
}

export function ReportCanvasTransform({ projectName }: ReportCanvasTransformProps) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      className="relative min-h-[420px] overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
    >
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />

      <motion.div
        className="relative z-10 space-y-6"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <header className="flex flex-wrap items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
          </span>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: easeOut }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400/90">
              Transforming workspace
            </p>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Building report canvas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {projectName
                ? `Composing blocks for ${projectName} from PRIME summary…`
                : "Composing executive narrative and KPI blocks from session cache…"}
            </p>
          </motion.div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_2fr]">
          <motion.aside
            className="space-y-2 rounded-xl border border-border/40 bg-background/40 p-3"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05, ease: easeOut }}
          >
            {[0, 1, 2, 3].map((index) => (
              <motion.div
                key={index}
                className="h-12 rounded-lg border border-border/30 bg-secondary/50"
                initial={reducedMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.08 + index * 0.06, ease: easeOut }}
              />
            ))}
          </motion.aside>

          <motion.section
            className="space-y-3 rounded-xl border border-border/40 bg-background/40 p-4"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: easeOut }}
          >
            <motion.div className="h-3 w-32 animate-pulse rounded bg-slate-700/80" />
            <motion.div
              className="h-40 rounded-lg border border-dashed border-cyan-500/30 bg-cyan-500/5"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      boxShadow: [
                        "0 0 0 0 rgba(34, 211, 238, 0)",
                        "0 0 24px 2px rgba(34, 211, 238, 0.12)",
                        "0 0 0 0 rgba(34, 211, 238, 0)",
                      ],
                    }
              }
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="flex h-full items-center justify-center font-mono text-xs text-cyan-300/80">
                Native report surface loading…
              </p>
            </motion.div>
            <motion.div
              className="grid gap-2 sm:grid-cols-2"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <motion.div
                className="h-16 animate-pulse rounded-lg bg-slate-800/80"
                animate={reducedMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <motion.div
                className="h-16 animate-pulse rounded-lg bg-slate-800/80"
                animate={reducedMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
              />
            </motion.div>
          </motion.section>
        </div>
      </motion.div>
    </motion.div>
  );
}
