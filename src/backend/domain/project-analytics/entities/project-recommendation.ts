export type ProjectRecommendationLevel = "immediate" | "short-term" | "strategic";

export class ProjectRecommendation {
  constructor(
    public readonly projectId: string,
    public readonly timestamp: Date,
    public readonly level: ProjectRecommendationLevel,
    public readonly recommendation: string,
    public readonly confidence: number,
  ) {}
}
