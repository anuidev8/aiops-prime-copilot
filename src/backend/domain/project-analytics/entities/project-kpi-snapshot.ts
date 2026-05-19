export class ProjectKpiSnapshot {
  constructor(
    public readonly projectId: string,
    public readonly timestamp: Date,
    public readonly availability: number,
    public readonly incidentFrequency: number,
    public readonly mttr: number,
    public readonly errorBudgetBurn: number,
    public readonly coverage: number,
    public readonly healthScore: number,
  ) {}
}
