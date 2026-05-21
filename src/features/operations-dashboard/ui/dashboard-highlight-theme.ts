import type {
  DashboardHighlightKind,
  DashboardHighlightSection,
} from "@/shared/types/dashboard-highlight";

export interface DashboardHighlightTheme {
  label: string;
  ring: string;
  ringOffset: string;
  surface: string;
  glow: string;
  shimmer: string;
  badge: string;
  badgeText: string;
  loadingBar: string;
  loadingShimmer: string;
  orbA: string;
  orbB: string;
}

const THEMES: Record<DashboardHighlightKind, DashboardHighlightTheme> = {
  telemetry: {
    label: "Telemetry scan",
    ring: "ring-sky-400/80",
    ringOffset: "ring-offset-sky-50/80",
    surface: "bg-gradient-to-br from-sky-50/90 via-white to-cyan-50/40",
    glow: "shadow-[0_0_36px_-8px_rgba(14,165,233,0.55)]",
    shimmer: "from-sky-400/0 via-sky-400/35 to-cyan-300/0",
    badge: "border-sky-200/80 bg-sky-100/90 text-sky-800",
    badgeText: "Copilot · scanning logs",
    loadingBar: "bg-sky-100",
    loadingShimmer: "via-sky-500",
    orbA: "bg-sky-400/25",
    orbB: "bg-cyan-300/20",
  },
  analyst: {
    label: "Root-cause analysis",
    ring: "ring-violet-400/85",
    ringOffset: "ring-offset-violet-50/90",
    surface: "bg-gradient-to-br from-violet-50/95 via-white to-fuchsia-50/35",
    glow: "shadow-[0_0_40px_-6px_rgba(139,92,246,0.6)]",
    shimmer: "from-violet-400/0 via-fuchsia-400/40 to-violet-300/0",
    badge: "border-violet-200/90 bg-violet-100/95 text-violet-900",
    badgeText: "Copilot · analyzing incidents",
    loadingBar: "bg-violet-100",
    loadingShimmer: "via-violet-500",
    orbA: "bg-violet-400/30",
    orbB: "bg-fuchsia-400/22",
  },
  reporter: {
    label: "PRIME report",
    ring: "ring-emerald-400/80",
    ringOffset: "ring-offset-emerald-50/80",
    surface: "bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/35",
    glow: "shadow-[0_0_36px_-8px_rgba(16,185,129,0.5)]",
    shimmer: "from-emerald-400/0 via-emerald-400/32 to-teal-300/0",
    badge: "border-emerald-200/80 bg-emerald-100/90 text-emerald-900",
    badgeText: "Copilot · building report",
    loadingBar: "bg-emerald-100",
    loadingShimmer: "via-emerald-500",
    orbA: "bg-emerald-400/25",
    orbB: "bg-teal-300/20",
  },
  pipeline: {
    label: "Full AIOps pipeline",
    ring: "ring-indigo-400/80",
    ringOffset: "ring-offset-indigo-50/80",
    surface: "bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/30",
    glow: "shadow-[0_0_36px_-8px_rgba(99,102,241,0.55)]",
    shimmer: "from-indigo-400/0 via-indigo-400/35 to-blue-300/0",
    badge: "border-indigo-200/80 bg-indigo-100/90 text-indigo-800",
    badgeText: "Copilot · full analysis",
    loadingBar: "bg-indigo-100",
    loadingShimmer: "via-indigo-500",
    orbA: "bg-indigo-400/25",
    orbB: "bg-blue-400/18",
  },
  default: {
    label: "Copilot focus",
    ring: "ring-indigo-400/70",
    ringOffset: "ring-offset-slate-50",
    surface: "bg-indigo-500/6",
    glow: "shadow-[0_0_28px_-6px_rgba(99,102,241,0.45)]",
    shimmer: "from-indigo-400/0 via-indigo-400/28 to-indigo-300/0",
    badge: "border-indigo-200/70 bg-indigo-50/90 text-indigo-800",
    badgeText: "Copilot · updating",
    loadingBar: "bg-indigo-100",
    loadingShimmer: "via-indigo-500",
    orbA: "bg-indigo-400/20",
    orbB: "bg-indigo-300/15",
  },
};

/** Analyst sections get a stronger “focus card” treatment. */
const ANALYST_FOCUS_SECTIONS = new Set<DashboardHighlightSection>([
  "insights",
  "generative-ui",
]);

export function resolveDashboardHighlightTheme(
  kind: DashboardHighlightKind,
  sectionId: DashboardHighlightSection,
  highlighted: boolean,
): DashboardHighlightTheme {
  const base = THEMES[kind];
  if (!highlighted || kind !== "analyst" || !ANALYST_FOCUS_SECTIONS.has(sectionId)) {
    return base;
  }

  return {
    ...base,
    ring: "ring-violet-500/90",
    ringOffset: "ring-offset-violet-50/95",
    glow: "shadow-[0_0_48px_-4px_rgba(168,85,247,0.65),0_0_0_1px_rgba(167,139,250,0.35)]",
    surface:
      "bg-gradient-to-br from-violet-100/70 via-white to-amber-50/25 border border-violet-200/50",
    badge:
      "border-violet-300/90 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25",
    badgeText:
      sectionId === "insights"
        ? "Analysis focus · RCA insights"
        : "Analysis focus · live blocks",
  };
}

export function workflowStageToHighlightKind(
  stage: string,
): DashboardHighlightKind | null {
  if (stage === "collecting_scope" || stage === "reading_telemetry") {
    return "telemetry";
  }
  if (stage === "root_cause_analysis") {
    return "analyst";
  }
  if (stage === "reporting") {
    return "reporter";
  }
  return null;
}
