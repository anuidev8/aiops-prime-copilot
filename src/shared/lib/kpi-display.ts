export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function kpiScaleValue(kpi: { unit: string; value: number }): number {
  if (kpi.unit.includes("%") || kpi.unit.includes("/100")) {
    return clamp(kpi.value, 0, 100);
  }

  if (kpi.unit === "incidents") {
    return clamp(kpi.value * 10, 0, 100);
  }

  return clamp(kpi.value, 0, 100);
}
