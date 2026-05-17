import { RemediationPlan } from "./remediation-plan";
import { RootCause } from "./root-cause";

export class Analysis {
  constructor(
    public readonly incidentId: string,
    public readonly rootCause: RootCause,
    public readonly remediationPlan: RemediationPlan,
    public readonly summary: string,
  ) {}
}
