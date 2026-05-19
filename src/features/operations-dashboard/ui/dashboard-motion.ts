import type { Transition, Variants } from "framer-motion";
import { GenerativeUiBlock } from "@/shared/types/aiops";

/** Soft ease-out tuned for dashboard enter (no overshoot). */
export const dashboardEaseOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const dashboardSlotTransition: Transition = {
  duration: 0.4,
  ease: dashboardEaseOut,
};

export const dashboardBlockContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.03,
      when: "beforeChildren",
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
};

export function dashboardBlockItemVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0, scale: 1 },
      show: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 1, y: 0, scale: 1 },
    };
  }

  return {
    hidden: { opacity: 0, y: 16, scale: 0.988 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.42, ease: dashboardEaseOut },
    },
    exit: {
      opacity: 0,
      y: -8,
      scale: 0.992,
      transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
    },
  };
}

export const dashboardSlotContentVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: dashboardSlotTransition,
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.24, ease: [0.4, 0, 1, 1] },
  },
};

export const dashboardSlotPlaceholderVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: dashboardEaseOut },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

/** Stable keys so AnimatePresence can morph blocks instead of remounting by index. */
export function generativeUiBlockKey(block: GenerativeUiBlock, index: number): string {
  switch (block.type) {
    case "IncidentTable":
      return `incidents-${block.props.incidents.length}-${block.props.incidents[0]?.id ?? index}`;
    case "PrimeKpiCards":
      return `prime-kpis-${block.props.kpis.map((kpi) => `${kpi.name}:${kpi.value}`).join("|")}`;
    case "PrimeNarrative":
      return `narrative-${block.props.narrative.slice(0, 48)}-${block.props.businessSummary.length}`;
    case "ProjectHealthCards":
      return `health-${block.props.projectName}-${block.props.healthScore}`;
    case "ProjectSeverityDonut":
      return `donut-${block.props.severityMix.map((slice) => slice.count).join("-")}`;
    case "ProjectServiceBarChart":
      return `bars-${block.props.kpis.length}-${block.props.kpis[0]?.name ?? index}`;
    case "ProjectIncidentTrendChart":
      return `trend-${block.props.points.length}-${block.props.points.at(-1)?.timestamp ?? index}`;
    case "RecommendationCard":
      return `rec-${block.props.title}-${block.props.priority}`;
    default:
      return `block-${index}`;
  }
}

export function generativeUiBlocksFingerprint(blocks: GenerativeUiBlock[]): string {
  if (blocks.length === 0) return "empty";
  return blocks.map((block, index) => generativeUiBlockKey(block, index)).join("::");
}

/** GPU-friendly wrapper: transform + opacity only, no layout thrash on charts. */
export const dashboardMotionSurfaceClass =
  "transform-gpu will-change-[transform,opacity] [backface-visibility:hidden]";
