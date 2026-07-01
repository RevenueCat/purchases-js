import type { Period } from "@revenuecat/purchases-js";

export const pluralizePeriod = (count: number, unit: string) =>
  `${count} ${unit}${count > 1 ? "s" : ""}`;

export const getLongPeriodLabel = (period: Period | null) =>
  period ? pluralizePeriod(period.number, period.unit) : "";
