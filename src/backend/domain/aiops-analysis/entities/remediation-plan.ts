export class RemediationPlan {
  constructor(
    public readonly summary: string,
    public readonly steps: string[],
    public readonly automationCandidate: boolean,
    public readonly estimatedMinutes: number,
  ) {}
}
