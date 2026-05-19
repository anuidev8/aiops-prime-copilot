export class ProjectService {
  constructor(
    public readonly projectId: string,
    public readonly serviceName: string,
    public readonly role: string | null = null,
  ) {}
}
