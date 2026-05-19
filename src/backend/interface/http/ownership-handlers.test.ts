import { describe, expect, it } from "vitest";
import { InMemoryProjectOwnershipRepository } from "../../infrastructure/repositories/in-memory-project-ownership-repository";
import { listProjectOwnership } from "./ownership-handlers";

describe("listProjectOwnership", () => {
  const repository = new InMemoryProjectOwnershipRepository();

  it("returns project-gem with four services", async () => {
    const result = await listProjectOwnership(repository, {
      projectId: "project-gem",
    });

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]?.serviceNames).toEqual([
      "auth-service",
      "payments-api",
      "worker-sync",
      "notifications",
    ]);
  });

  it("filters projects by company", async () => {
    const result = await listProjectOwnership(repository, {
      companyId: "acme-corp",
    });

    expect(result.projects).toHaveLength(2);
    expect(result.projects.every((project) => project.companyId === "acme-corp")).toBe(
      true,
    );
  });

  it("lists all mock projects", async () => {
    const result = await listProjectOwnership(repository, {});
    expect(result.projects).toHaveLength(4);
  });
});
