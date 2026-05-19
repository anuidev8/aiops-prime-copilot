import { describe, expect, it } from "vitest";
import { analyzeLogsRequestSchema } from "./analyze-request-schema";

describe("analyzeLogsRequestSchema", () => {
  it("accepts legacy service-only payloads", () => {
    const parsed = analyzeLogsRequestSchema.safeParse({
      services: ["auth-api", "payments-api"],
      timeWindowMinutes: 60,
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts company/project scope payloads", () => {
    const parsed = analyzeLogsRequestSchema.safeParse({
      companyId: "acme-corp",
      projectId: "project-gem",
      services: ["auth-api"],
      timeWindowMinutes: 30,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects blank company and project identifiers", () => {
    const parsed = analyzeLogsRequestSchema.safeParse({
      companyId: "   ",
      projectId: "  ",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects out-of-range time windows", () => {
    const parsed = analyzeLogsRequestSchema.safeParse({
      companyId: "acme-corp",
      timeWindowMinutes: 2000,
    });

    expect(parsed.success).toBe(false);
  });
});
