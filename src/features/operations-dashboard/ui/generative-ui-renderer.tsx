"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ProjectHealthCards } from "@/entities/project-analytics/ui/project-health-cards";
import { ProjectIncidentTrendChart } from "@/entities/project-analytics/ui/project-incident-trend-chart";
import { ProjectServiceBarChart } from "@/entities/project-analytics/ui/project-service-bar-chart";
import { ProjectSeverityDonut } from "@/entities/project-analytics/ui/project-severity-donut";
import { PrimeKpiGrid } from "@/entities/prime/ui/prime-kpi-grid";
import { PrimeNarrative } from "@/entities/prime/ui/prime-narrative";
import {
  dashboardBlockContainerVariants,
  dashboardBlockItemVariants,
  dashboardMotionSurfaceClass,
  generativeUiBlockKey,
} from "@/features/operations-dashboard/ui/dashboard-motion";
import { GenerativeUiBlock, IncidentViewModel } from "@/shared/types/aiops";
import { DashboardPanel } from "@/shared/ui/dashboard/dashboard-panel";

function recommendationAccent(riskLevel: "high" | "medium" | "low"): string {
  if (riskLevel === "high") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  }
  if (riskLevel === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

function renderBlockContent(
  block: GenerativeUiBlock,
  reducedMotion: boolean,
  onSelectIncident?: (incident: IncidentViewModel) => void,
) {
  if (block.type === "IncidentTable") {
    return null;
  }

  if (block.type === "PrimeKpiCards") {
    return (
      <DashboardPanel title="Dynamic KPI grid">
        <PrimeKpiGrid kpis={block.props.kpis} />
      </DashboardPanel>
    );
  }

  if (block.type === "PrimeNarrative") {
    return (
      <DashboardPanel title="Narrative context">
        <PrimeNarrative
          narrative={block.props.narrative}
          businessSummary={block.props.businessSummary}
        />
      </DashboardPanel>
    );
  }

  if (block.type === "ProjectHealthCards") {
    return (
      <ProjectHealthCards
        projectName={block.props.projectName}
        healthScore={block.props.healthScore}
        kpis={block.props.kpis}
      />
    );
  }

  if (block.type === "ProjectSeverityDonut") {
    return <ProjectSeverityDonut severityMix={block.props.severityMix} />;
  }

  if (block.type === "ProjectServiceBarChart") {
    return <ProjectServiceBarChart kpis={block.props.kpis} />;
  }

  if (block.type === "ProjectIncidentTrendChart") {
    return <ProjectIncidentTrendChart points={block.props.points} />;
  }

  if (block.type === "RecommendationCard") {
    return (
      <section
        className={[
          "rounded-2xl border p-4",
          recommendationAccent(block.props.riskLevel),
        ].join(" ")}
      >
        <motion.div
          className="flex items-center justify-between gap-3"
          initial={reducedMotion ? false : { opacity: 0, x: -6 }}
          animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
        >
          <h3 className="text-sm font-semibold">{block.props.title}</h3>
          <span className="rounded-full border border-current/30 bg-current/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {block.props.priority}
          </span>
        </motion.div>
        <motion.p
          className="mt-2 text-sm leading-relaxed"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={reducedMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
        >
          {block.props.content}
        </motion.p>
      </section>
    );
  }

  return null;
}

function blockSpanClass(block: GenerativeUiBlock): string {
  if (
    block.type === "ProjectSeverityDonut" ||
    block.type === "ProjectServiceBarChart"
  ) {
    return "";
  }
  return "lg:col-span-2";
}

interface GenerativeUiRendererProps {
  blocks: GenerativeUiBlock[];
  onSelectIncident?: (incident: IncidentViewModel) => void;
}

export function GenerativeUiRenderer({
  blocks,
  onSelectIncident,
}: GenerativeUiRendererProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const itemVariants = dashboardBlockItemVariants(reducedMotion);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="grid gap-4 lg:grid-cols-2"
      variants={reducedMotion ? undefined : dashboardBlockContainerVariants}
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? undefined : "show"}
      exit={reducedMotion ? undefined : "exit"}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {blocks.map((block, index) => {
          const content = renderBlockContent(block, reducedMotion, onSelectIncident);
          if (!content) {
            return null;
          }

          const key = generativeUiBlockKey(block, index);
          const isChart =
            block.type === "ProjectSeverityDonut" ||
            block.type === "ProjectServiceBarChart" ||
            block.type === "ProjectIncidentTrendChart";

          return (
            <motion.div
              key={key}
              layout={reducedMotion ? false : "position"}
              layoutDependency={key}
              variants={itemVariants}
              initial={reducedMotion ? false : "hidden"}
              animate={reducedMotion ? undefined : "show"}
              exit={reducedMotion ? undefined : "exit"}
              className={[blockSpanClass(block), dashboardMotionSurfaceClass].filter(Boolean).join(" ")}
              style={isChart ? { contain: "layout paint" } : undefined}
            >
              {content}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
