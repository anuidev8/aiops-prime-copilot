import { FunctionTool, Gemini, InMemoryRunner, LlmAgent } from "@google/adk";
import { z } from "zod";
import { PrimeReporterAgent } from "../../application/contracts/agent-ports";
import { Analysis } from "../../domain/aiops-analysis/entities/analysis";
import { TimeWindow } from "../../domain/common/value-objects/time-window";
import { Incident } from "../../domain/observability/entities/incident";
import {
  CompanyPrimeSummary,
  PrimeRecommendation,
  PrimeReport,
  ProjectPrimeSummary,
} from "../../domain/prime-reporting/entities/prime-report";
import { KpiCalculator } from "../../domain/prime-reporting/services/kpi-calculator";
import { PrimeNarrativeBuilder } from "../../domain/prime-reporting/services/prime-narrative-builder";
import { CompanyKpiAggregator } from "../../domain/project-analytics/services/company-kpi-aggregator";
import {
  ProjectKpiAggregationResult,
  ProjectKpiAggregator,
} from "../../domain/project-analytics/services/project-kpi-aggregator";
import {
  buildIncidentTrend,
  buildSeverityMix,
} from "../../domain/project-analytics/services/project-scope-insights";
import { RecommendationBuilder } from "../../domain/project-analytics/services/recommendation-builder";
import { canUseGeminiWithCurrentEnv, getGeminiRuntimeConfig } from "../config/vertex-config";
import {
  collectFinalResponseText,
  extractJsonObject,
  userTextMessage,
} from "./adk-helpers";

const primeNarrativeSchema = z.object({
  narrative: z.string(),
  businessSummary: z.string(),
});

type PrimeNarrativeOutput = z.infer<typeof primeNarrativeSchema>;

type ScopeContext = {
  requestedCompanyId?: string | null;
  requestedProjectId?: string | null;
  resolvedCompanyId?: string | null;
  resolvedProjectId?: string | null;
  resolvedProjectName?: string | null;
  analyzedServices?: string[];
  resolvedServiceCount?: number;
};

export class AdkPrimeReporterAgent implements PrimeReporterAgent {
  constructor(
    private readonly kpiCalculator: KpiCalculator,
    private readonly narrativeBuilder: PrimeNarrativeBuilder,
    private readonly projectKpiAggregator: ProjectKpiAggregator,
    private readonly companyKpiAggregator: CompanyKpiAggregator,
    private readonly recommendationBuilder: RecommendationBuilder,
  ) {}

  async buildPrimeReport(input: {
    incidents: Incident[];
    analyses: Analysis[];
    timeWindow: TimeWindow;
    scopeContext?: ScopeContext;
  }): Promise<PrimeReport> {
    const kpis = this.kpiCalculator.compute({
      incidents: input.incidents,
      analyses: input.analyses,
      timeWindow: input.timeWindow,
    });

    const fallbackNarrative = this.narrativeBuilder.buildNarrative(kpis);
    const fallbackBusinessSummary = this.narrativeBuilder.buildBusinessSummary(kpis);
    const scopedServices = input.scopeContext?.analyzedServices ?? [];
    const projectKpis = this.projectKpiAggregator.aggregate({
      incidents: input.incidents,
      analyses: input.analyses,
      scopedServiceNames: scopedServices,
    });

    const recommendation = this.recommendationBuilder.build({
      healthScore: projectKpis.healthScore,
      criticalIncidentRate: projectKpis.criticalIncidentRate,
      recurrentIncidentRatio: projectKpis.recurrentIncidentRatio,
      serviceStabilityCoverage: projectKpis.serviceStabilityCoverage,
    });

    const projectSummary = this.resolveProjectSummary(
      input.scopeContext,
      projectKpis,
      recommendation,
      input.incidents,
      input.timeWindow,
    );
    const companySummary = this.resolveCompanySummary(
      input.scopeContext,
      projectKpis,
      recommendation,
    );

    if (input.incidents.length === 0) {
      return this.composeReport(
        input.timeWindow,
        kpis,
        "No incidents were detected in the selected telemetry scope.",
        "No active incident pressure was observed. Continue monitoring and keep remediation automations ready.",
        projectSummary,
        companySummary,
      );
    }

    if (!canUseGeminiWithCurrentEnv()) {
      return this.composeReport(
        input.timeWindow,
        kpis,
        fallbackNarrative,
        fallbackBusinessSummary,
        projectSummary,
        companySummary,
      );
    }

    try {
      const primeContextTool = new FunctionTool({
        name: "get_prime_context",
        description:
          "Provides service-level KPIs, project/company scope analytics, severity mix, and top analysis findings for PRIME narrative generation.",
        parameters: z.object({ requestId: z.string() }),
        execute: async () => ({
          kpis: kpis.map((kpi) => ({
            name: kpi.name,
            value: kpi.value,
            unit: kpi.unit,
            trend: kpi.trend,
            description: kpi.description,
          })),
          analyses: input.analyses.slice(0, 3).map((analysis) => ({
            incidentId: analysis.incidentId,
            hypothesis: analysis.rootCause.hypothesis,
            confidence: analysis.rootCause.confidence,
            remediation: analysis.remediationPlan.summary,
          })),
          projectScope: projectSummary
            ? {
                projectId: projectSummary.projectId,
                projectName: projectSummary.projectName,
                healthScore: projectSummary.healthScore,
                severityMix: projectSummary.severityMix,
                incidentTrend: projectSummary.incidentTrend,
                recommendation: {
                  priority: projectSummary.recommendation.priority,
                  riskLevel: projectSummary.recommendation.riskLevel,
                  confidence: projectSummary.recommendation.confidence,
                  evidence: projectSummary.recommendation.evidence,
                },
              }
            : null,
          companyScope: companySummary
            ? {
                companyId: companySummary.companyId,
                companyName: companySummary.companyName,
                topRisks: companySummary.topRisks,
              }
            : null,
        }),
      });

      const reporterAgent = new LlmAgent({
        name: "prime_reporter_agent",
        model: this.resolveModel(),
        instruction: [
          "You are a PRIME reporting agent for operations and business stakeholders.",
          "Always call get_prime_context first.",
          "When projectScope is present, reference project health, severity mix, and recommendation confidence in the narrative.",
          "Return only valid JSON: {\"narrative\": string, \"businessSummary\": string}",
          "No markdown, no code fences, no extra keys.",
        ].join("\n"),
        tools: [primeContextTool],
      });

      const runner = new InMemoryRunner({
        agent: reporterAgent,
        appName: "aiops-prime-reporter",
      });

      const userId = "copilot-user";
      const sessionId = `prime-${Date.now()}`;

      await runner.sessionService.getOrCreateSession({
        appName: "aiops-prime-reporter",
        userId,
        sessionId,
      });

      const responseText = await collectFinalResponseText(
        runner.runAsync({
          userId,
          sessionId,
          newMessage: userTextMessage(
            projectSummary
              ? `Generate PRIME narrative and business summary for project ${projectSummary.projectName} (health ${projectSummary.healthScore}/100).`
              : "Generate concise PRIME narrative and business summary from current KPIs.",
          ),
        }),
      );

      const parsed = extractJsonObject<PrimeNarrativeOutput>(responseText);
      const validated = parsed ? primeNarrativeSchema.safeParse(parsed) : null;

      if (!validated?.success) {
        return this.composeReport(
          input.timeWindow,
          kpis,
          fallbackNarrative,
          fallbackBusinessSummary,
          projectSummary,
          companySummary,
        );
      }

      return this.composeReport(
        input.timeWindow,
        kpis,
        validated.data.narrative,
        validated.data.businessSummary,
        projectSummary,
        companySummary,
      );
    } catch {
      return this.composeReport(
        input.timeWindow,
        kpis,
        fallbackNarrative,
        fallbackBusinessSummary,
        projectSummary,
        companySummary,
      );
    }
  }

