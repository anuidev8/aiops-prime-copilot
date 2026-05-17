import { Incident } from "../../observability/entities/incident";
import { RemediationPlan } from "../entities/remediation-plan";
import { RootCause } from "../entities/root-cause";

export class RemediationPlanner {
  build(incident: Incident, rootCause: RootCause): RemediationPlan {
    if (rootCause.hypothesis.toLowerCase().includes("dependency")) {
      return new RemediationPlan(
        "Stabilize dependency and reduce retry amplification.",
        [
          "Enable circuit breaker on failing dependency paths.",
          "Temporarily reduce request concurrency for affected service.",
          "Increase timeout budget only for idempotent operations.",
          "Open provider incident ticket and track SLA breach impact.",
        ],
        true,
        20,
      );
    }

    if (rootCause.hypothesis.toLowerCase().includes("memory")) {
      return new RemediationPlan(
        "Relieve memory pressure and guard against recurrence.",
        [
          "Scale replicas by 1.5x for affected deployment.",
          "Apply immediate heap-size and pod-limits patch.",
          "Enable short-lived rollback if error rate remains above threshold.",
          "Schedule memory profiling task in next engineering window.",
        ],
        true,
        25,
      );
    }

    return new RemediationPlan(
      "Contain blast radius and collect additional diagnostics.",
      [
        "Apply targeted traffic shaping to affected service.",
        "Enable verbose structured logging for key failing handlers.",
        "Run synthetic checks from two regions to isolate network factors.",
      ],
      false,
      35,
    );
  }
}
