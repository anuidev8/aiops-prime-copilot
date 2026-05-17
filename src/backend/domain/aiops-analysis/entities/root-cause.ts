export class RootCause {
  constructor(
    public readonly hypothesis: string,
    public readonly evidence: string[],
    public readonly confidence: number,
  ) {}
}
