import { Incident } from "../entities/incident";

export type IncidentCategory =
  | "dependency-outage"
  | "resource-exhaustion"
  | "deployment-regression"
  | "network-instability"
  | "unknown";

export class IncidentClassifier {
  classify(incident: Incident): IncidentCategory {
    const corpus = incident.logs
      .map((log) => log.message.toLowerCase())
      .join("\n");

    if (corpus.includes("timeout") || corpus.includes("connection refused")) {
      return "dependency-outage";
    }

    if (corpus.includes("out of memory") || corpus.includes("cpu thrott")) {
      return "resource-exhaustion";
    }

    if (corpus.includes("deploy") || corpus.includes("rollback")) {
      return "deployment-regression";
    }

    if (corpus.includes("dns") || corpus.includes("packet loss")) {
      return "network-instability";
    }

    return "unknown";
  }
}
