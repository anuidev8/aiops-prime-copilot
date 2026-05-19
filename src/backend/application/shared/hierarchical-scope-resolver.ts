import { ProjectOwnershipRepository } from "../../domain/project-analytics/ports/project-ownership-repository";
import { ResolvedScope } from "./analysis-scope";

export interface HierarchicalScopeResolution {
  serviceNames: string[];
  hasExplicitServiceScope: boolean;
  resolvedCompanyId: string | null;
  resolvedProjectId: string | null;
  resolvedProjectName: string | null;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function uniqueSorted(names: string[]): string[] {
  return Array.from(new Set(names.map(normalize).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function intersect(left: string[], right: string[]): string[] {
  const rightSet = new Set(right);
  return left.filter((name) => rightSet.has(name));
}

export async function resolveHierarchicalScope(
  scope: ResolvedScope,
  ownershipRepository?: ProjectOwnershipRepository,
): Promise<HierarchicalScopeResolution> {
  const requestedServices = uniqueSorted(scope.requestedServices);

  if (!ownershipRepository) {
    return {
      serviceNames: requestedServices,
      hasExplicitServiceScope: requestedServices.length > 0,
      resolvedCompanyId: null,
      resolvedProjectId: null,
      resolvedProjectName: null,
    };
  }

  if (scope.requestedProjectId) {
    const project = await ownershipRepository.findProjectById(scope.requestedProjectId);

    if (project) {
      const projectServices = uniqueSorted(project.serviceNames);
      const scopedServices =
        requestedServices.length > 0
          ? intersect(projectServices, requestedServices)
          : projectServices;

      return {
        serviceNames: scopedServices,
        hasExplicitServiceScope: true,
        resolvedCompanyId: project.companyId,
        resolvedProjectId: project.id,
        resolvedProjectName: project.name,
      };
    }
  }

  if (scope.requestedCompanyId) {
    const projects = await ownershipRepository.listProjectsByCompanyId(
      scope.requestedCompanyId,
    );

    if (projects.length > 0) {
      const companyServices = uniqueSorted(
        projects.flatMap((project) => project.serviceNames),
      );
      const scopedServices =
        requestedServices.length > 0
          ? intersect(companyServices, requestedServices)
          : companyServices;

      return {
        serviceNames: scopedServices,
        hasExplicitServiceScope: true,
        resolvedCompanyId: scope.requestedCompanyId,
        resolvedProjectId: null,
        resolvedProjectName: null,
      };
    }
  }

  return {
    serviceNames: requestedServices,
    hasExplicitServiceScope: requestedServices.length > 0,
    resolvedCompanyId: null,
    resolvedProjectId: null,
    resolvedProjectName: null,
  };
}
