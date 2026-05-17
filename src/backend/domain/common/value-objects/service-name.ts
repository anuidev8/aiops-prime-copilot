export class ServiceName {
  private constructor(private readonly rawValue: string) {}

  static from(value: string): ServiceName {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      throw new Error("Service name cannot be empty.");
    }

    return new ServiceName(normalized);
  }

  value(): string {
    return this.rawValue;
  }

  equals(other: ServiceName): boolean {
    return this.rawValue === other.rawValue;
  }
}
