import { describe, expect, it } from "vitest";
import {
  buildGenerativeUiBlocks,
  mergeGenerativeUiBlocks,
} from "./build-generative-ui-blocks";
import type { GenerativeUiBlock } from "../types/aiops";

describe("buildGenerativeUiBlocks", () => {
  it("includes PRIME KPI and narrative blocks when a report exists", () => {
    const blocks = buildGenerativeUiBlocks({
      incidents: [
        {
          id: "inc-1",
          service: "payments-api",
          fingerprint: "fp",
          severity: "high",
          startedAt: "2026-01-01T00:00:00.000Z",
          endedAt: "2026-01-01T00:05:00.000Z",
          durationMinutes: 5,
          logCount: 12,
          status: "open",
        },
      ],
      primeReport: {
        generatedAt: "2026-01-01T01:00:00.000Z",
        narrative: "Executive narrative",
        businessSummary: "Business summary",
        kpis: [
          {
            name: "MTTR",
            value: 12,
            unit: "m",
            trend: "down",
            description: "Mean time to recover",
          },
        ],
      },
    });

    expect(blocks.some((block) => block.type === "PrimeKpiCards")).toBe(true);
    expect(blocks.some((block) => block.type === "PrimeNarrative")).toBe(true);
  });

  it("prefers incoming ui blocks over previous when non-empty", () => {
    const incoming: GenerativeUiBlock[] = [{ type: "PrimeKpiCards", props: { kpis: [] } }];
    const previous: GenerativeUiBlock[] = [
      { type: "PrimeNarrative", props: { narrative: "x", businessSummary: "y" } },
    ];

    expect(mergeGenerativeUiBlocks([...incoming], [...previous])).toEqual([...incoming]);
  });
});
