"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { DashboardAnalyzingPlaceholder } from "@/features/agent-pipeline/ui/dashboard-analyzing-placeholder";
import { AnalysisInsightsPanel } from "@/features/operations-dashboard/ui/analysis-insights-panel";
import {
  AnimatedCostRing,
  AnimatedHealthBar,
  AnimatedMetricItem,
  AnimatedStatusDistributionItem,
  CostPanelSkeleton,
  MetricRowSkeleton,
} from "@/features/operations-dashboard/ui/dashboard-animated-primitives";
import { DashboardSectionShell } from "@/features/operations-dashboard/ui/dashboard-section-shell";
import { workflowStageToHighlightKind } from "@/features/operations-dashboard/ui/dashboard-highlight-theme";
import type { DashboardHighlightKind } from "@/shared/types/dashboard-highlight";
import { GenerativeUiRenderer } from "@/features/operations-dashboard/ui/generative-ui-renderer";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import type { AnalyzeLogsResult, IncidentViewModel } from "@/shared/types/aiops";
import { ActiveIncidentsTable } from "@/shared/ui/dashboard/active-incidents-table";
import { buildAnalysisWorkspaceSummary } from "@/shared/lib/build-analysis-workspace-summary";
import { resolveEffectiveProjectId } from "@/shared/lib/copilot-dashboard-sync";
import { buildGenerativeUiBlocks } from "@/shared/lib/build-generative-ui-blocks";
import type { AnalysisWorkspaceSummary } from "@/shared/types/analysis-workspace-summary";
import { DashboardPanel } from "@/shared/ui/dashboard/dashboard-panel";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  AlertTriangleIcon,
  ActivityIcon,
  ClockIcon,
  FolderIcon,
  BoxIcon,
  LightbulbIcon,
} from "lucide-react";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function OperationsOverviewDashboard() {
  const {
    isAnalyzing,
    artifactCache,
    result,
    projectCatalog,
    portfolioHealth,
    selectedScope,
    dashboardFocus,
    workflow,
    agentPipeline,
    dashboardHighlight,
    isDashboardSectionHighlighted,
  } = useAIOpsSession();

  const workspaceMetrics = artifactCache.workspaceMetrics;

  const metricsPanelsLoading =
    isAnalyzing ||
    workflow.stage === "collecting_scope" ||
    workflow.stage === "reading_telemetry";

  const accentKind: DashboardHighlightKind =
    dashboardHighlight?.kind ??
    workflowStageToHighlightKind(workflow.stage) ??
    "default";

  const dashboardAnimateKey = `${dashboardHighlight?.revision ?? 0}-${artifactCache.lastRunMeta?.runId ?? "idle"}-${workspaceMetrics?.logLinesProcessed ?? 0}`;

  const query = result?.query ?? artifactCache.query ?? null;

  const effectiveProjectId = useMemo(
    () =>
      resolveEffectiveProjectId({
        selectedScope,
        dashboardFocus,
        query,
      }),
    [selectedScope, dashboardFocus, query],
  );

  const incidents = useMemo(
    () => result?.incidents ?? artifactCache.incidents ?? [],
    [result?.incidents, artifactCache.incidents],
  );

  const analyses = useMemo(
    () => result?.analyses ?? artifactCache.analyses ?? [],
    [result?.analyses, artifactCache.analyses],
  );

  const primeReport = result?.primeReport ?? artifactCache.primeReport ?? null;

  const generativeBlocks = useMemo(() => {
    const fromResult = result?.ui;
    const raw =
      fromResult && fromResult.length > 0
        ? fromResult
        : buildGenerativeUiBlocks({
            incidents,
            analyses,
            primeReport,
          });
    return raw.filter((block) => block.type !== "IncidentTable");
  }, [result?.ui, incidents, analyses, primeReport]);

  const summary = useMemo(
    () =>
      buildAnalysisWorkspaceSummary({
        projectCatalog,
        portfolioHealth,
        incidents,
        analyses,
        primeReport,
        selectedProjectId: effectiveProjectId,
        resolvedServiceCount:
          query?.resolvedServiceCount ?? null,
        workflowStage: workflow.stage,
        agentPipeline,
        isAnalyzing,
        workspaceMetrics,
      }),
    [
      projectCatalog,
      portfolioHealth,
      incidents,
      analyses,
      primeReport,
      effectiveProjectId,
      query?.resolvedServiceCount,
      workflow.stage,
      agentPipeline,
      isAnalyzing,
      workspaceMetrics,
    ],
  );

  const showPlaceholder = isAnalyzing && incidents.length === 0;

  return (
    <div className="space-y-6 pb-8">
      {showPlaceholder ? (
        <DashboardAnalyzingPlaceholder
          title="Ingesting telemetry"
          waitingLabel="Building project and service level insights from scoped services..."
        />
      ) : null}

      <DashboardSectionShell
        sectionId="kpis"
        highlighted={isDashboardSectionHighlighted("kpis")}
        highlightKind={accentKind}
        loading={metricsPanelsLoading}
      >
        <KpiRow summary={summary} animateKey={dashboardAnimateKey} />
      </DashboardSectionShell>

      {generativeBlocks.length > 0 ? (
        <DashboardSectionShell
          sectionId="generative-ui"
          highlighted={isDashboardSectionHighlighted("generative-ui")}
          highlightKind={accentKind}
        >
          <GenerativeUiRenderer blocks={generativeBlocks} />
        </DashboardSectionShell>
      ) : null}

      <DashboardSectionShell
        sectionId="insights"
        highlighted={isDashboardSectionHighlighted("insights")}
        highlightKind={accentKind}
      >
        <AnalysisInsightsPanel />
      </DashboardSectionShell>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSectionShell
          sectionId="projects"
          highlighted={isDashboardSectionHighlighted("projects")}
          highlightKind={accentKind}
          loading={metricsPanelsLoading}
        >
          <ProjectsTable summary={summary} animateKey={dashboardAnimateKey} />
        </DashboardSectionShell>
        <DashboardSectionShell
          sectionId="services"
          highlighted={isDashboardSectionHighlighted("services")}
          highlightKind={accentKind}
          loading={metricsPanelsLoading}
        >
          <ServicesRelatedPanel
            summary={summary}
            incidents={incidents}
            query={query}
            animateKey={dashboardAnimateKey}
          />
        </DashboardSectionShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardSectionShell
          sectionId="metrics"
          highlighted={isDashboardSectionHighlighted("metrics")}
          highlightKind={accentKind}
          loading={metricsPanelsLoading}
        >
          <MetricsPanel
            summary={summary}
            loading={metricsPanelsLoading && !workspaceMetrics}
            animateKey={dashboardAnimateKey}
          />
        </DashboardSectionShell>
        <DashboardSectionShell
          sectionId="cost"
          highlighted={isDashboardSectionHighlighted("cost")}
          highlightKind={accentKind}
          loading={metricsPanelsLoading}
        >
          <CostPanel
            summary={summary}
            loading={metricsPanelsLoading && !workspaceMetrics}
            animateKey={dashboardAnimateKey}
          />
        </DashboardSectionShell>
        <DashboardSectionShell
          sectionId="service-status"
          highlighted={isDashboardSectionHighlighted("service-status")}
          highlightKind={accentKind}
          loading={metricsPanelsLoading}
        >
          <ServiceStatusPanel summary={summary} animateKey={dashboardAnimateKey} />
        </DashboardSectionShell>
      </div>

      {summary.topRecommendation ? (
        <section className="flex items-start justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <LightbulbIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Top recommendation</h4>
              <p className="mt-1 text-sm text-slate-600">{summary.topRecommendation}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            View all recommendations <span className="ml-1">›</span>
          </button>
        </section>
      ) : null}
    </div>
  );
}

