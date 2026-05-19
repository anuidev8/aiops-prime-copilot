import { ProjectOwnershipRepository } from "../../domain/project-analytics/ports/project-ownership-repository";

export interface ProjectOwnershipDto {
  id: string;
  companyId: string;
  name: string;
  serviceNames: string[];
}

function toDto(record: {
  id: string;
  companyId: string;
  name: string;
  serviceNames: string[];
}): ProjectOwnershipDto {
  return {
    id: record.id,
    companyId: record.companyId,
    name: record.name,
    serviceNames: [...record.serviceNames],
  };
}

export async function listProjectOwnership(
  repository: ProjectOwnershipRepository,
  params: { companyId?: string; projectId?: string },
): Promise<{ projects: ProjectOwnershipDto[] }> {
  if (params.projectId) {
    const project = await repository.findProjectById(params.projectId);
    return { projects: project ? [toDto(project)] : [] };
  }

  if (params.companyId) {
    const projects = await repository.listProjectsByCompanyId(params.companyId);
    return { projects: projects.map(toDto) };
  }

  const projects = await repository.listAllProjects();
  return { projects: projects.map(toDto) };
}