  private resolveProjectSummary(
    scopeContext: ScopeContext | undefined,
    projectKpis: ProjectKpiAggregationResult,
    recommendation: PrimeRecommendation,
    incidents: Incident[],
    timeWindow: TimeWindow,
  ): ProjectPrimeSummary | undefined {
    const projectId =
      scopeContext?.resolvedProjectId ?? scopeContext?.requestedProjectId ?? null;
    if (!projectId) {
      return undefined;
    }

    const projectName =
      scopeContext?.resolvedProjectName ?? scopeContext?.requestedProjectId ?? projectId;

    return {
      projectId,
      projectName,
      healthScore: projectKpis.healthScore,
      kpis: projectKpis.kpis,
      recommendation,
      severityMix: buildSeverityMix(incidents),
      incidentTrend: buildIncidentTrend(incidents, timeWindow),
    };
  }

  private resolveCompanySummary(
    scopeContext: ScopeContext | undefined,
    projectKpis: ProjectKpiAggregationResult,
    recommendation: PrimeRecommendation,
  ): CompanyPrimeSummary | undefined {
    const companyId =
      scopeContext?.resolvedCompanyId ?? scopeContext?.requestedCompanyId ?? null;
    if (!companyId) {
      return undefined;
    }

    const scopedServices = scopeContext?.analyzedServices ?? [];
    const companyServiceCount =
      scopeContext?.resolvedServiceCount ?? scopedServices.length;
    const companyMetrics = this.companyKpiAggregator.aggregate({
      projectKpis,
      companyServiceCount,
    });

    return {
      companyId,
      companyName: scopeContext?.requestedCompanyId ?? companyId,
      kpis: companyMetrics.kpis,
      topRisks: companyMetrics.topRisks,
      recommendation,
    };
  }

  private composeReport(
    timeWindow: TimeWindow,
    kpis: PrimeReport["kpis"],
    narrative: string,
    businessSummary: string,
    projectSummary?: ProjectPrimeSummary,
    companySummary?: CompanyPrimeSummary,
  ): PrimeReport {
    return new PrimeReport(
      new Date(),
      timeWindow,
      kpis,
      narrative,
      businessSummary,
      projectSummary,
      companySummary,
    );
  }

  private resolveModel(): Gemini | string {
    const config = getGeminiRuntimeConfig();

    if (config.vertexai) {
      return new Gemini({
        model: config.model,
        vertexai: true,
        project: config.project,
        location: config.location,
      });
    }

    return new Gemini({
      model: config.model,
      apiKey: config.apiKey,
      vertexai: false,
    });
  }
}
