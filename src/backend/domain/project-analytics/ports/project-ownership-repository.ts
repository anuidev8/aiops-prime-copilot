export interface ProjectOwnershipRecord {
  id: string;
  companyId: string;
  name: string;
  serviceNames: string[];
}

export interface ProjectOwnershipRepository {
  findProjectById(projectId: string): Promise<ProjectOwnershipRecord | null>;
  listProjectsByCompanyId(companyId: string): Promise<ProjectOwnershipRecord[]>;
  listAllProjects(): Promise<ProjectOwnershipRecord[]>;
}
