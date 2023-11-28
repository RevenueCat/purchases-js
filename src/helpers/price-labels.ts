export const priceLabels: Record<string, string> = {
  P3M: "quarterly",
  P1M: "monthly",
  P1Y: "yearly",
  P2W: "2 weeks",
  P1D: "daily",
  PT1H: "hourly",
  P1W: "weekly",
};

const durationUnits: Record<string, string> = {
  Y: "year",
  M: "month",
  W: "week",
  D: "day",
  H: "hour",
};

export const formatPrice = (priceInCents: number, currency: string): string => {
  const price = priceInCents / 100;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  });

  return formatter.format(price);
};

export const formatDuration = (duration: string): string => {
  const durationRegex = /(P|P)(\d+)([A-Z])/;
  const matches = duration.match(durationRegex);
  if (!matches) {
    return duration;
  }

  const [, amount, unit] = matches;
  const label = durationUnits[unit];

  if (!label) {
    return duration;
  }

  return `${amount} ${label}`;
};

export const getRenewsLabel = (duration: string): string => {
  const unit = duration.slice(-1);
  if (unit === "D") {
    return "daily";
  }

  return `${durationUnits[unit]}ly`;
};
