import { ProjectOwnershipViewModel } from "@/shared/types/aiops";

export async function fetchProjectOwnership(params?: {
  companyId?: string;
  projectId?: string;
}): Promise<ProjectOwnershipViewModel[]> {
  const query = new URLSearchParams();

  if (params?.companyId) {
    query.set("companyId", params.companyId);
  }

  if (params?.projectId) {
    query.set("projectId", params.projectId);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const response = await fetch(`/api/aiops/ownership/projects${suffix}`);

  if (!response.ok) {
    throw new Error("Failed to load project ownership catalog");
  }

  const payload = (await response.json()) as { projects: ProjectOwnershipViewModel[] };
  return payload.projects;
}
