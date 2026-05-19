import {
  ProjectOwnershipRecord,
  ProjectOwnershipRepository,
} from "../../domain/project-analytics/ports/project-ownership-repository";

const SEEDED_PROJECTS: ProjectOwnershipRecord[] = [
  {
    id: "project-gem",
    companyId: "acme-corp",
    name: "Project Gem",
    serviceNames: ["auth-service", "payments-api", "worker-sync", "notifications"],
  },
  {
    id: "project-nova",
    companyId: "acme-corp",
    name: "Project Nova",
    serviceNames: ["catalog-api", "search-api", "recommendations"],
  },
  {
    id: "project-orbit",
    companyId: "stellar-inc",
    name: "Project Orbit",
    serviceNames: ["billing-api", "ledger-worker", "invoice-pdf"],
  },
  {
    id: "project-pulse",
    companyId: "stellar-inc",
    name: "Project Pulse",
    serviceNames: ["metrics-ingest", "alert-router"],
  },
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export class InMemoryProjectOwnershipRepository
  implements ProjectOwnershipRepository
{
  async findProjectById(projectId: string): Promise<ProjectOwnershipRecord | null> {
    const normalized = normalize(projectId);
    const project = SEEDED_PROJECTS.find((record) => normalize(record.id) === normalized);
    return project ? { ...project, serviceNames: [...project.serviceNames] } : null;
  }

  async listProjectsByCompanyId(companyId: string): Promise<ProjectOwnershipRecord[]> {
    const normalized = normalize(companyId);

    return SEEDED_PROJECTS
      .filter((record) => normalize(record.companyId) === normalized)
      .map((record) => ({ ...record, serviceNames: [...record.serviceNames] }));
  }

  async listAllProjects(): Promise<ProjectOwnershipRecord[]> {
    return SEEDED_PROJECTS.map((record) => ({
      ...record,
      serviceNames: [...record.serviceNames],
    }));
  }
}
