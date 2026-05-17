const SEVERITY_ORDER = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

export type SeverityLevel = keyof typeof SEVERITY_ORDER;

export class Severity {
  private constructor(private readonly level: SeverityLevel) {}

  static from(value: string): Severity {
    const normalized = value.trim().toLowerCase();

    if (normalized.includes("crit")) return new Severity("critical");
    if (normalized.includes("high") || normalized.includes("error")) {
      return new Severity("high");
    }
    if (normalized.includes("warn") || normalized.includes("medium")) {
      return new Severity("medium");
    }

    return new Severity("low");
  }

  static critical(): Severity {
    return new Severity("critical");
  }

  static high(): Severity {
    return new Severity("high");
  }

  static medium(): Severity {
    return new Severity("medium");
  }

  static low(): Severity {
    return new Severity("low");
  }

  value(): SeverityLevel {
    return this.level;
  }

  score(): number {
    return SEVERITY_ORDER[this.level];
  }

  isGreaterThan(other: Severity): boolean {
    return this.score() > other.score();
  }

  isAtLeast(other: Severity): boolean {
    return this.score() >= other.score();
  }
}
