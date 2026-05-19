"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";

/** Transparent RGBA PNG — keep in sync: public/images/copilot-avatar.png */
const COPILOT_AVATAR_SRC = "/images/copilot-avatar.png";

const easeOut = [0.32, 0.72, 0, 1] as const;

export function CopilotAvatarView() {
  const reduceMotion = useReducedMotion();
  const { result, artifactCache } = useAIOpsSession();
  const analysis = result?.analyses?.[0] ?? artifactCache.analyses?.[0];
  const kpis = result?.primeReport?.kpis ?? artifactCache.primeReport?.kpis ?? [];

  const mttr = kpis.find((kpi) => kpi.name === "MTTR")?.value ?? 42;
  const auto = kpis.find((kpi) => kpi.name.includes("Auto-handleable"))?.value ?? 48;
  const density = kpis.find((kpi) => kpi.name === "Incident density")?.value ?? 3.6;

  return (
    <motion.div
      className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto custom-scrollbar p-1"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
    >
      <div className="glass rounded-2xl relative flex flex-col w-full flex-1 min-h-[min(62vh,600px)] overflow-hidden">
        <CopilotAvatarHero reduceMotion={reduceMotion} />
      </div>

      {analysis ? (
        <motion.div
          className="glass rounded-2xl p-4 neon-ring space-y-3"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut, delay: 0.15 }}
        >
          <motion.div
            className="flex items-start justify-between gap-3"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.35 }}
          >
            <motion.div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                Root cause
              </p>
              <p className="font-display font-semibold text-sm mt-1">
                {analysis.rootCause.hypothesis}
              </p>
            </motion.div>
            <div className="relative h-12 w-12 shrink-0">
              <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
                <circle cx="22" cy="22" r="18" stroke="hsl(var(--border))" strokeWidth="3" fill="none" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={
                    2 * Math.PI * 18 * (1 - analysis.rootCause.confidence / 100)
                  }
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[11px] font-bold">
                {Math.round(analysis.rootCause.confidence)}%
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-background/40 border border-border/30 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Evidence</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {analysis.rootCause.evidence.slice(0, 3).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-background/40 border border-border/30 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Remediation
              </p>
              <ol className="mt-2 space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                {analysis.remediationPlan.steps.slice(0, 3).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <button
            type="button"
            className="w-full bg-gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.6)]"
          >
            Apply remediation
          </button>
        </motion.div>
      ) : null}

      <button
        type="button"
        className="w-full glass rounded-xl px-4 py-3 text-sm text-left text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors border border-border/40"
      >
        Generate PRIME report for last 60 minutes
      </button>

      <div className="grid grid-cols-2 gap-2">
        <MiniKpi label="MTTR" value={`${mttr}m`} />
        <MiniKpi label="Auto-handled" value={`${auto}%`} />
        <MiniKpi label="Density" value={`${density}/hr`} />
        <MiniKpi label="Confidence" value={`${analysis ? Math.round(analysis.rootCause.confidence) : 72}%`} />
      </div>
    </motion.div>
  );
}

function CopilotAvatarHero({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="copilot-avatar-hero absolute inset-0 w-full h-full">
      {/* Radar rings */}
      {[1, 2, 3].map((ring) => (
        <motion.span
          key={ring}
          className="pointer-events-none absolute rounded-full border border-primary/20"
          style={{
            width: `${55 + ring * 22}%`,
            height: `${55 + ring * 22}%`,
            aspectRatio: "1",
          }}
          animate={
            reduceMotion
              ? undefined
              : { rotate: ring % 2 === 0 ? 360 : -360, opacity: [0.15, 0.35, 0.15] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  rotate: { duration: 18 + ring * 6, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 3 + ring, repeat: Infinity, ease: "easeInOut" },
                }
          }
        />
      ))}

      {/* Floating particles */}
      {!reduceMotion
        ? Array.from({ length: 8 }).map((_, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute h-1 w-1 rounded-full bg-primary/60 shadow-[0_0_6px_hsl(var(--primary))]"
              style={{
                left: `${12 + (i % 4) * 22}%`,
                top: `${18 + Math.floor(i / 4) * 45}%`,
              }}
              animate={{
                y: [0, -12 - (i % 3) * 4, 0],
                opacity: [0.2, 0.9, 0.2],
                scale: [0.6, 1.1, 0.6],
              }}
              transition={{
                duration: 2.8 + i * 0.25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))
        : null}

      {/* Hologram glow behind avatar */}
      <motion.div
        className="absolute inset-x-4 bottom-[18%] h-[45%] rounded-full bg-primary/25 blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.25, 0.55, 0.25], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Avatar — fills card; RGBA PNG */}
      <motion.div
        className="absolute inset-0 z-20 pb-12 pt-2"
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: easeOut }}
      >
        <motion.div
          className="relative w-full h-full"
          animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={COPILOT_AVATAR_SRC}
            alt="PRIME Copilot holographic assistant"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 420px"
            className="copilot-avatar-figure !object-contain !object-bottom scale-[1.06] origin-bottom"
          />
        </motion.div>
      </motion.div>

      {/* Waveform + status overlay */}
      <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center pb-4 pt-10 bg-gradient-to-t from-background/90 via-background/50 to-transparent pointer-events-none">
        <motion.div className="flex items-end gap-0.5 h-7 w-full max-w-[min(100%,280px)] px-6 justify-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.span
              key={i}
              className="w-0.5 rounded-full bg-primary/60 origin-bottom"
              style={{ height: `${28 + Math.sin(i / 2) * 55}%` }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      scaleY: [0.35, 1, 0.45],
                      opacity: [0.35, 1, 0.4],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: 1.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.04,
                    }
              }
            />
          ))}
        </motion.div>
        <motion.p
          className="mt-2 text-xs text-muted-foreground"
          animate={reduceMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          Listening…
        </motion.p>
      </div>

      {/* Projection base */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[75%] flex flex-col items-center z-10"
        initial={reduceMotion ? false : { opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.5, ease: easeOut, delay: 0.2 }}
      >
        <motion.span
          className="h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          animate={reduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="mt-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)),0_0_28px_hsl(var(--primary)/0.5)]"
          animate={
            reduceMotion
              ? undefined
              : { scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }
          }
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="absolute bottom-0 h-8 w-8 rounded-full border border-primary/30"
          animate={reduceMotion ? undefined : { scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}
