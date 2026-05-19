export class Company {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly industry: string | null = null,
    public readonly owner: string | null = null,
  ) {}
}
