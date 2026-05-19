export class Project {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name: string,
    public readonly status: string,
    public readonly startDate: Date | null = null,
  ) {}
}
