import { FunctionTool } from "@google/adk";
import { z } from "zod";
import { listProjectOwnership } from "@/backend/interface/http/ownership-handlers";
import { RunAnalystUseCase } from "@/backend/application/use-cases/run-analyst-use-case";
import { RunReporterUseCase } from "@/backend/application/use-cases/run-reporter-use-case";
import { RunTelemetryUseCase } from "@/backend/application/use-cases/run-telemetry-use-case";
import { InMemoryProjectOwnershipRepository } from "../repositories/in-memory-project-ownership-repository";

const cacheQuerySchema = z.object({
  requestedCompanyId: z.string().nullable().optional(),
  requestedProjectId: z.string().nullable().optional(),
  resolvedCompanyId: z.string().nullable().optional(),
  resolvedProjectId: z.string().nullable().optional(),
  resolvedProjectName: z.string().nullable().optional(),
  resolvedServiceCount: z.number().optional(),
  requestedServices: z.array(z.string()),
  analyzedServices: z.array(z.string()),
  requestedTimeWindowMinutes: z.number().nullable(),
  resolvedTimeWindowMinutes: z.number(),
  resolvedWindowFrom: z.string(),
  resolvedWindowTo: z.string(),
});

export interface AIOpsCoordinatorToolDeps {
  runTelemetryUseCase: RunTelemetryUseCase;
  runAnalystUseCase: RunAnalystUseCase;
  runReporterUseCase: RunReporterUseCase;
  projectOwnershipRepository: InMemoryProjectOwnershipRepository;
}

export function createAIOpsCoordinatorTools(deps: AIOpsCoordinatorToolDeps) {
  const listProjectOwnershipTool = new FunctionTool({
    name: "listProjectOwnership",
    description:
      "Lists companies and projects with owned service names (SPEC-009). Use before scoped telemetry when project/company is unknown.",
    parameters: z.object({
      companyId: z.string().optional(),
      projectId: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await listProjectOwnership(deps.projectOwnershipRepository, {
        companyId: args.companyId,
        projectId: args.projectId,
      });
      return { ok: true, projects: result.projects };
    },
  });

  const runTelemetryAgentTool = new FunctionTool({
    name: "runTelemetryAgent",
    description:
      "Runs ONLY telemetry to detect incidents and establish scope. Does not run analyst or reporter.",
    parameters: z.object({
      companyId: z.string().optional(),
      projectId: z.string().optional(),
      services: z.array(z.string()).optional(),
      timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
    }),
    execute: async (args) =>
      deps.runTelemetryUseCase.execute({
        companyId: args.companyId,
        projectId: args.projectId,
        services: args.services,
        timeWindowMinutes: args.timeWindowMinutes,
      }),
  });

  const runAnalystAgentTool = new FunctionTool({
    name: "runAnalystAgent",
    description:
      "Runs ONLY the analyst on incidents in session. Requires prior telemetry. Pass runId from lastRunMeta.",
    parameters: z.object({
      runId: z.string().optional(),
      incidentIds: z.array(z.string()).optional(),
      cacheQuery: cacheQuerySchema.optional(),
    }),
    execute: async (args) =>
      deps.runAnalystUseCase.execute({
        runId: args.runId,
        incidentIds: args.incidentIds,
        cacheQuery: args.cacheQuery,
      }),
  });

  const runReporterAgentTool = new FunctionTool({
    name: "runReporterAgent",
    description:
      "Runs ONLY the PRIME reporter from cached incidents and analyses. Pass runId from lastRunMeta.",
    parameters: z.object({
      runId: z.string().optional(),
      useCachedAnalysis: z.boolean().optional().default(true),
      allowEmptyReport: z.boolean().optional().default(false),
      cacheQuery: cacheQuerySchema.optional(),
    }),
    execute: async (args) =>
      deps.runReporterUseCase.execute({
        runId: args.runId,
        useCachedAnalysis: args.useCachedAnalysis,
        allowEmptyReport: args.allowEmptyReport,
        cacheQuery: args.cacheQuery,
      }),
  });

  const analyzeLogsTool = new FunctionTool({
    name: "analyzeLogs",
    description:
      "Runs the full pipeline (telemetry → analyst → reporter) in one shot. Use when the user explicitly requests full analysis.",
    parameters: z.object({
      companyId: z.string().optional(),
      projectId: z.string().optional(),
      services: z.array(z.string()).optional(),
      timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
    }),
    execute: async (args) => {
      const telemetry = await deps.runTelemetryUseCase.execute({
        companyId: args.companyId,
        projectId: args.projectId,
        services: args.services,
        timeWindowMinutes: args.timeWindowMinutes,
      });

      if (!telemetry.ok) {
        return telemetry;
      }

      const analyst = await deps.runAnalystUseCase.execute({
        runId: telemetry.runId,
      });

      if (!analyst.ok) {
        return {
          ...telemetry,
          partialPipeline: { analystFailed: analyst.error },
        };
      }

      const reporter = await deps.runReporterUseCase.execute({
        runId: telemetry.runId,
        useCachedAnalysis: true,
      });

      if (!reporter.ok) {
        return {
          ok: true as const,
          data: {
            query: telemetry.data.query,
            incidents: telemetry.data.incidents,
            analyses: analyst.data.analyses,
            primeReport: null,
          },
          cachePatch: {
            query: telemetry.data.query,
            incidents: telemetry.data.incidents,
            analyses: analyst.data.analyses,
            primeReport: null,
          },
          ui: [...telemetry.ui, ...analyst.ui],
          runId: telemetry.runId,
          reporterError: reporter.error,
        };
      }

      return {
        ok: true as const,
        data: {
          query: telemetry.data.query,
          incidents: telemetry.data.incidents,
          analyses: analyst.data.analyses,
          primeReport: reporter.data.primeReport,
        },
        cachePatch: {
          query: telemetry.data.query,
          incidents: telemetry.data.incidents,
          analyses: analyst.data.analyses,
          primeReport: reporter.data.primeReport,
        },
        ui: [...telemetry.ui, ...analyst.ui, ...reporter.ui],
        runId: telemetry.runId,
      };
    },
  });

  return {
    listProjectOwnershipTool,
    runTelemetryAgentTool,
    runAnalystAgentTool,
    runReporterAgentTool,
    analyzeLogsTool,
  };
}
