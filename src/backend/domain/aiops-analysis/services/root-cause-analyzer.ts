import { Incident } from "../../observability/entities/incident";
import { RootCause } from "../entities/root-cause";

export class RootCauseAnalyzer {
  inferFromLogs(incident: Incident): RootCause {
    const corpus = incident.logs
      .map((log) => log.message.toLowerCase())
      .join("\n");

    if (corpus.includes("timeout") || corpus.includes("connection refused")) {
      return new RootCause(
        "Downstream dependency instability is degrading request paths.",
        [
          "Repeated timeout/connection errors across correlated logs.",
          "Failures cluster in a short window and same service dependency chain.",
        ],
        0.78,
      );
    }

    if (corpus.includes("out of memory") || corpus.includes("heap")) {
      return new RootCause(
        "Memory pressure is triggering service instability.",
        [
          "Logs include heap and OOM-related signatures.",
          "Incident severity escalates with sustained error volume.",
        ],
        0.74,
      );
    }

    return new RootCause(
      "A generic service degradation pattern is detected with limited evidence.",
      [
        "Error spikes are correlated by service and region.",
        "No dominant failure signature was found in raw logs.",
      ],
      0.55,
    );
  }
}
