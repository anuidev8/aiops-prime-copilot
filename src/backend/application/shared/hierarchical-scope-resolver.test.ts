import { describe, expect, it } from "vitest";
import { InMemoryProjectOwnershipRepository } from "../../infrastructure/repositories/in-memory-project-ownership-repository";
import { resolveScope } from "./analysis-scope";
import { resolveHierarchicalScope } from "./hierarchical-scope-resolver";

describe("resolveHierarchicalScope", () => {
  it("resolves project scope to the seeded project services", async () => {
    const repository = new InMemoryProjectOwnershipRepository();
    const scope = resolveScope({ projectId: "project-gem" });

    const resolved = await resolveHierarchicalScope(scope, repository);

    expect(resolved.resolvedCompanyId).toBe("acme-corp");
    expect(resolved.resolvedProjectId).toBe("project-gem");
    expect(resolved.resolvedProjectName).toBe("Project Gem");
    expect(resolved.hasExplicitServiceScope).toBe(true);
    expect(resolved.serviceNames).toEqual([
      "auth-service",
      "notifications",
      "payments-api",
      "worker-sync",
    ]);
  });

  it("intersects project services with explicit services from the request", async () => {
    const repository = new InMemoryProjectOwnershipRepository();
    const scope = resolveScope({
      projectId: "project-gem",
      services: ["auth-service", "unknown-service"],
    });

    const resolved = await resolveHierarchicalScope(scope, repository);

    expect(resolved.serviceNames).toEqual(["auth-service"]);
    expect(resolved.hasExplicitServiceScope).toBe(true);
  });

  it("resolves company scope to all services from company projects", async () => {
    const repository = new InMemoryProjectOwnershipRepository();
    const scope = resolveScope({ companyId: "acme-corp" });

    const resolved = await resolveHierarchicalScope(scope, repository);

    expect(resolved.resolvedCompanyId).toBe("acme-corp");
    expect(resolved.resolvedProjectId).toBe(null);
    expect(resolved.serviceNames).toEqual([
      "auth-service",
      "catalog-api",
      "notifications",
      "payments-api",
      "recommendations",
      "search-api",
      "worker-sync",
    ]);
  });
});
