import type {
  DiscountPricePhase,
  PricingPhase,
} from "../../entities/offerings";
import { PeriodUnit } from "../../helpers/duration-helper";
import { toPrice } from "../utils/fixtures-utils";

export const trialPhaseP1W: PricingPhase = {
  periodDuration: "P1W",
  period: { number: 1, unit: PeriodUnit.Week },
  cycleCount: 1,
  price: null,
  pricePerWeek: null,
  pricePerMonth: null,
  pricePerYear: null,
};

export const trialPhaseP2W: PricingPhase = {
  ...trialPhaseP1W,
  periodDuration: "P2W",
  period: { number: 2, unit: PeriodUnit.Week },
  cycleCount: 1,
};

export const discountPhaseOneTime: DiscountPricePhase = {
  timeWindow: null,
  periodDuration: "P1M",
  durationMode: "one_time",
  price: toPrice(10000000, "USD"),
  name: "One-time Discount 20%",
  period: { number: 1, unit: PeriodUnit.Month },
  cycleCount: 1,
};

export const discountPhaseOneTimeConsumable: DiscountPricePhase = {
  timeWindow: null,
  periodDuration: null,
  durationMode: "one_time",
  price: toPrice(11000000, "USD"),
  name: "Consumable 20% Discount",
  period: null,
  cycleCount: 0,
};

export const discountPhaseTimeWindow: DiscountPricePhase = {
  timeWindow: "P3M",
  periodDuration: "P3M",
  durationMode: "time_window",
  price: toPrice(12000000, "USD"),
  name: "Holiday Sale 20%",
  period: { number: 1, unit: PeriodUnit.Month },
  cycleCount: 3,
};

export const discountPhaseForever: DiscountPricePhase = {
  timeWindow: null,
  periodDuration: "P1M",
  durationMode: "forever",
  price: toPrice(13000000, "USD"),
  name: "Forever Discount 30%",
  period: { number: 1, unit: PeriodUnit.Month },
  cycleCount: 0,
};

export const pricePhaseP1M1499: PricingPhase = {
  periodDuration: "P1M",
  period: { number: 1, unit: PeriodUnit.Month },
  cycleCount: 1,
  price: toPrice(14990000, "USD"),
  pricePerWeek: toPrice(3747500, "USD"),
  pricePerMonth: toPrice(14990000, "USD"),
  pricePerYear: toPrice(179880000, "USD"),
};

export const introPhaseP1M199: PricingPhase = {
  periodDuration: "P1M",
  period: { number: 1, unit: PeriodUnit.Month },
  cycleCount: 3,
  price: toPrice(1990000, "USD"),
  pricePerWeek: toPrice(499500, "USD"),
  pricePerMonth: toPrice(1990000, "USD"),
  pricePerYear: toPrice(239880000, "USD"),
};