function KpiRow({
  summary,
  animateKey,
}: {
  summary: AnalysisWorkspaceSummary;
  animateKey: string;
}) {
  return (
    <motion.div
      key={animateKey}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <KpiCard
        icon={FolderIcon}
        label="Total Projects"
        value={String(summary.totalProjects)}
        iconClass="bg-indigo-50 text-indigo-600"
      />
      <KpiCard
        icon={BoxIcon}
        label="Total Services"
        value={String(summary.totalServices)}
        iconClass="bg-purple-50 text-purple-600"
      />
      <KpiCard
        icon={ClockIcon}
        label="MTTR"
        value={summary.mttrMinutes === null ? "—" : `${summary.mttrMinutes}m`}
        trend={
          summary.mttrDeltaMinutes === null
            ? undefined
            : { value: Math.abs(summary.mttrDeltaMinutes), up: summary.mttrDeltaMinutes > 0 }
        }
        footnote="vs last 60 min"
        iconClass="bg-emerald-50 text-emerald-600"
        trendPositive={summary.mttrDeltaMinutes !== null && summary.mttrDeltaMinutes < 0}
      />
      <KpiCard
        icon={ActivityIcon}
        label="Active Incidents"
        value={String(summary.activeIncidents)}
        trend={
          summary.activeIncidentsDelta === null
            ? undefined
            : { value: summary.activeIncidentsDelta, up: true }
        }
        footnote="vs last 60 min"
        iconClass="bg-orange-50 text-orange-600"
        trendPositive={false}
      />
      <KpiCard
        icon={AlertTriangleIcon}
        label="Anomalies Detected"
        value={String(summary.anomaliesDetected)}
        footnote="vs last 60 min"
        iconClass="bg-red-50 text-red-600 border border-red-100"
      />
    </motion.div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  footnote,
  iconClass = "bg-indigo-50 text-indigo-600",
  cardClass = "",
  trendPositive,
}: {
  icon: typeof FolderIcon;
  label: string;
  value: string;
  trend?: { value: number; up: boolean };
  footnote?: string;
  iconClass?: string;
  cardClass?: string;
  trendPositive?: boolean;
}) {
  return (
    <div
      className={[
        "relative flex flex-col gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        cardClass,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconClass].join(" ")}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {trend ? (
            <span
              className={[
                "flex items-center text-sm font-medium",
                trendPositive ? "text-emerald-600" : "text-red-500",
              ].join(" ")}
            >
              {trend.up ? (
                <ArrowUpIcon className="mr-0.5 h-3.5 w-3.5" />
              ) : (
                <ArrowDownIcon className="mr-0.5 h-3.5 w-3.5" />
              )}
              {trend.value}
              {label === "MTTR" ? "m" : ""}
            </span>
          ) : null}
        </div>
        {footnote ? <p className="mt-1 text-xs text-slate-400">{footnote}</p> : null}
      </div>
    </div>
  );
}

