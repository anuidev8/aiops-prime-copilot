export class TimeWindow {
  constructor(
    public readonly from: Date,
    public readonly to: Date,
  ) {
    if (from.getTime() > to.getTime()) {
      throw new Error("TimeWindow start must be before end.");
    }
  }

  static lastMinutes(minutes: number, now: Date = new Date()): TimeWindow {
    const to = now;
    const from = new Date(now.getTime() - minutes * 60_000);
    return new TimeWindow(from, to);
  }

  includes(date: Date): boolean {
    const timestamp = date.getTime();
    return timestamp >= this.from.getTime() && timestamp <= this.to.getTime();
  }

  durationMinutes(): number {
    return Math.max((this.to.getTime() - this.from.getTime()) / 60_000, 1);
  }
}