function ProjectsTable({
  summary,
  animateKey,
}: {
  summary: AnalysisWorkspaceSummary;
  animateKey: string;
}) {
  const rows = summary.projectRows.length > 0 ? summary.projectRows : [];

  return (
    <DashboardPanel title="Projects" subtitle="Overview of your projects">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Run telemetry on a project scope to populate this table.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Services</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr key={row.projectId} className="text-sm transition-colors hover:bg-slate-50">
                  <td className="flex items-center gap-3 py-3 font-semibold text-slate-900">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600">
                      <FolderIcon className="h-4 w-4" />
                    </div>
                    {row.name}
                  </td>
                  <td className="py-3 text-slate-600">{row.serviceCount}</td>
                  <td className="py-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="py-3">
                    <AnimatedHealthBar
                      percent={row.healthPercent}
                      status={row.status}
                      animateKey={`${animateKey}-${row.projectId}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPanel>
  );
}

function servicesPanelSubtitle(
  incidents: IncidentViewModel[],
  query: AnalyzeLogsResult["query"] | null,
): string {
  if (incidents.length === 0) {
    return "Top impacted services — run telemetry on a project scope";
  }
  const project =
    query?.resolvedProjectName ?? query?.resolvedProjectId ?? "Scoped project";
  const company = query?.resolvedCompanyId ?? query?.requestedCompanyId;
  const services = new Set(incidents.map((incident) => incident.service)).size;
  return [project, company, `${incidents.length} incidents`, `${services} services`]
    .filter(Boolean)
    .join(" · ");
}

function ServicesRelatedPanel({
  summary,
  incidents,
  query,
  animateKey,
}: {
  summary: AnalysisWorkspaceSummary;
  incidents: IncidentViewModel[];
  query: AnalyzeLogsResult["query"] | null;
  animateKey: string;
}) {
  const rows = summary.serviceRows;
  const subtitle = servicesPanelSubtitle(incidents, query);

  return (
    <DashboardPanel title="Services related to projects" subtitle={subtitle}>
      {incidents.length > 0 ? (
        <motion.div
          key={`incidents-${animateKey}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <ActiveIncidentsTable incidents={incidents} animateKey={animateKey} />
        </motion.div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No scoped services yet. Select a project and run analysis.
        </p>
      ) : (
        <motion.div
          key={`services-${animateKey}`}
          className="overflow-x-auto"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-3 font-medium">Service</th>
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr
                  key={`${row.projectName}-${row.serviceName}`}
                  className="text-sm transition-colors hover:bg-slate-50"
                >
                  <td className="py-3 font-semibold text-slate-900">{row.serviceName}</td>
                  <td className="py-3 text-slate-500">{row.projectName}</td>
                  <td className="py-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="py-3">
                    <AnimatedHealthBar
                      percent={row.healthPercent}
                      status={row.status}
                      animateKey={`${animateKey}-${row.serviceName}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </DashboardPanel>
  );
}

function MetricsPanel({
  summary,
  loading,
  animateKey,
}: {
  summary: AnalysisWorkspaceSummary;
  loading: boolean;
  animateKey: string;
}) {
  return (
    <DashboardPanel title="Metrics summary" subtitle="Key metrics overview">
      {loading ? (
        <MetricRowSkeleton />
      ) : (
        <motion.div className="mt-1 space-y-3" key={animateKey}>
          {summary.metrics.map((metric) => (
            <AnimatedMetricItem
              key={`${animateKey}-${metric.label}`}
              animateKey={`${animateKey}-${metric.label}`}
              label={metric.label}
              value={metric.value}
              trend={metric.trendPercent}
              isPositiveTrend={metric.trendPositive}
            />
          ))}
        </motion.div>
      )}
    </DashboardPanel>
  );
}

function CostPanel({
  summary,
  loading,
  animateKey,
}: {
  summary: AnalysisWorkspaceSummary;
  loading: boolean;
  animateKey: string;
}) {
  const { cost } = summary;

  return (
    <DashboardPanel
      title="Cost overview"
      subtitle={
        cost.source === "telemetry"
          ? `Telemetry-scoped estimate (${cost.windowLabel})`
          : cost.source === "estimated"
            ? "Estimated spending (billing API not connected)"
            : "Current spending analysis"
      }
    >
      {loading ? (
        <CostPanelSkeleton />
      ) : (
        <motion.div className="mt-2 flex flex-col items-center" key={animateKey}>
          <AnimatedCostRing
            animateKey={animateKey}
            totalLabel={formatUsd(cost.totalUsd)}
            breakdown={cost.breakdown.map((slice) => ({
              label: slice.label,
              percent: slice.percent,
              color: slice.color,
            }))}
          />
          <div className="mt-4 w-full space-y-2">
            {cost.breakdown.map((slice) => (
              <CostItem
                key={`${animateKey}-${slice.label}`}
                color={slice.color}
                label={slice.label}
                value={formatUsd(slice.amountUsd)}
                percent={`${slice.percent}%`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </DashboardPanel>
  );
}

function ServiceStatusPanel({
  summary,
  animateKey,
}: {
  summary: AnalysisWorkspaceSummary;
  animateKey: string;
}) {
  const colorMap: Record<string, { bar: string; text: string; dot: string }> = {
    Healthy: { bar: "bg-emerald-500", text: "text-emerald-700", dot: "bg-emerald-500" },
    Degraded: { bar: "bg-amber-500", text: "text-amber-700", dot: "bg-amber-500" },
    Critical: { bar: "bg-rose-500", text: "text-rose-700", dot: "bg-rose-500" },
    Unknown: { bar: "bg-slate-300", text: "text-slate-500", dot: "bg-slate-300" },
  };

  return (
    <DashboardPanel title="Services status by projects" subtitle="Distribution of service health">
      <div className="mt-4 space-y-4">
        {summary.serviceStatusBuckets.map((bucket) => {
          const colors = colorMap[bucket.label] ?? colorMap.Unknown;
          return (
            <AnimatedStatusDistributionItem
              key={`${animateKey}-${bucket.label}`}
              animateKey={`${animateKey}-${bucket.label}`}
              label={bucket.label}
              count={bucket.count}
              percent={`${bucket.percent}%`}
              colorClass={colors.bar}
              textClass={colors.text}
              dotClass={colors.dot}
            />
          );
        })}
      </div>
    </DashboardPanel>
  );
}

function StatusPill({ status }: { status: string }) {
  const dot =
    status === "Healthy"
      ? "bg-emerald-500"
      : status === "Degraded"
        ? "bg-orange-500"
        : "bg-red-500";
  const text =
    status === "Healthy"
      ? "text-emerald-600"
      : status === "Degraded"
        ? "text-orange-600"
        : "text-red-600";

  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full ${dot}`} />
      <span className={`text-sm font-medium ${text}`}>{status}</span>
    </div>
  );
}

function CostItem({
  color,
  label,
  value,
  percent,
}: {
  color: string;
  label: string;
  value: string;
  percent: string;
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="w-12 font-medium text-foreground">{value}</span>
        <span className="w-8 text-right text-muted-foreground">{percent}</span>
      </div>
    </div>
  );
}

function StatusDistributionItem({
  label,
  count,
  percent,
  colorClass,
  textClass,
  dotClass,
}: {
  label: string;
  count: number;
  percent: string;
  colorClass: string;
  textClass: string;
  dotClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-24 items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className="text-[13px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className={`h-full rounded-full ${colorClass}`} style={{ width: percent }} />
        </div>
      </div>
      <div className="w-16 text-right">
        <span className={`text-[13px] font-medium ${textClass}`}>{count}</span>
        <span className="ml-1 text-[11px] text-muted-foreground">({percent})</span>
      </div>
    </div>
  );
}
